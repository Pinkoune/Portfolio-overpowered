import { useMemo } from 'react';
import { BufferGeometry, Float32BufferAttribute, Vector3 } from 'three';
import { BLACKHOLE } from '../layout.ts';

/*
 * Champ d'étoiles en 3D (parallaxe réelle quand la caméra se déplace).
 * Lentille gravitationnelle : chaque étoile proche de la Pupille est repoussée vers l'extérieur selon
 * l'équation de la lentille ponctuelle, θ' = (θ + √(θ² + 4θE²)) / 2 — d'où l'anneau d'étoiles serrées
 * autour de l'horizon. Calculé une fois, depuis le centre du vaisseau.
 */

const COUNT = 2600;
const RADIUS = 600;

/** Générateur pseudo-aléatoire déterministe (mulberry32). */
function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function Starfield() {
  const geometry = useMemo(() => {
    const random = rng(42);
    const origin = new Vector3(48, 2, 0);
    const axis = BLACKHOLE.position.clone().sub(origin).normalize();
    const thetaHole = Math.atan(BLACKHOLE.radius / BLACKHOLE.position.distanceTo(origin));
    const thetaE = thetaHole * 1.6;
    const positions: number[] = [];
    const colors: number[] = [];
    const dir = new Vector3();
    const perp = new Vector3();
    for (let i = 0; i < COUNT; i++) {
      // Direction uniforme sur la sphère.
      const u = random() * 2 - 1;
      const phi = random() * Math.PI * 2;
      const r = Math.sqrt(1 - u * u);
      dir.set(r * Math.cos(phi), u, r * Math.sin(phi));

      let theta = dir.angleTo(axis);
      if (theta < thetaE * 6) {
        theta = (theta + Math.sqrt(theta * theta + 4 * thetaE * thetaE)) / 2;
        perp
          .copy(dir)
          .sub(axis.clone().multiplyScalar(dir.dot(axis)))
          .normalize();
        dir.copy(axis).multiplyScalar(Math.cos(theta)).addScaledVector(perp, Math.sin(theta));
      }
      if (theta < thetaHole * 1.15) continue; // rien ne sort de l'horizon

      positions.push(...dir.clone().multiplyScalar(RADIUS).add(origin).toArray());
      const b = 0.35 + 0.65 * random();
      colors.push(0.86 * b, 0.86 * b, b);
    }
    const g = new BufferGeometry();
    g.setAttribute('position', new Float32BufferAttribute(positions, 3));
    g.setAttribute('color', new Float32BufferAttribute(colors, 3));
    return g;
  }, []);

  return (
    <points geometry={geometry} renderOrder={-900} frustumCulled={false}>
      <pointsMaterial
        size={1.6}
        sizeAttenuation={false}
        vertexColors
        depthWrite={false}
        toneMapped={false}
      />
    </points>
  );
}
