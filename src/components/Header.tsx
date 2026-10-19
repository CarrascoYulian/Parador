import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useContent, useOpenStatus } from '../lib/content';
import { directionsUrl } from '../lib/links';
import { Icon } from './Icon';

const NAV = [
  { href: '#lugar', label: 'El lugar' },
  { href: '#cocina', label: 'Cocina' },
  { href: '#menu', label: 'Menú' },
  { href: '#galeria', label: 'Galería' },
  { href: '#visitanos', label: 'Visítanos' },
];

export function StatusPill({ tone = 'light' }: { tone?: 'light' | 'dark' }) {
  const status = useOpenStatus();
  return (
    <span className={`status-pill status-pill--${tone}`} data-open={status.open}>
      <span className="status-pill__dot" aria-hidden="true" />
      {status.label}
    </span>
  );
}

export function Header() {
  const { site } = useContent();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setScrolled(window.scrollY > 24));
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    document.documentElement.style.overflow = open ? 'hidden' : '';
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      {site.notice && (
        <div className="notice" role="status">
          {site.notice}
        </div>
      )}
      <header className="header" data-scrolled={scrolled || open}>
        <div className="header__inner container">
          <a href="#inicio" className="brand" aria-label={`${site.name}, ir al inicio`}>
            <img src="/images/logo.webp" alt="" width={44} height={44} className="brand__logo" />
            <span className="brand__name">
              Parador Familiar
              <strong>Las Américas</strong>
            </span>
          </a>

          <nav className="nav" aria-label="Principal">
            {NAV.map((n) => (
              <a key={n.href} href={n.href} className="nav__link">
                {n.label}
              </a>
            ))}
          </nav>

          <div className="header__actions">
            <StatusPill />
            <a className="btn btn--primary btn--sm" href={directionsUrl(site)} target="_blank" rel="noopener">
              <Icon name="navigation" size={16} />
              Cómo llegar
            </a>
          </div>

          <button
            className="menu-toggle"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
            onClick={() => setOpen((o) => !o)}
          >
            <Icon name={open ? 'close' : 'menu'} size={22} />
          </button>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-nav"
            className="mobile-nav"
            initial={{ opacity: 0, clipPath: 'inset(0 0 100% 0)' }}
            animate={{ opacity: 1, clipPath: 'inset(0 0 0% 0)' }}
            exit={{ opacity: 0, clipPath: 'inset(0 0 100% 0)', transition: { duration: 0.2 } }}
            transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
          >
            <nav aria-label="Menú móvil">
              {NAV.map((n, i) => (
                <motion.a
                  key={n.href}
                  href={n.href}
                  onClick={() => setOpen(false)}
                  initial={{ opacity: 0, transform: 'translateY(12px)' }}
                  animate={{ opacity: 1, transform: 'translateY(0px)' }}
                  transition={{ delay: 0.06 + i * 0.04, duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                >
                  {n.label}
                </motion.a>
              ))}
            </nav>
            <div className="mobile-nav__foot">
              <StatusPill tone="dark" />
              <p>{site.addressShort}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
