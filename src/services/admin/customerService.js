import { apiClient } from '../../api/client'
import { apiConfig, isAdminRealApiFeature } from '../../api/config'
import { endpoints } from '../../api/endpoints'
import {
  mapAdminCustomerDetail,
  mapAdminCustomersListPage,
  mapAdminCustomersStatusTab,
  mapAdminCustomerWallet,
  mapAdminCustomerSupport,
  mapAdminCustomerSuspendRequest,
} from '../../mappers/admin/mapAdminCustomers'

function useRealCustomersApi() {
  return isAdminRealApiFeature('customers') || !apiConfig.adminUseMockApi
}

/**
 * Admin Customers.
 *
 * Confirmed:
 *   GET /admin/customers/summary
 *   GET /admin/customers?search=&statusTab=all&limit=20
 *   GET /admin/customers/:customerId
 *
 * Feature flag: `customers` (also on when VITE_ADMIN_USE_MOCK_API=false)
 */
export const adminCustomerService = {
  /**
   * List page: summary KPIs + customer table.
   *
   * @param {{ search?: string, statusTab?: string, limit?: number, page?: number, signal?: AbortSignal }} [options]
   */
  async listForPage(options = {}) {
    if (!useRealCustomersApi()) {
      return { data: null, meta: null }
    }

    const {
      search = '',
      statusTab = 'All',
      limit = 20,
      page,
      params,
      ...requestOptions
    } = options

    const requestOpts = {
      ...requestOptions,
      scope: 'admin',
      feature: 'customers',
      forceReal: !apiConfig.adminUseMockApi,
    }

    const query = {
      search: String(search || '').trim(),
      statusTab: mapAdminCustomersStatusTab(statusTab),
      limit,
      ...(page != null ? { page } : {}),
      ...(params || {}),
    }

    const [listResponse, summaryResponse] = await Promise.all([
      apiClient.get(endpoints.admin.customers.list, {
        ...requestOpts,
        params: query,
      }),
      apiClient.get(endpoints.admin.customers.summary, requestOpts),
    ])

    return {
      data: mapAdminCustomersListPage(listResponse?.data, summaryResponse?.data),
      meta: listResponse?.meta ?? null,
    }
  },

  /**
   * Customer detail overview.
   *
   * @param {string} customerId
   * @param {{ signal?: AbortSignal }} [options]
   */
  async getCustomer(customerId, options = {}) {
    const id = String(customerId || '').trim()
    if (!id) {
      throw new Error('Customer id is required.')
    }

    if (!useRealCustomersApi()) {
      return { data: null, meta: null }
    }

    const response = await apiClient.get(endpoints.admin.customers.detail(id), {
      ...options,
      scope: 'admin',
      feature: 'customers',
      forceReal: true,
    })

    return {
      data: mapAdminCustomerDetail(response?.data),
      meta: response?.meta ?? null,
    }
  },

  /**
   * Wallet & cashback tab.
   *
   * @param {string} customerId
   * @param {{ page?: number, limit?: number, signal?: AbortSignal }} [options]
   */
  async getWallet(customerId, options = {}) {
    const id = String(customerId || '').trim()
    if (!id) {
      throw new Error('Customer id is required.')
    }

    if (!useRealCustomersApi()) {
      return { data: null, meta: null }
    }

    const { page = 1, limit = 20, params, ...requestOptions } = options

    const response = await apiClient.get(endpoints.admin.customers.wallet(id), {
      ...requestOptions,
      scope: 'admin',
      feature: 'customers',
      forceReal: true,
      params: {
        page,
        limit,
        ...(params || {}),
      },
    })

    return {
      data: mapAdminCustomerWallet(response?.data),
      meta: response?.meta ?? null,
    }
  },

  /**
   * Support tickets tab.
   *
   * @param {string} customerId
   * @param {{ page?: number, limit?: number, signal?: AbortSignal }} [options]
   */
  async getSupportTickets(customerId, options = {}) {
    const id = String(customerId || '').trim()
    if (!id) {
      throw new Error('Customer id is required.')
    }

    if (!useRealCustomersApi()) {
      return { data: null, meta: null }
    }

    const { page = 1, limit = 20, params, ...requestOptions } = options

    const response = await apiClient.get(endpoints.admin.customers.support(id), {
      ...requestOptions,
      scope: 'admin',
      feature: 'customers',
      forceReal: true,
      params: {
        page,
        limit,
        ...(params || {}),
      },
    })

    return {
      data: mapAdminCustomerSupport(response?.data),
      meta: response?.meta ?? null,
    }
  },

  /**
   * Suspend customer.
   * Confirmed: POST /admin/customers/:id/suspend { reason, duration, notifyCustomer }
   *
   * @param {string} customerId
   * @param {{ reason?: string, duration?: string, notify?: boolean, notifyCustomer?: boolean }} [form]
   * @param {{ signal?: AbortSignal }} [options]
   */
  async suspendCustomer(customerId, form = {}, options = {}) {
    const id = String(customerId || '').trim()
    if (!id) {
      throw new Error('Customer id is required.')
    }

    const body = mapAdminCustomerSuspendRequest(form)

    if (!useRealCustomersApi()) {
      return {
        data: { accountActive: false, status: 'Suspended' },
        meta: null,
      }
    }

    const response = await apiClient.post(endpoints.admin.customers.suspend(id), body, {
      ...options,
      scope: 'admin',
      feature: 'customers',
      forceReal: true,
    })

    return {
      data: response?.data ?? null,
      meta: response?.meta ?? null,
    }
  },

  /**
   * Activate customer after suspension.
   * Confirmed: POST /admin/customers/:id/activate
   *
   * @param {string} customerId
   * @param {{ signal?: AbortSignal }} [options]
   */
  async activateCustomer(customerId, options = {}) {
    const id = String(customerId || '').trim()
    if (!id) {
      throw new Error('Customer id is required.')
    }

    if (!useRealCustomersApi()) {
      return {
        data: { accountActive: true, status: 'Active' },
        meta: null,
      }
    }

    const response = await apiClient.post(endpoints.admin.customers.activate(id), null, {
      ...options,
      scope: 'admin',
      feature: 'customers',
      forceReal: true,
    })

    return {
      data: response?.data ?? null,
      meta: response?.meta ?? null,
    }
  },
}
