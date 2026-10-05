import { useEffect, useState } from 'react';
import { content } from '../content/index.ts';
import { useT } from '../i18n/useT.ts';
import { useStore } from '../state/store.ts';
import { Button, Diamond } from './primitives.tsx';
import { ui } from './styles.ts';
import s from './BootScreen.module.css';

/*
 * Chargement et approche (maquette A « Chargement / intro » + Motion I).
 * Au-dessus du canvas : le journal de démarrage se remplit au rythme du vrai chargement ;
 * une fois la séquence au plan final, titre, 100 % et bouton « Embarquer ».
 */

function useBootSteps() {
  const sceneReady = useStore((st) => st.sceneReady);
  const introReady = useStore((st) => st.introReady);
  const [pilotAwake, setPilotAwake] = useState(false);
  useEffect(() => {
    if (!sceneReady) return;
    const timer = window.setTimeout(() => setPilotAwake(true), 2500);
    return () => window.clearTimeout(timer);
  }, [sceneReady]);
  // 1 : vaisseau téléchargé et monté · 2 : première image · 3 : pilote · 4 : plan final.
  const steps = [sceneReady, sceneReady, pilotAwake || introReady, introReady];
  const done = steps.filter(Boolean).length;
  return { steps, progress: Math.round(10 + (done / steps.length) * 90), introReady };
}

export function BootScreen() {
  const { t, ui: u } = useT();
  const { steps, progress, introReady } = useBootSteps();
  const embarking = useStore((st) => st.embarking);
  const embark = useStore((st) => st.embark);
  const requestSkip = useStore((st) => st.requestSkip);
  const setPreferredMode = useStore((st) => st.setPreferredMode);
  const soundOn = useStore((st) => st.soundOn);
  const toggleSound = useStore((st) => st.toggleSound);
  const { profile } = content;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Un bouton qui a le focus (son, mode classique) garde Entrée et Espace pour lui.
      if (e.target instanceof HTMLButtonElement) return;
      if (e.key === 'Enter' && useStore.getState().introReady) embark();
      else if (e.key === ' ' && !useStore.getState().introReady) {
        e.preventDefault();
        requestSkip();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [embark, requestSkip]);

  const logs = [u('boot.log1'), u('boot.log2'), u('boot.log3'), u('boot.log4')];

  return (
    <div className={s.boot} data-ready={introReady} data-leaving={embarking}>
      <p className={`${ui.label} ${s.top}`}>
        <span>{u('boot.sequence')}</span>
        <span className={s.dim}>{u('boot.orbit')}</span>
      </p>

      {!introReady && (
        <p className={`${ui.label} ${s.signal}`} aria-live="polite">
          {u('boot.signal')}
          <span className={s.caret} aria-hidden="true">
            _
          </span>
        </p>
      )}

      <section className={s.center} aria-hidden={!introReady} aria-labelledby="boot-title">
        <span className={s.mark} aria-hidden="true">
          <Diamond size={14} />
        </span>
        <h1 id="boot-title" className={`${ui.display} ${s.title}`}>
          {profile.alias}
        </h1>
        <p className={`${ui.label} ${s.subtitle}`}>
          {u('boot.subtitle', { name: profile.name, role: t(profile.role) })}
        </p>
        <div className={s.progress}>
          <p className={ui.label}>
            <span>{u('boot.online')}</span>
            <span className={s.pink}>{progress} %</span>
          </p>
          <span
            className={s.bar}
            style={{ transform: `scaleX(${progress / 100})` }}
            aria-hidden="true"
          />
        </div>
        <Button
          variant="primary"
          kbd={u('boot.enter')}
          onClick={embark}
          disabled={!introReady}
          tabIndex={introReady ? 0 : -1}
        >
          {u('boot.embark')}
        </Button>
      </section>

      <ol className={s.log} aria-label={u('hud.loading')}>
        {logs.map((line, i) => (
          <li key={line} data-done={steps[i]}>
            &gt; {line} <span className={s.dots} aria-hidden="true" />
            <span className={s.ok}>{steps[i] ? 'OK' : '..'}</span>
            {i === logs.length - 1 && steps[i] && <span className={s.caret}>_</span>}
          </li>
        ))}
      </ol>

      <div className={`${ui.label} ${s.actions}`}>
        {!introReady && (
          <button type="button" className={s.link} onClick={requestSkip}>
            {u('boot.skip')} · <span aria-hidden="true">Espace</span>
          </button>
        )}
        <button
          type="button"
          className={s.sound}
          aria-pressed={soundOn}
          onClick={(e) => {
            toggleSound();
            // Au clic souris, on rend Entrée à « Embarquer » ; au clavier, le focus reste ici.
            if (e.detail > 0) e.currentTarget.blur();
          }}
        >
          {u(soundOn ? 'sound.on' : 'sound.off')}
        </button>
        <button type="button" className={s.link} onClick={() => setPreferredMode('classic')}>
          {u('boot.classic')}
        </button>
      </div>
    </div>
  );
}
