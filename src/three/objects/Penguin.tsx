import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { makePenguin, makePlatform, pose, type PenguinPose } from '../models/penguin.ts';

/**
 * Pinkoune en 3D (modèle de la DA). La pose de base boucle ; un clic déclenche un salut de 2 s.
 * Les réactions complètes (célébration, cape…) arrivent en phase 5.
 */
export function Penguin({
  pose: basePose = 'idle',
  platform = false,
  onClick,
  ...group
}: {
  pose?: PenguinPose;
  platform?: boolean;
  onClick?: () => void;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
}) {
  const rig = useMemo(() => makePenguin(), []);
  const base = useMemo(() => (platform ? makePlatform() : null), [platform]);
  const waveUntil = useRef(0);
  const clock = useThree((s) => s.clock);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    pose(rig, t < waveUntil.current ? 'salut' : basePose, t);
  });

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    waveUntil.current = clock.elapsedTime + 2;
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
