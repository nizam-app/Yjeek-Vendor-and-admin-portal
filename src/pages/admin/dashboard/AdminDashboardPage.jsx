import { useCallback, useEffect, useState } from 'react'
import { Flame, ShieldCheck, TriangleAlert, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAdminDashboard } from '../../../hooks/admin/useAdminDashboard'
import { useAdminDashboardMap } from '../../../hooks/admin/useAdminDashboardMap'
import { useAdminIncidents } from '../../../hooks/admin/useAdminIncidents'
import { useAdminShell } from '../../../context/AdminShellContext'
import { AdminLiveMap } from '../../../components/admin/AdminLiveMap'
import { ApiErrorBanner, SkeletonBar } from '../../../components/admin/ApiState'
import { cn } from '../../../components/admin/cn'
import { AdminOrderDetailModal } from '../../admin/operations/AdminLiveOrdersPage'
import { AdminIncidentDetailModal } from '../../../components/admin/operations/AdminIncidentDetailModal'
import { OpsIncidentsSidebar } from '../../../components/admin/operations/OpsIncidentsSidebar'

const KPI_PLACEHOLDERS = [
  { key: 'pending', label: 'Pending' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'preparing', label: 'Preparing' },
  { key: 'ready', label: 'Ready' },
  { key: 'pickedUp', label: 'Picked up' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'cancelled', label: 'Cancelled' },
  { key: 'onlineVendor', label: 'Online Vendor' },
  { key: 'onlineChamp', label: 'Online Champ' },
]

const BUCKET_QUERY = {
  Critical: 'critical',
  'At Risk': 'at_risk',
  'On Track': 'on_track',
}

function DashboardKpiStrip({ items }) {
  return (
    <section
      aria-label="Live order summary"
      className="grid h-[58px] grid-cols-9 rounded-[11px] border border-[#e4e8e4] bg-white shadow-[0_1px_3px_rgba(20,40,28,.04)] max-[700px]:h-auto max-[700px]:grid-cols-3"
    >
      {items.map(({ value, label, tone }, index) => (
        <div
          key={label}
          className="relative flex min-w-0 flex-col items-center justify-center px-1"
        >
          {value == null ? (
            <SkeletonBar className="h-5 w-8" />
          ) : (
            <strong className={cn('text-[20px] font-bold leading-5', tone === 'red' ? 'text-[#df4a4e]' : 'text-[#17231c]')}>
              {value}
            </strong>
          )}
          <span className="max-w-full truncate text-[11px] font-medium leading-3 text-[#717c75]">{label}</span>
          {index < items.length - 1 ? (
            <ChevronRight
              aria-hidden="true"
              size={14}
              strokeWidth={1.4}
              className="pointer-events-none absolute right-[-4px] top-1/2 -translate-y-1/2 text-[#dfe3df]"
            />
          ) : null}
        </div>
      ))}
    </section>
  )
}

