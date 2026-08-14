import { ApiError } from '../../api/errors'

const AVATAR_PALETTE = [
  { bg: '#d8f0e0', text: '#147940' },
  { bg: '#dce8f8', text: '#2b66a5' },
  { bg: '#cfe6d6', text: '#0f5c35' },
  { bg: '#e8ebe9', text: '#455249' },
  { bg: '#f1eafe', text: '#7752a8' },
  { bg: '#fff0d6', text: '#9a6510' },
]

function formatMoney(value) {
  if (value == null || value === '') return '—'
  const num = Number(value)
  if (!Number.isFinite(num)) return String(value)
  const formatted = Number.isInteger(num)
    ? num.toLocaleString('en-US')
    : num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 3 })
  return `BHD ${formatted}`
}

function formatJoinedDate(value) {
  if (value == null || value === '') return '—'
  if (typeof value === 'object' && !(value instanceof Date)) {
    return formatJoinedDate(
      value.placedAt || value.createdAt || value.date || value.orderedAt || null,
    )
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function formatLastOrder(value) {
  if (value == null || value === '') return '—'
  if (typeof value === 'object' && !(value instanceof Date)) {
    const dateLabel = formatJoinedDate(value)
    const orderNumber = value.orderNumber ? String(value.orderNumber).trim() : ''
    if (dateLabel !== '—' && orderNumber) return `${dateLabel} · ${orderNumber}`
    if (dateLabel !== '—') return dateLabel
    if (orderNumber) return orderNumber
    return '—'
  }
  return formatJoinedDate(value)
}

function formatGender(value) {
  if (value == null || value === '') return '—'
  const raw = String(value).trim()
  if (!raw) return '—'
  const upper = raw.toUpperCase()
  if (upper === 'FEMALE') return 'Female'
  if (upper === 'MALE') return 'Male'
  return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase()
}

function initialsFromName(name) {
  const cleaned = String(name || '')
    .replace(/[—–-]/g, ' ')
    .trim()
  if (!cleaned || cleaned === '—') return '?'
  const parts = cleaned.split(/\s+/).filter(Boolean)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase()
}

function avatarColors(seed) {
  const str = String(seed || '')
  let hash = 0
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0
  }
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length]
}

function displayName(name) {
  const raw = String(name || '').trim()
  if (!raw || raw === '—') return '—'
  return raw
}

/**
 * Map GET /admin/customers/summary → KPI cards.
 */
export function mapAdminCustomersSummary(data) {
  if (!data || typeof data !== 'object') {
    throw new ApiError({ message: 'Invalid customers summary from the server.' })
  }

  return [
    {
      label: 'Total customers',
      value: Number(data.totalCustomers || 0).toLocaleString('en-US'),
      tone: 'ink',
    },
    {
      label: 'Active (30d)',
      value: Number(data.activeLast30d || 0).toLocaleString('en-US'),
      tone: 'green',
    },
    {
      label: 'New (30d)',
      value: Number(data.newLast30d || 0).toLocaleString('en-US'),
      tone: 'green',
    },
    {
      label: 'Refunded amount',
      value: formatMoney(data.refundedAmount),
      tone: 'ink',
    },
    {
      label: 'Wallet balance',
      value: formatMoney(data.walletBalance),
      tone: 'ink',
    },
    {
      label: 'Suspended',
      value: Number(data.suspendedCount || 0).toLocaleString('en-US'),
      tone: 'red',
    },
  ]
}

function mapCustomerRow(item) {
  const id = String(item.id)
  const name = displayName(item.name)
  const colors = avatarColors(id)
  return {
    id,
    name,
    initials: initialsFromName(name),
    avatarBg: colors.bg,
    avatarText: colors.text,
    contact: item.phone ? String(item.phone) : '—',
    email: item.email ? String(item.email) : '—',
    gender: formatGender(item.gender),
    age: item.age == null || item.age === '' ? '—' : Number(item.age),
    orders: Number(item.ordersCount) || 0,
    spent: formatMoney(item.spent),
    wallet: formatMoney(item.wallet),
    refund: Number(item.refundCount) || 0,
    refundAmount: formatMoney(item.refundAmount),
    joined: formatJoinedDate(item.joinedAt),
    status: item.status ? String(item.status) : '—',
  }
}

/**
 * Map GET /admin/customers (+ summary) → Customers list page model.
 */
