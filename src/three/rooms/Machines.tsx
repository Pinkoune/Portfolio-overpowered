import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Group, Mesh } from 'three';
import { content } from '../../content/index.ts';
import { useT } from '../../i18n/useT.ts';
import { useStore } from '../../state/store.ts';
import { Hotspot } from '../Hotspot.tsx';
import { accent, flat, glow, hull } from '../models/materials.ts';
import { Box } from '../objects/Box.tsx';

const LED_COLORS = [accent.pink, accent.amber, accent.holo];
const steps = content.machines.pipeline;
const PIPE_X0 = -1.4;
const PIPE_STEP = 0.9;

/** PK-04 · Salle des machines : baies du homelab, chaîne de livraison, terminal du PK-01. */
export function Machines({ active, reducedMotion }: { active: boolean; reducedMotion: boolean }) {
  const { ui } = useT();
  const openPanel = useStore((s) => s.openPanel);
  const blink = useRef<Group>(null);
  const pulse = useRef<Mesh>(null);
  const homelab = content.projects.find((p) => p.id === 'homelab');
  const portfolio = content.projects.find((p) => p.id === 'portfolio');

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (blink.current) blink.current.visible = reducedMotion || Math.sin(t * 5.3) > -0.3;
    if (pulse.current) {
      const k = reducedMotion ? 1 : (t * 0.35) % 1;
      pulse.current.position.x = PIPE_X0 + k * PIPE_STEP * (steps.length - 1);
    }
  });

  return (
    <group>
      {/* Baies serveur */}
      {[-3.9, -2.85].map((x, r) => (
        <group key={x} position={[x, 0, -3.3]} rotation={[0, 0.3, 0]}>
          <Box size={[1.05, 2.7, 0.95]} position={[0, 1.35, 0]} material={flat(hull.h700)} />
          {Array.from({ length: 8 }, (_, row) => (
            <Box
              key={row}
              size={[0.85, 0.2, 0.02]}
              position={[0, 0.45 + row * 0.28, 0.48]}
              material={flat(hull.h900)}
            />
          ))}
          <group ref={r === 0 ? blink : undefined}>
            {Array.from({ length: 8 }, (_, row) => (
              <Box
                key={row}
                size={[0.06, 0.06, 0.02]}
                position={[0.3, 0.45 + row * 0.28, 0.5]}
                material={glow(LED_COLORS[(row + r) % 3]!)}
              />
            ))}
          </group>
        </group>
      ))}
      {active && homelab && (
        <Hotspot
          position={[-3.4, 3.0, -3.3]}
          code={ui('projects.context.perso')}
          label={homelab.title}
          onActivate={() => openPanel({ kind: 'project', id: homelab.id })}
        />
      )}

      {/* Chaîne de livraison : un nœud par étape, une impulsion qui la parcourt */}
      <group position={[0, 1.25, -3.6]}>
        <Box
          size={[PIPE_STEP * (steps.length - 1), 0.02, 0.02]}
          position={[PIPE_X0 + (PIPE_STEP * (steps.length - 1)) / 2, 0, 0]}
          material={glow(accent.holo)}
        />
        {steps.map((step, i) => (
          <mesh
            key={step.id}
            position={[PIPE_X0 + i * PIPE_STEP, 0, 0]}
            material={flat(hull.h600, accent.holo, 0.35)}
          >
            <octahedronGeometry args={[0.14, 0]} />
          </mesh>
        ))}
        <mesh ref={pulse} material={glow(accent.pinkSoft)}>
          <octahedronGeometry args={[0.07, 0]} />
        </mesh>
      </group>
      {active && (
        <Hotspot
          position={[PIPE_X0, 1.75, -3.6]}
          label={ui('machines.pipeline')}
          onActivate={() => openPanel({ kind: 'pipeline' })}
        />
      )}

      {/* Terminal : le PK-01 lui-même */}
      <group position={[2.9, 0, -2.6]} rotation={[0, -0.45, 0]}>
        <Box size={[1.6, 0.85, 0.8]} position={[0, 0.42, 0]} material={flat(hull.h700)} />
        <Box
          size={[1.2, 0.8, 0.06]}
          position={[0, 1.35, -0.2]}
          rotation={[-0.15, 0, 0]}
          material={flat(hull.h900)}
        />
        <group position={[0, 1.35, -0.16]} rotation={[-0.15, 0, 0]}>
          <Box
            size={[1.05, 0.62, 0.02]}
            position={[0, 0, 0]}
            material={flat(hull.h900, accent.holo, 0.12)}
          />
          {[0.18, 0.06, -0.06, -0.18].map((y, k) => (
            <Box
              key={y}
              size={[0.3 + ((k * 0.37) % 0.5), 0.025, 0.01]}
              position={[-0.35 + (0.3 + ((k * 0.37) % 0.5)) / 2, y, 0.02]}
              material={glow(accent.holo)}
            />
          ))}
        </group>
        {active && portfolio && (
          <Hotspot
            position={[0, 2.1, -0.2]}
            side="left"
            code="CI/CD"
            label={portfolio.title}
            onActivate={() => openPanel({ kind: 'project', id: portfolio.id })}
          />
        )}
      </group>
    </group>
  );
}
