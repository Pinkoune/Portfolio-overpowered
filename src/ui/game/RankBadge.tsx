import { useT } from '../../i18n/useT.ts';
import { useStore } from '../../state/store.ts';
import { ui } from '../styles.ts';
import s from './game.module.css';
import { useRank } from './useRank.ts';

/**
 * Rang + XP (HUD n° 1) : losange de rang, nom, barre de 3 px. Le gain s'affiche d'abord en rose
 * clair, puis la barre se remplit (Motion IV).
 */
export function RankBadge() {
  const { ui: u } = useT();
  const rank = useRank();
  const openPanel = useStore((st) => st.openPanel);

  return (
    <button
      type="button"
      className={s.rank}
      onClick={() => openPanel({ kind: 'trophies' })}
      aria-label={`${u('progress.rank', { n: rank.code, name: rank.name })} · ${rank.xpLabel} XP`}
    >
      <span className={s.rankMark} aria-hidden="true">
        <span>
          <span>
            <span>{rank.code}</span>
          </span>
        </span>
      </span>
      <span className={s.rankBody} aria-hidden="true">
        <span className={`${ui.label} ${s.rankRow}`}>
          <span>{rank.name}</span>
          <span className={s.dim}>{rank.xpLabel}</span>
        </span>
        <span className={s.track} data-xp-bar>
          {/* Même cible, transitions décalées : le gain apparaît en rose clair, la barre suit. */}
          <span className={s.gain} style={{ width: `${rank.ratio * 100}%` }} />
          <span className={s.fill} style={{ width: `${rank.ratio * 100}%` }} />
        </span>
      </span>
    </button>
  );
}

/** Compteur de succès (HUD n° 3) : ambre ; ouvre la salle des trophées. */
export function AchievementCounter() {
  const { ui: u } = useT();
  const rank = useRank();
  const openPanel = useStore((st) => st.openPanel);
  return (
    <button
      key={rank.count}
      type="button"
      className={s.counter}
      onClick={() => openPanel({ kind: 'trophies' })}
      aria-label={u('hud.achievements', { n: rank.count, total: rank.total })}
      title="T"
    >
      <span className={s.counterMark} aria-hidden="true" />
      <span aria-hidden="true">{rank.countLabel}</span>
    </button>
  );
}
