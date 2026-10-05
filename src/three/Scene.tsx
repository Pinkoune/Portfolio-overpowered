import { ROOM_IDS, type RoomId } from '../content/schema.ts';
import { useStore } from '../state/store.ts';
import { CameraRig } from './CameraRig.tsx';
import { HotspotProjector } from './HotspotLayer.tsx';
import { roomX } from './layout.ts';
import { BlackHole } from './objects/BlackHole.tsx';
import { Corridor, RoomShell } from './objects/RoomShell.tsx';
import { Starfield } from './objects/Starfield.tsx';
import { Arsenal } from './rooms/Arsenal.tsx';
import { Bridge } from './rooms/Bridge.tsx';
import { Comms } from './rooms/Comms.tsx';
import { Logbook } from './rooms/Logbook.tsx';
import { Machines } from './rooms/Machines.tsx';
import { Quarters } from './rooms/Quarters.tsx';
import { RoomDoors } from './rooms/RoomDoors.tsx';
import { StarMap } from './rooms/StarMap.tsx';

type RoomProps = { active: boolean; reducedMotion: boolean };

const ROOMS: Record<RoomId, (props: RoomProps) => React.ReactNode> = {
  bridge: Bridge,
  starmap: StarMap,
  arsenal: Arsenal,
  machines: Machines,
  logbook: Logbook,
  quarters: Quarters,
  comms: Comms,
};

const doorsX = ROOM_IDS.map(roomX);

/** Lumière de la DA : clé blanche, contre-jours rose et ambre venus de la Pupille. */
function Lights() {
  return (
    <>
      <hemisphereLight args={[0xb9b6e8, 0x24122a, 0.85]} />
      <directionalLight position={[3, 4, 5]} intensity={1.2} />
      <directionalLight position={[-4, 2, -4]} intensity={2.2} color={0xff5fa2} />
      <directionalLight position={[4, 1, -3]} intensity={1.4} color={0xffb547} />
    </>
  );
}

export function Scene({ reducedMotion }: { reducedMotion: boolean }) {
  const room = useStore((s) => s.room);
  const traveling = useStore((s) => s.traveling);

  return (
    <>
      <CameraRig reducedMotion={reducedMotion} />
      <HotspotProjector />
      <BlackHole reducedMotion={reducedMotion} />
      <Starfield />
      <Lights />
      <Corridor length={doorsX[doorsX.length - 1]!} doorsX={doorsX} />
      {ROOM_IDS.map((id) => {
        const Room = ROOMS[id];
        const active = id === room && !traveling;
        return (
          <group key={id} position={[roomX(id), 0, 0]}>
            <RoomShell />
            <RoomDoors room={id} active={active} />
            <Room active={active} reducedMotion={reducedMotion} />
          </group>
        );
      })}
    </>
  );
}
