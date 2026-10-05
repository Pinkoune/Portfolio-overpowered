import { content } from '../../content/index.ts';
import { useT } from '../../i18n/useT.ts';
import { ButtonLink } from '../../ui/primitives.tsx';
import { ui } from '../../ui/styles.ts';
import s from '../classic.module.css';
import { roomById } from '../rooms.ts';

const room = roomById.comms;
const sourceUrl = content.projects.find((p) => p.id === 'portfolio')?.links.repo;

/** Comms · contact (LinkedIn, GitHub), puis pied de page. */
export function Comms() {
  const { t, ui: u } = useT();
  return (
    <footer id="comms" className={s.comms} aria-labelledby="comms-title">
      <div className={s.commsMain}>
        <p className={ui.kicker}>
          {room.code} · {t(room.name)}
        </p>
        <h2 id="comms-title" className={`${ui.display} ${s.commsTitle}`}>
          {u('comms.title')}
        </h2>
        <p className={s.dim}>{u('comms.text')}</p>
        <ul className={s.actions}>
          {content.profile.links.map((link, i) => (
            <li key={link.id}>
              <ButtonLink variant={i === 0 ? 'holo' : 'secondary'} href={link.url}>
                {link.label} · {link.handle} ↗
              </ButtonLink>
            </li>
          ))}
        </ul>
      </div>
      <p className={`${ui.label} ${s.dim} ${s.colophon}`}>
        © {new Date().getFullYear()} {content.profile.alias} · {u('footer.made')}
        {sourceUrl && (
          <>
            {' · '}
            <a href={sourceUrl} target="_blank" rel="noopener noreferrer">
              {u('footer.source')}
            </a>
          </>
        )}
      </p>
    </footer>
  );
}
