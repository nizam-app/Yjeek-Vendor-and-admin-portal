import { cn } from './cn'

export function ApiState({ isLoading, error, onRetry }) {
  if (isLoading) return <div className="p-7 text-[12px] text-[#78837c]">Loading…</div>
  if (error) {
    return (
      <div className="m-7 rounded-lg border border-[#f2cccc] bg-[#fff5f5] p-4 text-[12px] text-[#a93e42]">
        Unable to load this page.
        {onRetry ? (
          <button type="button" onClick={onRetry} className="ml-2 font-medium underline">
            Try again
          </button>
        ) : null}
      </div>
    )
  }
  return <div className="p-7 text-[12px] text-[#78837c]">Nothing to show yet.</div>
}

export function ApiErrorBanner({ error, onRetry, className }) {
  if (!error) return null
  return (
    <div
      className={cn(
        'mb-3 rounded-[10px] border border-[#f2cccc] bg-[#fff5f5] px-3 py-2 text-[12.5px] text-[#a93e42]',
        className,
      )}
    >
      Unable to load data.
      {onRetry ? (
        <button type="button" onClick={onRetry} className="ml-2 font-medium underline">
          Try again
        </button>
      ) : null}
    </div>
  )
}

export function SkeletonBar({ className }) {
  return <span className={cn('inline-block animate-pulse rounded bg-[#e6ebe8]', className)} />
}

export function StatCardsSkeleton({
  count = 6,
  className = 'mb-4 grid grid-cols-6 gap-3 max-[1200px]:grid-cols-3 max-[700px]:grid-cols-2 max-[480px]:grid-cols-1',
}) {
  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="rounded-[14px] border border-[#eceeec] bg-white px-4 py-3.5 shadow-[0_1px_2px_rgba(20,40,28,.03)]"
        >
          <SkeletonBar className="h-3 w-[72px]" />
          <SkeletonBar className="mt-2.5 h-[22px] w-14" />
        </div>
      ))}
    </div>
  )
}

export function TableBodySkeleton({ columns = 6, rows = 6 }) {
  return Array.from({ length: rows }).map((_, rowIndex) => (
    <tr key={rowIndex} className="border-b border-[#f0f2f0] last:border-0">
      {Array.from({ length: columns }).map((__, colIndex) => (
        <td key={colIndex} className="whitespace-nowrap px-4 py-3.5">
          <SkeletonBar className={cn('h-3', colIndex === 0 ? 'w-28' : 'w-16')} />
        </td>
      ))}
    </tr>
  ))
}
