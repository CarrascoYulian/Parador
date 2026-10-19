import { useEffect, useRef, type CSSProperties, type ElementType, type ReactNode } from 'react';

type Variant = 'up' | 'fade' | 'clip' | 'clip-side' | 'scale';

interface Props {
  as?: ElementType;
  variant?: Variant;
  /** Retraso en ms (para escalonar) */
  delay?: number;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
  [key: string]: unknown;
}

/**
 * Revela su contenido al entrar en pantalla. La animación vive en CSS
 * (transform/opacity/clip-path) para no depender del hilo principal y
 * se desactiva con prefers-reduced-motion.
 */
export function Reveal({ as: Tag = 'div', variant = 'up', delay = 0, className = '', style, children, ...rest }: Props) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!('IntersectionObserver' in window)) {
      el.dataset.inview = 'true';
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.dataset.inview = 'true';
          io.disconnect();
        }
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.01 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      data-reveal={variant}
      className={className}
      style={delay ? { ...style, '--reveal-delay': `${delay}ms` } : style}
      {...rest}
    >
      {children}
    </Tag>
  );
}
