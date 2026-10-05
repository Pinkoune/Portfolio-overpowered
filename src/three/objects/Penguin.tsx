import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import { content } from '../../content/index.ts';
import { rankIndex } from '../../game/engine.ts';
import { useStore } from '../../state/store.ts';
import {
  makeCape,
  makeCrown,
  makePenguin,
  makePlatform,
  pose,
  type PenguinPose,
} from '../models/penguin.ts';

const thresholds = content.ranks.ranks.map((r) => r.xp);
/** Rangs (index) qui débloquent les accessoires : 06 Capitaine → cape, 07 Empereur → couronne. */
const CAPE_RANK = 5;
const CROWN_RANK = 6;

/**
 * Pinkoune en 3D (modèle de la DA). Pose de base en boucle ; à l'arrivée dans sa salle, il salue ou
 * désigne ce qu'il faut regarder ; il célèbre les montées de rang ; un clic déclenche un salut.
 * Il porte la cape et la couronne gagnées aux rangs 06 et 07.
 */
export function Penguin({
  pose: basePose = 'idle',
  arrival,
  active = false,
  platform = false,
  onClick,
  ...group
}: {
  pose?: PenguinPose;
  /** Réaction quand sa salle devient active (DA : salut 0,7 s × 3 au pont, « pointe » ailleurs). */
  arrival?: PenguinPose;
  active?: boolean;
  platform?: boolean;
  onClick?: () => void;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
}) {
  const rig = useMemo(() => makePenguin(), []);
  const base = useMemo(() => (platform ? makePlatform() : null), [platform]);
  const cape = useMemo(() => makeCape(), []);
  const crown = useMemo(() => makeCrown(), []);
  const reaction = useRef<{ pose: PenguinPose; until: number }>({ pose: 'idle', until: 0 });
  const clock = useThree((s) => s.clock);
  const rank = useStore((s) => rankIndex(s.progress.xp, thresholds));

  useEffect(() => {
    rig.body.add(cape);
    rig.head.add(crown);
    return () => {
      rig.body.remove(cape);
      rig.head.remove(crown);
    };
  }, [rig, cape, crown]);

  useEffect(() => {
    cape.visible = rank >= CAPE_RANK;
    crown.visible = rank >= CROWN_RANK;
  }, [rank, cape, crown]);

  useEffect(() => {
    if (!active || !arrival) return;
    reaction.current = {
      pose: arrival,
      until: clock.elapsedTime + (arrival === 'salut' ? 2.1 : 3),
    };
  }, [active, arrival, clock]);

  useFrame(({ clock: c }) => {
    const t = c.elapsedTime;
    const celebrating = active && useStore.getState().rankUp !== null;
    const current = celebrating
      ? 'celebre'
      : t < reaction.current.until
        ? reaction.current.pose
        : basePose;
    pose(rig, current, t);
  });

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    reaction.current = { pose: 'salut', until: clock.elapsedTime + 2.1 };
    onClick?.();
  };

  return (
    <group {...group}>
      {base && <primitive object={base} />}
      <primitive
        object={rig.root}
        onClick={handleClick}
        onPointerOver={() => (document.body.style.cursor = 'pointer')}
        onPointerOut={() => (document.body.style.cursor = '')}
      />
    </group>
  );
}
