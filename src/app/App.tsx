import { useEffect } from 'react';
import { ClassicPage } from '../classic/ClassicPage.tsx';
import { content } from '../content/index.ts';
import { useT } from '../i18n/useT.ts';

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

/*
 * Phase 1 : seul le mode classique existe. Le vaisseau 3D (chargé en lazy) arrive en phase 2,
 * avec la détection des capacités (WebGL, appareil) qui choisit le mode au démarrage.
 */
export function App() {
  useDocumentMeta();
  return <ClassicPage />;
}
