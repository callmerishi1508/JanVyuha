import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import en from '../locales/en'
import hi from '../locales/hi'
import te from '../locales/te'
import ta from '../locales/ta'
import { BRAND } from '../config/brand'
import { DEFAULT_LOCALE } from './config'
import type { CategoryId, DepartmentId } from '../data/categories'
import type { IssueStatus } from '../data/categories'
import { DEPARTMENTS } from '../data/categories'

export const SUPPORTED = ['en', 'hi', 'te', 'ta'] as const
export type Locale = (typeof SUPPORTED)[number]

const STORAGE_KEY = 'janvyuha.lang'

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      hi: { translation: hi },
      te: { translation: te },
      ta: { translation: ta },
    },
    // Priority: user's saved choice → brand/env default → English.
    fallbackLng: 'en',
    supportedLngs: SUPPORTED as unknown as string[],
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: STORAGE_KEY,
      caches: ['localStorage'],
    },
    interpolation: { escapeValue: false },
  })

// If the user has no saved preference, honour the brand/env default locale.
if (!localStorage.getItem(STORAGE_KEY)) {
  const preferred = (DEFAULT_LOCALE || BRAND.defaultLocale) as Locale
  if (SUPPORTED.includes(preferred)) i18n.changeLanguage(preferred)
}

function applyHtmlLang(lng: string) {
  document.documentElement.setAttribute('lang', lng)
}
applyHtmlLang(i18n.language)
i18n.on('languageChanged', applyHtmlLang)

export function setLocale(lng: Locale) {
  i18n.changeLanguage(lng)
}

/** Current locale for passing to Nominatim / Intl date formatting. */
export function currentLocale(): Locale {
  return (SUPPORTED.includes(i18n.language as Locale) ? i18n.language : 'en') as Locale
}

/** Localised category display name (falls back to the data constant). */
export function tCategory(id: CategoryId): string {
  return i18n.t(`categoryNames.${id}`, { defaultValue: id })
}

/** Localised issue status label. */
export function tStatus(status: IssueStatus): string {
  return i18n.t(`statuses.${status}`, { defaultValue: status })
}

/** Localised department name (falls back to the English data constant). */
export function tDept(id: DepartmentId): string {
  return i18n.t(`deptNames.${id}`, { defaultValue: DEPARTMENTS[id].name })
}

/** Localised short department label (falls back to the English data constant). */
export function tDeptShort(id: DepartmentId): string {
  return i18n.t(`deptShort.${id}`, { defaultValue: DEPARTMENTS[id].short })
}

/**
 * Localised "why this department is involved" reason for a conditional routing
 * suggestion. Keyed by category+department; falls back to the English data
 * string, so a missing translation degrades gracefully instead of breaking.
 */
export function tReason(
  category: CategoryId,
  dept: DepartmentId,
  fallback: string
): string {
  return i18n.t(`routing.${category}_${dept}.reason`, { defaultValue: fallback })
}

/** Localised plain-language confirmation question for a conditional department. */
export function tQuestion(
  category: CategoryId,
  dept: DepartmentId,
  fallback: string
): string {
  return i18n.t(`routing.${category}_${dept}.question`, { defaultValue: fallback })
}

export default i18n
