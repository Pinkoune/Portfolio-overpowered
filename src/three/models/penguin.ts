import {
  BoxGeometry,
  ConeGeometry,
  CylinderGeometry,
  Group,
  IcosahedronGeometry,
  LatheGeometry,
  Mesh,
  TorusGeometry,
  Vector2,
} from 'three';
import { penguinColors } from '../../design/tokens.ts';
import { flat, glow } from './materials.ts';

/*
 * Pinkoune, pilote — portage de makePenguin() / makePlatform() / pose() de design/pinkoune-3d.js.
 * Le rig expose les mêmes nœuds que la future version .glb (root, body, head, flipper_L, flipper_R) :
 * remplacer la source du modèle ne touche pas aux animations.
 */

export interface PenguinRig {
  root: Group;
  body: Group;
  head: Group;
  /** flipper_L / flipper_R de la DA. */
  fl: Group;
  fr: Group;
}

export type PenguinPose = 'idle' | 'salut' | 'pointe' | 'pointe-d';

export function makePenguin(): PenguinRig {
  const root = new Group();
  const body = new Group();
  const head = new Group();
  root.name = 'root';
  body.name = 'body';
  head.name = 'head';

  const pink = flat(penguinColors.body);
  const deep = flat(penguinColors.flippers);
  const plume = flat(penguinColors.belly);
  const amber = flat(penguinColors.beak, 0x3a2000);
  const ink = flat(0x14121f);
  const white = flat(0xffffff, 0xffffff, 0.18);
  const shine = flat(0xffffff, 0xffffff, 0.6);
  const cheek = flat(penguinColors.cheeks);

  const profile = [
    [0.001, 0],
    [0.42, 0.04],
    [0.66, 0.3],
    [0.74, 0.7],
    [0.71, 1.1],
    [0.58, 1.46],
    [0.34, 1.76],
    [0.001, 1.86],
  ].map(([x, y]) => new Vector2(x, y));
  body.add(new Mesh(new LatheGeometry(profile, 10), pink));

  const belly = new Mesh(new IcosahedronGeometry(1, 2), plume);
  belly.scale.set(0.62, 0.78, 0.52);
  belly.position.set(0, 0.74, 0.3);
  body.add(belly);

  for (const sx of [-1, 1]) {
    const eyeWhite = new Mesh(new IcosahedronGeometry(0.115, 1), white);
    eyeWhite.scale.set(1, 1.1, 0.4);
    eyeWhite.position.set(0.17 * sx, 0.14, 0.53);
    const pupil = new Mesh(new IcosahedronGeometry(0.07, 1), ink);
    pupil.scale.set(1, 1.1, 0.4);
    pupil.position.set(0.165 * sx, 0.12, 0.58);
    const highlight = new Mesh(new IcosahedronGeometry(0.024, 0), shine);
    highlight.scale.set(1, 1, 0.4);
    highlight.position.set(0.165 * sx + 0.025, 0.155, 0.61);
    const cheekMesh = new Mesh(new IcosahedronGeometry(0.07, 1), cheek);
    cheekMesh.scale.set(1.1, 0.6, 0.3);
    cheekMesh.position.set(0.29 * sx, -0.03, 0.55);
    head.add(eyeWhite, pupil, highlight, cheekMesh);
  }

  const beakGeometry = new ConeGeometry(0.08, 0.13, 6);
  beakGeometry.rotateX(Math.PI / 2);
  beakGeometry.scale(1.5, 0.7, 1);
  const beak = new Mesh(beakGeometry, amber);
  beak.position.set(0, -0.02, 0.66);
  head.add(beak);
  head.position.y = 1.4;
  body.add(head);

  const fl = new Group();
  const fr = new Group();
  fl.name = 'flipper_L';
  fr.name = 'flipper_R';
  const flipper = new ConeGeometry(0.16, 0.85, 4);
  flipper.rotateZ(Math.PI);
  flipper.translate(0, -0.42, 0);
  flipper.scale(1, 1, 0.35);
  fl.add(new Mesh(flipper, deep));
  fr.add(new Mesh(flipper, deep));
  fl.position.set(0.68, 1.18, 0);
  fr.position.set(-0.68, 1.18, 0);
  body.add(fl, fr);
  root.add(body);

  for (const sx of [-1, 1]) {
    const foot = new Mesh(new BoxGeometry(0.26, 0.07, 0.36), amber);
    foot.position.set(0.24 * sx, 0.035, 0.28);
    foot.rotation.y = 0.25 * sx;
    root.add(foot);
  }

  root.traverse((o) => {
    if (o instanceof Mesh) o.castShadow = false;
  });
  return { root, body, head, fl, fr };
}

/** Socle hexagonal à liseré rose (DA, turnaround). */
export function makePlatform(): Group {
  const g = new Group();
  const plate = new Mesh(new CylinderGeometry(0.95, 1.02, 0.1, 6), flat(0x201f36));
  plate.position.y = -0.05;
  const ring = new Mesh(new TorusGeometry(0.99, 0.014, 3, 6), glow(0xff5fa2));
  ring.rotation.x = Math.PI / 2;
  ring.rotation.z = Math.PI / 6;
  ring.position.y = 0.005;
  g.add(plate, ring);
  g.rotation.y = Math.PI / 6;
  return g;
}

/** Poses en boucle de la DA : respiration 2,8 s, salut, pointe (vers la gauche ou la droite). */
export function pose(rig: PenguinRig, name: PenguinPose, t: number) {
  const s = Math.sin(t * 2.2);
  rig.body.position.y = s * 0.025;
  rig.body.rotation.set(0, 0, 0);
  rig.head.rotation.set(0, 0, 0);
  if (name === 'salut') {
    rig.fl.rotation.set(0, 0, 0.2 + s * 0.03);
    rig.fr.rotation.set(0, 0, -2.55 + Math.sin(t * 9) * 0.32);
    rig.head.rotation.z = 0.12;
    rig.body.rotation.z = 0.04;
  } else if (name === 'pointe') {
    rig.fl.rotation.set(0, 0, 0.18);
    rig.fr.rotation.set(-0.15, 0, -1.48 + s * 0.03);
    rig.head.rotation.y = -0.4;
    rig.head.rotation.x = -0.05;
    rig.body.rotation.y = -0.15;
  } else if (name === 'pointe-d') {
    rig.fr.rotation.set(0, 0, -0.18);
    rig.fl.rotation.set(-0.15, 0, 1.48 - s * 0.03);
    rig.head.rotation.y = 0.4;
    rig.head.rotation.x = -0.05;
    rig.body.rotation.y = 0.15;
  } else {
    rig.fl.rotation.set(0, 0, 0.2 + s * 0.05);
    rig.fr.rotation.set(0, 0, -0.2 - s * 0.05);
    rig.head.rotation.z = Math.sin(t * 1.1) * 0.05;
  }
}
