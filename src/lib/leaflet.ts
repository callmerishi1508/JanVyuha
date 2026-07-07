import L from 'leaflet'

/**
 * Leaflet's default marker icons break under bundlers because the image paths
 * are resolved relative to the CSS. We build a lightweight coloured SVG divIcon
 * per category instead, so markers are crisp and colour-coded on the dashboard.
 */
export function makeMarkerIcon(color: string, emphasized = false): L.DivIcon {
  const size = emphasized ? 40 : 32
  const html = `
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none"
         xmlns="http://www.w3.org/2000/svg"
         style="display:block;filter:drop-shadow(0 3px 4px rgba(0,0,0,.35))">
      <path d="M12 23s7-7.6 7-13A7 7 0 0 0 5 10c0 5.4 7 13 7 13Z"
            fill="${color}" stroke="white" stroke-width="1.5"/>
      <circle cx="12" cy="10" r="2.6" fill="white"/>
    </svg>`
  return L.divIcon({
    html,
    className: 'jv-marker',
    iconSize: [size, size],
    // Anchor at the pin's tip (bottom-centre) so it points exactly at the coords.
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size + 4],
  })
}

/** Approximate geographic centre of India — default map view. */
export const INDIA_CENTER: [number, number] = [22.9734, 78.6569]
