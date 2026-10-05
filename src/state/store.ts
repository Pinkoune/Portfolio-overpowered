import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { detectLang, type Lang } from '../i18n/lang.ts';
import { safeStorage } from './safeStorage.ts';

/*
 * État global. Découpé en tranches au fil des phases (nav, progression, réglages).
 * Phase 1 : réglages uniquement.
 */

interface SettingsSlice {
  lang: Lang;
  setLang: (lang: Lang) => void;
}

export type Store = SettingsSlice;

const browserLangs = () => (typeof navigator === 'undefined' ? [] : (navigator.languages ?? []));

export const useStore = create<Store>()(
  persist(
    (set) => ({
      lang: detectLang(browserLangs()),
      setLang: (lang) => set({ lang }),
    }),
    {
      name: 'pk-01',
      version: 1,
      storage: createJSONStorage(() => safeStorage),
      partialize: (state) => ({ lang: state.lang }),
    },
  ),
);
