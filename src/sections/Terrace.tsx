import { useRef } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { useContent } from '../lib/content';
import { Reveal } from '../components/Reveal';

export function Terrace() {
  const { copy, testimonials } = useContent();
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const imgT = useTransform(scrollYProgress, [0, 1], reduce ? ['scale(1.12) translateY(0%)', 'scale(1.12) translateY(0%)'] : ['scale(1.12) translateY(-5%)', 'scale(1.12) translateY(5%)']);

  return (
    <section id="terraza" className="section terrace" ref={ref}>
      <div className="container terrace__grid">
        <Reveal as="figure" variant="clip-side" className="terrace__photo">
          <motion.img
            src="/images/terraza.webp"
            alt="Terraza del segundo nivel: mesas frente a ventanales con palmas al fondo"
            width={360}
            height={640}
            loading="lazy"
            style={{ transform: imgT }}
          />
        </Reveal>
        <div className="terrace__copy">
          <Reveal as="p" className="eyebrow eyebrow--light" variant="fade">
            <span className="eyebrow__num">04</span> Segundo nivel
          </Reveal>
          <Reveal as="h2" className="display-1">
            {copy.terraceTitle}
          </Reveal>
          <Reveal as="p" className="lead" delay={80}>
            {copy.terraceText}
          </Reveal>

          {testimonials.length > 0 && (
            <ul className="quotes" aria-label="Lo que dicen quienes nos visitan">
              {testimonials.map((t, i) => (
                <Reveal as="li" key={i} className="quote" delay={i * 80}>
                  <blockquote>“{t.text}”</blockquote>
                  {t.source && <cite>{t.source}</cite>}
                </Reveal>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
