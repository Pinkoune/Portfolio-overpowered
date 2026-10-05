import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import type { Group, Mesh } from 'three';
import { sound } from '../../audio/sound.ts';
import { content } from '../../content/index.ts';
import { useT } from '../../i18n/useT.ts';
import { useStore } from '../../state/store.ts';
import { Hotspot } from '../Hotspot.tsx';
import { accent, flat, glow, hull } from '../models/materials.ts';
import { Box } from '../objects/Box.tsx';

const passion = (id: string) => content.quarters.passions.find((p) => p.id === id);

const STRINGS = [-0.024, -0.008, 0.008, 0.024];

const pointer = {
  onPointerOver: () => (document.body.style.cursor = 'pointer'),
  onPointerOut: () => (document.body.style.cursor = ''),
};

/** PK-06 · Quartiers : la basse jouable, le casque, l'étagère de jeux, la lunette, la couchette. */
export function Quarters({ active }: { active: boolean }) {
  const { t, ui } = useT();
  const openPanel = useStore((s) => s.openPanel);
  const bass = passion('bass');
  const moto = passion('moto');
  const space = passion('space');
  const strings = useRef<(Mesh | null)[]>([]);
  const helmet = useRef<Group>(null);
  const plucked = useRef(-10);
  const spun = useRef(-10);
  const now = useRef(0);

  // Les cordes vibrent à chaque note, même son coupé.
  useEffect(() => sound.on('bass', () => (plucked.current = now.current)), []);

  useFrame(({ clock }) => {
    const t = (now.current = clock.elapsedTime);
    const dt = t - plucked.current;
    const amp = dt < 1.8 ? 0.012 * Math.exp(-dt * 2.5) : 0;
    strings.current.forEach((m, i) => {
      if (m) m.position.x = STRINGS[i]! + Math.sin(t * (70 + i * 9)) * amp;
    });
    // Casque : un tour complet en 0,9 s, ralenti à la fin.
    if (helmet.current) {
      const k = Math.min(1, (t - spun.current) / 0.9);
      helmet.current.rotation.y = k < 1 ? (1 - (1 - k) ** 3) * Math.PI * 2 : 0;
    }
  });

  const pluck = (e?: ThreeEvent<MouseEvent>) => {
    e?.stopPropagation();
    sound.play('bass');
    useStore.getState().emit('bass.play');
  };
  const spin = () => (spun.current = now.current);

  return (
    <group>
      {/* Couchette superposée contre la cloison gauche, tapis hexagonal au centre */}
      <group position={[-5.0, 0, -2.9]}>
        {[-1.35, 1.35].flatMap((z) =>
          [-0.6, 0.6].map((x) => (
            <Box
              key={`${x}${z}`}
              size={[0.08, 2.4, 0.08]}
              position={[x, 1.2, z]}
              material={flat(hull.line)}
            />
          )),
        )}
        {[0.45, 1.6].map((y) => (
          <group key={y} position={[0, y, 0]}>
            <Box size={[1.2, 0.12, 2.7]} position={[0, 0, 0]} material={flat(hull.h700)} />
            <Box size={[1.1, 0.1, 2.0]} position={[0, 0.1, 0.3]} material={flat(accent.pinkDeep)} />
            <Box size={[0.8, 0.12, 0.4]} position={[0, 0.12, -1.0]} material={flat(accent.core)} />
          </group>
        ))}
        <Box size={[0.04, 0.02, 2.6]} position={[0.62, 1.85, 0]} material={glow(accent.pink)} />
      </group>
      <mesh material={flat(hull.h600)} position={[1.2, 0.012, -2.7]} rotation={[0, Math.PI / 6, 0]}>
        <cylinderGeometry args={[1.1, 1.1, 0.02, 6]} />
      </mesh>
      <mesh material={flat(hull.h800)} position={[1.2, 0.024, -2.7]} rotation={[0, Math.PI / 6, 0]}>
        <cylinderGeometry args={[0.88, 0.88, 0.02, 6]} />
      </mesh>

      {/* Basse sur son stand */}
      <group position={[-3.2, 0, -2.8]} rotation={[0, 0.5, -0.12]} onClick={pluck} {...pointer}>
        <Box size={[0.08, 0.6, 0.3]} position={[0, 0.3, 0]} material={flat(hull.h600)} />
        <mesh material={flat(accent.pinkDeep)} position={[0, 0.95, 0]} scale={[0.85, 1.15, 0.22]}>
          <icosahedronGeometry args={[0.38, 0]} />
        </mesh>
        <Box size={[0.09, 1.25, 0.06]} position={[0, 1.85, 0.03]} material={flat(0x3a2a20)} />
        <Box size={[0.16, 0.24, 0.05]} position={[0, 2.55, 0.03]} material={flat(hull.h900)} />
        {STRINGS.map((x, i) => (
          <mesh
            key={x}
            ref={(m) => {
              strings.current[i] = m;
            }}
            position={[x, 1.6, 0.075]}
            material={glow(accent.core)}
          >
            <boxGeometry args={[0.004, 1.9, 0.004]} />
          </mesh>
        ))}
      </group>
      {active && bass && (
        <Hotspot
          position={[-3.1, 2.9, -2.8]}
          label={t(bass.title)}
          onActivate={() => {
            pluck();
            openPanel({ kind: 'passion', id: bass.id });
          }}
        />
      )}

      {/* Étagère de jeux : une jaquette stylisée par jeu, aux couleurs du contenu */}
      <group position={[-0.6, 0, -3.6]}>
        <Box size={[2.6, 0.06, 0.45]} position={[0, 1.0, 0]} material={flat(hull.h600)} />
        <Box size={[2.6, 0.06, 0.45]} position={[0, 1.6, 0]} material={flat(hull.h600)} />
        <Box size={[0.06, 1.7, 0.45]} position={[-1.3, 0.85, 0]} material={flat(hull.h700)} />
        <Box size={[0.06, 1.7, 0.45]} position={[1.3, 0.85, 0]} material={flat(hull.h700)} />
        {content.quarters.games.map((game, i) => (
          <Box
            key={game.name}
            size={[0.07, 0.42, 0.32]}
            position={[-1.05 + i * 0.16, 1.24, 0]}
            rotation={[0, 0, i === 3 ? -0.18 : 0]}
            material={flat(game.color ?? accent.pink)}
          />
        ))}
      </group>
      {active && (
        <Hotspot
          position={[-0.6, 2.1, -3.6]}
          label={ui('quarters.games')}
          onActivate={() => openPanel({ kind: 'games' })}
        />
      )}

      {/* Casque de moto sur une table basse */}
      <group position={[2.3, 0, -2.6]}>
        <Box size={[1.2, 0.5, 0.8]} position={[0, 0.25, 0]} material={flat(hull.h700)} />
        <group
          ref={helmet}
          position={[0, 0.78, 0]}
          onClick={(e) => {
            e.stopPropagation();
            spin();
            if (moto) openPanel({ kind: 'passion', id: moto.id });
          }}
          {...pointer}
        >
          <mesh material={flat(accent.pink)} scale={[1, 0.95, 1.1]}>
            <icosahedronGeometry args={[0.28, 1]} />
          </mesh>
          <mesh
            material={flat(hull.h900, accent.holo, 0.15)}
            position={[0, 0.02, 0.17]}
            scale={[0.8, 0.5, 0.5]}
          >
            <icosahedronGeometry args={[0.24, 1]} />
          </mesh>
        </group>
      </group>
      {active && moto && (
        <Hotspot
          position={[2.3, 1.5, -2.6]}
          label={t(moto.title)}
          onActivate={() => {
            spin();
            openPanel({ kind: 'passion', id: moto.id });
          }}
        />
      )}

      {/* Lunette pointée vers la Pupille */}
      <group position={[3.7, 0, -3.6]}>
        {[0, 2.1, 4.2].map((a) => (
          <Box
            key={a}
            size={[0.04, 1.4, 0.04]}
            position={[Math.cos(a) * 0.25, 0.65, Math.sin(a) * 0.25]}
            rotation={[Math.sin(a) * 0.2, 0, -Math.cos(a) * 0.2]}
            material={flat(hull.line)}
          />
        ))}
        <mesh material={flat(hull.h600)} position={[0, 1.45, -0.1]} rotation={[-1.1, 0, 0.2]}>
          <cylinderGeometry args={[0.09, 0.13, 1.1, 6]} />
        </mesh>
        <Box size={[0.2, 0.02, 0.02]} position={[0, 1.1, 0.2]} material={glow(accent.amber)} />
      </group>
      {active && space && (
        <Hotspot
          position={[3.7, 2.3, -3.6]}
          side="left"
          tone="amber"
          label={t(space.title)}
          onActivate={() => openPanel({ kind: 'passion', id: space.id })}
        />
      )}
    </group>
  );
}
