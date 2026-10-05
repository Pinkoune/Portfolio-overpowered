import type { Content } from '../content/build.ts';
import type { Rules } from './engine.ts';

/** Règles du jeu dérivées du contenu (succès, rangs, nombre d'éléments pour les « all »). */
export function rulesFrom(content: Content): Rules {
  return {
    achievements: content.achievements.map((a) => ({ id: a.id, xp: a.xp, trigger: a.trigger })),
    rankThresholds: content.ranks.ranks.map((r) => r.xp),
    xp: content.ranks.xp,
    totals: {
      'room.visit': content.rooms.length,
      'project.open': content.projects.filter((p) => !p.archived).length,
      'archive.open': content.projects.filter((p) => p.archived).length,
      'skill.inspect': content.skills.length,
      'journey.open': content.journey.length,
    },
    speedrunMs: 2 * 60 * 1000,
  };
}
