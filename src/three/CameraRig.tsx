import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import { MathUtils, PerspectiveCamera, Vector3, type CatmullRomCurve3 } from 'three';
import type { RoomId } from '../content/schema.ts';
import { ease } from '../motion/easings.ts';
import { useStore } from '../state/store.ts';
import { CORRIDOR, ROOM, roomPose, travelDuration, travelPath } from './layout.ts';

/*
 * Caméra « avec de la masse » (DA Motion) : trajets ease-io le long d'une spline porte → coursive →
 * entrée ; au repos, légère parallaxe qui suit le pointeur. Avec « réduire les animations » : coupe.
 */

interface Travel {
  from: RoomId;
  to: RoomId;
  curve: CatmullRomCurve3;
  start: number;
  duration: number;
}

const look = new Vector3();
const corridorLook = new Vector3();
const restTarget = new Vector3();
const restPosition = new Vector3();

/** Champ vertical : 45° (DA), élargi en portrait pour garder la salle dans le cadre. */
function fovFor(aspect: number) {
  const halfWidth = 4.2;
  const distance = 3.4 + ROOM.halfDepth;
  const needed = (2 * Math.atan(halfWidth / distance / aspect) * 180) / Math.PI;
  return MathUtils.clamp(needed, 45, 72);
}

export function CameraRig({ reducedMotion }: { reducedMotion: boolean }) {
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  const aspect = useThree((s) => s.size.width / s.size.height);
  const clock = useThree((s) => s.clock);
  const room = useStore((s) => s.room);
  const setTraveling = useStore((s) => s.setTraveling);
  const settled = useRef<RoomId>(room);
  const travel = useRef<Travel | null>(null);
  const target = useRef(roomPose(room).target.clone());

  // Placement initial.
  useEffect(() => {
    const pose = roomPose(settled.current);
    camera.position.copy(pose.position);
    camera.lookAt(pose.target);
  }, [camera]);

  useEffect(() => {
    camera.fov = fovFor(aspect);
    camera.updateProjectionMatrix();
  }, [camera, aspect]);

  useEffect(() => {
    if (room === settled.current && !travel.current) return;
    const from = travel.current?.to ?? settled.current;
    if (reducedMotion) {
      const pose = roomPose(room);
      camera.position.copy(pose.position);
      target.current.copy(pose.target);
      settled.current = room;
      travel.current = null;
      return;
    }
    travel.current = {
      from,
      to: room,
      curve: travelPath(camera.position, room),
      start: clock.elapsedTime,
      duration: Math.max(0.8, travelDuration(from, room)),
    };
    setTraveling(true);
  }, [room, reducedMotion, camera, clock, setTraveling]);

  useFrame(({ pointer }) => {
    const tr = travel.current;
    if (tr) {
      const k = Math.min(1, (clock.elapsedTime - tr.start) / tr.duration);
      const e = ease.io(k);
      camera.position.copy(tr.curve.getPointAt(e));
      // Regard : la salle de départ, puis l'axe de la coursive, puis la salle d'arrivée.
      const dir = Math.sign(roomPose(tr.to).position.x - roomPose(tr.from).position.x) || 1;
      corridorLook.set(camera.position.x + dir * 6, 1.7, CORRIDOR.z);
      const toCorridor = MathUtils.smoothstep(e, 0.12, 0.32);
      const toRoom = MathUtils.smoothstep(e, 0.68, 0.88);
      look
        .copy(roomPose(tr.from).target)
        .lerp(corridorLook, toCorridor)
        .lerp(roomPose(tr.to).target, toRoom);
      camera.lookAt(look);
      target.current.copy(look);
      if (k >= 1) {
        travel.current = null;
        settled.current = tr.to;
        setTraveling(false);
      }
      return;
    }

    // Au repos : parallaxe douce au pointeur.
    const pose = roomPose(settled.current);
    restTarget.copy(pose.target).add(look.set(pointer.x * 0.9, pointer.y * 0.45, 0));
    restPosition.copy(pose.position).add(look.set(pointer.x * -0.15, pointer.y * -0.08, 0));
    const damp = reducedMotion ? 1 : 0.06;
    target.current.lerp(restTarget, damp);
    camera.position.lerp(restPosition, damp);
    camera.lookAt(target.current);
  });

  return null;
}
