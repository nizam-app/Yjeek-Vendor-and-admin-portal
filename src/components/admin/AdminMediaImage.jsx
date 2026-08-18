import { useEffect, useMemo, useState } from 'react'
import { Image as ImageIcon } from 'lucide-react'
import { adminMediaSameOriginPath, resolveAdminMediaUrl } from '../../mappers/admin/mapAdminUpload'
import { cn } from './cn'

/**
 * Renders admin upload/media URLs.
 * - Dev: same-origin /uploads proxy via Vite
 * - Prod: absolute API URL; falls back to /uploads proxy path or raw URL on error
 */
export default function AdminMediaImage({
  src,
  alt = '',
  className,
  fallbackClassName,
  iconSize = 15,
}) {
  const [failed, setFailed] = useState(false)
  const [fallbackMode, setFallbackMode] = useState('primary')
  const resolved = resolveAdminMediaUrl(src)
  const raw = String(src || '').trim() || null
  const proxyPath = useMemo(() => adminMediaSameOriginPath(src), [src])

  const displaySrc = useMemo(() => {
    if (fallbackMode === 'proxy' && proxyPath) return proxyPath
    if (fallbackMode === 'raw' && raw && /^https?:\/\//i.test(raw)) return raw
    return resolved
  }, [fallbackMode, proxyPath, raw, resolved])

  useEffect(() => {
    setFailed(false)
    setFallbackMode('primary')
  }, [resolved, raw, proxyPath])

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
        if (
          fallbackMode === 'primary' &&
          proxyPath &&
          proxyPath !== resolved &&
          proxyPath !== displaySrc
        ) {
          setFallbackMode('proxy')
          return
        }
        if (
          fallbackMode !== 'raw' &&
          raw &&
          /^https?:\/\//i.test(raw) &&
          raw !== displaySrc
        ) {
          setFallbackMode('raw')
          return
        }
        setFailed(true)
      }}
    />
  )
}
