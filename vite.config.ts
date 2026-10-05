import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { contentPlugin } from './src/content/vite-plugin.ts';

// GitHub Pages sert le site sous /Portfolio-overpowered/ ; le dev local et l'image Docker sous /.
// VITE_BASE permet de surcharger (ex. VITE_BASE=/ npm run build pour le homelab).
export default defineConfig(({ command, isPreview }) => ({
  base:
    process.env.VITE_BASE ?? (command === 'build' || isPreview ? '/Portfolio-overpowered/' : '/'),
  plugins: [react(), contentPlugin()],
}));
