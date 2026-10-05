import type { CSSProperties } from 'react';
import { content } from '../../content/index.ts';
import type { RoomId } from '../../content/schema.ts';
import { useT } from '../../i18n/useT.ts';
import { useStore, type Panel } from '../../state/store.ts';
import { HoloPanel, type Pager } from '../HoloPanel.tsx';
import s from '../HoloPanel.module.css';
import { ButtonLink, Diamond, LevelGauge, Tags, TodoBadges } from '../primitives.tsx';
import { ProjectCapture } from '../ProjectCapture.tsx';
import { ui } from '../styles.ts';
import { TrophiesContent } from '../game/Trophies.tsx';
import { ShipTerminal } from './ShipTerminal.tsx';

/*
 * Affiche le panneau demandé par le store (state.panel). Utilisé à bord comme en mode classique :
 * le contenu est le même, seule la position change.
 */

const roomOf: Record<Exclude<Panel['kind'], 'trophies'>, RoomId> = {
  project: 'starmap',
  profile: 'bridge',
  pupil: 'bridge',
  skills: 'arsenal',
  pipeline: 'machines',
  journey: 'logbook',
  passion: 'quarters',
  games: 'quarters',
  contact: 'comms',
};

/** Pagination circulaire dans une liste d'identifiants. */
function cycle(ids: string[], current: string, open: (id: string) => void): Pager {
  const index = Math.max(0, ids.indexOf(current));
  return {
    index,
    total: ids.length,
    onNavigate: (delta) => open(ids[(index + delta + ids.length) % ids.length]!),
  };
}

function Paragraphs({ items }: { items: string[] }) {
  return items.map((text, i) => (
    <p key={i} className={s.text}>
      {text}
    </p>
  ));
}

