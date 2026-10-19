import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useContent } from '../lib/content';
import { contactChannel, formatPrice, messages } from '../lib/links';
import { Icon } from '../components/Icon';
import { Reveal } from '../components/Reveal';

const ease = [0.23, 1, 0.32, 1] as const;

export function Menu() {
  const { menu, site } = useContent();
  const contact = contactChannel(site);
  const categories = menu.categories.filter((c) => menu.items.some((i) => i.category === c.id));
  const [active, setActive] = useState<string>('todo');

  const groups = useMemo(
    () =>
      categories
        .filter((c) => active === 'todo' || c.id === active)
        .map((c) => ({ ...c, items: menu.items.filter((i) => i.category === c.id) })),
    [active, categories, menu.items],
  );
  const hasPrices = menu.items.some((i) => i.price !== null);

  return (
    <section id="menu" className="section menu" aria-labelledby="menu-title">
      <div className="container">
        <header className="section-head section-head--split">
          <div>
            <Reveal as="p" className="eyebrow" variant="fade">
              <span className="eyebrow__num">03</span> El menú
            </Reveal>
            <Reveal as="h2" id="menu-title" className="display-2">
              Lo que te espera en la mesa.
            </Reveal>
          </div>
          <Reveal as="p" className="lead" delay={80}>
            La comida del día cambia: lo que ves aquí es lo que solemos preparar.
            {!hasPrices && ' Los precios se consultan en el local o al escribirnos.'}
          </Reveal>
        </header>

        <div className="menu__tabs" role="tablist" aria-label="Categorías del menú">
          {[{ id: 'todo', name: 'Todo' }, ...categories].map((c) => (
            <button
              key={c.id}
              role="tab"
              aria-selected={active === c.id}
              aria-controls="menu-panel"
              className="chip"
              onClick={() => setActive(c.id)}
            >
              {active === c.id && <motion.span layoutId="chip-bg" className="chip__bg" transition={{ duration: 0.3, ease }} />}
              <span className="chip__label">{c.name}</span>
            </button>
          ))}
        </div>

        <div id="menu-panel" role="tabpanel" className="menu__panel">
          <AnimatePresence mode="popLayout" initial={false}>
            {groups.map((g) => (
              <motion.section
                key={g.id}
                className="menu-group"
                layout
                initial={{ opacity: 0, transform: 'translateY(10px)' }}
                animate={{ opacity: 1, transform: 'translateY(0px)' }}
                exit={{ opacity: 0, transition: { duration: 0.12 } }}
                transition={{ duration: 0.3, ease }}
                aria-labelledby={`cat-${g.id}`}
              >
                <header className="menu-group__head">
                  <h3 id={`cat-${g.id}`}>{g.name}</h3>
                  {g.description && <p>{g.description}</p>}
                </header>
                <ul className="menu-list">
                  {g.items.map((item) => (
                    <li key={item.id} className="menu-item" data-has-image={!!item.image}>
                      {item.image && <img src={item.image} alt="" loading="lazy" className="menu-item__thumb" />}
                      <div className="menu-item__body">
                        <div className="menu-item__row">
                          <h4>{item.name}</h4>
                          <span className="menu-item__leader" aria-hidden="true" />
                          <span className="menu-item__price">
                            {item.price !== null ? formatPrice(item.price) : 'Consultar'}
                          </span>
                        </div>
                        {item.description && <p>{item.description}</p>}
                      </div>
                    </li>
                  ))}
                </ul>
              </motion.section>
            ))}
          </AnimatePresence>
        </div>

        <Reveal className="menu__cta">
          <p>¿Con hambre ya? Pide para recoger o a domicilio.</p>
          <div className="menu__cta-actions">
            {site.pedidosya && (
              <a className="btn btn--primary" href={site.pedidosya} target="_blank" rel="noopener">
                <Icon name="bag" size={18} />
                Pedir en PedidosYa
              </a>
            )}
            {contact && (
              <a
                className="btn btn--ghost"
                href={contact.href(messages.menu())}
                target="_blank"
                rel="noopener"
              >
                <Icon name={contact.kind === 'whatsapp' ? 'whatsapp' : 'instagram'} size={18} />
                Preguntar por el menú del día
              </a>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
