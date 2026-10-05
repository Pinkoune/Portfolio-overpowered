import { resolve } from 'node:path';
import type { Plugin } from 'vite';
import { formatErrors } from './build.ts';
import { loadContent } from './read.ts';

const VIRTUAL_ID = 'virtual:content';
const RESOLVED_ID = '\0' + VIRTUAL_ID;

/**
 * Expose content/ validé sous forme de module virtuel JSON : le navigateur ne reçoit ni YAML ni Zod.
 * Un contenu invalide fait échouer le build (et affiche l'overlay d'erreur en dev).
 */
export function contentPlugin(): Plugin {
  let root = '';
  return {
    name: 'pk-content',
    configResolved(config) {
      root = resolve(config.root, 'content');
    },
    resolveId(id) {
      return id === VIRTUAL_ID ? RESOLVED_ID : undefined;
    },
    load(id) {
      if (id !== RESOLVED_ID) return;
      this.addWatchFile(root);
      const { content, errors } = loadContent(root);
      if (!content) throw new Error(`Contenu invalide :\n${formatErrors(errors)}`);
      return `export default ${JSON.stringify(content)};`;
    },
    configureServer(server) {
      server.watcher.add(root);
      const reload = (file: string) => {
        if (!file.startsWith(root)) return;
        const mod = server.moduleGraph.getModuleById(RESOLVED_ID);
        if (mod) server.moduleGraph.invalidateModule(mod);
        server.ws.send({ type: 'full-reload' });
      };
      server.watcher.on('change', reload);
      server.watcher.on('add', reload);
      server.watcher.on('unlink', reload);
    },
  };
}
