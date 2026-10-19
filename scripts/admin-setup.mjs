// Crea o reemplaza la cuenta de administrador del panel.
// Uso: npm run admin:setup -- --email dueño@correo.com --password "una-contraseña-larga"
// Sin --password, se genera una contraseña aleatoria y se muestra una sola vez.
import path from 'node:path';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';

const root = path.resolve(import.meta.dirname, '..');
const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, cur, i, all) => (cur.startsWith('--') ? [...acc, [cur.slice(2), all[i + 1]]] : acc), []),
);

const email = (args.email || '').trim().toLowerCase();
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error('Indica un email válido: npm run admin:setup -- --email tu@correo.com [--password ...]');
  process.exit(1);
}
let password = args.password;
const generated = !password;
if (generated) password = crypto.randomBytes(12).toString('base64url');
if (password.length < 10) {
  console.error('La contraseña debe tener al menos 10 caracteres.');
  process.exit(1);
}

const dataDir = path.join(root, 'server/data');
await fs.mkdir(dataDir, { recursive: true });
await fs.writeFile(
  path.join(dataDir, 'admin.json'),
  JSON.stringify({ email, passwordHash: await bcrypt.hash(password, 12), updatedAt: new Date().toISOString() }, null, 2),
);

// Crea .env con un SESSION_SECRET si aún no existe.
const envFile = path.join(root, '.env');
let env = '';
try {
  env = await fs.readFile(envFile, 'utf8');
} catch {}
if (!/^SESSION_SECRET=.+/m.test(env)) {
  env = env.replace(/^SESSION_SECRET=.*\n?/m, '');
  env += `${env && !env.endsWith('\n') ? '\n' : ''}SESSION_SECRET=${crypto.randomBytes(48).toString('hex')}\n`;
  await fs.writeFile(envFile, env);
  console.log('Se creó SESSION_SECRET en .env');
}

console.log(`Administrador configurado: ${email}`);
if (generated) console.log(`Contraseña generada (guárdala ahora, no se volverá a mostrar): ${password}`);
