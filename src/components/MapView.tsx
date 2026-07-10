import { useEffect } from 'react'
import {
  MapContainer,
  TileLayer,
  Marker,
  CircleMarker,
  Tooltip,
  Popup,
  useMap,
  useMapEvents,
} from 'react-leaflet'
import { useTranslation } from 'react-i18next'
import { CATEGORIES } from '../data/categories'
import type { Issue } from '../data/types'
import { makeMarkerIcon, INDIA_CENTER } from '../lib/leaflet'
import { shortId } from '../lib/format'
import { clusterIssues } from '../lib/cluster'

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
  /** Render density hotspots (grid clusters) instead of individual pins. */
  cluster?: boolean
}

/** Colour a hotspot by how many reports it contains. */
function hotspotColor(count: number): string {
  if (count >= 10) return '#dc2626'
  if (count >= 5) return '#ea580c'
  if (count >= 2) return '#ca8a04'
  return '#0f8a4f'
}

export function MapView({
  issues = [],
  center,
  zoom = 12,
  className = 'h-full w-full',
  onPlace,
  picked,
  onSelectIssue,
  cluster = false,
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

        {/* Hotspot mode: one sized/coloured circle per grid cell (density). */}
        {cluster &&
          clusterIssues(issues).map((c, i) => (
            <CircleMarker
              key={`c${i}`}
              center={[c.lat, c.lng]}
              radius={8 + Math.min(c.count, 25) * 1.6}
              pathOptions={{
                color: hotspotColor(c.count),
                fillColor: hotspotColor(c.count),
                fillOpacity: 0.35,
                weight: 2,
              }}
            >
              <Tooltip direction="top">{c.count}</Tooltip>
            </CircleMarker>
          ))}

        {!cluster &&
          issues.map((issue) => (
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
