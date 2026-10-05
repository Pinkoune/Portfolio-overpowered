import type { Localized, Name } from '../content/schema.ts';

export const LANGS = ['fr', 'en'] as const;
export type Lang = (typeof LANGS)[number];
export const DEFAULT_LANG: Lang = 'fr';

/** Première langue supportée dans les préférences du navigateur, sinon le français. */
export function detectLang(preferred: readonly string[] = []): Lang {
  for (const tag of preferred) {
    const base = tag.toLowerCase().split('-')[0];
    if (base === 'fr' || base === 'en') return base;
  }
  return DEFAULT_LANG;
}

export const translate = (value: Localized, lang: Lang): string => value[lang];

export const translateName = (value: Name, lang: Lang): string =>
  typeof value === 'string' ? value : value[lang];

/** Remplace les {param} d'une chaîne. */
export function interpolate(text: string, params: Record<string, string | number> = {}): string {
  return text.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in params ? String(params[key]) : match,
  );
}

/** "2025-01" → "janv. 2025" / "Jan 2025" ; "2025" → "2025". */
export function formatYearMonth(value: string, lang: Lang): string {
  const [year, month] = value.split('-');
  if (!month) return year!;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, 1));
  return new Intl.DateTimeFormat(lang === 'fr' ? 'fr-FR' : 'en-GB', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}
