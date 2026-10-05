import { useFrame } from '@react-three/fiber';
import { useMemo } from 'react';
import { EXTERIOR, introFx } from '../intro.ts';
import { makeShip } from '../models/ship.ts';

/** Le PK-01 vu de l'extérieur (approche) : entre par la droite, anneau en rotation. */
export function ExteriorShip() {
  const ship = useMemo(() => makeShip(), []);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    ship.ring.rotation.x = t * 0.5;
    const k = introFx.shipIn;
    ship.group.position.copy(EXTERIOR.enterFrom).lerp(EXTERIOR.ship, k);
    // Nez vers la gauche (le modèle regarde +X), léger tangage en dérive.
    ship.group.rotation.set(0.12 + Math.sin(t * 0.3) * 0.02, Math.PI - 0.5 + (1 - k) * 0.4, 0.06);
    ship.group.visible = k > 0;
  });

  return (
    <group>
      <primitive object={ship.group} scale={EXTERIOR.scale} />
      {/* Éclairage propre au plan extérieur : contre-jours rose et ambre venus de la Pupille. */}
      <directionalLight position={[-40, 30, -200]} intensity={2.4} color={0xffb547} />
      <directionalLight position={[120, -20, -60]} intensity={2.0} color={0xff5fa2} />
    </group>
  );
}
