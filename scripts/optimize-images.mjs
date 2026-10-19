// Convierte las fotos originales de assets-src/ a WebP optimizado en public/images/.
// Uso: npm run images
import path from 'node:path';
import fs from 'node:fs/promises';
import sharp from 'sharp';

const root = path.resolve(import.meta.dirname, '..');
const src = path.join(root, 'assets-src/instagram');
const out = path.join(root, 'public/images');

// Origen (publicación de Instagram) → nombre según su función en la web.
const map = {
  'p01-DCPbVOBPeYl.jpg': 'club-sandwich',
  'p02-C1KZoPdrjfs.jpg': 'camarones',
  'p03-C9fST_ROler.jpg': 'fachada',
  'p04-DM3Bho3OJqY.jpg': 'pollo-caja-china',
  'p05-DLOTYjxv_Ad.jpg': 'salon',
  'p06-DIttykHuUPG.jpg': 'para-llevar',
  'p07-DIaLfx7uPR6.jpg': 'terraza',
  'p08-DIaKcbqPgC2.jpg': 'pinchos-pollo',
  'p09-DB_VaT7OBLO.jpg': 'mini-market',
  'p10-DBy8CjgPNlL.jpg': 'parrillada',
  'p11-DBtz8cdvdER.jpg': 'pechuga',
  'p12-DBi6ZBvOlL7.jpg': 'sandwich',
};

await fs.mkdir(out, { recursive: true });
for (const [file, name] of Object.entries(map)) {
  const input = path.join(src, file);
  const info = await sharp(input).webp({ quality: 84 }).toFile(path.join(out, `${name}.webp`));
  console.log(`${name}.webp  ${info.width}x${info.height}  ${(info.size / 1024).toFixed(0)} KB`);
}

// Imagen para compartir en redes (Open Graph 1200x630) a partir de la fachada.
await sharp(path.join(src, 'p03-C9fST_ROler.jpg'))
  .resize(1200, 630, { fit: 'cover', position: 'centre', kernel: 'lanczos3' })
  .jpeg({ quality: 82, mozjpeg: true })
  .toFile(path.join(out, 'og.jpg'));

// Logotipo (foto de perfil de Instagram).
const logo = path.join(src, 'logo.jpg');
await sharp(logo).resize(160, 160).webp({ quality: 90 }).toFile(path.join(out, 'logo.webp'));
await sharp(logo).resize(180, 180).png().toFile(path.join(out, 'logo-180.png'));
console.log('og.jpg, logo.webp, logo-180.png');
