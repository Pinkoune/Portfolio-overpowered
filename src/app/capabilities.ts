import type { Mode } from '../state/store.ts';

/*
 * Choix du mode au démarrage : la 3D par défaut, le mode classique d'office sans WebGL ou sur un
 * appareil trop faible. Un choix explicite du visiteur l'emporte, sauf si la 3D est impossible.
 */

export interface Capabilities {
  webgl: boolean;
  lowEnd: boolean;
  reducedMotion: boolean;
}

export function detectCapabilities(): Capabilities {
  let webgl: boolean;
  try {
    const canvas = document.createElement('canvas');
    webgl = !!(canvas.getContext('webgl2') ?? canvas.getContext('webgl'));
  } catch {
    webgl = false;
  }
  const nav = navigator as Navigator & { deviceMemory?: number };
  const lowEnd =
    (nav.deviceMemory !== undefined && nav.deviceMemory <= 2) ||
    (nav.hardwareConcurrency !== undefined && nav.hardwareConcurrency <= 2);
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  return { webgl, lowEnd, reducedMotion };
}

/** La 3D est-elle proposable sur cet appareil ? */
export const canRun3d = (caps: Capabilities) => caps.webgl;

export function chooseMode(caps: Capabilities, preferred: Mode | null): Mode {
  if (!canRun3d(caps)) return 'classic';
  if (preferred) return preferred;
  return caps.lowEnd ? 'classic' : '3d';
}
