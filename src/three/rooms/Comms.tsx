import { content } from '../../content/index.ts';
import { useStore } from '../../state/store.ts';
import { Hotspot } from '../Hotspot.tsx';
import { accent, flat, glow, hull } from '../models/materials.ts';
import { Box } from '../objects/Box.tsx';

/** PK-07 · Comms : la console d'émission, une antenne visible par la baie. */
export function Comms({ active }: { active: boolean }) {
  const openPanel = useStore((s) => s.openPanel);
  const links = content.profile.links;

  return (
    <group>
      {/* Console */}
      <group position={[0, 0, -2.4]}>
        <Box size={[5.2, 0.9, 1.0]} position={[0, 0.45, 0]} material={flat(hull.h700)} />
        <Box size={[5.0, 0.03, 0.8]} position={[0, 0.92, 0]} material={flat(hull.h600)} />
        {links.map((link, i) => {
          const x = (i - (links.length - 1) / 2) * 2.2;
          return (
            <group key={link.id} position={[x, 0, 0]}>
              <Box
                size={[1.7, 1.0, 0.06]}
                position={[0, 1.6, -0.3]}
                rotation={[-0.12, 0, 0]}
                material={flat(hull.h900)}
              />
              <group position={[0, 1.6, -0.26]} rotation={[-0.12, 0, 0]}>
                <Box
                  size={[1.5, 0.8, 0.02]}
                  position={[0, 0, 0]}
                  material={flat(hull.h900, i === 0 ? accent.holo : accent.pink, 0.12)}
                />
                {[0.22, 0.08, -0.06, -0.2].map((y, k) => (
                  <Box
                    key={y}
                    size={[k === 0 ? 0.9 : 1.2 - k * 0.2, 0.03, 0.01]}
                    position={[-0.6 + (k === 0 ? 0.45 : (1.2 - k * 0.2) / 2), y, 0.02]}
                    material={glow(i === 0 ? accent.holo : accent.pink)}
                  />
                ))}
              </group>
              {active && (
                <Hotspot
                  position={[0, 2.35, -0.3]}
                  code={link.handle}
                  label={link.label}
                  onActivate={() => openPanel({ kind: 'contact' })}
                />
              )}
            </group>
          );
        })}
      </group>

      {/* Antenne, dehors, devant la baie */}
      <group position={[2.5, 0.6, -9]} rotation={[0.5, -0.4, 0]}>
        <mesh material={flat(hull.plate)}>
          <coneGeometry args={[1.4, 0.6, 8]} />
        </mesh>
        <Box size={[0.08, 1.2, 0.08]} position={[0, 0.6, 0]} material={flat(hull.line)} />
        <mesh material={glow(accent.amber)} position={[0, 1.25, 0]}>
          <octahedronGeometry args={[0.08, 0]} />
        </mesh>
      </group>
    </group>
  );
}
