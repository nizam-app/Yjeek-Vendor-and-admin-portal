import { useState } from 'react'
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
  const displaySrc = resolveAdminMediaUrl(src)

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
      onError={() => setFailed(true)}
    />
  )
}
