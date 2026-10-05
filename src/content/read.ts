import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { parse } from 'yaml';
import { buildContent, type Content, type ContentError, type RawFiles } from './build.ts';

/** Lit et parse tous les .yaml de content/ (Node uniquement : build, CI, tests). */
export function readContentDir(root: string): { files: RawFiles; errors: ContentError[] } {
  const files: RawFiles = {};
  const errors: ContentError[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.ya?ml$/.test(entry.name)) {
        const rel = relative(root, full).split(sep).join('/');
        try {
          files[rel] = parse(readFileSync(full, 'utf8'));
        } catch (e) {
          errors.push({
            file: rel,
            path: '(syntaxe YAML)',
            message: (e as Error).message.split('\n')[0]!,
          });
        }
      }
    }
  };
  walk(root);
  return { files, errors };
}

/** Lecture + validation complètes. Les erreurs de syntaxe masquent les erreurs dérivées du même fichier. */
export function loadContent(root: string): { content: Content | null; errors: ContentError[] } {
  const read = readContentDir(root);
  const built = buildContent(read.files);
  const broken = new Set(read.errors.map((e) => e.file));
  const errors = [...read.errors, ...built.errors.filter((e) => !broken.has(e.file))];
  return { content: errors.length === 0 ? built.content : null, errors };
}
