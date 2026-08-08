import { useCallback, useState } from 'react'
import { LayoutGrid } from 'lucide-react'
import { CalendarDateIcon } from '../../components/CalendarDateIcon'
import ServicesCalendarView from '../../components/ServicesCalendarView'
import ServicesCalendarDayView from '../../components/ServicesCalendarDayView'
import ServiceBookingModal from '../../components/ServiceBookingModal'
import ServiceRejectBookingModal from '../../components/ServiceRejectBookingModal'
import ServiceAcceptBookingModal from '../../components/ServiceAcceptBookingModal'
import { useApiMutation } from '../../hooks/useApiMutation'
import { useVendorServiceOrders } from '../../hooks/vendor/useVendorServiceOrders'
import {
  moveServiceBookingOnBoard,
  removeServiceBookingFromBoard,
} from '../../mappers/vendor/mapVendorServiceOrders'
import { orderService } from '../../services/vendor/orderService'

const tagTones = {
  blue: 'bg-[#e5f0ff] text-[#2978db]',
  blueBright: 'bg-[rgba(0,122,255,0.15)] text-[#007aff]',
}

function stopCardAction(event) {
  event.stopPropagation()
}

function orderKey(order) {
  return String(order?.backendId || order?.id || '')
}

function BookingCard({
  order,
  columnKey,
  busyId,
  onSelect,
  onAccept,
  onReject,
  onCheckIn,
  onNoShow,
  onComplete,
}) {
  const busy = busyId && busyId === orderKey(order)

  if (order.noShow) {
    return (
      <div
        className="flex w-full cursor-pointer flex-col gap-[7px] rounded-[10px] bg-white p-3 opacity-85"
        onClick={() => onSelect?.({ order, columnKey })}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            onSelect?.({ order, columnKey })
          }
        }}
        role="button"
        tabIndex={0}
      >
        <p className="text-right text-[11px] font-medium text-ink-muted">{order.when}</p>
        <p className="text-[14px] font-bold text-ink">{order.id}</p>
        <p className="text-[12px] text-ink-muted">
          {order.customer} · {order.service}
        </p>
        <div className="w-full rounded-[8px] bg-danger-soft px-[9px] py-[3px]">
          <p className="text-[11px] font-bold text-[#c91a24]">✕ No-show · cancelled</p>
        </div>
        <p className="text-[11px] text-[#6b756e]">{order.noShowReason}</p>
      </div>
    )
  }

  const primaryAction = order.actions?.[0]
  const secondaryAction = order.actions?.[1]

  return (
    <div className="flex w-full flex-col gap-[7px] rounded-[10px] bg-white p-3">
      <div
        className="flex cursor-pointer flex-col gap-[7px]"
        onClick={() => onSelect?.({ order, columnKey })}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            onSelect?.({ order, columnKey })
          }
        }}
        role="button"
        tabIndex={0}
      >
        <div className="flex w-full items-center gap-1.5">
          {order.tag ? (
            <span
              className={`inline-flex h-5 items-center whitespace-nowrap rounded-full px-[9px] py-[3px] text-[11px] font-medium ${tagTones[order.tagTone] || tagTones.blue}`}
            >
              {order.tag}
            </span>
          ) : null}
          <p className="flex-1 text-right text-[11px] font-medium text-ink-muted">{order.when}</p>
        </div>
        <p className="text-[14px] font-bold text-ink">{order.id}</p>
        <p className="text-[12px] text-ink-muted">
          {order.customer} · {order.service}
        </p>

        {order.slaLabel ? (
          <div className="flex w-full items-center justify-between text-[#d9730d]">
            <p className="text-[11px] font-medium">{order.slaLabel}</p>
            <p className="text-[13px] font-bold">{order.slaValue}</p>
          </div>
        ) : null}
      </div>

      {order.actions && order.actions.length === 2 ? (
        <div className="flex w-full gap-2">
          <button
            type="button"
            disabled={Boolean(busy)}
            className="flex-1 rounded-[8px] bg-green-primary px-3 py-2 text-xs font-medium text-white disabled:opacity-60"
            onClick={(event) => {
              stopCardAction(event)
              if (primaryAction === 'Check-in') {
                onCheckIn?.({ order, columnKey })
                return
              }
              onAccept?.({ order, columnKey })
            }}
          >
            {busy && (primaryAction === 'Accept' || primaryAction === 'Check-in')
              ? '…'
              : primaryAction}
          </button>
          <button
            type="button"
            disabled={Boolean(busy)}
            className="flex-1 rounded-[8px] border border-border bg-white px-3 py-2 text-xs font-medium text-danger disabled:opacity-60"
            onClick={(event) => {
              stopCardAction(event)
              if (secondaryAction === 'No Show') {
                onNoShow?.({ order, columnKey })
                return
              }
              onReject?.({ order, columnKey })
            }}
          >
            {busy && secondaryAction === 'No Show' ? '…' : secondaryAction}
          </button>
        </div>
      ) : null}

      {order.buttonLabel ? (
        <button
          type="button"
          disabled={Boolean(busy)}
          className="h-8 w-full rounded-[8px] bg-[#2e9e4d] text-[13px] font-medium text-white disabled:opacity-60"
          onClick={(event) => {
            stopCardAction(event)
            onComplete?.({ order, columnKey })
          }}
        >
          {busy ? '…' : order.buttonLabel}
        </button>
      ) : null}
    </div>
  )
}

