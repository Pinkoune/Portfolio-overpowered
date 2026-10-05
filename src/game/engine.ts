import type { GAME_EVENTS } from '../content/schema.ts';

/*
 * Moteur de progression — TypeScript pur, sans React ni contenu importé : les règles sont passées
 * en paramètre (testable en Node). Le site émet des événements ; le moteur compte les valeurs
 * distinctes vues pour chacun, attribue l'XP et débloque les succès.
 */

export type GameEvent = (typeof GAME_EVENTS)[number];

export interface Progress {
  xp: number;
  /** Identifiants des succès débloqués, dans l'ordre. */
  unlocked: string[];
  /** Valeurs distinctes vues par événement (ex. room.visit → ['bridge', 'starmap']). */
  seen: Partial<Record<GameEvent, string[]>>;
  /** Horodatage de la première salle visitée (pour « Zéro downtime »). */
  firstVisitAt: number | null;
}

export const emptyProgress = (): Progress => ({
  xp: 0,
  unlocked: [],
  seen: {},
  firstVisitAt: null,
});

export interface RuleAchievement {
  id: string;
  xp: number;
  trigger: { event: GameEvent; count: number | 'all' };
}

export interface Rules {
  achievements: RuleAchievement[];
  /** Seuils d'XP des rangs, croissants, le premier à 0. */
  rankThresholds: number[];
  xp: { roomVisit: number; projectOpen: number };
  /** Nombre d'éléments pour un `count: all` (salles, projets, catégories…). */
  totals: Partial<Record<GameEvent, number>>;
  /** Délai pour « toutes les salles vite » (ms). */
  speedrunMs: number;
}

export interface EventInput {
  type: GameEvent;
  /** Valeur distinctive (salle, projet…). Par défaut '*'. */
  value?: string;
  /** Horodatage (ms). */
  at: number;
}

export interface Outcome {
  progress: Progress;
  unlocked: string[];
  xpGained: number;
  rankBefore: number;
  rankAfter: number;
}

export function rankIndex(xp: number, thresholds: number[]): number {
  let index = 0;
  thresholds.forEach((threshold, i) => {
    if (xp >= threshold) index = i;
  });
  return index;
}

/** Progression vers le rang suivant : 0 → 1 ; 1 au rang maximum. */
export function rankProgress(xp: number, thresholds: number[]) {
  const index = rankIndex(xp, thresholds);
  const floor = thresholds[index]!;
  const next = thresholds[index + 1];
  return {
    index,
    floor,
    next: next ?? null,
    ratio: next === undefined ? 1 : (xp - floor) / (next - floor),
  };
}

const XP_EVENTS: Partial<Record<GameEvent, keyof Rules['xp']>> = {
  'room.visit': 'roomVisit',
  'project.open': 'projectOpen',
  'archive.open': 'projectOpen',
};

export function applyEvent(progress: Progress, rules: Rules, event: EventInput): Outcome {
  const rankBefore = rankIndex(progress.xp, rules.rankThresholds);
  const value = event.value ?? '*';
  const seenBefore = progress.seen[event.type] ?? [];
  const isNew = !seenBefore.includes(value);
  let next: Progress = progress;
  let xpGained = 0;
  const unlocked: string[] = [];

  if (isNew) {
    next = { ...next, seen: { ...next.seen, [event.type]: [...seenBefore, value] } };
    const xpRule = XP_EVENTS[event.type];
    if (xpRule) xpGained += rules.xp[xpRule];
    if (event.type === 'room.visit' && next.firstVisitAt === null) {
      next = { ...next, firstVisitAt: event.at };
    }
  }

  const seenCount = next.seen[event.type]?.length ?? 0;
  for (const a of rules.achievements) {
    if (a.trigger.event !== event.type || next.unlocked.includes(a.id)) continue;
    const need = a.trigger.count === 'all' ? (rules.totals[event.type] ?? 1) : a.trigger.count;
    if (seenCount >= need) {
      next = { ...next, unlocked: [...next.unlocked, a.id] };
      unlocked.push(a.id);
      xpGained += a.xp;
    }
  }

  if (xpGained > 0) next = { ...next, xp: next.xp + xpGained };
  let outcome: Outcome = {
    progress: next,
    unlocked,
    xpGained,
    rankBefore,
    rankAfter: rankIndex(next.xp, rules.rankThresholds),
  };

  // Événement dérivé : toutes les salles visitées en moins de speedrunMs.
  const rooms = rules.totals['room.visit'];
  if (
    event.type === 'room.visit' &&
    isNew &&
    rooms !== undefined &&
    seenCount === rooms &&
    next.firstVisitAt !== null &&
    event.at - next.firstVisitAt <= rules.speedrunMs
  ) {
    const derived = applyEvent(next, rules, { type: 'ship.speedrun', at: event.at });
    outcome = {
      progress: derived.progress,
      unlocked: [...unlocked, ...derived.unlocked],
      xpGained: xpGained + derived.xpGained,
      rankBefore,
      rankAfter: derived.rankAfter,
    };
  }
  return outcome;
}
