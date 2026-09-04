import { useEffect, useMemo, useState } from 'react'
import { ArrowUpRight, MessageCircle, RefreshCw, ShieldCheck, TriangleAlert } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { useApiResource } from '../../../hooks/useApiResource'
import { useAdminIncidents } from '../../../hooks/admin/useAdminIncidents'
import { useAdminChats } from '../../../hooks/admin/useAdminChats'
import { initialsFromPeerName } from '../../../mappers/admin/mapAdminChats'
import { resolveOrderConversationId } from '../../../lib/adminOrderChat'
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
  vendorsFromOrders,
  writeLiveOrderQuery,
} from '../../../lib/adminLiveOrderQuery'
import { ApiState } from '../ApiState'
import { Button } from '../Button'
import { cn } from '../cn'
import { AdminVendorFilterButton } from '../AdminVendorFilterButton'
import { AdminLiveOrderFilterBar } from './AdminLiveOrderFilterBar'
import { AdminAutoRefreshBadge } from './AdminAutoRefreshBadge'
import { AdminActiveChatPanels } from './AdminActiveChatPanels'
import { AdminOpenChats } from './AdminOpenChats'
import { AdminOpsOrderCard } from './AdminOpsOrderCard'
import { OpsIncidentsSidebar } from './OpsIncidentsSidebar'
import { AdminIncidentDetailModal } from './AdminIncidentDetailModal'
import {
  AdminOrderDetailModal,
  IncidentOrderModal,
} from '../../../pages/admin/operations/AdminLiveOrdersPage'

