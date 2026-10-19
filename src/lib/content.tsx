import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Content } from './types';
import { openStatus, type OpenStatus } from './hours';

/** El servidor incrusta el contenido en el HTML para pintar sin esperar a la red. */
export function readEmbeddedContent(): Content | null {
  const el = document.getElementById('__CONTENT__');
  if (!el?.textContent) return null;
  try {
    return JSON.parse(el.textContent) as Content;
  } catch {
    return null;
  }
}

export async function fetchContent(): Promise<Content> {
  const res = await fetch('/api/content');
  if (!res.ok) throw new Error('No se pudo cargar el contenido');
  return res.json();
}

const ContentContext = createContext<Content | null>(null);

export function ContentProvider({ value, children }: { value: Content; children: ReactNode }) {
  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>;
}

export function useContent() {
  const c = useContext(ContentContext);
  if (!c) throw new Error('useContent fuera de ContentProvider');
  return c;
}

/** Estado de apertura en vivo (se recalcula cada minuto). */
export function useOpenStatus(): OpenStatus {
  const { hours } = useContent();
  const [status, setStatus] = useState(() => openStatus(hours));
  useEffect(() => {
    setStatus(openStatus(hours));
    const id = window.setInterval(() => setStatus(openStatus(hours)), 60_000);
    return () => window.clearInterval(id);
  }, [hours]);
  return status;
}
