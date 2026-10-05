/*
 * Courbes et durées de la DA (Motion.dc.html + pk-motion.js).
 * - Bézier CSS : pour CSS et Motion.
 * - Fonctions JS : portage exact de pk-motion.js, pour les animations pilotées à la main (3D, canvas).
 */
export const bezier = {
  out: [0.16, 1, 0.3, 1],
  io: [0.65, 0, 0.35, 1],
  back: [0.34, 1.56, 0.64, 1],
} as const;

export const duration = { fast: 0.14, base: 0.28, slow: 0.56, cine: 1.8 } as const;

export const ease = {
  out: (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  io: (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  back: (t: number) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
  lin: (t: number) => t,
};

/** Progression d'un segment [a, b] (ms) d'une timeline, avec easing — `seg` de pk-motion.js. */
export function seg(t: number, a: number, b: number, e: keyof typeof ease = 'out'): number {
  const x = Math.min(1, Math.max(0, (t - a) / (b - a)));
  return ease[e](x);
}
