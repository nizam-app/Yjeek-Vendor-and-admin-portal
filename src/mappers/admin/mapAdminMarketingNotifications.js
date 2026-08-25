import { ApiError } from '../../api/errors'

const NOTIFICATION_CHANNELS = [
  {
    id: 'customers',
    title: 'Customer notifications',
    description: 'Send announcements, offers & order updates to customers.',
  },
  {
    id: 'vendors',
    title: 'Vendor notifications',
    description: 'Notify vendors about policy, payouts & performance.',
  },
]

function formatCount(value) {
  if (value == null || value === '') return '—'
  const num = Number(value)
  if (!Number.isFinite(num)) return String(value)
  return num.toLocaleString('en-US')
}

function formatDateTime(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  const day = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
  const time = date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  return `${day} ${time}`
}

function formatFullDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function formatTime(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

function displayStatus(status, statusKey) {
  const key = String(statusKey || '').toLowerCase()
  if (key === 'delivered') return 'Sent'
  if (status) return String(status)
  if (key === 'scheduled') return 'Scheduled'
  if (key === 'failed') return 'Failed'
  return '—'
}

function channelIcon(channelKey, channelLabel) {
  const key = String(channelKey || channelLabel || '').toUpperCase()
  if (key.includes('EMAIL') || key.includes('MAIL')) return 'mail'
  return 'phone'
}

function recipientsWord(targetKey, target) {
  const key = String(targetKey || target || '').toLowerCase()
  if (key === 'vendor' || key === 'vendors') return 'vendors'
  return 'customers'
}

function mapNotificationRow(item) {
  const id = String(item.id)
  const when = item.date || item.sentAt || item.scheduledAt || null
  return {
    id,
    target: item.target ? String(item.target) : '—',
    title: item.title ? String(item.title) : '—',
    channel: item.channelLabel ? String(item.channelLabel) : '—',
    sentAt: formatDateTime(when),
    status: displayStatus(item.status, item.statusKey),
    statusKey: item.statusKey ? String(item.statusKey) : '',
  }
}

/**
 * Map GET /admin/marketing/notifications → Notifications tab model.
 */
export function mapAdminMarketingNotificationsPage(listData) {
  if (!listData || typeof listData !== 'object') {
    throw new ApiError({ message: 'Invalid marketing notifications list from the server.' })
  }

  const raw = Array.isArray(listData.notifications) ? listData.notifications : []

  return {
    viewTabs: ['Notifications', 'Promo codes'],
    notifications: {
      title: 'Notifications',
      subtitle: 'Send push / SMS to customers & vendors',
      channels: NOTIFICATION_CHANNELS,
      columns: ['Target', 'Title', 'Channel', 'Date / time', 'Status'],
      rows: raw.filter((item) => item && item.id).map(mapNotificationRow),
      page: Number(listData.page) || 1,
      limit: Number(listData.limit) || 20,
      total: Number(listData.total) || raw.length,
    },
  }
}

/**
 * Map GET /admin/marketing/notifications/:id → detail page model.
 */
export function mapAdminMarketingNotificationDetail(data) {
  if (!data || typeof data !== 'object' || !data.id) {
    throw new ApiError({ message: 'Invalid marketing notification detail from the server.' })
  }

  const kpis = data.kpis && typeof data.kpis === 'object' ? data.kpis : {}
  const message = data.message && typeof data.message === 'object' ? data.message : {}
  const when = data.sentAt || data.scheduledAt || data.date || null
  const status = displayStatus(data.status, data.statusKey)
  const isScheduled = String(data.statusKey || '').toLowerCase() === 'scheduled' || status === 'Scheduled'
  const targetKey = data.targetKey || data.target
  const recipients = kpis.recipients != null ? kpis.recipients : data.sentTo
  const delivered = kpis.delivered != null ? kpis.delivered : data.delivered
  const deliveredPct = kpis.deliveredPct != null ? kpis.deliveredPct : data.deliveredPct
  const opened = kpis.opened != null ? kpis.opened : data.opened
  const openedPct = kpis.openedPct != null ? kpis.openedPct : data.openedPct
  const failed = kpis.failed != null ? kpis.failed : data.failed

  const deliveryRows = Array.isArray(data.deliveryByChannel)
    ? data.deliveryByChannel
    : []

  const channelRows = deliveryRows.length
    ? deliveryRows.map((row) => ({
        channel: row.channel ? String(row.channel) : '—',
        icon: channelIcon(row.channelKey, row.channel),
        sent: formatCount(row.sent),
        delivered: formatCount(row.delivered),
        opened: formatCount(row.opened),
        failed: formatCount(row.failed),
      }))
    : (Array.isArray(data.channels) ? data.channels : []).map((ch) => {
        const key = String(ch)
        const stats = data.channelStats?.[key] || {}
        return {
          channel: key === 'PUSH' ? 'Push' : key === 'EMAIL' ? 'Email' : key === 'SMS' ? 'SMS' : key,
          icon: channelIcon(key),
          sent: formatCount(stats.sent ?? data.sentTo),
          delivered: formatCount(stats.delivered ?? data.delivered),
          opened: formatCount(stats.opened ?? data.opened),
          failed: formatCount(stats.failed ?? data.failed),
        }
      })

  const type = message.type || data.type || 'Info'
  const title = message.title || data.title || '—'
  const body = message.body || data.body || '—'
  const sender = message.sender || data.sender || data.createdByName || 'Yjeek Admin'

  return {
    id: String(data.id),
    target: data.target ? String(data.target) : '—',
    type: String(type),
    title: String(title),
    body: String(body),
    sender: String(sender),
    sentLabel: when
      ? `${isScheduled ? 'Scheduled' : 'Sent'} ${formatFullDate(when)} · ${formatTime(when)}`
      : '—',
    audience: data.audienceLabel ? String(data.audienceLabel) : '—',
    recipientsLabel: `${formatCount(recipients)} ${recipientsWord(targetKey, data.target)}`,
    channelsLabel: data.channelLabel ? String(data.channelLabel) : '—',
    sentDate: formatFullDate(when),
    sentTime: formatTime(when),
    status,
    sentBy: data.createdByName ? String(data.createdByName) : String(sender),
    stats: [
      { label: 'Recipients', value: formatCount(recipients), tone: 'ink' },
      {
        label: 'Delivered',
        value:
          delivered == null
            ? '—'
            : `${formatCount(delivered)}${deliveredPct != null ? ` · ${deliveredPct}%` : ''}`,
        tone: 'green',
      },
      {
        label: 'Opened',
        value:
          opened == null
            ? '—'
            : `${formatCount(opened)}${openedPct != null ? ` · ${openedPct}%` : ''}`,
        tone: 'green',
      },
      {
        label: 'Failed',
        value: formatCount(failed),
        tone: Number(failed) > 0 ? 'red' : 'ink',
      },
    ],
    channelRows,
    raw: data,
  }
}

/** UI audience label → API audience. */
export function mapCustomerNotificationAudienceToApi(audience) {
  const raw = String(audience || '').trim().toLowerCase()
  if (raw === 'all customers' || raw === 'all') return 'all'
  if (raw === 'by segment' || raw === 'by_segment') return 'by_segment'
  if (raw === 'by city' || raw === 'by_city') return 'by_city'
  if (raw === 'selected') return 'selected'
  return raw.replace(/\s+/g, '_')
}

/**
 * Map Send customer notification form → POST /admin/marketing/notifications body.
 * Confirmed sample:
 *   { target, audience, segmentIds?, type, title, body, push, email, sms, schedule }
 */
export function mapAdminSendCustomerNotificationRequest(form = {}) {
  const title = String(form.title || '').trim()
  if (!title) {
    throw new ApiError({ message: 'Notification title is required.' })
  }

  const bodyText = String(form.body || '').trim()
  if (!bodyText) {
    throw new ApiError({ message: 'Notification body is required.' })
  }

  const audience = mapCustomerNotificationAudienceToApi(form.audience)
  const segmentIds = Array.isArray(form.segmentIds)
    ? form.segmentIds.map((id) => String(id || '').trim()).filter(Boolean)
    : []

  if (audience === 'by_segment' && !segmentIds.length) {
    throw new ApiError({ message: 'Add at least one segment id for By segment.' })
  }

  const customerIds = Array.isArray(form.customerIds)
    ? form.customerIds.map((id) => String(id || '').trim()).filter(Boolean)
    : audience === 'selected'
      ? segmentIds
      : []

  if (audience === 'selected' && !customerIds.length) {
    throw new ApiError({ message: 'Add at least one customer for Selected.' })
  }

  const scheduleUi = String(form.schedule || 'Send now').trim().toLowerCase()
  let schedule = 'now'
  let scheduledAt
  if (scheduleUi === 'send now' || scheduleUi === 'now') {
    schedule = 'now'
  } else if (scheduleUi === 'schedule later' || scheduleUi === 'later') {
    const when = String(form.scheduledAt || '').trim()
    if (!when) {
      throw new ApiError({
        message: 'Pick a date & time for Schedule later, or choose Send now.',
      })
    }
    const parsed = new Date(when)
    if (Number.isNaN(parsed.getTime()) || parsed.getTime() <= Date.now()) {
      throw new ApiError({ message: 'Scheduled time must be in the future.' })
    }
    schedule = 'later'
    scheduledAt = parsed.toISOString()
  } else if (scheduleUi) {
    schedule = scheduleUi
  }

  const payload = {
    target: 'customer',
    audience,
    type: String(form.type || form.messageType || 'Promo').trim() || 'Promo',
    title,
    body: bodyText,
    push: form.push !== false && form.push !== 'false',
    email: form.email === true || form.email === 'true',
    sms: form.sms === true || form.sms === 'true',
    schedule,
  }
  if (scheduledAt) payload.scheduledAt = scheduledAt

  if (audience === 'by_segment') {
    payload.segmentIds = segmentIds
  }
  if (audience === 'selected') {
    payload.customerIds = customerIds
  }

  return payload
}

/** Map a list notification row → send-page history table row. */
export function mapAdminCustomerNotificationHistoryRow(item) {
  if (!item || !item.id) return null
  const when = item.date || item.sentAt || item.scheduledAt || null
  let dateLabel = '—'
  if (when) {
    const d = new Date(when)
    if (!Number.isNaN(d.getTime())) {
      dateLabel = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
    }
  }

  return {
    id: String(item.id),
    notification: item.title ? String(item.title) : '—',
    audience: item.audienceLabel ? String(item.audienceLabel) : '—',
    channel: item.channelLabel
      ? String(item.channelLabel).replace(/\+/g, ' · ')
      : '—',
    sentTo: formatCount(item.sentTo),
    date: dateLabel,
    status: item.status ? String(item.status) : '—',
  }
}

/** UI audience label → API audience (vendor). */
export function mapVendorNotificationAudienceToApi(audience) {
  const raw = String(audience || '').trim().toLowerCase()
  if (raw === 'all vendors' || raw === 'all') return 'all'
  if (raw === 'by category' || raw === 'by_category') return 'by_category'
  if (raw === 'by status' || raw === 'by_status') return 'by_status'
  if (raw === 'selected') return 'selected'
  return raw.replace(/\s+/g, '_')
}

const VENDOR_STATUS_UI_TO_API = {
  Active: 'active',
  active: 'active',
  Inactive: 'inactive',
  inactive: 'inactive',
  Suspended: 'suspended',
  suspended: 'suspended',
}

/**
 * Map Send vendor notification / estimate form → marketing audience fields.
 */
export function mapAdminVendorNotificationAudienceFields(form = {}) {
  const audience = mapVendorNotificationAudienceToApi(form.audience)
  const vendorIds = Array.isArray(form.vendorIds)
    ? form.vendorIds.map((id) => String(id || '').trim()).filter(Boolean)
    : []
  const categoryId = String(form.categoryId || '').trim()
  const categoryLabel = String(form.categoryLabel || form.category || '').trim()
  const vendorStatus =
    VENDOR_STATUS_UI_TO_API[form.vendorStatus] ||
    VENDOR_STATUS_UI_TO_API[String(form.vendorStatus || '').trim()] ||
    String(form.vendorStatus || '').trim().toLowerCase() ||
    ''

  if (audience === 'selected' && !vendorIds.length) {
    throw new ApiError({ message: 'Add at least one vendor id for Selected.' })
  }
  if (audience === 'by_category' && !categoryId && !categoryLabel) {
    throw new ApiError({ message: 'Select a category for By category.' })
  }
  if (audience === 'by_status' && !['active', 'inactive', 'suspended'].includes(vendorStatus)) {
    throw new ApiError({ message: 'Select a status for By status.' })
  }

  const payload = {
    target: 'vendor',
    audience,
  }
  if (audience === 'selected') payload.vendorIds = vendorIds
  if (audience === 'by_category') {
    if (categoryId) payload.categoryId = categoryId
    if (categoryLabel) payload.categoryLabel = categoryLabel
  }
  if (audience === 'by_status') payload.vendorStatus = vendorStatus

  return payload
}

/**
 * Map vendor audience form → POST /admin/marketing/notifications/estimate body.
 */
export function mapAdminEstimateVendorNotificationRequest(form = {}) {
  return mapAdminVendorNotificationAudienceFields(form)
}

/**
 * Map POST /admin/marketing/notifications/estimate → UI.
 */
export function mapAdminEstimateNotificationResponse(data) {
  return {
    target: data?.target || null,
    audience: data?.audience || null,
    audienceLabel: data?.audienceLabel || null,
    estimatedRecipients:
      typeof data?.estimatedRecipients === 'number' ? data.estimatedRecipients : 0,
  }
}

/**
 * Map GET /admin/marketing/notifications/meta → UI option lists.
 */
export function mapAdminMarketingNotifyMetaResponse(data) {
  const vendor = data?.vendor && typeof data.vendor === 'object' ? data.vendor : {}
  const categories = (Array.isArray(vendor.categories) ? vendor.categories : [])
    .map((item) => ({
      id: String(item?.id || ''),
      name: String(item?.name || item?.slug || ''),
      slug: item?.slug ? String(item.slug) : null,
    }))
    .filter((item) => item.id && item.name)

  const statuses = (Array.isArray(vendor.statuses) ? vendor.statuses : ['active', 'inactive', 'suspended'])
    .map((value) => {
      const key = String(value || '').toLowerCase()
      if (key === 'inactive') return { value: 'inactive', label: 'Inactive' }
      if (key === 'suspended') return { value: 'suspended', label: 'Suspended' }
      return { value: 'active', label: 'Active' }
    })

  return {
    categories,
    statuses,
    raw: data,
  }
}

/**
 * Map Send vendor notification form → POST /admin/marketing/notifications body.
 * Confirmed:
 *   { target, audience, vendorIds?, categoryId?, vendorStatus?, type, title, body, push, email, sms, schedule }
 */
export function mapAdminSendVendorNotificationRequest(form = {}) {
  const title = String(form.title || '').trim()
  if (!title) {
    throw new ApiError({ message: 'Notification title is required.' })
  }

  const bodyText = String(form.body || '').trim()
  if (!bodyText) {
    throw new ApiError({ message: 'Notification body is required.' })
  }

  const audiencePayload = mapAdminVendorNotificationAudienceFields(form)

  const scheduleUi = String(form.schedule || 'Send now').trim().toLowerCase()
  let schedule = 'now'
  let scheduledAt
  if (scheduleUi === 'send now' || scheduleUi === 'now') {
    schedule = 'now'
  } else if (scheduleUi === 'schedule later' || scheduleUi === 'later') {
    const when = String(form.scheduledAt || '').trim()
    if (!when) {
      throw new ApiError({
        message: 'Pick a date & time for Schedule later, or choose Send now.',
      })
    }
    const parsed = new Date(when)
    if (Number.isNaN(parsed.getTime()) || parsed.getTime() <= Date.now()) {
      throw new ApiError({ message: 'Scheduled time must be in the future.' })
    }
    schedule = 'later'
    scheduledAt = parsed.toISOString()
  } else if (scheduleUi) {
    schedule = scheduleUi
  }

  const payload = {
    ...audiencePayload,
    type: String(form.type || form.messageType || 'Promo').trim() || 'Promo',
    title,
    body: bodyText,
    push: form.push !== false && form.push !== 'false',
    email: form.email === true || form.email === 'true',
    sms: form.sms === true || form.sms === 'true',
    schedule,
  }
  if (scheduledAt) payload.scheduledAt = scheduledAt

  return payload
}

/** Map a list notification row → vendor send-page history table row. */
export function mapAdminVendorNotificationHistoryRow(item) {
  const base = mapAdminCustomerNotificationHistoryRow(item)
  if (!base) return null

  const when = item.date || item.sentAt || item.scheduledAt || null
  let timeLabel = '—'
  if (when) {
    const d = new Date(when)
    if (!Number.isNaN(d.getTime())) {
      timeLabel = d.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      })
    }
  }

  return {
    ...base,
    type: item.type ? String(item.type) : '—',
    date: (() => {
      if (!when) return '—'
      const d = new Date(when)
      if (Number.isNaN(d.getTime())) return '—'
      return d.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    })(),
    time: timeLabel,
  }
}

