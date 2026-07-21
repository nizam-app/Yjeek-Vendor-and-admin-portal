export function ApiState({ isLoading, error, onRetry }) {
  if (isLoading) return <div className="p-7 text-[12px] text-[#78837c]">Loading…</div>
  if (error) {
    return (
      <div className="m-7 rounded-lg border border-[#f2cccc] bg-[#fff5f5] p-4 text-[12px] text-[#a93e42]">
        Unable to load this page.
        <button onClick={onRetry} className="ml-2 font-medium underline">Try again</button>
      </div>
    )
  }
  return null
}
