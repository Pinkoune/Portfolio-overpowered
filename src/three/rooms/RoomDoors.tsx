import { content, type RoomId } from '../../content/index.ts';
import { useT } from '../../i18n/useT.ts';
import { useStore } from '../../state/store.ts';
import { Hotspot } from '../Hotspot.tsx';
import { ROOM, roomIndex } from '../layout.ts';
import { accent, flat, glow, hull } from '../models/materials.ts';
import { Box } from '../objects/Box.tsx';

const W = ROOM.halfWidth;

/** Portes latérales vers les salles voisines (maquette B : « PK-02 Labo » à gauche, etc.). */
export function RoomDoors({ room, active }: { room: RoomId; active: boolean }) {
  const { t, ui } = useT();
  const goTo = useStore((s) => s.goTo);
  const i = roomIndex(room);
  const neighbours = [
    { side: -1, target: content.rooms[i - 1] },
    { side: 1, target: content.rooms[i + 1] },
  ].filter((d) => d.target);

  return neighbours.map(({ side, target }) => (
    <group key={target!.id} position={[side * (W - 0.02), 0, 0.6]}>
      <Box size={[0.08, 2.7, 1.5]} position={[0, 1.35, 0]} material={flat(hull.void)} />
      <Box
        size={[0.1, 0.03, 1.5]}
        position={[-side * 0.02, 2.72, 0]}
        material={glow(accent.holo)}
      />
      {active && (
        <Hotspot
          position={[-side * 0.3, 1.7, 0]}
          side={side < 0 ? 'right' : 'left'}
          code={target!.code}
          label={ui('hotspot.door', { room: t(target!.name) })}
          onActivate={() => goTo(target!.id)}
        />
      )}
    </group>
  ));
}