export function mapAdminCustomersListPage(listData, summaryData = null) {
  if (!listData || typeof listData !== 'object') {
    throw new ApiError({ message: 'Invalid customers list from the server.' })
  }

  const raw = Array.isArray(listData.customers) ? listData.customers : []
  const rows = raw.filter((item) => item && item.id).map(mapCustomerRow)

  return {
    title: 'Customers',
    subtitle: 'All app customers — profiles, orders, wallet, segments & support',
    action: 'Create segment',
    tabs: ['All', 'Active', 'New', 'Suspended'],
    columns: [
      'Customer',
      'Contact',
      'Email',
      'Gender',
      'Age',
      'Orders',
      'Spent',
      'Wallet',
      'Refund',
      'Refund amount',
      'Joined',
      'Status',
    ],
    stats: summaryData
      ? mapAdminCustomersSummary(summaryData)
      : [
          {
            label: 'Total customers',
            value: String(Number(listData.total) || rows.length),
            tone: 'ink',
          },
          { label: 'Active (30d)', value: '—', tone: 'green' },
          { label: 'New (30d)', value: '—', tone: 'green' },
          { label: 'Refunded amount', value: '—', tone: 'ink' },
          { label: 'Wallet balance', value: '—', tone: 'ink' },
          { label: 'Suspended', value: '—', tone: 'red' },
        ],
    page: Number(listData.page) || 1,
    limit: Number(listData.limit) || rows.length,
    total: Number(listData.total) || rows.length,
    rows,
  }
}

/**
 * Map GET /admin/customers/:id → customer detail overview model.
 * Wallet/support tabs stay empty until those endpoints are wired.
 */
export function mapAdminCustomerDetail(data) {
  if (!data || typeof data !== 'object') {
    throw new ApiError({ message: 'Invalid customer detail from the server.' })
  }

  const profile = data.profile && typeof data.profile === 'object' ? data.profile : {}
  const kpis = data.kpis && typeof data.kpis === 'object' ? data.kpis : {}
  const controls = data.controls && typeof data.controls === 'object' ? data.controls : {}

  const id = String(profile.id || '')
  if (!id) {
    throw new ApiError({ message: 'Invalid customer detail from the server.' })
  }

  const name = displayName(profile.name || `${profile.firstName || ''} ${profile.lastName || ''}`.trim())
  const colors = avatarColors(id)
  const status = profile.status ? String(profile.status) : '—'
  const joined = formatJoinedDate(profile.joinedAt)
  const joinedYear = (() => {
    const date = profile.joinedAt ? new Date(profile.joinedAt) : null
    return date && !Number.isNaN(date.getTime()) ? String(date.getFullYear()) : '—'
  })()
  const lastOrder = formatLastOrder(profile.lastOrder)
  const accountActive =
    controls.accountActive === true ||
    (controls.accountActive !== false && status !== 'Suspended')

  const devices = Array.isArray(controls.devices)
    ? controls.devices.length
      ? `${controls.devices.length}`
      : '0'
    : '—'
  const paymentMethods = Array.isArray(controls.paymentMethods)
    ? controls.paymentMethods.length
      ? `${controls.paymentMethods.length}`
      : '0'
    : '—'

  return {
    id,
    name,
    initials: initialsFromName(name),
    avatarBg: colors.bg,
    avatarText: colors.text,
    status,
    phone: profile.phone ? String(profile.phone) : '—',
    email: profile.email ? String(profile.email) : '—',
    gender: formatGender(profile.gender),
    age: profile.age == null || profile.age === '' ? '—' : Number(profile.age),
    lastOrder,
    joined,
    joinedYear,
    accountActive,
    accountActiveHint: 'Can order & log in',
    devices,
    paymentMethods,
    metrics: [
      { label: 'Lifetime orders', value: String(Number(kpis.lifetimeOrders) || 0) },
      { label: 'Lifetime spend', value: formatMoney(kpis.lifetimeSpend) },
      { label: 'Refund', value: String(Number(kpis.refundCount) || 0) },
      { label: 'Refunded amount', value: formatMoney(kpis.refundAmount) },
      {
        label: 'Wallet balance',
        value: formatMoney(kpis.walletBalance),
        tone: 'green',
      },
      {
        label: 'Avg rating given',
        value: kpis.avgRatingGiven == null ? '—' : String(kpis.avgRatingGiven),
        star: kpis.avgRatingGiven != null,
      },
      {
        label: 'Cancellations',
        value: String(Number(kpis.cancellations) || 0),
        tone: Number(kpis.cancellations) > 0 ? 'orange' : 'ink',
      },
    ],
    tabs: ['Overview', 'Wallet & cashback', 'Support', 'SLA'],
    profile: [
      ['Full name', name],
      ['Phone', profile.phone ? String(profile.phone) : '—'],
      ['Email', profile.email ? String(profile.email) : '—'],
      ['Gender', formatGender(profile.gender)],
      ['Age', profile.age == null || profile.age === '' ? '—' : String(profile.age)],
      ['Last order', lastOrder],
      ['Joined', joined],
    ],
    // Wallet & Support tabs load from dedicated endpoints (see mapAdminCustomerWallet / Support).
    wallet: null,
    support: null,
    raw: {
      profile,
      kpis,
      controls,
      suspension: data.suspension || null,
      user: data.user || null,
    },
  }
}

