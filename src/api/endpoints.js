/**
 * Central endpoint registry.
 *
 * Paths must stay relative. The shared client prefixes VITE_API_BASE_URL via
 * buildApiUrl — never put origins, ports, or `/api/v1` in this file.
 *
 *   endpoints.shared  — cross-portal (add when backend defines them)
 *   endpoints.admin   — Admin Panel only
 *
 * Auth paths: only Postman-confirmed routes are registered as live values.
 */

export const endpoints = {
  shared: {
    // Add cross-portal endpoints here when the backend defines them.
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
      /** Confirmed: POST /admin/auth/2fa/verify */
      verify2fa: '/admin/auth/2fa/verify',
      /** Confirmed: POST /admin/auth/2fa/setup */
      setup2fa: '/admin/auth/2fa/setup',
      /** Confirmed: POST /admin/auth/2fa/confirm */
      confirm2fa: '/admin/auth/2fa/confirm',
      /** Confirmed: POST /admin/auth/2fa/disable */
      disable2fa: '/admin/auth/2fa/disable',
      /** Confirmed: POST /admin/auth/2fa/backup-codes */
      backupCodes2fa: '/admin/auth/2fa/backup-codes',
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
        /** Confirmed: GET /admin/dashboard/boards/scheduled/calendar?weekStart=&governorate=&city=&block= */
        scheduledCalendar: '/admin/dashboard/boards/scheduled/calendar',
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
      /**
       * Confirmed: GET /admin/orders/:orderId/dispatch-attempts
       * @param {string} orderId
       */
      dispatchAttempts: (orderId) =>
        `/admin/orders/${encodeURIComponent(orderId)}/dispatch-attempts`,
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
    vendors: {
      /**
       * Confirmed: GET /admin/vendors?search=&status=all&category=&limit=&page=&sort=newest
       * Postman: "List vendors (KPIs + filters)"
       */
      list: '/admin/vendors',
      /**
       * Confirmed: GET + PATCH /admin/vendors/:vendorId
       * Postman: "Get vendor" / "Update vendor (store info)"
       * Also: POST /admin/vendors (create wizard)
       * @param {string} vendorId
       */
      detail: (vendorId) => `/admin/vendors/${encodeURIComponent(vendorId)}`,
      /**
       * Confirmed: POST /admin/vendors
       * Create vendor (Add vendor wizard)
       */
      create: '/admin/vendors',
      /**
       * Confirmed: POST /admin/vendors/:vendorId/activate
       * @param {string} vendorId
       */
      activate: (vendorId) =>
        `/admin/vendors/${encodeURIComponent(vendorId)}/activate`,
      /**
       * Confirmed: POST /admin/vendors/:vendorId/force-close
       * Body: { scope: "whole_store", reason, to }
       * @param {string} vendorId
       */
      forceClose: (vendorId) =>
        `/admin/vendors/${encodeURIComponent(vendorId)}/force-close`,
      /**
       * Confirmed: POST /admin/vendors/:vendorId/reopen
       * Body: { scope: "whole_store" }
       * @param {string} vendorId
       */
      reopen: (vendorId) => `/admin/vendors/${encodeURIComponent(vendorId)}/reopen`,
      /**
       * Confirmed: POST /admin/vendors/:vendorId/suspend
       * Body: { reason }
       * @param {string} vendorId
       */
      suspend: (vendorId) => `/admin/vendors/${encodeURIComponent(vendorId)}/suspend`,
      /**
       * Confirmed: POST /admin/vendors/:vendorId/unsuspend
       * Body: none
       * @param {string} vendorId
       */
      unsuspend: (vendorId) => `/admin/vendors/${encodeURIComponent(vendorId)}/unsuspend`,
      /**
       * Confirmed: GET/POST /admin/vendors/:vendorId/branches
       * @param {string} vendorId
       */
      branches: (vendorId) => `/admin/vendors/${encodeURIComponent(vendorId)}/branches`,
      /**
       * Confirmed: PATCH + DELETE /admin/vendors/:vendorId/branches/:branchId
       * @param {string} vendorId
       * @param {string} branchId
       */
      branch: (vendorId, branchId) =>
        `/admin/vendors/${encodeURIComponent(vendorId)}/branches/${encodeURIComponent(branchId)}`,
      /**
       * Confirmed: GET/POST /admin/vendors/:vendorId/staff
       * @param {string} vendorId
       */
      staff: (vendorId) => `/admin/vendors/${encodeURIComponent(vendorId)}/staff`,
      /**
       * Confirmed: PATCH /admin/vendors/:vendorId/staff/:staffId
       * @param {string} vendorId
       * @param {string} staffId
       */
      staffMember: (vendorId, staffId) =>
        `/admin/vendors/${encodeURIComponent(vendorId)}/staff/${encodeURIComponent(staffId)}`,
      /**
       * Confirmed: GET/PATCH /admin/vendors/:vendorId/delivery-zones
       * @param {string} vendorId
       */
      deliveryZones: (vendorId) =>
        `/admin/vendors/${encodeURIComponent(vendorId)}/delivery-zones`,
      /**
       * Confirmed: POST /admin/vendors/:vendorId/delivery-zones/apply-all
       * @param {string} vendorId
       */
      deliveryZonesApplyAll: (vendorId) =>
        `/admin/vendors/${encodeURIComponent(vendorId)}/delivery-zones/apply-all`,
      /**
       * Confirmed: PATCH /admin/vendors/:vendorId/delivery-zones/branches/:branchId
       * @param {string} vendorId
       * @param {string} branchId
       */
      deliveryZoneBranch: (vendorId, branchId) =>
        `/admin/vendors/${encodeURIComponent(vendorId)}/delivery-zones/branches/${encodeURIComponent(branchId)}`,
      /**
       * Confirmed: GET/PATCH /admin/vendors/:vendorId/commission
       * @param {string} vendorId
       */
      commission: (vendorId) =>
        `/admin/vendors/${encodeURIComponent(vendorId)}/commission`,
      /**
       * Confirmed: GET/POST /admin/vendors/:vendorId/promotions
       * @param {string} vendorId
       */
      promotions: (vendorId) =>
        `/admin/vendors/${encodeURIComponent(vendorId)}/promotions`,
      /**
       * Confirmed: GET/PATCH/DELETE /admin/vendors/:vendorId/promotions/:promotionId
       * @param {string} vendorId
       * @param {string} promotionId
       */
      promotion: (vendorId, promotionId) =>
        `/admin/vendors/${encodeURIComponent(vendorId)}/promotions/${encodeURIComponent(promotionId)}`,
      /**
       * Confirmed: GET/PATCH /admin/vendors/:vendorId/sla
       * @param {string} vendorId
       */
      sla: (vendorId) => `/admin/vendors/${encodeURIComponent(vendorId)}/sla`,
    },
    /**
     * Confirmed Store types — Postman folder 11.
     * List also used by Edit vendor Store type dropdown.
     */
    storeTypes: {
      /** Confirmed: GET /admin/store-types/summary */
      summary: '/admin/store-types/summary',
      /** Confirmed: GET /admin/store-types · POST /admin/store-types */
      list: '/admin/store-types',
      /**
       * Confirmed: GET + PATCH /admin/store-types/:storeTypeId
       * @param {string} storeTypeId
       */
      detail: (storeTypeId) => `/admin/store-types/${encodeURIComponent(storeTypeId)}`,
      /**
       * Confirmed: POST /admin/store-types/:storeTypeId/publish
       * @param {string} storeTypeId
       */
      publish: (storeTypeId) =>
        `/admin/store-types/${encodeURIComponent(storeTypeId)}/publish`,
      /**
       * Confirmed: POST /admin/store-types/:storeTypeId/draft
       * @param {string} storeTypeId
       */
      draft: (storeTypeId) =>
        `/admin/store-types/${encodeURIComponent(storeTypeId)}/draft`,
      /**
       * Confirmed menu categories under a store type.
       * @param {string} storeTypeId
       */
      menuCategories: (storeTypeId) =>
        `/admin/store-types/${encodeURIComponent(storeTypeId)}/menu-categories`,
      /**
       * Confirmed: PATCH + DELETE .../menu-categories/:menuCategoryId
       * @param {string} storeTypeId
       * @param {string} menuCategoryId
       */
      menuCategory: (storeTypeId, menuCategoryId) =>
        `/admin/store-types/${encodeURIComponent(storeTypeId)}/menu-categories/${encodeURIComponent(menuCategoryId)}`,
      /**
       * Confirmed: POST /admin/store-types/:storeTypeId/badges
       * @param {string} storeTypeId
       */
      badges: (storeTypeId) => `/admin/store-types/${encodeURIComponent(storeTypeId)}/badges`,
      /**
       * Confirmed: PATCH + DELETE .../badges/:badgeId
       * @param {string} storeTypeId
       * @param {string} badgeId
       */
      badge: (storeTypeId, badgeId) =>
        `/admin/store-types/${encodeURIComponent(storeTypeId)}/badges/${encodeURIComponent(badgeId)}`,
    },
    /**
     * Confirmed: GET /admin/sla-models
     * Used by Add vendor SLA model picker.
     */
    slaModels: {
      list: '/admin/sla-models',
    },
    /**
     * Confirmed Customers — Postman folder 08.
     */
    customers: {
      /** Confirmed: GET /admin/customers/summary */
      summary: '/admin/customers/summary',
      /** Confirmed: GET /admin/customers?search=&statusTab=all&limit=20 */
      list: '/admin/customers',
      /**
       * Confirmed: GET /admin/customers/:customerId
       * @param {string} customerId
       */
      detail: (customerId) => `/admin/customers/${encodeURIComponent(customerId)}`,
      /**
       * Confirmed: GET /admin/customers/:customerId/wallet?page=&limit=
       * @param {string} customerId
       */
      wallet: (customerId) => `/admin/customers/${encodeURIComponent(customerId)}/wallet`,
      /**
       * Confirmed: GET /admin/customers/:customerId/support?page=&limit=
       * @param {string} customerId
       */
      support: (customerId) => `/admin/customers/${encodeURIComponent(customerId)}/support`,
      /**
       * Confirmed: POST /admin/customers/:customerId/suspend
       * Body: { reason, duration, notifyCustomer }
       * @param {string} customerId
       */
      suspend: (customerId) => `/admin/customers/${encodeURIComponent(customerId)}/suspend`,
      /**
       * Confirmed: POST /admin/customers/:customerId/activate
       * @param {string} customerId
       */
      activate: (customerId) => `/admin/customers/${encodeURIComponent(customerId)}/activate`,
    },
    /**
     * Confirmed Users & Roles — admin panel staff accounts.
     * Postman folder: 02. Users & Roles
     */
    users: {
      /** Confirmed: GET /admin/users/summary */
      summary: '/admin/users/summary',
      /** Confirmed: GET /admin/users/meta (create-user meta / permissions modules) */
      meta: '/admin/users/meta',
      /** Confirmed: GET /admin/users?search=&page=1&limit=20 */
      list: '/admin/users',
      /** Confirmed: POST /admin/users — Create user (invite) */
      create: '/admin/users',
      /**
       * Confirmed: GET + PATCH /admin/users/:adminUserId
       * @param {string} userId
       */
      detail: (userId) => `/admin/users/${encodeURIComponent(userId)}`,
      /**
       * Confirmed: POST /admin/users/:id/reset-password body `{}`
       * @param {string} userId
       */
      resetPassword: (userId) =>
        `/admin/users/${encodeURIComponent(userId)}/reset-password`,
      /**
       * Confirmed: POST /admin/users/:id/resend-invite
       * @param {string} userId
       */
      resendInvite: (userId) =>
        `/admin/users/${encodeURIComponent(userId)}/resend-invite`,
      /**
       * Confirmed: POST /admin/users/:id/suspend
       * Pending invitations cannot be suspended (400).
       * @param {string} userId
       */
      suspend: (userId) => `/admin/users/${encodeURIComponent(userId)}/suspend`,
      /**
       * Confirmed: POST /admin/users/:id/unsuspend
       * @param {string} userId
       */
      unsuspend: (userId) => `/admin/users/${encodeURIComponent(userId)}/unsuspend`,
    },
    /**
     * Confirmed Users & Roles — roles.
     * Postman: Roles meta / List roles / Get role
     */
    roles: {
      /** Confirmed: GET /admin/roles/meta */
      meta: '/admin/roles/meta',
      /** Confirmed: GET /admin/roles + POST /admin/roles (create) */
      list: '/admin/roles',
      create: '/admin/roles',
      /**
       * Confirmed: GET + PATCH /admin/roles/:roleId
       * @param {string} roleId
       */
      detail: (roleId) => `/admin/roles/${encodeURIComponent(roleId)}`,
    },
    /**
     * Confirmed Users & Roles — activity log.
     * Postman: GET Activity log / Activity filters metadata / Export activity CSV
     */
    activity: {
      /** Confirmed: GET /admin/activity?search=&module=&actionType=&from=&to=&page=&limit= */
      list: '/admin/activity',
      /** Confirmed: GET /admin/activity/meta */
      meta: '/admin/activity/meta',
      /** Confirmed: GET /admin/activity/export?from=&to= → CSV text */
      export: '/admin/activity/export',
    },
    /**
     * Confirmed Fleet Management — champs.
     * Postman folder: 07. Fleet
     */
    fleet: {
      /** Confirmed: GET /admin/fleet/summary — Fleet KPI summary */
      summary: '/admin/fleet/summary',
      /**
       * Confirmed: GET /admin/fleet/champs?search=&statusTab=&vehicle=&tier=&category=&limit=
       * Confirmed: POST /admin/fleet/champs — create champ
       */
      champs: '/admin/fleet/champs',
      /**
       * Confirmed: GET + PATCH /admin/fleet/champs/:champId
       * @param {string} champId
       */
      champ: (champId) => `/admin/fleet/champs/${encodeURIComponent(champId)}`,
      /**
       * Confirmed: GET /admin/fleet/champs/:champId/earnings?from=&to=&limit=
       * @param {string} champId
       */
      champEarnings: (champId) =>
        `/admin/fleet/champs/${encodeURIComponent(champId)}/earnings`,
      /**
       * Confirmed: POST /admin/fleet/champs/:champId/suspend
       * Body: { reason, duration, note, notifyChamp }
       * @param {string} champId
       */
      champSuspend: (champId) =>
        `/admin/fleet/champs/${encodeURIComponent(champId)}/suspend`,
      /**
       * Confirmed: POST /admin/fleet/champs/:champId/unsuspend
       * @param {string} champId
       */
      champUnsuspend: (champId) =>
        `/admin/fleet/champs/${encodeURIComponent(champId)}/unsuspend`,
      /**
       * Confirmed: POST /admin/fleet/champs/:champId/terminate
       * Body: { reason, effectiveDate?, note? }
       * @param {string} champId
       */
      champTerminate: (champId) =>
        `/admin/fleet/champs/${encodeURIComponent(champId)}/terminate`,
      /**
       * Confirmed: POST /admin/fleet/champs/:champId/online
       * Body: { online: boolean }
       * Errors: 403 POD_CASH_OUTSTANDING when POD cash must be reconciled first
       * @param {string} champId
       */
      champOnline: (champId) =>
        `/admin/fleet/champs/${encodeURIComponent(champId)}/online`,
      /**
       * Confirmed: POST /admin/fleet/champs/:champId/reconcile-pod
       * Body: { note?: string }
       * @param {string} champId
       */
      champReconcilePod: (champId) =>
        `/admin/fleet/champs/${encodeURIComponent(champId)}/reconcile-pod`,
      /**
       * Confirmed: GET /admin/fleet/champs/:champId/documents
       * Also POST upsert document: { type, imageUrl, documentNumber?, expiryDate?, nationality? }
       * @param {string} champId
       */
      champDocuments: (champId) =>
        `/admin/fleet/champs/${encodeURIComponent(champId)}/documents`,
      /**
       * Confirmed: GET /admin/fleet/suppliers — list suppliers
       * Also POST create supplier.
       */
      suppliers: '/admin/fleet/suppliers',
      /**
       * Confirmed: GET /admin/fleet/suppliers/:supplierId?from=&to=
       * Supplier detail & performance
       * @param {string} supplierId
       */
      supplier: (supplierId) =>
        `/admin/fleet/suppliers/${encodeURIComponent(supplierId)}`,
      /**
       * Confirmed: POST /admin/fleet/notify — send/schedule champ notification
       * Body: { audience, type, title, body, push, sms, schedule, ... }
       */
      notify: '/admin/fleet/notify',
      /**
       * Confirmed: POST /admin/fleet/notify/estimate
       * Body: { audience, category?, zone?, champIds? }
       */
      notifyEstimate: '/admin/fleet/notify/estimate',
      /** Confirmed: GET /admin/fleet/notify/history */
      notifyHistory: '/admin/fleet/notify/history',
    },
    /**
     * Confirmed Marketing — Postman folder 12.
     */
    marketing: {
      notifications: {
        /** Confirmed: GET /admin/marketing/notifications?target=&status=&limit= */
        list: '/admin/marketing/notifications',
        /**
         * Confirmed: GET /admin/marketing/notifications/:notificationId
         * @param {string} notificationId
         */
        detail: (notificationId) =>
          `/admin/marketing/notifications/${encodeURIComponent(notificationId)}`,
        /** Confirmed: POST /admin/marketing/notifications — Send customer/vendor notification */
        send: '/admin/marketing/notifications',
        /** Confirmed: POST /admin/marketing/notifications/estimate */
        estimate: '/admin/marketing/notifications/estimate',
        /**
         * Confirmed: POST /admin/marketing/notifications/:notificationId/resend
         * @param {string} notificationId
         */
        resend: (notificationId) =>
          `/admin/marketing/notifications/${encodeURIComponent(notificationId)}/resend`,
        /**
         * Confirmed: DELETE /admin/marketing/notifications/:notificationId
         * @param {string} notificationId
         */
        remove: (notificationId) =>
          `/admin/marketing/notifications/${encodeURIComponent(notificationId)}`,
      },
      promoCodes: {
        /** Confirmed: GET /admin/marketing/promo-codes?status=&limit= (includes summary) */
        list: '/admin/marketing/promo-codes',
        /** Confirmed: POST /admin/marketing/promo-codes — Create promo code */
        create: '/admin/marketing/promo-codes',
      },
    },
    /**
     * Confirmed Settings — Postman folder 13.
     */
    settings: {
      /** Confirmed: GET /admin/settings — all settings + tabs */
      root: '/admin/settings',
      /** Confirmed: GET + PATCH /admin/settings/general */
      general: '/admin/settings/general',
      /** Confirmed: GET + PATCH /admin/settings/localization */
      localization: '/admin/settings/localization',
      /** Confirmed: GET + PATCH /admin/settings/notifications */
      notifications: '/admin/settings/notifications',
      /** Confirmed: GET + PATCH /admin/settings/security */
      security: '/admin/settings/security',
      /** Confirmed: GET /admin/settings/integrations */
      integrations: '/admin/settings/integrations',
      /** Confirmed: GET /admin/settings/meta */
      meta: '/admin/settings/meta',
      /** Confirmed: POST /admin/settings/reset */
      reset: '/admin/settings/reset',
    },
    /**
     * Confirmed Admin uploads.
     */
    uploads: {
      /** Confirmed: POST /admin/uploads/images (multipart field: file) → data.url */
      images: '/admin/uploads/images',
      /**
       * Fleet / champ images: POST /admin/uploads/fleet-images?category=documents|avatars|vehicle-photos
       * multipart field: file → data.url
       */
      fleetImages: '/admin/uploads/fleet-images',
    },
    /**
     * Confirmed UI Editor — Postman folder 17.
     */
    uiEditor: {
      /** Confirmed: GET /admin/ui-editor/apps */
      apps: '/admin/ui-editor/apps',
      /** Confirmed: GET /admin/ui-editor/screen-map?app=CUSTOMER|CHAMP */
      screenMap: '/admin/ui-editor/screen-map',
      /** Confirmed: GET /admin/ui-editor/placements?app=&screen= */
      placements: '/admin/ui-editor/placements',
      /** Confirmed: GET /admin/ui-editor/preview?app=&screen= */
      preview: '/admin/ui-editor/preview',
      /** Confirmed: POST /admin/ui-editor/publish */
      publish: '/admin/ui-editor/publish',
      /** Confirmed: GET /admin/ui-editor/catalog */
      catalog: '/admin/ui-editor/catalog',
      banners: {
        /** Confirmed: GET /admin/ui-editor/banners?app=&status= */
        list: '/admin/ui-editor/banners',
        /** Confirmed: GET /admin/ui-editor/banners/meta?app= */
        meta: '/admin/ui-editor/banners/meta',
        /** Confirmed: GET /admin/ui-editor/banners/targets?tapAction= */
        targets: '/admin/ui-editor/banners/targets',
        /** Confirmed: POST /admin/ui-editor/banners */
        create: '/admin/ui-editor/banners',
        /**
         * Confirmed: GET + PATCH + DELETE /admin/ui-editor/banners/:bannerId
         * @param {string} bannerId
         */
        detail: (bannerId) =>
          `/admin/ui-editor/banners/${encodeURIComponent(String(bannerId || '').trim())}`,
      },
      pages: {
        /** Confirmed: GET /admin/ui-editor/pages?status= */
        list: '/admin/ui-editor/pages',
        /** Confirmed: POST /admin/ui-editor/pages/ensure */
        ensure: '/admin/ui-editor/pages/ensure',
        /** Confirmed: GET + PUT /admin/ui-editor/pages/help */
        help: '/admin/ui-editor/pages/help',
        /** Confirmed: POST /admin/ui-editor/pages/help/publish */
        helpPublish: '/admin/ui-editor/pages/help/publish',
        /** Confirmed: POST /admin/ui-editor/pages/help/unpublish */
        helpUnpublish: '/admin/ui-editor/pages/help/unpublish',
      },
      home: {
        /** Confirmed: GET /admin/ui-editor/home */
        preview: '/admin/ui-editor/home',
        /** Confirmed: GET + POST /admin/ui-editor/home/categories */
        categories: '/admin/ui-editor/home/categories',
        /** Confirmed: PATCH /admin/ui-editor/home/categories/reorder */
        categoriesReorder: '/admin/ui-editor/home/categories/reorder',
        /**
         * Confirmed: PATCH /admin/ui-editor/home/categories/:categoryId
         * @param {string} categoryId
         */
        category: (categoryId) =>
          `/admin/ui-editor/home/categories/${encodeURIComponent(String(categoryId || '').trim())}`,
        /** Confirmed: POST /admin/ui-editor/home/categories/publish */
        categoriesPublish: '/admin/ui-editor/home/categories/publish',
      },
    },
    reports: {
      /**
       * Confirmed: GET /admin/reports/orders
       * Query: preset, page, limit, sort, search, status, sla
       * (+ optional mode, vendor, city, champ, payMethod, from, to when backend supports)
       */
      orders: '/admin/reports/orders',
      /** Confirmed: GET /admin/reports/orders/meta — filter option lists */
      ordersMeta: '/admin/reports/orders/meta',
      /** Confirmed: GET /admin/reports/orders/export?preset=&limit= → CSV */
      ordersExport: '/admin/reports/orders/export',
    },
  },
}

export default endpoints
