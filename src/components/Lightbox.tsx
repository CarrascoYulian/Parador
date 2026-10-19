import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { GalleryImage } from '../lib/types';
import { Icon } from './Icon';

interface Props {
  images: GalleryImage[];
  index: number | null;
  onChange: (i: number | null) => void;
}

export function Lightbox({ images, index, onChange }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const open = index !== null;
  const img = open ? images[index] : null;

  useEffect(() => {
    if (!open) return;
    returnFocus.current = document.activeElement as HTMLElement;
    closeRef.current?.focus();
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.documentElement.style.overflow = '';
      returnFocus.current?.focus();
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onChange(null);
      if (e.key === 'ArrowRight') onChange((index! + 1) % images.length);
      if (e.key === 'ArrowLeft') onChange((index! - 1 + images.length) % images.length);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, index, images.length, onChange]);

  return (
    <AnimatePresence>
      {img && (
        <motion.div
          className="lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="Galería de fotos"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.15 } }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.target === e.currentTarget && onChange(null)}
        >
          <button ref={closeRef} className="lightbox__btn lightbox__close" onClick={() => onChange(null)} aria-label="Cerrar">
            <Icon name="close" />
          </button>
          <button
            className="lightbox__btn lightbox__prev"
            onClick={() => onChange((index! - 1 + images.length) % images.length)}
            aria-label="Foto anterior"
          >
            <Icon name="left" />
          </button>
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.figure
              key={img.id}
              className="lightbox__figure"
              initial={{ opacity: 0, transform: 'scale(0.97)', filter: 'blur(4px)' }}
              animate={{ opacity: 1, transform: 'scale(1)', filter: 'blur(0px)' }}
              exit={{ opacity: 0, filter: 'blur(4px)', transition: { duration: 0.12 } }}
              transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
            >
              <img src={img.src} alt={img.alt} />
              <figcaption>
                {img.caption}
                <span>
                  {index! + 1} / {images.length}
                </span>
              </figcaption>
            </motion.figure>
          </AnimatePresence>
          <button
            className="lightbox__btn lightbox__next"
            onClick={() => onChange((index! + 1) % images.length)}
            aria-label="Foto siguiente"
          >
            <Icon name="right" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
