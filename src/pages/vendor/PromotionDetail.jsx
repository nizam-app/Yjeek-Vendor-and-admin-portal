import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { MoreHorizontal, Pause, Play } from 'lucide-react'
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { StatusPill } from '../../components/ui'
import editIcon from '../../assets/icon-edit.png'
import { useVendorPromotionDetail } from '../../hooks/vendor/useVendorPromotionDetail'
import { promotionService } from '../../services/vendor/promotionService'

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const point = payload[0]?.payload
  if (!point) return null

  return (
    <div className="rounded-[10px] border border-[#E0E6E0] bg-white px-3 py-2 shadow-[0_12px_28px_rgba(26,28,26,0.12)]">
      <p className="text-[11px] font-medium tracking-[0.02em] text-ink-muted uppercase">
        {point.label}
      </p>
      <p className="mt-1 text-[13px] font-bold text-ink">
        {point.redemptions}{' '}
        <span className="font-medium text-ink-muted">redemptions</span>
      </p>
    </div>
  )
}

function RedemptionChart({ values }) {
  const data = useMemo(() => {
    const peak = Math.max(...(values || [0]), 0)
    return (values || []).map((value, idx) => ({
      day: idx + 1,
      label: `Day ${idx + 1}`,
      redemptions: value,
      isPeak: value === peak && peak > 0,
    }))
  }, [values])

  return (
    <div className="h-[220px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 4, left: -18, bottom: 0 }} barCategoryGap="18%">
          <XAxis
            dataKey="day"
            tickLine={false}
            axisLine={false}
            tick={{ fill: '#949994', fontSize: 11, fontWeight: 500 }}
            dy={6}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fill: '#949994', fontSize: 11, fontWeight: 500 }}
            allowDecimals={false}
            width={36}
          />
          <Tooltip
            cursor={{ fill: 'rgba(18, 112, 54, 0.06)', radius: 6 }}
            content={<ChartTooltip />}
          />
          <Bar dataKey="redemptions" radius={[6, 6, 0, 0]} maxBarSize={28}>
            {data.map((entry) => (
              <Cell
                key={entry.day}
                fill={entry.isPeak ? '#127036' : '#8BC9A0'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default function PromotionDetail() {
  const { promoId } = useParams()
  const navigate = useNavigate()
  const id = String(promoId || '').trim()

  // `/promotions/new` must open ConfigurePromotion, never this detail loader.
  useEffect(() => {
    if (id === 'new') {
      navigate('/promotions/new', { replace: true })
    }
  }, [id, navigate])

  const { data: promo, error, isLoading, refetch } = useVendorPromotionDetail(
    id === 'new' ? null : id,
  )
  const [localPromo, setLocalPromo] = useState(null)
  const [pausing, setPausing] = useState(false)
  const [pauseError, setPauseError] = useState(null)

  useEffect(() => {
    setLocalPromo(null)
    setPauseError(null)
  }, [promoId])

  const view = localPromo || promo

  if (id === 'new') {
    return <div className="p-7 text-[13px] text-ink-muted">Opening new promotion…</div>
  }

  if (isLoading && !view) {
    return <div className="p-7 text-[13px] text-ink-muted">Loading promotion…</div>
  }
  if (error && !view) {
    return (
      <div className="p-7 text-[13px] text-danger">
        Unable to load promotion.{' '}
        <button type="button" onClick={refetch} className="underline">
          Try again
        </button>
      </div>
    )
  }

  if (!view) {
    return (
      <div className="px-[28px] pt-[26px] pb-10">
        <Link
          to="/promotions"
          className="mb-4 inline-flex items-center gap-1 rounded-[18px] border border-[#E0E5E0] bg-white py-1.5 pr-3.5 pl-2.5 text-[12px] font-medium text-ink-muted hover:bg-[#fafbfa]"
        >
          ‹ Promotions
        </Link>
        <p className="text-[14px] text-ink-muted">Promotion not found.</p>
      </div>
    )
  }

  const noteTone = {
    muted: 'text-ink-muted',
    green: 'text-[#1AA34D]',
    blue: 'text-[#3B82C4]',
  }

  const chartValues = view.chart || Array(14).fill(0)
  const chartTotal = view.chartTotal ?? view.used ?? 0
  const hasKpis = Array.isArray(view.kpis) && view.kpis.length > 0

  async function handlePauseToggle() {
    if (!view?.id || pausing) return
    const nextPaused = !view.isPaused
    setPausing(true)
    setPauseError(null)
    try {
      const result = await promotionService.pausePromotion(view.id, nextPaused)
      if (result?.data) {
        setLocalPromo({
          ...view,
          ...result.data,
          isPaused: result.data.isPaused ?? nextPaused,
          status: result.data.status || (nextPaused ? 'Paused' : 'Active'),
          settings: result.data.settings?.length ? result.data.settings : view.settings,
          kpis: result.data.kpis || view.kpis,
          chart: result.data.chart || view.chart,
          recent: result.data.recent?.length ? result.data.recent : view.recent,
        })
      } else {
        await refetch()
        setLocalPromo(null)
      }
    } catch (err) {
      const fieldMessage =
        err?.fieldErrors &&
        typeof err.fieldErrors === 'object' &&
        Object.values(err.fieldErrors)
          .flatMap((v) => (Array.isArray(v) ? v : [v]))
          .find((m) => typeof m === 'string' && m.trim())
      const detailMessage =
        typeof err?.details === 'string'
          ? err.details
          : typeof err?.details?.message === 'string'
            ? err.details.message
            : null
      setPauseError(
        fieldMessage ||
          detailMessage ||
          err?.message ||
          (nextPaused ? 'Unable to pause promotion.' : 'Unable to resume promotion.'),
      )
    } finally {
      setPausing(false)
    }
  }

  return (
    <div className="px-[20px] pt-[18px] pb-10 sm:px-[28px]">
      {/* Header */}
      <div className="mb-5 flex gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2.5 sm:gap-3">
          <Link
            to="/promotions"
            className="mt-1 inline-flex shrink-0 items-center gap-1 rounded-[18px] border border-[#E0E5E0] bg-white py-1.5 pr-3.5 pl-2.5 text-[12px] font-medium text-ink-muted hover:bg-[#fafbfa]"
          >
            ‹ Promotions
          </Link>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-[20px] font-bold tracking-[-0.02em] text-ink sm:text-[20px]">
                {view.title}
              </h1>
              <StatusPill status={view.status} />
            </div>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-muted sm:text-[13px]">
              {view.detailMeta || view.subtitle}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={pausing}
            onClick={handlePauseToggle}
            className="inline-flex h-[36px] items-center gap-2 rounded-full border border-[#D6DBD6] bg-white px-4 text-[13px] font-medium text-[#127036] hover:bg-[#f3faf5] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {view.isPaused ? (
              <Play size={14} strokeWidth={2.4} fill="currentColor" className="shrink-0" />
            ) : (
              <Pause size={14} strokeWidth={2.4} fill="currentColor" className="shrink-0" />
            )}
            {pausing ? (view.isPaused ? 'Resuming…' : 'Pausing…') : view.isPaused ? 'Resume' : 'Pause'}
          </button>
          <button
            type="button"
            onClick={() => navigate(`/promotions/${encodeURIComponent(view.id)}/edit`)}
            className="inline-flex h-[36px] items-center gap-2 rounded-full border border-[#D6DBD6] bg-white px-4 text-[13px] font-medium text-[#127036] hover:bg-[#f3faf5]"
          >
            <img src={editIcon} alt="" className="size-3.5 shrink-0 object-contain" />
            Edit
          </button>
          <button
            type="button"
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-[#D6DBD6] bg-white text-ink-muted hover:bg-[#f7f9f7]"
            aria-label="More actions"
          >
            <MoreHorizontal size={18} strokeWidth={2.2} />
          </button>
        </div>
      </div>

      {pauseError ? (
        <p className="mb-3 text-[12.5px] text-danger">{pauseError}</p>
      ) : null}

      {/* KPI cards */}
      {hasKpis ? (
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {view.kpis.map((kpi) => (
            <div
              key={kpi.label}
              className="rounded-[14px] border border-[#E0E6E0] bg-white px-[16px] py-[14px]"
            >
              <p className="text-[11px] font-bold tracking-[0.04em] text-ink-muted uppercase">
                {kpi.label}
              </p>
              <p className="mt-2 text-[20px] leading-none font-bold text-ink sm:text-[20px]">
                {kpi.value}
              </p>
              <p className={`mt-2 text-[12px] font-medium ${noteTone[kpi.tone] || noteTone.muted}`}>
                {kpi.note}
              </p>
            </div>
          ))}
        </div>
      ) : null}

      {/* Chart + Settings */}
      <div className="mb-4 grid grid-cols-1 gap-4 xl:grid-cols-[1.65fr_1fr]">
        <section className="rounded-[14px] border border-[#E0E6E0] bg-white p-4 sm:p-5">
          <h2 className="mb-4 text-[16px] font-bold text-ink">Redemptions — last 14 days</h2>
          <RedemptionChart values={chartValues} />
          <p className="mt-4 text-[12.5px] text-ink-muted">
            {view.chart
              ? `Peak on day ${view.chartPeakDay || 1} — ${view.chartPeakValue || 0} redemptions. Total this period: ${chartTotal}.`
              : `Total uses: ${view.used ?? 0}. Daily chart data is not available yet.`}
          </p>
        </section>

        <section className="rounded-[14px] border border-[#E0E6E0] bg-white p-4 sm:p-5">
          <h2 className="mb-3 text-[16px] font-bold text-ink">Settings</h2>
          <div className="divide-y divide-[#EEF1EE]">
            {(view.settings || []).map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between gap-3 py-[11px] first:pt-0 last:pb-0"
              >
                <span className="flex-1 shrink-0 text-[12.5px] text-ink-muted">{row.label}</span>
                <span className="flex-1 text-left text-[12.5px] font-medium text-ink">{row.value}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Recent redemptions */}
      <section className="overflow-hidden rounded-[14px] border border-[#E0E6E0] bg-white">
        <div className="border-b border-[#EEF1EE] px-4 py-4 sm:px-5">
          <h2 className="text-[16px] font-bold text-ink">Recent redemptions</h2>
        </div>

        {(view.recent || []).length === 0 ? (
          <p className="px-5 py-8 text-[13px] text-ink-muted">No redemptions yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse">
              <thead>
                <tr className="bg-[#F7F8F7]">
                  {['ORDER', 'CUSTOMER', 'DISCOUNT', 'ORDER TOTAL', 'WHEN'].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-3 text-left text-[11px] font-bold tracking-[0.04em] text-ink-muted uppercase"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {view.recent.map((row) => (
                  <tr key={row.order} className="border-t border-[#EEF1EE]">
                    <td className="px-5 py-[14px] text-[13px] font-bold text-ink">{row.order}</td>
                    <td className="px-5 py-[14px] text-[13px] text-ink">{row.customer}</td>
                    <td className="px-5 py-[14px] text-[13px] text-ink">{row.discount}</td>
                    <td className="px-5 py-[14px] text-[13px] font-medium text-ink">{row.total}</td>
                    <td className="px-5 py-[14px] text-[13px] text-ink-muted">{row.when}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
