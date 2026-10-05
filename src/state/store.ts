import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { content } from '../content/index.ts';
import type { RoomId } from '../content/schema.ts';
import { applyEvent, emptyProgress, type GameEvent, type Progress } from '../game/engine.ts';
import { rulesFrom } from '../game/rules.ts';
import { detectLang, type Lang } from '../i18n/lang.ts';
import { safeStorage } from './safeStorage.ts';

/*
 * État global, découpé en tranches :
 * - réglages : langue, mode préféré, son (persistés) ;
 * - navigation : salle courante, salles vues, panneau ouvert (session) ;
 * - vaisseau : arrivée à bord ; progression : XP, succès, toasts.
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
  | { kind: 'contact' }
  | { kind: 'trophies' };

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

const rules = rulesFrom(content);

/** Toast de succès en cours d'affichage (DA Motion IV : 4 s, jusqu'à 3 empilés). */
export interface Toast {
  key: number;
  achievement: string;
}

interface ProgressSlice {
  progress: Progress;
  toasts: Toast[];
  /** Rang atteint à célébrer (Motion V), affiché après le toast. */
  rankUp: number | null;
  /** Le visiteur a quitté le vaisseau pour le mode classique (succès « Rétrocompatible »). */
  leftForClassic: boolean;
  emit: (type: GameEvent, value?: string) => void;
  dismissToast: (key: number) => void;
  dismissRankUp: () => void;
  resetProgress: () => void;
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
  /** Son du vaisseau, coupé par défaut (brief). */
  soundOn: boolean;
  toggleSound: () => void;
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

export type Store = SettingsSlice & NavSlice & ShipSlice & ProgressSlice;

let toastKey = 0;

const bootState = {
  stage: 'boot' as Stage,
  sceneReady: false,
  introReady: false,
  skipIntro: false,
};

/** Ouvrir certains panneaux compte pour la progression. */
function panelEvent(panel: Panel): [GameEvent, string?] | null {
  switch (panel.kind) {
    case 'project': {
      const archived = content.projects.find((p) => p.id === panel.id)?.archived;
      return [archived ? 'archive.open' : 'project.open', panel.id];
    }
    case 'skills':
      return ['skill.inspect', panel.id];
    case 'journey':
      return ['journey.open', panel.id];
    case 'pupil':
      return ['blackhole.click'];
    case 'passion':
      if (panel.id === 'bass') return ['bass.play'];
      if (panel.id === 'moto') return ['helmet.click'];
      return null;
    default:
      return null;
  }
}

const browserLangs = () => (typeof navigator === 'undefined' ? [] : (navigator.languages ?? []));

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      lang: detectLang(browserLangs()),
      setLang: (lang) => {
        if (lang === get().lang) return;
        set({ lang });
        get().emit('lang.switch');
      },

      progress: emptyProgress(),
      toasts: [],
      rankUp: null,
      leftForClassic: false,
      emit: (type, value) => {
        const before = get().progress;
        const out = applyEvent(before, rules, { type, value, at: Date.now() });
        if (out.progress === before) return;
        const toasts = out.unlocked.map((achievement) => ({ key: ++toastKey, achievement }));
        set((s) => ({
          progress: out.progress,
          toasts: [...s.toasts, ...toasts].slice(-3),
          rankUp: out.rankAfter > out.rankBefore ? out.rankAfter : s.rankUp,
        }));
      },
      dismissToast: (key) => set((s) => ({ toasts: s.toasts.filter((t) => t.key !== key) })),
      dismissRankUp: () => set({ rankUp: null }),
      resetProgress: () => set({ progress: emptyProgress(), toasts: [], rankUp: null }),
      preferredMode: null,
      setPreferredMode: (preferredMode) => {
        const { leftForClassic, stage } = get();
        set({
          preferredMode,
          panel: null,
          ...(preferredMode === '3d' && { ...bootState, threeFailed: false }),
          ...(preferredMode === 'classic' && stage === 'aboard' && { leftForClassic: true }),
        });
        if (preferredMode === '3d' && leftForClassic) {
          set({ leftForClassic: false });
          get().emit('classic.roundtrip');
        }
      },
      threeFailed: false,
      setThreeFailed: (threeFailed) => set({ threeFailed }),
      soundOn: false,
      toggleSound: () => {
        const soundOn = !get().soundOn;
        set({ soundOn });
        if (!soundOn) get().emit('sound.mute');
      },

      ...bootState,
      embarking: false,
      introSeen: false,
      fade: false,
      setSceneReady: () => set({ sceneReady: true }),
      setIntroReady: () => set({ introReady: true }),
      requestSkip: () => set({ skipIntro: true }),
      embark: () => set((s) => (s.stage === 'boot' && !s.embarking ? { embarking: true } : {})),
      finishEmbark: () => {
        set({ stage: 'aboard', embarking: false, introSeen: true });
        get().emit('ship.board');
        get().emit('room.visit', get().room);
      },
      setFade: (fade) => set({ fade }),

      room: 'bridge',
      visited: [],
      panel: null,
      traveling: false,
      setTraveling: (traveling) => set({ traveling }),
      goTo: (room) => {
        set((s) => ({
          room,
          panel: null,
          visited: s.visited.includes(room) ? s.visited : [...s.visited, room],
        }));
        if (get().stage === 'aboard') get().emit('room.visit', room);
      },
      openPanel: (panel) => {
        set({ panel });
        const event = panelEvent(panel);
        if (event) get().emit(...event);
      },
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
        soundOn: state.soundOn,
        progress: state.progress,
      }),
    },
  ),
);
