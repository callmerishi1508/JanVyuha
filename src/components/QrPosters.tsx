import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import QRCode from 'qrcode'
import toast from 'react-hot-toast'
import { Download, QrCode as QrIcon, Loader2 } from 'lucide-react'
import { CATEGORY_LIST } from '../data/categories'
import type { CategoryId } from '../data/categories'
import { BRAND } from '../config/brand'
import { tCategory } from '../lib/i18n'
import { CategoryIconTile } from './CategoryPill'

/**
 * P2-12 growth: printable QR posters for the admin console. A poster stuck at
 * a water office / ward office / bus stop deep-links straight into the report
 * wizard with the category pre-filled (`/report?category=water`), so a citizen
 * lands one tap from a filed report. Composed entirely client-side (qrcode npm
 * + canvas) — nothing uploaded anywhere.
 */

/** A4-ish portrait at ~150dpi — prints crisp, stays a small PNG. */
const W = 1240
const H = 1754

async function composePoster(link: string, heading: string, sub: string): Promise<string> {
  const qr = await QRCode.toDataURL(link, {
    width: 760,
    margin: 1,
    errorCorrectionLevel: 'M',
    color: { dark: '#0f172a', light: '#ffffff' },
  })
  const img = new Image()
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve()
    img.onerror = reject
    img.src = qr
  })

  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('canvas unavailable')

  // Plain, high-contrast layout — this gets photocopied in black & white.
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, W, H)
  ctx.fillStyle = '#0f172a'
  ctx.textAlign = 'center'

  ctx.font = 'bold 88px system-ui, sans-serif'
  ctx.fillText(BRAND.product, W / 2, 190)

  ctx.font = 'bold 64px system-ui, sans-serif'
  ctx.fillText(heading, W / 2, 330, W - 160)

  ctx.drawImage(img, (W - 760) / 2, 430, 760, 760)

  ctx.font = '600 52px system-ui, sans-serif'
  ctx.fillText(sub, W / 2, 1320, W - 160)

  ctx.font = '44px system-ui, sans-serif'
  ctx.fillStyle = '#334155'
  ctx.fillText(link.replace(/^https?:\/\//, ''), W / 2, 1420, W - 160)

  ctx.font = '36px system-ui, sans-serif'
  ctx.fillStyle = '#64748b'
  ctx.fillText(BRAND.tagline, W / 2, 1560, W - 160)

  return canvas.toDataURL('image/png')
}

export function QrPosters() {
  const { t } = useTranslation()
  const [busy, setBusy] = useState<string | null>(null)

  const mint = async (category: CategoryId | null) => {
    const key = category ?? 'general'
    setBusy(key)
    try {
      const link =
        window.location.origin + '/report' + (category ? `?category=${category}` : '')
      const heading = category ? tCategory(category) : t('admin.qrGeneralHeading')
      const url = await composePoster(link, heading, t('admin.qrScanToReport'))
      const a = document.createElement('a')
      a.href = url
      a.download = `janvyuha-qr-${key}.png`
      a.click()
    } catch {
      toast.error(t('admin.qrFailed'))
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="card p-5">
      <h3 className="flex items-center gap-2 text-sm font-bold text-ink-900">
        <QrIcon className="h-4 w-4" aria-hidden />
        {t('admin.qrTitle')}
      </h3>
      <p className="mt-1 text-xs text-slate-500">{t('admin.qrHint')}</p>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <button
          type="button"
          onClick={() => mint(null)}
          disabled={busy !== null}
          className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 text-left transition-colors hover:bg-slate-50 disabled:opacity-60"
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-ink-800 text-white">
            {busy === 'general' ? (
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
            ) : (
              <QrIcon className="h-5 w-5" aria-hidden />
            )}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-ink-900">
              {t('admin.qrGeneralHeading')}
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500">
              <Download className="h-3 w-3" aria-hidden /> {t('admin.qrDownload')}
            </span>
          </span>
        </button>

        {CATEGORY_LIST.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => mint(c.id)}
            disabled={busy !== null}
            className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 text-left transition-colors hover:bg-slate-50 disabled:opacity-60"
          >
            {busy === c.id ? (
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-slate-100">
                <Loader2 className="h-5 w-5 animate-spin text-slate-500" aria-hidden />
              </span>
            ) : (
              <CategoryIconTile category={c.id} className="h-10 w-10 shrink-0" />
            )}
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-ink-900">
                {tCategory(c.id)}
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500">
                <Download className="h-3 w-3" aria-hidden /> {t('admin.qrDownload')}
              </span>
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
