/**
 * Effective Champ driver pay (on-demand) per branch — matches checkout resolution order.
 */
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { formatApiErrorMessage } from '../../../api/errors'
import { adminService } from '../../../services/adminService'
import { cn } from '../cn'

function formatRate(value) {
  if (value === null || value === undefined || value === '') return '—'
  const n = Number(value)
  if (!Number.isFinite(n)) return '—'
  return n.toFixed(3)
}

function formatKm(value) {
  if (value === null || value === undefined || value === '') return '—'
  const n = Number(value)
  if (!Number.isFinite(n)) return '—'
  return n.toFixed(2)
}

const SOURCE_LABELS = {
  branch: 'Branch',
  vendor_template: 'Vendor template',
  store_type: 'Store type',
}

function SourceBadge({ source }) {
  const label = SOURCE_LABELS[source] || source
  const isBranch = source === 'branch'
  return (
    <span
      className={cn(
        'inline-flex rounded-[4px] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.04em]',
        isBranch ? 'bg-[#e8f7ed] text-[#147940]' : 'bg-[#f0f2f0] text-[#5c665f]',
      )}
    >
      {label}
    </span>
  )
}

/**
 * @param {{
 *   vendorId: string,
 *   refreshToken?: number | string,
 * }} props
 */
export default function AdminVendorBranchDriverRatesSummary({ vendorId, refreshToken = 0 }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [summary, setSummary] = useState(null)

  const load = useCallback(async () => {
    if (!vendorId) return
    setLoading(true)
    setError(null)
    try {
      const res = await adminService.getVendorBranchDriverRates(vendorId)
      setSummary(res?.data ?? null)
    } catch (err) {
      setError(formatApiErrorMessage(err, 'Failed to load branch driver rates.'))
      setSummary(null)
    } finally {
      setLoading(false)
    }
  }, [vendorId])

  useEffect(() => {
    load()
  }, [load, refreshToken])

  const showMismatchWarning =
    summary?.activeBranchCount === 1 && summary?.templateMatchesSingleBranch === false

  return (
    <div className="mb-5 rounded-[12px] border border-[#d4e8dc] bg-[#f8fbf9] px-4 py-4">
      <div className="mb-3">
        <h4 className="text-[14px] font-bold text-[#17231c]">Champ pay at checkout (by branch)</h4>
        <p className="mt-1 text-[12px] leading-[16px] text-[#5c665f]">
          Live orders use each branch&apos;s effective on-demand driver rates (branch → vendor
          template → store type). The vendor template below is for push only unless you have a single
          branch (rates sync on branch save).
        </p>
      </div>

      {loading ? (
        <p className="text-[12px] text-[#7c8780]">Loading branch driver rates…</p>
      ) : null}

      {error ? (
        <p className="rounded-[8px] border border-[#f5c2c0] bg-[#fdecea] px-3 py-2 text-[12px] text-[#b42318]">
          {error}
        </p>
      ) : null}

      {showMismatchWarning ? (
        <p className="mb-3 rounded-[8px] border border-[#f5d9a8] bg-[#fff8eb] px-3 py-2 text-[12px] leading-[16px] text-[#8a5b00]">
          Vendor template driver rates do not match this branch yet. Save branch delivery settings
          again to sync the template, or edit the template and push to branches.
        </p>
      ) : null}

      {!loading && !error && summary?.branches?.length === 0 ? (
        <p className="text-[12px] text-[#7c8780]">No active branches.</p>
      ) : null}

      {!loading && !error && summary?.branches?.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-left text-[12px]">
            <thead>
              <tr className="border-b border-[#e0e8e3] text-[11px] font-semibold uppercase tracking-[0.04em] text-[#7c8780]">
                <th className="py-2 pr-3">Branch</th>
                <th className="py-2 pr-3">Bike base</th>
                <th className="py-2 pr-3">Car base</th>
                <th className="py-2 pr-3">Free radius</th>
                <th className="py-2 pr-3">Extra/km</th>
                <th className="py-2">Source</th>
              </tr>
            </thead>
            <tbody>
              {summary.branches.map((row) => {
                const od = row.onDemand || {}
                const branchPath = `/admin/vendors/${encodeURIComponent(vendorId)}/branches/${encodeURIComponent(row.locationId)}`
                return (
                  <tr key={row.locationId} className="border-b border-[#eceeec] text-[#17231c]">
                    <td className="py-2.5 pr-3">
                      <Link
                        to={branchPath}
                        className="font-semibold text-[#147940] hover:underline"
                      >
                        {row.name}
                      </Link>
                      {row.isPrimary ? (
                        <span className="ml-1.5 text-[10px] font-medium text-[#7c8780]">
                          Primary
                        </span>
                      ) : null}
                    </td>
                    <td className="py-2.5 pr-3 tabular-nums">{formatRate(od.bikeBase)}</td>
                    <td className="py-2.5 pr-3 tabular-nums">{formatRate(od.carBase)}</td>
                    <td className="py-2.5 pr-3 tabular-nums">{formatKm(od.freeRadiusKm)} km</td>
                    <td className="py-2.5 pr-3 tabular-nums">{formatRate(od.extraPerKm)}</td>
                    <td className="py-2.5">
                      <SourceBadge source={row.ratesSource} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  )
}
