export interface Site {
  name: string;
  slogan: string;
  address: string;
  addressShort: string;
  lat: number;
  lng: number;
  whatsapp: string;
  phone: string;
  instagram: string;
  pedidosya: string;
  threads: string;
  rating: { value: number; count: number; source: string; show: boolean };
  priceRange: string;
  notice: string;
}

export interface DayHours {
  /** 1 = lunes … 7 = domingo */
  day: number;
  open: string;
  close: string;
  closed: boolean;
}

export interface Copy {
  heroEyebrow: string;
  heroTitle: string;
  heroText: string;
  placeTitle: string;
  placeText: string;
  kitchenTitle: string;
  kitchenText: string;
  terraceTitle: string;
  terraceText: string;
  marketTitle: string;
  marketText: string;
  closingTitle: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number | null;
  image: string;
  featured: boolean;
  /** Solo en el panel de administración */
  active?: boolean;
  source?: string;
}

export interface GalleryImage {
  id: string;
  src: string;
  alt: string;
  caption: string;
  tag: 'lugar' | 'cocina' | 'market';
}

export interface Testimonial {
  text: string;
  source: string;
}

export interface Faq {
  q: string;
  a: string;
}

export interface Content {
  site: Site;
  hours: DayHours[];
  copy: Copy;
  menu: { categories: Category[]; items: MenuItem[] };
  gallery: GalleryImage[];
  testimonials: Testimonial[];
  faq: Faq[];
}
