import { useState } from 'react'
import {
  CreditCard,
  Flower2,
  Globe2,
  GripVertical,
  Headphones,
  Image as ImageIcon,
  LayoutGrid,
  Lightbulb,
  MapPin,
  MoreVertical,
  Package,
  Pill,
  Play,
  Plus,
  Search,
  Shirt,
  ShoppingBag,
  ShoppingCart,
  Smartphone,
  Sparkles,
  Store,
  UserRound,
  UtensilsCrossed,
  Wallet,
} from 'lucide-react'
import { cn } from '../../../components/admin/cn'
import AdminNewBannerModal from '../../../components/admin/AdminNewBannerModal'
import iconHouse from '../../../assets/icon-house.png'
import motoBike from '../../../assets/moto_bike.png'

const TABS = [
  { id: 'screen-map', label: 'Screen map' },
  { id: 'banners', label: 'Banners & ads' },
  { id: 'categories', label: 'Categories' },
]

const SLOT_TYPE_STYLE = {
  Scroll: 'bg-[#e3f2fd] text-[#1565c0]',
  Static: 'bg-[#f5f5f5] text-[#616161]',
  'Pop-up': 'bg-[#f3e8ff] text-[#6b21a8]',
}

const STATUS_STYLE = {
  Active: 'bg-[#e8f7ed] text-[#147940]',
  Scheduled: 'bg-[#fff3e0] text-[#e65100]',
  Draft: 'bg-[#eff2f0] text-[#637068]',
  Live: 'bg-[#e8f7ed] text-[#147940]',
}

const CUSTOMER_SCREENS = [
  {
    id: 'home',
    name: 'Home',
    iconSrc: iconHouse,
    slots: [
      { id: 'home_top', banners: 3, type: 'Scroll' },
      { id: 'home_mid', banners: 1, type: 'Static' },
      { id: 'home_below_picks', banners: 0, type: 'Static' },
    ],
  },
  {
    id: 'search',
    name: 'Search',
    Icon: Search,
    slots: [{ id: 'search_top', banners: 0, type: 'Static' }],
  },
  {
    id: 'store',
    name: 'Store page',
    Icon: Store,
    slots: [
      { id: 'store_top', banners: 1, type: 'Static' },
      { id: 'store_mid', banners: 0, type: 'Static' },
    ],
  },
  {
    id: 'category',
    name: 'Category page',
    Icon: LayoutGrid,
    slots: [{ id: 'category_top', banners: 1, type: 'Scroll' }],
  },
  {
    id: 'cart',
    name: 'Cart',
    Icon: ShoppingCart,
    slots: [{ id: 'cart_banner', banners: 1, type: 'Static' }],
  },
  {
    id: 'checkout',
    name: 'Checkout',
    Icon: CreditCard,
    slots: [{ id: 'checkout_banner', banners: 0, type: 'Static' }],
  },
  {
    id: 'orders',
    name: 'Orders',
    Icon: Package,
    slots: [{ id: 'orders_banner', banners: 1, type: 'Static' }],
  },
  {
    id: 'tracking',
    name: 'Tracking',
    Icon: MapPin,
    slots: [{ id: 'tracking_banner', banners: 0, type: 'Static' }],
  },
  {
    id: 'wallet',
    name: 'Wallet',
    Icon: Wallet,
    slots: [{ id: 'wallet_top', banners: 1, type: 'Scroll' }],
  },
  {
    id: 'account',
    name: 'Account',
    Icon: UserRound,
    slots: [{ id: 'account_promo', banners: 1, type: 'Static' }],
  },
  {
    id: 'global',
    name: 'Global',
    Icon: Globe2,
    slots: [{ id: 'app_open_popup', banners: 1, type: 'Pop-up' }],
  },
]

const CHAMP_SCREENS = [
  {
    id: 'champ-home',
    name: 'Champ home',
    iconSrc: iconHouse,
    slots: [
      { id: 'champ_home_top', banners: 2, type: 'Scroll' },
      { id: 'champ_home_mid', banners: 0, type: 'Static' },
    ],
  },
  {
    id: 'champ-orders',
    name: 'Active orders',
    Icon: Package,
    slots: [{ id: 'champ_orders_banner', banners: 1, type: 'Static' }],
  },
  {
    id: 'champ-earnings',
    name: 'Earnings',
    Icon: Wallet,
    slots: [{ id: 'champ_earnings_top', banners: 0, type: 'Scroll' }],
  },
  {
    id: 'champ-account',
    name: 'Account',
    Icon: UserRound,
    slots: [{ id: 'champ_account_promo', banners: 1, type: 'Static' }],
  },
  {
    id: 'champ-global',
    name: 'Global',
    Icon: Globe2,
    slots: [{ id: 'champ_app_open_popup', banners: 1, type: 'Pop-up' }],
  },
]

