import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { AdditiveBlending, BufferGeometry, Float32BufferAttribute, type Group } from 'three';
import { content } from '../../content/index.ts';
import { useStore } from '../../state/store.ts';
import { Hotspot } from '../Hotspot.tsx';
import { accent, flat, hull } from '../models/materials.ts';

/** Échelle de la carte holographique : orbite du contenu → rayon dans la salle. */
const SCALE = 0.17;

function circle(radius: number, segments = 64) {
  const points: number[] = [];
  for (let i = 0; i < segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    points.push(Math.cos(a) * radius, 0, Math.sin(a) * radius);
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(points, 3));
  return g;
}

/** PK-02 · Carte stellaire : chaque projet est une planète en orbite autour d'une Pupille miniature. */
export function StarMap({ active, reducedMotion }: { active: boolean; reducedMotion: boolean }) {
  const openPanel = useStore((s) => s.openPanel);
  const planets = useRef<(Group | null)[]>([]);
  const orbits = useMemo(() => content.projects.map((p) => circle(p.planet.orbit * SCALE)), []);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime * (reducedMotion ? 0.25 : 1);
    content.projects.forEach((p, i) => {
      const g = planets.current[i];
      if (!g) return;
      const speed = 0.35 / Math.sqrt(p.planet.orbit);
      const a = p.planet.angle + t * speed;
      const r = p.planet.orbit * SCALE;
      g.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
      g.rotation.y = t * 0.6;
    });
  });

  return (
    <group position={[0, 0, -1.6]}>
      {/* Socle et faisceau du projecteur */}
      <mesh material={flat(hull.h700)} position={[0, 0.4, 0]}>
        <cylinderGeometry args={[1.3, 1.45, 0.8, 6]} />
      </mesh>
      <mesh material={flat(hull.h800, accent.holo, 0.45)} position={[0, 0.81, 0]}>
        <cylinderGeometry args={[1.0, 1.0, 0.02, 6]} />
      </mesh>
      <mesh position={[0, 1.45, 0]}>
        <cylinderGeometry args={[2.6, 1.0, 1.3, 6, 1, true]} />
        <meshBasicMaterial
          color={accent.holo}
          transparent
          opacity={0.025}
          blending={AdditiveBlending}
          depthWrite={false}
          side={2}
        />
      </mesh>

      {/* Système, incliné vers le visiteur */}
      <group position={[0, 2.1, 0]} rotation={[0.38, 0, 0]}>
        <mesh material={flat(0x000000)}>
          <icosahedronGeometry args={[0.16, 1]} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.2, 0.42, 24]} />
          <meshBasicMaterial
            color={accent.amber}
            transparent
            opacity={0.85}
            side={2}
            toneMapped={false}
          />
        </mesh>
        {content.projects.map((project, i) => (
          <group key={project.id}>
            <lineLoop geometry={orbits[i]}>
              <lineBasicMaterial
                color={project.archived ? hull.line : accent.holo}
                transparent
                opacity={project.archived ? 0.5 : 0.35}
              />
            </lineLoop>
            <group ref={(g) => void (planets.current[i] = g)}>
              <mesh
                material={flat(project.planet.color, project.planet.color, 0.25)}
                onClick={(e) => {
                  e.stopPropagation();
                  openPanel({ kind: 'project', id: project.id });
                }}
                onPointerOver={() => (document.body.style.cursor = 'pointer')}
                onPointerOut={() => (document.body.style.cursor = '')}
              >
                <icosahedronGeometry args={[project.planet.size * 0.32, 0]} />
              </mesh>
              {active && (
                <Hotspot
                  position={[0, 0.12, 0]}
                  side={i % 2 ? 'left' : 'right'}
                  label={project.title}
                  onActivate={() => openPanel({ kind: 'project', id: project.id })}
                />
              )}
            </group>
          </group>
        ))}
      </group>
    </group>
  );
}