function ModeBoardFullView({
  column,
  boardTitle,
  fetchBoard,
  filter,
  chats,
  query,
  onQueryChange,
  onQueryClear,
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

  const rawOrders = bucketColumn?.orders || []
  const chatOrders = isOpsChatFilter(filter)
    ? rawOrders.filter((order) => orderMatchesOpsFilter(order, filter))
    : rawOrders
  const orders = applyLiveOrderQuery(chatOrders, query)
  const count = orders.length
  const filtersActive = liveOrderQueryIsActive(query)
  const visibleChats = buildOpsBoardChats(chats, rawOrders, filter)

  return (
    <div className="flex h-[calc(100vh-44px)] flex-col overflow-hidden px-[18px] pt-[15px]">
      <div className="flex shrink-0 items-start gap-3">
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

      <div className="relative z-30 mt-6 shrink-0 overflow-visible">
        <AdminLiveOrderFilterBar
          query={query}
          onChange={onQueryChange}
          onClear={onQueryClear}
          orders={chatOrders}
          showTypes={false}
          showIncidentPrioritySort={column.id === 'incident'}
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
        activeCount={visibleChats.length}
        unreadCount={visibleChats.reduce((sum, chat) => sum + (Number(chat.unreadCount) || 0), 0)}
        onChatClick={onChatClick}
        groupByRole={isOpsChatFilter(filter)}
      />
    </div>
  )
}

/**
 * Shared Incident / On Track board for Pickup, Dine-in, Services.
 * Live Orders parity: vendor/search/champ filters, clickable incident log, pinned chats.
 */
export function AdminIncidentBoard({
  boardTitle = 'Board',
  fetchBoard,
  data: controlledData,
  error: controlledError,
  isLoading: controlledLoading,
  onRetry,
}) {
  const [searchParams, setSearchParams] = useSearchParams()
  const [filter, setFilter] = useState('All orders')
  const [activeChats, setActiveChats] = useState([])
  const [fullView, setFullView] = useState(null)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [incidentOrder, setIncidentOrder] = useState(null)
  const [selectedIncident, setSelectedIncident] = useState(null)
  const boardQuery = useMemo(() => parseLiveOrderQuery(searchParams), [searchParams])

  function patchBoardQuery(nextQuery) {
    setSearchParams((prev) => writeLiveOrderQuery(prev, nextQuery), { replace: true })
  }

  function clearBoardQuery() {
    patchBoardQuery(EMPTY_LIVE_ORDER_QUERY)
  }

  const useFetchBoard = typeof fetchBoard === 'function'
  const fetched = useApiResource(
    () => (useFetchBoard ? fetchBoard({ limit: ADMIN_BOARD_FULL_LIMIT }) : Promise.resolve({ data: null })),
    [useFetchBoard, fetchBoard],
  )

  const { data: incidentsData } = useAdminIncidents()
  const data = useFetchBoard ? fetched.data : controlledData
  const error = useFetchBoard ? fetched.error : controlledError
  const isLoading = useFetchBoard ? fetched.isLoading : controlledLoading
  const refetch = useFetchBoard ? fetched.refetch : onRetry
  const { data: chatsData, setData: setChatsData, refetch: refetchChats } = useAdminChats({
    refreshSeconds: data?.refreshIntervalSeconds,
  })

  useEffect(() => {
    setFullView(null)
    setSelectedOrder(null)
    setIncidentOrder(null)
    setSelectedIncident(null)
    setActiveChats([])
    setFilter('All orders')
  }, [boardTitle])

  const refreshSeconds = Number(data?.refreshIntervalSeconds) || 0

  useEffect(() => {
    if (!refreshSeconds || refreshSeconds < 1 || typeof refetch !== 'function') return undefined
    const intervalId = window.setInterval(() => {
      refetch()
    }, refreshSeconds * 1000)
    return () => window.clearInterval(intervalId)
  }, [refreshSeconds, refetch])

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
  const chatsUnread = chatsData?.unreadTotal
    ?? chats.reduce((sum, chat) => sum + (Number(chat.unreadCount) || 0), 0)

  const filters = useMemo(() => {
    const fromData = Array.isArray(data?.filters) ? data.filters : []
    return fromData.length > 0 ? fromData : ADMIN_OPS_BOARD_FILTERS
  }, [data?.filters])

  const rawColumns = Array.isArray(data?.columns) ? data.columns : []
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
  const visibleChatsUnread = isOpsChatFilter(filter)
    ? visibleChats.reduce((sum, chat) => sum + (Number(chat.unreadCount) || 0), 0)
    : chatsUnread
  const filtersActive = liveOrderQueryIsActive(boardQuery)
  const filteredOrderCount = columns.reduce((sum, column) => sum + (Number(column.count) || 0), 0)
  const headerOrderCount = (isOpsChatFilter(filter) || filtersActive)
    ? filteredOrderCount
    : (data?.activeCount ?? '—')

  const refreshKey = useMemo(() => {
    if (!data) return '0'
    return `${data.activeCount}-${columns.map((column) => column.count).join('-')}-${isLoading ? '1' : '0'}`
  }, [data, columns, isLoading])

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

  function openChatPanel(chat) {
    if (!chat?.conversationId) return
    setActiveChats((prev) => {
      const without = prev.filter((item) => item.conversationId !== chat.conversationId)
      return [...without, chat].slice(-2)
    })
  }

  function closeChatPanel(conversationId) {
    setActiveChats((prev) => prev.filter((item) => item.conversationId !== conversationId))
  }

  function openOrderChat(order, preferredRole) {
    const role = preferredRole || order.contactType || 'Customer'
    const conversationId = resolveOrderConversationId(order, role)
    if (!conversationId) return

    const name =
      role === 'Champ'
        ? order.rider?.name || order.champ?.name || 'Champ'
        : 'Customer'

    const matchingChat = chats.find((chat) => chat.conversationId === conversationId)

    openChatPanel({
      ...(matchingChat || {}),
      id: conversationId,
      conversationId,
      orderId: order.orderId || matchingChat?.orderId || null,
      orderNumber: order.id || matchingChat?.orderNumber || null,
      role,
      channel: role === 'Champ' ? 'driver' : 'customer',
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
        <IncidentOrderModal
          order={incidentOrder}
          onClose={() => setIncidentOrder(null)}
          onOpenChat={(conversationId) => {
            openChatPanel({
              id: conversationId,
              conversationId,
              name: 'Customer',
              role: 'Customer',
              channel: 'customer',
              peerRole: 'CUSTOMER',
            })
          }}
        />
      ) : null}
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
      <AdminActiveChatPanels
        chats={activeChats}
        onClose={closeChatPanel}
        onMarkedRead={handleChatMarkedRead}
      />
    </>
  )

  if (fullView && useFetchBoard) {
    return (
      <>
        <ModeBoardFullView
          column={fullView}
          boardTitle={boardTitle}
          fetchBoard={fetchBoard}
          filter={filter}
          chats={chats}
          query={boardQuery}
          onQueryChange={patchBoardQuery}
          onQueryClear={clearBoardQuery}
          onBack={() => setFullView(null)}
          onChatClick={openChatPanel}
          onIncidentClick={setIncidentOrder}
          onContactClick={openOrderChat}
          onOrderClick={setSelectedOrder}
        />
        {modals}
      </>
    )
  }

  if (!data) return <ApiState isLoading={isLoading} error={error} onRetry={refetch} />

  return (
    <div className="flex h-[calc(100vh-44px)] flex-col overflow-hidden px-[18px] pt-[15px]">
      <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_292px] gap-3 max-[1050px]:grid-cols-1">
        <div className="flex min-h-0 min-w-0 flex-col">
          <div className="relative z-30 shrink-0 overflow-visible">
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-[14px] font-bold text-[#17231c]">
                  {headerOrderCount} {data.activeLabel}
                </h2>
                <AdminAutoRefreshBadge
                  intervalSeconds={data.refreshIntervalSeconds}
                  resetKey={refreshKey}
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <AdminVendorFilterButton
                  selectedIds={boardQuery.vendorIds || []}
                  onChange={(vendorIds) => patchBoardQuery({ ...boardQuery, vendorIds })}
                  extraVendors={vendorsFromOrders(boardOrders)}
                />
                <Button className="h-[31px] px-4" onClick={refetch} disabled={isLoading}>
                  <RefreshCw size={11} /> Refresh
                </Button>
              </div>
            </div>

            <div className="mb-3 mt-3 flex flex-wrap items-center gap-2 text-[10px] text-[#59655e]">
              <span className="font-medium">Filter:</span>
              {filters.map((item) => {
                const active = filter === item
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setFilter(item)}
                    aria-pressed={active}
                    className={cn(
                      'inline-flex h-[26px] items-center gap-1 rounded-full border px-3 font-medium transition',
                      active
                        ? 'border-[#15904a] bg-white text-[#14763f]'
                        : 'border-[#d9dfdb] bg-white text-[#657068] hover:border-[#c5cdc7]',
                    )}
                  >
                    {item !== 'All orders' ? (
                      <MessageCircle size={11} className="shrink-0 opacity-80" aria-hidden />
                    ) : null}
                    {item}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="grid min-h-0 flex-1 grid-cols-2 gap-3 max-[700px]:grid-cols-1">
            {columns.map((column) => (
              <section key={column.id} className="flex min-h-0 flex-col overflow-hidden rounded-[10px] bg-[#f1f4f1] p-2.5">
                <div className="mb-2 flex h-[22px] shrink-0 items-center gap-2">
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
                <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto pr-0.5">
                  {(column.orders || []).length === 0 ? (
                    <div className="rounded-[12px] border border-dashed border-[#dfe4e0] bg-white px-3 py-8 text-center text-[11px] text-[#78837c]">
                      <p>{filtersActive ? 'No orders match' : isOpsChatFilter(filter) ? 'No matching chat orders' : 'No orders'}</p>
                      {filtersActive ? (
                        <button
                          type="button"
                          onClick={clearBoardQuery}
                          className="mt-1 text-[10px] font-medium text-[#16854a] hover:underline"
                        >
                          Clear all
                        </button>
                      ) : null}
                    </div>
                  ) : (
                    (column.orders || []).map((order) => (
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
        unreadCount={visibleChatsUnread}
        onChatClick={openChatPanel}
        groupByRole={isOpsChatFilter(filter)}
      />
      {modals}
    </div>
  )
}
