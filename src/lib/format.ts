import i18n, { currentLocale } from './i18n'

/** Intl locale tag for the active UI language (e.g. 'hi-IN'). */
function intlLocale(): string {
  return `${currentLocale()}-IN`
}

/** Human-friendly, localised "time ago" for issue timestamps. */
export function timeAgo(iso: string): string {
  const then = new Date(iso).getTime()
  const diff = Date.now() - then
  const mins = Math.round(diff / 60000)
  if (mins < 1) return i18n.t('time.justNow')
  if (mins < 60) return i18n.t('time.minAgo', { count: mins })
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return i18n.t('time.hrAgo', { count: hrs })
  const days = Math.round(hrs / 24)
  if (days < 30) return i18n.t('time.dayAgo', { count: days })
  return new Date(iso).toLocaleDateString(intlLocale(), {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

/** Formats a full date-time in the active locale. */
export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(intlLocale(), {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Generates a new report reference id, e.g. JV-4821. This is the single source
 * of truth an issue's `refId` — display code should read `issue.refId` rather
 * than deriving its own id from `issue.id` (the internal row id), which used to
 * produce a different-looking string a citizen couldn't search by.
 */
export function generateRefId(): string {
  return 'JV-' + Math.floor(1000 + Math.random() * 9000)
}
