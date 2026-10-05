import { useEffect, useRef, useState } from 'react';
import { content } from '../content/index.ts';
import type { RoomId } from '../content/schema.ts';
import { useT } from '../i18n/useT.ts';
import { useStore } from '../state/store.ts';
import { ui } from '../ui/styles.ts';
import s from './TransitionOverlay.module.css';

/*
 * Effets DOM des transitions (DA Motion) :
 * - flash rose 300 ms du sas à l'embarquement (fondu de 600 ms en mouvement réduit) ;
 * - fondu au noir des sauts lointains ;
 * - traits de vitesse dans la coursive ;
 * - carton de salle (1 000 – 1 400 ms) : espacement 0,6 → 0,3 em, filet qui s'étire.
 */

function Flash({ reducedMotion }: { reducedMotion: boolean }) {
  const embarking = useStore((st) => st.embarking);
  const finishEmbark = useStore((st) => st.finishEmbark);
  useEffect(() => {
    if (!embarking) return;
    const timer = window.setTimeout(finishEmbark, reducedMotion ? 300 : 150);
    return () => window.clearTimeout(timer);
  }, [embarking, finishEmbark, reducedMotion]);
  const [key, setKey] = useState(0);
  useEffect(
    () =>
      useStore.subscribe((st, prev) => {
        if (st.embarking && !prev.embarking) setKey((k) => k + 1);
      }),
    [],
  );
  if (key === 0) return null;
  return <div key={key} className={s.flash} data-reduced={reducedMotion} aria-hidden="true" />;
}

function RoomCard() {
  const { t } = useT();
  const room = useStore((st) => st.room);
  const aboard = useStore((st) => st.stage === 'aboard');
  const previous = useRef<RoomId | null>(null);
  const [card, setCard] = useState<{ id: RoomId; n: number } | null>(null);

  useEffect(() => {
    if (!aboard) return;
    if (previous.current && previous.current !== room) {
      setCard((c) => ({ id: room, n: (c?.n ?? 0) + 1 }));
    }
    previous.current = room;
  }, [room, aboard]);

  if (!card) return null;
  const r = content.rooms.find((x) => x.id === card.id)!;
  return (
    <div key={card.n} className={s.card} aria-hidden="true" onAnimationEnd={() => setCard(null)}>
      <span className={`${ui.label} ${s.code}`}>{r.code}</span>
      <span className={`${ui.display} ${s.name}`}>{t(r.name)}</span>
      <span className={s.rule} />
    </div>
  );
}

export function TransitionOverlay({ reducedMotion }: { reducedMotion: boolean }) {
  const fade = useStore((st) => st.fade);
  const traveling = useStore((st) => st.traveling);
  return (
    <div className={s.overlay}>
      {traveling && !reducedMotion && (
        <div className={s.speed} aria-hidden="true">
          {Array.from({ length: 14 }, (_, i) => (
            <span
              key={i}
              style={{ top: `${8 + ((i * 37) % 84)}%`, animationDelay: `${(i % 5) * 70}ms` }}
            />
          ))}
        </div>
      )}
      <div className={s.fade} data-on={fade} aria-hidden="true" />
      <RoomCard />
      <Flash reducedMotion={reducedMotion} />
    </div>
  );
}
