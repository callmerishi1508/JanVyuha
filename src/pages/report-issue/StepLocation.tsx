import { useTranslation } from 'react-i18next'
import { Crosshair, MapPin, Loader2, Search } from 'lucide-react'
import { MapView } from '../../components/MapView'
import type { ReportForm } from './useReportForm'

export function StepLocation({ form }: { form: ReportForm }) {
  const { t } = useTranslation()
  return (
    <div className="animate-fade-in space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-ink-900">{t('report.whereIssue')}</h2>
        <button
          onClick={form.detectLocation}
          className="btn-outline"
          disabled={form.locating}
        >
          {form.locating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Crosshair className="h-4 w-4" />
          )}
          {t('report.useCurrentLocation')}
        </button>
      </div>

      <div className="rounded-lg bg-blue-50 p-3 text-xs text-blue-700">
        <MapPin className="mr-1 inline h-3.5 w-3.5" />
        {t('report.searchHint')}
      </div>

      {/* Address search */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <input
          className="input pl-9"
          placeholder={t('report.searchPlaceholder')}
          aria-label={t('report.searchPlaceholder')}
          value={form.searchQ}
          onChange={(e) => form.setSearchQ(e.target.value)}
        />
        {form.searching && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-500" />
        )}
        {form.searchResults.length > 0 && (
          <ul className="absolute z-[500] mt-1 max-h-60 w-full overflow-auto rounded-lg border border-slate-200 bg-white shadow-lift">
            {form.searchResults.map((r, i) => (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => form.pickSearchResult(r)}
                  className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm hover:bg-slate-50"
                >
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-saffron-500" />
                  <span className="text-slate-700">{r.label}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <MapView
        className="h-[320px] w-full"
        onPlace={form.placePin}
        picked={form.picked}
        center={form.picked ? [form.picked.lat, form.picked.lng] : undefined}
        zoom={form.picked ? 16 : 5}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="loc-address" className="label">
            {t('report.addressLabel')}
          </label>
          <input
            id="loc-address"
            className="input"
            placeholder={t('report.addressPlaceholder')}
            value={form.address}
            onChange={(e) => form.setAddress(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="loc-city" className="label">
            {t('report.cityLabel')}
          </label>
          <input
            id="loc-city"
            className="input"
            value={form.city}
            onChange={(e) => form.setCity(e.target.value)}
            placeholder={t('report.cityPlaceholder')}
          />
        </div>
        <div>
          <label htmlFor="loc-state" className="label">
            {t('report.stateLabel')}
          </label>
          <input
            id="loc-state"
            className="input"
            value={form.state}
            onChange={(e) => form.setState(e.target.value)}
            placeholder={t('report.statePlaceholder')}
          />
        </div>
      </div>
      {form.picked && (
        <p className="text-xs text-slate-500">
          {t('report.pinnedAt', {
            lat: form.picked.lat.toFixed(5),
            lng: form.picked.lng.toFixed(5),
          })}
        </p>
      )}
    </div>
  )
}
