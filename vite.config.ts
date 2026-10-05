import { execSync } from 'node:child_process';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { contentPlugin } from './src/content/vite-plugin.ts';

const git = (args: string) => {
  try {
    return execSync(`git ${args}`, { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
  } catch {
    return '';
  }
};

/** Commit déployé et tout premier commit du dépôt (la CI clone tout l'historique). */
function buildInfo() {
  const root = git('rev-list --max-parents=0 HEAD').split('\n').pop() ?? '';
  return {
    commit: git('rev-parse --short HEAD') || 'dev',
    root: root ? root.slice(0, 7) : '5f79f78',
    rootMessage: (root && git(`log -1 --format=%s ${root}`)) || 'Initial commit',
    date: new Date().toISOString(),
  };
}

// GitHub Pages sert le site sous /Portfolio-overpowered/ ; le dev local et l'image Docker sous /.
// VITE_BASE permet de surcharger (ex. VITE_BASE=/ npm run build pour le homelab).
export default defineConfig(({ command, isPreview }) => ({
  base:
    process.env.VITE_BASE ?? (command === 'build' || isPreview ? '/Portfolio-overpowered/' : '/'),
  plugins: [react(), contentPlugin()],
  define: { __BUILD__: JSON.stringify(buildInfo()) },
}));