function formatSignedMoney(value) {
  if (value == null || value === '') return '—'
  const num = Number(value)
  if (!Number.isFinite(num)) return String(value)
  const abs = Math.abs(num)
  const formatted = Number.isInteger(abs)
    ? abs.toLocaleString('en-US')
    : abs.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 3 })
  if (num > 0) return `+${formatted}`
  if (num < 0) return `-${formatted}`
  return formatted
}

function formatBalanceNumber(value) {
  if (value == null || value === '') return '—'
  const num = Number(value)
  if (!Number.isFinite(num)) return String(value)
  return Number.isInteger(num)
    ? num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 3 })
    : num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 3 })
}

function formatShortTxnDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function formatTicketDate(value) {
  return formatJoinedDate(value)
}

function formatTicketTime(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })
}

function formatRelativeUpdated(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  const diffMs = Date.now() - date.getTime()
  if (diffMs < 0) return formatJoinedDate(value)
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function formatTxnType(value) {
  if (value == null || value === '') return '—'
  const raw = String(value).trim()
  if (!raw) return '—'
  const upper = raw.toUpperCase()
  if (upper === 'REFUND') return 'Refund'
  if (upper === 'CASHBACK') return 'Cashback'
  if (upper === 'SPEND' || upper === 'DEBIT') return 'Spend'
  if (upper === 'WITHDRAW' || upper === 'WITHDRAWAL') return 'Withdraw'
  return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase()
}

function formatTicketStatus(value) {
  if (value == null || value === '') return '—'
  const raw = String(value).trim()
  if (!raw) return '—'
  const upper = raw.toUpperCase()
  if (upper === 'OPEN') return 'Open'
  if (upper === 'RESOLVED') return 'Resolved'
  if (upper === 'CLOSED') return 'Closed'
  if (upper === 'PENDING') return 'Pending'
  return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase()
}

function formatTicketCode(value) {
  if (value == null || value === '') return '—'
  const raw = String(value).trim()
  if (!raw) return '—'
  return raw.startsWith('#') ? raw : `#${raw}`
}

/**
 * Map a wallet ledger row. Item field names are flexible until a non-empty sample is confirmed.
 */
function mapWalletTransaction(item, index = 0) {
  if (!item || typeof item !== 'object') return null
  const created = item.createdAt || item.date || item.at || item.timestamp || null
  return {
    id: item.id != null ? String(item.id) : `txn-${index}`,
    type: formatTxnType(item.type || item.entryType || item.kind || item.ledgerType),
    description: item.description || item.note || item.remark || item.title || '—',
    amount: formatSignedMoney(item.amount ?? item.value ?? item.delta),
    balance: formatBalanceNumber(item.balance ?? item.balanceAfter ?? item.runningBalance),
    date: formatShortTxnDate(created),
  }
}

/**
 * Map GET /admin/customers/:id/wallet → Wallet & cashback tab.
 *
 * Confirmed shape:
 *   summary.{refundBalance,cashbackBalance,cashbackEarned,cashbackPending,cashbackWithdrawn,…}
 *   refund.{balance,transactions[]}
 *   cashback.{balance,earned,pending,withdrawn,transactions[]}
 */
export function mapAdminCustomerWallet(data) {
  if (!data || typeof data !== 'object') {
    throw new ApiError({ message: 'Invalid customer wallet from the server.' })
  }

  const summary = data.summary && typeof data.summary === 'object' ? data.summary : {}
  const refund = data.refund && typeof data.refund === 'object' ? data.refund : {}
  const cashback = data.cashback && typeof data.cashback === 'object' ? data.cashback : {}

  const refundBalance =
    refund.balance != null ? refund.balance : summary.refundBalance
  const cashbackBalance =
    cashback.balance != null ? cashback.balance : summary.cashbackBalance
  const earned =
    cashback.earned != null ? cashback.earned : summary.cashbackEarned
  const pending =
    cashback.pending != null ? cashback.pending : summary.cashbackPending
  const withdrawn =
    cashback.withdrawn != null ? cashback.withdrawn : summary.cashbackWithdrawn

  const refundTx = Array.isArray(refund.transactions) ? refund.transactions : []
  const cashbackTx = Array.isArray(cashback.transactions) ? cashback.transactions : []

  return {
    refundBalance: formatMoney(refundBalance),
    refundTransactions: refundTx.map(mapWalletTransaction).filter(Boolean),
    cashbackBalance: formatMoney(cashbackBalance),
    earnedLifetime: formatMoney(earned),
    pending: formatMoney(pending),
    withdrawn: formatMoney(withdrawn),
    cashbackTransactions: cashbackTx.map(mapWalletTransaction).filter(Boolean),
    page: Number(refund.page || cashback.page) || 1,
    limit: Number(refund.limit || cashback.limit) || 20,
    total:
      (Number(refund.total) || 0) + (Number(cashback.total) || 0),
    raw: { summary, refund, cashback },
  }
}

/**
 * Map a support ticket row. Column fields inferred from UI + create/update bodies;
 * empty `tickets: []` is the only confirmed list payload so far.
 */
function mapSupportTicket(item, index = 0) {
  if (!item || typeof item !== 'object') return null

  const created = item.createdAt || item.openedAt || item.date || null
  const updated = item.updatedAt || item.resolvedAt || created
  const code =
    item.ticketNumber ||
    item.ticketCode ||
    item.code ||
    item.number ||
    item.ticket ||
    item.id

  const orderRaw = item.orderId || item.orderNumber || item.order || null
  let order = '—'
  if (orderRaw != null && String(orderRaw).trim()) {
    const s = String(orderRaw).trim()
    order = s.startsWith('#') ? s : `#${s}`
  }

  return {
    id: item.id != null ? String(item.id) : `ticket-${index}`,
    ticket: formatTicketCode(code),
    subject: item.subject ? String(item.subject) : '—',
    order,
    status: formatTicketStatus(item.status),
    date: formatTicketDate(created),
    time: formatTicketTime(created),
    updated: formatRelativeUpdated(updated),
    remark:
      item.remark ||
      item.resolutionNote ||
      item.resolution ||
      item.note ||
      '—',
  }
}

/**
 * Map GET /admin/customers/:id/support → Support tab.
 */
export function mapAdminCustomerSupport(data) {
  if (!data || typeof data !== 'object') {
    throw new ApiError({ message: 'Invalid customer support tickets from the server.' })
  }

  const raw = Array.isArray(data.tickets) ? data.tickets : []

  return {
    subtitle: 'Tickets, order issues and resolutions for this customer.',
    tickets: raw.map(mapSupportTicket).filter(Boolean),
    page: Number(data.page) || 1,
    limit: Number(data.limit) || 20,
    total: Number(data.total) || raw.length,
  }
}

/** Map UI status tab → API statusTab query. */
export function mapAdminCustomersStatusTab(tab) {
  const normalized = String(tab || 'All').trim().toLowerCase()
  if (normalized === 'active') return 'active'
  if (normalized === 'new') return 'new'
  if (normalized === 'suspended') return 'suspended'
  return 'all'
}

/** UI duration label → API `duration` (Postman: until_reviewed). */
export function mapCustomerSuspendDurationToApi(duration) {
  const raw = String(duration || '').trim().toLowerCase()
  if (!raw) return 'until_reviewed'
  if (raw === 'until reviewed' || raw === 'until_reviewed') return 'until_reviewed'
  if (raw === '7 days' || raw === '7_days' || raw === '7d') return '7_days'
  if (raw === '30 days' || raw === '30_days' || raw === '30d') return '30_days'
  if (raw === 'permanent') return 'permanent'
  return raw.replace(/\s+/g, '_')
}

/**
 * Map Suspend customer modal → POST /admin/customers/:id/suspend body.
 * Confirmed: { reason, duration, notifyCustomer }
 */
export function mapAdminCustomerSuspendRequest(form = {}) {
  const reason = String(form.reason || '').trim()
  if (!reason) {
    throw new ApiError({ message: 'Suspension reason is required.' })
  }

  return {
    reason,
    duration: mapCustomerSuspendDurationToApi(form.duration),
    notifyCustomer: form.notifyCustomer === true || form.notify === true,
  }
}
