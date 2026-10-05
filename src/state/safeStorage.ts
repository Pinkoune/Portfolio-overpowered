import type { StateStorage } from 'zustand/middleware';

/**
 * localStorage protégé : navigation privée, stockage bloqué ou quota plein ne doivent jamais
 * casser le site. En cas d'échec, on retombe sur une mémoire volatile.
 */
const memory = new Map<string, string>();

export const safeStorage: StateStorage = {
  getItem(name) {
    try {
      return globalThis.localStorage?.getItem(name) ?? memory.get(name) ?? null;
    } catch {
      return memory.get(name) ?? null;
    }
  },
  setItem(name, value) {
    memory.set(name, value);
    try {
      globalThis.localStorage?.setItem(name, value);
    } catch {
      /* stockage indisponible : la mémoire suffit pour la session */
    }
  },
  removeItem(name) {
    memory.delete(name);
    try {
      globalThis.localStorage?.removeItem(name);
    } catch {
      /* idem */
    }
  },
};
