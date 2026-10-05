import { useEffect, useRef, useState } from 'react';
import { content } from '../../content/index.ts';
import { useT } from '../../i18n/useT.ts';
import { useStore, type Toast } from '../../state/store.ts';
import { ui } from '../styles.ts';
import s from './game.module.css';
import { scopeLabel } from './scope.ts';

/** Durée d'affichage d'un toast (DA : reste 4 s), puis sortie de 300 ms. */
const VISIBLE_MS = 4800;
const LEAVE_MS = 300;
const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

/** « +100 XP » qui vole du toast jusqu'à la barre d'XP (Motion IV, 1 200 – 1 750 ms, ease-io). */
function useXpFlight(
  toastRef: React.RefObject<HTMLElement | null>,
  chipRef: React.RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    const bar = document.querySelector('[data-xp-bar]');
    const chip = chipRef.current;
    const toast = toastRef.current;
    if (!bar || !chip || !toast || reduced() || typeof chip.animate !== 'function') return;
    const from = chip.getBoundingClientRect();
    const to = bar.getBoundingClientRect();
    const fly = document.createElement('span');
    fly.textContent = chip.textContent;
    fly.className = s.fly!;
    document.body.appendChild(fly);
    const dx = to.left + to.width * 0.7 - from.left;
    const dy = to.top - from.top;
    const animation = fly.animate(
      [
        { transform: `translate(${from.left}px, ${from.top}px) scale(1)`, opacity: 1 },
        {
          transform: `translate(${from.left + dx * 0.6}px, ${from.top + dy - 40}px) scale(0.85)`,
          opacity: 1,
          offset: 0.55,
        },
        { transform: `translate(${from.left + dx}px, ${from.top + dy}px) scale(0.7)`, opacity: 0 },
      ],
      { duration: 550, delay: 1200, easing: 'cubic-bezier(0.65, 0, 0.35, 1)', fill: 'both' },
    );
    animation.onfinish = () => fly.remove();
    return () => fly.remove();
  }, [toastRef, chipRef]);
}

function ToastCard({ toast }: { toast: Toast }) {
  const { t, ui: u } = useT();
  const dismiss = useStore((st) => st.dismissToast);
  const openPanel = useStore((st) => st.openPanel);
  const unlocked = useStore((st) => st.progress.unlocked);
  const [leaving, setLeaving] = useState(false);
  const ref = useRef<HTMLElement>(null);
  const chip = useRef<HTMLElement>(null);
  const a = content.achievements.find((x) => x.id === toast.achievement)!;
  useXpFlight(ref, chip);

  useEffect(() => {
    const leave = window.setTimeout(() => setLeaving(true), VISIBLE_MS);
    const remove = window.setTimeout(() => dismiss(toast.key), VISIBLE_MS + LEAVE_MS);
    return () => {
      window.clearTimeout(leave);
      window.clearTimeout(remove);
    };
  }, [dismiss, toast.key]);

  const position = unlocked.indexOf(a.id) + 1;
  const inScope = content.achievements.filter((x) => x.scope === a.scope);
  const scopeDone = inScope.filter((x) => unlocked.includes(x.id)).length;
  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <article ref={ref} className={s.toast} data-leaving={leaving}>
      <span className={s.toastLine} aria-hidden="true" />
      <div className={s.toastRow}>
        <span className={s.toastIcon} aria-hidden="true">
          <span />
        </span>
        <div className={s.toastText}>
          <p className={`${ui.label} ${s.toastHead}`}>
            <span>{u('toast.unlocked')}</span>
            <span ref={chip}>+{a.xp} XP</span>
          </p>
          <h2 className={`${ui.display} ${s.toastName}`}>{t(a.name)}</h2>
          <p className={s.toastFlavor}>{t(a.flavor)}</p>
        </div>
      </div>
      <p className={`${ui.label} ${s.toastFoot}`}>
        <span>
          {pad(position)} / {pad(content.achievements.length)} · {scopeLabel(a, t, u)} {scopeDone} /{' '}
          {inScope.length}
        </span>
        <button
          type="button"
          onClick={() => {
            dismiss(toast.key);
            openPanel({ kind: 'trophies' });
          }}
        >
          {u('toast.open')} · T
        </button>
      </p>
    </article>
  );
}

/** Pile de toasts (3 au plus), annoncés poliment aux lecteurs d'écran. */
export function ToastStack() {
  const toasts = useStore((st) => st.toasts);
  return (
    <section className={s.toasts} aria-live="polite">
      {toasts.map((toast) => (
        <ToastCard key={toast.key} toast={toast} />
      ))}
    </section>
  );
}
