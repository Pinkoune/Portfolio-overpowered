import { useEffect, useId, useRef } from 'react';
import type { Group } from 'three';
import { useHotspots, type HotspotProps } from './hotspots.ts';

/** Ancre un hotspot DOM à une position de la scène (suit l'objet parent s'il bouge). */
export function Hotspot({
  position,
  onActivate,
  ...props
}: HotspotProps & { position: [number, number, number] }) {
  const id = useId();
  const anchor = useRef<Group>(null);
  const action = useRef(onActivate);
  const upsert = useHotspots((s) => s.upsert);
  const remove = useHotspots((s) => s.remove);
  const { code, label, side, tone } = props;

  useEffect(() => {
    action.current = onActivate;
  });

  useEffect(() => {
    if (!anchor.current) return;
    upsert({
      id,
      anchor: anchor.current,
      props: { code, label, side, tone, onActivate: () => action.current() },
    });
  }, [id, upsert, code, label, side, tone]);

  useEffect(() => () => remove(id), [id, remove]);

  return <group ref={anchor} position={position} />;
}