function formatScheduledWhen(value) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  const day = date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
  const time = date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  return `${day}, ${time}`
}

function recipientLabel(count, target) {
  const n = Number(count)
  if (!Number.isFinite(n) || n < 0) return null
  if (target === 'vendor') return `${n} vendor${n === 1 ? '' : 's'}`
  if (target === 'customer') return `${n} customer${n === 1 ? '' : 's'}`
  return `${n} recipient${n === 1 ? '' : 's'}`
}

export function formatMarketingNotifySendSuccess(title, options = {}) {
  const heading = options.scheduled
    ? `Scheduled: ${title || 'Notification'}`
    : `Sent: ${title || 'Notification'}`

  if (options.scheduled) {
    const parts = []
    const when = formatScheduledWhen(options.scheduledAt)
    if (when) parts.push(`for ${when}`)
    const recipients = recipientLabel(options.sentTo, options.target)
    if (recipients) parts.push(recipients)
    const channels = []
    if (options.push !== false) channels.push('Push')
    if (options.email === true) channels.push('Email')
    if (options.sms === true) channels.push('SMS')
    if (channels.length) parts.push(channels.join(' · '))
    if (!parts.length) return heading
    return `${heading} · ${parts.join(' · ')}`
  }

  const parts = []

  if (options.push !== false && options.email !== true && options.sms !== true) {
    parts.push('push sent')
  }

  if (options.email === true) {
    const delivery = options.emailDelivery || {}
    const delivered = Number(delivery.delivered || 0)
    const failed = Number(delivery.failed || 0)
    const skipped = Number(delivery.skippedNoEmail || 0)
    parts.push(`email ${delivered} delivered`)
    if (skipped) parts.push(`${skipped} skipped (no email)`)
    if (failed) parts.push(`${failed} failed`)
  }

  if (options.sms === true) {
    const delivery = options.smsDelivery || {}
    const delivered = Number(delivery.delivered || 0)
    const failed = Number(delivery.failed || 0)
    const skipped = Number(delivery.skippedNoPhone || 0)
    parts.push(`SMS ${delivered} delivered`)
    if (skipped) parts.push(`${skipped} skipped (no phone)`)
    if (failed) parts.push(`${failed} failed`)
  }

  if (!parts.length) return heading
  return `${heading} · ${parts.join(', ')}`
}
