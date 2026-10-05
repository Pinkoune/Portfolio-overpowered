import type { Room } from '../content/index.ts';
import { useT } from '../i18n/useT.ts';
import {} from '../ui/primitives.tsx';
import { ui } from '../ui/styles.ts';
import s from './classic.module.css';

/** En-tête de section : nom simple à gauche, code et nom de salle à bord à droite. */
export function SectionHeader({ room, id }: { room: Room; id: string }) {
  const { t } = useT();
  return (
    <header className={s.sectionHead}>
      <div className={s.sectionTitleRow}>
        <h2 id={id} className={`${ui.display} ${s.sectionTitle}`}>
          {t(room.label)}
        </h2>
        <span className={`${ui.label} ${s.sectionCode}`}>
          {room.code} · {t(room.name)}
        </span>
      </div>
      <p className={s.sectionIntro}>{t(room.intro)}</p>
    </header>
  );
}
