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

/**
 * Arrivée à bord (DA Motion, « I · Intro ») :
 * boot = écran de chargement + approche du vaisseau ; aboard = dans les salles.
 */
export type Stage = 'boot' | 'aboard';

interface ShipSlice {
  stage: Stage;
  /** Le vaisseau a rendu sa première image. */
  sceneReady: boolean;
  /** La séquence d'approche est arrivée à son plan final (état « prêt » de la maquette A). */
  introReady: boolean;
  skipIntro: boolean;
  /** Flash rose du sas en cours, avant de passer à bord. */
  embarking: boolean;
  /** Visiteur connu : intro courte (2 s) la prochaine fois. Persisté. */
  introSeen: boolean;
  /** Fondu au noir (sauts lointains, mouvement réduit). */
  fade: boolean;
  setSceneReady: () => void;
  setIntroReady: () => void;
  requestSkip: () => void;
  embark: () => void;
  finishEmbark: () => void;
  setFade: (fade: boolean) => void;
}

interface SettingsSlice {
  lang: Lang;
  setLang: (lang: Lang) => void;
  /** Choix explicite du visiteur ; null = décidé selon les capacités de l'appareil. */
  preferredMode: Mode | null;
  setPreferredMode: (mode: Mode) => void;
  /** La 3D a échoué au démarrage pendant cette visite (WebGL refusé, chargement impossible). */
  threeFailed: boolean;
  setThreeFailed: (failed: boolean) => void;
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

export type Store = SettingsSlice & NavSlice & ShipSlice;

const bootState = {
  stage: 'boot' as Stage,
  sceneReady: false,
  introReady: false,
  skipIntro: false,
};

const browserLangs = () => (typeof navigator === 'undefined' ? [] : (navigator.languages ?? []));

export const useStore = create<Store>()(
  persist(
    (set) => ({
      lang: detectLang(browserLangs()),
      setLang: (lang) => set({ lang }),
      preferredMode: null,
      setPreferredMode: (preferredMode) =>
        set({
          preferredMode,
          panel: null,
          ...(preferredMode === '3d' && { ...bootState, threeFailed: false }),
        }),
      threeFailed: false,
      setThreeFailed: (threeFailed) => set({ threeFailed }),

      ...bootState,
      embarking: false,
      introSeen: false,
      fade: false,
      setSceneReady: () => set({ sceneReady: true }),
      setIntroReady: () => set({ introReady: true }),
      requestSkip: () => set({ skipIntro: true }),
      embark: () => set((s) => (s.stage === 'boot' && !s.embarking ? { embarking: true } : {})),
      finishEmbark: () => set({ stage: 'aboard', embarking: false, introSeen: true }),
      setFade: (fade) => set({ fade }),

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
      partialize: (state) => ({
        lang: state.lang,
        preferredMode: state.preferredMode,
        introSeen: state.introSeen,
      }),
    },
  ),
);
