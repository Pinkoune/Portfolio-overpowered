import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildContent, type RawFiles } from '../src/content/build.ts';
import { placePlanets } from '../src/content/placement.ts';
import { readContentDir, loadContent } from '../src/content/read.ts';
import { UI_KEYS } from '../src/content/schema.ts';

const root = resolve(import.meta.dirname, '../content');

describe('content/ du dépôt', () => {
  const { content, errors } = loadContent(root);

  it('est valide', () => {
    expect(errors).toEqual([]);
    expect(content).not.toBeNull();
  });

  it('décrit les 7 salles dans l’ordre PK-01 → PK-07', () => {
    expect(content!.rooms.map((r) => r.code)).toEqual([
      'PK-01',
      'PK-02',
      'PK-03',
      'PK-04',
      'PK-05',
      'PK-06',
      'PK-07',
    ]);
  });

  it('contient chaque clé d’interface utilisée par le code', () => {
    expect(Object.keys(content!.ui).sort()).toEqual([...UI_KEYS].sort());
  });

  it('trie le parcours du plus récent au plus ancien', () => {
    const [first] = content!.journey;
    expect(first?.end).toBe('present');
  });

  it('place chaque projet sur une orbite distincte, archives à part', () => {
    const active = content!.projects.filter((p) => !p.archived).map((p) => p.planet.orbit);
    expect(new Set(active).size).toBe(active.length);
    const belt = content!.projects.filter((p) => p.archived).map((p) => p.planet.orbit);
    expect(Math.min(...belt)).toBeGreaterThan(Math.max(...active));
  });

  it('ne publie aucune donnée sensible évidente', () => {
    const raw = JSON.stringify(readContentDir(root).files);
    expect(raw).not.toMatch(/\b\d{1,3}(\.\d{1,3}){3}\b/); // adresse IP
    expect(raw).not.toMatch(/[\w.+-]+@[\w-]+\.[\w.]+/); // email
    expect(raw).not.toMatch(/(\+33|0)[1-9](\s?\d{2}){4}/); // téléphone
  });
});

describe('validation', () => {
  const { files } = readContentDir(root);
  const withProject = (project: unknown): RawFiles => ({ ...files, 'projects/test.yaml': project });
  const base = files['projects/rptext.yaml'] as Record<string, unknown>;

  it('signale une traduction manquante avec le fichier et le chemin', () => {
    const result = buildContent(withProject({ ...base, summary: { fr: 'Résumé' } }));
    expect(result.errors).toContainEqual({
      file: 'projects/test.yaml',
      path: 'summary.en',
      message: 'traduction EN manquante',
    });
  });

  it('détecte une virgule non protégée dans un { fr, en } (clé en trop)', () => {
    const result = buildContent(
      withProject({ ...base, tagline: { fr: 'Un', 'deux et trois': null, en: 'One' } }),
    );
    expect(result.errors.some((e) => e.path === 'tagline')).toBe(true);
  });

  it('refuse un lien qui n’est pas une URL', () => {
    const result = buildContent(withProject({ ...base, links: { repo: 'github.com/x' } }));
    expect(result.errors).toContainEqual(
      expect.objectContaining({ path: 'links.repo', message: 'URL invalide (https://…)' }),
    );
  });

  it('refuse un événement de succès inconnu', () => {
    const achievement = files['achievements/konami.yaml'] ?? files['achievements/code-konami.yaml'];
    const result = buildContent({
      ...files,
      'achievements/test.yaml': { ...(achievement as object), trigger: { event: 'nope' } },
    });
    expect(result.errors.some((e) => e.path === 'trigger.event')).toBe(true);
  });

  it('vérifie les références croisées de la salle des machines', () => {
    const machines = files['site/machines.yaml'] as Record<string, unknown>;
    const result = buildContent({
      ...files,
      'site/machines.yaml': { ...machines, projects: ['inexistant'] },
    });
    expect(result.errors).toContainEqual(
      expect.objectContaining({ file: 'site/machines.yaml', path: 'projects.0' }),
    );
  });

  it('exige des seuils de rang croissants', () => {
    const ranks = files['site/ranks.yaml'] as { ranks: { xp: number }[] };
    const broken = { ...ranks, ranks: [...ranks.ranks].reverse() };
    const result = buildContent({ ...files, 'site/ranks.yaml': broken });
    expect(result.errors.length).toBeGreaterThan(0);
  });
});

describe('placement des planètes', () => {
  const projects = [
    { slug: 'a', archived: false },
    { slug: 'b', archived: false },
    { slug: 'old', archived: true },
  ];

  it('est déterministe', () => {
    expect(placePlanets(projects)).toEqual(placePlanets(projects));
  });

  it('respecte une surcharge partielle', () => {
    const [first] = placePlanets([{ slug: 'a', archived: false, planet: { color: '#123456' } }]);
    expect(first!.color).toBe('#123456');
    expect(first!.orbit).toBeGreaterThan(0);
  });
});
