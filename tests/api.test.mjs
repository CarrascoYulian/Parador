import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import { createApp } from '../server/index.mjs';
import { openStatus } from '../src/lib/hours.ts';

const EMAIL = 'prueba@parador.test';
const PASSWORD = 'clave-de-prueba-123';
let server;
let base;
let dir;

before(async () => {
  dir = await fs.mkdtemp(path.join(os.tmpdir(), 'parador-'));
  const dataDir = path.join(dir, 'data');
  await fs.mkdir(dataDir);
  await fs.writeFile(path.join(dataDir, 'admin.json'), JSON.stringify({ email: EMAIL, passwordHash: await bcrypt.hash(PASSWORD, 4) }));
  const app = await createApp({ dev: true, dataDir, uploadsDir: path.join(dir, 'uploads'), secret: 'test-secret', withFrontend: false });
  await new Promise((r) => (server = app.listen(0, r)));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  server?.close();
  await fs.rm(dir, { recursive: true, force: true });
});

const json = (body, headers = {}) => ({
  headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'parador-admin', ...headers },
  body: JSON.stringify(body),
});

async function login() {
  const res = await fetch(`${base}/api/auth/login`, { method: 'POST', ...json({ email: EMAIL, password: PASSWORD }) });
  assert.equal(res.status, 200);
  const cookie = res.headers.get('set-cookie');
  assert.match(cookie, /HttpOnly/i);
  assert.match(cookie, /SameSite=Strict/i);
  return cookie.split(';')[0];
}

test('el contenido público no expone notas internas ni platos inactivos', async () => {
  const res = await fetch(`${base}/api/content`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.ok(data.menu.items.length > 0);
  for (const item of data.menu.items) {
    assert.equal(item.source, undefined);
    assert.equal(item.active, undefined);
  }
});

test('las escrituras sin sesión se rechazan', async () => {
  const res = await fetch(`${base}/api/admin/content/site`, { method: 'PUT', ...json({ name: 'Hackeado' }) });
  assert.equal(res.status, 401);
  const up = await fetch(`${base}/api/admin/upload`, { method: 'POST' });
  assert.equal(up.status, 401);
  const read = await fetch(`${base}/api/admin/content`);
  assert.equal(read.status, 401);
});

test('una cookie falsificada no da acceso', async () => {
  const res = await fetch(`${base}/api/admin/content`, { headers: { Cookie: 'parador_admin=eyJhbGciOiJub25lIn0.eyJyb2xlIjoiYWRtaW4ifQ.' } });
  assert.equal(res.status, 401);
});

test('credenciales incorrectas → 401', async () => {
  const res = await fetch(`${base}/api/auth/login`, { method: 'POST', ...json({ email: EMAIL, password: 'mala' }) });
  assert.equal(res.status, 401);
});

test('con sesión: exige cabecera anti-CSRF, valida datos y publica cambios', async () => {
  const cookie = await login();
  const current = await (await fetch(`${base}/api/admin/content`, { headers: { Cookie: cookie } })).json();

  // Sin cabecera X-Requested-With
  const noCsrf = await fetch(`${base}/api/admin/content/site`, {
    method: 'PUT',
    headers: { Cookie: cookie, 'Content-Type': 'application/json' },
    body: JSON.stringify(current.site),
  });
  assert.equal(noCsrf.status, 403);

  // Datos inválidos: WhatsApp con letras
  const bad = await fetch(`${base}/api/admin/content/site`, { method: 'PUT', ...json({ ...current.site, whatsapp: 'abc' }, { Cookie: cookie }) });
  assert.equal(bad.status, 400);

  // Imagen con ruta externa no permitida
  const badImg = structuredClone(current.menu);
  badImg.items[0].image = 'https://evil.example/x.png';
  const r2 = await fetch(`${base}/api/admin/content/menu`, { method: 'PUT', ...json(badImg, { Cookie: cookie }) });
  assert.equal(r2.status, 400);

  // Cambio válido: precio y plato inactivo
  const menu = structuredClone(current.menu);
  menu.items[0].price = 450;
  menu.items[1].active = false;
  const ok = await fetch(`${base}/api/admin/content/menu`, { method: 'PUT', ...json(menu, { Cookie: cookie }) });
  assert.equal(ok.status, 200);

  const pub = await (await fetch(`${base}/api/content`)).json();
  assert.equal(pub.menu.items.find((i) => i.id === menu.items[0].id).price, 450);
  assert.equal(pub.menu.items.find((i) => i.id === menu.items[1].id), undefined);

  // Sección inexistente
  const unknown = await fetch(`${base}/api/admin/content/secrets`, { method: 'PUT', ...json({}, { Cookie: cookie }) });
  assert.equal(unknown.status, 404);
});

test('la subida rechaza archivos que no son imágenes', async () => {
  const cookie = await login();
  const body = new FormData();
  body.append('image', new Blob(['<script>alert(1)</script>'], { type: 'image/png' }), 'x.png');
  const res = await fetch(`${base}/api/admin/upload`, { method: 'POST', headers: { Cookie: cookie, 'X-Requested-With': 'parador-admin' }, body });
  assert.equal(res.status, 400);
});

test('el login se bloquea tras varios intentos fallidos', async () => {
  let last;
  for (let i = 0; i < 7; i++) {
    last = await fetch(`${base}/api/auth/login`, { method: 'POST', ...json({ email: 'x@x.com', password: 'nope' }) });
  }
  assert.equal(last.status, 429);
});

test('estado de apertura en hora de República Dominicana', () => {
  const hours = [1, 2, 3, 4, 5, 6, 7].map((day) => ({ day, open: '08:00', close: '19:00', closed: day === 7 }));
  // Lunes 19/10/2026 12:00 en RD = 16:00 UTC
  assert.equal(openStatus(hours, new Date('2026-10-19T16:00:00Z')).open, true);
  // Lunes 20:00 en RD
  const late = openStatus(hours, new Date('2026-10-20T00:00:00Z'));
  assert.equal(late.open, false);
  assert.match(late.label, /mañana/);
  // Domingo cerrado
  const sunday = openStatus(hours, new Date('2026-10-25T16:00:00Z'));
  assert.equal(sunday.open, false);
});
