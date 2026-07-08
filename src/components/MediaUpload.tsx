import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { ImagePlus, Video, X, Camera } from 'lucide-react'
import type { MediaItem } from '../data/types'

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
  return <img src={item.url} alt={item.label ?? 'evidence'} className={`object-cover ${className}`} />
}

export function MediaUpload({
  items,
  onChange,
}: {
  items: MediaItem[]
  onChange: (items: MediaItem[]) => void
}) {
  const { t } = useTranslation()
  // Two separate inputs so the citizen can choose: the camera input carries
  // `capture` (opens the camera on a phone / PWA), the device input omits it
  // (opens the gallery / file picker and allows multiple). On desktop the
  // `capture` hint is ignored and simply falls back to the file picker.
  const cameraRef = useRef<HTMLInputElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFiles = (files: FileList | null) => {
    if (!files) return
    const readers = Array.from(files).map(
      (file) =>
        new Promise<MediaItem>((resolve) => {
          const reader = new FileReader()
          reader.onload = () =>
            resolve({
              id: 'm_' + Math.random().toString(36).slice(2, 8),
              type: file.type.startsWith('video') ? 'video' : 'image',
              url: reader.result as string,
              label: file.name,
            })
          reader.readAsDataURL(file)
        })
    )
    Promise.all(readers).then((newItems) => onChange([...items, ...newItems]))
  }

  // Reset the input value after each pick so selecting the same file twice
  // (e.g. retaking a photo) still fires onChange.
  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files)
    e.target.value = ''
  }

  return (
    <div>
      {/* Camera — opens the device camera on phone / installed PWA. */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/*,video/*"
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
              className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
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

        {/* Take photo — camera */}
        <button
          type="button"
          onClick={() => cameraRef.current?.click()}
          className="grid aspect-square place-items-center rounded-lg border-2 border-dashed border-slate-300 text-slate-500 transition-colors hover:border-ink-400 hover:bg-slate-50 hover:text-ink-700"
        >
          <div className="text-center">
            <Camera className="mx-auto h-6 w-6" />
            <span className="mt-1 block text-xs font-semibold">{t('media.takePhoto')}</span>
          </div>
        </button>

        {/* From device — gallery / files */}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="grid aspect-square place-items-center rounded-lg border-2 border-dashed border-slate-300 text-slate-500 transition-colors hover:border-ink-400 hover:bg-slate-50 hover:text-ink-700"
        >
          <div className="text-center">
            <ImagePlus className="mx-auto h-6 w-6" />
            <span className="mt-1 block text-xs font-semibold">{t('media.fromDevice')}</span>
          </div>
        </button>
      </div>
      <p className="mt-2 text-xs text-slate-500">{t('media.hint')}</p>
    </div>
  )
}
