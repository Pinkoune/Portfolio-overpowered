import { content } from '../../content/index.ts';
import { useT } from '../../i18n/useT.ts';
import { useStore } from '../../state/store.ts';
import { Hotspot } from '../Hotspot.tsx';
import { accent, flat, glow, hull } from '../models/materials.ts';
import { Box } from '../objects/Box.tsx';

// Du plus ancien (à gauche) au plus récent (à droite), comme on lit une frise.
const entries = [...content.journey].reverse();
const SPAN = 6.8;

/** PK-05 · Journal de bord : le parcours en frise lumineuse, une balise par étape. */
export function Logbook({ active }: { active: boolean }) {
  const { date } = useT();
  const openPanel = useStore((s) => s.openPanel);
  const step = SPAN / Math.max(1, entries.length - 1);

  return (
    <group position={[0, 0, -3.2]}>
      <Box size={[SPAN, 0.025, 0.025]} position={[0, 1.4, 0]} material={glow(accent.pink)} />
      {entries.map((entry, i) => {
        const x = -SPAN / 2 + i * step;
        const current = entry.end === 'present';
        return (
          <group key={entry.id} position={[x, 1.4, 0]}>
            <mesh material={current ? glow(accent.pink) : flat(hull.h600, accent.pink, 0.2)}>
              <octahedronGeometry args={[0.13, 0]} />
            </mesh>
            <Box
              size={[0.015, 0.5, 0.015]}
              position={[0, i % 2 ? -0.3 : 0.3, 0]}
              material={glow(accent.pinkDeep)}
            />
            {active && (
              <Hotspot
                position={[0, i % 2 ? -0.6 : 0.6, 0.05]}
                side={i > entries.length / 2 ? 'left' : 'right'}
                code={date(entry.start).toUpperCase()}
                label={entry.organization}
                onActivate={() => openPanel({ kind: 'journey', id: entry.id })}
              />
            )}
          </group>
        );
      })}
      {/* Pupitre */}
      <Box size={[1.2, 1.0, 0.7]} position={[3.9, 0.5, 1.6]} material={flat(hull.h700)} />
      <Box
        size={[0.9, 0.05, 0.6]}
        position={[3.9, 1.05, 1.6]}
        rotation={[-0.3, 0, 0]}
        material={flat(hull.line)}
      />
    </group>
  );
}
