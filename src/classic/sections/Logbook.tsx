import { content } from '../../content/index.ts';
import { useT } from '../../i18n/useT.ts';
import { Diamond } from '../../ui/primitives.tsx';
import { ui } from '../../ui/styles.ts';
import s from '../classic.module.css';
import { roomById } from '../rooms.ts';
import { SectionHeader } from '../SectionHeader.tsx';

/** Journal de bord · parcours en timeline, du plus récent au plus ancien. */
export function Logbook() {
  const { t, ui: u, date } = useT();
  return (
    <section id="logbook" className={s.section} aria-labelledby="logbook-title">
      <SectionHeader room={roomById.logbook} id="logbook-title" />
      <ol className={s.timeline}>
        {content.journey.map((entry) => {
          const current = entry.end === 'present';
          const end = entry.end && (current ? u('logbook.present') : date(entry.end));
          const range = end ? `${date(entry.start)} → ${end}` : date(entry.start);
          return (
            <li key={entry.id} className={s.entry}>
              <span className={s.entryMarker}>
                <Diamond size={10} variant={current ? 'filled' : 'outline'} />
              </span>
              <p className={`${ui.label} ${current ? s.pink : s.dim}`}>
                <span className="visually-hidden">{u(`logbook.kind.${entry.kind}`)} · </span>
                {range}
                {entry.duration && ` · ${t(entry.duration)}`}
              </p>
              <h3 className={`${ui.display} ${s.entryTitle}`}>
                {t(entry.title)} · {entry.organization}
              </h3>
              {entry.location && <p className={`${ui.label} ${s.dim}`}>{entry.location}</p>}
              <p className={s.dim}>{t(entry.summary)}</p>
              {entry.highlights.length > 0 && (
                <ul className={s.entryHighlights}>
                  {entry.highlights.map((h, i) => (
                    <li key={i}>{t(h)}</li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
