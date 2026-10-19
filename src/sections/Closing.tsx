import { useContent } from '../lib/content';
import { directionsUrl } from '../lib/links';
import { groupedHours } from '../lib/hours';
import { Icon } from '../components/Icon';
import { Reveal } from '../components/Reveal';
import { Stamp } from '../components/Stamp';

export function Closing() {
  const { copy, site, hours } = useContent();
  return (
    <section id="cierre" className="closing" aria-labelledby="closing-title">
      <div className="container closing__inner">
        <Stamp text="¡DONDE LA FAMILIA ES EL CENTRO! · " className="closing__stamp" />
        <Reveal as="h2" id="closing-title" className="closing__title">
          {copy.closingTitle}
        </Reveal>
        <Reveal className="closing__actions" delay={100}>
          <a className="btn btn--primary btn--lg" href={directionsUrl(site)} target="_blank" rel="noopener">
            <Icon name="navigation" size={20} /> Cómo llegar
          </a>
          <a className="btn btn--outline-light btn--lg" href="#menu">
            Ver el menú
          </a>
        </Reveal>
      </div>

      <footer className="footer">
        <div className="container footer__grid">
          <div className="footer__brand">
            <img src="/images/logo.webp" alt="" width={64} height={64} />
            <div>
              <strong>{site.name}</strong>
              <p>{site.slogan}</p>
            </div>
          </div>
          <div>
            <h3>Dirección</h3>
            <p>{site.address}</p>
          </div>
          <div>
            <h3>Horario</h3>
            {groupedHours(hours).map((g) => (
              <p key={g.label}>
                {g.label}: {g.range}
              </p>
            ))}
          </div>
          <div>
            <h3>Síguenos</h3>
            <ul className="footer__links">
              {site.instagram && (
                <li>
                  <a href={site.instagram} target="_blank" rel="noopener">
                    Instagram
                  </a>
                </li>
              )}
              {site.threads && (
                <li>
                  <a href={site.threads} target="_blank" rel="noopener">
                    Threads
                  </a>
                </li>
              )}
              {site.pedidosya && (
                <li>
                  <a href={site.pedidosya} target="_blank" rel="noopener">
                    PedidosYa
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>
        <div className="container footer__base">
          <p>
            © {new Date().getFullYear()} {site.name}. Fotos: Instagram oficial del parador.
          </p>
        </div>
      </footer>
    </section>
  );
}
