import { ROOM_IDS, type RoomId } from '../content/schema.ts';

/** Adresse d'une salle à bord : #/starmap. Les ancres du mode classique (#starmap) n'ont pas de « / ». */
export const roomHash = (room: RoomId) => `#/${room}`;

export function parseRoomHash(hash: string): RoomId | null {
  const match = /^#\/([a-z]+)$/.exec(hash);
  const id = match?.[1];
  return id && (ROOM_IDS as readonly string[]).includes(id) ? (id as RoomId) : null;
}
