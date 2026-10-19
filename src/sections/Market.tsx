import { useContent } from '../lib/content';
import { Reveal } from '../components/Reveal';
import { Icon } from '../components/Icon';

export function Market() {
  const { copy } = useContent();
  return (
    <section className="section market" aria-labelledby="market-title">
      <div className="container market__grid">
        <div className="market__copy">
          <Reveal as="p" className="eyebrow" variant="fade">
            <Icon name="store" size={18} /> Mini market
          </Reveal>
          <Reveal as="h2" id="market-title" className="display-3">
            {copy.marketTitle}
          </Reveal>
          <Reveal as="p" className="lead" delay={80}>
            {copy.marketText}
          </Reveal>
        </div>
        <Reveal as="figure" variant="clip" className="market__photo">
          <img src="/images/mini-market.webp" alt="Estantes del mini market del parador" width={481} height={640} loading="lazy" />
        </Reveal>
      </div>
    </section>
  );
}
