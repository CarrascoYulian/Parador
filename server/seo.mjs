const DAY_NAMES = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const escapeAttr = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
// JSON seguro para incrustar en <script>: evita cerrar la etiqueta.
const LINE_SEPARATORS = new RegExp('[\\u2028\\u2029]', 'g');
const safeJson = (data) =>
  JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(LINE_SEPARATORS, (c) => `\\u${c.charCodeAt(0).toString(16)}`);

/** Datos estructurados solo con información verificada y presente en el contenido. */
export function structuredData(content, baseUrl) {
  const { site, hours } = content;
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    name: site.name,
    slogan: site.slogan || undefined,
    servesCuisine: ['Dominicana', 'Parrilla'],
    address: {
      '@type': 'PostalAddress',
      streetAddress: site.addressShort,
      addressLocality: 'Santo Domingo Este',
      addressCountry: 'DO',
    },
    geo: { '@type': 'GeoCoordinates', latitude: site.lat, longitude: site.lng },
    hasMap: `https://www.google.com/maps/search/?api=1&query=${site.lat},${site.lng}`,
    openingHoursSpecification: hours
      .filter((h) => !h.closed)
      .map((h) => ({ '@type': 'OpeningHoursSpecification', dayOfWeek: DAY_NAMES[h.day], opens: h.open, closes: h.close })),
    sameAs: [site.instagram, site.threads].filter(Boolean),
  };
  if (site.phone) data.telephone = site.phone;
  if (baseUrl) {
    data.url = `${baseUrl}/`;
    data.image = `${baseUrl}/images/og.jpg`;
  }
  return data;
}

export function renderHead(content, req) {
  const base = (process.env.SITE_URL || '').replace(/\/$/, '');
  const tags = [];
  if (base) {
    tags.push(`<link rel="canonical" href="${escapeAttr(base + req.path)}" />`);
    tags.push(`<meta property="og:url" content="${escapeAttr(base + req.path)}" />`);
    tags.push(`<meta property="og:image" content="${escapeAttr(base)}/images/og.jpg" />`);
  } else {
    tags.push('<meta property="og:image" content="/images/og.jpg" />');
  }
  if (req.path.startsWith('/admin')) tags.push('<meta name="robots" content="noindex, nofollow" />');
  else tags.push(`<script type="application/ld+json">${safeJson(structuredData(content, base))}</script>`);
  return tags.join('\n    ');
}

export function serializeContent(content) {
  return `<script id="__CONTENT__" type="application/json">${safeJson(content)}</script>`;
}
