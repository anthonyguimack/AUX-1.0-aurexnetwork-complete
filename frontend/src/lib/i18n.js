/**
 * Simple i18n helper: resolves localized values from any admin-written
 * field that may be either a plain string (legacy) or a `{ en, es, … }`
 * locale map. Never throws — always returns a string.
 *
 *   t(value, lang, fallbacks) →
 *     if string   → the string
 *     if object   → value[lang] || value[fallback[0]] || first non-empty
 *                   || '' (never undefined)
 *
 * Admins may start writing translations gradually: an untranslated field
 * stays as plain string and continues to work.
 */
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export function t(value, lang = 'en', fallbacks = []) {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && !Array.isArray(value)) {
    if (value[lang] != null && value[lang] !== '') return String(value[lang]);
    for (const fb of fallbacks) {
      if (value[fb] != null && value[fb] !== '') return String(value[fb]);
    }
    // Return first non-empty value from the object.
    for (const k of Object.keys(value)) {
      if (value[k] != null && value[k] !== '') return String(value[k]);
    }
    return '';
  }
  return String(value);
}

/** Upgrade a string → object when admin starts translating.
 *  Used inside LocalizedField to emit writes without destroying legacy data. */
export function setLocaleValue(current, lang, newValue) {
  if (typeof current === 'object' && current !== null && !Array.isArray(current)) {
    return { ...current, [lang]: newValue };
  }
  // current is string or empty — initialize an object keeping old string
  // under the admin's original default language (we don't know it here, so
  // stash under the new lang plus the raw string as legacy fallback).
  const base = typeof current === 'string' && current ? { _legacy: current } : {};
  return { ...base, [lang]: newValue };
}

/** Extract the value shown in a specific locale tab of the admin UI. */
export function getLocaleValue(current, lang) {
  if (typeof current === 'string') return current;
  if (current && typeof current === 'object') return current[lang] ?? '';
  return '';
}

// ─── Language context (reads enabled languages from settings) ──────────

const LangContext = createContext({ lang: 'en', setLang: () => {}, enabled: ['en'], defaultLang: 'en' });

export function LanguageProvider({ settings, children }) {
  const enabled = useMemo(() => (settings?.languages && settings.languages.length ? settings.languages : ['en']), [settings?.languages]);
  const defaultLang = settings?.default_language || enabled[0] || 'en';
  // Resolve initial language: URL ?lang= → localStorage → default.
  const [lang, setLangState] = useState(() => {
    if (typeof window === 'undefined') return defaultLang;
    const urlLang = new URLSearchParams(window.location.search).get('lang');
    const stored = localStorage.getItem('aurex_locale');
    const candidate = urlLang || stored || defaultLang;
    return enabled.includes(candidate) ? candidate : defaultLang;
  });
  // If admin removes the active language from settings, fall back gracefully.
  useEffect(() => { if (!enabled.includes(lang)) setLangState(defaultLang); }, [enabled, lang, defaultLang]);
  const setLang = (l) => {
    if (!enabled.includes(l)) return;
    setLangState(l);
    try { localStorage.setItem('aurex_locale', l); } catch {}
  };
  const value = useMemo(() => ({ lang, setLang, enabled, defaultLang }), [lang, enabled, defaultLang]);
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang() { return useContext(LangContext); }

/** Hook helper: `const tt = useT(); tt(value)` — shorthand that pulls lang + default from context. */
export function useT() {
  const { lang, defaultLang } = useLang();
  return (v) => t(v, lang, lang !== defaultLang ? [defaultLang] : []);
}

// Static human labels for the switcher
export const LANGUAGE_LABELS = {
  en: { name: 'English',    short: 'EN' },
  es: { name: 'Español',    short: 'ES' },
  fr: { name: 'Français',   short: 'FR' },
  de: { name: 'Deutsch',    short: 'DE' },
  it: { name: 'Italiano',   short: 'IT' },
  pt: { name: 'Português',  short: 'PT' },
};
