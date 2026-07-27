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
    /** Confirmed: GET /vendor-panel/account */
    account: '/vendor-panel/account',
    /** @deprecated Prefer endpoints.vendor.account */
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
      /** Confirmed: GET /vendor-panel/catalog/products */
      products: '/vendor-panel/catalog/products',
      /** Confirmed: GET /vendor-panel/catalog/products/:productId */
      product: (productId) =>
        `/vendor-panel/catalog/products/${encodeURIComponent(String(productId || '').trim())}`,
      /** Confirmed: POST /vendor-panel/catalog/products */
      // create uses same path via apiClient.post(endpoints.vendor.catalog.products)
      /** Confirmed: GET /vendor-panel/catalog/categories */
      categories: '/vendor-panel/catalog/categories',
      /** Confirmed: GET /vendor-panel/catalog/store-types */
      storeTypes: '/vendor-panel/catalog/store-types',
      /**
       * Confirmed: GET + PATCH /vendor-panel/catalog/branches/:branchId/menu
       * Postman: "GET Branch menu" / "PATCH Edit Branch menu"
       */
      branchMenu: (branchId) =>
        `/vendor-panel/catalog/branches/${encodeURIComponent(String(branchId || '').trim())}/menu`,
      /** @deprecated Prefer endpoints.vendor.catalog.products */
      items: '/vendor-panel/catalog/products',
    },
    branches: '/vendor-panel/branches',
    /** Confirmed: PATCH /vendor-panel/branches/close-all */
    branchesCloseAll: '/vendor-panel/branches/close-all',
    /** Confirmed: PATCH /vendor-panel/branches/open-all */
    branchesOpenAll: '/vendor-panel/branches/open-all',
    /** Confirmed: DELETE /vendor-panel/branches/:branchId (Postman "Delete Branch") */
    branch: (branchId) =>
      `/vendor-panel/branches/${encodeURIComponent(String(branchId || '').trim())}`,
    /** Confirmed: GET /vendor-panel/staff */
    staff: '/vendor-panel/staff',
    promotions: {
      /** Confirmed: GET /vendor-panel/promotions */
      list: '/vendor-panel/promotions',
      /** Confirmed: GET /vendor-panel/promotions/summary */
      summary: '/vendor-panel/promotions/summary',
      /** Confirmed: GET /vendor-panel/promotions/:promotionId */
      detail: (promotionId) =>
        `/vendor-panel/promotions/${encodeURIComponent(String(promotionId || '').trim())}`,
      /** Confirmed: GET /vendor-panel/promotions/:promotionId/analytics */
      analytics: (promotionId) =>
        `/vendor-panel/promotions/${encodeURIComponent(String(promotionId || '').trim())}/analytics`,
      /** Confirmed: PATCH /vendor-panel/promotions/:promotionId/pause */
      pause: (promotionId) =>
        `/vendor-panel/promotions/${encodeURIComponent(String(promotionId || '').trim())}/pause`,
    },
    notifications: {
      /** Confirmed: GET /vendor-panel/notifications */
      list: '/vendor-panel/notifications',
      /** Confirmed: GET /vendor-panel/notifications/unread-count */
      unreadCount: '/vendor-panel/notifications/unread-count',
      /** Confirmed: PATCH /vendor-panel/notifications/:notificationId/read */
      markRead: (notificationId) =>
        `/vendor-panel/notifications/${encodeURIComponent(String(notificationId || '').trim())}/read`,
      /** Confirmed: PATCH /vendor-panel/notifications/read-all */
      markAllRead: '/vendor-panel/notifications/read-all',
    },
    content: {
      login: '/content/login',
    },
  },

  admin: {
    /**
     * Register only Postman-confirmed Admin paths.
     * Other Admin screens stay on adminService + mockClient until wired.
     */
    auth: {
      /** Confirmed: POST /admin/auth/login */
      login: '/admin/auth/login',
      /** Confirmed: GET /admin/auth/me */
      me: '/admin/auth/me',
      /** Confirmed: POST /admin/auth/logout */
      logout: '/admin/auth/logout',
      // Unconfirmed response samples — add only after screenshots:
      // verify2fa: '/admin/auth/2fa/verify',
    },
    dashboard: {
      /** Confirmed: GET /admin/dashboard/overview?region= */
      overview: '/admin/dashboard/overview',
      /** Confirmed: GET /admin/dashboard/map?layer=&region= */
      map: '/admin/dashboard/map',
      /** Confirmed: GET /admin/dashboard/orders?bucket=&sort=&limit= */
      orders: '/admin/dashboard/orders',
      boards: {
        /** Confirmed: GET /admin/dashboard/boards/scheduled?sort=&limit= */
        scheduled: '/admin/dashboard/boards/scheduled',
        /** Confirmed: GET /admin/dashboard/boards/pickup?limit= */
        pickup: '/admin/dashboard/boards/pickup',
        /** Confirmed: GET /admin/dashboard/boards/dine_in?limit= */
        dineIn: '/admin/dashboard/boards/dine_in',
        /** Confirmed: GET /admin/dashboard/boards/services?limit= */
        services: '/admin/dashboard/boards/services',
      },
      /** Confirmed: GET /admin/dashboard/incidents */
      incidents: '/admin/dashboard/incidents',
      /** Confirmed: GET /admin/dashboard/chats */
      chats: '/admin/dashboard/chats',
    },
    orders: {
      /**
       * Confirmed: GET /admin/orders/:orderId
       * @param {string} orderId
       */
      detail: (orderId) => `/admin/orders/${encodeURIComponent(orderId)}`,
      /** Confirmed: GET /admin/orders/action-options */
      actionOptions: '/admin/orders/action-options',
      /**
       * Confirmed: GET /admin/orders/:orderId/nearby-champs
       * @param {string} orderId
       */
      nearbyChamps: (orderId) => `/admin/orders/${encodeURIComponent(orderId)}/nearby-champs`,
      /** Confirmed POST action paths */
      redispatch: (orderId) => `/admin/orders/${encodeURIComponent(orderId)}/redispatch`,
      refund: (orderId) => `/admin/orders/${encodeURIComponent(orderId)}/refund`,
      reassignChamp: (orderId) => `/admin/orders/${encodeURIComponent(orderId)}/reassign-champ`,
      flagVendor: (orderId) => `/admin/orders/${encodeURIComponent(orderId)}/flag-vendor`,
      cancel: (orderId) => `/admin/orders/${encodeURIComponent(orderId)}/cancel`,
      suspendChamp: (orderId) => `/admin/orders/${encodeURIComponent(orderId)}/suspend-champ`,
    },
    incidents: {
      /**
       * Confirmed: GET /admin/incidents?status=&priority=&limit=
       */
      list: '/admin/incidents',
      /** Confirmed: POST /admin/incidents/:incidentId/resolve */
      resolve: (incidentId) => `/admin/incidents/${encodeURIComponent(incidentId)}/resolve`,
    },
    chats: {
      /**
       * Confirmed: GET /admin/chats/:conversationId
       * @param {string} conversationId
       */
      conversation: (conversationId) => `/admin/chats/${encodeURIComponent(conversationId)}`,
      /**
       * Confirmed: POST /admin/chats/:conversationId/read
       * @param {string} conversationId
       */
      read: (conversationId) => `/admin/chats/${encodeURIComponent(conversationId)}/read`,
      /**
       * Confirmed: POST /admin/chats/:conversationId/messages
       * @param {string} conversationId
       */
      messages: (conversationId) => `/admin/chats/${encodeURIComponent(conversationId)}/messages`,
    },
  },
}

export default endpoints
