/**
 * Admin services.
 *
 * Register confirmed paths in `endpoints.admin`, then add services here.
 * Keep other Admin screens on `adminService.js` + mockClient until each feature
 * is listed in `VITE_ADMIN_REAL_API_FEATURES`.
 */

export { adminAuthService } from './authService'
export { adminDashboardService } from './dashboardService'
export { adminOrderService } from './orderService'
export { adminIncidentService } from './incidentService'
export { adminChatService } from './chatService'
export { adminVendorService } from './vendorService'
export { adminUserService } from './userService'
