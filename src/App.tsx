import './styles/site.css';
import { Header } from './components/Header';
import { MobileBar } from './components/MobileBar';
import { Hero } from './sections/Hero';
import { Marquee } from './sections/Marquee';
import { Place } from './sections/Place';
import { Kitchen } from './sections/Kitchen';
import { Menu } from './sections/Menu';
import { Terrace } from './sections/Terrace';
import { Market } from './sections/Market';
import { Gallery } from './sections/Gallery';
import { Visit } from './sections/Visit';
import { Closing } from './sections/Closing';

export function App() {
  return (
    <>
      <a href="#main" className="skip-link">
        Saltar al contenido
      </a>
      <Header />
      <main id="main">
        <Hero />
        <Marquee />
        <Place />
        <Kitchen />
        <Menu />
        <Terrace />
        <Market />
        <Gallery />
        <Visit />
        <Closing />
      </main>
      <MobileBar />
    </>
  );
}
