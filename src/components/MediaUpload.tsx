import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ImagePlus, Video, X, Camera } from 'lucide-react'
import type { MediaItem } from '../data/types'
import { toCompressedDataURL } from '../lib/image'

/** Renders either an uploaded data-URL or a seed "gradient:" placeholder. */
export function MediaThumb({
  item,
  className = 'h-full w-full',
}: {
  item: MediaItem
  className?: string
}) {
  if (item.url.startsWith('gradient:')) {
    const color = item.url.slice('gradient:'.length)
    return (
      <div
        className={`grid place-items-center ${className}`}
        style={{
          background: `linear-gradient(135deg, ${color}22, ${color}66)`,
        }}
      >
        <Camera className="h-6 w-6 text-white/80" />
      </div>
    )
  }
  if (item.type === 'video') {
    return <video src={item.url} className={`object-cover ${className}`} controls />
  }
  return (
    <img
      src={item.url}
      alt={item.label ?? 'evidence'}
      className={`object-cover ${className}`}
    />
  )
}

export function MediaUpload({
  items,
  onChange,
}: {
  items: MediaItem[]
  onChange: (items: MediaItem[]) => void
}) {
  const { t } = useTranslation()
  const [menuOpen, setMenuOpen] = useState(false)
  // One "Add media" affordance, two sources behind it. The camera input carries
  // `capture` (opens the camera on a phone / PWA); the device input omits it
  // (opens the gallery / file picker, multiple). On desktop `capture` is ignored
  // and both simply open the file picker — expected, since there's no camera.
  const cameraRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLInputElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const pickFrom = (ref: React.RefObject<HTMLInputElement | null>) => {
    setMenuOpen(false)
    ref.current?.click()
  }

  const handleFiles = async (files: FileList | null) => {
    if (!files) return
    // Downscale images before they enter state / upload (see lib/image.ts).
    const newItems = await Promise.all(
      Array.from(files).map(async (file) => ({
        id: 'm_' + Math.random().toString(36).slice(2, 8),
        type: (file.type.startsWith('video') ? 'video' : 'image') as 'video' | 'image',
        url: await toCompressedDataURL(file),
        label: file.name,
      }))
    )
    onChange([...items, ...newItems])
  }

  // Reset the input value after each pick so selecting the same file twice
  // (e.g. retaking a photo) still fires onChange.
  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files)
    e.target.value = ''
  }

  return (
    <div>
      {/* Camera — opens the device camera to take a photo. IMPORTANT: the accept
          list must be a SINGLE media type for `capture` to reliably open the
          camera; combining image + video makes many Android/iOS browsers ignore
          `capture` and fall back to the normal picker (which made this behave
          identically to "From device"). Photo is the primary evidence and is what
          the AI triage reads; videos come from "From device". */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={onPick}
      />
      {/* Video — opens the camera in video mode. Single media type (video only)
          for the same reason: `capture` is reliable only with one accept type. */}
      <input
        ref={videoRef}
        type="file"
        accept="video/*"
        capture="environment"
        hidden
        onChange={onPick}
      />
      {/* Device — gallery / file picker, multiple selection, no camera capture. */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*,video/*"
        multiple
        hidden
        onChange={onPick}
      />

      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="group relative aspect-square overflow-hidden rounded-lg border border-slate-200"
          >
            <MediaThumb item={item} />
            <button
              type="button"
              onClick={() => onChange(items.filter((i) => i.id !== item.id))}
              className="absolute right-1 top-1 grid h-7 w-7 place-items-center rounded-full bg-black/60 text-white opacity-100 transition-opacity focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
              aria-label={t('media.remove')}
            >
              <X className="h-3.5 w-3.5" />
            </button>
            {item.type === 'video' && (
              <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                <Video className="mr-1 inline h-3 w-3" />
                {t('media.video')}
              </span>
            )}
          </div>
        ))}

        {/* One "Add media" tile → menu with Camera / From device. */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            className="grid aspect-square w-full place-items-center rounded-lg border-2 border-dashed border-slate-300 text-slate-500 transition-colors hover:border-ink-400 hover:bg-slate-50 hover:text-ink-700"
          >
            <div className="text-center">
              <ImagePlus className="mx-auto h-6 w-6" />
              <span className="mt-1 block text-xs font-semibold">
                {t('media.addMedia')}
              </span>
            </div>
          </button>

          {menuOpen && (
            <>
              {/* click-away backdrop */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setMenuOpen(false)}
                aria-hidden="true"
              />
              <div
                role="menu"
                className="absolute left-1/2 top-full z-20 mt-1.5 w-48 -translate-x-1/2 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lift"
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => pickFrom(cameraRef)}
                  className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm font-semibold text-ink-800 hover:bg-slate-50"
                >
                  <Camera className="h-4 w-4 text-slate-500" />
                  {t('media.takePhoto')}
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => pickFrom(videoRef)}
                  className="flex w-full items-center gap-2.5 border-t border-slate-100 px-3.5 py-2.5 text-left text-sm font-semibold text-ink-800 hover:bg-slate-50"
                >
                  <Video className="h-4 w-4 text-slate-500" />
                  {t('media.recordVideo')}
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => pickFrom(fileRef)}
                  className="flex w-full items-center gap-2.5 border-t border-slate-100 px-3.5 py-2.5 text-left text-sm font-semibold text-ink-800 hover:bg-slate-50"
                >
                  <ImagePlus className="h-4 w-4 text-slate-500" />
                  {t('media.fromDevice')}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      <p className="mt-2 text-xs text-slate-500">{t('media.hint')}</p>
    </div>
  )
}
