import { NavLink } from 'react-router-dom'
import { cn } from '../cn'

export const AUTOMATION_TABS = [
  { id: 'dispatch-rules', label: 'Dispatch Rules', path: '/admin/automation/dispatch-rules' },
  { id: 'champ-scoring', label: 'Champ Scoring', path: '/admin/automation/champ-scoring' },
  { id: 'stacking', label: 'Stacking', path: '/admin/automation/stacking' },
  { id: 'radius-expansion', label: 'Radius Expansion', path: '/admin/automation/radius-expansion' },
  { id: 'vendor-status', label: 'Vendor Status', path: '/admin/automation/vendor-status' },
  { id: 'pay-on-delivery', label: 'Pay on Delivery', path: '/admin/automation/pay-on-delivery' },
  { id: 'scheduled-tiers', label: 'Scheduled Tiers', path: '/admin/automation/scheduled-tiers' },
  { id: 'champ-status', label: 'Champ Status', path: '/admin/automation/champ-status' },
  { id: 'audit-log', label: 'Audit Log', path: '/admin/automation/audit-log' },
]

export function AutomationTabNav({ className }) {
  return (
    <nav
      className={cn(
        'w-full max-w-full overflow-x-auto overscroll-x-contain touch-pan-x [-webkit-overflow-scrolling:touch]',
        className,
      )}
      aria-label="Automation sections"
    >
      <div className="flex min-w-max items-stretch gap-0 border-b border-[#e5e8e5]">
        {AUTOMATION_TABS.map((tab) => (
          <NavLink
            key={tab.id}
            to={tab.path}
            end
            className={({ isActive }) =>
              cn(
                'shrink-0 border-b-2 px-3.5 py-2.5 text-[12.5px] font-medium transition whitespace-nowrap',
                isActive
                  ? 'border-[#1aa054] text-[#147940]'
                  : 'border-transparent text-[#69756d] hover:text-[#455249]',
              )
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
