import { useEffect, useState } from 'react'
import { ArrowUpRight, Clock3, RefreshCw, Search, ShieldAlert } from 'lucide-react'
import motoBike from '../../../assets/moto_bike.png'
import { useAdminLiveOrders } from '../../../hooks/admin/useAdminLiveOrders'
import { useAdminIncidents } from '../../../hooks/admin/useAdminIncidents'
import { useAdminChats } from '../../../hooks/admin/useAdminChats'
import { useAdminOrderDetail } from '../../../hooks/admin/useAdminOrderDetail'
import { useAdminOrderActionOptions } from '../../../hooks/admin/useAdminOrderActionOptions'
import { adminLiveOrdersBucketForColumnId } from '../../../mappers/admin/mapAdminLiveOrders'
import { ApiState } from '../../../components/admin/ApiState'
import { Badge } from '../../../components/admin/Badge'
import { Button } from '../../../components/admin/Button'
import { cn } from '../../../components/admin/cn'
import { AdminChatPanel } from '../../../components/admin/operations/AdminChatPanel'
import { AdminOpenChats } from '../../../components/admin/operations/AdminOpenChats'
import { AdminOrderTakeActionPanel } from '../../../components/admin/operations/AdminOrderTakeActionPanel'

function AdminLiveOrderCard({ order, tone, onIncidentClick, onContactClick, onOrderClick }) {
  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => onOrderClick?.(order)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onOrderClick?.(order)
        }
      }}
      className="h-[112px] cursor-pointer rounded-[9px] border border-[#dde3df] bg-white p-2.5 shadow-[0_1px_2px_rgba(20,40,28,.03)] transition hover:border-[#a9cdb5] hover:shadow-[0_3px_8px_rgba(20,40,28,.08)] focus:outline-none focus:ring-2 focus:ring-[#1a9b53]/20"
    >
      <div className="flex items-center gap-2">
        <strong className="min-w-0 flex-1 truncate text-[11px] font-bold">{order.id}</strong>
        <span className={cn(
          'shrink-0 text-[9px] font-medium',
          order.temperature === 'Hot food'
            ? 'rounded-full bg-[#fff0e8] px-1.5 py-0.5 text-[#ff5b2d]'
            : 'text-[#6f7973]',
        )}>{order.temperature}</span>
        {order.schedule ? <span className="rounded bg-[#eee8ff] px-1 text-[9px] font-medium text-[#7055aa]">{order.schedule}</span> : null}
        <span className={cn('flex items-center gap-0.5 text-[10px] font-medium', tone === 'red' ? 'text-[#d13f45]' : tone === 'yellow' ? 'text-[#c68618]' : 'text-[#c68618]')}>
          <Clock3 size={11} /> {order.timeLeft}
        </span>
      </div>
      <p className="mt-1.5 truncate text-[11px] font-bold">{order.vendor}</p>
      <div className="mt-1 flex items-center gap-1.5">
        <span className={cn(
          'max-w-[112px] truncate rounded-md px-2 py-1 text-[9px] font-medium',
          order.state.startsWith('Preparing') && 'bg-[#fff3d8] text-[#a97013]',
          order.state.startsWith('Ready') && 'bg-[#e4efff] text-[#3470ae]',
          order.state.startsWith('Picked') && 'bg-[#e4efff] text-[#3470ae]',
          order.state.startsWith('On the way') && 'bg-[#e5f5eb] text-[#24834e]',
          (order.state.startsWith('Accepted') || order.state.startsWith('Assigned') || order.state.startsWith('Pending')) && 'bg-[#fff3d8] text-[#a97013]',
          order.state.toLowerCase().startsWith('placed') && 'bg-[#f0f2f0] text-[#59655e]',
        )}>{order.state}</span>
      </div>
      <div className="mt-1 flex items-center gap-1.5">
        {order.hasIncident ? (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              onIncidentClick?.(order)
            }}
            className="rounded-[9px] bg-[#fdebec] px-2 py-1 text-[9px] font-medium text-[#DB2626] transition hover:bg-[#f9d9da] focus:outline-none focus:ring-2 focus:ring-danger/25"
          >
            Incident
          </button>
        ) : null}
        {order.contactType ? (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              onContactClick?.(order)
            }}
            className={cn(
              'rounded-[9px] px-2 py-1 text-[9px] font-medium transition hover:brightness-95',
              order.contactType === 'Champ' ? 'bg-[#e5efff] text-[#3470ae]' : 'bg-[#eee8ff] text-[#7454ad]',
            )}
          >
            💬 {order.contactType}
          </button>
        ) : null}
      </div>
      <p className="mt-1 flex items-center gap-1 truncate text-[9px] font-medium text-[#2f3933]">
        <img src={motoBike} alt="" className="h-3 w-3 shrink-0 object-contain" />
        <span className="truncate">{order.rider.name}</span>
      </p>
    </article>
  )
}

