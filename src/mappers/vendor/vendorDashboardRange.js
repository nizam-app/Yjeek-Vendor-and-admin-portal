/**
 * Vendor dashboard date-range helpers.
 * Backend: GET /vendor-panel/dashboard?branchId=&from=&to=
 */

function startOfLocalDay(date = new Date()) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

/**
 * @param {string} [rangeLabel] Day | Week | Month
 * @returns {{ from: string, to: string, chartSubtitle: string }}
 */
export function resolveVendorDashboardRange(rangeLabel = 'Day') {
  const raw = String(rangeLabel || 'Day').trim().toLowerCase()
  const to = new Date()
  const from = startOfLocalDay(to)

  if (raw === 'week') {
    from.setDate(from.getDate() - 6)
    return {
      from: from.toISOString(),
      to: to.toISOString(),
      chartSubtitle: 'last 7 days',
    }
  }

  if (raw === 'month') {
    from.setDate(from.getDate() - 29)
    return {
      from: from.toISOString(),
      to: to.toISOString(),
      chartSubtitle: 'last 30 days',
    }
  }

  return {
    from: from.toISOString(),
    to: to.toISOString(),
    chartSubtitle: 'today',
  }
}
