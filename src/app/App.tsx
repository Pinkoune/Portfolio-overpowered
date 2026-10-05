import { lazy, Suspense, useEffect, useMemo } from 'react';
import { ClassicPage } from '../classic/ClassicPage.tsx';
import { content } from '../content/index.ts';
import { useT } from '../i18n/useT.ts';
import { useStore } from '../state/store.ts';
import { Loader } from '../ui/Loader.tsx';
import { canRun3d, chooseMode, detectCapabilities } from './capabilities.ts';

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
  const mode = chooseMode(caps, preferred);

  if (mode === 'classic') return <ClassicPage can3d={canRun3d(caps)} />;
  return (
    <Suspense fallback={<Loader />}>
      <ShipExperience reducedMotion={caps.reducedMotion} />
    </Suspense>
  );
}
