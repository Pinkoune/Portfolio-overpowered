import { useEffect } from 'react';
import { useT } from '../i18n/useT.ts';
import { useStore } from '../state/store.ts';
import { PanelHost } from '../ui/panels/PanelHost.tsx';
import s from './classic.module.css';
import { Header } from './Header.tsx';
import { Arsenal } from './sections/Arsenal.tsx';
import { Comms } from './sections/Comms.tsx';
import { Hero } from './sections/Hero.tsx';
import { Logbook } from './sections/Logbook.tsx';
import { Machines } from './sections/Machines.tsx';
import { Projects } from './sections/Projects.tsx';
import { Quarters } from './sections/Quarters.tsx';

/**
 * Mode classique : page scrollable, même identité et même contenu que le vaisseau, sans 3D.
 * Toujours disponible, et utilisé d'office sans WebGL ou sur un appareil trop faible.
 */
export function ClassicPage({ can3d }: { can3d: boolean }) {
  const { ui } = useT();

  // En arrivant depuis le vaisseau, on se place sur la section de la salle quittée.
  useEffect(() => {
    if (window.location.hash.startsWith('#/')) {
      history.replaceState(null, '', window.location.pathname + window.location.search);
    }
    const { room } = useStore.getState();
    if (room !== 'bridge') document.getElementById(room)?.scrollIntoView({ behavior: 'instant' });
  }, []);

  return (
    <div className={s.page}>
      <a className={s.skip} href="#main">
        {ui('nav.skip')}
      </a>
      <Header can3d={can3d} />
      <main id="main" className={s.main} tabIndex={-1}>
        <Hero />
        <Projects />
        <Arsenal />
        <Machines />
        <Logbook />
        <Quarters />
      </main>
      <Comms />
      <PanelHost placement="center" />
    </div>
  );
}
