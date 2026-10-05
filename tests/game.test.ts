import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/content/read.ts';
import {
  applyEvent,
  emptyProgress,
  rankProgress,
  type EventInput,
  type Progress,
} from '../src/game/engine.ts';
import { konamiDetector } from '../src/game/konami.ts';
import { rulesFrom } from '../src/game/rules.ts';

const content = loadContent(resolve(import.meta.dirname, '../content')).content!;
const rules = rulesFrom(content);
const xpOf = (id: string) => content.achievements.find((a) => a.id === id)!.xp;

function play(events: Omit<EventInput, 'at'>[], start: Progress = emptyProgress(), t0 = 0) {
  let progress = start;
  const unlocked: string[] = [];
  events.forEach((e, i) => {
    const out = applyEvent(progress, rules, { ...e, at: t0 + i * 1000 });
    progress = out.progress;
    unlocked.push(...out.unlocked);
  });
  return { progress, unlocked };
}

describe('XP', () => {
  it('donne l’XP d’une salle une seule fois', () => {
    const { progress } = play([
      { type: 'room.visit', value: 'bridge' },
      { type: 'room.visit', value: 'bridge' },
    ]);
    expect(progress.xp).toBe(content.ranks.xp.roomVisit);
  });

  it('donne l’XP d’une fiche projet à la première ouverture', () => {
    const { progress } = play([
      { type: 'project.open', value: 'rptext' },
      { type: 'project.open', value: 'rptext' },
    ]);
    expect(progress.xp).toBe(content.ranks.xp.projectOpen);
  });
});

describe('succès', () => {
  it('débloque un succès simple et son XP', () => {
    const { progress, unlocked } = play([{ type: 'konami' }]);
    expect(unlocked).toEqual(['code-konami']);
    expect(progress.xp).toBe(xpOf('code-konami'));
  });

  it('ne débloque « toutes les fiches » qu’avec chaque projet actif, archives exclues', () => {
    const active = content.projects.filter((p) => !p.archived);
    const partial = play(
      active.slice(1).map((p) => ({ type: 'project.open' as const, value: p.id })),
    );
    expect(partial.unlocked).not.toContain('revue-de-code');
    const full = play([{ type: 'project.open', value: active[0]!.id }], partial.progress);
    expect(full.unlocked).toContain('revue-de-code');
  });

  it('renvoie le même état quand rien ne change', () => {
    const first = play([{ type: 'room.visit', value: 'bridge' }]);
    const again = applyEvent(first.progress, rules, { type: 'room.visit', value: 'bridge', at: 5 });
    expect(again.progress).toBe(first.progress);
  });

  it('ne débloque jamais deux fois', () => {
    const first = play([{ type: 'konami' }]);
    const again = play([{ type: 'konami' }], first.progress);
    expect(again.unlocked).toEqual([]);
    expect(again.progress.xp).toBe(first.progress.xp);
  });

  it('accorde « Zéro downtime » si les 7 salles sont vues en moins de 2 min', () => {
    const rooms = content.rooms.map((r) => ({ type: 'room.visit' as const, value: r.id }));
    const { unlocked } = play(rooms);
    expect(unlocked).toContain('kubectl-get-rooms');
    expect(unlocked).toContain('zero-downtime');
  });

  it('refuse « Zéro downtime » au-delà de 2 min', () => {
    const rooms = content.rooms.map((r) => ({ type: 'room.visit' as const, value: r.id }));
    let progress = emptyProgress();
    const unlocked: string[] = [];
    rooms.forEach((e, i) => {
      const out = applyEvent(progress, rules, { ...e, at: i * 30_000 });
      progress = out.progress;
      unlocked.push(...out.unlocked);
    });
    expect(unlocked).toContain('kubectl-get-rooms');
    expect(unlocked).not.toContain('zero-downtime');
  });

  it('peut tout débloquer : chaque événement de succès est atteignable par les règles', () => {
    for (const a of content.achievements) {
      const need =
        a.trigger.count === 'all' ? (rules.totals[a.trigger.event] ?? 1) : a.trigger.count;
      expect(need, a.id).toBeGreaterThan(0);
    }
  });
});

describe('rangs', () => {
  it('signale la montée de rang', () => {
    const threshold = content.ranks.ranks[1]!.xp;
    const out = applyEvent({ ...emptyProgress(), xp: threshold - 10 }, rules, {
      type: 'konami',
      at: 0,
    });
    expect(out.rankBefore).toBe(0);
    expect(out.rankAfter).toBeGreaterThanOrEqual(1);
  });

  it('calcule la progression vers le rang suivant', () => {
    const [r0, r1] = rules.rankThresholds;
    expect(rankProgress(0, rules.rankThresholds)).toMatchObject({ index: 0, ratio: 0, next: r1 });
    expect(rankProgress((r0! + r1!) / 2, rules.rankThresholds).ratio).toBeCloseTo(0.5);
    const max = rules.rankThresholds.at(-1)!;
    expect(rankProgress(max + 500, rules.rankThresholds)).toMatchObject({ ratio: 1, next: null });
  });

  it('permet d’atteindre le rang maximum avec tout le contenu', () => {
    const total =
      content.achievements.reduce((sum, a) => sum + a.xp, 0) +
      content.rooms.length * content.ranks.xp.roomVisit +
      content.projects.length * content.ranks.xp.projectOpen;
    expect(total).toBeGreaterThanOrEqual(rules.rankThresholds.at(-1)!);
  });
});

describe('code Konami', () => {
  it('reconnaît la suite, même après une erreur', () => {
    const detect = konamiDetector();
    const keys = [
      'x',
      'ArrowUp',
      'ArrowUp',
      'ArrowUp',
      'ArrowDown',
      'ArrowDown',
      'ArrowLeft',
      'ArrowRight',
      'ArrowLeft',
      'ArrowRight',
      'B',
      'a',
    ];
    expect(keys.map(detect).at(-1)).toBe(true);
  });
});
