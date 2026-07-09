import { useEffect } from 'react'
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvents,
} from 'react-leaflet'
import { useTranslation } from 'react-i18next'
import { CATEGORIES } from '../data/categories'
import type { Issue } from '../data/types'
import { makeMarkerIcon, INDIA_CENTER } from '../lib/leaflet'
import { shortId } from '../lib/format'

/** Recenters the map imperatively when the target changes. */
function Recenter({ center, zoom }: { center: [number, number]; zoom?: number }) {
  const map = useMap()
  useEffect(() => {
    map.setView(center, zoom ?? map.getZoom())
  }, [center[0], center[1], zoom]) // eslint-disable-line react-hooks/exhaustive-deps
  return null
}

/** Captures clicks to drop/move a pin (used in the report wizard). */
function ClickToPlace({
  onPlace,
}: {
  onPlace: (lat: number, lng: number) => void
}) {
  useMapEvents({
    click(e) {
      onPlace(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

export interface MapViewProps {
  issues?: Issue[]
  center?: [number, number]
  zoom?: number
  className?: string
  /** When set, clicking the map calls this with coordinates. */
  onPlace?: (lat: number, lng: number) => void
  /** A single draggable/placed pin (report wizard). */
  picked?: { lat: number; lng: number } | null
  onSelectIssue?: (issue: Issue) => void
}

export function MapView({
  issues = [],
  center,
  zoom = 12,
  className = 'h-full w-full',
  onPlace,
  picked,
  onSelectIssue,
}: MapViewProps) {
  const { t } = useTranslation()
  const initial: [number, number] =
    center ??
    (picked
      ? [picked.lat, picked.lng]
      : issues.length
        ? [issues[0].location.lat, issues[0].location.lng]
        : INDIA_CENTER)

  return (
    <div className={`overflow-hidden rounded-xl border border-slate-200 ${className}`}>
      <MapContainer
        center={initial}
        zoom={zoom}
        scrollWheelZoom
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {center && <Recenter center={center} zoom={zoom} />}
        {onPlace && <ClickToPlace onPlace={onPlace} />}

        {picked && (
          <Marker
            position={[picked.lat, picked.lng]}
            icon={makeMarkerIcon('#ff7d10', true)}
          >
            <Popup>{t('common.selectedLocation')}</Popup>
          </Marker>
        )}

        {issues.map((issue) => (
          <Marker
            key={issue.id}
            position={[issue.location.lat, issue.location.lng]}
            icon={makeMarkerIcon(CATEGORIES[issue.category].color)}
            eventHandlers={{
              click: () => onSelectIssue?.(issue),
            }}
          >
            <Popup>
              <div className="min-w-[180px]">
                <div className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  {shortId(issue.id)} · {CATEGORIES[issue.category].name}
                </div>
                <div className="mt-0.5 text-sm font-semibold text-ink-900">
                  {issue.title}
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  {issue.location.address}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
