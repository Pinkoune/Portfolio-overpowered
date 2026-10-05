import { useEffect, useState } from 'react';
import { content, type RoomId } from '../content/index.ts';
import { useT } from '../i18n/useT.ts';
import { useStore } from '../state/store.ts';
import { Button, Diamond, LangSwitch } from '../ui/primitives.tsx';
import { ui } from '../ui/styles.ts';
import s from './classic.module.css';

/** Salle dont la section occupe le haut de l'écran, pour aria-current. */
function useActiveSection(ids: string[]) {
  const [active, setActive] = useState(ids[0]);
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) setActive(visible[0]!.target.id);
      },
      { rootMargin: '-30% 0px -60% 0px' },
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [ids]);
  return active;
}

const sectionIds = content.rooms.map((r) => r.id);

export function Header({ can3d }: { can3d: boolean }) {
  const { t, ui: u } = useT();
  const [menuOpen, setMenuOpen] = useState(false);
  const active = useActiveSection(sectionIds);
  const setPreferredMode = useStore((st) => st.setPreferredMode);
  const emit = useStore((st) => st.emit);
  // Lire une section du mode classique compte comme visiter la salle : la progression suit.
  useEffect(() => {
    if (active) emit('room.visit', active);
  }, [active, emit]);
  const goTo = useStore((st) => st.goTo);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  // Toujours cliquable : même si la détection doute de WebGL, on tente ; en cas d'échec, App revient
  // ici avec une explication (Failsafe).
  const board = (
    <Button
      variant="accent"
      title={can3d ? undefined : u('mode.unavailable')}
      onClick={() => {
        setMenuOpen(false);
        if (active) goTo(active as RoomId);
        setPreferredMode('3d');
      }}
    >
      {u('mode.board')}
    </Button>
  );

  return (
    <>
      <header className={s.header}>
        <a className={`${ui.display} ${s.brand}`} href="#bridge">
          <Diamond size={10} />
          {content.profile.alias}
        </a>

        <nav className={s.nav} aria-label={u('nav.primary')}>
          <ul>
            {content.rooms.map((room) => (
              <li key={room.id}>
                <a
                  className={ui.label}
                  href={`#${room.id}`}
                  aria-current={active === room.id ? 'location' : undefined}
                >
                  {t(room.label)}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className={s.headerTools}>
          <LangSwitch />
          <span className={s.boardDesktop}>{board}</span>
          <button
            type="button"
            className={s.menuButton}
            aria-expanded={menuOpen}
            aria-controls="classic-menu"
            aria-label={menuOpen ? u('nav.close') : u('nav.menu')}
            onClick={() => setMenuOpen((o) => !o)}
          >
            <span aria-hidden="true" />
          </button>
        </div>
      </header>

      {/* Hors du <header> : son backdrop-filter piégerait un enfant en position fixe. */}
      {menuOpen && (
        <div id="classic-menu" className={s.menu}>
          <ul>
            {content.rooms.map((room) => (
              <li key={room.id}>
                <a href={`#${room.id}`} onClick={() => setMenuOpen(false)}>
                  <span className={ui.label}>{room.code}</span>
                  <span className={ui.display}>{t(room.label)}</span>
                </a>
              </li>
            ))}
          </ul>
          {board}
        </div>
      )}
    </>
  );
}
