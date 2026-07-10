import type { Issue } from '../data/types'

export interface Cluster {
  lat: number
  lng: number
  count: number
}

/**
 * Group issues into a coarse lat/lng grid so officials can see WHERE complaints
 * concentrate ("hotspots"), not just individual pins. Pure client-side over the
 * already-loaded issues — zero cost. `precision` decimals set the cell size:
 * 2 ≈ ~1.1km, 3 ≈ ~110m. Returns one entry per non-empty cell at its centroid.
 */
export function clusterIssues(issues: Issue[], precision = 2): Cluster[] {
  const cells = new Map<string, { sumLat: number; sumLng: number; count: number }>()
  for (const i of issues) {
    const { lat, lng } = i.location
    const key = `${lat.toFixed(precision)},${lng.toFixed(precision)}`
    const c = cells.get(key) ?? { sumLat: 0, sumLng: 0, count: 0 }
    c.sumLat += lat
    c.sumLng += lng
    c.count += 1
    cells.set(key, c)
  }
  return [...cells.values()].map((c) => ({
    lat: c.sumLat / c.count,
    lng: c.sumLng / c.count,
    count: c.count,
  }))
}
