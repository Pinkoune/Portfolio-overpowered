import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import { MathUtils, Vector3, type PerspectiveCamera } from 'three';
import { ease } from '../motion/easings.ts';
import { useStore } from '../state/store.ts';
import { approachLookEnd, approachLookStart, approachPath, INTRO, introFx } from './intro.ts';

const look = new Vector3();
const orbit = new Vector3();

/**
 * Pilote la caméra pendant l'approche (stage = boot). Démarre à la première image, saute à l'état
 * « prêt » si le visiteur passe, dérive lentement ensuite, et déclenche seul l'embarquement
 * pour un visiteur connu ou un lien profond.
 */
export function IntroDirector({
  short,
  reducedMotion,
}: {
  short: boolean;
  reducedMotion: boolean;
}) {
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  const start = useRef<number | null>(null);
  const readySent = useRef(false);
  const autoSent = useRef(false);

  useEffect(() => {
    introFx.reveal = short ? 1 : 0;
    introFx.shipIn = short ? 1 : 0;
    return () => {
      introFx.reveal = 1;
      introFx.shipIn = 1;
    };
  }, [short]);

  useFrame(({ clock }) => {
    const store = useStore.getState();
    if (store.stage !== 'boot') return;
    if (start.current === null) {
      start.current = clock.elapsedTime;
      store.setSceneReady();
    }
    let t = clock.elapsedTime - start.current;
    if (short || store.skipIntro) {
      t = Math.max(t, INTRO.duration);
      if (store.skipIntro && t < INTRO.duration + 0.01)
        start.current = clock.elapsedTime - INTRO.duration;
    }

    introFx.reveal = MathUtils.clamp(
      (t - INTRO.ignite[0]) / (INTRO.ignite[1] - INTRO.ignite[0]),
      0,
      1,
    );
    introFx.shipIn = ease.out(
      MathUtils.clamp((t - INTRO.shipEnter[0]) / (INTRO.shipEnter[1] - INTRO.shipEnter[0]), 0, 1),
    );

    const k = Math.min(1, t / INTRO.duration);
    const e = ease.io(k);
    camera.position.copy(approachPath.getPointAt(e));
    look.copy(approachLookStart).lerp(approachLookEnd, MathUtils.smoothstep(k, 0.3, 0.95));

    if (t >= INTRO.duration) {
      // En attendant l'embarquement : lente dérive latérale, le cadrage de la maquette A reste stable.
      const drift = Math.sin((t - INTRO.duration) * 0.18);
      camera.position.add(orbit.set(drift * 6, drift * 1.5, 0));
      if (!readySent.current) {
        readySent.current = true;
        store.setIntroReady();
      }
      if (short && !autoSent.current && t >= INTRO.duration + (reducedMotion ? 0 : INTRO.short)) {
        autoSent.current = true;
        store.embark();
      }
    }

    camera.fov = MathUtils.lerp(
      INTRO.fov[0],
      INTRO.fov[1],
      ease.io(MathUtils.clamp((t - 3.4) / 2.8, 0, 1)),
    );
    camera.updateProjectionMatrix();
    camera.up.set(Math.sin(k * Math.PI) * Math.sin(INTRO.maxRoll), 1, 0).normalize();
    camera.lookAt(look);
  });

  return null;
}
