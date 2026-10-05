import type { Mode } from '../state/store.ts';

/*
 * Choix du mode au démarrage : la 3D par défaut, le mode classique d'office sans WebGL ou sur un
 * appareil trop faible. Un choix explicite du visiteur l'emporte toujours : on tente la 3D, et si
 * elle ne démarre pas (Failsafe dans App), on revient au classique avec une explication.
 */

export interface Capabilities {
  webgl: boolean;
  lowEnd: boolean;
  reducedMotion: boolean;
}

/** Rendu WebGL logiciel (pas de GPU) : utilisable mais trop lent pour le vaisseau. */
const SOFTWARE_RENDERER = /swiftshader|llvmpipe|softpipe|software|basic render/i;

export function detectCapabilities(): Capabilities {
  let webgl: boolean;
  let software = false;
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl');
    webgl = !!gl;
    const info = gl?.getExtension('WEBGL_debug_renderer_info');
    if (gl && info)
      software = SOFTWARE_RENDERER.test(String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)));
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
  } catch {
    webgl = false;
  }
  // deviceMemory n'existe que dans Chromium. On n'utilise pas hardwareConcurrency : Safari iOS,
  // Firefox (anti-pistage) et Brave le plafonnent volontairement à 2, ce qui classait à tort
  // des machines récentes comme « faibles ».
  const nav = navigator as Navigator & { deviceMemory?: number };
  const lowEnd = software || (nav.deviceMemory !== undefined && nav.deviceMemory <= 2);
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  return { webgl, lowEnd, reducedMotion };
}

/** La 3D est-elle proposée d'office sur cet appareil ? */
export const canRun3d = (caps: Capabilities) => caps.webgl;

export function chooseMode(caps: Capabilities, preferred: Mode | null, failed = false): Mode {
  if (failed) return 'classic';
  if (preferred) return preferred;
  return caps.webgl && !caps.lowEnd ? '3d' : 'classic';
}
