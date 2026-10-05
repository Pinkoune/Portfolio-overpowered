import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Group } from 'three';
import type { RoomId } from '../../content/schema.ts';
import { useStore } from '../../state/store.ts';
import { accent } from '../models/materials.ts';
import type { PenguinPose } from '../models/penguin.ts';
import { Penguin } from '../objects/Penguin.tsx';

/**
 * Pinkoune accompagne le visiteur : un pingouin par salle (le pilote du pont est dans Bridge), qui
 * désigne le contenu à l'arrivée. Placé vers la droite et au fond : la bulle du HUD occupe le coin bas
 * gauche et le plan du vaisseau le bas de l'écran.
 */
const PLACES: Partial<
  Record<RoomId, { position: [number, number, number]; arrival: PenguinPose; turn: number }>
> = {
  starmap: { position: [3.0, 0, -2.8], arrival: 'pointe', turn: -0.45 },
  arsenal: { position: [2.5, 0, -2.3], arrival: 'pointe', turn: -0.45 },
  machines: { position: [1.6, 0, -3.1], arrival: 'pointe-d', turn: -0.1 },
  logbook: { position: [1.8, 0, -2.4], arrival: 'pointe', turn: -0.3 },
  quarters: { position: [1.3, 0, -3.0], arrival: 'pointe', turn: -0.2 },
  comms: { position: [3.0, 0, -2.8], arrival: 'pointe', turn: -0.5 },
};

const click = () => useStore.getState().emit('penguin.click');

export function RoomPenguin({ room, active }: { room: RoomId; active: boolean }) {
  const place = PLACES[room];
  if (!place) return null;
  return (
    <Penguin
      active={active}
      arrival={place.arrival}
      onClick={click}
      position={place.position}
      rotation={[0, place.turn, 0]}
      scale={0.5}
    />
  );
}

/**
 * Le pingouin caché : un Pinkoune astronaute qui dérive dehors, derrière la baie du Journal de bord.
 * Aucun repère ne le signale ; le cliquer débloque « Personne ne vous entend ».
 */
export function HiddenPenguin() {
  const drift = useRef<Group>(null);
  useFrame(({ clock }) => {
    const g = drift.current;
    if (!g) return;
    const t = clock.elapsedTime;
    g.position.set(-3.4 + Math.sin(t * 0.13) * 0.6, 3.5 + Math.sin(t * 0.4) * 0.25, -9);
    g.rotation.set(Math.sin(t * 0.21) * 0.3, t * 0.12, 0.5 + Math.sin(t * 0.17) * 0.25);
  });
  return (
    <group ref={drift}>
      <Penguin
        pose="salut"
        onClick={() => useStore.getState().emit('penguin.hidden')}
        position={[0, -0.35, 0]}
        scale={0.4}
      />
      {/* Bulle du casque */}
      <mesh position={[0, 0.21, 0]}>
        <icosahedronGeometry args={[0.36, 1]} />
        <meshStandardMaterial
          color={accent.holo}
          transparent
          opacity={0.18}
          flatShading
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
