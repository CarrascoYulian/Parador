# Parador Familiar Las Américas — sitio web

Sitio del parador (km 23, Autopista Las Américas) con panel privado para editar menú, precios, fotos, horarios y textos.

## Uso

```bash
npm install
npm run dev          # http://localhost:5180  (panel: /admin)
```

Producción:

```bash
npm run build
npm start            # requiere SESSION_SECRET en .env
```

### Administrador

```bash
npm run admin:setup -- --email dueño@correo.com --password "una-contraseña-larga"
```

Guarda el hash bcrypt en `server/data/admin.json` y crea `SESSION_SECRET` en `.env` si no existe.
Para pruebas locales hay una cuenta de prueba en `server/data/CREDENCIALES-PRUEBA.txt`; reemplázala antes de publicar.

## Despliegue en Vercel

El proyecto está conectado a GitHub: cada push a `main` publica una nueva versión.

- `api/index.js` es la función que sirve la API, `/`, `/admin` y el sitemap; la CDN sirve `dist/`.
- En Vercel el disco es de solo lectura: el contenido y las fotos del panel se guardan en **Vercel Blob**
  (se conservan las últimas 10 versiones del contenido como historial).

Variables de entorno necesarias en Vercel:

| Variable | Para qué |
| --- | --- |
| `SESSION_SECRET` | Firma de la sesión del panel (texto largo aleatorio) |
| `ADMIN_EMAIL` | Email con el que se entra al panel |
| `ADMIN_PASSWORD_HASH` | Hash de la contraseña: `npm run admin:hash -- "tu-contraseña"` |
| `BLOB_READ_WRITE_TOKEN` | Lo crea Vercel al conectar el Blob store al proyecto |
| `SITE_URL` | URL pública (canonical, sitemap, Open Graph) |

## Estructura

| Carpeta | Contenido |
| --- | --- |
| `src/sections` | Secciones de la portada (Hero, Lugar, Cocina, Menú, Terraza, Mini market, Galería, Visítanos, Cierre) |
| `src/components` | Cabecera, barra móvil, lightbox, revelado al hacer scroll, iconos |
| `src/lib` | Tipos, horarios (zona America/Santo_Domingo), enlaces de WhatsApp/Maps |
| `src/admin` | Panel de administración (se carga aparte, solo en `/admin`) |
| `server` | API Express: contenido, autenticación, subida de imágenes, SEO |
| `server/seed/content.json` | Contenido inicial (se copia a `server/data/content.json` la primera vez) |
| `assets-src/instagram` | Fotos originales tomadas del Instagram del parador (`npm run images` las optimiza) |

## Seguridad

- Sesión en cookie `httpOnly` + `SameSite=Strict` firmada (8 h); contraseñas con bcrypt.
- Todas las escrituras exigen sesión y cabecera anti-CSRF; los datos se validan con zod en el servidor.
- Bloqueo tras 5 intentos de login fallidos (15 min).
- Las imágenes subidas se re-codifican a WebP (valida el archivo y elimina metadatos).
- CSP estricta en producción.

## Pruebas

```bash
npm test             # API: auth, CSRF, validación, subida, horario
npm run typecheck
```
