import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ArrowUpRight, RefreshCw } from 'lucide-react'
import { useAdminLiveOrders } from '../../../hooks/admin/useAdminLiveOrders'
import { useAdminIncidents } from '../../../hooks/admin/useAdminIncidents'
import { useAdminChats } from '../../../hooks/admin/useAdminChats'
import { useAdminOrderDetail } from '../../../hooks/admin/useAdminOrderDetail'
import { useAdminOrderActionOptions } from '../../../hooks/admin/useAdminOrderActionOptions'
import { useAdminDispatchAttempts } from '../../../hooks/admin/useAdminDispatchAttempts'
import { AdminOrderDispatchAttempts } from '../../../components/admin/operations/AdminOrderDispatchAttempts'
import { adminLiveOrdersBucketForColumnId } from '../../../mappers/admin/mapAdminLiveOrders'
import { ApiState } from '../../../components/admin/ApiState'
import { Badge } from '../../../components/admin/Badge'
import { Button } from '../../../components/admin/Button'
import { cn } from '../../../components/admin/cn'
import { AdminChatPanel } from '../../../components/admin/operations/AdminChatPanel'
import { AdminOpenChats } from '../../../components/admin/operations/AdminOpenChats'
import { OpsIncidentsSidebar } from '../../../components/admin/operations/OpsIncidentsSidebar'
import { AdminIncidentDetailModal } from '../../../components/admin/operations/AdminIncidentDetailModal'
import { AdminOrderTakeActionPanel } from '../../../components/admin/operations/AdminOrderTakeActionPanel'
import AdminReassignChampModal from '../../../components/admin/AdminReassignChampModal'
import AdminRedispatchOrderModal from '../../../components/admin/AdminRedispatchOrderModal'
import AdminRefundModal from '../../../components/admin/AdminRefundModal'
import AdminCancelOrderModal from '../../../components/admin/AdminCancelOrderModal'
import AdminOrderSuspendChampModal from '../../../components/admin/AdminOrderSuspendChampModal'
import AdminFlagVendorModal from '../../../components/admin/AdminFlagVendorModal'
import { adminOrderService } from '../../../services/admin/orderService'
import { formatApiErrorMessage } from '../../../api/errors'
import { initialsFromPeerName } from '../../../mappers/admin/mapAdminChats'
import { AdminAutoRefreshBadge } from '../../../components/admin/operations/AdminAutoRefreshBadge'
import { AdminOpsOrderCard } from '../../../components/admin/operations/AdminOpsOrderCard'
import { AdminLiveOrderFilterBar } from '../../../components/admin/operations/AdminLiveOrderFilterBar'
import { ADMIN_BOARD_FULL_LIMIT } from '../../../lib/adminBoardLimits'
import {
  ADMIN_OPS_BOARD_FILTERS,
  buildOpsBoardChats,
  filterOpsBoardColumns,
  flattenOpsBoardOrders,
  isOpsChatFilter,
  orderMatchesOpsFilter,
} from '../../../lib/adminOpsBoardFilters'
import {
  EMPTY_LIVE_ORDER_QUERY,
  applyLiveOrderQuery,
  filterOpsBoardLiveQuery,
  liveOrderQueryIsActive,
  parseLiveOrderQuery,
  writeLiveOrderQuery,
} from '../../../lib/adminLiveOrderQuery'

const DEFAULT_RESOLVE_OUTCOME = 'Resolved with refund'

