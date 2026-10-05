import { describe, expect, it } from 'vitest';
import { chooseMode } from '../src/app/capabilities.ts';
import { parseRoomHash, roomHash } from '../src/app/hashRoom.ts';
import { ROOM_IDS } from '../src/content/schema.ts';
import { ROOM, roomPose, travelDuration, travelPath } from '../src/three/layout.ts';

const capable = { webgl: true, lowEnd: false, reducedMotion: false };

describe('choix du mode', () => {
  it('embarque en 3D par défaut sur un appareil capable', () => {
    expect(chooseMode(capable, null)).toBe('3d');
  });

  it('bascule en classique sans WebGL, même si la 3D était préférée', () => {
    expect(chooseMode({ ...capable, webgl: false }, '3d')).toBe('classic');
  });

  it('propose le classique d’office sur un appareil faible', () => {
    expect(chooseMode({ ...capable, lowEnd: true }, null)).toBe('classic');
  });

  it('respecte le choix explicite du visiteur', () => {
    expect(chooseMode(capable, 'classic')).toBe('classic');
    expect(chooseMode({ ...capable, lowEnd: true }, '3d')).toBe('3d');
  });
});

describe('adresse des salles', () => {
  it('fait l’aller-retour pour chaque salle', () => {
    for (const id of ROOM_IDS) expect(parseRoomHash(roomHash(id))).toBe(id);
  });

  it('ignore les ancres du mode classique et les salles inconnues', () => {
    expect(parseRoomHash('#starmap')).toBeNull();
    expect(parseRoomHash('#/hangar')).toBeNull();
    expect(parseRoomHash('')).toBeNull();
  });
});

describe('trajets caméra', () => {
  it('relie la position de départ au point de vue de la salle d’arrivée', () => {
    const from = roomPose('bridge').position;
    const path = travelPath(from, 'arsenal');
    expect(path.getPointAt(0).distanceTo(from)).toBeLessThan(1e-6);
    expect(path.getPointAt(1).distanceTo(roomPose('arsenal').position)).toBeLessThan(1e-6);
  });

  it('passe par la coursive, derrière les salles', () => {
    const path = travelPath(roomPose('bridge').position, 'starmap');
    expect(path.getPointAt(0.5).z).toBeGreaterThan(ROOM.halfDepth);
  });

  it('dure 1,6 s entre voisines, plus longtemps pour un saut lointain', () => {
    expect(travelDuration('bridge', 'bridge')).toBe(0);
    expect(travelDuration('bridge', 'starmap')).toBeCloseTo(1.6);
    expect(travelDuration('bridge', 'comms')).toBeGreaterThan(1.6);
  });
});
