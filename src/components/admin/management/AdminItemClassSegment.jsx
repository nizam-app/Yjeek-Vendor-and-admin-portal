import { cn } from '../cn'

const LOCK_LABELS = {
  STORE_TYPE: 'LOCKED BY STORE TYPE',
  VENDOR: 'LOCKED BY VENDOR',
  CATEGORY: 'LOCKED BY CATEGORY',
}

/** OG §04 — badge text for cascade lock source. */
export function formatItemClassLockBadge(lockedBy) {
  if (!lockedBy) return null
  return LOCK_LABELS[lockedBy] || `LOCKED BY ${String(lockedBy).replace(/_/g, ' ')}`
}

/**
 * Normal | Special segment control (OG §04 Menu Settings).
 * Locked rows stay greyed and still show the effective class — never blank.
 */
export function AdminItemClassSegment({
  value,
  editable = true,
  lockedBy = null,
  onChange,
  disabled = false,
  showEditableHint = false,
  className,
}) {
  const selected = value === 'SPECIAL' ? 'SPECIAL' : 'NORMAL'
  const locked = editable !== true
  const badge = formatItemClassLockBadge(lockedBy)

  const pick = (next) => {
    if (locked || disabled || typeof onChange !== 'function') return
    if (next === selected) return
    onChange(next)
  }

  const blocked = locked || disabled

  return (
    <div className={cn('inline-flex flex-wrap items-center gap-2', className)}>
      <div
        className={cn(
          'inline-flex overflow-hidden rounded-[7px] border border-[#dfe4e0]',
          locked && 'opacity-55',
        )}
        role="group"
        aria-label="Item class"
      >
        {['NORMAL', 'SPECIAL'].map((cls) => {
          const on = selected === cls
          return (
            <button
              key={cls}
              type="button"
              disabled={locked}
              aria-disabled={blocked}
              aria-pressed={on}
              onMouseDown={(event) => {
                // A click focuses this control. Disabling or unmounting that
                // focused button inside the page scroller jumps scroll to the top.
                if (event.button === 0) event.preventDefault()
              }}
              onClick={() => pick(cls)}
              className={cn(
                'px-3 py-1 text-[11.5px] font-semibold transition',
                on ? 'bg-[#1aa054] text-white' : 'bg-white text-[#7c8780]',
                blocked && 'cursor-not-allowed',
              )}
            >
              {cls === 'NORMAL' ? 'Normal' : 'Special'}
            </button>
          )
        })}
      </div>
      {locked && badge ? (
        <span className="rounded-[6px] border border-[#dfe4e0] bg-[#f0f2f1] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.03em] text-[#7c8780]">
          {badge}
        </span>
      ) : null}
      {!locked && showEditableHint ? (
        <span className="text-[11px] text-[#9aa49d]">Editable</span>
      ) : null}
    </div>
  )
}
