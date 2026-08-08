import { apiClient } from '../../api/client'
import { endpoints } from '../../api/endpoints'
import {
  mapVendorDineInOrder,
  mapVendorLiveOrder,
  mapVendorLiveOrdersResponse,
} from '../../mappers/vendor/mapVendorLiveOrders'
import { mapVendorScheduledOrdersResponse } from '../../mappers/vendor/mapVendorScheduledOrders'
import { mapVendorOrderDetailResponse, mapVendorOrderHistoryResponse } from '../../mappers/vendor/mapVendorOrderHistory'
import { mapVendorOrderReceiptResponse } from '../../mappers/vendor/mapVendorOrderReceipt'
import { mapVendorServiceCalendarResponse } from '../../mappers/vendor/mapVendorServiceCalendar'
import {
  mapVendorServiceOrder,
  mapVendorServiceOrdersResponse,
} from '../../mappers/vendor/mapVendorServiceOrders'
import { mapVendorRejectionReason } from '../../mappers/vendor/mapVendorRejectionReason'

const LIVE_TAB_BY_BOARD = {
  delivery: 'delivery_pickup',
  dinein: 'dine_in',
}

function mapOrderMutationData(raw, columnKey = 'auto') {
  if (!raw || typeof raw !== 'object') return null
  const orderType = String(raw.orderType || '').toUpperCase()
  try {
    if (orderType === 'SERVICE') return mapVendorServiceOrder(raw, columnKey)
    if (orderType === 'DINE_IN') return mapVendorDineInOrder(raw)
    return mapVendorLiveOrder(raw)
  } catch {
    return null
  }
}

/**
 * Vendor orders service.
 * Confirmed: live boards, scheduled, services board/calendar, history, detail, receipt,
 * accept, reject, start-preparing, check-in, mark-ready, complete, no-show.
 */
