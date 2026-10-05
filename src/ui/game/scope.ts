import { content, type Achievement } from '../../content/index.ts';
import type { Localized } from '../../content/schema.ts';

/** Libellé de la portée d'un succès : nom de salle, « Vaisseau » ou « HUD ». */
export function scopeLabel(
  a: Achievement,
  t: (l: Localized) => string,
  ui: (key: 'scope.ship' | 'scope.hud') => string,
) {
  if (a.scope === 'ship') return ui('scope.ship');
  if (a.scope === 'hud') return ui('scope.hud');
  const room = content.rooms.find((r) => r.id === a.scope);
  return room ? t(room.name) : a.scope;
}
