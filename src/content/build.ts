import { z } from 'zod';
import {
  achievementSchema,
  journeySchema,
  machinesSchema,
  penguinSchema,
  profileSchema,
  projectSchema,
  quartersSchema,
  ranksSchema,
  roomsSchema,
  skillCategorySchema,
  uiSchema,
  ROOM_IDS,
} from './schema.ts';
import { placePlanets, type PlanetPlacement } from './placement.ts';

/*
 * Assemble et valide le contenu à partir des fichiers YAML déjà parsés.
 * Fonction pure, partagée par le plugin Vite (build), le script de validation (CI) et les tests.
 */

/** Fichiers parsés, indexés par chemin relatif à content/ (ex. "projects/rptext.yaml"). */
export type RawFiles = Record<string, unknown>;

export interface ContentError {
  file: string;
  path: string;
  message: string;
}

const SINGLETONS = {
  profile: ['site/profile.yaml', profileSchema],
  rooms: ['site/rooms.yaml', roomsSchema],
  ranks: ['site/ranks.yaml', ranksSchema],
  penguin: ['site/penguin.yaml', penguinSchema],
  quarters: ['site/quarters.yaml', quartersSchema],
  machines: ['site/machines.yaml', machinesSchema],
  ui: ['site/ui.yaml', uiSchema],
} as const;

const COLLECTIONS = {
  projects: ['projects/', projectSchema],
  journey: ['journey/', journeySchema],
  skills: ['skills/', skillCategorySchema],
  achievements: ['achievements/', achievementSchema],
} as const;

type Singletons = { [K in keyof typeof SINGLETONS]: z.output<(typeof SINGLETONS)[K][1]> };
type WithId<T> = T & { id: string };

export type Project = WithId<z.output<typeof projectSchema>> & { planet: PlanetPlacement };
export type JourneyEntry = WithId<z.output<typeof journeySchema>>;
export type SkillCategory = WithId<z.output<typeof skillCategorySchema>>;
export type Achievement = WithId<z.output<typeof achievementSchema>>;
export type Room = Singletons['rooms']['rooms'][number];

export interface Content extends Omit<Singletons, 'rooms'> {
  rooms: Room[];
  projects: Project[];
  journey: JourneyEntry[];
  skills: SkillCategory[];
  achievements: Achievement[];
}

const idFromPath = (file: string) => file.replace(/^.*\//, '').replace(/\.ya?ml$/, '');

function toErrors(file: string, error: z.ZodError): ContentError[] {
  return error.issues.map((issue) => ({
    file,
    path: issue.path.map(String).join('.') || '(racine)',
    message: issue.message,
  }));
}

/** Clé de tri chronologique : "present" > toute date, "2024" < "2024-01". */
const dateKey = (d?: string) => (d === 'present' ? '9999' : (d ?? ''));

export function buildContent(
  files: RawFiles,
): { content: Content; errors: [] } | { content: null; errors: ContentError[] } {
  const errors: ContentError[] = [];

  const single = {} as Record<string, unknown>;
  for (const [key, [file, schema]] of Object.entries(SINGLETONS)) {
    if (!(file in files)) {
      errors.push({ file, path: '(fichier)', message: 'fichier manquant' });
      continue;
    }
    const result = schema.safeParse(files[file]);
    if (result.success) single[key] = result.data;
    else errors.push(...toErrors(file, result.error));
  }

  const lists = {} as Record<string, WithId<Record<string, unknown>>[]>;
  for (const [key, [dir, schema]] of Object.entries(COLLECTIONS)) {
    const entries = Object.keys(files)
      .filter((f) => f.startsWith(dir) && /\.ya?ml$/.test(f))
      .sort();
    if (entries.length === 0)
      errors.push({ file: dir, path: '(dossier)', message: 'aucun fichier' });
    lists[key] = [];
    for (const file of entries) {
      const id = idFromPath(file);
      if (!/^[a-z0-9-]+$/.test(id)) {
        errors.push({
          file,
          path: '(nom)',
          message: 'nom de fichier en minuscules, chiffres et tirets',
        });
        continue;
      }
      const result = schema.safeParse(files[file]);
      if (result.success) lists[key]!.push({ ...(result.data as Record<string, unknown>), id });
      else errors.push(...toErrors(file, result.error));
    }
  }

  if (errors.length > 0) return { content: null, errors };

  const s = single as unknown as Singletons;
  const byOrder = <T extends { order: number; id: string }>(a: T, b: T) =>
    a.order - b.order || a.id.localeCompare(b.id);

  const rawProjects = (lists.projects as unknown as WithId<z.output<typeof projectSchema>>[]).sort(
    byOrder,
  );
  const placements = placePlanets(rawProjects.map((p) => ({ slug: p.id, ...p })));
  const projects: Project[] = rawProjects.map((p, i) => ({ ...p, planet: placements[i]! }));

  const journey = (lists.journey as unknown as JourneyEntry[]).sort(
    (a, b) =>
      dateKey(b.end ?? b.start).localeCompare(dateKey(a.end ?? a.start)) ||
      dateKey(b.start).localeCompare(dateKey(a.start)),
  );

  // Ordre des salles imposé par le code (PK-01 → PK-07), quel que soit l'ordre du fichier.
  const rooms = [...s.rooms.rooms].sort((a, b) => ROOM_IDS.indexOf(a.id) - ROOM_IDS.indexOf(b.id));
  if (new Set(rooms.map((r) => r.id)).size !== ROOM_IDS.length) {
    errors.push({ file: SINGLETONS.rooms[0], path: 'rooms', message: 'salle en double' });
  }

  // Références croisées.
  const slugs = new Set(projects.map((p) => p.id));
  s.machines.projects.forEach((slug, i) => {
    if (!slugs.has(slug)) {
      errors.push({
        file: SINGLETONS.machines[0],
        path: `projects.${i}`,
        message: `projet « ${slug} » introuvable dans content/projects/`,
      });
    }
  });
  s.ranks.ranks.forEach((rank, i, all) => {
    if (i === 0 && rank.xp !== 0) {
      errors.push({
        file: SINGLETONS.ranks[0],
        path: 'ranks.0.xp',
        message: 'le premier rang commence à 0 XP',
      });
    }
    if (i > 0 && rank.xp <= all[i - 1]!.xp) {
      errors.push({
        file: SINGLETONS.ranks[0],
        path: `ranks.${i}.xp`,
        message: 'les seuils d’XP doivent croître',
      });
    }
  });

  if (errors.length > 0) return { content: null, errors };

  return {
    content: {
      ...s,
      rooms,
      projects,
      journey,
      skills: (lists.skills as unknown as SkillCategory[]).sort(byOrder),
      achievements: (lists.achievements as unknown as Achievement[]).sort(byOrder),
    },
    errors: [],
  };
}

export function formatErrors(errors: ContentError[]): string {
  return errors.map((e) => `  ✗ content/${e.file} › ${e.path} : ${e.message}`).join('\n');
}
