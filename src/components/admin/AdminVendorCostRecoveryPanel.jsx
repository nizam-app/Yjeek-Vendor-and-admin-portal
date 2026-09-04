import { useEffect, useState } from 'react'
import { adminReportService } from '../../services/admin/reportService'
import { formatApiErrorMessage } from '../../api/errors'
import { cn } from './cn'

const PRESETS = [
  { id: '7d', label: '7d' },
  { id: '30d', label: '30d' },
  { id: '90d', label: '90d' },
]

/**
 * Vendor cost-recovery obligations recorded from incident refunds.
 */
export function AdminVendorCostRecoveryPanel() {
  const [preset, setPreset] = useState('30d')
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const controller = new AbortController()
    setLoading(true)
    setError(null)
    adminReportService
      .getVendorCostRecovery({ preset, limit: 100 }, { signal: controller.signal })
      .then((res) => {
        if (!cancelled) setData(res?.data || null)
      })
      .catch((err) => {
        if (cancelled || err?.name === 'AbortError') return
        setError(formatApiErrorMessage(err, 'Failed to load cost-recovery report.'))
        setData(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
      controller.abort()
    }
  }, [preset])

  const summary = data?.summary
  const items = Array.isArray(data?.items) ? data.items : []
  const vendors = Array.isArray(data?.vendors) ? data.vendors : []

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setPreset(p.id)}
            className={cn(
              'h-8 rounded-full px-3 text-[12px] font-semibold',
              preset === p.id
                ? 'bg-[#1aa054] text-white'
                : 'border border-[#e3e7e4] bg-white text-[#17231c]',
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      {loading ? <p className="text-[12px] text-[#7c8780]">Loading…</p> : null}
      {error ? (
        <div className="rounded-[8px] bg-[#fdebec] px-3 py-2 text-[12px] text-[#d64044]">{error}</div>
      ) : null}

      {summary ? (
        <div className="flex flex-wrap gap-6 text-[13px]">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-[#7c8780]">Obligations</p>
            <p className="font-semibold text-[#17231c]">{summary.obligationCount ?? 0}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-[#7c8780]">Vendors</p>
            <p className="font-semibold text-[#17231c]">{summary.vendorCount ?? 0}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-[#7c8780]">Pending (BHD)</p>
            <p className="font-semibold text-[#17231c]">
              {Number(summary.totalPendingBhd || 0).toFixed(3)}
            </p>
          </div>
        </div>
      ) : null}

      {vendors.length ? (
        <div>
          <h3 className="mb-2 text-[13px] font-bold text-[#17231c]">By vendor</h3>
          <div className="overflow-x-auto rounded-[10px] border border-[#e3e7e4]">
            <table className="min-w-full text-left text-[12px]">
              <thead className="bg-[#f6f8f6] text-[#7c8780]">
                <tr>
                  <th className="px-3 py-2 font-semibold">Vendor</th>
                  <th className="px-3 py-2 font-semibold">Count</th>
                  <th className="px-3 py-2 font-semibold">Total BHD</th>
                </tr>
              </thead>
              <tbody>
                {vendors.map((v) => (
                  <tr key={v.vendorId} className="border-t border-[#eef1ef]">
                    <td className="px-3 py-2 text-[#17231c]">
                      {v.vendorName}
                      {v.vendorCode ? (
                        <span className="ml-1 text-[#9aa49d]">({v.vendorCode})</span>
                      ) : null}
                    </td>
                    <td className="px-3 py-2">{v.obligationCount}</td>
                    <td className="px-3 py-2 font-mono">{Number(v.totalBhd || 0).toFixed(3)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      <div>
        <h3 className="mb-2 text-[13px] font-bold text-[#17231c]">Obligations</h3>
        {!loading && !items.length ? (
          <p className="text-[12px] text-[#7c8780]">No vendor recovery obligations in this range.</p>
        ) : null}
        {items.length ? (
          <div className="overflow-x-auto rounded-[10px] border border-[#e3e7e4]">
            <table className="min-w-full text-left text-[12px]">
              <thead className="bg-[#f6f8f6] text-[#7c8780]">
                <tr>
                  <th className="px-3 py-2 font-semibold">When</th>
                  <th className="px-3 py-2 font-semibold">Order</th>
                  <th className="px-3 py-2 font-semibold">Vendor</th>
                  <th className="px-3 py-2 font-semibold">Bearer</th>
                  <th className="px-3 py-2 font-semibold">Recoverable</th>
                  <th className="px-3 py-2 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => (
                  <tr key={row.id} className="border-t border-[#eef1ef]">
                    <td className="px-3 py-2 whitespace-nowrap text-[#68736c]">
                      {row.createdAt ? new Date(row.createdAt).toLocaleString() : '—'}
                    </td>
                    <td className="px-3 py-2">{row.orderNumber || '—'}</td>
                    <td className="px-3 py-2">{row.vendorName || '—'}</td>
                    <td className="px-3 py-2">{row.bearer || '—'}</td>
                    <td className="px-3 py-2 font-mono">
                      {Number(row.vendorRecoverableBhd || 0).toFixed(3)}
                    </td>
                    <td className="px-3 py-2">{row.postingStatus || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </div>
  )
}
