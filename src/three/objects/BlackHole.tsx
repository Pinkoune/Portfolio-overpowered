import { useFrame, useThree } from '@react-three/fiber';
import { useMemo } from 'react';
import { ShaderMaterial, Vector2, Vector3 } from 'three';
import { BLACKHOLE } from '../layout.ts';
import { blackholeFragment, blackholeVertex } from './blackholeShader.ts';

const projected = new Vector3();
const buffer = new Vector2();

/**
 * Fond de scène : la Pupille, toujours derrière la géométrie. Son centre et sa taille à l'écran
 * suivent la projection de BLACKHOLE.position, ce qui donne la parallaxe à travers les baies.
 */
export function BlackHole({ reducedMotion = false }: { reducedMotion?: boolean }) {
  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: blackholeVertex,
        fragmentShader: blackholeFragment,
        depthTest: false,
        depthWrite: false,
        uniforms: {
          uTime: { value: 0 },
          uSpin: { value: reducedMotion ? 0.25 : 1 },
          uRes: { value: new Vector2(1, 1) },
          uCenter: { value: new Vector2(0.5, 0.5) },
          uScale: { value: 1 },
          uTilt: { value: BLACKHOLE.tilt },
          uFacet: { value: 1 },
          uStars: { value: 0 },
          uGlow: { value: 1 },
        },
      }),
    [reducedMotion],
  );
  const gl = useThree((s) => s.gl);

  useFrame(({ camera, clock }) => {
    const u = material.uniforms;
    u.uTime!.value = clock.elapsedTime;
    gl.getDrawingBufferSize(buffer);
    (u.uRes!.value as Vector2).copy(buffer);

    projected.copy(BLACKHOLE.position).project(camera);
    const behind = projected.z > 1;
    (u.uCenter!.value as Vector2).set(
      behind ? -10 : (projected.x + 1) / 2,
      behind ? -10 : (projected.y + 1) / 2,
    );
    // Taille apparente : rayon d'horizon rs = 0,12 × uScale × hauteur d'écran.
    const distance = camera.position.distanceTo(BLACKHOLE.position);
    const fov = 'fov' in camera ? (camera.fov as number) : 50;
    const halfHeight = distance * Math.tan(((fov / 2) * Math.PI) / 180);
    u.uScale!.value = BLACKHOLE.radius / (0.12 * 2 * halfHeight);
  });

  return (
    <mesh renderOrder={-1000} frustumCulled={false} material={material}>
      <planeGeometry args={[2, 2]} />
    </mesh>
  );
}
