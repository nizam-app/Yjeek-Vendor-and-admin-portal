import { useEffect, useState } from 'react'
import { ArrowUpRight, RefreshCw, Search, ShieldCheck, TriangleAlert } from 'lucide-react'
import { useApiResource } from '../../../hooks/useApiResource'
import { useAdminIncidents } from '../../../hooks/admin/useAdminIncidents'
import { useAdminChats } from '../../../hooks/admin/useAdminChats'
import { initialsFromPeerName } from '../../../mappers/admin/mapAdminChats'
import {
  ADMIN_BOARD_FULL_LIMIT,
  ADMIN_BOARD_PREVIEW_LIMIT,
} from '../../../lib/adminBoardLimits'
import { ApiState } from '../ApiState'
import { Button } from '../Button'
import { cn } from '../cn'
import { AdminChatPanel } from './AdminChatPanel'
import { AdminOpenChats } from './AdminOpenChats'
import { AdminOpsOrderCard } from './AdminOpsOrderCard'
import { OpsIncidentsSidebar } from './OpsIncidentsSidebar'
import {
  AdminOrderDetailModal,
  IncidentOrderModal,
} from '../../../pages/admin/operations/AdminLiveOrdersPage'

function ModeBoardFullView({
  column,
  boardTitle,
  fetchBoard,
  chats,
  chatsActive,
  onBack,
  onChatClick,
  onIncidentClick,
  onContactClick,
  onOrderClick,
}) {
  const { data, error, isLoading, refetch } = useApiResource(
    () => fetchBoard({ limit: ADMIN_BOARD_FULL_LIMIT }),
    [fetchBoard, column?.id],
  )

  const bucketColumn =
    data?.columns?.find((item) => item.id === column.id) ||
    data?.columns?.find((item) => item.tone === column.tone)

  const orders = bucketColumn?.orders || []
  const count = bucketColumn?.count ?? orders.length

  return (
    <div className="flex min-h-[calc(100vh-44px)] flex-col px-[18px] pb-0 pt-[15px]">
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={onBack}
          className="h-[27px] rounded-full border border-[#dfe4e0] bg-white px-3 text-[10px] font-medium text-[#536158]"
        >
          ‹ {boardTitle}
        </button>
        <div>
          <h2 className="flex items-center gap-1.5 text-[18px] font-bold text-[#17231c]">
            <span>{column.tone === 'red' ? '⚠' : '🛡'}</span>
            {column.title} — full view
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
          <input
            className="min-w-0 flex-1 border-0 bg-transparent text-[10px] outline-none"
            placeholder="Search order, vendor, champ..."
          />
        </label>
        <button
          type="button"
          className="ml-auto h-[31px] rounded-full border border-[#dfe4e0] bg-white px-3 text-[10px] text-[#59655e]"
        >
          Sort · <b>Time left</b>▾
        </button>
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

      <AdminOpenChats chats={chats} activeCount={chatsActive} onChatClick={onChatClick} />
    </div>
  )
}

/**
 * Shared Incident / On Track board for Pickup, Dine-in, Services.
 * Live Orders parity: max 10 preview, ↗ full view, Incident / Champ / Customer / detail.
 */
