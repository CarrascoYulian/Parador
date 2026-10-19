import { useCallback, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { useContent } from '../lib/content';
import type { GalleryImage } from '../lib/types';
import { Icon } from '../components/Icon';
import { Reveal } from '../components/Reveal';
import { Lightbox } from '../components/Lightbox';

const FILTERS: { id: 'todo' | GalleryImage['tag']; label: string }[] = [
  { id: 'todo', label: 'Todo' },
  { id: 'lugar', label: 'El lugar' },
  { id: 'cocina', label: 'Cocina' },
  { id: 'market', label: 'Mini market' },
];

export function Gallery() {
  const { gallery, site } = useContent();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['id']>('todo');
  const [index, setIndex] = useState<number | null>(null);
  const track = useRef<HTMLUListElement>(null);

  const images = filter === 'todo' ? gallery : gallery.filter((g) => g.tag === filter);
  const filters = FILTERS.filter((f) => f.id === 'todo' || gallery.some((g) => g.tag === f.id));

  const scrollBy = (dir: 1 | -1) => {
    const el = track.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  };
  const onChange = useCallback((i: number | null) => setIndex(i), []);

  if (gallery.length === 0) return null;

  return (
    <section id="galeria" className="section gallery" aria-labelledby="gallery-title">
      <div className="container">
        <header className="section-head section-head--split">
          <div>
            <Reveal as="p" className="eyebrow" variant="fade">
              <span className="eyebrow__num">05</span> Galería
            </Reveal>
            <Reveal as="h2" id="gallery-title" className="display-2">
              Un recorrido por el parador.
            </Reveal>
          </div>
          <div className="gallery__controls">
            <div className="gallery__filters" role="group" aria-label="Filtrar fotos">
              {filters.map((f) => (
                <button
                  key={f.id}
                  className="chip chip--small"
                  aria-pressed={filter === f.id}
                  onClick={() => {
                    setFilter(f.id);
                    track.current?.scrollTo({ left: 0 });
                  }}
                >
                  {filter === f.id && <motion.span layoutId="gallery-chip" className="chip__bg" transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }} />}
                  <span className="chip__label">{f.label}</span>
                </button>
              ))}
            </div>
            <div className="gallery__arrows">
              <button className="round-btn" onClick={() => scrollBy(-1)} aria-label="Ver fotos anteriores">
                <Icon name="left" />
              </button>
              <button className="round-btn" onClick={() => scrollBy(1)} aria-label="Ver más fotos">
                <Icon name="right" />
              </button>
            </div>
          </div>
        </header>
      </div>

      <ul className="gallery__track" ref={track} key={filter}>
        {images.map((img, i) => (
          <li key={img.id} className={`gallery__item gallery__item--${i % 4}`} style={{ '--i': i } as React.CSSProperties}>
            <button onClick={() => setIndex(i)} aria-label={`Ampliar: ${img.caption || img.alt}`}>
              <img src={img.src} alt={img.alt} loading="lazy" />
              {img.caption && <span className="gallery__caption">{img.caption}</span>}
            </button>
          </li>
        ))}
        {site.instagram && (
          <li className="gallery__item gallery__more">
            <a href={site.instagram} target="_blank" rel="noopener">
              <Icon name="instagram" size={28} />
              <span>Más fotos en Instagram</span>
              <small>@{site.instagram.match(/instagram\.com\/([^/?#]+)/)?.[1]}</small>
            </a>
          </li>
        )}
      </ul>

      <Lightbox images={images} index={index} onChange={onChange} />
    </section>
  );
}
