// Genera el hash bcrypt de una contraseña para la variable ADMIN_PASSWORD_HASH en Vercel.
// Uso: npm run admin:hash -- "una-contraseña-larga"
import bcrypt from 'bcryptjs';

const password = process.argv[2];
if (!password || password.length < 10) {
  console.error('Uso: npm run admin:hash -- "contraseña de al menos 10 caracteres"');
  process.exit(1);
}
console.log(await bcrypt.hash(password, 12));
