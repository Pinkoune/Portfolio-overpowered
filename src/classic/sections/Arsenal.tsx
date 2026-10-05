import { content } from '../../content/index.ts';
import { useT } from '../../i18n/useT.ts';
import { LevelGauge } from '../../ui/primitives.tsx';
import { ui } from '../../ui/styles.ts';
import s from '../classic.module.css';
import { roomById } from '../rooms.ts';
import { SectionHeader } from '../SectionHeader.tsx';

/** Arsenal · compétences, par râtelier (catégorie), niveau en losanges. */
export function Arsenal() {
  const { t, name } = useT();
  return (
    <section id="arsenal" className={s.section} aria-labelledby="arsenal-title">
      <SectionHeader room={roomById.arsenal} id="arsenal-title" />
      <div className={s.racks}>
        {content.skills.map((category) => (
          <article key={category.id} className={s.rack}>
            <header>
              <span className={`${ui.label} ${s.pink}`}>{category.code}</span>
              <h3 className={`${ui.display} ${s.rackTitle}`}>{t(category.name)}</h3>
              <p className={s.dim}>{t(category.description)}</p>
            </header>
            <ul className={s.skillList}>
              {category.skills.map((skill) => (
                <li key={name(skill.name)} className={s.skill}>
                  <span>
                    {name(skill.name)}
                    {skill.note && <span className={s.skillNote}>{t(skill.note)}</span>}
                  </span>
                  {skill.level && <LevelGauge level={skill.level} />}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
