import { useContent } from '../lib/content';
import { contactChannel, messages } from '../lib/links';
import { Icon } from '../components/Icon';
import { Reveal } from '../components/Reveal';

const STEPS = [
  { n: '1', title: 'Escoge tu plato fuerte', text: 'Pollo, cerdo, chivo, guisos o algo de la parrilla.' },
  { n: '2', title: 'Acompáñalo a tu gusto', text: 'Arroz, habichuelas, ensaladas, tostones…' },
  { n: '3', title: 'Busca tu mesa', text: 'Abajo en el salón o arriba en la terraza.' },
];

export function Kitchen() {
  const { copy, menu, site } = useContent();
  const contact = contactChannel(site);
  const featured = menu.items.filter((i) => i.featured && i.image).slice(0, 5);

  return (
    <section id="cocina" className="section kitchen">
      <div className="container">
        <header className="section-head section-head--split">
          <div>
            <Reveal as="p" className="eyebrow" variant="fade">
              <span className="eyebrow__num">02</span> La cocina
            </Reveal>
            <Reveal as="h2" className="display-2">
              {copy.kitchenTitle}
            </Reveal>
          </div>
          <Reveal as="p" className="lead" delay={80}>
            {copy.kitchenText}
          </Reveal>
        </header>

        <div className="dishes">
          {featured.map((dish, i) => (
            <Reveal as="article" key={dish.id} className={`dish dish--${i}`} variant="clip" delay={(i % 3) * 90}>
              <div className="dish__media">
                <img src={dish.image} alt={dish.name} loading="lazy" />
              </div>
              <div className="dish__body">
                <h3>{dish.name}</h3>
                {dish.description && <p>{dish.description}</p>}
                {contact?.kind === 'whatsapp' && (
                  <a className="link-arrow" href={contact.href(messages.dish(dish.name))} target="_blank" rel="noopener">
                    Pregunta si hay hoy <Icon name="arrowUpRight" size={16} />
                  </a>
                )}
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal as="ol" className="steps" aria-label="Cómo funciona">
          <li className="steps__title">
            <span>Así se come</span>
            <strong>en el parador</strong>
          </li>
          {STEPS.map((s) => (
            <li key={s.n} className="step">
              <span className="step__n">{s.n}</span>
              <div>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </div>
            </li>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