export function PanelHost({ placement }: { placement: 'center' | 'side' }) {
  const panel = useStore((st) => st.panel);
  const openPanel = useStore((st) => st.openPanel);
  const closePanel = useStore((st) => st.closePanel);
  const emit = useStore((st) => st.emit);
  const linkOpened = () => emit('link.open');
  const { t, ui: u, name, date } = useT();
  if (!panel) return null;

  if (panel.kind === 'trophies') {
    return (
      <HoloPanel
        code={u('trophies.title')}
        title={u('trophies.title')}
        placement={placement}
        onClose={closePanel}
      >
        <TrophiesContent />
      </HoloPanel>
    );
  }

  const room = content.rooms.find((r) => r.id === roomOf[panel.kind])!;
  const code = `${room.code} · ${t(room.name)}`;
  const common = { code, placement, onClose: closePanel };

  switch (panel.kind) {
    case 'project': {
      const project = content.projects.find((p) => p.id === panel.id);
      if (!project) return null;
      const meta = [
        { label: u('projects.contextLabel'), value: u(`projects.context.${project.context}`) },
        { label: u('projects.year'), value: project.year },
        {
          label: u('projects.statusLabel'),
          value: u(`projects.status.${project.status}`),
          live: true,
        },
        { label: u('projects.team'), value: project.team && t(project.team) },
      ].filter((m) => m.value);
      return (
        <HoloPanel
          {...common}
          title={project.title}
          subtitle={t(project.tagline)}
          pager={cycle(
            content.projects.map((p) => p.id),
            project.id,
            (id) => openPanel({ kind: 'project', id }),
          )}
          actions={
            <>
              {project.links.repo && (
                <ButtonLink href={project.links.repo}>{u('projects.repo')} ↗</ButtonLink>
              )}
              {project.links.demo && (
                <ButtonLink variant="holo" href={project.links.demo}>
                  {u('projects.demo')} ↗
                </ButtonLink>
              )}
            </>
          }
        >
          <ProjectCapture project={project} />
          <Paragraphs items={project.description.map(t)} />
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
            <ul className={s.highlights} aria-label={u('projects.highlights')}>
              {project.highlights.map((h, i) => (
                <li key={i}>
                  <Diamond size={6} color="var(--pk-holo)" />
                  {t(h)}
                </li>
              ))}
            </ul>
          )}
          <Tags items={project.stack} label={u('projects.stack')} />
          <TodoBadges items={project.todo} />
        </HoloPanel>
      );
    }

    case 'profile': {
      const { profile } = content;
      return (
        <HoloPanel
          {...common}
          title={profile.name}
          subtitle={`${t(profile.role)} · ${profile.location}`}
          actions={profile.links.map((link) => (
            <ButtonLink key={link.id} href={link.url} onClick={linkOpened}>
              {link.label} ↗
            </ButtonLink>
          ))}
        >
          <Paragraphs items={[t(profile.intro), ...profile.about.map(t)]} />
          <dl className={s.meta}>
            {profile.facts.map((fact) => (
              <div key={fact.label.fr}>
                <dt className={ui.label}>{t(fact.label)}</dt>
                <dd>{t(fact.value)}</dd>
              </div>
            ))}
          </dl>
        </HoloPanel>
      );
    }

    case 'pupil':
      return (
        <HoloPanel {...common} title={u('pupil.name')} subtitle={u('pupil.caption')}>
          <Paragraphs items={[u('pupil.text')]} />
        </HoloPanel>
      );

    case 'skills': {
      const category = content.skills.find((c) => c.id === panel.id);
      if (!category) return null;
      return (
        <HoloPanel
          {...common}
          title={t(category.name)}
          subtitle={category.code}
          pager={cycle(
            content.skills.map((c) => c.id),
            category.id,
            (id) => openPanel({ kind: 'skills', id }),
          )}
        >
          <p className={s.text}>{t(category.description)}</p>
          <ul className={s.list}>
            {category.skills.map((skill) => (
              <li key={name(skill.name)} className={s.row}>
                <span>
                  {name(skill.name)}
                  {skill.note && <span className={s.note}>{t(skill.note)}</span>}
                </span>
                {skill.level && <LevelGauge level={skill.level} />}
              </li>
            ))}
          </ul>
        </HoloPanel>
      );
    }

    case 'pipeline': {
      const { machines } = content;
      return (
        <HoloPanel {...common} title={u('machines.pipeline')}>
          <p className={s.text}>{t(machines.intro)}</p>
          <ol className={s.steps}>
            {machines.pipeline.map((step) => (
              <li key={step.id}>
                <strong>
                  {t(step.name)} · <span className={ui.label}>{step.tool}</span>
                </strong>
                <span>{t(step.text)}</span>
              </li>
            ))}
          </ol>
          <ShipTerminal />
          <h3 className={`${ui.label} ${s.subhead}`}>{u('machines.hosting')}</h3>
          <ul className={s.list}>
            {machines.hosting.map((h) => (
              <li key={h.id} className={s.row}>
                <span>
                  {t(h.title)}
                  <span className={s.note}>{t(h.text)}</span>
                </span>
                <span className={ui.label}>{u(`machines.status.${h.status}`)}</span>
              </li>
            ))}
          </ul>
        </HoloPanel>
      );
    }

    case 'journey': {
      const entry = content.journey.find((j) => j.id === panel.id);
      if (!entry) return null;
      const end = entry.end && (entry.end === 'present' ? u('logbook.present') : date(entry.end));
      const range = end ? `${date(entry.start)} → ${end}` : date(entry.start);
      return (
        <HoloPanel
          {...common}
          title={`${t(entry.title)} · ${entry.organization}`}
          subtitle={[range, entry.duration && t(entry.duration), entry.location]
            .filter(Boolean)
            .join(' · ')}
          pager={cycle(
            content.journey.map((j) => j.id),
            entry.id,
            (id) => openPanel({ kind: 'journey', id }),
          )}
        >
          <p className={s.text}>{t(entry.summary)}</p>
          {entry.highlights.length > 0 && (
            <ul className={s.highlights}>
              {entry.highlights.map((h, i) => (
                <li key={i}>
                  <Diamond size={6} color="var(--pk-holo)" />
                  {t(h)}
                </li>
              ))}
            </ul>
          )}
          {entry.tags.length > 0 && <Tags items={entry.tags} />}
        </HoloPanel>
      );
    }

    case 'passion': {
      const passion = content.quarters.passions.find((p) => p.id === panel.id);
      if (!passion) return null;
      return (
        <HoloPanel {...common} title={t(passion.title)}>
          <p className={s.text}>{t(passion.text)}</p>
        </HoloPanel>
      );
    }

    case 'games':
      return (
        <HoloPanel {...common} title={u('quarters.games')}>
          <p className={s.text}>{t(content.quarters.intro)}</p>
          <ul className={s.games}>
            {content.quarters.games.map((game) => (
              <li key={game.name} style={{ '--cover': game.color } as CSSProperties}>
                <strong className={ui.display}>{game.name}</strong>
                <span className={ui.label}>{t(game.genre)}</span>
                {game.note && <span className={s.note}>{t(game.note)}</span>}
              </li>
            ))}
          </ul>
        </HoloPanel>
      );

    case 'contact':
      return (
        <HoloPanel
          {...common}
          title={u('comms.title')}
          actions={content.profile.links.map((link, i) => (
            <ButtonLink
              key={link.id}
              variant={i === 0 ? 'holo' : 'secondary'}
              href={link.url}
              onClick={linkOpened}
            >
              {link.label} · {link.handle} ↗
            </ButtonLink>
          ))}
        >
          <p className={s.text}>{u('comms.text')}</p>
        </HoloPanel>
      );
  }
}
