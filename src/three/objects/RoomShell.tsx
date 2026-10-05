import { useMemo } from 'react';
import { BufferGeometry, ExtrudeGeometry, Float32BufferAttribute, Path, Shape } from 'three';
import { CORRIDOR, DOOR, ROOM, WINDOW_OUTLINE } from '../layout.ts';
import { accent, flat, glow, hull } from '../models/materials.ts';

/*
 * Coque d'une salle (maquette B, « Le pont ») : baie vitrée octogonale face à la Pupille, parois
 * latérales à pans coupés, nervures, filets roses au sol. Le mur arrière est celui de la coursive.
 */

const { halfWidth: W, halfDepth: D, height: H } = ROOM;

function frontWall() {
  const shape = new Shape();
  shape.moveTo(-W, 0).lineTo(W, 0).lineTo(W, H).lineTo(-W, H).closePath();
  const hole = new Path();
  WINDOW_OUTLINE.forEach(([x, y], i) => (i === 0 ? hole.moveTo(x, y) : hole.lineTo(x, y)));
  hole.closePath();
  shape.holes.push(hole);
  return new ExtrudeGeometry(shape, { depth: 0.25, bevelEnabled: false });
}

function outline(points: [number, number][], z: number) {
  const g = new BufferGeometry();
  g.setAttribute(
    'position',
    new Float32BufferAttribute(
      points.flatMap(([x, y]) => [x, y, z]),
      3,
    ),
  );
  return g;
}

export function RoomShell({ accentColor = accent.pink }: { accentColor?: number }) {
  const wall = useMemo(() => frontWall(), []);
  const frame = useMemo(() => outline(WINDOW_OUTLINE, 0.27), []);
  const shellMat = flat(hull.h800);
  const panelMat = flat(hull.h700);
  const ribMat = flat(hull.h600);
  const floorMat = flat(hull.h900);
  const neon = glow(accentColor);

  return (
    <group>
      {/* Mur avant percé de la baie */}
      <mesh geometry={wall} material={shellMat} position={[0, 0, -D - 0.25]} />
      <lineLoop geometry={frame} position={[0, 0, -D - 0.25]}>
        <lineBasicMaterial color={accentColor} toneMapped={false} />
      </lineLoop>
      {/* Rebord sous la baie */}
      <mesh material={panelMat} position={[0, 0.45, -D + 0.35]}>
        <boxGeometry args={[10.4, 0.9, 0.7]} />
      </mesh>
      <mesh material={neon} position={[0, 0.91, -D + 0.72]}>
        <boxGeometry args={[10.4, 0.02, 0.02]} />
      </mesh>

      {/* Sol, plafond */}
      <mesh material={floorMat} position={[0, -0.05, 0]}>
        <boxGeometry args={[W * 2, 0.1, D * 2]} />
      </mesh>
      {/* Aucune lumière ne vise le plafond : il s'éclaire un peu lui-même pour ne pas virer au noir. */}
      <mesh material={flat(hull.h700, hull.h600, 0.5)} position={[0, H + 0.05, 0]}>
        <boxGeometry args={[W * 2, 0.1, D * 2]} />
      </mesh>

      {[-1, 1].map((side) => (
        <group key={side}>
          {/* Paroi latérale, pans coupés en haut et en bas (silhouette hexagonale du vaisseau) */}
          <mesh material={shellMat} position={[side * (W + 0.1), H / 2, 0]}>
            <boxGeometry args={[0.2, H, D * 2]} />
          </mesh>
          <mesh
            material={panelMat}
            position={[side * (W - 0.55), H - 0.5, 0]}
            rotation={[0, 0, side * -0.75]}
          >
            <boxGeometry args={[0.15, 1.6, D * 2]} />
          </mesh>
          <mesh
            material={panelMat}
            position={[side * (W - 0.45), 0.42, 0]}
            rotation={[0, 0, side * 0.75]}
          >
            <boxGeometry args={[0.15, 1.3, D * 2]} />
          </mesh>
          {/* Filets lumineux au sol, vers la baie */}
          <mesh material={neon} position={[side * (W - 1.05), 0.012, 0]}>
            <boxGeometry args={[0.03, 0.02, D * 2]} />
          </mesh>
          {/* Nervures */}
          {[-3, 0, 3].map((z) => (
            <mesh key={z} material={ribMat} position={[side * (W - 0.05), H / 2, z]}>
              <boxGeometry args={[0.18, H, 0.3]} />
            </mesh>
          ))}
        </group>
      ))}

      {/* Poutres du plafond */}
      {[-3, 0, 3].map((z) => (
        <mesh key={z} material={ribMat} position={[0, H - 0.15, z]}>
          <boxGeometry args={[W * 2, 0.3, 0.25]} />
        </mesh>
      ))}
      <mesh material={glow(accent.pinkSoft)} position={[0, H - 0.31, 0]}>
        <boxGeometry args={[3, 0.02, 0.6]} />
      </mesh>
    </group>
  );
}

/** Coursive arrière commune à toutes les salles, percée d'une porte face à chaque salle. */
export function Corridor({ length, doorsX }: { length: number; doorsX: number[] }) {
  const { z, halfWidth, height } = CORRIDOR;
  const wallFront = useMemo(() => {
    const shape = new Shape();
    const x0 = -W - 2;
    const x1 = length + W + 2;
    shape.moveTo(x0, 0).lineTo(x1, 0).lineTo(x1, H).lineTo(x0, H).closePath();
    for (const x of doorsX) {
      const hole = new Path();
      hole
        .moveTo(x - DOOR.width / 2, 0)
        .lineTo(x + DOOR.width / 2, 0)
        .lineTo(x + DOOR.width / 2, DOOR.height - 0.4)
        .lineTo(x + DOOR.width / 2 - 0.4, DOOR.height)
        .lineTo(x - DOOR.width / 2 + 0.4, DOOR.height)
        .lineTo(x - DOOR.width / 2, DOOR.height - 0.4)
        .closePath();
      shape.holes.push(hole);
    }
    return new ExtrudeGeometry(shape, { depth: 0.2, bevelEnabled: false });
  }, [length, doorsX]);

  const center = length / 2;
  const span = length + W * 2 + 4;
  return (
    <group>
      {/* Mur séparant salles et coursive, percé d'une porte par salle */}
      <mesh geometry={wallFront} material={flat(hull.h800)} position={[0, 0, D]} />
      <mesh material={flat(hull.h900)} position={[center, -0.05, z]}>
        <boxGeometry args={[span, 0.1, halfWidth * 2 + 1]} />
      </mesh>
      <mesh material={flat(hull.h800)} position={[center, height, z]}>
        <boxGeometry args={[span, 0.1, halfWidth * 2 + 1]} />
      </mesh>
      <mesh material={flat(hull.h700)} position={[center, height / 2, z + halfWidth + 0.5]}>
        <boxGeometry args={[span, height, 0.2]} />
      </mesh>
      {/* Bandes lumineuses : roses au sol, douces au plafond */}
      <mesh material={glow(accent.pink)} position={[center, 0.012, z + halfWidth]}>
        <boxGeometry args={[span, 0.02, 0.04]} />
      </mesh>
      <mesh material={glow(accent.pinkSoft)} position={[center, height - 0.06, z]}>
        <boxGeometry args={[span, 0.02, 0.3]} />
      </mesh>
    </group>
  );
}
