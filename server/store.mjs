import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { contentSchema } from './schema.mjs';

/**
 * Almacén de contenido. Dos motores con la misma interfaz:
 *  - archivo JSON local (desarrollo / servidor propio): escritura atómica + copia previa.
 *  - Vercel Blob (producción en Vercel, sistema de archivos de solo lectura): cada
 *    versión es un archivo inmutable con sufijo aleatorio; se lee la más reciente y
 *    se conservan las últimas versiones como historial.
 */
export function createStore({ dataDir, uploadsDir, seedFile, blobToken }) {
  const backend = blobToken ? blobBackend(blobToken) : fileBackend(dataDir, uploadsDir);
  let cache = null;
  let cachedAt = 0;
  let queue = Promise.resolve();

  async function load() {
    if (cache && Date.now() - cachedAt < backend.ttl) return cache;
    const raw = (await backend.read()) ?? (await fs.readFile(seedFile, 'utf8'));
    cache = contentSchema.parse(JSON.parse(raw));
    cachedAt = Date.now();
    return cache;
  }

  /** Reemplaza una sección ya validada. Las escrituras se serializan. */
  function update(section, value) {
    const run = async () => {
      cachedAt = 0; // leer siempre la última versión antes de escribir
      const next = { ...(await load()), [section]: value };
      await backend.write(JSON.stringify(next, null, 2));
      cache = next;
      cachedAt = Date.now();
      return next;
    };
    queue = queue.then(run, run);
    return queue;
  }

  return { load, update, saveImage: backend.saveImage, kind: backend.kind };
}

function fileBackend(dataDir, uploadsDir) {
  const file = path.join(dataDir, 'content.json');
  return {
    kind: 'file',
    ttl: Infinity,
    async read() {
      try {
        return await fs.readFile(file, 'utf8');
      } catch (err) {
        if (err.code === 'ENOENT') return null;
        throw err;
      }
    },
    async write(json) {
      await fs.mkdir(dataDir, { recursive: true });
      const tmp = `${file}.${process.pid}.tmp`;
      await fs.writeFile(tmp, json);
      await fs.copyFile(file, path.join(dataDir, 'content.prev.json')).catch(() => {});
      await fs.rename(tmp, file);
    },
    async saveImage(buffer) {
      await fs.mkdir(uploadsDir, { recursive: true });
      const name = `${crypto.randomUUID()}.webp`;
      await fs.writeFile(path.join(uploadsDir, name), buffer);
      return `/uploads/${name}`;
    },
  };
}

function blobBackend(token) {
  const KEEP = 10;
  const blob = () => import('@vercel/blob');
  return {
    kind: 'blob',
    // Varias instancias pueden estar activas: releer la versión más reciente cada pocos segundos.
    ttl: 5_000,
    async read() {
      const { list } = await blob();
      const { blobs } = await list({ prefix: 'content/', token, limit: 100 });
      if (!blobs.length) return null;
      blobs.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
      const res = await fetch(blobs[0].url, { cache: 'no-store' });
      if (!res.ok) throw new Error(`No se pudo leer el contenido (${res.status})`);
      return res.text();
    },
    async write(json) {
      const { put, list, del } = await blob();
      await put('content/content.json', json, {
        access: 'public',
        addRandomSuffix: true,
        contentType: 'application/json',
        cacheControlMaxAge: 31536000,
        token,
      });
      const { blobs } = await list({ prefix: 'content/', token, limit: 100 });
      blobs.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
      const old = blobs.slice(KEEP).map((b) => b.url);
      if (old.length) await del(old, { token });
    },
    async saveImage(buffer) {
      const { put } = await blob();
      const { url } = await put(`uploads/${crypto.randomUUID()}.webp`, buffer, {
        access: 'public',
        addRandomSuffix: false,
        contentType: 'image/webp',
        cacheControlMaxAge: 31536000,
        token,
      });
      return url;
    },
  };
}

/** Versión pública: sin platos inactivos ni notas internas. */
export function toPublic(content) {
  return {
    ...content,
    menu: {
      categories: content.menu.categories,
      items: content.menu.items
        .filter((i) => i.active)
        .map(({ source: _source, active: _active, ...item }) => item),
    },
  };
}
