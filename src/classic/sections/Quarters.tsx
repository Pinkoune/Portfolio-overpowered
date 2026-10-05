import type { CSSProperties } from 'react';
import { content } from '../../content/index.ts';
import { useT } from '../../i18n/useT.ts';
import { Diamond } from '../../ui/primitives.tsx';
import { ui } from '../../ui/styles.ts';
import s from '../classic.module.css';
import { roomById } from '../rooms.ts';
import { SectionHeader } from '../SectionHeader.tsx';

const { quarters } = content;

/** Quartiers · la partie perso. Jaquettes stylisées originales, aucun visuel officiel. */
export function Quarters() {
  const { t, ui: u } = useT();
  return (
    <section id="quarters" className={s.section} aria-labelledby="quarters-title">
      <SectionHeader room={roomById.quarters} id="quarters-title" />
      <p className={s.lead}>{t(quarters.intro)}</p>

      <h3 className={`${ui.label} ${s.subhead}`}>{u('quarters.games')}</h3>
      <ul className={s.shelf}>
        {quarters.games.map((game, i) => (
          <li
            key={game.name}
            className={s.cover}
            style={
              {
                '--cover': game.color ?? 'var(--pk-pink)',
                '--tilt': `${(i % 3) - 1}deg`,
              } as CSSProperties
            }
          >
            <span className={`${ui.display} ${s.coverTitle}`}>{game.name}</span>
            <span className={`${ui.label} ${s.coverGenre}`}>{t(game.genre)}</span>
            {game.note && <span className={s.coverNote}>{t(game.note)}</span>}
          </li>
        ))}
      </ul>

      <h3 className={`${ui.label} ${s.subhead}`}>{u('quarters.passions')}</h3>
      <ul className={s.passions}>
        {quarters.passions.map((passion) => (
          <li key={passion.id}>
            <Diamond size={9} color="var(--pk-amber)" />
            <strong className={ui.display}>{t(passion.title)}</strong>
            <p className={s.dim}>{t(passion.text)}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
