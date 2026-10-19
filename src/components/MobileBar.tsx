import { useEffect, useState } from 'react';
import { useContent } from '../lib/content';
import { contactChannel, directionsUrl, messages } from '../lib/links';
import { Icon } from './Icon';

/** Barra de acciones para móvil: aparece tras el hero, nunca tapa contenido clave. */
export function MobileBar() {
  const { site } = useContent();
  const contact = contactChannel(site);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const hero = document.getElementById('inicio');
    const closing = document.getElementById('cierre');
    if (!hero || !('IntersectionObserver' in window)) return;
    const state = { hero: true, closing: false };
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.target === hero) state.hero = e.isIntersecting;
        if (e.target === closing) state.closing = e.isIntersecting;
      }
      setVisible(!state.hero && !state.closing);
    });
    io.observe(hero);
    if (closing) io.observe(closing);
    return () => io.disconnect();
  }, []);

  return (
    <div className="mobile-bar" data-visible={visible} aria-hidden={!visible}>
      <a href={directionsUrl(site)} target="_blank" rel="noopener" tabIndex={visible ? 0 : -1}>
        <Icon name="navigation" size={18} />
        Llegar
      </a>
      <a href="#menu" tabIndex={visible ? 0 : -1}>
        <Icon name="utensils" size={18} />
        Menú
      </a>
      {contact ? (
        <a
          href={contact.href(messages.general(site))}
          target="_blank"
          rel="noopener"
          className="mobile-bar__primary"
          tabIndex={visible ? 0 : -1}
        >
          <Icon name={contact.kind === 'whatsapp' ? 'whatsapp' : 'instagram'} size={18} />
          Escribir
        </a>
      ) : (
        <a href="#visitanos" className="mobile-bar__primary" tabIndex={visible ? 0 : -1}>
          <Icon name="clock" size={18} />
          Horario
        </a>
      )}
    </div>
  );
}
