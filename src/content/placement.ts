/*
 * Placement automatique des projets sur la carte stellaire : déterministe (même slug + même ordre
 * = même position), surchargeable champ par champ via `planet:` dans le YAML du projet.
 */

export interface PlanetPlacement {
  orbit: number;
  angle: number;
  size: number;
  color: string;
}

export interface PlanetOverride {
  orbit?: number;
  angle?: number;
  size?: number;
  color?: string;
}

/** Couleurs autorisées pour une planète : accents de la DA + rampe du disque d'accrétion. */
export const PLANET_COLORS = ['#FF5FA2', '#FFB547', '#5CE1E6', '#FFB8D5', '#FF8A78', '#FFD08A'];
const ARCHIVE_COLOR = '#A29FBD';

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
const FIRST_ORBIT = 3;
const ORBIT_GAP = 1.15;

/** Hash FNV-1a 32 bits → [0, 1). */
export function hash01(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0) / 0x100000000;
}

export function placePlanets(
  projects: { slug: string; archived: boolean; planet?: PlanetOverride }[],
): PlanetPlacement[] {
  const active = projects.filter((p) => !p.archived).length;
  const beltOrbit = FIRST_ORBIT + active * ORBIT_GAP + 0.8;
  let activeIndex = 0;
  let archiveIndex = 0;

  return projects.map(({ slug, archived, planet = {} }) => {
    const h = hash01(slug);
    let auto: PlanetPlacement;
    if (archived) {
      // Ceinture d'archives : même orbite, répartis en arc, petits et discrets.
      auto = {
        orbit: beltOrbit,
        angle: Math.PI * 0.75 + archiveIndex++ * 0.55 + h * 0.2,
        size: 0.18 + h * 0.06,
        color: ARCHIVE_COLOR,
      };
    } else {
      const i = activeIndex++;
      auto = {
        orbit: FIRST_ORBIT + i * ORBIT_GAP,
        angle: (i * GOLDEN_ANGLE + h * 0.6) % (Math.PI * 2),
        size: 0.32 + h * 0.22,
        color: PLANET_COLORS[i % PLANET_COLORS.length]!,
      };
    }
    return { ...auto, ...planet };
  });
}
