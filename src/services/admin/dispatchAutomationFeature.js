import { isAdminRealApiFeature } from '../../api/config'

/** Feature flag key for Automation Admin real API wiring (P2B). */
export const AUTOMATION_FEATURE = 'automation'

/**
 * Whether Automation screens should hit the real backend.
 * ON only when `automation` is listed in VITE_ADMIN_REAL_API_FEATURES.
 * Removing the flag restores mock screens even if VITE_ADMIN_USE_MOCK_API=false.
 */
export function isAutomationRealApi() {
  return isAdminRealApiFeature(AUTOMATION_FEATURE)
}

export function automationRequestOptions(options = {}) {
  return {
    ...options,
    scope: 'admin',
    feature: AUTOMATION_FEATURE,
  }
}
