import heroImage from '../../assets/hero.webp';
import { content } from '../../content/index.ts';
import { useT } from '../../i18n/useT.ts';
import { ButtonLink } from '../../ui/primitives.tsx';
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
