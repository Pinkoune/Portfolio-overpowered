import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { RoomId } from '../content/schema.ts';
import { detectLang, type Lang } from '../i18n/lang.ts';
import { safeStorage } from './safeStorage.ts';

/*
 * État global, découpé en tranches :
 * - réglages : langue, mode préféré (persistés) ;
 * - navigation : salle courante, salles vues, panneau ouvert (session).
 * La progression (XP, succès) arrive en phase 4.
 */

export type Mode = '3d' | 'classic';

/** Panneau holographique ouvert : quel contenu afficher. */
export type Panel =
  | { kind: 'project'; id: string }
  | { kind: 'profile' }
  | { kind: 'pupil' }
  | { kind: 'skills'; id: string }
  | { kind: 'pipeline' }
  | { kind: 'journey'; id: string }
  | { kind: 'passion'; id: string }
  | { kind: 'games' }
  | { kind: 'contact' };

interface SettingsSlice {
  lang: Lang;
  setLang: (lang: Lang) => void;
  /** Choix explicite du visiteur ; null = décidé selon les capacités de l'appareil. */
  preferredMode: Mode | null;
  setPreferredMode: (mode: Mode) => void;
}

interface NavSlice {
  room: RoomId;
  visited: RoomId[];
  panel: Panel | null;
  /** Vrai pendant un trajet caméra entre deux salles (hotspots masqués). */
  traveling: boolean;
  goTo: (room: RoomId) => void;
  setTraveling: (traveling: boolean) => void;
  openPanel: (panel: Panel) => void;
  closePanel: () => void;
}

export type Store = SettingsSlice & NavSlice;

const browserLangs = () => (typeof navigator === 'undefined' ? [] : (navigator.languages ?? []));

export const useStore = create<Store>()(
  persist(
    (set) => ({
      lang: detectLang(browserLangs()),
      setLang: (lang) => set({ lang }),
      preferredMode: null,
      setPreferredMode: (preferredMode) => set({ preferredMode, panel: null }),

      room: 'bridge',
      visited: [],
      panel: null,
      traveling: false,
      setTraveling: (traveling) => set({ traveling }),
      goTo: (room) =>
        set((s) => ({
          room,
          panel: null,
          visited: s.visited.includes(room) ? s.visited : [...s.visited, room],
        })),
      openPanel: (panel) => set({ panel }),
      closePanel: () => set({ panel: null }),
    }),
    {
      name: 'pk-01',
      version: 1,
      storage: createJSONStorage(() => safeStorage),
      partialize: (state) => ({ lang: state.lang, preferredMode: state.preferredMode }),
    },
  ),
);
