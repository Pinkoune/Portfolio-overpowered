import type { Material } from 'three';

type Vec3 = [number, number, number];

/** Boîte low-poly : la brique de base du mobilier. */
export function Box({
  size,
  position,
  rotation,
  material,
}: {
  size: Vec3;
  position: Vec3;
  rotation?: Vec3;
  material: Material;
}) {
  return (
    <mesh position={position} rotation={rotation} material={material}>
      <boxGeometry args={size} />
    </mesh>
  );
}
