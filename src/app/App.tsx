import { lazy, Suspense, useEffect, useMemo } from 'react';
import { ClassicPage } from '../classic/ClassicPage.tsx';
import { content } from '../content/index.ts';
import { useT } from '../i18n/useT.ts';
import { useStore } from '../state/store.ts';
import { BootScreen } from '../ui/BootScreen.tsx';
import { canRun3d, chooseMode, detectCapabilities } from './capabilities.ts';
import { Failsafe } from './Failsafe.tsx';

// Le vaisseau (three.js, R3F) n'est téléchargé que si on embarque.
const ShipExperience = lazy(() => import('../three/ShipExperience.tsx'));

/** Synchronise <html lang>, le titre et la description avec la langue courante. */
function useDocumentMeta() {
  const { lang, t } = useT();
  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = t(content.profile.seo.title);
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute('content', t(content.profile.seo.description));
  }, [lang, t]);
}

export function App() {
  useDocumentMeta();
  const caps = useMemo(() => detectCapabilities(), []);
  const preferred = useStore((s) => s.preferredMode);
  const failed = useStore((s) => s.threeFailed);
  const setThreeFailed = useStore((s) => s.setThreeFailed);
  const mode = chooseMode(caps, preferred, failed);
  const booting = useStore((s) => s.stage === 'boot');

  if (mode === 'classic') return <ClassicPage can3d={canRun3d(caps)} failed={failed} />;
  return (
    <>
      <Failsafe onFail={() => setThreeFailed(true)}>
        <Suspense fallback={null}>
          <ShipExperience reducedMotion={caps.reducedMotion} />
        </Suspense>
      </Failsafe>
      {booting && <BootScreen />}
    </>
  );
}