function AdminOrderDetailModal({ order, onClose }) {
  const orderId = order?.orderId || null
  const { data: detail, error, isLoading, refetch } = useAdminOrderDetail(orderId)

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
                  <Badge tone="yellow">{detail.statusLabel}</Badge>
                  {detail.category ? <span className="rounded-full bg-[#fff0e8] px-2 py-1 text-[9px] font-medium text-[#e36831]">{detail.category}</span> : null}
                </div>
                <p className="mt-1 text-[9px] text-[#818a84]">
                  {detail.vendor.name}
                  {detail.fulfillmentLabel ? ` · ${detail.fulfillmentLabel}` : ''}
                  {detail.placedClock && detail.placedClock !== '—' ? ` · placed ${detail.placedClock}` : ''}
                </p>
                <button type="button" onClick={onClose} aria-label="Close order details" className="absolute -right-1 -top-1 grid h-7 w-7 place-items-center rounded-full text-[19px] font-light text-[#77817b] hover:bg-[#f1f3f1]">×</button>
              </header>

              <div className="mt-2 flex flex-wrap gap-1.5">
                <Badge tone="blue">Stage: {detail.stageLabel}</Badge>
                {order.timeLeft ? <Badge tone="yellow">ETA {order.timeLeft}</Badge> : null}
              </div>

              <div className="mt-2 grid grid-cols-2 gap-2 max-[520px]:grid-cols-1">
                <section className="rounded-md border border-[#dfe4e0] p-2.5">
                  <h3 className="text-[10px] font-bold">Order details</h3>
                  <div className="mt-2 grid grid-cols-2 gap-x-5 gap-y-1 text-[9px]">
                    {detail.summaryRows.map(([label, value]) => (
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

function IncidentOrderModal({ order, onClose }) {
  const [openActionMenu, setOpenActionMenu] = useState(null)
  const [activeAction, setActiveAction] = useState(null)
  const orderId = order?.orderId || null
  const { data: detail, error, isLoading, refetch } = useAdminOrderDetail(orderId)
  const {
    data: actionOptions,
    error: actionOptionsError,
    isLoading: actionOptionsLoading,
  } = useAdminOrderActionOptions()

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

  function startAction(code, incidentId = null) {
    setOpenActionMenu(null)
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

            <footer className="flex shrink-0 justify-end gap-2 border-t border-[#e3e7e4] bg-white px-[14px] py-2.5">
              <Button onClick={onClose} className="h-[28px] rounded-full px-3">Close</Button>
              {canMarkResolved ? (
                <Button
                  primary
                  className="h-[28px] rounded-full px-3"
                  onClick={() => startAction('MARK_RESOLVED', openIncidents[0]?.id || null)}
                >
                  Mark resolved
                </Button>
              ) : null}
            </footer>

            {activeAction ? (
              <AdminOrderTakeActionPanel
                actionCode={activeAction.code}
                orderId={detail.orderId || orderId}
                incidentId={activeAction.incidentId}
                openIncidents={openIncidents}
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

function AdminLiveOrdersFullView({ column, chats, chatsActive, onBack, onIncidentClick, onContactClick, onOrderClick, onChatClick }) {
  const bucket = adminLiveOrdersBucketForColumnId(column.id)
  const { data, error, isLoading, refetch } = useAdminLiveOrders({
    bucket,
    sort: 'time_left',
    limit: 50,
  })

  const bucketColumn =
    data?.columns?.find((item) => item.id === column.id) ||
    data?.columns?.find((item) => item.tone === column.tone)

  const orders = bucketColumn?.orders || []
  const count = bucketColumn?.count ?? orders.length

  return (
    <div className="flex min-h-[calc(100vh-44px)] flex-col px-[18px] pb-0 pt-[15px]">
      <div className="flex items-start gap-3">
        <button onClick={onBack} className="h-[27px] rounded-full border border-[#dfe4e0] bg-white px-3 text-[10px] font-medium text-[#536158]">‹ Live orders</button>
        <div>
          <h2 className="flex items-center gap-1.5 text-[18px] font-bold">
            <span>{column.tone === 'red' ? '🔥' : column.tone === 'yellow' ? '⚠' : '🛡'}</span>
            {column.title} orders — full view
          </h2>
          <p className="mt-0.5 text-[10px] text-[#7a847e]">
            {isLoading && !data ? 'Loading…' : `${count} orders in this status`}
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

      <div className="mt-8 flex flex-wrap items-center gap-2">
        <label className="flex h-[31px] w-[225px] items-center gap-2 rounded-full border border-[#dfe4e0] bg-white px-3">
          <Search size={12} className="text-[#7b867f]" />
          <input className="min-w-0 flex-1 border-0 bg-transparent text-[10px] outline-none" placeholder="Search order, vendor, champ, customer..." />
        </label>
        {['Vendor  · All ▾', 'Type · All ▾', 'Champ · All ▾'].map((filter) => (
          <button key={filter} className="h-[31px] rounded-full border border-[#dfe4e0] bg-white px-3 text-[10px] text-[#59655e]">{filter}</button>
        ))}
        <button className="ml-auto h-[31px] rounded-full border border-[#dfe4e0] bg-white px-3 text-[10px] text-[#59655e]">Sort · <b>Time left</b>▾</button>
      </div>

      {error && !orders.length ? (
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

      {isLoading && !orders.length && !error ? (
        <p className="mt-8 text-[12px] font-medium text-[#7a857e]">Loading {column.title.toLowerCase()} orders…</p>
      ) : null}

      {!isLoading && !error && !orders.length ? (
        <p className="mt-8 text-[12px] font-medium text-[#8a938c]">No {column.title.toLowerCase()} orders.</p>
      ) : null}

      <div className="mt-8 grid grid-cols-4 gap-3 max-[1000px]:grid-cols-3 max-[760px]:grid-cols-2 max-[520px]:grid-cols-1">
        {orders.map((order) => (
          <AdminLiveOrderCard
            key={order.orderId || order.id}
            order={order}
            tone={column.tone}
            onIncidentClick={onIncidentClick}
            onContactClick={onContactClick}
            onOrderClick={onOrderClick}
          />
        ))}
      </div>

      <AdminOpenChats chats={chats} activeCount={chatsActive} onChatClick={onChatClick} />
    </div>
  )
}

export default function AdminLiveOrdersPage() {
  const [filter, setFilter] = useState('All orders')
  const [fullView, setFullView] = useState(null)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [incidentOrder, setIncidentOrder] = useState(null)
  const [activeChat, setActiveChat] = useState(null)
  const { data, error, isLoading, refetch } = useAdminLiveOrders({
    bucket: 'all',
    sort: 'time_left',
    limit: 50,
  })
  const { data: incidentsData } = useAdminIncidents()
  const incidents = Array.isArray(incidentsData?.items) ? incidentsData.items : []
  const { data: chatsData, setData: setChatsData, refetch: refetchChats } = useAdminChats()
  const chats = Array.isArray(chatsData?.items) ? chatsData.items : []
  const chatsActive = chatsData?.active ?? chats.length

  function handleChatMarkedRead(conversationId) {
    setChatsData((current) => {
      if (!current?.items) return current
      return {
        ...current,
        items: current.items.map((item) =>
          item.conversationId === conversationId || item.id === conversationId
            ? { ...item, unreadCount: 0 }
            : item,
        ),
      }
    })
    refetchChats()
  }

  if (!data) return <ApiState isLoading={isLoading} error={error} onRetry={refetch} />

  const openOrderChat = (order) => {
    const matchingChat = chats.find((chat) => chat.role === order.contactType) || chats[0]
    if (!matchingChat) return
    setActiveChat({ ...matchingChat, orderNumber: matchingChat.orderNumber || order.id })
  }

  if (fullView) {
    return (
      <>
        <AdminLiveOrdersFullView
          column={fullView}
          chats={chats}
          chatsActive={chatsActive}
          onBack={() => setFullView(null)}
          onIncidentClick={setIncidentOrder}
          onContactClick={openOrderChat}
          onOrderClick={setSelectedOrder}
          onChatClick={setActiveChat}
        />
        {selectedOrder ? <AdminOrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} /> : null}
        {incidentOrder ? <IncidentOrderModal order={incidentOrder} onClose={() => setIncidentOrder(null)} /> : null}
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
    <div className="flex min-h-[calc(100vh-44px)] flex-col px-[18px] pb-0 pt-[15px]">
      <div className="grid grid-cols-[minmax(0,1fr)_292px] gap-3 max-[1050px]:grid-cols-1">
        <div className="min-w-0">
          <div className="flex h-[32px] items-start justify-between">
            <div className="flex items-center gap-2.5">
              <h2 className="text-[14px] font-bold">{data.activeOrderCount} active orders</h2>
              {data.refreshIntervalSeconds ? (
                <span className="rounded-full bg-[#e4f5e9] px-2 py-1 text-[10px] font-medium text-[#188248]">
                  ● auto-refresh {data.refreshIntervalSeconds}s
                </span>
              ) : null}
            </div>
            <div className="flex gap-3">
              <Button className="h-[31px] px-3">All vendors⌄</Button>
              <Button className="h-[31px] px-4" onClick={() => refetch()} disabled={isLoading}>
                <RefreshCw size={11} /> Refresh
              </Button>
            </div>
          </div>

          <div className="mb-3 mt-3 flex flex-wrap items-center gap-2 text-[10px] text-[#59655e]">
            <span>Filter:</span>
            {data.filters.map((item) => (
              <button
                key={item}
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

          <div className="grid grid-cols-3 gap-3 max-[800px]:grid-cols-1">
            {data.columns.map((column) => (
              <section key={column.title} className="min-h-[416px] rounded-[10px] bg-[#f1f4f1] p-2.5">
                <div className="flex h-[22px] items-center gap-2">
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
                    onClick={() => setFullView(column)}
                    className="ml-auto grid h-[22px] w-[22px] place-items-center rounded-md border border-[#dfe4e0] bg-white text-[#748078] hover:text-[#118446]"
                    aria-label={`Open ${column.title} orders full view`}
                  >
                    <ArrowUpRight size={12} />
                  </button>
                </div>
                <div className="mt-2 space-y-2.5">
                  {column.orders.map((order, index) => (
                    <AdminLiveOrderCard
                      key={`${column.title}-${order.id}-${index}`}
                      order={order}
                      tone={column.tone}
                      onIncidentClick={setIncidentOrder}
                      onContactClick={openOrderChat}
                      onOrderClick={setSelectedOrder}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>

        <aside className="h-[441px] overflow-hidden rounded-xl border border-[#dfe4e0] bg-white px-[14px]">
          <div className="flex h-[43px] items-center gap-1.5">
            <ShieldAlert size={14} className="text-[#d46763]" />
            <h2 className="text-[14px] font-bold">Incidents Log</h2>
          </div>
          {incidents.length === 0 ? (
            <div className="py-8 text-center text-[12px] text-[#78837c]">No incidents</div>
          ) : incidents.map(({ id, priority, title, detail, tone }) => (
            <div key={id} className="flex h-[59px] items-center border-b border-[#e2e6e3]">
              <span className={cn(
                'mr-2.5 grid h-[19px] w-8 shrink-0 place-items-center rounded-md text-[9px] font-medium',
                tone === 'red' && 'bg-[#fdebec] text-[#d64044]',
                tone === 'yellow' && 'bg-[#fff4d9] text-[#c78a18]',
                tone === 'blue' && 'bg-[#eaf2fb] text-[#3974ad]',
                tone === 'gray' && 'bg-[#f0f2f0] text-[#737d77]',
              )}>{priority}</span>
              <div className="min-w-0">
                <p className="truncate text-[11px] font-bold">{title}</p>
                <p className="truncate text-[9px] text-[#818b84]">{detail}</p>
              </div>
            </div>
          ))}
        </aside>
      </div>

      <AdminOpenChats chats={chats} activeCount={chatsActive} onChatClick={setActiveChat} />
      {selectedOrder ? <AdminOrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} /> : null}
      {incidentOrder ? <IncidentOrderModal order={incidentOrder} onClose={() => setIncidentOrder(null)} /> : null}
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
