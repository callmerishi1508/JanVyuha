import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Languages, Check } from 'lucide-react'
import { SUPPORTED, setLocale, type Locale } from '../lib/i18n'
import { cn } from '../lib/cn'

/** Header language picker (EN / हिन्दी / తెలుగు / தமிழ்). */
export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { t, i18n } = useTranslation()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onEsc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onEsc)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onEsc)
    }
  }, [open])

  const current = (
    SUPPORTED.includes(i18n.language as Locale) ? i18n.language : 'en'
  ) as Locale

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-semibold text-ink-700 hover:bg-slate-100"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t('lang.label')}
      >
        <Languages className="h-4 w-4" />
        {!compact && <span>{t(`lang.${current}`)}</span>}
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-1 w-40 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lift"
        >
          {SUPPORTED.map((lng) => (
            <button
              key={lng}
              role="menuitemradio"
              aria-checked={current === lng}
              onClick={() => {
                setLocale(lng)
                setOpen(false)
              }}
              className={cn(
                'flex w-full items-center justify-between px-3 py-2 text-sm hover:bg-slate-50',
                current === lng ? 'font-bold text-ink-900' : 'text-ink-700'
              )}
            >
              {t(`lang.${lng}`)}
              {current === lng && <Check className="h-4 w-4 text-ashoka-600" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
