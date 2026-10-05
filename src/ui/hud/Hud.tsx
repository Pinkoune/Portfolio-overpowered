import { useEffect, useState } from 'react';
import { content } from '../../content/index.ts';
import { useT } from '../../i18n/useT.ts';
import { useStore } from '../../state/store.ts';
import { AchievementCounter, RankBadge } from '../game/RankBadge.tsx';
import { Button, Diamond, LangSwitch } from '../primitives.tsx';
import { ui } from '../styles.ts';
import s from './Hud.module.css';

/*
 * HUD à bord (design/Pinkoune HUD.dc.html, anatomie D). Phase 2 : salle courante, langue,
 * mode classique, plan du vaisseau, bulle de Pinkoune. Rang, XP, succès et son arrivent ensuite.
 */

function RoomTitle() {
  const { t } = useT();
  const roomId = useStore((st) => st.room);
  const room = content.rooms.find((r) => r.id === roomId)!;
  return (
    <p className={`${ui.label} ${s.title} ${s.fades}`} aria-live="polite">
      <span className={s.rule} aria-hidden="true" />
      <span className={s.dim}>{room.code}</span>
      <span>{t(room.name)}</span>
      <span className={s.rule} aria-hidden="true" />
    </p>
  );
}

/** Plan du vaisseau : 7 losanges reliés ; plein = ici, contour = visité, gris = jamais vu. */
function ShipMap() {
  const { t, ui: u } = useT();
  const current = useStore((st) => st.room);
  const visited = useStore((st) => st.visited);
  const goTo = useStore((st) => st.goTo);
  const index = content.rooms.findIndex((r) => r.id === current);
  const room = content.rooms[index]!;
  const step = (delta: number) => {
    const next = content.rooms[index + delta];
    if (next) goTo(next.id);
  };

  return (
    <nav className={s.map} aria-label={u('hud.map')}>
      <button
        type="button"
        className={s.arrow}
        onClick={() => step(-1)}
        disabled={index === 0}
        aria-label={u('hud.prev')}
      >
        ‹
      </button>
      <ol className={s.track}>
        {content.rooms.map((r) => {
          const here = r.id === current;
          const seen = visited.includes(r.id);
          return (
            <li key={r.id}>
              <button
                type="button"
                className={s.stop}
                aria-current={here ? 'location' : undefined}
                onClick={() => goTo(r.id)}
              >
                <span className={s.marker} data-state={here ? 'here' : seen ? 'seen' : 'new'}>
                  <Diamond
                    size={here ? 11 : 10}
                    variant={here ? 'filled' : seen ? 'outline' : 'locked'}
                  />
                </span>
                <span className={`${ui.label} ${s.name}`}>
                  <span className="visually-hidden">{r.code} · </span>
                  {t(r.name)}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
      <p className={`${ui.label} ${s.mobileName}`} aria-hidden="true">
        {room.code} · {t(room.name)}
      </p>
      <button
        type="button"
        className={s.arrow}
        onClick={() => step(1)}
        disabled={index === content.rooms.length - 1}
        aria-label={u('hud.next')}
      >
        ›
      </button>
    </nav>
  );
}

/** Bulle de Pinkoune : 2 lignes max, se ferme seule après 6 s (DA, HUD n° 8). */
function Companion() {
  const { t, ui: u } = useT();
  const roomId = useStore((st) => st.room);
  const traveling = useStore((st) => st.traveling);
  const [dismissed, setDismissed] = useState<string | null>(null);
  const room = content.rooms.find((r) => r.id === roomId)!;

  useEffect(() => {
    if (traveling) return;
    const timer = window.setTimeout(() => setDismissed(roomId), 6000);
    return () => window.clearTimeout(timer);
  }, [roomId, traveling]);

  if (traveling || dismissed === roomId) return null;
  return (
    <aside className={s.companion} key={roomId}>
      <p className={`${ui.label} ${s.who}`}>
        <Diamond size={7} />
        {content.penguin.name} · {u('hud.pilot')}
      </p>
      <p className={s.line}>{t(room.penguin)}</p>
      <button
        type="button"
        className={s.dismiss}
        onClick={() => setDismissed(roomId)}
        aria-label={u('hud.dismiss')}
      >
        ×
      </button>
    </aside>
  );
}

export function Hud() {
  const { ui: u } = useT();
  const setPreferredMode = useStore((st) => st.setPreferredMode);
  const traveling = useStore((st) => st.traveling);
  return (
    <div className={s.hud} data-traveling={traveling}>
      <p className="visually-hidden">{u('hud.keys')}</p>
      <div className={`${s.brand} ${s.fades}`}>
        <RankBadge />
      </div>
      <RoomTitle />
      <div className={`${s.controls} ${s.fades}`}>
        <AchievementCounter />
        <LangSwitch />
        <Button onClick={() => setPreferredMode('classic')} kbd="C">
          {u('hud.classic')}
        </Button>
      </div>
      <Companion />
      <ShipMap />
    </div>
  );
}
