import { useFrame } from '@react-three/fiber';
import { useMemo } from 'react';
import { content } from '../../content/index.ts';
import { useT } from '../../i18n/useT.ts';
import { useStore } from '../../state/store.ts';
import { Hotspot } from '../Hotspot.tsx';
import { makeShip } from '../models/ship.ts';
import { accent, flat, glow, hull } from '../models/materials.ts';
import { Box } from '../objects/Box.tsx';
import { Penguin } from '../objects/Penguin.tsx';

/** PK-01 · Pont : Pinkoune aux commandes, la fiche pilote, la Pupille dans la baie. */
export function Bridge({ active }: { active: boolean }) {
  const { ui } = useT();
  const openPanel = useStore((s) => s.openPanel);
  const ship = useMemo(() => makeShip(), []);

  useFrame(({ clock }) => {
    ship.ring.rotation.x = clock.elapsedTime * 0.5;
    ship.group.rotation.y = clock.elapsedTime * 0.25;
  });

  const deck = flat(hull.h700);
  return (
    <group>
      {/* Plateforme de pilotage */}
      <mesh material={flat(hull.h800)} position={[0, 0.05, -2.8]} rotation={[0, Math.PI / 6, 0]}>
        <cylinderGeometry args={[2.6, 2.7, 0.1, 6]} />
      </mesh>
      <Penguin
        active={active}
        arrival="salut"
        onClick={() => useStore.getState().emit('penguin.click')}
        position={[-0.3, 0.1, -2.8]}
        rotation={[0, 0.2, 0]}
        platform
        scale={0.62}
      />

      {/* Console droite : fiche pilote */}
      <group position={[2.4, 0, -2.6]} rotation={[0, -0.35, 0]}>
        <Box size={[2.2, 0.9, 0.9]} position={[0, 0.45, 0]} material={deck} />
        <Box
          size={[2.0, 0.04, 0.7]}
          position={[0, 0.93, 0.05]}
          rotation={[-0.35, 0, 0]}
          material={flat(hull.h900, accent.holo, 0.15)}
        />
        <Box size={[2.0, 0.02, 0.02]} position={[0, 1.04, -0.27]} material={glow(accent.holo)} />
        {active && (
          <Hotspot
            position={[0, 1.55, 0]}
            label={ui('hotspot.profile')}
            code={content.profile.alias}
            onActivate={() => openPanel({ kind: 'profile' })}
          />
        )}
      </group>

      {/* Console gauche : hologramme du PK-01 */}
      <group position={[-2.6, 0, -2.6]} rotation={[0, 0.35, 0]}>
        <Box size={[2.2, 0.9, 0.9]} position={[0, 0.45, 0]} material={deck} />
        <mesh material={flat(hull.h900, accent.pink, 0.3)} position={[0, 0.92, 0]}>
          <cylinderGeometry args={[0.5, 0.5, 0.02, 6]} />
        </mesh>
        <primitive object={ship.group} position={[0, 1.55, 0]} scale={0.28} />
      </group>

      {active && (
        <Hotspot
          position={[3.4, 3.9, -4.6]}
          side="left"
          tone="amber"
          code={ui('pupil.caption')}
          label={ui('pupil.name')}
          onActivate={() => openPanel({ kind: 'pupil' })}
        />
      )}
    </group>
  );
}
