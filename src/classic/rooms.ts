import { content, type Room, type RoomId } from '../content/index.ts';

export const roomById = Object.fromEntries(content.rooms.map((r) => [r.id, r])) as Record<
  RoomId,
  Room
>;
