/**
 * Admin services (future).
 *
 * Do not invent Admin API contracts here. When Admin integration starts:
 * 1. Register real paths in src/api/endpoints.js → endpoints.admin
 * 2. Add services in this folder that call apiClient + endpoints.admin.*
 * 3. Add response mappers under src/mappers/admin/ only after inspecting samples
 * 4. Point pages at these services and set VITE_ADMIN_USE_MOCK_API=false
 *
 * Until then, the live Admin portal continues using:
 *   src/services/adminService.js + mockClient
 *
 * Example (future):
 *   import { apiClient } from '../../api/client'
 *   import { endpoints } from '../../api/endpoints'
 *   export const adminDashboardService = {
 *     getDashboard: (options) => apiClient.get(endpoints.admin.dashboard, options),
 *   }
 */

export {}
