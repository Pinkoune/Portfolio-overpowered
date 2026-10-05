import { useT } from '../i18n/useT.ts';
import { Diamond } from './primitives.tsx';
import { ui } from './styles.ts';
import s from './Loader.module.css';

/** Écran d'attente pendant le téléchargement du vaisseau (l'intro complète arrive en phase 3). */
export function Loader() {
  const { ui: u } = useT();
  return (
    <div className={s.loader} role="status">
      <Diamond size={14} className={s.pulse} />
      <span className={ui.label}>{u('hud.loading')}</span>
      <span className={s.bar} aria-hidden="true" />
    </div>
  );
}
