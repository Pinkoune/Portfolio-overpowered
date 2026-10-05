import { content } from '../../content/index.ts';
import { useT } from '../../i18n/useT.ts';
import { useStore } from '../../state/store.ts';
import { ProjectCapture } from '../../ui/ProjectCapture.tsx';
import { Diamond, TodoBadges } from '../../ui/primitives.tsx';
import { ui } from '../../ui/styles.ts';
import s from '../classic.module.css';
import { roomById } from '../rooms.ts';
import { SectionHeader } from '../SectionHeader.tsx';

const active = content.projects.filter((p) => !p.archived);
const archived = content.projects.filter((p) => p.archived);

/** Carte stellaire · projets, puis la ceinture d'archives. */
export function Projects() {
  const { t, ui: u } = useT();
  const openPanel = useStore((st) => st.openPanel);
  const onOpen = (id: string) => openPanel({ kind: 'project', id });
  return (
    <section id="starmap" className={s.section} aria-labelledby="starmap-title">
      <SectionHeader room={roomById.starmap} id="starmap-title" />

      <ul className={s.projectGrid}>
        {active.map((project) => (
          <li key={project.id} className={s.projectCard}>
            <ProjectCapture project={project} />
            <div className={s.projectBody}>
              <div className={s.projectTitleRow}>
                <h3 className={`${ui.display} ${s.projectTitle}`}>
                  <button type="button" className={s.stretched} onClick={() => onOpen(project.id)}>
                    {project.title}
                    <span className="visually-hidden"> — {u('projects.open')}</span>
                  </button>
                </h3>
                <span className={`${ui.label} ${s.dim}`}>
                  {project.year ?? u(`projects.context.${project.context}`)}
                </span>
              </div>
              <p className={s.projectSummary}>{t(project.summary)}</p>
              <p className={`${ui.label} ${s.stackLine}`}>
                {project.stack.slice(0, 4).join(' · ')}
              </p>
              <TodoBadges items={project.todo.filter((k) => k !== 'media')} />
            </div>
          </li>
        ))}
      </ul>

      <div className={s.archives}>
        <h3 className={ui.label}>
          <Diamond size={7} variant="outline" color="var(--pk-text-dim)" /> {u('projects.archives')}
        </h3>
        <p className={s.dim}>{u('projects.archivesIntro')}</p>
        <ul>
          {archived.map((project) => (
            <li key={project.id}>
              <button type="button" className={s.archiveRow} onClick={() => onOpen(project.id)}>
                <span className={ui.display}>{project.title}</span>
                <span className={s.dim}>{t(project.summary)}</span>
                <span className={`${ui.label} ${s.dim}`}>{project.stack.join(' · ')}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
