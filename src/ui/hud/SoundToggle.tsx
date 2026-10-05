import { useT } from '../../i18n/useT.ts';
import { useStore } from '../../state/store.ts';
import { Button } from '../primitives.tsx';
import s from './Hud.module.css';

/** Bouton son du HUD : égaliseur qui danse quand le son est actif, barres à plat quand il est coupé. */
export function SoundToggle() {
  const { ui: u } = useT();
  const soundOn = useStore((st) => st.soundOn);
  const toggle = useStore((st) => st.toggleSound);
  return (
    <Button
      onClick={toggle}
      aria-pressed={soundOn}
      title={u('sound.label')}
      kbd="S"
      className={s.sound}
    >
      <span className={s.eq} data-on={soundOn} aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} />
        ))}
      </span>
      <span className="visually-hidden">{u('sound.label')}</span>
    </Button>
  );
}
