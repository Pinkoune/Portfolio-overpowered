import { afterEach, describe, expect, it, vi } from 'vitest';
import { detectLang, formatYearMonth, interpolate, translateName } from '../src/i18n/lang.ts';
import { safeStorage } from '../src/state/safeStorage.ts';

describe('détection de la langue', () => {
  it('prend la première langue supportée du navigateur', () => {
    expect(detectLang(['en-US', 'fr-FR'])).toBe('en');
    expect(detectLang(['fr-CA'])).toBe('fr');
    expect(detectLang(['de-DE', 'en-GB'])).toBe('en');
  });

  it('retombe sur le français par défaut', () => {
    expect(detectLang([])).toBe('fr');
    expect(detectLang(['de-DE', 'es'])).toBe('fr');
  });
});

describe('formatage', () => {
  it('remplace les paramètres', () => {
    expect(interpolate('Niveau {n} sur 5', { n: 4 })).toBe('Niveau 4 sur 5');
    expect(interpolate('{inconnu}', {})).toBe('{inconnu}');
  });

  it('formate les dates de parcours dans chaque langue', () => {
    expect(formatYearMonth('2025-01', 'fr')).toBe('janv. 2025');
    expect(formatYearMonth('2025-01', 'en')).toBe('Jan 2025');
    expect(formatYearMonth('2022', 'en')).toBe('2022');
  });

  it('traduit les noms bilingues et garde les noms propres', () => {
    expect(translateName('Kubernetes', 'en')).toBe('Kubernetes');
    expect(translateName({ fr: 'Rigueur', en: 'Rigour' }, 'en')).toBe('Rigour');
  });
});

describe('stockage protégé', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('fonctionne sans localStorage (navigation privée, blocage)', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('SecurityError');
      },
      setItem: () => {
        throw new Error('QuotaExceededError');
      },
      removeItem: () => {
        throw new Error('SecurityError');
      },
    });
    expect(() => safeStorage.setItem('k', 'v')).not.toThrow();
    expect(safeStorage.getItem('k')).toBe('v');
    expect(() => safeStorage.removeItem('k')).not.toThrow();
    expect(safeStorage.getItem('k')).toBeNull();
  });
});
