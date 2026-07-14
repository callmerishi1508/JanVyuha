/**
 * Downscale a captured/selected image to a sane size BEFORE it enters React
 * state or gets uploaded. A modern phone photo is 3–8 MB (≈5–11 MB as base64),
 * which janks low-end devices, fails on 2G/3G, and burns free-tier storage.
 * We cap the longest edge and re-encode as JPEG, cutting payloads ~10–30×.
 *
 * The canvas round-trip also strips EXIF (GPS, device/camera info) — canvas
 * only ever holds decoded pixels, so re-exporting via toDataURL() can't carry
 * the original metadata block forward. That's why we always re-encode below,
 * even for already-small images, rather than passing the original bytes
 * through untouched.
 *
 * Zero-dependency (canvas only). Falls back to the raw data URL if anything
 * goes wrong, so a report is never blocked by resizing.
 */
const MAX_EDGE = 1600 // px — plenty for triage + evidence, tiny on the wire
const JPEG_QUALITY = 0.75

function readAsDataURL(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

/**
 * Returns a JPEG data URL scaled so its longest edge ≤ MAX_EDGE. Non-image
 * files (video) are returned as their raw data URL untouched.
 */
export async function toCompressedDataURL(file: File): Promise<string> {
  const raw = await readAsDataURL(file)
  if (!file.type.startsWith('image/')) return raw // videos etc. pass through

  try {
    const img = await loadImage(raw)
    const { width, height } = img
    const scale = Math.min(1, MAX_EDGE / Math.max(width, height))

    const canvas = document.createElement('canvas')
    canvas.width = Math.round(width * scale)
    canvas.height = Math.round(height * scale)
    const ctx = canvas.getContext('2d')
    if (!ctx) return raw
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

    // Always return the re-encoded copy, even if a rare pathological case
    // grows the payload slightly — the point of the round-trip is stripping
    // EXIF, and falling back to `raw` here would silently keep it.
    return canvas.toDataURL('image/jpeg', JPEG_QUALITY)
  } catch {
    return raw // never block a report on a resize failure
  }
}
