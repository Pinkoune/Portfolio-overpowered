import { ui } from './styles.ts';
import s from './Hotspot.module.css';

/**
 * Point d'intérêt de la scène (DA, composant « Hotspot ») : losange cyan à pouls lent (2,4 s),
 * filet et libellé. C'est un vrai bouton : atteignable au clavier, lisible par les lecteurs d'écran.
 */
export function HotspotButton({
  code,
  label,
  side = 'right',
  tone = 'holo',
  onActivate,
}: {
  code?: string;
  label: string;
  side?: 'left' | 'right';
  tone?: 'holo' | 'amber';
  onActivate: () => void;
}) {
  return (
    <button
      type="button"
      className={s.hotspot}
      data-side={side}
      data-tone={tone}
      onClick={(e) => {
        e.stopPropagation();
        onActivate();
      }}
    >
      <span className={s.marker} aria-hidden="true">
        <span />
      </span>
      <span className={s.line} aria-hidden="true" />
      <span className={`${ui.label} ${s.text}`}>
        {code && <span className={s.code}>{code}</span>}
        <span>{label}</span>
      </span>
    </button>
  );
}
