import { CatmullRomCurve3, Vector3 } from 'three';
import { BLACKHOLE } from './layout.ts';

/*
 * Séquence d'approche (DA Motion, « I · Intro », 7 s, une fois par visite) :
 *   0 – 1 s     noir, étoiles, « Signal détecté_ »
 *   1 – 3 s     la Pupille s'allume, anneau après anneau, de l'intérieur vers l'extérieur
 *   2,4 – 5 s   le PK-01 entre par la droite ; dolly arrière, fov 50 → 42
 *   3 – 6,2 s   la caméra rattrape le vaisseau (spline 4 points, ease-io, roulis ≤ 4°)
 *   6,2 s →     état « prêt » : orbite lente autour du vaisseau jusqu'à l'embarquement
 *   puis        flash rose 300 ms dans le sas, ouverture sur le pont
 * Visiteur connu : 2 s sur le dernier plan, puis embarquement automatique.
 * Le vaisseau extérieur est loin des salles, qui sont masquées pendant l'approche.
 */

export const INTRO = {
  duration: 6.2,
  short: 2,
  ignite: [1, 3] as const,
  shipEnter: [2.4, 5] as const,
  fov: [50, 42] as const,
  maxRoll: (4 * Math.PI) / 180,
};

/** Vaisseau vu de l'extérieur : position finale, échelle, point d'entrée (par la droite). */
export const EXTERIOR = {
  ship: new Vector3(64, 20, 40),
  scale: 3,
  enterFrom: new Vector3(170, 34, 10),
};

/** Spline caméra : du large vers le flanc du vaisseau, la Pupille gardée dans le tiers gauche. */
export const approachPath = new CatmullRomCurve3(
  [
    new Vector3(30, 8, 330),
    new Vector3(34, 4, 230),
    new Vector3(38, 2, 150),
    new Vector3(40, 0, 100),
  ],
  false,
  'centripetal',
);

/** Point visé au début (la Pupille au centre) puis au plan final (maquette A : Pupille en bas, vaisseau en haut à droite). */
export const approachLookStart = BLACKHOLE.position.clone();
export const approachLookEnd = new Vector3(34, 46, -100);

/**
 * Effets partagés entre le directeur d'intro et les objets de la scène, mis à jour à chaque image
 * (pas d'état React : on reste hors du cycle de rendu).
 */
export const introFx = {
  /** 0 → 1 : allumage de la Pupille (anneaux). */
  reveal: 1,
  /** 0 → 1 : progression de l'entrée du vaisseau. */
  shipIn: 1,
};