export default function AdminDashboardPage() {
  const navigate = useNavigate()
  const { region, mapFocus, setMapFocus, clearMapFocus } = useAdminShell()
  const { data, error, refetch } = useAdminDashboard({ region })
  const {
    data: mapData,
    error: mapError,
    isLoading: mapLoading,
    refetch: refetchMap,
    layer,
    setLayer,
  } = useAdminDashboardMap({
    region,
    refreshSeconds: data?.autoRefreshSeconds,
  })
  const { data: incidentsData } = useAdminIncidents()
  const incidents = Array.isArray(incidentsData?.items) ? incidentsData.items : []
  const kpiItems = data?.summary?.length
    ? data.summary
    : KPI_PLACEHOLDERS.map((item) => ({ ...item, value: null }))
  const slaColumns = data?.slaColumns?.length ? data.slaColumns : []

  const [selectedOrder, setSelectedOrder] = useState(null)
  const [selectedIncident, setSelectedIncident] = useState(null)

  const handlePointClick = useCallback((point) => {
    if (point?.orderId) {
      setSelectedOrder({
        orderId: point.orderId,
        id: point.orderNumber || point.orderId,
      })
    }
  }, [])

  useEffect(() => {
    if (!mapFocus) return undefined

    if (mapFocus.type === 'incident') {
      setSelectedIncident({ id: mapFocus.id, title: mapFocus.label, orderId: mapFocus.orderId })
      if (mapFocus.orderId) {
        setLayer('orders')
      }
      return undefined
    }

    if (mapFocus.type === 'order') {
      setLayer('orders')
      setSelectedOrder({ orderId: mapFocus.id, id: mapFocus.label || mapFocus.id })
      return undefined
    }
    if (mapFocus.type === 'vendor') setLayer('vendors')
    if (mapFocus.type === 'champ') setLayer('champs')
    return undefined
  }, [mapFocus, setLayer])

  const mapFocusForPins =
    mapFocus && mapFocus.type !== 'incident'
      ? mapFocus
      : mapFocus?.orderId
        ? { type: 'order', id: mapFocus.orderId, label: mapFocus.label }
        : null

  return (
    <div className="px-4 pb-5 pt-2 max-[700px]:px-3">
      <ApiErrorBanner error={error} onRetry={refetch} />
      <DashboardKpiStrip items={kpiItems} />

      <div className="mt-4 grid grid-cols-[minmax(0,2.3fr)_minmax(260px,1fr)] items-start gap-4 max-[900px]:grid-cols-1">
        <AdminLiveMap
          layer={layer}
          onLayerChange={setLayer}
          legend={mapData?.legend || []}
          points={mapData?.points || []}
          scopeNote={mapData?.scopeNote}
          isLoading={mapLoading}
          error={mapError}
          onRetry={refetchMap}
          focusTarget={mapFocusForPins}
          onPointClick={handlePointClick}
        />

        <OpsIncidentsSidebar
          fillHeight={false}
          incidents={incidents}
          onIncidentClick={setSelectedIncident}
        />
      </div>

      <div className="mt-[18px] grid grid-cols-3 gap-8 max-[700px]:grid-cols-1">
        {(slaColumns.length
          ? slaColumns
          : [
              { title: 'At risk', count: '—', tone: 'red', orders: [] },
              { title: 'Watch', count: '—', tone: 'yellow', orders: [] },
              { title: 'On track', count: '—', tone: 'green', orders: [] },
            ]
        ).map((column) => (
          <section key={column.title} className="min-w-0">
            <button
              type="button"
              onClick={() => {
                const bucket = BUCKET_QUERY[column.title]
                if (bucket) navigate(`/admin/live-orders?bucket=${encodeURIComponent(bucket)}`)
              }}
              className="flex h-[25px] w-full items-center gap-1.5 px-2 text-left text-[11px] font-medium hover:opacity-80"
            >
              <div className={cn(
                'inline-flex h-5 items-center gap-1 rounded-md px-1.5',
                column.tone === 'red' && 'bg-[#fff0ed] text-[#d34b4d]',
                column.tone === 'yellow' && 'bg-[#fff5d9] text-[#b27b17]',
                column.tone === 'green' && 'bg-[#edf7f0] text-[#32815a]',
              )}>
                {column.tone === 'red' ? <Flame size={11} fill="currentColor" className="text-[#e59028]" /> : null}
                {column.tone === 'yellow' ? <TriangleAlert size={11} fill="currentColor" className="text-[#d99820]" /> : null}
                {column.tone === 'green' ? <ShieldCheck size={11} fill="currentColor" className="text-[#58a980]" /> : null}
                <span>{column.title}</span>
              </div>
              <strong className={column.tone === 'red' ? 'text-[#d34b4d]' : column.tone === 'yellow' ? 'text-[#b27b17]' : 'text-[#32815a]'}>{column.count}</strong>
            </button>
            {column.orders.length ? (
              <div className="mt-1.5 space-y-2.5">
                {column.orders.map((order) => (
                  <button
                    key={order.id}
                    type="button"
                    onClick={() => {
                      if (!order.orderId) return
                      setSelectedOrder({ orderId: order.orderId, id: order.id })
                    }}
                    className="block h-[74px] w-full rounded-[8px] border border-[#e5e8e5] bg-white px-2.5 py-2 text-left shadow-[0_1px_3px_rgba(20,40,28,.04)] hover:border-[#c9d4cc]"
                  >
                    <div className="flex items-center justify-between">
                      <strong className="text-[11px] font-medium leading-3 tracking-[.02em]">{order.id}</strong>
                      <span className={cn('flex items-center gap-3 text-[11px] font-medium leading-3', column.tone === 'red' ? 'text-[#d34b4d]' : column.tone === 'yellow' ? 'text-[#b27b17]' : 'text-[#32815a]')}>
                      ⏱
                        {order.timeLeft}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-[11px] font-medium leading-3 text-[#727c76]">{order.detail}</p>
                    {order.hasIncident ? (
                      <span className={cn('mt-1 inline-block rounded px-1.5 py-0.5 text-[11px] font-medium leading-3', column.tone === 'red' ? 'bg-[#fdecec] text-[#d44749]' : 'bg-[#fff4dc] text-[#b67f17]')}>Incident</span>
                    ) : null}
                  </button>
                ))}
              </div>
            ) : (
              <p className="mt-1.5 px-2 text-[11px] font-medium text-[#a0a7a2]">No orders</p>
            )}
          </section>
        ))}
      </div>

      {selectedOrder?.orderId ? (
        <AdminOrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
      ) : null}
      {selectedIncident ? (
        <AdminIncidentDetailModal
          incident={selectedIncident}
          onClose={() => {
            setSelectedIncident(null)
            if (mapFocus?.type === 'incident') clearMapFocus()
          }}
          onOpenOrder={(order) => {
            setSelectedIncident(null)
            setSelectedOrder(order)
          }}
        />
      ) : null}
    </div>
  )
}