export function AdminIncidentBoard({
  boardTitle = 'Board',
  fetchBoard,
  data: controlledData,
  error: controlledError,
  isLoading: controlledLoading,
  onRetry,
  previewLimit = ADMIN_BOARD_PREVIEW_LIMIT,
}) {
  const [filter, setFilter] = useState('All orders')
  const [activeChat, setActiveChat] = useState(null)
  const [fullView, setFullView] = useState(null)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [incidentOrder, setIncidentOrder] = useState(null)

  const useFetchBoard = typeof fetchBoard === 'function'
  const fetched = useApiResource(
    () => (useFetchBoard ? fetchBoard({ limit: previewLimit }) : Promise.resolve({ data: null })),
    [useFetchBoard, fetchBoard, previewLimit],
  )

  const { data: incidentsData } = useAdminIncidents()
  const { data: chatsData, setData: setChatsData, refetch: refetchChats } = useAdminChats()

  const data = useFetchBoard ? fetched.data : controlledData
  const error = useFetchBoard ? fetched.error : controlledError
  const isLoading = useFetchBoard ? fetched.isLoading : controlledLoading
  const refetch = useFetchBoard ? fetched.refetch : onRetry

  useEffect(() => {
    setFullView(null)
    setSelectedOrder(null)
    setIncidentOrder(null)
    setActiveChat(null)
  }, [boardTitle])

  const feedIncidents = Array.isArray(incidentsData?.items) ? incidentsData.items : []
  const incidents = feedIncidents.length > 0
    ? feedIncidents
    : (Array.isArray(data?.incidents) ? data.incidents : [])
  const feedChats = Array.isArray(chatsData?.items) ? chatsData.items : []
  const chats = feedChats.length > 0
    ? feedChats
    : (Array.isArray(data?.chats) ? data.chats : [])
  const chatsActive = feedChats.length > 0
    ? (chatsData?.active ?? feedChats.length)
    : chats.length

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

  function openOrderChat(order, preferredRole) {
    const conversationId = order?.conversationId
    if (!conversationId) return

    const role = preferredRole || order.contactType || 'Customer'
    const name =
      role === 'Champ'
        ? order.rider?.name || order.champ?.name || 'Champ'
        : 'Customer'

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

  const modals = (
    <>
      {selectedOrder ? (
        <AdminOrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
      ) : null}
      {incidentOrder ? (
        <IncidentOrderModal order={incidentOrder} onClose={() => setIncidentOrder(null)} />
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

  if (fullView && useFetchBoard) {
    return (
      <>
        <ModeBoardFullView
          column={fullView}
          boardTitle={boardTitle}
          fetchBoard={fetchBoard}
          chats={chats}
          chatsActive={chatsActive}
          onBack={() => setFullView(null)}
          onChatClick={setActiveChat}
          onIncidentClick={setIncidentOrder}
          onContactClick={openOrderChat}
          onOrderClick={setSelectedOrder}
        />
        {modals}
      </>
    )
  }

  if (!data) return <ApiState isLoading={isLoading} error={error} onRetry={refetch} />

  const filters = Array.isArray(data.filters) ? data.filters : []
  const columns = Array.isArray(data.columns) ? data.columns : []

  return (
    <div className="flex min-h-[calc(100vh-44px)] flex-col px-[18px] pb-0 pt-[15px]">
      <div className="grid flex-1 grid-cols-[minmax(0,1fr)_292px] gap-3 max-[1050px]:grid-cols-1">
        <div className="min-w-0">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-[14px] font-bold text-[#17231c]">
                {data.activeCount} {data.activeLabel}
              </h2>
              {data.refreshIntervalSeconds ? (
                <span className="rounded-full bg-[#e4f5e9] px-2.5 py-1 text-[10px] font-medium text-[#188248]">
                  ● auto-refresh {data.refreshIntervalSeconds}s
                </span>
              ) : null}
            </div>
            <div className="flex gap-2">
              <Button className="h-[31px] px-3">All vendors ▾</Button>
              <Button className="h-[31px] px-4" onClick={refetch} disabled={isLoading}>
                <RefreshCw size={11} /> Refresh
              </Button>
            </div>
          </div>

          {filters.length > 0 ? (
            <div className="mb-3 mt-3 flex flex-wrap items-center gap-2 text-[10px] text-[#59655e]">
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
          ) : (
            <div className="mb-3 mt-3" />
          )}

          <div className="grid grid-cols-2 gap-3 max-[700px]:grid-cols-1">
            {columns.map((column) => {
              const previewOrders = (column.orders || []).slice(0, previewLimit)
              return (
                <section key={column.id} className="min-h-[416px] rounded-[10px] bg-[#f1f4f1] p-2.5">
                  <div className="mb-2 flex h-[22px] items-center gap-2">
                    <span className={cn(
                      'inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium',
                      column.tone === 'red' ? 'bg-[#fff0ed] text-[#d33f44]' : 'bg-[#e7f5eb] text-[#247c4b]',
                    )}>
                      {column.tone === 'red' ? <TriangleAlert size={12} /> : <ShieldCheck size={12} />}
                      {column.title}
                    </span>
                    <strong className={cn('text-[12px]', column.tone === 'red' ? 'text-[#d33f44]' : 'text-[#247c4b]')}>{column.count}</strong>
                    <button
                      type="button"
                      onClick={() => useFetchBoard && setFullView(column)}
                      className="ml-auto grid h-[22px] w-[22px] place-items-center rounded-md border border-[#dfe4e0] bg-white text-[#748078] hover:text-[#118446]"
                      aria-label={`Open ${column.title} full view`}
                    >
                      <ArrowUpRight size={12} />
                    </button>
                  </div>
                  <div className="space-y-2.5">
                    {previewOrders.length === 0 ? (
                      <div className="rounded-[12px] border border-dashed border-[#dfe4e0] bg-white px-3 py-8 text-center text-[11px] text-[#78837c]">
                        No orders
                      </div>
                    ) : (
                      previewOrders.map((order) => (
                        <AdminOpsOrderCard
                          key={order.orderId || order.id}
                          order={order}
                          tone={column.tone}
                          onIncidentClick={setIncidentOrder}
                          onContactClick={openOrderChat}
                          onOrderClick={setSelectedOrder}
                        />
                      ))
                    )}
                    {column.count > previewLimit && useFetchBoard ? (
                      <button
                        type="button"
                        onClick={() => setFullView(column)}
                        className="w-full rounded-[9px] border border-dashed border-[#cfd7d1] bg-white px-2 py-2 text-[10px] font-medium text-[#3d7a55] hover:border-[#1a9b53] hover:text-[#14763f]"
                      >
                        View all {column.count} {column.title.toLowerCase()} orders ↗
                      </button>
                    ) : null}
                  </div>
                </section>
              )
            })}
          </div>
        </div>

        <OpsIncidentsSidebar incidents={incidents} />
      </div>

      <AdminOpenChats chats={chats} activeCount={chatsActive} onChatClick={setActiveChat} />
      {modals}
    </div>
  )
}
