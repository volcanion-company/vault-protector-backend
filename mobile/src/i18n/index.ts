/**
 * Internationalization (i18n) system
 */
import { useCallback } from 'react';
import { useSettingsStore } from '@/stores/settingsStore';
import { en, type Translations } from './translations/en';
import { vi } from './translations/vi';

const translations: Record<'en' | 'vi', Translations> = {
  en,
  vi,
};

/**
 * Get nested translation by dot-separated key
 */
function getNestedValue(obj: any, path: string): string {
  const keys = path.split('.');
  let result = obj;
  
  for (const key of keys) {
    if (result && typeof result === 'object' && key in result) {
      result = result[key];
    } else {
      return path; // Return key if not found
    }
  }
  
  return typeof result === 'string' ? result : path;
}

/**
 * Replace placeholders in translation string
 */
function interpolate(text: string, params?: Record<string, string | number>): string {
  if (!params) return text;
  
  return text.replace(/\{(\w+)\}/g, (match, key) => {
    return params[key]?.toString() ?? match;
  });
}

/**
 * Hook for translations
 */
export function useTranslation() {
  const language = useSettingsStore((state) => state.language);
  const currentTranslations = translations[language] || translations.en;

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      const translation = getNestedValue(currentTranslations, key);
      return interpolate(translation, params);
    },
    [currentTranslations]
  );

  return { t, language };
}

/**
 * Get translation without hook (for non-component usage)
 */
export function getTranslation(key: string, params?: Record<string, string | number>): string {
  const language = useSettingsStore.getState().language;
  const currentTranslations = translations[language] || translations.en;
  const translation = getNestedValue(currentTranslations, key);
  return interpolate(translation, params);
}

export { en, vi };
export type { Translations };