const BANNER_SCREEN_CHIPS = [
  { id: 'home', label: 'Home', Icon: null, iconSrc: iconHouse },
  { id: 'store', label: 'Store page', Icon: Store },
  { id: 'category', label: 'Category', Icon: LayoutGrid },
  { id: 'popup', label: 'Pop-up', Icon: Sparkles },
]

const BANNER_SLOTS_BY_SCREEN = {
  home: [
    {
      id: 'home-top',
      label: 'Home top · scroll banner',
      active: 3,
      showInPreview: true,
      previewLabel: 'Home top · scroll banner',
    },
    {
      id: 'between',
      label: 'Between sections',
      active: 2,
      showInPreview: true,
      previewLabel: 'Between sections',
    },
    {
      id: 'below',
      label: 'Below a section',
      active: 0,
      showInPreview: true,
      previewLabel: 'Below a section',
    },
    {
      id: 'popup',
      label: 'Pop-up ad (on open)',
      active: 1,
      showInPreview: false,
    },
  ],
  store: [
    {
      id: 'store-top',
      label: 'Store page top',
      active: 1,
      showInPreview: true,
      previewLabel: 'Store page top',
    },
    {
      id: 'store-mid',
      label: 'Store mid section',
      active: 0,
      showInPreview: true,
      previewLabel: 'Store mid section',
    },
  ],
  category: [
    {
      id: 'category-top',
      label: 'Category top · scroll',
      active: 1,
      showInPreview: true,
      previewLabel: 'Category top · scroll',
    },
  ],
  popup: [
    {
      id: 'popup-open',
      label: 'Pop-up ad (on open)',
      active: 1,
      showInPreview: true,
      previewLabel: 'Pop-up on app open',
    },
  ],
}

const PREVIEW_CATEGORIES = [
  { label: 'Grocery', Icon: ShoppingCart, color: 'bg-[#e8f5e9] text-[#2e7d32]' },
  { label: 'Food', Icon: UtensilsCrossed, color: 'bg-[#fff3e0] text-[#ef6c00]' },
  { label: 'Pharmacy', Icon: Pill, color: 'bg-[#e3f2fd] text-[#1565c0]' },
  { label: 'Beauty', Icon: Sparkles, color: 'bg-[#fce4ec] text-[#c2185b]' },
  { label: 'Fashion', Icon: Shirt, color: 'bg-[#ede7f6] text-[#7b1fa2]' },
  { label: 'Electronics', Icon: Headphones, color: 'bg-[#e0f7fa] text-[#00838f]' },
  { label: 'Flowers', Icon: Flower2, color: 'bg-[#f3e5f5] text-[#8e24aa]' },
  { label: 'Sports', Icon: ShoppingBag, color: 'bg-[#e8f5e9] text-[#558b2f]' },
]

const ALL_BANNERS = [
  {
    id: 'bnr-01',
    name: '🌙 Ramadan offers',
    type: 'Scroll',
    placement: 'Home top — carousel',
    status: 'Active',
    thumb: 'bg-[#e8f5e9]',
  },
  {
    id: 'bnr-02',
    name: '🎁 Eid gifts',
    type: 'Static',
    placement: 'Home between sections',
    status: 'Scheduled',
    thumb: 'bg-[#f3e8ff]',
  },
  {
    id: 'bnr-03',
    name: '🛍️ 50% first order',
    type: 'Pop-up',
    placement: 'Pop-up on app open',
    status: 'Active',
    thumb: 'bg-[#e8f5e9]',
  },
  {
    id: 'bnr-04',
    name: '💊 Pharmacy promo',
    type: 'Static',
    placement: 'Store page top',
    status: 'Active',
    thumb: 'bg-[#e3f2fd]',
  },
]

