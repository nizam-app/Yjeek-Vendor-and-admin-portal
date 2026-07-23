/**
 * Central endpoint registry.
 *
 * Paths must stay relative. The shared client prefixes VITE_API_BASE_URL via
 * buildApiUrl — never put origins, ports, or `/api/v1` in this file.
 *
 *   endpoints.shared  — cross-portal (add when backend defines them)
 *   endpoints.vendor  — Vendor Panel only
 *   endpoints.admin   — Admin Panel only (empty until real Admin API exists)
 *
 * Auth paths: only Postman-confirmed routes are registered as live values.
 */

export const endpoints = {
  shared: {
    // Add cross-portal endpoints here when the backend defines them.
  },

  vendor: {
    auth: {
      /** Confirmed: POST /vendor-panel/auth/login */
      login: '/vendor-panel/auth/login',
      /** Confirmed: GET /vendor-panel/auth/me */
      me: '/vendor-panel/auth/me',
      /** Confirmed: POST /vendor-panel/auth/logout */
      logout: '/vendor-panel/auth/logout',

      // Unconfirmed — do not guess. Add only after Postman/backend confirmation:
      // refresh: '/vendor-panel/auth/refresh',
    },

    /**
     * Relative paths used by the existing Vendor UI + mockClient.
     * Replace with confirmed backend paths when each resource is wired.
     */
    /** Confirmed: GET /vendor-panel/dashboard?branchId= */
    dashboard: '/vendor-panel/dashboard',
    profile: '/vendor/profile',
    orders: {
      /** Confirmed: GET /vendor-panel/orders/live?tab=delivery_pickup|dine_in&branchId= */
      live: '/vendor-panel/orders/live',
      /** Confirmed: GET /vendor-panel/orders/scheduled?branchId=&date=today */
      scheduled: '/vendor-panel/orders/scheduled',
      /** Confirmed: GET /vendor-panel/orders/services?branchId= */
      services: '/vendor-panel/orders/services',
      /** Confirmed: GET /vendor-panel/orders/services/calendar?month=YYYY-MM&branchId= */
      servicesCalendar: '/vendor-panel/orders/services/calendar',
      /** Confirmed: POST /vendor-panel/orders/:orderId/accept */
      accept: (orderId) => `/vendor-panel/orders/${encodeURIComponent(String(orderId || '').trim())}/accept`,
      /** Confirmed: GET /vendor-panel/orders/history?limit= */
      history: '/vendor-panel/orders/history',
      /** Confirmed: GET /vendor-panel/orders/:orderId */
      detail: (orderId) => `/vendor-panel/orders/${encodeURIComponent(String(orderId || '').trim())}`,
      /** Confirmed: GET /vendor-panel/orders/:orderId/receipt */
      receipt: (orderId) =>
        `/vendor-panel/orders/${encodeURIComponent(String(orderId || '').trim())}/receipt`,
    },
    services: {
      bookings: '/services/bookings',
      /** @deprecated Use endpoints.vendor.orders.servicesCalendar */
      calendar: '/vendor-panel/orders/services/calendar',
    },
    catalog: {
      storeTypes: '/catalog/store-types',
      items: '/catalog/items',
    },
    branches: '/vendor-panel/branches',
    /** Confirmed: PATCH /vendor-panel/branches/close-all */
    branchesCloseAll: '/vendor-panel/branches/close-all',
    /** Confirmed: PATCH /vendor-panel/branches/open-all */
    branchesOpenAll: '/vendor-panel/branches/open-all',
    staff: '/staff',
    promotions: '/promotions',
    notifications: '/notifications',
    content: {
      login: '/content/login',
    },
  },

  admin: {
    /**
     * Do not invent Admin API paths here.
     * When Admin integration starts, register real relative paths only, e.g.:
     *   dashboard: '/admin-panel/dashboard',
     * then: apiClient.get(endpoints.admin.dashboard)
     *
     * Until then, Admin continues via src/services/adminService.js + mockClient
     * (VITE_ADMIN_USE_MOCK_API=true).
     */
  },
}

export default endpoints
