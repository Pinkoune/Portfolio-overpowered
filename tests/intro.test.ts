import { PerspectiveCamera, Vector3 } from 'three';
import { describe, expect, it } from 'vitest';
import { approachLookEnd, approachPath, EXTERIOR, INTRO } from '../src/three/intro.ts';
import { BLACKHOLE } from '../src/three/layout.ts';

/** Caméra du plan final de l'approche, comme la règle IntroDirector (sans dérive). */
function finalCamera(aspect: number) {
  const camera = new PerspectiveCamera(INTRO.fov[1], aspect, 0.1, 2000);
  camera.position.copy(approachPath.getPointAt(1));
  camera.lookAt(approachLookEnd);
  camera.updateMatrixWorld();
  return camera;
}

const onScreen = (point: Vector3, camera: PerspectiveCamera) => point.clone().project(camera);

describe('plan final de l’approche (maquette A)', () => {
  const camera = finalCamera(16 / 9);

  it('garde la Pupille dans la moitié basse, près du centre', () => {
    const p = onScreen(BLACKHOLE.position, camera);
    expect(p.z).toBeLessThan(1);
    expect(p.y).toBeLessThan(-0.2);
    expect(Math.abs(p.x)).toBeLessThan(0.35);
  });

  it('place le vaisseau en haut à droite, dans le cadre', () => {
    const p = onScreen(EXTERIOR.ship, camera);
    expect(p.x).toBeGreaterThan(0.3);
    expect(p.x).toBeLessThan(1);
    expect(p.y).toBeGreaterThan(-0.3);
  });

  it('fait entrer le vaisseau par la droite', () => {
    expect(EXTERIOR.enterFrom.x).toBeGreaterThan(EXTERIOR.ship.x);
  });
});
