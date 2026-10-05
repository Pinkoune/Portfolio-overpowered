import { useEffect, useRef } from 'react';
import { content, type Project } from '../content/index.ts';
import { useT } from '../i18n/useT.ts';
import { ButtonLink, Diamond, HoloCorners, Tags, TodoBadges } from './primitives.tsx';
import { ui } from './styles.ts';
import s from './ProjectSheet.module.css';

const starmap = content.rooms.find((r) => r.id === 'starmap')!;

/** Visuel d'un projet : première capture, sinon emplacement hachuré de la DA. */
export function ProjectCapture({ project, base }: { project: Project; base: string }) {
  const { t, ui: u } = useT();
  const media = project.media[0];
  if (media) return <img className={s.capture} src={base + media.src} alt={t(media.alt)} />;
  return (
    <div className={s.capture} data-empty aria-hidden="true">
      <span className={ui.label}>
        {u('projects.capture')} · {project.title}
      </span>
    </div>
  );
}

/**
 * Fiche projet en panneau holographique (DA « Panneau holo · anatomie »).
 * Dialogue modal natif : piège le focus, se ferme avec Échap, rend le focus au déclencheur.
 */
export function ProjectSheet({
  project,
  position,
  onClose,
  onNavigate,
}: {
  project: Project;
  position: { index: number; total: number };
  onClose: () => void;
  onNavigate: (delta: -1 | 1) => void;
}) {
  const { t, ui: u, name } = useT();
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  const meta = [
    { label: u('projects.contextLabel'), value: u(`projects.context.${project.context}`) },
    { label: u('projects.year'), value: project.year },
    { label: u('projects.statusLabel'), value: u(`projects.status.${project.status}`), live: true },
    { label: u('projects.team'), value: project.team && t(project.team) },
  ].filter((m) => m.value);

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <dialog
      ref={ref}
      className={s.dialog}
      aria-labelledby="project-sheet-title"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) ref.current.close();
      }}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') onNavigate(1);
        if (e.key === 'ArrowLeft') onNavigate(-1);
      }}
    >
      <article className={s.panel}>
        <HoloCorners />
        <header className={s.head}>
          <span className={`${ui.label} ${s.room}`}>
            <Diamond size={7} color="var(--pk-holo)" />
            {starmap.code} · {name(starmap.name)}
          </span>
          <button
            type="button"
            className={`${ui.label} ${s.close}`}
            onClick={() => ref.current?.close()}
          >
            {u('dialog.close')} · <span aria-hidden="true">Échap</span>
          </button>
        </header>
        <div className={s.rule} />

        <div className={s.body}>
          <ProjectCapture project={project} base={import.meta.env.BASE_URL} />
          <div className={s.titles}>
            <h2 id="project-sheet-title" className={`${ui.display} ${s.title}`}>
              {project.title}
            </h2>
            <p className={`${ui.label} ${s.tagline}`}>{t(project.tagline)}</p>
          </div>

          {project.description.map((p, i) => (
            <p key={i} className={s.text}>
              {t(p)}
            </p>
          ))}

          <dl className={s.meta}>
            {meta.map((m) => (
              <div key={m.label}>
                <dt className={ui.label}>{m.label}</dt>
                <dd className={ui.label}>
                  {m.live && <Diamond size={6} color="var(--pk-holo)" />}
                  {m.value}
                </dd>
              </div>
            ))}
          </dl>

          {project.highlights.length > 0 && (
            <section aria-label={u('projects.highlights')}>
              <ul className={s.highlights}>
                {project.highlights.map((h, i) => (
                  <li key={i}>
                    <Diamond size={6} color="var(--pk-holo)" />
                    {t(h)}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <Tags items={project.stack} label={u('projects.stack')} />
          <TodoBadges items={project.todo} />
        </div>

        <footer className={s.foot}>
          <div className={s.links}>
            {project.links.repo && (
              <ButtonLink href={project.links.repo}>{u('projects.repo')} ↗</ButtonLink>
            )}
            {project.links.demo && (
              <ButtonLink variant="holo" href={project.links.demo}>
                {u('projects.demo')} ↗
              </ButtonLink>
            )}
          </div>
          <div className={`${ui.label} ${s.pager}`}>
            <button type="button" onClick={() => onNavigate(-1)} aria-label={u('projects.prev')}>
              ‹
            </button>
            <span>
              {pad(position.index + 1)} / {pad(position.total)}
            </span>
            <button type="button" onClick={() => onNavigate(1)} aria-label={u('projects.next')}>
              ›
            </button>
          </div>
        </footer>
      </article>
    </dialog>
  );
}
