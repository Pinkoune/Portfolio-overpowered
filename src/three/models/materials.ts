import { MeshBasicMaterial, MeshStandardMaterial, type ColorRepresentation } from 'three';

/*
 * Matériaux low-poly de la DA : MeshStandard en flat shading, aucune texture.
 * Fonction `M` reprise telle quelle de design/pinkoune-3d.js. Mis en cache : un matériau par recette.
 */
const cache = new Map<string, MeshStandardMaterial | MeshBasicMaterial>();

export function flat(
  color: ColorRepresentation,
  emissive: ColorRepresentation = 0x000000,
  emissiveIntensity = 1,
) {
  const key = `s:${String(color)}:${String(emissive)}:${emissiveIntensity}`;
  let m = cache.get(key) as MeshStandardMaterial | undefined;
  if (!m) {
    m = new MeshStandardMaterial({
      color,
      flatShading: true,
      roughness: 0.75,
      metalness: 0,
      emissive,
      emissiveIntensity,
    });
    cache.set(key, m);
  }
  return m;
}

/** Lumière pure (néons, LED, filets) : non éclairée, et plus tard captée par le bloom. */
export function glow(color: ColorRepresentation) {
  const key = `b:${String(color)}`;
  let m = cache.get(key) as MeshBasicMaterial | undefined;
  if (!m) {
    m = new MeshBasicMaterial({ color, toneMapped: false });
    cache.set(key, m);
  }
  return m;
}

/** Palette de la coque (DA, section 02). */
export const hull = {
  void: 0x07060d,
  h900: 0x0d0c17,
  h800: 0x151426,
  h700: 0x201f36,
  h600: 0x2e2c4a,
  line: 0x3b3960,
  plate: 0x45436a,
  shell: 0x2a2944,
} as const;

export const accent = {
  pink: 0xff5fa2,
  pinkSoft: 0xffb8d5,
  pinkDeep: 0xb8286a,
  amber: 0xffb547,
  core: 0xfff2dc,
  holo: 0x5ce1e6,
} as const;
