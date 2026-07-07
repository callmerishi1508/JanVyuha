import type { CategoryId } from '../data/categories'
import type { Issue } from '../data/types'

/**
 * Spatial/temporal duplicate detection. Ten citizens reporting the same fire
 * should be recognisable as one incident. We use a simple haversine distance +
 * time window + same-category match — cheap, explainable, and good enough to
 * surface "others reported this nearby" and to let an admin merge duplicates.
 */

const EARTH_M = 6_371_000

/** Great-circle distance between two lat/lng points, in metres. */
export function haversineMeters(
  aLat: number,
  aLng: number,
  bLat: number,
  bLng: number
): number {
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(bLat - aLat)
  const dLng = toRad(bLng - aLng)
  const lat1 = toRad(aLat)
  const lat2 = toRad(bLat)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_M * Math.asin(Math.min(1, Math.sqrt(h)))
}

export interface NearbyTarget {
  lat: number
  lng: number
  category: CategoryId
}

export interface NearbyOptions {
  meters?: number
  hours?: number
  excludeId?: string
}

/**
 * Issues near `target` of the same category within a distance + time window,
 * nearest first. Excludes resolved/merged and an optional self id.
 */
export function findNearby(
  target: NearbyTarget,
  issues: Issue[],
  { meters = 200, hours = 48, excludeId }: NearbyOptions = {}
): { issue: Issue; distance: number }[] {
  const now = Date.now()
  return issues
    .filter((i) => i.id !== excludeId)
    .filter((i) => i.category === target.category)
    .filter((i) => i.status !== 'resolved')
    .filter((i) => (i.moderationStatus ?? 'active') === 'active')
    .filter((i) => now - new Date(i.createdAt).getTime() <= hours * 3_600_000)
    .map((i) => ({
      issue: i,
      distance: haversineMeters(
        target.lat,
        target.lng,
        i.location.lat,
        i.location.lng
      ),
    }))
    .filter((x) => x.distance <= meters)
    .sort((a, b) => a.distance - b.distance)
}

/** Friendly distance label. */
export function formatDistance(m: number): string {
  if (m < 1000) return `${Math.round(m)} m`
  return `${(m / 1000).toFixed(1)} km`
}
