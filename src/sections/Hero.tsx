import { Fragment, useRef } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { useContent } from '../lib/content';
import { directionsUrl } from '../lib/links';
import { Icon } from '../components/Icon';
import { Stamp } from '../components/Stamp';
import { StatusPill } from '../components/Header';

export function Hero() {
  const { copy, site } = useContent();
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const mainY = useTransform(scrollYProgress, [0, 1], ['translateY(0px)', reduce ? 'translateY(0px)' : 'translateY(70px)']);
  const cardY = useTransform(scrollYProgress, [0, 1], ['translateY(0px) rotate(-4deg)', reduce ? 'translateY(0px) rotate(-4deg)' : 'translateY(-50px) rotate(-6deg)']);

  const words = copy.heroTitle.split(' ');

  return (
    <section id="inicio" className="hero" ref={ref}>
      <div className="container hero__grid">
        <div className="hero__copy">
          <p className="hero__eyebrow hero-in" style={{ '--i': 0 } as React.CSSProperties}>
            <span className="km-sign">KM 23</span>
            {copy.heroEyebrow.replace(/^Km 23\s*·\s*/i, '')}
          </p>
          <h1 className="hero__title" aria-label={copy.heroTitle}>
            {words.map((w, i) => (
              <Fragment key={i}>
                <span className="word-mask" aria-hidden="true">
                  <span className="word" style={{ '--i': i + 1 } as React.CSSProperties}>
                    {w}
                  </span>
                </span>{' '}
              </Fragment>
            ))}
          </h1>
          <p className="hero__lead hero-in" style={{ '--i': words.length + 1 } as React.CSSProperties}>
            {copy.heroText}
          </p>
          <div className="hero__ctas hero-in" style={{ '--i': words.length + 2 } as React.CSSProperties}>
            <a href="#cocina" className="btn btn--primary">
              Descubre la cocina
              <Icon name="arrow" size={18} />
            </a>
            <a href={directionsUrl(site)} className="btn btn--ghost" target="_blank" rel="noopener">
              <Icon name="pin" size={18} />
              Cómo llegar
            </a>
          </div>
          <ul className="hero__facts hero-in" style={{ '--i': words.length + 3 } as React.CSSProperties}>
            <li>
              <StatusPill />
            </li>
            {site.rating.show && site.rating.count > 0 && (
              <li className="fact">
                <Icon name="star" size={16} className="fact__star" />
                <strong>{site.rating.value.toLocaleString('es-DO', { minimumFractionDigits: 1 })}</strong>
                <span>
                  {site.rating.count} reseñas en {site.rating.source}
                </span>
              </li>
            )}
            <li className="fact">
              <Icon name="car" size={16} />
              <span>Parqueo amplio</span>
            </li>
          </ul>
        </div>

        <div className="hero__media">
          <motion.figure className="hero__photo" style={{ transform: mainY }}>
            <div className="hero__photo-clip">
              <img
                src="/images/fachada.webp"
                alt="Fachada del Parador Familiar Las Américas con su parqueo, en la marginal de la Autopista Las Américas"
                width={640}
                height={480}
                {...{ fetchpriority: 'high' }}
              />
            </div>
            <figcaption>Marginal Autopista Las Américas, km 23</figcaption>
          </motion.figure>
          <motion.figure className="hero__card" style={{ transform: cardY }}>
            <img src="/images/pollo-caja-china.webp" alt="Pollo a la caja china recién salido" width={512} height={640} />
            <figcaption>Pollo a la caja china</figcaption>
          </motion.figure>
          <Stamp text="PARADOR FAMILIAR · LAS AMÉRICAS · KM 23 · " className="hero__stamp" />
        </div>
      </div>
      <div className="road" aria-hidden="true">
        <span className="road__line" />
      </div>
    </section>
  );
}
