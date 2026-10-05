import { useCallback, useMemo } from 'react';
import { content } from '../content/index.ts';
import type { Localized, Name, UiKey } from '../content/schema.ts';
import { useStore } from '../state/store.ts';
import { formatYearMonth, interpolate, translate, translateName } from './lang.ts';

/** Accès aux textes dans la langue courante. */
export function useT() {
  const lang = useStore((s) => s.lang);
  const t = useCallback((value: Localized) => translate(value, lang), [lang]);
  const ui = useCallback(
    (key: UiKey, params?: Record<string, string | number>) =>
      interpolate(translate(content.ui[key], lang), params),
    [lang],
  );
  const name = useCallback((value: Name) => translateName(value, lang), [lang]);
  const date = useCallback((value: string) => formatYearMonth(value, lang), [lang]);
  return useMemo(() => ({ lang, t, ui, name, date }), [lang, t, ui, name, date]);
}
