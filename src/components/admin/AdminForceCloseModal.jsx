import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'

const cn = (...parts) => parts.filter(Boolean).join(' ')

const labelClass = 'mb-1.5 block text-[12px] font-medium text-[#7c8780]'
const inputClass =
  'box-border h-[40px] w-full rounded-[8px] border border-[rgba(0,0,0,0.1)] bg-white px-3 text-[13px] text-[#17231c] outline-none transition placeholder:text-[#9aa49d] focus:border-[#1aa054]'

const REASONS = [
  'Emergency / maintenance',
  'Out of stock',
  'Staff shortage',
  'Kitchen closed',
  'Hygiene inspection',
  'Other',
]

function normalizeBranchOptions(branches = []) {
  return (Array.isArray(branches) ? branches : [])
    .map((item) => {
      if (item && typeof item === 'object') {
        const id = String(item.id || '').trim()
        const name = String(item.name || item.label || '').trim()
        if (!name && !id) return null
        return { id, name: name || id }
      }
      const name = String(item || '').trim()
      if (!name) return null
      return { id: '', name }
    })
    .filter(Boolean)
}

function defaultFromTo() {
  const now = new Date()
  const later = new Date(now.getTime() + 4 * 60 * 60 * 1000)
  const fmt = (d) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return `${d.getUTCDate()} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()} · ${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`
  }
  return { from: fmt(now), to: fmt(later) }
}

