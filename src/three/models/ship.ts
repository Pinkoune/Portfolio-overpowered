import { BoxGeometry, ConeGeometry, CylinderGeometry, Group, Mesh, TorusGeometry } from 'three';
import { accent, flat, glow, hull } from './materials.ts';

/*
 * Vaisseau PK-01 vu de l'extérieur — portage de makeShip() de design/pinkoune-3d.js :
 * coque hexagonale, nez conique, réacteur rose, aileron, anneau rotatif à feux rose et ambre.
 */
export interface ShipRig {
  group: Group;
  ring: Group;
}

export function makeShip(): ShipRig {
  const g = new Group();
  const shell = flat(hull.shell);
  const plate = flat(hull.plate);
  const dark = flat(hull.h800);
  const pink = glow(accent.pink);
  const amber = glow(accent.amber);

  const body = new CylinderGeometry(0.3, 0.38, 2.6, 6);
  body.rotateZ(Math.PI / 2);
  g.add(new Mesh(body, shell));

  const noseGeometry = new ConeGeometry(0.3, 0.9, 6);
  noseGeometry.rotateZ(-Math.PI / 2);
  const nose = new Mesh(noseGeometry, plate);
  nose.position.x = 1.75;
  g.add(nose);

  const engineGeometry = new CylinderGeometry(0.42, 0.3, 0.45, 6);
  engineGeometry.rotateZ(Math.PI / 2);
  const engine = new Mesh(engineGeometry, dark);
  engine.position.x = -1.5;
  g.add(engine);

  const flameGeometry = new ConeGeometry(0.26, 0.5, 6);
  flameGeometry.rotateZ(Math.PI / 2);
  const flame = new Mesh(flameGeometry, pink);
  flame.position.x = -1.95;
  g.add(flame);

  for (const side of [-1, 1]) {
    const strip = new Mesh(new BoxGeometry(1.5, 0.035, 0.02), pink);
    strip.position.set(0.35, 0.05, 0.33 * side);
    g.add(strip);
  }

  const fin = new Mesh(new BoxGeometry(0.7, 0.5, 0.05), plate);
  fin.position.set(-1.1, 0.4, 0);
  fin.rotation.z = -0.3;
  g.add(fin);

  const ring = new Group();
  const torus = new TorusGeometry(1.2, 0.1, 4, 10);
  torus.rotateY(Math.PI / 2);
  ring.add(new Mesh(torus, plate));
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2 + Math.PI / 4;
    const spoke = new Mesh(new BoxGeometry(0.06, 1.0, 0.06), shell);
    spoke.position.set(0, Math.cos(a) * 0.7, Math.sin(a) * 0.7);
    spoke.rotation.x = -a;
    ring.add(spoke);
  }
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    const lamp = new Mesh(new BoxGeometry(0.12, 0.05, 0.05), i % 3 ? pink : amber);
    lamp.position.set(0.1, Math.cos(a) * 1.2, Math.sin(a) * 1.2);
    ring.add(lamp);
  }
  ring.position.x = -0.25;
  g.add(ring);
  return { group: g, ring };
}
