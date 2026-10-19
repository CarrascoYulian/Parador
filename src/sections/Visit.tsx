import { useState } from 'react';
import { useContent, useOpenStatus } from '../lib/content';
import { DAY_LABELS, formatRange } from '../lib/hours';
import { contactChannel, directionsUrl, mapEmbedUrl, mapsPlaceUrl, messages, wazeUrl } from '../lib/links';
import { Icon } from '../components/Icon';
import { Reveal } from '../components/Reveal';
import { StatusPill } from '../components/Header';

export function Visit() {
  const { site, hours, faq } = useContent();
  const status = useOpenStatus();
  const contact = contactChannel(site);
  const [mapLoaded, setMapLoaded] = useState(false);
  const sorted = [...hours].sort((a, b) => a.day - b.day);

  return (
    <section id="visitanos" className="section visit" aria-labelledby="visit-title">
      <div className="container">
        <header className="section-head">
          <Reveal as="p" className="eyebrow" variant="fade">
            <span className="eyebrow__num">06</span> Visítanos
          </Reveal>
          <Reveal as="h2" id="visit-title" className="display-2">
            Todo lo que necesitas para llegar.
          </Reveal>
        </header>

        <div className="visit__grid">
          <Reveal className="visit__card">
            <div className="visit__block">
              <h3>
                <Icon name="pin" size={18} /> Dirección
              </h3>
              <p className="visit__address">{site.address}</p>
              <div className="visit__actions">
                <a className="btn btn--primary" href={directionsUrl(site)} target="_blank" rel="noopener">
                  <Icon name="navigation" size={18} /> Google Maps
                </a>
                <a className="btn btn--ghost" href={wazeUrl(site)} target="_blank" rel="noopener">
                  <Icon name="car" size={18} /> Waze
                </a>
              </div>
            </div>

            <div className="visit__block">
              <h3>
                <Icon name="clock" size={18} /> Horario
              </h3>
              <StatusPill />
              <table className="hours">
                <caption className="sr-only">Horario semanal</caption>
                <tbody>
                  {sorted.map((d) => (
                    <tr key={d.day} aria-current={d.day === status.today ? 'date' : undefined}>
                      <th scope="row">{DAY_LABELS[d.day]}</th>
                      <td>{formatRange(d)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="visit__block">
              <h3>
                <Icon name="chat" size={18} /> Contacto y pedidos
              </h3>
              <ul className="contact-list">
                {contact && (
                  <li>
                    <a href={contact.href(messages.onTheWay())} target="_blank" rel="noopener">
                      <Icon name={contact.kind === 'whatsapp' ? 'whatsapp' : 'instagram'} size={18} />
                      {contact.label}
                      <Icon name="arrowUpRight" size={16} className="contact-list__go" />
                    </a>
                  </li>
                )}
                {site.phone && (
                  <li>
                    <a href={`tel:${site.phone.replace(/[^\d+]/g, '')}`}>
                      <Icon name="chat" size={18} />
                      {site.phone}
                    </a>
                  </li>
                )}
                {site.pedidosya && (
                  <li>
                    <a href={site.pedidosya} target="_blank" rel="noopener">
                      <Icon name="bag" size={18} />
                      Delivery por PedidosYa
                      <Icon name="arrowUpRight" size={16} className="contact-list__go" />
                    </a>
                  </li>
                )}
              </ul>
            </div>
          </Reveal>

          <Reveal className="visit__map" variant="clip" delay={100}>
            {mapLoaded ? (
              <iframe
                title={`Mapa: ${site.name}`}
                src={mapEmbedUrl(site)}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            ) : (
              <div className="map-placeholder">
                <svg viewBox="0 0 400 300" aria-hidden="true" className="map-placeholder__art" preserveAspectRatio="xMidYMid slice">
                  <rect width="400" height="300" className="map-sea" />
                  <path d="M0 175 C 90 160, 180 190, 260 172 S 360 150, 400 158 L400 0 L0 0Z" className="map-land" />
                  <path d="M-10 182 C 90 168, 180 198, 262 180 S 362 158, 410 166" className="map-road" />
                  <path d="M-10 182 C 90 168, 180 198, 262 180 S 362 158, 410 166" className="map-road-dash" />
                  <path d="M-10 166 C 90 152, 180 182, 262 164 S 362 142, 410 150" className="map-marginal" />
                </svg>
                <div className="map-placeholder__pin">
                  <img src="/images/logo.webp" alt="" width={56} height={56} />
                </div>
                <div className="map-placeholder__label">
                  <strong>Km 23</strong>
                  <span>Autopista Las Américas</span>
                </div>
                <div className="map-placeholder__actions">
                  <button className="btn btn--light btn--sm" onClick={() => setMapLoaded(true)}>
                    Ver mapa interactivo
                  </button>
                  <a className="btn btn--light btn--sm" href={mapsPlaceUrl(site)} target="_blank" rel="noopener">
                    Abrir en Maps <Icon name="arrowUpRight" size={14} />
                  </a>
                </div>
              </div>
            )}
          </Reveal>
        </div>

        {faq.length > 0 && (
          <div className="faq">
            <Reveal as="h3" className="display-3">
              Preguntas frecuentes
            </Reveal>
            <div className="faq__list">
              {faq.map((f, i) => (
                <Reveal as="details" key={i} className="faq__item" delay={i * 40}>
                  <summary>
                    {f.q}
                    <span className="faq__icon" aria-hidden="true">
                      <Icon name="plus" size={18} />
                    </span>
                  </summary>
                  <p>{f.a}</p>
                </Reveal>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
