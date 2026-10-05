import type { AnchorHTMLAttributes, ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react';
import type { TODO_KINDS } from '../content/schema.ts';
import { LANGS } from '../i18n/lang.ts';
import { useT } from '../i18n/useT.ts';
import { useStore } from '../state/store.ts';
import s from './ui.module.css';

/*
 * Pièces détachées de la DA (section 04 Composants), partagées par le mode classique et le HUD 3D.
 */

type DiamondVariant = 'filled' | 'outline' | 'locked';

/** Le losange ponctue : plein = actif, contour = disponible, gris = verrouillé. */
export function Diamond({
  size = 9,
  color,
  variant = 'filled',
  className,
}: {
  size?: number;
  color?: string;
  variant?: DiamondVariant;
  className?: string;
}) {
  const style = { '--size': `${size}px`, ...(color && { '--color': color }) } as CSSProperties;
  return (
    <span
      aria-hidden="true"
      className={[s.diamond, className].filter(Boolean).join(' ')}
      data-variant={variant}
      style={style}
    />
  );
}

type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'holo';

interface ButtonOwnProps {
  variant?: ButtonVariant;
  kbd?: string;
  children: ReactNode;
}

export function Button({
  variant = 'secondary',
  kbd,
  children,
  className,
  ...rest
}: ButtonOwnProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...rest}
      className={[s.button, className].filter(Boolean).join(' ')}
      data-variant={variant}
    >
      {children}
      {kbd && (
        <span className={s.kbd} data-kbd aria-hidden="true">
          {kbd}
        </span>
      )}
    </button>
  );
}

export function ButtonLink({
  variant = 'secondary',
  kbd,
  children,
  className,
  ...rest
}: ButtonOwnProps & AnchorHTMLAttributes<HTMLAnchorElement>) {
  const external = rest.href?.startsWith('http');
  return (
    <a
      {...(external && { target: '_blank', rel: 'noopener noreferrer' })}
      {...rest}
      className={[s.button, className].filter(Boolean).join(' ')}
      data-variant={variant}
    >
      {children}
      {kbd && (
        <span className={s.kbd} data-kbd aria-hidden="true">
          {kbd}
        </span>
      )}
    </a>
  );
}

export function Tags({ items, label }: { items: string[]; label?: string }) {
  return (
    <ul className={s.tags} aria-label={label}>
      {items.map((item) => (
        <li key={item} className={s.tag}>
          {item}
        </li>
      ))}
    </ul>
  );
}

/** Éléments à compléter (démo, captures…), affichés discrètement. */
export function TodoBadges({ items }: { items: readonly (typeof TODO_KINDS)[number][] }) {
  const { ui } = useT();
  if (items.length === 0) return null;
  return (
    <ul className={s.tags}>
      {items.map((kind) => (
        <li key={kind} className={s.todo}>
          {ui(`todo.${kind}`)}
        </li>
      ))}
    </ul>
  );
}

/** Niveau de maîtrise sur 5, en losanges. */
export function LevelGauge({ level }: { level: number }) {
  const { ui } = useT();
  const label = ui('skills.level', { n: level });
  return (
    <span className={s.gauge} role="img" aria-label={label} title={label}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Diamond key={i} size={7} variant={i <= level ? 'filled' : 'locked'} />
      ))}
    </span>
  );
}

export function LangSwitch() {
  const { lang, ui } = useT();
  const setLang = useStore((st) => st.setLang);
  return (
    <div className={s.segmented} role="group" aria-label={ui('lang.label')}>
      {LANGS.map((l) => (
        <button key={l} type="button" lang={l} aria-pressed={l === lang} onClick={() => setLang(l)}>
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

/** Cadre holographique : fond translucide, filet cyan, coins en équerre. */
export function HoloCorners() {
  return (
    <>
      {(['tl', 'tr', 'bl', 'br'] as const).map((pos) => (
        <span key={pos} className={s.corner} data-pos={pos} aria-hidden="true" />
      ))}
    </>
  );
}
