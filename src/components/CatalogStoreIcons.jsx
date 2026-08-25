import { useEffect, useState } from 'react'
import { ImageOff } from 'lucide-react'

function isUsableRemoteIconUrl(url) {
  const value = String(url || '').trim()
  if (!value) return false
  return (
    /^https?:\/\//i.test(value) ||
    value.startsWith('data:image/') ||
    value.startsWith('blob:') ||
    value.startsWith('/')
  )
}

/**
 * Image-only store / home icon. Missing or broken URL → non-stored ImageOff placeholder.
 * Does not render emoji or catalog PNG fallbacks.
 */
export function CatalogStoreIcon({
  iconUrl,
  className = 'size-[22px]',
  placeholderSize = 14,
}) {
  const [urlFailed, setUrlFailed] = useState(false)

  useEffect(() => {
    setUrlFailed(false)
  }, [iconUrl])

  const usableUrl = isUsableRemoteIconUrl(iconUrl) ? String(iconUrl).trim() : null

  if (usableUrl && !urlFailed) {
    return (
      <img
        src={usableUrl}
        alt=""
        className={`object-contain ${className}`}
        onError={() => setUrlFailed(true)}
      />
    )
  }

  return (
    <span
      className={`grid place-items-center rounded-[8px] bg-[#e8ebe8] text-[#9aa49d] ${className}`}
      aria-hidden
    >
      <ImageOff size={placeholderSize} strokeWidth={1.8} />
    </span>
  )
}
