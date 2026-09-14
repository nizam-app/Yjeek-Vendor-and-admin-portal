import { AutomationCallout } from './AutomationCallout'

/**
 * Unobtrusive banner for P2B gaps / reference fields.
 * Does not redesign buyer layout — uses existing AutomationCallout tones.
 */
export function AutomationGapBanner({ tone = 'amber', label, children, className }) {
  return (
    <AutomationCallout tone={tone} label={label} className={className || '!mx-0 mb-4'}>
      {children}
    </AutomationCallout>
  )
}
