import { useContent } from '../lib/content';
import { Icon, type IconName } from '../components/Icon';
import { Reveal } from '../components/Reveal';

const FEATURES: { icon: IconName; title: string; text: string; needsPedidosYa?: boolean }[] = [
  { icon: 'sun', title: 'Salón principal', text: 'Amplio, luminoso y con ventanales de piso a techo.' },
  { icon: 'stairs', title: 'Terraza en el segundo nivel', text: 'Mesas frente a los ventanales, con palmas al fondo.' },
  { icon: 'car', title: 'Parqueo amplio', text: 'Llegas, estacionas frente a la puerta y entras sin vueltas.' },
  { icon: 'store', title: 'Mini market', text: 'Para llevarte algo para la casa o para el camino.' },
  { icon: 'bag', title: 'Para llevar y delivery', text: 'Pasa a recoger tu pedido o pídelo por PedidosYa.', needsPedidosYa: true },
];

export function Place() {
  const { copy, site } = useContent();
  return (
    <section id="lugar" className="section place">
      <div className="container">
        <header className="section-head">
          <Reveal as="p" className="eyebrow" variant="fade">
            <span className="eyebrow__num">01</span> El lugar
          </Reveal>
          <Reveal as="h2" className="display-2">
            {copy.placeTitle}
          </Reveal>
          <Reveal as="p" className="lead" delay={80}>
            {copy.placeText}
          </Reveal>
        </header>

        <div className="place__grid">
          <Reveal as="figure" variant="clip" className="place__photo place__photo--main">
            <img src="/images/salon.webp" alt="Salón principal con familias almorzando junto a los ventanales" width={640} height={480} loading="lazy" />
            <figcaption>El salón a la hora del almuerzo</figcaption>
          </Reveal>
          <Reveal as="figure" variant="clip" delay={120} className="place__photo place__photo--side">
            <img src="/images/para-llevar.webp" alt="Pedidos para llevar listos en el mostrador" width={512} height={640} loading="lazy" />
            <figcaption>Pedidos listos para llevar</figcaption>
          </Reveal>

          <ol className="features">
            {FEATURES.filter((f) => !f.needsPedidosYa || site.pedidosya).map((f, i) => (
              <Reveal as="li" key={f.title} className="feature" delay={i * 60}>
                <span className="feature__num">{String(i + 1).padStart(2, '0')}</span>
                <span className="feature__icon">
                  <Icon name={f.icon} size={22} />
                </span>
                <div>
                  <h3>{f.title}</h3>
                  <p>{f.text}</p>
                </div>
              </Reveal>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