export default function Services() {
  const [view, setView] = useState('board')
  const [calendarDay, setCalendarDay] = useState(null)
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [rejectBooking, setRejectBooking] = useState(null)
  const [acceptedBooking, setAcceptedBooking] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [busyId, setBusyId] = useState(null)
  const [actionError, setActionError] = useState(null)
  const [rejectError, setRejectError] = useState(null)

  const { data: serviceBookings, error, isLoading, refetch, setData } = useVendorServiceOrders()

  const { mutate: acceptOrder } = useApiMutation((orderId) => orderService.acceptOrder(orderId))
  const { mutate: rejectOrderMutation } = useApiMutation(({ orderId, reason, note }) =>
    orderService.rejectOrder(orderId, { reason, note }),
  )
  const { mutate: checkInService } = useApiMutation((orderId) => orderService.checkInService(orderId))
  const { mutate: markNoShow } = useApiMutation((orderId) => orderService.markNoShow(orderId))
  const { mutate: completeOrder } = useApiMutation((orderId) => orderService.completeOrder(orderId))

  const columnMeta = serviceBookings
    ? {
        new: { title: 'New', items: serviceBookings.new || [] },
        upcoming: { title: 'Upcoming', items: serviceBookings.upcoming || [] },
        inProgress: { title: 'In progress', items: serviceBookings.inProgress || [] },
      }
    : {
        new: { title: 'New', items: [] },
        upcoming: { title: 'Upcoming', items: [] },
        inProgress: { title: 'In progress', items: [] },
      }

  const filteredColumns = Object.fromEntries(
    Object.entries(columnMeta).map(([key, meta]) => [
      key,
      {
        ...meta,
        items: meta.items.filter((order) => {
          if (!searchQuery.trim()) return true
          const haystack = [order.id, order.customer, order.service]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
          return haystack.includes(searchQuery.trim().toLowerCase())
        }),
      },
    ]),
  )

  const handleAccept = useCallback(
    async ({ order }) => {
      const orderId = order?.backendId || order?.id
      if (!orderId) {
        setActionError(new Error('Order id is missing.'))
        return
      }

      setActionError(null)
      setBusyId(String(orderId))
      try {
        const result = await acceptOrder(orderId)
        const mapped = result?.data
        const status = String(result?.raw?.status || mapped?.backendStatus || '').toUpperCase()
        const to = status === 'AWAITING_PAYMENT' ? 'new' : 'upcoming'

        setData((current) =>
          moveServiceBookingOnBoard(current, {
            from: 'new',
            to,
            orderId,
            updater: () =>
              mapped
                ? {
                    ...mapped,
                    ...(to === 'new'
                      ? {
                          slaLabel: 'Accepted-Awaiting payment',
                          actions: [],
                          buttonLabel: undefined,
                        }
                      : {
                          slaLabel: undefined,
                          slaValue: undefined,
                          actions: ['Check-in', 'No Show'],
                          buttonLabel: undefined,
                        }),
                  }
                : null,
          }),
        )
        setAcceptedBooking(mapped || order)
      } catch (err) {
        setActionError(err)
        refetch()
      } finally {
        setBusyId(null)
      }
    },
    [acceptOrder, refetch, setData],
  )

  const handleReject = useCallback(
    async ({ reason, note }) => {
      const order = rejectBooking
      const orderId = order?.backendId || order?.id
      if (!orderId) {
        setRejectError(new Error('Order id is missing.'))
        return
      }

      setRejectError(null)
      setBusyId(String(orderId))
      try {
        await rejectOrderMutation({ orderId, reason, note })
        setData((current) => removeServiceBookingFromBoard(current, orderId))
        setRejectBooking(null)
      } catch (err) {
        setRejectError(err)
      } finally {
        setBusyId(null)
      }
    },
    [rejectBooking, rejectOrderMutation, setData],
  )

  const handleCheckIn = useCallback(
    async ({ order }) => {
      const orderId = order?.backendId || order?.id
      if (!orderId) {
        setActionError(new Error('Order id is missing.'))
        return
      }

      setActionError(null)
      setBusyId(String(orderId))
      try {
        const result = await checkInService(orderId)
        setData((current) =>
          moveServiceBookingOnBoard(current, {
            from: 'upcoming',
            to: 'inProgress',
            orderId,
            updater: () => result?.data || null,
          }),
        )
      } catch (err) {
        setActionError(err)
        refetch()
      } finally {
        setBusyId(null)
      }
    },
    [checkInService, refetch, setData],
  )

  const handleNoShow = useCallback(
    async ({ order }) => {
      const orderId = order?.backendId || order?.id
      if (!orderId) {
        setActionError(new Error('Order id is missing.'))
        return
      }

      setActionError(null)
      setBusyId(String(orderId))
      try {
        await markNoShow(orderId)
        setData((current) => removeServiceBookingFromBoard(current, orderId))
      } catch (err) {
        setActionError(err)
        refetch()
      } finally {
        setBusyId(null)
      }
    },
    [markNoShow, refetch, setData],
  )

  const handleComplete = useCallback(
    async ({ order }) => {
      const orderId = order?.backendId || order?.id
      if (!orderId) {
        setActionError(new Error('Order id is missing.'))
        return
      }

      setActionError(null)
      setBusyId(String(orderId))
      try {
        await completeOrder(orderId)
        setData((current) => removeServiceBookingFromBoard(current, orderId))
      } catch (err) {
        setActionError(err)
        refetch()
      } finally {
        setBusyId(null)
      }
    },
    [completeOrder, refetch, setData],
  )

  if (view === 'board' && isLoading && !serviceBookings) {
    return <div className="p-7 text-[13px] text-ink-muted">Loading service bookings…</div>
  }
  if (view === 'board' && error && !serviceBookings) {
    return (
      <div className="p-7 text-[13px] text-danger">
        Unable to load service bookings.{' '}
        <button type="button" onClick={refetch} className="underline">
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className="pt-[26px] px-[28px] pb-10">
      {view === 'board' ? <h1 className="mb-4 text-[20px] font-bold text-ink">Services bookings</h1> : null}

      {view === 'board' ? (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            className="inline-flex items-center gap-[6px] rounded-[18px] border-[1.2px] border-[#e0e5e0] bg-white py-2 px-[14px] text-[13px] font-medium text-ink"
            onClick={() => {
              setCalendarDay(null)
              setView('calendar')
            }}
          >
            <CalendarDateIcon />
            Calendar view
          </button>
          <div className="flex items-center gap-2">
            {error ? (
              <p className="text-[12px] text-danger">
                Refresh failed.{' '}
                <button type="button" onClick={refetch} className="underline">
                  Retry
                </button>
              </p>
            ) : null}
            {actionError ? (
              <p className="text-[12px] text-danger">
                {actionError.message || 'Action failed.'}{' '}
                <button type="button" onClick={() => setActionError(null)} className="underline">
                  Dismiss
                </button>
              </p>
            ) : null}
            <button
              type="button"
              onClick={() => refetch()}
              className="h-10 rounded-[8px] border border-border bg-white px-[14px] text-xs font-medium hover:bg-[#f7f9f7]"
            >
              ↻ Refresh
            </button>
            <input
              className="h-10 min-w-[220px] rounded-[8px] border border-border bg-white px-[14px] text-xs"
              placeholder="Search by order #…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      ) : null}

      {view === 'calendar' && calendarDay ? (
        <ServicesCalendarDayView
          year={calendarDay.year}
          month={calendarDay.month}
          day={calendarDay.day}
          count={calendarDay.count}
          statuses={calendarDay.statuses}
          onBack={() => setCalendarDay(null)}
        />
      ) : null}

      {view === 'calendar' && !calendarDay ? (
        <ServicesCalendarView
          leftAction={
            <button
              type="button"
              className="inline-flex items-center gap-[6px] rounded-[18px] border-[1.2px] border-[#e0e5e0] bg-white py-2 px-[14px] text-[13px] font-medium text-ink"
              onClick={() => setView('board')}
            >
              <LayoutGrid size={16} />
              Board view
            </button>
          }
          onDaySelect={setCalendarDay}
        />
      ) : null}

      {view === 'board' ? (
        <div className="grid grid-cols-3 gap-[14px] max-[1200px]:grid-cols-1">
          {Object.entries(filteredColumns).map(([key, meta]) => (
            <div key={key} className="flex min-h-[520px] flex-col gap-2.5 rounded-lg bg-[#eef2ee] px-3 py-[14px]">
              <div className="mb-3 flex items-center justify-between text-sm font-bold">
                <span>{meta.title}</span>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-white px-[7px] py-[2px] text-[11px] font-medium text-ink-muted">
                    {meta.items.length}
                  </span>
                </div>
              </div>
              {meta.items.length === 0 ? (
                <div className="p-6 text-center text-[13px] text-ink-muted">No bookings</div>
              ) : (
                meta.items.map((order, idx) => (
                  <BookingCard
                    key={`${order.backendId || order.id}-${idx}`}
                    order={order}
                    columnKey={key}
                    busyId={busyId}
                    onSelect={setSelectedBooking}
                    onAccept={handleAccept}
                    onReject={({ order: rejectTarget }) => {
                      setRejectError(null)
                      setRejectBooking(rejectTarget)
                    }}
                    onCheckIn={handleCheckIn}
                    onNoShow={handleNoShow}
                    onComplete={handleComplete}
                  />
                ))
              )}
            </div>
          ))}
        </div>
      ) : null}

      <ServiceBookingModal
        open={Boolean(selectedBooking?.order)}
        onClose={() => setSelectedBooking(null)}
        order={selectedBooking?.order}
        columnKey={selectedBooking?.columnKey}
      />

      <ServiceRejectBookingModal
        open={Boolean(rejectBooking)}
        onClose={() => {
          if (busyId) return
          setRejectBooking(null)
          setRejectError(null)
        }}
        order={rejectBooking}
        isSubmitting={busyId === orderKey(rejectBooking)}
        error={rejectError}
        onConfirm={handleReject}
      />

      <ServiceAcceptBookingModal
        open={Boolean(acceptedBooking)}
        onClose={() => setAcceptedBooking(null)}
        order={acceptedBooking}
      />
    </div>
  )
}
