import { useEffect, useRef, type ReactNode } from 'react';
import { useT } from '../i18n/useT.ts';
import { Diamond, HoloCorners } from './primitives.tsx';
import { ui } from './styles.ts';
import s from './HoloPanel.module.css';

export interface Pager {
  index: number;
  total: number;
  onNavigate: (delta: -1 | 1) => void;
}

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * Panneau holographique (DA « Panneau holo · anatomie ») : en-tête cyan avec le code de salle,
 * titre, contenu défilant, pied avec actions et pagination.
 * Dialogue modal natif : piège le focus, se ferme avec Échap, rend le focus au déclencheur.
 * placement = 'center' (mode classique) ou 'side' (à bord, la scène reste visible).
 */
export function HoloPanel({
  code,
  title,
  subtitle,
  placement = 'center',
  pager,
  actions,
  onClose,
  children,
}: {
  code: string;
  title: string;
  subtitle?: string;
  placement?: 'center' | 'side';
  pager?: Pager;
  actions?: ReactNode;
  onClose: () => void;
  children: ReactNode;
}) {
  const { ui: u } = useT();
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  return (
    <dialog
      ref={ref}
      className={s.dialog}
      data-placement={placement}
      aria-labelledby="holo-panel-title"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) ref.current.close();
      }}
      onKeyDown={(e) => {
        if (!pager) return;
        if (e.key === 'ArrowRight') pager.onNavigate(1);
        if (e.key === 'ArrowLeft') pager.onNavigate(-1);
      }}
    >
      <article className={s.panel}>
        <HoloCorners />
        <header className={s.head}>
          <span className={`${ui.label} ${s.room}`}>
            <Diamond size={7} color="var(--pk-holo)" />
            {code}
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
          <div className={s.titles}>
            <h2 id="holo-panel-title" className={`${ui.display} ${s.title}`}>
              {title}
            </h2>
            {subtitle && <p className={`${ui.label} ${s.tagline}`}>{subtitle}</p>}
          </div>
          {children}
        </div>

        {(actions || pager) && (
          <footer className={s.foot}>
            <div className={s.links}>{actions}</div>
            {pager && pager.total > 1 && (
              <div className={`${ui.label} ${s.pager}`}>
                <button
                  type="button"
                  onClick={() => pager.onNavigate(-1)}
                  aria-label={u('panel.prev')}
                >
                  ‹
                </button>
                <span>
                  {pad(pager.index + 1)} / {pad(pager.total)}
                </span>
                <button
                  type="button"
                  onClick={() => pager.onNavigate(1)}
                  aria-label={u('panel.next')}
                >
                  ›
                </button>
              </div>
            )}
          </footer>
        )}
      </article>
    </dialog>
  );
}
