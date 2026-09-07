/**
 * Compact dispatch-attempts list for order / incident detail.
 * Empty list is a valid API response — do not invent rows.
 */
export function AdminOrderDispatchAttempts({
  attempts = [],
  isLoading = false,
  error = null,
  onRetry,
}) {
  const list = Array.isArray(attempts) ? attempts : []

  if (!isLoading && !error && list.length === 0) return null

  return (
    <section className="mt-3 rounded-md border border-[#e4e7e5] bg-[#fafbfa] p-2.5">
      <h3 className="mb-2 text-[10px] font-bold text-[#101a14]">Dispatch attempts</h3>
      {isLoading ? (
        <p className="py-2 text-center text-[9px] text-[#78827c]">Loading attempts…</p>
      ) : null}
      {error ? (
        <div className="py-2 text-center">
          <p className="text-[9px] text-[#d64044]">{error.message || 'Failed to load attempts.'}</p>
          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="mt-1 text-[9px] font-medium text-[#1aa054] hover:underline"
            >
              Retry
            </button>
          ) : null}
        </div>
      ) : null}
      {!isLoading && !error && list.length > 0 ? (
        <div className="space-y-1.5">
          {list.map((attempt, index) => (
            <article
              key={attempt.id || `${attempt.title}-${index}`}
              className="rounded-[8px] border border-[#e8ebe9] bg-white px-2.5 py-2"
            >
              <p className="text-[9px] font-bold text-[#17231c]">{attempt.title}</p>
              <p className="mt-0.5 text-[8px] text-[#7c8780]">{attempt.meta}</p>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  )
}
