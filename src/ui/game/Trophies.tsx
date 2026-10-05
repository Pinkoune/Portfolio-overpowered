import { useState } from 'react';
import { content } from '../../content/index.ts';
import { useT } from '../../i18n/useT.ts';
import { useStore } from '../../state/store.ts';
import { Diamond } from '../primitives.tsx';
import { ui } from '../styles.ts';
import s from './game.module.css';
import { scopeLabel } from './scope.ts';
import { useRank } from './useRank.ts';

/**
 * Salle des trophées (récapitulatif, DA section 06) : rangs, puis chaque succès. Les secrets
 * restent masqués tant qu'ils ne sont pas débloqués. Toujours accessible, sans verrou.
 */
export function TrophiesContent() {
  const { t, ui: u } = useT();
  const rank = useRank();
  const unlocked = useStore((st) => st.progress.unlocked);
  const reset = useStore((st) => st.resetProgress);
  const [confirming, setConfirming] = useState(false);

  return (
    <>
      <p className={s.trophiesIntro}>{u('trophies.intro')}</p>
      <dl className={s.summary}>
        <div>
          <dt className={ui.label}>{u('hud.rank', { n: rank.code })}</dt>
          <dd className={ui.display}>{rank.name}</dd>
        </div>
        <div>
          <dt className={ui.label}>XP</dt>
          <dd className={ui.display}>{rank.xpLabel}</dd>
        </div>
        <div>
          <dt className={ui.label}>{u('trophies.list')}</dt>
          <dd className={ui.display}>{rank.countLabel}</dd>
        </div>
      </dl>

      <h3 className={`${ui.label} ${s.subhead}`}>{u('trophies.ranks')}</h3>
      <ol className={s.ladder}>
        {content.ranks.ranks.map((r, i) => (
          <li key={r.xp} data-state={i < rank.index ? 'past' : i === rank.index ? 'here' : 'next'}>
            <Diamond size={9} variant={i <= rank.index ? 'filled' : 'locked'} />
            <span className={ui.label}>
              {String(i + 1).padStart(2, '0')} · {rank.format(r.xp)} XP
            </span>
            <span>{t(r.name)}</span>
          </li>
        ))}
      </ol>

      <h3 className={`${ui.label} ${s.subhead}`}>{u('trophies.list')}</h3>
      <ul className={s.grid}>
        {content.achievements.map((a) => {
          const done = unlocked.includes(a.id);
          const hidden = a.secret && !done;
          return (
            <li key={a.id} data-done={done}>
              <p className={`${ui.label} ${s.cardHead}`}>
                <span>{scopeLabel(a, t, u)}</span>
                <span className={s.amber}>+{a.xp}</span>
              </p>
              <p className={`${ui.display} ${s.cardName}`}>
                <Diamond size={8} variant={done ? 'filled' : 'locked'} color="var(--pk-amber)" />
                {hidden ? u('trophies.secret') : t(a.name)}
              </p>
              <p className={s.cardHow}>{hidden ? u('trophies.secretHow') : t(a.how)}</p>
              {done && <span className="visually-hidden">{u('trophies.unlocked')}</span>}
            </li>
          );
        })}
      </ul>

      <button
        type="button"
        className={`${ui.label} ${s.reset}`}
        onClick={() => {
          if (!confirming) return setConfirming(true);
          reset();
          setConfirming(false);
        }}
        onBlur={() => setConfirming(false)}
      >
        {confirming ? u('trophies.resetConfirm') : u('trophies.reset')}
      </button>
    </>
  );
}
