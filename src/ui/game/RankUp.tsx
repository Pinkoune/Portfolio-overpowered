import { useEffect, useRef, useState } from 'react';
import { content } from '../../content/index.ts';
import { useT } from '../../i18n/useT.ts';
import { useStore } from '../../state/store.ts';
import { Button, Diamond } from '../primitives.tsx';
import { ui } from '../styles.ts';
import s from './game.module.css';

/** Attente avant la célébration : le toast et le remplissage de la barre passent d'abord. */
const DELAY_MS = 2400;
/** L'écran bloque les entrées 1,2 s (DA, maquette F), puis Entrée ou clic referme en 400 ms. */
const LOCK_MS = 1200;
const CLOSE_MS = 400;

/**
 * Montée de rang (Motion V) : voile, trois losanges concentriques, onde de choc ambre, titre qui se
 * resserre, récompenses, « Continuer ». Seul moment où l'ambre occupe le centre de l'écran.
 */
export function RankUp() {
  const rankUp = useStore((st) => st.rankUp);
  // Jamais par-dessus un panneau ouvert : la célébration attend qu'il se ferme.
  const panelOpen = useStore((st) => st.panel !== null);
  const dismiss = useStore((st) => st.dismissRankUp);
  const { t, ui: u } = useT();
  const [shown, setShown] = useState<number | null>(null);
  const [locked, setLocked] = useState(true);
  const [closing, setClosing] = useState(false);
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (rankUp === null || panelOpen || shown !== null) return;
    const show = window.setTimeout(() => {
      // Plusieurs rangs gagnés d'affilée : on célèbre le plus récent.
      setShown(useStore.getState().rankUp);
      setLocked(true);
      setClosing(false);
    }, DELAY_MS);
    return () => window.clearTimeout(show);
  }, [rankUp, panelOpen, shown]);

  useEffect(() => {
    if (shown === null) return;
    ref.current?.showModal();
    const unlock = window.setTimeout(() => setLocked(false), LOCK_MS);
    return () => window.clearTimeout(unlock);
  }, [shown]);

  if (shown === null) return null;
  const level = Math.max(shown, rankUp ?? shown);
  const rank = content.ranks.ranks[level]!;
  const next = content.ranks.ranks[level + 1];
  const close = () => {
    if (locked || closing) return;
    setClosing(true);
    window.setTimeout(() => {
      ref.current?.close();
      setShown(null);
      dismiss();
    }, CLOSE_MS);
  };

  return (
    <dialog
      ref={ref}
      className={s.rankUp}
      data-closing={closing}
      aria-labelledby="rank-up-title"
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
    >
      <div className={s.rankStage}>
        <span className={s.burst} aria-hidden="true" />
        {[112, 84, 56].map((size, i) => (
          <span
            key={size}
            className={s.ring}
            data-ring={i}
            style={{ width: size, height: size }}
            aria-hidden="true"
          />
        ))}
        <span className={s.rankNumber} aria-hidden="true">
          {String(level + 1).padStart(2, '0')}
        </span>
      </div>
      <p className={`${ui.label} ${s.rankKicker}`}>{u('rank.new')}</p>
      <h2 id="rank-up-title" className={`${ui.display} ${s.rankTitle}`}>
        {t(rank.name)}
      </h2>
      {rank.reward && (
        <ul className={`${ui.label} ${s.rewards}`}>
          <li>
            <Diamond size={7} /> {t(rank.reward)}
          </li>
        </ul>
      )}
      <Button
        variant="primary"
        kbd={u('boot.enter')}
        onClick={close}
        aria-disabled={locked}
        className={s.rankButton}
        autoFocus
      >
        {u('rank.continue')}
      </Button>
      <p className={`${ui.label} ${s.rankNext}`}>
        {next ? u('rank.next', { name: t(next.name), xp: next.xp }) : u('rank.max')}
      </p>
    </dialog>
  );
}