const HOME_CATEGORIES = [
  { id: 'cat-food', name: 'Food', emoji: '🍔' },
  { id: 'cat-dine', name: 'Dine In', emoji: '🍽️' },
  { id: 'cat-groceries', name: 'Groceries', emoji: '🛒' },
  { id: 'cat-pharmacy', name: 'Pharmacy', emoji: '💊' },
  { id: 'cat-cosmetics', name: 'Cosmetics', emoji: '💄' },
  { id: 'cat-gifts', name: 'Gifts', emoji: '🎁' },
  { id: 'cat-fashion', name: 'Fashion', emoji: '👕' },
  { id: 'cat-electronics', name: 'Electronics', emoji: '🎧' },
  { id: 'cat-vape', name: 'Vape', emoji: '💨' },
  { id: 'cat-jewelry', name: 'Jewelry', emoji: '💎' },
  { id: 'cat-stationery', name: 'Stationery', emoji: '✏️' },
  { id: 'cat-baby', name: 'Baby & Kids', emoji: '🧸' },
  { id: 'cat-sports', name: 'Sports', emoji: '⚽' },
  { id: 'cat-services', name: 'Services', emoji: '🧰' },
]

function screenSummary(screen) {
  const slots = screen.slots.length
  const banners = screen.slots.reduce((sum, slot) => sum + slot.banners, 0)
  return `${slots} slot${slots === 1 ? '' : 's'} · ${banners} banner${banners === 1 ? '' : 's'}`
}

function SlotTypeBadge({ type }) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 rounded-full px-2.5 py-[3px] text-[11px] font-semibold leading-none',
        SLOT_TYPE_STYLE[type] || SLOT_TYPE_STYLE.Static,
      )}
    >
      {type}
    </span>
  )
}

function ScreenIcon({ screen }) {
  if (screen.iconSrc) {
    return <img src={screen.iconSrc} alt="" className="h-[18px] w-[18px] object-contain" />
  }
  const Icon = screen.Icon
  return <Icon size={15} strokeWidth={2.1} className="text-[#2e7d32]" />
}

function PreviewButton({ size = 'md' }) {
  const compact = size === 'sm'
  return (
    <button
      type="button"
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#d5dbd6] bg-white font-bold text-[#1aa054] hover:bg-[#f8faf8]',
        compact ? 'h-[32px] px-3.5 text-[12px]' : 'h-[36px] px-4 text-[12.5px]',
      )}
    >
      <Play size={compact ? 11 : 12} className="fill-[#1aa054] text-[#1aa054]" />
      Preview
    </button>
  )
}

