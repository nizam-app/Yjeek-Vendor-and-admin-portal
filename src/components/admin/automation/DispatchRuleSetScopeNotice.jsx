import { AutomationGapBanner } from './AutomationGapBanner'

/**
 * Clarifies interim Save Changes / Save Automation scope (DispatchRuleSet only).
 */
export function DispatchRuleSetScopeNotice({ className }) {
  return (
    <AutomationGapBanner
      tone="blue"
      label="Save scope — Dispatch Rules configuration only"
      className={className || '!mx-0 mb-4'}
    >
      <p>
        <strong>Save Changes</strong> updates the DispatchRuleSet <em>draft</em> only.{' '}
        <strong>Save Automation</strong> activates/publishes that draft (also resumes PAUSED).{' '}
        <strong>Pause / Rollback / Test Mode</strong> are Admin lifecycle controls on this rule set
        only. These actions do <strong>not</strong> publish SLA Models, Pay on Delivery, Vendor
        Status, Scheduled Tiers, or Champ Status settings, and do not enable stacking.
      </p>
    </AutomationGapBanner>
  )
}
