import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const COOKIE = 'parador_admin';
const SESSION_HOURS = 8;
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

/**
 * Autenticación del panel: una cuenta de administrador definida con
 * `npm run admin:setup` (hash bcrypt en server/data/admin.json) y una sesión
 * firmada en cookie httpOnly + SameSite=Strict.
 */
export function createAuth({ adminFile, secret, secure }) {
  const attempts = new Map();
  // Hash ficticio para que el tiempo de respuesta no revele si el email existe.
  const dummyHash = bcrypt.hashSync(crypto.randomBytes(16).toString('hex'), 10);

  async function readAdmin() {
    // En Vercel la cuenta se define con variables de entorno (no hay disco persistente).
    if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD_HASH) {
      return { email: process.env.ADMIN_EMAIL, passwordHash: process.env.ADMIN_PASSWORD_HASH };
    }
    try {
      const admin = JSON.parse(await fs.readFile(adminFile, 'utf8'));
      if (typeof admin.email === 'string' && typeof admin.passwordHash === 'string') return admin;
    } catch {}
    return null;
  }

  function limited(ip) {
    const now = Date.now();
    const entry = attempts.get(ip);
    if (!entry || now - entry.first > WINDOW_MS) return false;
    return entry.count >= MAX_ATTEMPTS;
  }

  function fail(ip) {
    const now = Date.now();
    const entry = attempts.get(ip);
    if (!entry || now - entry.first > WINDOW_MS) attempts.set(ip, { first: now, count: 1 });
    else entry.count += 1;
  }

  async function login(req, res) {
    const ip = req.ip ?? 'unknown';
    if (limited(ip)) return res.status(429).json({ error: 'Demasiados intentos. Espera unos minutos.' });

    const { email, password } = req.body ?? {};
    if (typeof email !== 'string' || typeof password !== 'string' || password.length > 200) {
      return res.status(400).json({ error: 'Datos incompletos' });
    }
    const admin = await readAdmin();
    if (!admin) return res.status(503).json({ error: 'El panel aún no tiene administrador. Ejecuta npm run admin:setup.' });

    const emailOk = email.trim().toLowerCase() === admin.email.toLowerCase();
    const passOk = await bcrypt.compare(password, emailOk ? admin.passwordHash : dummyHash);
    if (!emailOk || !passOk) {
      fail(ip);
      return res.status(401).json({ error: 'Email o contraseña incorrectos' });
    }
    attempts.delete(ip);
    const token = jwt.sign({ sub: admin.email, role: 'admin' }, secret, { expiresIn: `${SESSION_HOURS}h` });
    res.cookie(COOKIE, token, {
      httpOnly: true,
      sameSite: 'strict',
      secure,
      path: '/',
      maxAge: SESSION_HOURS * 3600 * 1000,
    });
    res.json({ email: admin.email });
  }

  function logout(_req, res) {
    res.clearCookie(COOKIE, { path: '/', sameSite: 'strict', secure, httpOnly: true });
    res.json({ ok: true });
  }

  function verify(req) {
    const token = req.cookies?.[COOKIE];
    if (!token) return null;
    try {
      const payload = jwt.verify(token, secret, { algorithms: ['HS256'] });
      return payload.role === 'admin' ? payload : null;
    } catch {
      return null;
    }
  }

  /** Protege rutas: sesión válida + cabecera anti-CSRF en escrituras. */
  function requireAdmin(req, res, next) {
    const user = verify(req);
    if (!user) return res.status(401).json({ error: 'Sesión no válida' });
    if (req.method !== 'GET' && req.get('X-Requested-With') !== 'parador-admin') {
      return res.status(403).json({ error: 'Solicitud rechazada' });
    }
    req.user = user;
    next();
  }

  return { login, logout, verify, requireAdmin };
}
