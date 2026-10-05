import heroImage from '../../assets/hero.webp';
import { content } from '../../content/index.ts';
import { useT } from '../../i18n/useT.ts';
import { useStore } from '../../state/store.ts';
import { useRank } from '../../ui/game/useRank.ts';
import { ButtonLink, Diamond } from '../../ui/primitives.tsx';
import { ui } from '../../ui/styles.ts';
import s from '../classic.module.css';

const { profile } = content;

/** Pont · à propos : présentation, puis faits marquants et texte long. */
export function Hero() {
  const { t, ui: u } = useT();
  return (
    <section id="bridge" className={s.hero} aria-labelledby="hero-title">
      <div className={s.heroText}>
        <p className={ui.kicker}>
          {profile.name} · {profile.location}
        </p>
        <h1 id="hero-title" className={`${ui.display} ${s.heroTitle}`}>
          {t(profile.tagline)}
        </h1>
        <p className={s.lead}>{t(profile.intro)}</p>
        <div className={s.actions}>
          <ButtonLink variant="primary" href="#starmap">
            {u('hero.ctaProjects')}
          </ButtonLink>
          <ButtonLink href="#comms">{u('hero.ctaContact')}</ButtonLink>
        </div>
      </div>
      <figure className={s.heroFigure}>
        <img
          src={heroImage}
          alt={u('hero.imageAlt')}
          width={1040}
          height={880}
          fetchPriority="high"
        />
      </figure>

      <ProgressStrip />

      <div className={s.about}>
        <dl className={s.facts}>
          {profile.facts.map((fact) => (
            <div key={fact.label.fr}>
              <dt className={ui.label}>{t(fact.label)}</dt>
              <dd>{t(fact.value)}</dd>
            </div>
          ))}
        </dl>
        <div className={s.aboutText}>
          {profile.about.map((p, i) => (
            <p key={i}>{t(p)}</p>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Bande de progression (maquette G) : rang et succès ; ouvre la salle des trophées. */
function ProgressStrip() {
  const { ui: u } = useT();
  const rank = useRank();
  const openPanel = useStore((st) => st.openPanel);
  return (
    <button
      type="button"
      className={`${ui.label} ${s.strip}`}
      onClick={() => openPanel({ kind: 'trophies' })}
    >
      <span className={s.stripRank}>
        <Diamond size={9} />
        {u('progress.rank', { n: rank.code, name: rank.name })}
        <span className={s.dim}>· {u('progress.count', { n: rank.count, total: rank.total })}</span>
      </span>
      <span className={s.dim}>{u('progress.strip')} →</span>
    </button>
  );
}
