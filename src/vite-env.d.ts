/// <reference types="vite/client" />

/** Informations de build injectées par vite.config.ts (commit déployé, tout premier commit). */
declare const __BUILD__: { commit: string; root: string; rootMessage: string; date: string };

declare module 'virtual:content' {
  const content: import('./content/build.ts').Content;
  export default content;
}
