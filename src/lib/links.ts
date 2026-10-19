import type { Site } from './types';

export const directionsUrl = (s: Site) =>
  `https://www.google.com/maps/dir/?api=1&destination=${s.lat},${s.lng}&travelmode=driving`;

export const mapsPlaceUrl = (s: Site) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.name)}%20${s.lat},${s.lng}`;

export const wazeUrl = (s: Site) => `https://waze.com/ul?ll=${s.lat},${s.lng}&navigate=yes`;

export const mapEmbedUrl = (s: Site) => `https://www.google.com/maps?q=${s.lat},${s.lng}&z=16&output=embed`;

/** Usuario de Instagram a partir de la URL del perfil. */
const igUser = (s: Site) => s.instagram.match(/instagram\.com\/([^/?#]+)/)?.[1] ?? '';

/**
 * Mensajes precompletados según la intención del visitante. Son consultas:
 * ninguna confirma una reserva o un pedido.
 */
export const messages = {
  general: (s: Site) => `Hola, ${s.name} 👋 Quisiera información sobre el parador.`,
  dish: (dish: string) => `Hola 👋 ¿Hoy tienen ${dish}? Quisiera saber el precio y si está disponible para llevar.`,
  menu: () => `Hola 👋 ¿Me pueden compartir el menú del día y los precios?`,
  onTheWay: () => `Hola 👋 Vamos de camino al parador. ¿Hasta qué hora sirven comida hoy?`,
};

export interface Contact {
  kind: 'whatsapp' | 'instagram';
  label: string;
  href: (message: string) => string;
}

/** Canal de contacto preferido: WhatsApp si está configurado; si no, mensaje directo de Instagram. */
export function contactChannel(s: Site): Contact | null {
  if (s.whatsapp) {
    return {
      kind: 'whatsapp',
      label: 'Escríbenos por WhatsApp',
      href: (m) => `https://wa.me/${s.whatsapp}?text=${encodeURIComponent(m)}`,
    };
  }
  const user = igUser(s);
  if (user) return { kind: 'instagram', label: 'Escríbenos por Instagram', href: () => `https://ig.me/m/${user}` };
  return null;
}

export const formatPrice = (n: number) =>
  `RD$${new Intl.NumberFormat('es-DO', { maximumFractionDigits: 0 }).format(n)}`;
