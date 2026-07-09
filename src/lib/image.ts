/**
 * Downscale a captured/selected image to a sane size BEFORE it enters React
 * state or gets uploaded. A modern phone photo is 3–8 MB (≈5–11 MB as base64),
 * which janks low-end devices, fails on 2G/3G, and burns free-tier storage.
 * We cap the longest edge and re-encode as JPEG, cutting payloads ~10–30×.
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
    // Already small enough → keep the original bytes (avoids needless re-encode).
    if (scale === 1 && file.size < 600_000) return raw

    const canvas = document.createElement('canvas')
    canvas.width = Math.round(width * scale)
    canvas.height = Math.round(height * scale)
    const ctx = canvas.getContext('2d')
    if (!ctx) return raw
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

    const out = canvas.toDataURL('image/jpeg', JPEG_QUALITY)
    // Guard against pathological cases where re-encoding grew the payload.
    return out.length < raw.length ? out : raw
  } catch {
    return raw // never block a report on a resize failure
  }
}