export function AdminOrderDetailModal({ order, onClose, preference = 'live' }) {
  const orderId = order?.orderId || null
  const isScheduledPreference = preference === 'scheduled'
  const { data: detail, error, isLoading, refetch } = useAdminOrderDetail(orderId)
  const {
    data: dispatchAttempts,
    error: dispatchAttemptsError,
    isLoading: dispatchAttemptsLoading,
    refetch: refetchDispatchAttempts,
  } = useAdminDispatchAttempts(orderId)

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  if (!order) return null

  if (!orderId) {
    return (
      <div className="fixed inset-0 z-110 flex items-center justify-center bg-[rgba(20,25,22,.47)] p-4" role="dialog" aria-modal="true">
        <div className="w-full max-w-[420px] rounded-lg bg-white p-5 shadow-lg">
          <p className="text-[12px] text-[#78837c]">Missing order id — cannot load details.</p>
          <div className="mt-4 flex justify-end"><Button onClick={onClose} className="h-[28px] rounded-full px-4">Close</Button></div>
        </div>
      </div>
    )
  }

  const scheduleWindow =
    detail?.scheduleWindow
    || order?.slot
    || order?.windowLabel
    || order?.window
    || null

  const summaryRows = (() => {
    if (!detail) return []
    if (!isScheduledPreference) return detail.summaryRows

    const withWindow = detail.summaryRows.map(([label, value]) => (
      label === 'Schedule' && (!value || value === '—') && scheduleWindow
        ? [label, scheduleWindow]
        : [label, value]
    ))

    if (withWindow.some(([label]) => label === 'Schedule')) return withWindow

    const rows = [...withWindow]
    const insertAt = Math.max(0, rows.findIndex(([label]) => label === 'Order value') + 1)
    rows.splice(insertAt, 0, ['Schedule', scheduleWindow || '—'])
    return rows
  })()

  const fulfillmentLine = isScheduledPreference
    ? (detail?.fulfillmentLabel || 'scheduled')
    : detail?.fulfillmentLabel

  return (
    <div
      className="fixed inset-0 z-110 flex items-center justify-center overflow-y-auto bg-[rgba(20,25,22,.47)] p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-order-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="flex max-h-[calc(100vh-32px)] w-full max-w-[505px] flex-col overflow-hidden rounded-lg bg-white shadow-[0_16px_44px_rgba(8,18,12,.28)]">
        {!detail ? (
          <div className="p-6">
            <ApiState isLoading={isLoading || (!error && !detail)} error={error} onRetry={refetch} />
            {!isLoading && !error && !detail ? (
              <p className="mt-2 text-center text-[12px] text-[#78837c]">No order detail available.</p>
            ) : null}
            <div className="mt-4 flex justify-end"><Button onClick={onClose} className="h-[28px] rounded-full px-4">Close</Button></div>
          </div>
        ) : (
          <>
            <div className="overflow-y-auto p-[14px]">
              <header className="relative pr-8">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 id="admin-order-title" className="text-[13px] font-bold">Order #{detail.orderNumber || detail.id}</h2>
                  <Badge tone={isScheduledPreference ? 'blue' : 'yellow'}>{detail.statusLabel}</Badge>
                  {detail.category ? <span className="rounded-full bg-[#fff0e8] px-2 py-1 text-[9px] font-medium text-[#e36831]">{detail.category}</span> : null}
                </div>
                <p className="mt-1 text-[9px] text-[#818a84]">
                  {detail.vendor.name}
                  {fulfillmentLine ? ` · ${fulfillmentLine}` : ''}
                  {isScheduledPreference && scheduleWindow ? ` · ${scheduleWindow}` : ''}
                  {detail.placedClock && detail.placedClock !== '—' ? ` · placed ${detail.placedClock}` : ''}
                </p>
                <button type="button" onClick={onClose} aria-label="Close order details" className="absolute -right-1 -top-1 grid h-7 w-7 place-items-center rounded-full text-[19px] font-light text-[#77817b] hover:bg-[#f1f3f1]">×</button>
              </header>

              <div className="mt-2 flex flex-wrap gap-1.5">
                <Badge tone="blue">Stage: {detail.stageLabel}</Badge>
                {isScheduledPreference ? (
                  scheduleWindow ? <Badge tone="yellow">Window {scheduleWindow}</Badge> : null
                ) : (
                  order.timeLeft ? <Badge tone="yellow">ETA {order.timeLeft}</Badge> : null
                )}
              </div>

              <div className="mt-2 grid grid-cols-2 gap-2 max-[520px]:grid-cols-1">
                <section className="rounded-md border border-[#dfe4e0] p-2.5">
                  <h3 className="text-[10px] font-bold">Order details</h3>
                  <div className="mt-2 grid grid-cols-2 gap-x-5 gap-y-1 text-[9px]">
                    {summaryRows.map(([label, value]) => (
                      <div key={label}><p className="text-[#7d8781]">{label}</p><p className="font-medium">{value}</p></div>
                    ))}
                  </div>
                  <h4 className="mt-2 text-[9px] font-medium">Items</h4>
                  <div className="mt-1 space-y-1 text-[9px]">
                    {detail.items.length === 0 ? (
                      <p className="text-[#78827c]">No items</p>
                    ) : detail.items.map((item) => (
                      <div key={item.id || item.name} className="flex justify-between gap-3"><span>{item.name}</span><b>{item.price}</b></div>
                    ))}
                  </div>
                  <div className="mt-2 border-t border-[#e5e8e6] pt-1.5 text-[9px]">
                    {detail.totalsRows.map(([label, value]) => (
                      <div key={label} className={cn('flex justify-between py-0.5', label === 'Total' ? 'font-bold' : 'text-[#78827c]')}><span>{label}</span><span>{value}</span></div>
                    ))}
                  </div>
                </section>

                <section className="rounded-md border border-[#dfe4e0] p-2.5">
                  <h3 className="text-[10px] font-bold">Timeline</h3>
                  <div className="mt-2">
                    {detail.timeline.length === 0 ? (
                      <p className="text-[9px] text-[#78827c]">No timeline events</p>
                    ) : detail.timeline.map((entry, index) => (
                      <div key={`${entry.status}-${entry.at || index}`} className={cn('relative flex gap-2', index < detail.timeline.length - 1 && 'min-h-[28px]')}>
                        {index < detail.timeline.length - 1 ? <span className="absolute bottom-[-6px] left-[3.5px] top-[8px] w-px bg-[#d9dfdb]" /> : null}
                        <span className={cn(
                          'relative z-10 mt-0.5 h-2 w-2 shrink-0 rounded-full',
                          entry.state === 'done' && 'bg-[#20a653]',
                          entry.state === 'active' && 'bg-[#f58b19]',
                          entry.state === 'pending' && 'bg-[#c9cfcb]',
                        )} />
                        <div className="-mt-0.5"><p className="text-[9px] font-medium leading-3">{entry.label}</p><p className="text-[8px] leading-3 text-[#89928c]">{entry.time}</p></div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              <div className="mt-2 grid grid-cols-3 gap-2 max-[520px]:grid-cols-1">
                {detail.people.map(({ title, rows }) => (
                  <section key={title} className="rounded-md border border-[#dfe4e0] p-2.5">
                    <h3 className="mb-2 text-[10px] font-bold">{title}</h3>
                    <div className="space-y-1.5">
                      {rows.map(([label, value]) => <div key={label}><p className="text-[8px] text-[#7d8781]">{label}</p><p className="text-[9px] font-medium">{value}</p></div>)}
                    </div>
                  </section>
                ))}
              </div>

              <AdminOrderDispatchAttempts
                attempts={dispatchAttempts?.attempts || []}
                isLoading={dispatchAttemptsLoading}
                error={dispatchAttemptsError}
                onRetry={refetchDispatchAttempts}
              />
            </div>

            <footer className="flex shrink-0 justify-end border-t border-[#e3e7e4] px-[14px] py-2.5">
              <Button onClick={onClose} className="h-[28px] rounded-full px-4">Close</Button>
            </footer>
          </>
        )}
      </div>
    </div>
  )
}

export function IncidentOrderModal({ order, onClose }) {
  const [openActionMenu, setOpenActionMenu] = useState(null)
  const [activeAction, setActiveAction] = useState(null)
  const [resolving, setResolving] = useState(false)
  const [resolveError, setResolveError] = useState(null)
  const orderId = order?.orderId || null
  const { data: detail, error, isLoading, refetch } = useAdminOrderDetail(orderId)
  const {
    data: actionOptions,
    error: actionOptionsError,
    isLoading: actionOptionsLoading,
  } = useAdminOrderActionOptions()
  const {
    data: dispatchAttempts,
    error: dispatchAttemptsError,
    isLoading: dispatchAttemptsLoading,
    refetch: refetchDispatchAttempts,
  } = useAdminDispatchAttempts(orderId)

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        if (activeAction) setActiveAction(null)
        else if (openActionMenu) setOpenActionMenu(null)
        else onClose()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose, openActionMenu, activeAction])

  if (!order) return null

  if (!orderId) {
    return (
      <div className="fixed inset-0 z-120 flex items-center justify-center bg-[rgba(20,25,22,.47)] p-4" role="dialog" aria-modal="true">
        <div className="w-full max-w-[420px] rounded-[14px] bg-white p-5 shadow-lg">
          <p className="text-[12px] text-[#78837c]">Missing order id — cannot load details.</p>
          <div className="mt-4 flex justify-end"><Button onClick={onClose} className="h-[28px] rounded-full px-3">Close</Button></div>
        </div>
      </div>
    )
  }

  const canMarkResolved = detail?.availableActions?.includes('MARK_RESOLVED')
  const openIncidents = (detail?.incidents || []).filter(
    (incident) => incident.id && String(incident.status || '').toLowerCase() !== 'resolved',
  )

  async function markResolved(incidentId) {
    const id = String(incidentId || '').trim()
    if (!id || resolving) {
      if (!id) setResolveError('No open incident to resolve.')
      return
    }

    setResolveError(null)
    setResolving(true)
    setOpenActionMenu(null)
    try {
      await adminOrderService.resolveIncident(id, { outcome: DEFAULT_RESOLVE_OUTCOME })
      await refetch()
    } catch (err) {
      setResolveError(formatApiErrorMessage(err, 'Failed to mark resolved.'))
    } finally {
      setResolving(false)
    }
  }

  function startAction(code, incidentId = null) {
    setOpenActionMenu(null)
    if (code === 'MARK_RESOLVED') {
      void markResolved(incidentId || openIncidents[0]?.id || null)
      return
    }
    setActiveAction({ code, incidentId })
  }

  return (
    <div
      className="fixed inset-0 z-120 flex items-center justify-center overflow-y-auto bg-[rgba(20,25,22,.47)] p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="incident-order-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="relative flex max-h-[calc(100vh-32px)] w-full max-w-[532px] flex-col overflow-hidden rounded-[14px] bg-white shadow-[0_18px_55px_rgba(8,18,12,.28)]">
        {!detail ? (
          <div className="p-6">
            <ApiState isLoading={isLoading || (!error && !detail)} error={error} onRetry={refetch} />
            <div className="mt-4 flex justify-end"><Button onClick={onClose} className="h-[28px] rounded-full px-3">Close</Button></div>
          </div>
        ) : (
          <>
            <div className="overflow-y-auto px-[14px] pb-2 pt-[14px]">
              <header className="relative pr-8">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 id="incident-order-title" className="text-[13px] font-bold text-[#202722]">Order #{detail.orderNumber || detail.id}</h2>
                  {detail.bucket ? <Badge tone="red">{humanizeBucket(detail.bucket)}</Badge> : null}
                  {detail.incidentCount > 0 ? <Badge tone="yellow">{detail.incidentCount} incident{detail.incidentCount === 1 ? '' : 's'}</Badge> : null}
                </div>
                <p className="mt-1 text-[9px] text-[#78827c]">
                  {detail.vendor.name}
                  {detail.category ? ` · ${detail.category}` : ''}
                  {detail.fulfillmentLabel ? ` — ${detail.fulfillmentLabel}` : ''}
                  {detail.placedClock && detail.placedClock !== '—' ? ` · placed ${detail.placedClock}` : ''}
                </p>
                <button type="button" onClick={onClose} aria-label="Close incident details" className="absolute -right-1 -top-1 grid h-7 w-7 place-items-center rounded-full text-[19px] font-light text-[#77817b] hover:bg-[#f1f3f1]">×</button>
              </header>

              <div className="mt-2 flex flex-wrap gap-1.5">
                <Badge tone="blue">Stage: {detail.stageLabel}</Badge>
                {detail.slaBreached ? <Badge tone="red">SLA: Breached</Badge> : null}
                {detail.reported ? <Badge tone="yellow">Reported: Yes</Badge> : null}
              </div>

              <div className="mt-2 grid grid-cols-2 gap-2 max-[520px]:grid-cols-1">
                <section className="rounded-md border border-[#dfe4e0] p-2.5">
                  <h3 className="text-[10px] font-bold">Order details</h3>
                  <div className="mt-2 grid grid-cols-2 gap-x-5 gap-y-1 text-[9px]">
                    {detail.summaryRows.map(([label, value]) => (
                      <div key={label}><p className="text-[#7d8781]">{label}</p><p className="font-medium text-[#202722]">{value}</p></div>
                    ))}
                  </div>
                  <h4 className="mt-2 text-[9px] font-medium">Items</h4>
                  <div className="mt-1 space-y-1 text-[9px]">
                    {detail.items.length === 0 ? (
                      <p className="text-[#78827c]">No items</p>
                    ) : detail.items.map((item) => (
                      <div key={item.id || item.name} className="flex justify-between gap-3"><span>{item.name}</span><b>{item.price}</b></div>
                    ))}
                  </div>
                  <div className="mt-2 border-t border-[#e5e8e6] pt-1.5 text-[9px]">
                    {detail.totalsRows.map(([label, value]) => (
                      <div key={label} className={cn('flex justify-between py-0.5', label === 'Total' ? 'font-bold' : 'text-[#78827c]')}><span>{label}</span><span>{value}</span></div>
                    ))}
                  </div>
                </section>

                <section className="rounded-md border border-[#dfe4e0] p-2.5">
                  <h3 className="text-[10px] font-bold">Timeline</h3>
                  <div className="mt-2">
                    {detail.timeline.length === 0 ? (
                      <p className="text-[9px] text-[#78827c]">No timeline events</p>
                    ) : detail.timeline.map((entry, index) => (
                      <div key={`${entry.status}-${entry.at || index}`} className={cn('relative flex gap-2', index < detail.timeline.length - 1 && 'min-h-[28px]')}>
                        {index < detail.timeline.length - 1 ? <span className="absolute bottom-[-6px] left-[3.5px] top-[8px] w-px bg-[#d9dfdb]" /> : null}
                        <span className={cn(
                          'relative z-10 mt-0.5 h-2 w-2 shrink-0 rounded-full',
                          entry.state === 'pending' ? 'bg-[#c9cfcb]' : entry.state === 'active' ? 'bg-[#f58b19]' : 'bg-[#20a653]',
                        )} />
                        <div className="-mt-0.5"><p className="text-[9px] font-medium leading-3">{entry.label}</p><p className="text-[8px] leading-3 text-[#89928c]">{entry.time}</p></div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              <div className="mt-2 grid grid-cols-3 gap-2 max-[520px]:grid-cols-1">
                {[
                  { title: 'Customer', rows: [['Name', detail.customer.name], ['Phone', detail.customer.phone], ['Address', detail.customer.address], ['Member since', detail.customer.memberSince]] },
                  { title: 'Vendor', rows: [['Store', detail.vendor.name], ['Branch', detail.vendor.branch], ['Phone', detail.vendor.phone], ['Prep time', detail.vendor.prepTimeMin]] },
                  { title: 'Champ', rows: [['Name', detail.champ.name], ['Vehicle', detail.champ.vehicle], ['Phone', detail.champ.phone], ['Status', detail.champ.status]] },
                ].map(({ title, rows }) => (
                  <section key={title} className="rounded-md border border-[#dfe4e0] p-2.5">
                    <h3 className="mb-2 text-[10px] font-bold">{title}</h3>
                    <div className="space-y-1.5">
                      {rows.map(([label, value]) => <div key={label}><p className="text-[8px] text-[#7d8781]">{label}</p><p className="text-[9px] font-medium">{value}</p></div>)}
                    </div>
                  </section>
                ))}
              </div>

              <AdminOrderDispatchAttempts
                attempts={dispatchAttempts?.attempts || []}
                isLoading={dispatchAttemptsLoading}
                error={dispatchAttemptsError}
                onRetry={refetchDispatchAttempts}
              />

              <section className="mt-2 rounded-md border border-[#dfe4e0] p-2.5">
                <h3 className="mb-2 text-[10px] font-bold">Incidents</h3>
                {detail.incidents.length === 0 ? (
                  <p className="py-3 text-center text-[9px] text-[#78827c]">No incidents</p>
                ) : detail.incidents.map((incident) => (
                  <article key={incident.id || incident.title} className="relative mb-2 rounded-[9px] border border-[#e0e5e1] bg-[#fafbfa] p-2.5 last:mb-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-[9px] font-bold">{incident.title}</h4>
                      <Badge tone={incident.statusTone}>{incident.status}</Badge>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {incident.badges.map(([label, tone]) => <Badge key={label} tone={tone}>{label}</Badge>)}
                    </div>
                    <p className="mt-1.5 text-[8px] text-[#515c55]">{incident.detail}</p>
                    {incident.meta ? <p className="mt-1 text-[8px] text-[#929a95]">{incident.meta}</p> : null}
                    {detail.actionGroups.length > 0 ? (
                      <>
                        <button
                          type="button"
                          aria-expanded={openActionMenu === (incident.id || incident.title)}
                          onClick={() => setOpenActionMenu((current) => current === (incident.id || incident.title) ? null : (incident.id || incident.title))}
                          className="mt-2 rounded-full bg-[#18a653] px-3 py-1.5 text-[8px] font-medium text-white hover:bg-[#128944]"
                        >
                          ⚡ &nbsp; Take action &nbsp;⌄
                        </button>
                        {openActionMenu === (incident.id || incident.title) ? (
                          <div className="absolute left-2.5 top-[calc(100%-2px)] z-30 w-[262px] overflow-hidden rounded-[9px] border border-[#e1e5e2] bg-white text-[10px] shadow-[0_10px_26px_rgba(20,30,24,.18)]">
                            {detail.actionGroups.map((group) => (
                              <div key={group.title}>
                                <div className="bg-[#f5f6f7] px-3 py-1.5 text-[8px] font-bold uppercase tracking-wide text-[#929ba6]">{group.title}</div>
                                {group.actions.map((action) => (
                                  <button
                                    key={action.code}
                                    type="button"
                                    onClick={() => startAction(action.code, incident.id)}
                                    className="flex h-[30px] w-full items-center gap-2.5 px-3 text-left font-medium text-[#29332d] hover:bg-[#f5f8f6]"
                                  >
                                    <span className={cn('w-3 text-center text-[13px]', action.tone)}>{action.icon}</span>
                                    <span className={action.code === 'CANCEL' || action.code === 'SUSPEND_CHAMP' ? 'text-[#d92f35]' : ''}>{action.label}</span>
                                  </button>
                                ))}
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </>
                    ) : null}
                  </article>
                ))}
              </section>
            </div>

            <footer className="flex shrink-0 flex-col gap-2 border-t border-[#e3e7e4] bg-white px-[14px] py-2.5">
              {resolveError ? (
                <p className="text-right text-[10px] text-[#d92f35]">{resolveError}</p>
              ) : null}
              <div className="flex justify-end gap-2">
                <Button onClick={onClose} className="h-[28px] rounded-full px-3" disabled={resolving}>Close</Button>
                {canMarkResolved ? (
                  <Button
                    primary
                    className="h-[28px] rounded-full px-3"
                    disabled={resolving || openIncidents.length === 0}
                    onClick={() => markResolved(openIncidents[0]?.id || null)}
                  >
                    {resolving ? 'Resolving…' : 'Mark resolved'}
                  </Button>
                ) : null}
              </div>
            </footer>

            {activeAction?.code === 'REASSIGN_CHAMP' ? (
              <AdminReassignChampModal
                open
                orderId={detail.orderId || orderId}
                orderNumber={detail.orderNumber || detail.id}
                orderStatus={detail.stageLabel || detail.status}
                currentChamp={detail.champ}
                reasons={actionOptions?.reassignReasons || []}
                onClose={() => setActiveAction(null)}
                onSuccess={async () => {
                  setActiveAction(null)
                  await refetch()
                }}
              />
            ) : activeAction?.code === 'REDISPATCH' ? (
              <AdminRedispatchOrderModal
                open
                orderId={detail.orderId || orderId}
                orderNumber={detail.orderNumber || detail.id}
                orderStatus={detail.stageLabel || detail.status}
                vendorName={detail.vendor?.name}
                items={detail.items || []}
                reasons={actionOptions?.redispatchReasons || []}
                onClose={() => setActiveAction(null)}
                onSuccess={async () => {
                  setActiveAction(null)
                  await refetch()
                }}
              />
            ) : activeAction?.code === 'REFUND' ? (
              <AdminRefundModal
                open
                orderId={detail.orderId || orderId}
                orderValueLabel={detail.orderValue}
                orderValueAmount={detail.orderValueAmount}
                remainingRefundable={detail.remainingRefundable}
                paymentLabel={detail.paymentLabel}
                currency={detail.currency || 'BHD'}
                reasons={actionOptions?.refundReasons || []}
                destinations={actionOptions?.refundDestinations || []}
                onClose={() => setActiveAction(null)}
                onSuccess={async () => {
                  setActiveAction(null)
                  await refetch()
                }}
              />
            ) : activeAction?.code === 'CANCEL' ? (
              <AdminCancelOrderModal
                open
                orderId={detail.orderId || orderId}
                orderNumber={detail.orderNumber || detail.id}
                orderValueLabel={detail.orderValue}
                causes={actionOptions?.cancelCauses || []}
                reasonsByCause={actionOptions?.cancelReasonsByCause || {}}
                onClose={() => setActiveAction(null)}
                onSuccess={async () => {
                  setActiveAction(null)
                  await refetch()
                }}
              />
            ) : activeAction?.code === 'SUSPEND_CHAMP' ? (
              <AdminOrderSuspendChampModal
                open
                orderId={detail.orderId || orderId}
                champ={detail.champ}
                champId={detail.champ?.id || null}
                types={actionOptions?.suspendTypes || []}
                durations={actionOptions?.suspendDurations || []}
                reasons={actionOptions?.suspendReasons || []}
                onClose={() => setActiveAction(null)}
                onSuccess={async () => {
                  setActiveAction(null)
                  await refetch()
                }}
              />
            ) : activeAction?.code === 'FLAG_VENDOR' ? (
              <AdminFlagVendorModal
                open
                orderId={detail.orderId || orderId}
                orderNumber={detail.orderNumber || detail.id}
                vendorName={detail.vendor?.name}
                vendorBranch={detail.vendor?.branch}
                metrics={actionOptions?.flagMetrics || []}
                severities={actionOptions?.flagSeverities || []}
                actions={actionOptions?.flagActions || []}
                reasons={actionOptions?.flagReasons || []}
                onClose={() => setActiveAction(null)}
                onSuccess={async () => {
                  setActiveAction(null)
                  await refetch()
                }}
              />
            ) : activeAction ? (
              <AdminOrderTakeActionPanel
                actionCode={activeAction.code}
                orderId={detail.orderId || orderId}
                champId={detail.champ?.id || null}
                options={actionOptions}
                optionsLoading={actionOptionsLoading}
                optionsError={actionOptionsError}
                onCancel={() => setActiveAction(null)}
                onSuccess={async () => {
                  setActiveAction(null)
                  await refetch()
                }}
              />
            ) : null}
          </>
        )}
      </div>
    </div>
  )
}

function humanizeBucket(bucket) {
  if (bucket === 'at_risk') return 'At risk'
  if (bucket === 'on_track') return 'On track'
  if (bucket === 'critical') return 'Critical'
  return String(bucket)
}

function AdminLiveOrdersFullView({
  column,
  filter,
  chats,
  query,
  onQueryChange,
  onQueryClear,
  onBack,
  onIncidentClick,
  onContactClick,
  onOrderClick,
  onChatClick,
}) {
  const bucket = adminLiveOrdersBucketForColumnId(column.id)
  const { data, error, isLoading, refetch } = useAdminLiveOrders({
    bucket,
    sort: 'time_left',
    limit: ADMIN_BOARD_FULL_LIMIT,
  })

  const bucketColumn =
    data?.columns?.find((item) => item.id === column.id) ||
    data?.columns?.find((item) => item.tone === column.tone)

  const rawOrders = bucketColumn?.orders || []
  const chatOrders = isOpsChatFilter(filter)
    ? rawOrders.filter((order) => orderMatchesOpsFilter(order, filter))
    : rawOrders
  const orders = applyLiveOrderQuery(chatOrders, query)
  const count = orders.length
  const filtersActive = liveOrderQueryIsActive(query)
  const visibleChats = buildOpsBoardChats(chats, rawOrders, filter)
  const visibleChatsActive = visibleChats.length

  return (
    <div className="flex h-[calc(100vh-44px)] flex-col overflow-hidden px-[18px] pt-[15px]">
      <div className="flex shrink-0 items-start gap-3">
        <button onClick={onBack} className="h-[27px] rounded-full border border-[#dfe4e0] bg-white px-3 text-[10px] font-medium text-[#536158]">‹ Live orders</button>
        <div>
          <h2 className="flex items-center gap-1.5 text-[18px] font-bold">
            <span>{column.tone === 'red' ? '🔥' : column.tone === 'yellow' ? '⚠' : '🛡'}</span>
            {column.title} orders — full view
          </h2>
          <p className="mt-0.5 text-[10px] text-[#7a847e]">
            {isLoading && !data ? 'Loading…' : `${count} order${count === 1 ? '' : 's'} in this status`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isLoading}
          className="ml-auto h-[27px] rounded-full border border-[#dfe4e0] bg-white px-3 text-[10px] font-medium text-[#536158] disabled:opacity-60"
        >
          Refresh
        </button>
      </div>

      <div className="mt-6 shrink-0">
        <AdminLiveOrderFilterBar
          query={query}
          onChange={onQueryChange}
          onClear={onQueryClear}
          orders={chatOrders}
        />
      </div>

      <div className="mt-4 min-h-0 flex-1 overflow-y-auto">
        {error && !chatOrders.length ? (
        <div className="mt-8 rounded-lg border border-[#f0d5d5] bg-[#fff7f7] px-4 py-6 text-center text-[12px] text-[#a15b58]">
          <p>Unable to load {column.title.toLowerCase()} orders.</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-2 rounded-md border border-[#e0e5e1] bg-white px-2.5 py-1 text-[11px] text-[#536158]"
          >
            Try again
          </button>
        </div>
      ) : null}

      {isLoading && !chatOrders.length && !error ? (
        <p className="mt-8 text-[12px] font-medium text-[#7a857e]">Loading {column.title.toLowerCase()} orders…</p>
      ) : null}

      {!isLoading && !error && !chatOrders.length ? (
        <p className="mt-8 text-[12px] font-medium text-[#8a938c]">No {column.title.toLowerCase()} orders.</p>
      ) : null}

      {!isLoading && chatOrders.length > 0 && orders.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-[#dfe4e0] bg-white px-4 py-10 text-center">
          <p className="text-[12px] font-medium text-[#536158]">No orders match</p>
          {filtersActive ? (
            <button
              type="button"
              onClick={onQueryClear}
              className="mt-2 text-[11px] font-medium text-[#16854a] hover:underline"
            >
              Clear all
            </button>
          ) : null}
        </div>
      ) : null}

      {orders.length > 0 ? (
      <div className="mt-8 grid grid-cols-4 gap-3 max-[1000px]:grid-cols-3 max-[760px]:grid-cols-2 max-[520px]:grid-cols-1">
        {orders.map((order) => (
          <AdminOpsOrderCard
            key={order.orderId || order.id}
            order={order}
            tone={column.tone}
            onIncidentClick={onIncidentClick}
            onContactClick={onContactClick}
            onOrderClick={onOrderClick}
          />
        ))}
      </div>
      ) : null}
      </div>

      <AdminOpenChats
        chats={visibleChats}
        activeCount={visibleChatsActive}
        unreadCount={visibleChats.reduce((sum, chat) => sum + (Number(chat.unreadCount) || 0), 0)}
        onChatClick={onChatClick}
        groupByRole={isOpsChatFilter(filter)}
      />
    </div>
  )
}

export default function AdminLiveOrdersPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [filter, setFilter] = useState('All orders')
  const [fullView, setFullView] = useState(null)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [incidentOrder, setIncidentOrder] = useState(null)
  const [selectedIncident, setSelectedIncident] = useState(null)
  const [activeChat, setActiveChat] = useState(null)
  const boardQuery = useMemo(() => parseLiveOrderQuery(searchParams), [searchParams])

  function patchBoardQuery(nextQuery) {
    setSearchParams((prev) => writeLiveOrderQuery(prev, nextQuery), { replace: true })
  }

  function clearBoardQuery() {
    patchBoardQuery(EMPTY_LIVE_ORDER_QUERY)
  }

  function openFullView(column) {
    setFullView(column)
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('bucket', adminLiveOrdersBucketForColumnId(column.id))
      return next
    }, { replace: true })
  }

  function closeFullView() {
    setFullView(null)
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.delete('bucket')
      return next
    }, { replace: true })
  }
  const { data, error, isLoading, refetch } = useAdminLiveOrders({
    bucket: 'all',
    sort: 'time_left',
    // Load the full bucket pool so each column can scroll independently.
    limit: ADMIN_BOARD_FULL_LIMIT,
  })
  const { data: incidentsData } = useAdminIncidents()
  const incidents = Array.isArray(incidentsData?.items) ? incidentsData.items : []
  const { data: chatsData, setData: setChatsData, refetch: refetchChats } = useAdminChats({
    refreshSeconds: data?.refreshIntervalSeconds,
  })
  const chats = Array.isArray(chatsData?.items) ? chatsData.items : []
  const chatsActive = chatsData?.active ?? chats.length
  const chatsUnread = chatsData?.unreadTotal
    ?? chats.reduce((sum, chat) => sum + (Number(chat.unreadCount) || 0), 0)

  function handleChatMarkedRead(conversationId) {
    setChatsData((current) => {
      if (!current?.items) return current
      const items = current.items.map((item) =>
        item.conversationId === conversationId || item.id === conversationId
          ? { ...item, unreadCount: 0 }
          : item,
      )
      return {
        ...current,
        items,
        unreadTotal: items.reduce((sum, item) => sum + (Number(item.unreadCount) || 0), 0),
      }
    })
    refetchChats()
  }

  const filters = Array.isArray(data?.filters) && data.filters.length > 0
    ? data.filters
    : ADMIN_OPS_BOARD_FILTERS

  const rawColumns = useMemo(() => (
    Array.isArray(data?.columns) && data.columns.length
      ? data.columns
      : [
          { title: 'At risk', count: 0, tone: 'red', orders: [] },
          { title: 'Watch', count: 0, tone: 'yellow', orders: [] },
          { title: 'On track', count: 0, tone: 'green', orders: [] },
        ]
  ), [data?.columns])

  const columns = useMemo(() => {
    const byChat = filterOpsBoardColumns(rawColumns, filter)
    return filterOpsBoardLiveQuery(byChat, boardQuery)
  }, [rawColumns, filter, boardQuery])
  const boardOrders = useMemo(() => flattenOpsBoardOrders(rawColumns), [rawColumns])
  const visibleChats = useMemo(
    () => buildOpsBoardChats(chats, boardOrders, filter),
    [chats, boardOrders, filter],
  )
  const visibleChatsActive = isOpsChatFilter(filter) ? visibleChats.length : chatsActive
  const filteredOrderCount = columns.reduce((sum, column) => sum + (Number(column.count) || 0), 0)
  const headerOrderCount = (isOpsChatFilter(filter) || liveOrderQueryIsActive(boardQuery))
    ? filteredOrderCount
    : (data?.activeOrderCount ?? '—')
  const refreshKey = `${headerOrderCount}-${columns.map((c) => c.count).join('-')}-${isLoading ? '1' : '0'}`

  useEffect(() => {
    const bucket = searchParams.get('bucket')
    if (!bucket || !Array.isArray(data?.columns)) return
    const column = data.columns.find(
      (item) => adminLiveOrdersBucketForColumnId(item.id) === bucket || item.title?.toLowerCase().replace(/\s+/g, '_') === bucket,
    )
    if (column) setFullView(column)
  }, [searchParams, data?.columns])

  const openOrderChat = (order, preferredRole) => {
    const conversationId = order?.conversationId
    if (!conversationId) return

    const role = preferredRole || order.contactType || 'Customer'
    const name =
      role === 'Champ'
        ? order.rider?.name || 'Champ'
        : 'Customer'

    // Prefer this order's conversation — never open a random open-chats strip item.
    const matchingChat = chats.find((chat) => chat.conversationId === conversationId)

    setActiveChat({
      ...(matchingChat || {}),
      id: conversationId,
      conversationId,
      orderId: order.orderId || matchingChat?.orderId || null,
      orderNumber: order.id || matchingChat?.orderNumber || null,
      role,
      name: matchingChat?.name && matchingChat.role === role ? matchingChat.name : name,
      initials: initialsFromPeerName(
        matchingChat?.name && matchingChat.role === role ? matchingChat.name : name,
      ),
      peerRole: role === 'Champ' ? 'CHAMP' : 'CUSTOMER',
    })
  }

  if (fullView) {
    return (
      <>
        <AdminLiveOrdersFullView
          column={fullView}
          filter={filter}
          chats={chats}
          query={boardQuery}
          onQueryChange={patchBoardQuery}
          onQueryClear={clearBoardQuery}
          onBack={closeFullView}
          onIncidentClick={setIncidentOrder}
          onContactClick={openOrderChat}
          onOrderClick={setSelectedOrder}
          onChatClick={setActiveChat}
        />
        {selectedOrder ? <AdminOrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} /> : null}
        {incidentOrder ? <IncidentOrderModal order={incidentOrder} onClose={() => setIncidentOrder(null)} /> : null}
        {selectedIncident ? (
          <AdminIncidentDetailModal
            incident={selectedIncident}
            onClose={() => setSelectedIncident(null)}
            onOpenOrder={(order) => {
              setSelectedIncident(null)
              setSelectedOrder(order)
            }}
          />
        ) : null}
        {activeChat ? (
          <AdminChatPanel
            key={`${activeChat.id}-${activeChat.orderId || ''}`}
            chat={activeChat}
            onClose={() => setActiveChat(null)}
            onMarkedRead={handleChatMarkedRead}
          />
        ) : null}
      </>
    )
  }

  return (
    <div className="flex h-[calc(100vh-44px)] flex-col overflow-hidden px-[18px] pt-[15px]">
      <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_292px] gap-3 max-[1050px]:grid-cols-1">
        <div className="flex min-h-0 min-w-0 flex-col">
          <div className="flex h-[32px] shrink-0 items-start justify-between">
            <div className="flex items-center gap-2.5">
              <h2 className="text-[14px] font-bold">{headerOrderCount} active orders</h2>
              <AdminAutoRefreshBadge
                intervalSeconds={data?.refreshIntervalSeconds}
                resetKey={refreshKey}
              />
            </div>
            <div className="flex gap-3">
              <Button className="h-[31px] px-4" onClick={() => refetch()} disabled={isLoading}>
                <RefreshCw size={11} /> Refresh
              </Button>
            </div>
          </div>

          <div className="mb-3 mt-3 flex shrink-0 flex-wrap items-center gap-2 text-[10px] text-[#59655e]">
            <span>Filter:</span>
            {filters.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setFilter(item)}
                className={cn(
                  'h-[26px] rounded-full border px-3 font-medium',
                  filter === item ? 'border-[#15904a] bg-white text-[#14763f]' : 'border-[#d9dfdb] bg-white text-[#657068]',
                )}
              >
                {item !== 'All orders' ? '💬 ' : ''}{item}
              </button>
            ))}
          </div>

          <div className="mb-3 shrink-0">
            <AdminLiveOrderFilterBar
              query={boardQuery}
              onChange={patchBoardQuery}
              onClear={clearBoardQuery}
              orders={boardOrders}
            />
          </div>

          <div className="grid min-h-0 flex-1 grid-cols-3 gap-3 max-[800px]:grid-cols-1">
            {columns.map((column) => (
              <section key={column.title} className="flex min-h-0 flex-col overflow-hidden rounded-[10px] bg-[#f1f4f1] p-2.5">
                <div className="flex h-[22px] shrink-0 items-center gap-2">
                  <span className={cn(
                    'rounded-md px-2 py-1 text-[10px] font-medium',
                    column.tone === 'red' && 'bg-[#fff0ed] text-[#d33f44]',
                    column.tone === 'yellow' && 'bg-[#fff3d8] text-[#b87c13]',
                    column.tone === 'green' && 'bg-[#e7f5eb] text-[#247c4b]',
                  )}>
                    {column.tone === 'red' ? '🔥' : column.tone === 'yellow' ? '⚠' : '🛡'} {column.title}
                  </span>
                  <strong className={cn('text-[12px]', column.tone === 'red' ? 'text-[#d33f44]' : column.tone === 'yellow' ? 'text-[#b87c13]' : 'text-[#247c4b]')}>{column.count}</strong>
                  <button
                    onClick={() => openFullView(column)}
                    className="ml-auto grid h-[22px] w-[22px] place-items-center rounded-md border border-[#dfe4e0] bg-white text-[#748078] hover:text-[#118446]"
                    aria-label={`Open ${column.title} orders full view`}
                  >
                    <ArrowUpRight size={12} />
                  </button>
                </div>
                <div className="mt-2 min-h-0 flex-1 space-y-2.5 overflow-y-auto pr-0.5">
                  {(column.orders || []).map((order, index) => (
                    <AdminOpsOrderCard
                      key={`${column.title}-${order.id}-${index}`}
                      order={order}
                      tone={column.tone}
                      onIncidentClick={setIncidentOrder}
                      onContactClick={openOrderChat}
                      onOrderClick={setSelectedOrder}
                    />
                  ))}
                  {(column.orders || []).length === 0 ? (
                    <div className="px-1 py-8 text-center">
                      <p className="text-[10px] text-[#8a938c]">
                        {liveOrderQueryIsActive(boardQuery)
                          ? 'No orders match'
                          : isOpsChatFilter(filter)
                            ? 'No matching chat orders'
                            : 'No orders'}
                      </p>
                      {liveOrderQueryIsActive(boardQuery) ? (
                        <button
                          type="button"
                          onClick={clearBoardQuery}
                          className="mt-1 text-[10px] font-medium text-[#16854a] hover:underline"
                        >
                          Clear all
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </section>
            ))}
          </div>
        </div>

        <OpsIncidentsSidebar
          fillHeight
          incidents={incidents}
          onIncidentClick={setSelectedIncident}
        />
      </div>

      <AdminOpenChats
        chats={visibleChats}
        activeCount={visibleChatsActive}
        unreadCount={isOpsChatFilter(filter)
          ? visibleChats.reduce((sum, chat) => sum + (Number(chat.unreadCount) || 0), 0)
          : chatsUnread}
        onChatClick={setActiveChat}
        groupByRole={isOpsChatFilter(filter)}
      />
      {selectedOrder ? <AdminOrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} /> : null}
      {incidentOrder ? <IncidentOrderModal order={incidentOrder} onClose={() => setIncidentOrder(null)} /> : null}
      {selectedIncident ? (
        <AdminIncidentDetailModal
          incident={selectedIncident}
          onClose={() => setSelectedIncident(null)}
          onOpenOrder={(order) => {
            setSelectedIncident(null)
            setSelectedOrder(order)
          }}
        />
      ) : null}
      {activeChat ? (
        <AdminChatPanel
          key={`${activeChat.id}-${activeChat.orderId || ''}`}
          chat={activeChat}
          onClose={() => setActiveChat(null)}
          onMarkedRead={handleChatMarkedRead}
        />
      ) : null}
    </div>
  )
}
