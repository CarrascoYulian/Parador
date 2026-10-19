// Función de Vercel: sirve la API, el HTML de "/" y "/admin" (con el contenido
// incrustado) y el sitemap. Los archivos estáticos (dist/) los sirve la CDN.
import { createApp } from '../server/index.mjs';

const app = await createApp({ dev: false });

export default app;