export default function AdminForceCloseModal({
  open,
  onClose,
  storeName = 'Green Kitchen',
  branchName = '',
  branchId = '',
  branches = [],
  defaultScope = 'branch',
  onConfirm,
}) {
  const branchOptions = useMemo(() => normalizeBranchOptions(branches), [branches])
  const [scope, setScope] = useState(defaultScope === 'store' ? 'Whole store' : 'Single branch')
  const [selectedBranchId, setSelectedBranchId] = useState('')
  const [reason, setReason] = useState(REASONS[0])
  const [from, setFrom] = useState('9 Apr 2026 · 14:00')
  const [to, setTo] = useState('9 Apr 2026 · 18:00')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!open) return
    setScope(defaultScope === 'store' ? 'Whole store' : 'Single branch')
    const preferredId = String(branchId || '').trim()
    const preferredName = String(branchName || '').trim()
    const match =
      branchOptions.find((b) => b.id && b.id === preferredId) ||
      branchOptions.find((b) => b.name === preferredName) ||
      branchOptions[0]
    setSelectedBranchId(match?.id || match?.name || '')
    setReason(REASONS[0])
    const defaults = defaultFromTo()
    setFrom(defaults.from)
    setTo(defaults.to)
    setNote('')
    setSubmitting(false)
    setError(null)
  }, [open, defaultScope, branchName, branchId, branchOptions])

  if (!open) return null

  const selectedBranch = branchOptions.find(
    (b) => b.id === selectedBranchId || b.name === selectedBranchId,
  )

  const handleConfirm = async () => {
    setError(null)
    setSubmitting(true)
    try {
      await onConfirm?.({
        scope,
        branch: scope === 'Single branch' ? selectedBranch?.name || null : null,
        branchId: scope === 'Single branch' ? selectedBranch?.id || null : null,
        reason,
        from,
        to,
        note,
      })
      onClose?.()
    } catch (err) {
      setError(err?.message || 'Force close failed.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close force close modal"
        onClick={onClose}
        className="absolute inset-0 bg-black/40"
        disabled={submitting}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="force-close-title"
        className="relative w-full max-w-[520px] overflow-hidden rounded-[14px] bg-white shadow-[0_12px_40px_rgba(20,40,28,.18)]"
      >
        <div className="flex items-center gap-3 border-b border-[#edf0ee] px-5 py-4">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#fff3d6] text-[#c4841a]">
            <AlertTriangle size={16} strokeWidth={2.2} />
          </span>
          <div className="min-w-0 ">
            <h2 id="force-close-title" className="text-[16px] font-bold text-[#17231c]">
              Force close
            </h2>
            <p className="mt-0.5 text-[12px] text-[#7c8780]">
              {storeName} · temporarily stop orders
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="grid h-8 w-8 place-items-center rounded-md text-[#8a948e] hover:bg-[#f3f5f3] hover:text-[#455249]"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          <div className="flex w-fit items-center gap-2 rounded-[10px] bg-[#fff7d8] px-3.5 py-3">
            <AlertTriangle size={14} className="mt-0.5 shrink-0 text-[#c4841a]" />
            <p className="text-[12px] leading-[16px] text-[#c4841a]">
              Customers will see the store/branch as closed until reopened.
            </p>
          </div>

          <div>
            <span className={labelClass}>Scope</span>
            <div className="flex w-fit items-center rounded-[10px] bg-[#e9ebe9] p-[3px]">
              {['Whole store', 'Single branch'].map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setScope(option)}
                  disabled={submitting}
                  className={cn(
                    'h-[32px] rounded-[8px] px-3 text-[12px]',
                    scope === option
                      ? 'bg-white font-bold text-[#17231c] shadow-[0_1px_3px_rgba(20,40,28,.12)]'
                      : 'font-medium text-[#69756d]',
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <label className="block w-fit min-w-[220px]">
            <span className={labelClass}>Branch (if single)</span>
            <div className="relative">
              <select
                className={cn(inputClass, 'appearance-none pr-9', scope !== 'Single branch' && 'opacity-60')}
                value={selectedBranchId}
                disabled={scope !== 'Single branch' || submitting}
                onChange={(e) => setSelectedBranchId(e.target.value)}
              >
                {branchOptions.length === 0 ? (
                  <option value="">No branches loaded</option>
                ) : (
                  branchOptions.map((item) => (
                    <option key={item.id || item.name} value={item.id || item.name}>
                      {item.name}
                    </option>
                  ))
                )}
              </select>
              <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[10px] leading-none text-[#69756d]">
                ▾
              </span>
            </div>
          </label>

          <label className="block w-fit min-w-[220px]">
            <span className={labelClass}>Reason</span>
            <div className="relative">
              <select
                className={cn(inputClass, 'appearance-none pr-9')}
                value={reason}
                disabled={submitting}
                onChange={(e) => setReason(e.target.value)}
              >
                {REASONS.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
              <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[10px] leading-none text-[#69756d]">
                ▾
              </span>
            </div>
          </label>

          <div className="grid grid-cols-2 gap-3 max-[520px]:grid-cols-1">
            <label className="block">
              <span className={labelClass}>From</span>
              <input
                className={inputClass}
                value={from}
                disabled={submitting}
                onChange={(e) => setFrom(e.target.value)}
              />
            </label>
            <label className="block">
              <span className={labelClass}>To</span>
              <input
                className={inputClass}
                value={to}
                disabled={submitting}
                onChange={(e) => setTo(e.target.value)}
              />
            </label>
          </div>

          <label className="inline-block w-fit">
            <span className={labelClass}>Note (optional)</span>
            <input
              className={inputClass}
              value={note}
              disabled={submitting}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. kitchen maintenance until 5 PM"
            />
          </label>

          {error ? (
            <p className="text-[12px] font-medium text-[#d64044]">{error}</p>
          ) : null}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-[#edf0ee] px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="inline-flex h-[36px] items-center rounded-full border border-[#e4e8e4] bg-white px-4 text-[13px] font-medium text-[#455249] hover:bg-[#f6f8f6]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitting}
            className="inline-flex h-[36px] items-center rounded-full bg-[#c4841a] px-4 text-[13px] font-bold text-white hover:bg-[#a86f12] disabled:opacity-60"
          >
            {submitting ? 'Closing…' : 'Force close'}
          </button>
        </div>
      </div>
    </div>
  )
}
