import { z } from 'zod';

const text = (max) => z.string().trim().max(max);
const optionalUrl = z
  .string()
  .trim()
  .max(500)
  .refine((v) => v === '' || /^https:\/\/[^\s<>"']+$/.test(v), 'Debe ser una URL https:// válida o quedar vacía');
// Solo imágenes del propio sitio o subidas desde el panel (Vercel Blob).
const imagePath = z
  .string()
  .trim()
  .max(200)
  .refine(
    (v) =>
      v === '' ||
      /^\/(images|uploads)\/[\w.-]+\.(webp|jpe?g|png)$/i.test(v) ||
      /^https:\/\/[a-z0-9]+\.public\.blob\.vercel-storage\.com\/uploads\/[\w.-]+\.webp$/i.test(v),
    'Ruta de imagen no válida',
  );
const slug = z.string().trim().min(1).max(60).regex(/^[a-z0-9-]+$/, 'Solo minúsculas, números y guiones');
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Formato HH:MM');

export const siteSchema = z.object({
  name: text(120).min(1),
  slogan: text(160),
  address: text(240).min(1),
  addressShort: text(120).min(1),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  // Solo dígitos con código de país (ej. 18095551234). Vacío = WhatsApp desactivado.
  whatsapp: z.string().trim().regex(/^(\d{10,15})?$/, 'Solo dígitos, con código de país (ej. 1809XXXXXXX)'),
  phone: z.string().trim().regex(/^(\+?[\d\s()-]{7,20})?$/, 'Teléfono no válido'),
  instagram: optionalUrl,
  pedidosya: optionalUrl,
  threads: optionalUrl,
  rating: z.object({
    value: z.number().min(0).max(5),
    count: z.number().int().min(0).max(1_000_000),
    source: text(60),
    show: z.boolean(),
  }),
  priceRange: text(80),
  notice: text(240),
});

export const hoursSchema = z
  .array(
    z.object({
      day: z.number().int().min(1).max(7),
      open: time,
      close: time,
      closed: z.boolean(),
    }),
  )
  .length(7)
  .refine((days) => new Set(days.map((d) => d.day)).size === 7, 'Debe haber un registro por día');

export const copySchema = z.object({
  heroEyebrow: text(80),
  heroTitle: text(90).min(1),
  heroText: text(320),
  placeTitle: text(90),
  placeText: text(500),
  kitchenTitle: text(90),
  kitchenText: text(400),
  terraceTitle: text(90),
  terraceText: text(400),
  marketTitle: text(90),
  marketText: text(300),
  closingTitle: text(90),
});

export const menuSchema = z
  .object({
    categories: z
      .array(z.object({ id: slug, name: text(60).min(1), description: text(200) }))
      .max(30),
    items: z
      .array(
        z.object({
          id: slug,
          name: text(80).min(1),
          description: text(280),
          category: slug,
          price: z.number().min(0).max(1_000_000).nullable(),
          image: imagePath,
          featured: z.boolean(),
          active: z.boolean(),
          source: text(200),
        }),
      )
      .max(300),
  })
  .superRefine((menu, ctx) => {
    const cats = new Set(menu.categories.map((c) => c.id));
    if (cats.size !== menu.categories.length) ctx.addIssue({ code: 'custom', message: 'Categorías duplicadas' });
    const ids = new Set();
    for (const item of menu.items) {
      if (!cats.has(item.category)) ctx.addIssue({ code: 'custom', message: `"${item.name}" usa una categoría que no existe` });
      if (ids.has(item.id)) ctx.addIssue({ code: 'custom', message: `ID duplicado: ${item.id}` });
      ids.add(item.id);
    }
  });

export const gallerySchema = z
  .array(
    z.object({
      id: slug,
      src: imagePath.refine((v) => v !== '', 'Falta la imagen'),
      alt: text(200).min(3, 'El texto alternativo es obligatorio'),
      caption: text(120),
      tag: z.enum(['lugar', 'cocina', 'market']),
    }),
  )
  .max(80);

export const testimonialsSchema = z
  .array(z.object({ text: text(240).min(1), source: text(80) }))
  .max(12);

export const faqSchema = z.array(z.object({ q: text(160).min(1), a: text(600).min(1) })).max(20);

export const sections = {
  site: siteSchema,
  hours: hoursSchema,
  copy: copySchema,
  menu: menuSchema,
  gallery: gallerySchema,
  testimonials: testimonialsSchema,
  faq: faqSchema,
};

export const contentSchema = z.object(sections);
