import { content } from '../../content/index.ts';
import { useT } from '../../i18n/useT.ts';
import { useStore } from '../../state/store.ts';
import { Diamond, Tags } from '../../ui/primitives.tsx';
import { ui } from '../../ui/styles.ts';
import s from '../classic.module.css';
import { roomById } from '../rooms.ts';
import { SectionHeader } from '../SectionHeader.tsx';

const { machines } = content;
const featured = machines.projects.map((slug) => content.projects.find((p) => p.id === slug)!);

/** Salle des machines · DevOps & homelab, dont la chaîne de livraison de ce site. */
export function Machines() {
  const { t, ui: u } = useT();
  const openPanel = useStore((st) => st.openPanel);
  return (
    <section id="machines" className={s.section} aria-labelledby="machines-title">
      <SectionHeader room={roomById.machines} id="machines-title" />
      <p className={s.lead}>{t(machines.intro)}</p>

      <h3 className={`${ui.label} ${s.subhead}`}>{u('machines.pipeline')}</h3>
      <ol className={s.pipeline}>
        {machines.pipeline.map((step, i) => (
          <li key={step.id} className={s.step}>
            <span className={s.stepMarker}>
              <Diamond
                size={10}
                variant={i === machines.pipeline.length - 1 ? 'filled' : 'outline'}
              />
            </span>
            <span className={`${ui.label} ${s.holoText}`}>{step.tool}</span>
            <span className={`${ui.display} ${s.stepName}`}>{t(step.name)}</span>
            <span className={s.stepText}>{t(step.text)}</span>
          </li>
        ))}
      </ol>

      <div className={s.machinesGrid}>
        <div>
          <h3 className={`${ui.label} ${s.subhead}`}>{u('machines.hosting')}</h3>
          <ul className={s.hosting}>
            {machines.hosting.map((h) => (
              <li key={h.id}>
                <span className={`${ui.label} ${h.status === 'live' ? s.holoText : s.dim}`}>
                  <Diamond
                    size={7}
                    variant={h.status === 'live' ? 'filled' : 'outline'}
                    color={h.status === 'live' ? 'var(--pk-holo)' : 'var(--pk-text-dim)'}
                  />{' '}
                  {u(`machines.status.${h.status}`)}
                </span>
                <strong className={ui.display}>{t(h.title)}</strong>
                <p className={s.dim}>{t(h.text)}</p>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className={`${ui.label} ${s.subhead}`}>{u('machines.featured')}</h3>
          <ul className={s.hosting}>
            {featured.map((project) => (
              <li key={project.id}>
                <button
                  type="button"
                  className={s.featuredButton}
                  onClick={() => openPanel({ kind: 'project', id: project.id })}
                >
                  <strong className={ui.display}>{project.title}</strong>
                  <span className={s.dim}>{t(project.summary)}</span>
                </button>
                <Tags items={project.stack.slice(0, 6)} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
