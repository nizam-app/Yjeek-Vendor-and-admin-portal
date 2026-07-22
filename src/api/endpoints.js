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

      // Unconfirmed — do not guess. Add only after Postman/backend confirmation:
      // getMe: '/vendor-panel/auth/me',
      // logout: '/vendor-panel/auth/logout',
      // refresh: '/vendor-panel/auth/refresh',
    },

    /**
     * Relative paths used by the existing Vendor UI + mockClient.
     * Replace with confirmed backend paths when each resource is wired.
     */
    dashboard: '/vendor/dashboard',
    profile: '/vendor/profile',
    orders: {
      live: '/orders/live',
      scheduled: '/orders/scheduled',
      history: '/orders/history',
    },
    services: {
      bookings: '/services/bookings',
      calendar: '/services/calendar',
    },
    catalog: {
      storeTypes: '/catalog/store-types',
      items: '/catalog/items',
    },
    branches: '/branches',
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
