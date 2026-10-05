import type { Object3D } from 'three';
import { create } from 'zustand';
import type { HotspotButton } from '../ui/Hotspot.tsx';

/*
 * Registre des hotspots. La scène 3D déclare des ancres (Object3D) ; la couche DOM (HotspotLayer)
 * affiche un bouton par ancre ; HotspotProjector recopie à chaque image la position projetée.
 * Les boutons vivent ainsi dans l'arbre React principal (accessibles, une seule racine React).
 */

export type HotspotProps = Omit<Parameters<typeof HotspotButton>[0], 'onActivate'> & {
  onActivate: () => void;
};

export interface HotspotEntry {
  id: string;
  anchor: Object3D;
  props: HotspotProps;
}

interface Registry {
  entries: HotspotEntry[];
  upsert: (entry: HotspotEntry) => void;
  remove: (id: string) => void;
}

export const useHotspots = create<Registry>()((set) => ({
  entries: [],
  upsert: (entry) =>
    set((s) => {
      const i = s.entries.findIndex((e) => e.id === entry.id);
      if (i < 0) return { entries: [...s.entries, entry] };
      const entries = [...s.entries];
      entries[i] = entry;
      return { entries };
    }),
  remove: (id) => set((s) => ({ entries: s.entries.filter((e) => e.id !== id) })),
}));

/** Éléments DOM des hotspots, positionnés directement à chaque image (sans re-rendu React). */
export const hotspotElements = new Map<string, HTMLElement>();
