import { useEffect, useState } from 'react'
import { Image as ImageIcon } from 'lucide-react'
import { resolveAdminMediaUrl } from '../../mappers/admin/mapAdminUpload'
import { cn } from './cn'

/**
 * Renders admin upload/media URLs via same-origin /uploads proxy when needed.
 * Falls back to a placeholder if the image fails to load.
 */
export default function AdminMediaImage({
  src,
  alt = '',
  className,
  fallbackClassName,
  iconSize = 15,
}) {
  const [failed, setFailed] = useState(false)
  const [useRawFallback, setUseRawFallback] = useState(false)
  const resolved = resolveAdminMediaUrl(src)
  const raw = String(src || '').trim() || null
  const displaySrc =
    useRawFallback && raw && raw !== resolved && /^https?:\/\//i.test(raw) ? raw : resolved

  useEffect(() => {
    setFailed(false)
    setUseRawFallback(false)
  }, [resolved, raw])

  if (!displaySrc || failed) {
    return (
      <span
        className={cn(
          'grid place-items-center bg-[#e3f2fd] text-[#637068]/70',
          fallbackClassName || className,
        )}
      >
        <ImageIcon size={iconSize} />
      </span>
    )
  }

  return (
    <img
      src={displaySrc}
      alt={alt}
      className={className}
      referrerPolicy="no-referrer"
      onError={() => {
        // Proxied /uploads path failed — try the original absolute URL once.
        if (!useRawFallback && raw && raw !== displaySrc && /^https?:\/\//i.test(raw)) {
          setUseRawFallback(true)
          return
        }
        setFailed(true)
      }}
    />
  )
}
