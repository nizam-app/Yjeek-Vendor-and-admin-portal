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
import { mapVendorServiceOrdersResponse } from '../../mappers/vendor/mapVendorServiceOrders'

const LIVE_TAB_BY_BOARD = {
  delivery: 'delivery_pickup',
  dinein: 'dine_in',
}

/**
 * Vendor orders service.
 * Confirmed: live boards, scheduled, services board, services calendar, history, order detail, receipt, accept order.
 * Reject / prepare / handover actions remain unconfirmed.
 */
export const orderService = {
  /**
   * GET /vendor-panel/orders/live?tab=delivery_pickup|dine_in&branchId=
   */
  async getLiveOrders(options = {}) {
    const { board = 'delivery', branchId, params, ...requestOptions } = options
    const tab = LIVE_TAB_BY_BOARD[board] || LIVE_TAB_BY_BOARD.delivery

    const query = {
      tab,
      ...(params || {}),
    }
    if (branchId) {
      query.branchId = String(branchId)
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
    const orderType = String(raw?.orderType || '').toUpperCase()
    const data =
      orderType === 'DINE_IN' ? mapVendorDineInOrder(raw) : mapVendorLiveOrder(raw)

    return {
      data,
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
   * GET /vendor-panel/orders/history?limit=
   */
  async getOrderHistory(options = {}) {
    const { limit = 20, branchId, params, ...requestOptions } = options
    const query = {
      limit,
      ...(params || {}),
    }
    if (branchId) query.branchId = String(branchId)

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
