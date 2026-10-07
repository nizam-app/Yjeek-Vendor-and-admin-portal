import { useNavigate } from 'react-router-dom'
import { cn } from './cn'

/** Shared Marketing hub tabs — keep IA aligned with OG Admin › Marketing. */
export const MARKETING_VIEW_TABS = [
  { id: 'notifications', label: 'Push', path: '/admin/marketing' },
  { id: 'promo-codes', label: 'Promo codes', path: '/admin/marketing/promo-codes' },
  { id: 'promo-categories', label: 'Promo categories', path: '/admin/marketing/promo-categories' },
  { id: 'geofence', label: 'Geofence offers', path: '/admin/marketing/geofence' },
  { id: 'cashback', label: 'Cashback', path: '/admin/marketing/cashback' },
  { id: 'referral', label: 'Referral', path: '/admin/marketing/referral' },
  { id: 'zood', label: 'Zoood', path: '/admin/marketing/zood' },
  { id: 'vouchers', label: 'Vouchers', path: '/admin/marketing/vouchers' },
  { id: 'campaigns', label: 'Campaigns', path: '/admin/marketing/campaigns' },
  { id: 'banners', label: 'Banners', path: '/admin/marketing/banners' },
  { id: 'spin-wheel', label: 'Spin Wheel', path: '/admin/marketing/spin-wheel' },
  { id: 'vendor-promotions', label: 'Vendor promotions', path: '/admin/marketing/vendor-promotions' },
  { id: 'segments', label: 'Segments', path: '/admin/marketing/segments' },
  { id: 'fraud', label: 'Fraud & Limits', path: '/admin/marketing/fraud' },
  { id: 'budget', label: 'Budget & Approval', path: '/admin/marketing/budget' },
]

/**
 * @param {{ active: 'notifications' | 'promo-codes' | 'promo-categories' | 'geofence' | 'cashback' | 'referral' | 'vouchers' | 'campaigns' | 'banners' | 'spin-wheel' | 'vendor-promotions' | 'segments' | 'fraud' | 'budget' }} props
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
