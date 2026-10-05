import { useFrame, useThree } from '@react-three/fiber';
import { BloomEffect, EffectComposer, EffectPass, RenderPass } from 'postprocessing';
import { useEffect, useMemo } from 'react';
import { HalfFloatType } from 'three';

/*
 * Post-traitement : bloom sur les émissifs (néons, écrans, disque d'accrétion).
 * EffectComposer de `postprocessing` branché directement dans la boucle R3F (priorité 1 : il
 * remplace le rendu par défaut). Seuil haut : seules les vraies sources de lumière diffusent.
 */
export function PostFx({ lite = false }: { lite?: boolean }) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);

  const composer = useMemo(() => {
    const c = new EffectComposer(gl, {
      frameBufferType: HalfFloatType,
      multisampling: lite ? 0 : 4,
    });
    c.addPass(new RenderPass(scene, camera));
    c.addPass(
      new EffectPass(
        camera,
        new BloomEffect({
          luminanceThreshold: 0.62,
          luminanceSmoothing: 0.2,
          intensity: lite ? 0.7 : 0.95,
          radius: 0.72,
          mipmapBlur: true,
          levels: lite ? 5 : 7,
        }),
      ),
    );
    return c;
  }, [gl, scene, camera, lite]);

  useEffect(() => {
    composer.setSize(size.width, size.height);
  }, [composer, size]);

  useEffect(() => () => composer.dispose(), [composer]);

  useFrame((_, delta) => composer.render(delta), 1);
  return null;
}
