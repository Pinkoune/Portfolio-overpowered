import { resolve } from 'node:path';
import { formatErrors } from '../src/content/build.ts';
import { loadContent } from '../src/content/read.ts';

const { content, errors } = loadContent(resolve(import.meta.dirname, '../content'));

if (!content) {
  console.error(`✗ Contenu invalide (${errors.length} erreur${errors.length > 1 ? 's' : ''}) :\n`);
  console.error(formatErrors(errors));
  process.exit(1);
}

console.log(
  `✓ Contenu valide : ${content.projects.length} projets, ${content.journey.length} étapes, ` +
    `${content.skills.length} catégories de compétences, ${content.achievements.length} succès.`,
);