export const orderService = {
  /**
   * GET /vendor-panel/orders/live?tab=delivery_pickup|dine_in&branchId=&search=
   */
  async getLiveOrders(options = {}) {
    const { board = 'delivery', branchId, search, params, ...requestOptions } = options
    const tab = LIVE_TAB_BY_BOARD[board] || LIVE_TAB_BY_BOARD.delivery

    const query = {
      tab,
      ...(params || {}),
    }
    if (branchId) {
      query.branchId = String(branchId)
    }
    const searchTerm = String(search || '')
      .trim()
      .replace(/^#/, '')
    if (searchTerm) {
      query.search = searchTerm
    }

    const response = await apiClient.get(endpoints.vendor.orders.live, {
      ...requestOptions,
      params: query,
      scope: 'vendor',
    })

    return {
      data: mapVendorLiveOrdersResponse(response?.data, { board }),
      meta: response?.meta ?? null,
    }
  },

  /**
   * GET /vendor-panel/orders/scheduled?branchId=&date=today
   */
  async getScheduledOrders(options = {}) {
    const { branchId, date = 'today', window, sort, search, params, ...requestOptions } = options
    const query = {
      date,
      ...(params || {}),
    }
    if (branchId) query.branchId = String(branchId)
    if (window) query.window = window
    if (sort) query.sort = sort
    if (search) query.search = search

    const response = await apiClient.get(endpoints.vendor.orders.scheduled, {
      ...requestOptions,
      params: query,
      scope: 'vendor',
    })

    return {
      data: mapVendorScheduledOrdersResponse(response?.data),
      meta: response?.meta ?? null,
    }
  },

  /**
   * GET /vendor-panel/orders/services?branchId=
   */
  async getServiceOrders(options = {}) {
    const { branchId, params, ...requestOptions } = options
    const query = { ...(params || {}) }
    if (branchId) query.branchId = String(branchId)

    const response = await apiClient.get(endpoints.vendor.orders.services, {
      ...requestOptions,
      params: query,
      scope: 'vendor',
    })

    return {
      data: mapVendorServiceOrdersResponse(response?.data),
      meta: response?.meta ?? null,
    }
  },

  /**
   * GET /vendor-panel/orders/services/calendar?month=YYYY-MM&branchId=
   */
  async getServiceCalendar(options = {}) {
    const { branchId, month, params, ...requestOptions } = options
    const query = { ...(params || {}) }
    if (month) query.month = String(month)
    if (branchId) query.branchId = String(branchId)

    const response = await apiClient.get(endpoints.vendor.orders.servicesCalendar, {
      ...requestOptions,
      params: query,
      scope: 'vendor',
    })

    return {
      data: mapVendorServiceCalendarResponse(response?.data),
      meta: response?.meta ?? null,
    }
  },

  /**
   * POST /vendor-panel/orders/:orderId/accept
   * Confirmed from Postman "POST Accept". Empty body.
   */
  async acceptOrder(orderId, options = {}) {
    const id = String(orderId || '').trim()
    if (!id) {
      throw new Error('Order id is required.')
    }

    const response = await apiClient.post(endpoints.vendor.orders.accept(id), {}, {
      ...options,
      scope: 'vendor',
    })

    const raw = response?.data ?? null
    const status = String(raw?.status || '').toUpperCase()
    const columnKey = status === 'AWAITING_PAYMENT' ? 'new' : 'upcoming'

    return {
      data: mapOrderMutationData(raw, columnKey),
      meta: response?.meta ?? null,
      raw,
    }
  },

  /**
   * POST /vendor-panel/orders/:orderId/reject
   * Confirmed from Postman "POST Reject". Body: { reason, note? }.
   * Only valid while the order is still in New (not PREPARING / later).
   */
  async rejectOrder(orderId, form = {}, options = {}) {
    const id = String(orderId || '').trim()
    if (!id) {
      throw new Error('Order id is required.')
    }

    const reason = mapVendorRejectionReason(form.reason)
    if (!reason) {
      throw new Error('Rejection reason is required.')
    }

    const body = { reason }
    const note = String(form.note || '').trim()
    if (note) body.note = note

    const response = await apiClient.post(endpoints.vendor.orders.reject(id), body, {
      ...options,
      scope: 'vendor',
    })

    const raw = response?.data ?? null

    return {
      data: mapOrderMutationData(raw),
      meta: response?.meta ?? null,
      raw,
    }
  },

  /**
   * POST /vendor-panel/orders/:orderId/start-preparing
   * Confirmed from Postman "POST Start preparing". Empty body.
   * Only valid from Accepted / Confirmed (not already PREPARING).
   */
  async startPreparing(orderId, options = {}) {
    const id = String(orderId || '').trim()
    if (!id) {
      throw new Error('Order id is required.')
    }

    const response = await apiClient.post(endpoints.vendor.orders.startPreparing(id), {}, {
      ...options,
      scope: 'vendor',
    })

    const raw = response?.data ?? null
    const orderType = String(raw?.orderType || '').toUpperCase()
    const columnKey = orderType === 'SERVICE' ? 'inProgress' : 'auto'

    return {
      data: mapOrderMutationData(raw, columnKey),
      meta: response?.meta ?? null,
      raw,
    }
  },

  /**
   * POST /vendor-panel/orders/:orderId/check-in
   * Service bookings only — moves confirmed → in progress.
   */
  async checkInService(orderId, options = {}) {
    const id = String(orderId || '').trim()
    if (!id) {
      throw new Error('Order id is required.')
    }

    const response = await apiClient.post(endpoints.vendor.orders.checkIn(id), {}, {
      ...options,
      scope: 'vendor',
    })

    const raw = response?.data ?? null

    return {
      data: mapOrderMutationData(raw, 'inProgress'),
      meta: response?.meta ?? null,
      raw,
    }
  },

  /**
   * POST /vendor-panel/orders/:orderId/no-show
   * Marks a confirmed booking as customer no-show (cancelled).
   */
  async markNoShow(orderId, options = {}) {
    const id = String(orderId || '').trim()
    if (!id) {
      throw new Error('Order id is required.')
    }

    const response = await apiClient.post(endpoints.vendor.orders.noShow(id), {}, {
      ...options,
      scope: 'vendor',
    })

    const raw = response?.data ?? null

    return {
      data: mapOrderMutationData(raw, 'upcoming'),
      meta: response?.meta ?? null,
      raw,
    }
  },

  /**
   * POST /vendor-panel/orders/:orderId/mark-ready
   * Confirmed from Postman "POST Mark ready". Empty body.
   * Only valid from PREPARING. Success status: READY_FOR_PICKUP.
   */
  async markReady(orderId, options = {}) {
    const id = String(orderId || '').trim()
    if (!id) {
      throw new Error('Order id is required.')
    }

    const response = await apiClient.post(endpoints.vendor.orders.markReady(id), {}, {
      ...options,
      scope: 'vendor',
    })

    const raw = response?.data ?? null
    let data = null
    if (raw && typeof raw === 'object') {
      try {
        const orderType = String(raw.orderType || '').toUpperCase()
        data =
          orderType === 'DINE_IN' ? mapVendorDineInOrder(raw) : mapVendorLiveOrder(raw)
      } catch {
        data = null
      }
    }

    return {
      data,
      meta: response?.meta ?? null,
      raw,
    }
  },

  /**
   * POST /vendor-panel/orders/:orderId/request-champ
   */
  async requestChamp(orderId, options = {}) {
    const id = String(orderId || '').trim()
    if (!id) {
      throw new Error('Order id is required.')
    }

    const response = await apiClient.post(endpoints.vendor.orders.requestChamp(id), {}, {
      ...options,
      scope: 'vendor',
    })

    const raw = response?.data ?? null
    let data = null
    if (raw && typeof raw === 'object') {
      try {
        data = mapVendorLiveOrder(raw)
      } catch {
        data = null
      }
    }

    return {
      data,
      meta: response?.meta ?? null,
      raw,
    }
  },

  /**
   * POST /vendor-panel/orders/:orderId/complete
   * Confirmed from Postman "POST Complete". Empty body.
   * Used for dine-in Ready → Verify & complete (and delivery handover-to-customer when advertised).
   */
  async completeOrder(orderId, options = {}) {
    const id = String(orderId || '').trim()
    if (!id) {
      throw new Error('Order id is required.')
    }

    const response = await apiClient.post(endpoints.vendor.orders.complete(id), {}, {
      ...options,
      scope: 'vendor',
    })

    const raw = response?.data ?? null

    return {
      data: mapOrderMutationData(raw),
      meta: response?.meta ?? null,
      raw,
    }
  },

  /**
   * Execute an action advertised by GET /vendor-panel/orders/live.
   * Only relative Vendor order POST/PATCH paths are accepted.
   */
  async performPrimaryAction(action, options = {}) {
    const method = String(action?.method || '').trim().toUpperCase()
    const path = String(action?.path || '').trim()

    if (!['POST', 'PATCH'].includes(method)) {
      throw new Error('Unsupported order action method.')
    }
    if (!/^\/vendor-panel\/orders\/[^/]+\/[^/?]+(?:\?.*)?$/.test(path)) {
      throw new Error('Invalid order action path.')
    }

    const response = await apiClient.request({
      ...options,
      method,
      url: path,
      body: {},
      scope: 'vendor',
    })

    return {
      data: response?.data ?? null,
      meta: response?.meta ?? null,
    }
  },

  /**
   * GET /vendor-panel/orders/history?page=&limit=&search=&status=&type=&branchId=&from=&to=
   */
  async getOrderHistory(options = {}) {
    const {
      limit = 20,
      page = 1,
      branchId,
      search,
      status,
      type,
      from,
      to,
      params,
      ...requestOptions
    } = options

    const query = {
      limit,
      page,
      ...(params || {}),
    }
    if (branchId) query.branchId = String(branchId)

    const searchTerm = String(search || '')
      .trim()
      .replace(/^#/, '')
    if (searchTerm) query.search = searchTerm

    const statusValue = String(status || '')
      .trim()
      .toUpperCase()
    if (statusValue && statusValue !== 'ALL') query.status = statusValue

    const typeValue = String(type || '')
      .trim()
      .toUpperCase()
    if (typeValue && typeValue !== 'ALL') query.type = typeValue

    if (from) query.from = from
    if (to) query.to = to

    const response = await apiClient.get(endpoints.vendor.orders.history, {
      ...requestOptions,
      params: query,
      scope: 'vendor',
    })

    return {
      data: mapVendorOrderHistoryResponse(response?.data),
      meta: response?.meta ?? null,
    }
  },

  /**
   * GET /vendor-panel/orders/:orderId
   * Uses backend order id (cuid), not display orderNumber.
   */
  async getOrderDetail(orderId, options = {}) {
    const id = String(orderId || '').trim()
    if (!id) {
      throw new Error('Order id is required.')
    }

    const response = await apiClient.get(endpoints.vendor.orders.detail(id), {
      ...options,
      scope: 'vendor',
    })

    return {
      data: mapVendorOrderDetailResponse(response?.data),
      meta: response?.meta ?? null,
      raw: response?.data ?? null,
    }
  },

  /**
   * GET /vendor-panel/orders/:orderId/receipt
   * Uses backend order id (cuid), not display orderNumber.
   */
  async getOrderReceipt(orderId, options = {}) {
    const id = String(orderId || '').trim()
    if (!id) {
      throw new Error('Order id is required.')
    }

    const response = await apiClient.get(endpoints.vendor.orders.receipt(id), {
      ...options,
      scope: 'vendor',
    })

    return {
      data: mapVendorOrderReceiptResponse(response?.data),
      meta: response?.meta ?? null,
      raw: response?.data ?? null,
    }
  },
}