function ScreenCard({ screen, onAdd }) {
  const [open, setOpen] = useState(true)

  return (
    <section className="rounded-[14px] border border-[#eceeec] bg-white">
      <div className="flex items-center gap-2 px-3.5 py-3">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
          aria-expanded={open}
        >
          <span
            className={cn(
              'inline-block h-0 w-0 shrink-0 border-x-[4.5px] border-x-transparent border-t-[6px] border-t-[#5f6b64] transition-transform duration-150',
              open ? 'rotate-0' : '-rotate-90',
            )}
            aria-hidden
          />
          <div className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-[9px] bg-[#e8f5e9]">
            <ScreenIcon screen={screen} />
          </div>
          <div className="min-w-0">
            <h3 className="text-[15px] font-bold leading-tight text-[#1a1a1a]">{screen.name}</h3>
            <p className="mt-[3px] text-[12px] leading-none text-[#707070]">{screenSummary(screen)}</p>
          </div>
        </button>
        <PreviewButton size="sm" />
      </div>

      {open ? (
        <div className="relative ml-[19px] pb-3 pr-3.5">
          <span className="absolute bottom-4 left-0 top-0 w-[2px] rounded-full bg-[#c8e6c9]" aria-hidden />
          <div className="space-y-2 pl-5">
            {screen.slots.map((slot) => (
              <div
                key={slot.id}
                className="relative flex items-center gap-2 rounded-[12px] border border-[#e7ebe8] bg-white px-3.5 py-2.5"
              >
                <span
                  className="absolute -left-[23px] top-1/2 h-[7px] w-[7px] -translate-y-1/2 rounded-full bg-[#9e9e9e]"
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-bold leading-tight text-[#1a1a1a]">{slot.id}</p>
                  <p className="mt-[3px] text-[12px] leading-none text-[#707070]">
                    {slot.banners} banner{slot.banners === 1 ? '' : 's'}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <SlotTypeBadge type={slot.type} />
                  <button
                    type="button"
                    onClick={() => onAdd?.(slot.id)}
                    className="inline-flex h-[30px] items-center gap-1 rounded-full bg-[#e8f5e9] px-3 text-[12px] font-bold text-[#2e7d32] hover:bg-[#dcedc8]"
                  >
                    <Plus size={13} strokeWidth={2.8} />
                    Add
                  </button>
                  <button
                    type="button"
                    aria-label={`${slot.id} options`}
                    className="grid h-[30px] w-[28px] place-items-center rounded-full text-[#9e9e9e] hover:bg-[#f5f5f5] hover:text-[#616161]"
                  >
                    <MoreVertical size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  )
}

function PreviewSlot({ label, onAdd }) {
  return (
    <button
      type="button"
      onClick={() => onAdd?.(label)}
      className="flex w-full flex-col items-center justify-center rounded-[10px] border border-dashed border-[#81c784] bg-[#e8f5e9]/70 px-2 py-3 text-center hover:bg-[#e8f5e9]"
    >
      <span className="text-[12px] font-bold text-[#2e7d32]">+ Add banner here</span>
      <span className="mt-0.5 text-[10px] font-medium text-[#66a06a]">{label}</span>
    </button>
  )
}

function PhoneLivePreview({ slots, onAdd }) {
  const previewSlots = slots.filter((slot) => slot.showInPreview)

  return (
    <div className="mx-auto w-full max-w-[280px]">
      <div className="h-[720px] overflow-hidden rounded-[28px] border-[5px] border-[#1a1a1a] bg-white shadow-[0_12px_32px_rgba(20,40,28,.12)]">
        <div className="flex items-center justify-between bg-[#f7f8f7] px-4 py-2 text-[11px] font-semibold text-[#17231c]">
          <span>9:41</span>
          <span className="font-bold tracking-wide">Yjeek</span>
          <span className="inline-flex items-center gap-0.5 text-[10px]">
            <span className="h-[7px] w-[7px] rounded-full bg-[#17231c]/30" />
            <span className="h-[7px] w-[7px] rounded-full bg-[#17231c]/55" />
            <span className="h-[7px] w-[10px] rounded-[2px] bg-[#17231c]/80" />
          </span>
        </div>

        <div className="space-y-3 bg-[#fafbfa] p-3">
          {previewSlots[0] ? (
            <PreviewSlot label={previewSlots[0].previewLabel} onAdd={onAdd} />
          ) : null}

          <div className="grid grid-cols-4 gap-2">
            {PREVIEW_CATEGORIES.map((item) => {
              const Icon = item.Icon
              return (
                <div key={item.label} className="flex flex-col items-center gap-1">
                  <div className={cn('grid h-10 w-10 place-items-center rounded-[12px]', item.color)}>
                    <Icon size={16} strokeWidth={2} />
                  </div>
                  <span className="text-[9px] font-medium text-[#637068]">{item.label}</span>
                </div>
              )
            })}
          </div>

          {previewSlots[1] ? (
            <PreviewSlot label={previewSlots[1].previewLabel} onAdd={onAdd} />
          ) : null}

          <div>
            <p className="mb-2 text-[12px] font-bold text-[#17231c]">Top picks near you</p>
            <div className="space-y-2">
              <div className="h-11 rounded-[10px] bg-[#e8f5e9]" />
              <div className="h-11 rounded-[10px] bg-[#e8f5e9]" />
            </div>
          </div>

          {previewSlots[2] ? (
            <PreviewSlot label={previewSlots[2].previewLabel} onAdd={onAdd} />
          ) : null}
        </div>
      </div>
    </div>
  )
}

function BannersAdsTab({ platform, onAdd }) {
  const [screenId, setScreenId] = useState('home')
  const slots = BANNER_SLOTS_BY_SCREEN[screenId] || BANNER_SLOTS_BY_SCREEN.home

  return (
    <div className="space-y-3">
      <section className="rounded-[14px] border border-[#eceeec] bg-white p-4 max-[900px]:p-3">
        <div className="flex gap-8 max-[980px]:grid-cols-1">
          <div>
            <h3 className="text-[15px] font-bold text-[#17231c]">Live preview — point where to place</h3>
            <p className="mt-0.5 text-[12.5px] text-[#7c8780]">
              Tap a highlighted slot on the app to add a banner / ad there
            </p>
            <div className="mt-4 flex items-center justify-center">
              <PhoneLivePreview slots={slots} onAdd={onAdd} />
            </div>
          </div>

          <div className="flex min-w-0 flex-col">
            <div className="mb-3 flex flex-wrap gap-1.5">
              {BANNER_SCREEN_CHIPS.map((chip) => {
                const active = screenId === chip.id
                const Icon = chip.Icon
                return (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={() => setScreenId(chip.id)}
                    className={cn(
                      'inline-flex h-[34px] items-center gap-1.5 rounded-full border px-3 text-[12px] font-bold transition',
                      active
                        ? 'border-[#1aa054] bg-[#e8f7ed] text-[#137333]'
                        : 'border-[#e4e8e4] bg-white text-[#637068] hover:border-[#cfd6d1] hover:text-[#455249]',
                    )}
                  >
                    {chip.iconSrc ? (
                      <img src={chip.iconSrc} alt="" className="h-3.5 w-3.5 object-contain" />
                    ) : (
                      <Icon size={13} strokeWidth={2.2} />
                    )}
                    {chip.label}
                  </button>
                )
              })}
            </div>

            <h4 className="mb-2 text-[13px] font-bold text-[#17231c]">Slots on this screen</h4>
            <div className="space-y-2">
              {slots.map((slot) => (
                <div
                  key={slot.id}
                  className="flex items-center gap-2.5 rounded-[12px] border border-[#e7ebe8] bg-white px-3 py-2.5"
                >
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-[#eef2ef] text-[#637068]">
                    <ImageIcon size={16} strokeWidth={2} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-bold text-[#17231c]">{slot.label}</p>
                    <p className="mt-0.5 text-[12px] text-[#7c8780]">
                      {slot.active > 0 ? `${slot.active} active` : '0'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onAdd?.(slot.label)}
                    className="inline-flex h-[30px] shrink-0 items-center gap-1 rounded-full border border-[#1aa054] bg-white px-3 text-[12px] font-bold text-[#1aa054] hover:bg-[#e8f7ed]"
                  >
                    <Plus size={13} strokeWidth={2.8} />
                    Add
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-3 flex items-start gap-2 rounded-[10px] border border-[#f3e0a8] bg-[#fff8e1] px-3 py-2.5 text-[12px] text-[#9a6510]">
              <Lightbulb size={14} className="mt-0.5 shrink-0" />
              <p>
                Switch screens above (Store page / Category / Pop-up / Champ) to place banners there too.
                {platform === 'champ' ? ' Champ slots shown when Champ app is selected.' : null}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-[14px] border border-[#eceeec] bg-white">
        <div className="border-b border-[#edf0ee] px-4 py-3">
          <h3 className="text-[15px] font-bold text-[#17231c]">All banners & ads</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left">
            <thead>
              <tr className="border-b border-[#edf0ee] bg-[#f7f8f7]">
                {['Banner', 'Type', 'Placement', 'Status', ''].map((column) => (
                  <th
                    key={column || 'actions'}
                    className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.05em] text-[#8a948e]"
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ALL_BANNERS.map((banner) => (
                <tr key={banner.id} className="border-b border-[#edf0ee] last:border-b-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <span className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-[10px]', banner.thumb)}>
                        <ImageIcon size={15} className="text-[#637068]/70" />
                      </span>
                      <span className="text-[13px] font-semibold text-[#17231c]">{banner.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <SlotTypeBadge type={banner.type} />
                  </td>
                  <td className="px-4 py-3 text-[12.5px] text-[#455249]">{banner.placement}</td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'inline-flex rounded-full px-2.5 py-[3px] text-[11px] font-bold',
                        STATUS_STYLE[banner.status],
                      )}
                    >
                      {banner.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      aria-label={`${banner.name} options`}
                      className="grid h-8 w-8 place-items-center rounded-full text-[#9e9e9e] hover:bg-[#f5f5f5] hover:text-[#616161]"
                    >
                      <MoreVertical size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function CategoriesTab() {
  const [categories, setCategories] = useState(HOME_CATEGORIES)
  const [dragIndex, setDragIndex] = useState(null)

  const renameCategory = (id, name) => {
    setCategories((prev) => prev.map((item) => (item.id === id ? { ...item, name } : item)))
  }

  const createCategory = () => {
    const next = categories.length + 1
    setCategories((prev) => [
      ...prev,
      { id: `cat-new-${Date.now()}`, name: `Category ${next}`, emoji: '📦' },
    ])
  }

  const onDragStart = (index) => setDragIndex(index)

  const onDragOver = (event, index) => {
    event.preventDefault()
    if (dragIndex === null || dragIndex === index) return
    setCategories((prev) => {
      const next = [...prev]
      const [moved] = next.splice(dragIndex, 1)
      next.splice(index, 0, moved)
      return next
    })
    setDragIndex(index)
  }

  const onDragEnd = () => setDragIndex(null)

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_minmax(250px,300px)] items-start gap-5 max-[980px]:grid-cols-1">
      <section className="rounded-[14px] border border-[#eceeec] bg-white p-4">
        <div className="mb-3.5 flex flex-wrap items-start  gap-2">
          <div className="min-w-0">
            <h3 className="text-[16px] font-bold text-[#17231c]">Home categories</h3>
            <p className="mt-0.5 text-[12.5px] text-[#7c8780]">
              Drag to reorder · rename · hide. Order here = order on the app home grid.
            </p>
          </div>
          <button
            type="button"
            onClick={createCategory}
            className="inline-flex h-[36px] shrink-0 items-center gap-1 rounded-full bg-[#1aa054] px-4 text-[12.5px] font-bold text-white shadow-[0_1px_2px_rgba(20,40,28,.12)] hover:bg-[#158a47]"
          >
            <Plus size={14} strokeWidth={2.8} />
            Create category
          </button>
        </div>

        <div className="space-y-2">
          {categories.map((category, index) => (
            <div
              key={category.id}
              draggable
              onDragStart={() => onDragStart(index)}
              onDragOver={(event) => onDragOver(event, index)}
              onDragEnd={onDragEnd}
              className={cn(
                'flex items-center gap-2 rounded-[12px] bg-[#f3f5f4] px-2.5 py-2 w-fit ',
                dragIndex === index && 'ring-1 ring-[#1aa054] bg-[#eaf6ee]',
              )}
            >
              <button
                type="button"
                aria-label={`Reorder ${category.name}`}
                className="grid h-8 w-6 shrink-0 cursor-grab place-items-center text-[#b0b8b3] active:cursor-grabbing"
              >
                <GripVertical size={16} strokeWidth={2.2} />
              </button>
              <span className="w-7 shrink-0 text-[12px] font-bold text-[#8a948e]">#{index + 1}</span>
              <span className="grid h-8 w-8 shrink-0 place-items-center text-[18px] leading-none">
                {category.emoji}
              </span>
              <input
                value={category.name}
                onChange={(event) => renameCategory(category.id, event.target.value)}
                className="h-[38px] min-w-0 flex-1 rounded-[10px] border border-[#e4e8e4] bg-white px-3 text-[13px] font-semibold text-[#17231c] outline-none focus:border-[#1aa054]"
              />
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={createCategory}
          className="mt-3 flex h-[42px] w-full items-center justify-center gap-1.5 rounded-[12px] border border-[#1aa054] bg-white text-[13px] font-bold text-[#1aa054] hover:bg-[#e8f7ed]"
        >
          <Plus size={15} strokeWidth={2.6} />
          Create category
        </button>
      </section>

      <div className="flex justify-center pt-1 max-[980px]:order-first">
        <div className="w-full max-w-[248px]">
          <div className="overflow-hidden rounded-[32px] border-[6px] border-[#1c1c1c] bg-white shadow-[0_10px_28px_rgba(20,40,28,.1)]">
            <div className="relative flex items-center justify-center px-3.5 py-2 text-[11px] font-semibold text-[#17231c]">
              <span className="absolute left-3.5">9:41</span>
              <span className="font-bold tracking-wide">Yjeek</span>
            </div>

            <div className="px-3 pb-4 pt-1">
              <div className="mb-3 h-[34px] rounded-[10px] bg-[#f0f1f0]" />

              <div className="grid h-[520px] auto-rows-max grid-cols-4 content-start gap-2 ">
                {categories.map((category) => (
                  <div
                    key={`preview-${category.id}`}
                    className="flex aspect-square min-w-0 flex-col items-center justify-center gap-1 rounded-[12px] bg-[#f3f5f4] px-1 py-1"
                  >
                    <span className="text-[18px] leading-none">{category.emoji}</span>
                    <span className="w-full truncate text-center text-[9.5px] font-semibold leading-tight text-[#17231c]">
                      {category.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AdminUiEditorPage() {
  const [platform, setPlatform] = useState('customer')
  const [tab, setTab] = useState('banners')
  const [bannerModal, setBannerModal] = useState({ open: false, placement: '' })

  const screens = platform === 'customer' ? CUSTOMER_SCREENS : CHAMP_SCREENS

  const openBannerModal = (placement = '') => {
    setBannerModal({ open: true, placement: placement || '' })
  }

  const closeBannerModal = () => {
    setBannerModal({ open: false, placement: '' })
  }

  return (
    <div className="px-5 py-4 pb-8 max-[700px]:px-3">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center rounded-[10px] bg-[#e9ebe9] p-[3px]">
            <button
              type="button"
              onClick={() => setPlatform('customer')}
              className={cn(
                'inline-flex h-[32px] items-center gap-1.5 rounded-[8px] px-3 text-[12px] font-bold transition',
                platform === 'customer'
                  ? 'bg-white text-[#17231c] shadow-[0_1px_3px_rgba(20,40,28,.12)]'
                  : 'text-[#69756d] hover:text-[#455249]',
              )}
            >
              <Smartphone size={14} strokeWidth={2.1} />
              Customer app
            </button>
            <button
              type="button"
              onClick={() => setPlatform('champ')}
              className={cn(
                'inline-flex h-[32px] items-center gap-1.5 rounded-[8px] px-3 text-[12px] font-bold transition',
                platform === 'champ'
                  ? 'bg-white text-[#17231c] shadow-[0_1px_3px_rgba(20,40,28,.12)]'
                  : 'text-[#69756d] hover:text-[#455249]',
              )}
            >
              <img src={motoBike} alt="" className="h-4 w-4 object-contain" />
              Champ app
            </button>
          </div>
          <div>
            <h2 className="text-[20px] font-bold tracking-[-0.02em] text-[#17231c]">UI Editor</h2>
            <p className="mt-0.5 text-[12.5px] text-[#7c8780]">
              Banners, ads, categories & screens for the customer / champ app
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <PreviewButton />
          <button
            type="button"
            className="inline-flex h-[36px] items-center gap-1.5 rounded-full bg-[#1aa054] px-4 text-[12.5px] font-bold text-white shadow-[0_1px_2px_rgba(20,40,28,.15)] hover:bg-[#158a47]"
          >
            Publish
          </button>
        </div>
      </div>

      <div className="mb-3 flex items-center gap-1 rounded-[10px] bg-[#e8f0ea] p-[3px]">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={cn(
              'h-[34px] flex-1 rounded-[8px] px-3.5 text-[12.5px] font-bold transition',
              tab === item.id
                ? 'bg-[#1aa054] text-white shadow-[0_1px_2px_rgba(20,40,28,.15)]'
                : 'text-[#455249] hover:text-[#17231c]',
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'screen-map' ? (
        <>
          <div className="mb-3 flex items-start gap-2 rounded-[10px] border border-[#f3e0a8] bg-[#fff8e1] px-3.5 py-2.5 text-[12.5px] text-[#9a6510]">
            <Lightbulb size={15} className="mt-0.5 shrink-0" />
            <p>
              Each screen exposes fixed &quot;slots&quot;. Add or arrange banners/ads in any slot — schedule &amp; audience
              set per banner.
            </p>
          </div>

          <div className="space-y-3">
            {screens.map((screen) => (
              <ScreenCard key={screen.id} screen={screen} onAdd={openBannerModal} />
            ))}
          </div>
        </>
      ) : null}

      {tab === 'banners' ? <BannersAdsTab platform={platform} onAdd={openBannerModal} /> : null}

      {tab === 'categories' ? <CategoriesTab /> : null}

      <AdminNewBannerModal
        open={bannerModal.open}
        placement={bannerModal.placement}
        onClose={closeBannerModal}
      />
    </div>
  )
}
