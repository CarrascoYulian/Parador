// Renombra dist/index.html → dist/app.html: así "/" no lo sirve la CDN como archivo
// estático sino el servidor, que incrusta el contenido editable y los datos estructurados.
import fs from 'node:fs/promises';
import path from 'node:path';

const dist = path.resolve(import.meta.dirname, '../dist');
await fs.rename(path.join(dist, 'index.html'), path.join(dist, 'app.html'));
console.log('dist/app.html listo');
