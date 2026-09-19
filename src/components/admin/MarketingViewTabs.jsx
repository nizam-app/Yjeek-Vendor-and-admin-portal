import { useNavigate } from 'react-router-dom'
import { cn } from './cn'

/** Shared Marketing hub tabs — keep IA aligned with OG Admin › Marketing. */
export const MARKETING_VIEW_TABS = [
  { id: 'notifications', label: 'Notifications', path: '/admin/marketing' },
  { id: 'promo-codes', label: 'Promo codes', path: '/admin/marketing/promo-codes' },
  { id: 'promo-categories', label: 'Promo categories', path: '/admin/marketing/promo-categories' },
  { id: 'geofence', label: 'Geofence offers', path: '/admin/marketing/geofence' },
  { id: 'cashback', label: 'Cashback', path: '/admin/marketing/cashback' },
  { id: 'referral', label: 'Referral', path: '/admin/marketing/referral' },
]

/**
 * @param {{ active: 'notifications' | 'promo-codes' | 'promo-categories' | 'geofence' | 'cashback' | 'referral' }} props
 */
export function MarketingViewTabs({ active }) {
  const navigate = useNavigate()

  return (
    <div className="mb-4 inline-flex flex-wrap items-center gap-1">
      {MARKETING_VIEW_TABS.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => navigate(item.path)}
          className={cn(
            'h-[34px] rounded-full px-4 text-[12.5px] font-bold transition',
            active === item.id
              ? 'bg-[#e8f7ed] text-[#1aa054]'
              : 'bg-white text-[#69756d] ring-1 ring-[#e4e8e4] hover:text-[#455249]',
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}
