import { useEffect } from 'react';
import { useStore } from '../state/store.ts';
import { sound } from './sound.ts';

/**
 * Relie le son à l'état du vaisseau : réglage on/off, trajets, panneaux, succès, embarquement
 * (la montée de rang joue son accord depuis RankUp, au moment où elle s'affiche).
 * Monté avec la 3D seulement : le mode classique reste silencieux.
 */
export function SoundDirector() {
  useEffect(() => {
    sound.setEnabled(useStore.getState().soundOn);
    const unsubscribe = useStore.subscribe((s, prev) => {
      if (s.soundOn !== prev.soundOn) {
        sound.setEnabled(s.soundOn);
        if (s.soundOn) sound.play('click');
      }
      if (s.traveling !== prev.traveling) sound.play(s.traveling ? 'whoosh' : 'arrive');
      if (s.panel !== prev.panel) {
        if (s.panel && s.panel.kind !== prev.panel?.kind) sound.play('open');
        else if (!s.panel) sound.play('close');
      }
      if (s.toasts.length > prev.toasts.length) sound.play('chime');
      if (s.embarking && !prev.embarking) sound.play('board');
    });
    return () => {
      unsubscribe();
      sound.setEnabled(false);
    };
  }, []);
  return null;
}
