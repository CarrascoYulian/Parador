import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import multer from 'multer';
import sharp from 'sharp';
import { createStore, toPublic } from './store.mjs';
import { createAuth } from './auth.mjs';
import { sections } from './schema.mjs';
import { renderHead, serializeContent } from './seo.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export async function createApp({
  dev = process.env.NODE_ENV !== 'production',
  dataDir = path.join(root, 'server/data'),
  uploadsDir = path.join(root, 'server/uploads'),
  secret = process.env.SESSION_SECRET,
  blobToken = process.env.BLOB_READ_WRITE_TOKEN,
  withFrontend = true,
} = {}) {
  if (!secret) {
    if (!dev) throw new Error('SESSION_SECRET es obligatorio en producción (ver .env.example).');
    secret = crypto.randomBytes(32).toString('hex');
    console.warn('[parador] SESSION_SECRET no definido: usando uno temporal (las sesiones se cerrarán al reiniciar).');
  }

  const store = createStore({ dataDir, uploadsDir, blobToken, seedFile: path.join(root, 'server/seed/content.json') });
  const auth = createAuth({ adminFile: path.join(dataDir, 'admin.json'), secret, secure: !dev });
  await store.load();

  const app = express();
  app.disable('x-powered-by');
  // En Vercel la IP real llega en X-Forwarded-For (necesaria para el límite de intentos de login).
  app.set('trust proxy', process.env.VERCEL ? true : 'loopback');
  app.use(
    helmet({
      contentSecurityPolicy: dev
        ? false
        : {
            directives: {
              defaultSrc: ["'self'"],
              imgSrc: ["'self'", 'data:', 'https://*.public.blob.vercel-storage.com'],
              styleSrc: ["'self'", "'unsafe-inline'"],
              fontSrc: ["'self'"],
              frameSrc: ['https://www.google.com'],
              scriptSrc: ["'self'"],
              connectSrc: ["'self'"],
              objectSrc: ["'none'"],
              baseUri: ["'self'"],
              formAction: ["'self'"],
              // El proxy/hosting con HTTPS se encarga de redirigir; aquí rompería las pruebas en http://localhost.
              upgradeInsecureRequests: null,
            },
          },
      crossOriginEmbedderPolicy: false,
    }),
  );
  app.use(express.json({ limit: '300kb' }));
  app.use(cookieParser());

  // ---------- API pública ----------
  app.get('/api/content', async (_req, res) => {
    res.set('Cache-Control', 'no-cache');
    res.json(toPublic(await store.load()));
  });

  // ---------- Autenticación ----------
  app.post('/api/auth/login', auth.login);
  app.post('/api/auth/logout', auth.logout);
  app.get('/api/auth/me', (req, res) => {
    const user = auth.verify(req);
    if (!user) return res.status(401).json({ error: 'Sin sesión' });
    res.json({ email: user.sub });
  });

  // ---------- API de administración (protegida) ----------
  const admin = express.Router();
  admin.use(auth.requireAdmin);
  admin.use((_req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });

  admin.get('/content', async (_req, res) => res.json(await store.load()));

  admin.put('/content/:section', async (req, res) => {
    const schema = sections[req.params.section];
    if (!schema) return res.status(404).json({ error: 'Sección desconocida' });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return res.status(400).json({ error: issue.message, path: issue.path });
    }
    const next = await store.update(req.params.section, parsed.data);
    res.json(next[req.params.section]);
  });

  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 8 * 1024 * 1024, files: 1 },
    fileFilter: (_req, file, cb) => cb(null, /^image\/(jpeg|png|webp)$/.test(file.mimetype)),
  });
  admin.post('/upload', upload.single('image'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'Sube una imagen JPG, PNG o WebP (máx. 8 MB)' });
    let image;
    try {
      // Re-codificar valida que sea una imagen real y elimina metadatos (GPS, etc.).
      image = await sharp(req.file.buffer)
        .rotate()
        .resize({ width: 1800, height: 1800, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer({ resolveWithObject: true });
    } catch {
      return res.status(400).json({ error: 'El archivo no es una imagen válida' });
    }
    const src = await store.saveImage(image.data);
    res.status(201).json({ src, width: image.info.width, height: image.info.height });
  });
  app.use('/api/admin', admin);
  app.use('/api', (_req, res) => res.status(404).json({ error: 'No encontrado' }));
  app.use((err, _req, res, next) => {
    if (!err) return next();
    if (err instanceof multer.MulterError) return res.status(400).json({ error: 'Archivo demasiado grande' });
    if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'JSON no válido' });
    if (err.type === 'entity.too.large') return res.status(413).json({ error: 'Contenido demasiado grande' });
    console.error(err);
    res.status(500).json({ error: 'Error interno' });
  });

  app.use('/uploads', express.static(uploadsDir, { maxAge: '30d', immutable: true }));

  // ---------- SEO ----------
  app.get('/sitemap.xml', (req, res) => {
    const base = (process.env.SITE_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
    res.type('application/xml').send(
      `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${base}/</loc><changefreq>weekly</changefreq></url></urlset>`,
    );
  });

  if (!withFrontend) return app;

  // ---------- Frontend (Vite en desarrollo, dist/ en producción) ----------
  let getTemplate;
  if (dev) {
    const { createServer } = await import('vite');
    const vite = await createServer({ root, server: { middlewareMode: true }, appType: 'custom' });
    app.use(vite.middlewares);
    getTemplate = async (url) => vite.transformIndexHtml(url, await fs.readFile(path.join(root, 'index.html'), 'utf8'));
  } else {
    const dist = path.join(root, 'dist');
    app.use('/assets', express.static(path.join(dist, 'assets'), { maxAge: '1y', immutable: true }));
    app.use(express.static(dist, { index: false, maxAge: '7d' }));
    // El build renombra index.html a app.html para que "/" pase siempre por el servidor
    // (inyecta contenido y datos estructurados) también en Vercel.
    const template = await fs.readFile(path.join(dist, 'app.html'), 'utf8');
    getTemplate = async () => template;
  }

  app.get('*', async (req, res, next) => {
    try {
      const content = await store.load();
      const html = (await getTemplate(req.originalUrl))
        .replace('<!--app-head-->', renderHead(content, req))
        .replace('<!--app-data-->', serializeContent(toPublic(content)));
      if (req.path.startsWith('/admin')) res.set('X-Robots-Tag', 'noindex, nofollow');
      res.status(req.path === '/' || req.path.startsWith('/admin') ? 200 : 404).type('html').send(html);
    } catch (err) {
      next(err);
    }
  });

  return app;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = Number(process.env.PORT) || 5180;
  const app = await createApp();
  app.listen(port, () => console.log(`[parador] listo en http://localhost:${port}`));
}
