import { CatmullRomCurve3, Vector3 } from 'three';
import { ROOM_IDS, type RoomId } from '../content/schema.ts';

/*
 * Plan du PK-01. Les 7 salles sont alignées le long d'une coursive (axe X), dans l'ordre du plan
 * du HUD (PK-01 → PK-07). Chaque salle regarde vers -Z, où se trouve la Pupille, à travers une
 * baie vitrée. On passe d'une salle à l'autre par la porte arrière et la coursive (z > 5).
 *
 * Repère d'une salle (local) : x ∈ [-6, 6], z ∈ [-5, 5], sol à y = 0, plafond à y = 5.
 */

export const ROOM = { halfWidth: 6, halfDepth: 5, height: 5 } as const;
export const ROOM_SPACING = 16;
export const CORRIDOR = { z: 7.4, halfWidth: 1.8, height: 3.2 } as const;
export const DOOR = { width: 2.4, height: 3 } as const;
export const EYE_HEIGHT = 1.65;

/** Contour de la baie, dans le plan du mur avant (x, y). */
export const WINDOW_OUTLINE: [number, number][] = [
  [-3.6, 4.4],
  [3.6, 4.4],
  [5.0, 3.4],
  [5.0, 1.9],
  [3.6, 0.9],
  [-3.6, 0.9],
  [-5.0, 1.9],
  [-5.0, 3.4],
];

/** La Pupille, loin devant les baies ; légèrement décalée pour que le pont la voie de trois quarts. */
export const BLACKHOLE = {
  position: new Vector3(6, 20, -340),
  /** Rayon de l'horizon, en unités du monde. */
  radius: 30,
  tilt: 0.2,
} as const;

export const roomIndex = (id: RoomId) => ROOM_IDS.indexOf(id);
export const roomX = (id: RoomId) => roomIndex(id) * ROOM_SPACING;

export interface CameraPose {
  position: Vector3;
  target: Vector3;
}

/** Point de vue d'une salle : au fond, à hauteur d'yeux, face à la baie. */
export function roomPose(id: RoomId): CameraPose {
  const x = roomX(id);
  return {
    position: new Vector3(x, EYE_HEIGHT, 3.4),
    target: new Vector3(x, 1.9, -ROOM.halfDepth),
  };
}

/**
 * Trajet caméra entre deux salles : recul par la porte arrière, coursive, entrée dans la salle
 * d'arrivée (DA Motion, « Transition caméra entre deux salles »).
 */
export function travelPath(from: Vector3, to: RoomId): CatmullRomCurve3 {
  const end = roomPose(to).position;
  const y = EYE_HEIGHT + 0.05;
  const points = [
    from.clone(),
    new Vector3(from.x, y, ROOM.halfDepth + 0.2),
    new Vector3(from.x + Math.sign(end.x - from.x) * 1.5, y, CORRIDOR.z),
    new Vector3(end.x - Math.sign(end.x - from.x) * 1.5, y, CORRIDOR.z),
    new Vector3(end.x, y, ROOM.halfDepth + 0.2),
    end.clone(),
  ];
  return new CatmullRomCurve3(points, false, 'centripetal');
}

/** Durée du trajet (s) : 1,6 s d'une salle à sa voisine, un peu plus pour les sauts lointains. */
export function travelDuration(from: RoomId, to: RoomId): number {
  const gap = Math.abs(roomIndex(to) - roomIndex(from));
  return gap === 0 ? 0 : 1.6 + Math.min(gap - 1, 4) * 0.3;
}
