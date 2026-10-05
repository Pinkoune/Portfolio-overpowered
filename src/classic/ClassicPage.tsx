import { useState } from 'react';
import { content, type Project } from '../content/index.ts';
import { useT } from '../i18n/useT.ts';
import { ProjectSheet } from '../ui/ProjectSheet.tsx';
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
export function ClassicPage() {
  const { ui } = useT();
  const [openId, setOpenId] = useState<string | null>(null);
  const index = content.projects.findIndex((p) => p.id === openId);
  const open = (project: Project) => setOpenId(project.id);
  const navigate = (delta: -1 | 1) => {
    const total = content.projects.length;
    setOpenId(content.projects[(index + delta + total) % total]!.id);
  };

  return (
    <div className={s.page}>
      <a className={s.skip} href="#main">
        {ui('nav.skip')}
      </a>
      <Header />
      <main id="main" className={s.main} tabIndex={-1}>
        <Hero />
        <Projects onOpen={open} />
        <Arsenal />
        <Machines onOpen={open} />
        <Logbook />
        <Quarters />
      </main>
      <Comms />
      {index >= 0 && (
        <ProjectSheet
          project={content.projects[index]!}
          position={{ index, total: content.projects.length }}
          onClose={() => setOpenId(null)}
          onNavigate={navigate}
        />
      )}
    </div>
  );
}
