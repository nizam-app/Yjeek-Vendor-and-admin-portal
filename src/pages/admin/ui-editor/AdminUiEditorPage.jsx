import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ChevronDown,
  CreditCard,
  Eye,
  EyeOff,
  Flower2,
  Globe2,
  GripVertical,
  Headphones,
  Image as ImageIcon,
  ImageOff,
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
  Trash2,
  Upload,
  UserRound,
  UtensilsCrossed,
  Wallet,
  X,
} from 'lucide-react'
import { cn } from '../../../components/admin/cn'
import AdminMediaImage from '../../../components/admin/AdminMediaImage'
import AdminNewBannerModal, {
  BANNER_PLACEMENTS,
  CHAMP_AUDIENCES,
  CHAMP_TAP_ACTIONS,
} from '../../../components/admin/AdminNewBannerModal'
import { formatApiErrorMessage } from '../../../api/errors'
import {
  useAdminUiEditorApps,
  useAdminUiEditorBanners,
  useAdminUiEditorHomeCategories,
  useAdminUiEditorPlacements,
  useAdminUiEditorScreenMap,
} from '../../../hooks/admin/useAdminUiEditor'
import { useExclusiveOffersEditor } from '../../../hooks/admin/useExclusiveOffersEditor'
import { useApiMutation } from '../../../hooks/useApiMutation'
import {
  ADMIN_IMAGE_UPLOAD_ACCEPT,
  ADMIN_IMAGE_UPLOAD_MAX_BYTES,
  adminUploadService,
  validateAdminImageFile,
} from '../../../services/admin/uploadService'
import { adminUiEditorService } from '../../../services/admin/uiEditorService'
import {
  EXCLUSIVE_OFFERS_SLOT_ID,
  injectExclusiveOffersSlot,
} from '../../../mappers/admin/mapAdminUiEditor'
import ExclusiveOffersTab from '../../../components/admin/ui-editor/ExclusiveOffersTab'
import ExclusiveOffersSlotPanel from '../../../components/admin/ui-editor/ExclusiveOffersSlotPanel'
import AddExclusiveProductsModal from '../../../components/admin/ui-editor/AddExclusiveProductsModal'
import iconHouse from '../../../assets/icon-house.png'
import motoBike from '../../../assets/moto_bike.png'

const TABS = [
  { id: 'screen-map', label: 'Screen map' },
  { id: 'banners', label: 'Banners & ads' },
  { id: 'categories', label: 'Categories' },
  { id: 'exclusive-offers', label: 'Exclusive offers' },
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
  Expired: 'bg-[#fdecea] text-[#c62828]',
  Inactive: 'bg-[#eff2f0] text-[#637068]',
}

const CUSTOMER_SCREENS = [
  {
    id: 'home',
    name: 'Home Screen',
    iconSrc: iconHouse,
    slots: [
      {
        id: 'home_top',
        label: 'Home top - scroll banner',
        banners: 3,
        type: 'Scroll',
        displayType: 'Scroll',
      },
      {
        id: 'home_mid',
        label: 'Between sections',
        banners: 1,
        type: 'Static',
        displayType: 'Static',
      },
      {
        id: 'home_exclusive_offers',
        label: 'Super Exclusive offers',
        banners: 0,
        type: 'Scroll',
        displayType: 'Scroll',
        slotKind: 'exclusive-offers',
      },
      {
        id: 'home_below_picks',
        label: 'Below a section',
        banners: 0,
        type: 'Static',
        displayType: 'Static',
      },
    ],
  },
  {
    id: 'search',
    name: 'Search Screen',
    Icon: Search,
    slots: [
      {
        id: 'search_top',
        label: 'Search top',
        banners: 0,
        type: 'Static',
        displayType: 'Static',
      },
    ],
  },
  {
    id: 'store',
    name: 'Store page',
    Icon: Store,
    slots: [
      {
        id: 'store_top',
        label: 'Store page top',
        banners: 1,
        type: 'Static',
        displayType: 'Static',
      },
      {
        id: 'store_mid',
        label: 'Store mid section',
        banners: 0,
        type: 'Static',
        displayType: 'Static',
      },
    ],
  },
  {
    id: 'category',
    name: 'Category page',
    Icon: LayoutGrid,
    slots: [
      {
        id: 'category_top',
        label: 'Category top · scroll',
        banners: 1,
        type: 'Scroll',
        displayType: 'Scroll',
      },
    ],
  },
  {
    id: 'cart',
    name: 'Cart',
    Icon: ShoppingCart,
    slots: [
      {
        id: 'cart_banner',
        label: 'Cart banner',
        banners: 1,
        type: 'Static',
        displayType: 'Static',
      },
    ],
  },
  {
    id: 'checkout',
    name: 'Checkout',
    Icon: CreditCard,
    slots: [
      {
        id: 'checkout_banner',
        label: 'Checkout banner',
        banners: 0,
        type: 'Static',
        displayType: 'Static',
      },
    ],
  },
  {
    id: 'orders',
    name: 'Orders',
    Icon: Package,
    slots: [
      {
        id: 'orders_banner',
        label: 'Orders banner',
        banners: 1,
        type: 'Static',
        displayType: 'Static',
      },
    ],
  },
  {
    id: 'tracking',
    name: 'Tracking',
    Icon: MapPin,
    slots: [
      {
        id: 'tracking_banner',
        label: 'Tracking banner',
        banners: 0,
        type: 'Static',
        displayType: 'Static',
      },
    ],
  },
  {
    id: 'wallet',
    name: 'Wallet',
    Icon: Wallet,
    slots: [
      {
        id: 'wallet_top',
        label: 'Wallet top · scroll',
        banners: 1,
        type: 'Scroll',
        displayType: 'Scroll',
      },
    ],
  },
  {
    id: 'account',
    name: 'Account',
    Icon: UserRound,
    slots: [
      {
        id: 'account_promo',
        label: 'Account promo',
        banners: 1,
        type: 'Static',
        displayType: 'Static',
      },
    ],
  },
  {
    id: 'global',
    name: 'Global',
    Icon: Globe2,
    slots: [
      {
        id: 'app_open_popup',
        label: 'Pop-up ad (on open)',
        banners: 1,
        type: 'Pop-up',
        displayType: 'Pop-up',
      },
    ],
  },
]

const CHAMP_SCREENS = [
  {
    id: 'home',
    name: 'Champ home',
    iconSrc: iconHouse,
    slots: [
      {
        id: 'champ_home_top',
        label: 'Champ home top · scroll',
        banners: 0,
        type: 'Scroll',
        displayType: 'Scroll',
      },
      {
        id: 'champ_home_mid',
        label: 'Champ home mid',
        banners: 0,
        type: 'Static',
        displayType: 'Static',
      },
    ],
  },
  {
    id: 'jobs',
    name: 'Jobs',
    Icon: Package,
    slots: [
      {
        id: 'champ_orders_banner',
        label: 'Jobs banner',
        banners: 0,
        type: 'Static',
        displayType: 'Static',
      },
    ],
  },
  {
    id: 'earnings',
    name: 'Earnings',
    Icon: Wallet,
    slots: [
      {
        id: 'champ_earnings_banner',
        label: 'Earnings top · scroll',
        banners: 0,
        type: 'Scroll',
        displayType: 'Scroll',
      },
    ],
  },
  {
    id: 'global',
    name: 'Global',
    Icon: Globe2,
    slots: [
      {
        id: 'champ_app_open_popup',
        label: 'Pop-up ad (on open)',
        banners: 0,
        type: 'Pop-up',
        displayType: 'Pop-up',
      },
    ],
  },
]

const CHAMP_BANNER_SCREEN_CHIPS = [
  { id: 'home', label: 'Home', iconSrc: iconHouse },
  { id: 'jobs', label: 'Jobs', Icon: Package },
  { id: 'earnings', label: 'Earnings', Icon: Wallet },
  { id: 'global', label: 'Pop-up', Icon: Sparkles },
]

const CHAMP_BANNER_SLOTS_BY_SCREEN = {
  home: [
    {
      id: 'champ_home_top',
      label: 'Champ home top · scroll',
      active: 0,
      showInPreview: true,
      previewLabel: 'Champ home top · scroll',
    },
    {
      id: 'champ_home_mid',
      label: 'Champ home mid',
      active: 0,
      showInPreview: true,
      previewLabel: 'Champ home mid',
    },
  ],
  orders: [
    {
      id: 'champ_orders_banner',
      label: 'Jobs banner',
      active: 0,
      showInPreview: true,
      previewLabel: 'Jobs banner',
    },
  ],
  jobs: [
    {
      id: 'champ_orders_banner',
      label: 'Jobs banner',
      active: 0,
      showInPreview: true,
      previewLabel: 'Jobs banner',
    },
  ],
  earnings: [
    {
      id: 'champ_earnings_banner',
      label: 'Earnings top · scroll',
      active: 0,
      showInPreview: true,
      previewLabel: 'Earnings top · scroll',
    },
  ],
  global: [
    {
      id: 'champ_app_open_popup',
      label: 'Pop-up ad (on open)',
      active: 0,
      showInPreview: true,
      previewLabel: 'Pop-up on app open',
    },
  ],
}

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

/** Offline mock seeds when UI Editor API is off — taxonomy-aligned (no Vape/TEST). */
const HOME_CATEGORIES = [
  { id: 'he-food', name: 'Food', iconUrl: null, kind: 'STORE_TYPE', refId: 'st-food', slug: 'food', code: 'ST-1001' },
  { id: 'he-dine-in', name: 'Dine In', iconUrl: null, kind: 'ORDER_MODE', refId: 'om-dine-in', slug: 'dine_in', code: 'OM-2003' },
  { id: 'he-pickup', name: 'Pickup', iconUrl: null, kind: 'ORDER_MODE', refId: 'om-pickup', slug: 'pickup', code: 'OM-2002' },
  { id: 'he-groceries', name: 'Groceries', iconUrl: null, kind: 'STORE_TYPE', refId: 'st-grocery', slug: 'grocery', code: 'ST-1003' },
  { id: 'he-pharmacy', name: 'Pharmacy', iconUrl: null, kind: 'STORE_TYPE', refId: 'st-pharmacy', slug: 'pharmacy', code: 'ST-1004' },
  { id: 'he-cosmetics', name: 'Cosmetics', iconUrl: null, kind: 'STORE_TYPE', refId: 'st-cosmetics', slug: 'cosmetics', code: 'ST-1002' },
  { id: 'he-gifts', name: 'Gifts', iconUrl: null, kind: 'STORE_TYPE', refId: 'st-gifts', slug: 'gifts', code: 'ST-1008' },
  { id: 'he-fashion', name: 'Fashion', iconUrl: null, kind: 'STORE_TYPE', refId: 'st-fashion', slug: 'fashion', code: 'ST-1006' },
  { id: 'he-electronics', name: 'Electronics', iconUrl: null, kind: 'STORE_TYPE', refId: 'st-electronics', slug: 'electronics', code: 'ST-1007' },
  { id: 'he-jewelry', name: 'Jewelry', iconUrl: null, kind: 'STORE_TYPE', refId: 'st-jewelry', slug: 'jewelry', code: 'ST-1009' },
  { id: 'he-services', name: 'Services', iconUrl: null, kind: 'STORE_TYPE', refId: 'st-services', slug: 'services', code: 'ST-1005', structure: 'TWO_LEVEL' },
]

function humanizeKey(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim()
}

function slotDisplayLabel(slot) {
  const raw = String(slot?.label || slot?.id || '').trim()
  if (!raw) return 'Slot'
  if (raw === slot?.id || /^[a-z0-9_-]+$/i.test(raw)) return humanizeKey(raw)
  return raw
}

function slotBannerCount(slot) {
  return Number(slot?.bannerCount ?? slot?.banners ?? slot?.slotBanners?.length ?? 0)
}

function slotActiveCount(slot) {
  if (slot?.activeCount != null || slot?.active != null) {
    return Number(slot.activeCount ?? slot.active ?? 0)
  }
  const nested = Array.isArray(slot?.slotBanners) ? slot.slotBanners : []
  return nested.filter((banner) => banner?.isActive).length
}

function resolveBannerStatus(banner) {
  const raw =
    banner?.status ||
    banner?.statusKey ||
    banner?.state ||
    banner?.raw?.status ||
    banner?.raw?.statusKey ||
    banner?.raw?.state ||
    ''
  const normalized = String(raw).trim().toLowerCase()
  if (normalized === 'active' || normalized === 'live' || normalized === 'published') return 'Active'
  if (normalized === 'scheduled') return 'Scheduled'
  if (normalized === 'draft') return 'Draft'
  if (normalized === 'expired') return 'Expired'
  if (normalized === 'inactive' || normalized === 'paused' || normalized === 'disabled') {
    return 'Inactive'
  }
  if (raw && typeof raw === 'string' && /^[A-Z][a-z]+/.test(raw.trim())) {
    return raw.trim()
  }
  if (banner?.isActive === true) return 'Active'
  if (banner?.isActive === false) return 'Expired'
  return 'Draft'
}

function statusDotClass(status) {
  if (status === 'Active' || status === 'Live') return 'bg-[#1aa054]'
  if (status === 'Expired') return 'bg-[#ef5350]'
  if (status === 'Scheduled') return 'bg-[#fb8c00]'
  if (status === 'Draft' || status === 'Inactive') return 'bg-[#9e9e9e]'
  return 'bg-[#9e9e9e]'
}

function toEditableBanner(banner, slot) {
  if (!banner?.id) return null
  const status = resolveBannerStatus(banner)
  return {
    id: banner.id,
    name: banner.title || banner.name || 'Banner',
    type: banner.bannerType || banner.type || slot?.displayType || slot?.type,
    imageUrl: banner.imageUrl || '',
    placement: slotDisplayLabel(slot),
    placementKey: slot?.id || banner.placementKey || '',
    isActive: status === 'Active',
    status,
    raw: banner.raw || banner,
  }
}

function isExclusiveOffersSlot(slot) {
  return slot?.slotKind === 'exclusive-offers' || slot?.id === EXCLUSIVE_OFFERS_SLOT_ID
}

function formatExclusiveBhd(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return '0.000'
  return n.toFixed(3)
}

function exclusiveSlotCount(slot) {
  if (Array.isArray(slot.exclusiveItems) && slot.exclusiveItems.length > 0) {
    return slot.exclusiveItems.length
  }
  return Number(slot.bannerCount ?? slot.banners ?? 0)
}

function exclusiveSlotLiveCount(slot) {
  if (Array.isArray(slot.exclusiveItems) && slot.exclusiveItems.length > 0) {
    return slot.exclusiveItems.filter((item) => item.liveOnCustomer).length
  }
  return Number(slot.activeCount ?? slot.active ?? 0)
}

function screenSummary(screen) {
  const slots =
    screen.slotCount != null
      ? Number(screen.slotCount)
      : Array.isArray(screen.slots)
        ? screen.slots.length
        : 0
  const banners =
    screen.bannerTotal != null
      ? Number(screen.bannerTotal)
      : Array.isArray(screen.slots)
        ? screen.slots.reduce((sum, slot) => sum + slotBannerCount(slot), 0)
        : 0
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
  const byId = {
    home: null,
    search: Search,
    store: Store,
    category: LayoutGrid,
    cart: ShoppingCart,
    checkout: CreditCard,
    orders: Package,
    tracking: MapPin,
    wallet: Wallet,
    account: UserRound,
    global: Sparkles,
    popup: Sparkles,
  }
  if (screen.id === 'home' || screen.iconSrc === iconHouse) {
    return <img src={iconHouse} alt="" className="h-[18px] w-[18px] object-contain" />
  }
  const Icon = screen.Icon || byId[screen.id] || LayoutGrid
  return <Icon size={15} strokeWidth={2.1} className="text-[#2e7d32]" />
}

function PreviewButton({ size = 'md', onClick, loading, disabled }) {
  const compact = size === 'sm'
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#d5dbd6] bg-white font-bold text-[#1aa054] hover:bg-[#f8faf8] disabled:cursor-not-allowed disabled:opacity-60',
        compact ? 'h-[32px] px-3.5 text-[12px]' : 'h-[36px] px-4 text-[12.5px]',
      )}
    >
      <Play size={compact ? 11 : 12} className="fill-[#1aa054] text-[#1aa054]" />
      {loading ? 'Loading…' : 'Preview'}
    </button>
  )
}

function PreviewModal({ open, onClose, preview, error }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6" role="dialog" aria-modal="true">
      <button type="button" className="absolute inset-0 bg-[rgba(26,28,26,0.45)]" aria-label="Close preview" onClick={onClose} />
      <div className="relative w-full max-w-[520px] rounded-[14px] bg-white p-5 shadow-[0_18px_40px_rgba(26,28,26,0.18)]">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="text-[16px] font-bold text-[#17231c]">
            {preview?.title ? `Preview · ${preview.title}` : 'Screen preview'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-[8px] text-[#8a948e] hover:bg-[#f7f9f7]"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {error ? (
          <p className="text-[13px] text-[#c91a24]">{error.message || 'Unable to load preview.'}</p>
        ) : null}

        {preview ? (
          <div className="space-y-3 text-[13px] text-[#455249]">
            <p>
              <span className="font-semibold text-[#17231c]">App:</span> {preview.app || '—'}
              {' · '}
              <span className="font-semibold text-[#17231c]">Screen:</span> {preview.screen || '—'}
            </p>
            {preview.previewUrl ? (
              <a
                href={preview.previewUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex text-[#1aa054] underline"
              >
                Open preview link
              </a>
            ) : null}
            {preview.message ? <p>{preview.message}</p> : null}
            <p className="text-[12px] text-[#8a948e]">
              {preview.placements?.length || 0} placement
              {(preview.placements?.length || 0) === 1 ? '' : 's'}
              {' · '}
              {preview.banners?.length || 0} banner
              {(preview.banners?.length || 0) === 1 ? '' : 's'}
              {preview.exclusiveOffers?.length
                ? ` · ${preview.exclusiveOffers.length} exclusive offer product${
                    preview.exclusiveOffers.length === 1 ? '' : 's'
                  }`
                : ''}
            </p>
            {preview.exclusiveOffers?.length > 0 ? (
              <div className="rounded-[10px] border border-[#edf0ee] p-3">
                <p className="mb-2 text-[12px] font-bold text-[#17231c]">
                  {preview.exclusiveOffersSection?.title || 'Super Exclusive offers'}
                </p>
                <ul className="max-h-[160px] space-y-1.5 overflow-auto">
                  {preview.exclusiveOffers.map((item) => (
                    <li key={item.id} className="flex items-center justify-between gap-2 text-[12px]">
                      <span className="truncate font-medium text-[#17231c]">{item.title}</span>
                      <span className="shrink-0 text-[#137333]">
                        BHD {formatExclusiveBhd(item.offerPrice)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {preview.banners?.length > 0 ? (
              <ul className="max-h-[220px] space-y-1.5 overflow-auto rounded-[10px] border border-[#edf0ee] p-3">
                {preview.banners.map((banner) => (
                  <li key={banner.id} className="flex items-center justify-between gap-2">
                    <span className="truncate font-medium text-[#17231c]">{banner.name}</span>
                    <span className="shrink-0 text-[11px] text-[#8a948e]">{banner.status}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : !error ? (
          <p className="text-[13px] text-[#8a948e]">Loading preview…</p>
        ) : null}
      </div>
    </div>
  )
}

function SlotActionMenu({ menuId, setMenuId, itemId, label, canEdit, canDelete, onEdit, onDelete }) {
  const open = menuId === itemId

  return (
    <div className="relative">
      <button
        type="button"
        aria-label={`${label} options`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(event) => {
          event.stopPropagation()
          setMenuId(open ? null : itemId)
        }}
        className="grid h-[30px] w-[28px] place-items-center rounded-full text-[#9e9e9e] hover:bg-[#f5f5f5] hover:text-[#616161]"
      >
        <MoreVertical size={16} />
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute top-[calc(100%+4px)] right-0 z-50 w-[140px] overflow-hidden rounded-[10px] border border-[#e4e8e4] bg-white py-1 shadow-[0_10px_24px_rgba(20,40,28,.14)]"
          onClick={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            role="menuitem"
            disabled={!canEdit}
            className="flex w-full px-3.5 py-2.5 text-left text-[13px] font-medium text-[#17231c] hover:bg-[#f6f8f6] disabled:cursor-not-allowed disabled:opacity-40"
            onClick={() => {
              setMenuId(null)
              if (canEdit) onEdit?.()
            }}
          >
            Edit
          </button>
          <button
            type="button"
            role="menuitem"
            disabled={!canDelete}
            className="flex w-full px-3.5 py-2.5 text-left text-[13px] font-medium text-[#c91a24] hover:bg-[#fff5f5] disabled:cursor-not-allowed disabled:opacity-40"
            onClick={() => {
              setMenuId(null)
              if (canDelete) onDelete?.()
            }}
          >
            Delete
          </button>
        </div>
      ) : null}
    </div>
  )
}

function CollapseChevron({ open }) {
  return (
    <span
      className={cn(
        'inline-block h-0 w-0 shrink-0 border-x-[4.5px] border-x-transparent border-t-[6px] border-t-[#5f6b64] transition-transform duration-150',
        open ? 'rotate-0' : '-rotate-90',
      )}
      aria-hidden
    />
  )
}

function normalizePlacementKey(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[—–-]/g, '_')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .trim()
}

function enrichScreensWithBanners(screens, banners = []) {
  const list = Array.isArray(banners) ? banners : []

  return (screens || []).map((screen) => {
    const slots = (screen.slots || []).map((slot) => {
      const fromNested = Array.isArray(slot.slotBanners) ? slot.slotBanners : []
      const slotKey = normalizePlacementKey(slot.id)
      const slotLabelKey = normalizePlacementKey(slot.label || slotDisplayLabel(slot))

      const fromList = list.filter((banner) => {
        const placementKey = normalizePlacementKey(banner.placementKey || banner.raw?.placementKey)
        const placement = normalizePlacementKey(banner.placement)
        return (
          placementKey === slotKey ||
          placement === slotKey ||
          placement === slotLabelKey ||
          placementKey === slotLabelKey
        )
      })

      const byId = new Map()
      for (const banner of fromNested) {
        if (!banner?.id) continue
        const status = resolveBannerStatus(banner)
        byId.set(banner.id, {
          id: banner.id,
          title: banner.title || banner.name || 'Banner',
          bannerType: banner.bannerType || banner.type || slot.displayType || slot.type || 'Static',
          status,
          isActive: status === 'Active',
          imageUrl: banner.imageUrl || '',
          raw: banner.raw || banner,
        })
      }
      for (const banner of fromList) {
        if (!banner?.id) continue
        const prev = byId.get(banner.id)
        const status = resolveBannerStatus({
          ...prev,
          ...banner,
          status: banner.status || prev?.status,
          statusKey: banner.statusKey || banner.raw?.statusKey,
          isActive: banner.isActive,
        })
        byId.set(banner.id, {
          id: banner.id,
          title: banner.name || banner.title || prev?.title || 'Banner',
          bannerType: banner.type || prev?.bannerType || slot.displayType || slot.type || 'Static',
          status,
          isActive: status === 'Active',
          imageUrl: banner.imageUrl || prev?.imageUrl || '',
          raw: banner.raw || banner,
        })
      }

      const slotBanners = [...byId.values()]
      const bannerCount = Math.max(slotBannerCount(slot), slotBanners.length)
      const activeCount = Math.max(
        slotActiveCount(slot),
        slotBanners.filter((item) => item.status === 'Active').length,
      )

      return {
        ...slot,
        label: slotDisplayLabel(slot),
        slotBanners,
        banners: bannerCount,
        bannerCount,
        active: activeCount,
        activeCount,
      }
    })

    const bannerTotal = slots.reduce((sum, slot) => sum + slotBannerCount(slot), 0)
    return {
      ...screen,
      slots,
      slotCount: screen.slotCount ?? slots.length,
      bannerTotal: Math.max(Number(screen.bannerTotal || 0), bannerTotal),
    }
  })
}

function ScreenCard({ screen, onAdd, onEdit, onDelete, onPreview, previewLoading, onAddExclusive, exclusiveEditor }) {
  const [open, setOpen] = useState(true)
  const [openSlots, setOpenSlots] = useState(() => {
    const initial = {}
    for (const slot of screen.slots || []) {
      initial[slot.id] = true
    }
    return initial
  })
  const [menuId, setMenuId] = useState(null)
  const rootRef = useRef(null)

  useEffect(() => {
    setOpenSlots((prev) => {
      const next = { ...prev }
      for (const slot of screen.slots || []) {
        if (next[slot.id] == null) next[slot.id] = true
      }
      return next
    })
  }, [screen.slots])

  useEffect(() => {
    if (!menuId) return undefined
    const onPointerDown = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setMenuId(null)
      }
    }
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setMenuId(null)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [menuId])

  const toggleSlot = (slotId) => {
    setOpenSlots((prev) => ({ ...prev, [slotId]: !prev[slotId] }))
  }

  return (
    <section ref={rootRef} className="rounded-[14px] border border-[#eceeec] bg-white">
      <div className="flex items-center gap-2 px-3.5 py-3">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
          aria-expanded={open}
        >
          <CollapseChevron open={open} />
          <div className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-[9px] bg-[#e8f5e9]">
            <ScreenIcon screen={screen} />
          </div>
          <div className="min-w-0">
            <h3 className="text-[15px] font-bold leading-tight text-[#1a1a1a]">{screen.name}</h3>
            <p className="mt-[3px] text-[12px] leading-none text-[#707070]">{screenSummary(screen)}</p>
          </div>
        </button>
        <PreviewButton
          size="sm"
          loading={previewLoading}
          onClick={() => onPreview?.(screen.id || 'home')}
        />
      </div>

      {open ? (
        <div className="relative ml-5 pb-3 pr-3.5">
          <span
            className="absolute bottom-3 left-[7px] top-0 w-px bg-[#d5ddd7]"
            aria-hidden
          />
          <div className="space-y-1">
            {(screen.slots || []).map((slot) => {
              const nestedBanners = Array.isArray(slot.slotBanners) ? slot.slotBanners : []
              const exclusiveItems = Array.isArray(slot.exclusiveItems) ? slot.exclusiveItems : []
              const exclusive = isExclusiveOffersSlot(slot)
              const count = exclusive ? exclusiveSlotCount(slot) : slotBannerCount(slot)
              const active = exclusive ? exclusiveSlotLiveCount(slot) : slotActiveCount(slot)
              const primaryBanner = toEditableBanner(nestedBanners[0], slot)
              const slotLabel = slotDisplayLabel(slot)
              const slotMenuKey = `slot:${slot.id}`
              const slotOpen = openSlots[slot.id] !== false

              return (
                <div key={slot.id} className="relative">
                  <div className="flex items-center gap-2 py-2 pl-1 pr-1">
                    <button
                      type="button"
                      onClick={() => toggleSlot(slot.id)}
                      className="flex min-w-0 flex-1 items-center gap-2 text-left"
                      aria-expanded={slotOpen}
                    >
                      <CollapseChevron open={slotOpen} />
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-bold leading-tight text-[#1a1a1a]">
                          {slotLabel}
                        </p>
                        <p className="mt-[3px] text-[12px] leading-none text-[#707070]">
                          {exclusive
                            ? `${count} product${count === 1 ? '' : 's'}${active > 0 ? ` · ${active} live` : ''}`
                            : `${count} banner${count === 1 ? '' : 's'}${active > 0 ? ` · ${active} active` : ''}`}
                        </p>
                      </div>
                    </button>
                    <div className="flex shrink-0 items-center gap-2">
                      <SlotTypeBadge type={slot.displayType || slot.type} />
                      <button
                        type="button"
                        onClick={() =>
                          exclusive
                            ? onAddExclusive?.()
                            : onAdd?.({
                                placement: slotLabel,
                                placementKey: slot.id,
                              })
                        }
                        className="inline-flex h-[30px] items-center gap-1 rounded-full bg-[#e8f5e9] px-3 text-[12px] font-bold text-[#2e7d32] hover:bg-[#dcedc8]"
                      >
                        <Plus size={13} strokeWidth={2.8} />
                        Add
                      </button>
                      {!exclusive ? (
                        <SlotActionMenu
                          menuId={menuId}
                          setMenuId={setMenuId}
                          itemId={slotMenuKey}
                          label={slotLabel}
                          canEdit={Boolean(primaryBanner)}
                          canDelete={Boolean(primaryBanner)}
                          onEdit={() => onEdit?.(primaryBanner)}
                          onDelete={() => onDelete?.(primaryBanner)}
                        />
                      ) : null}
                    </div>
                  </div>

                  {slotOpen && exclusive && exclusiveEditor ? (
                    <div className="relative ml-[11px] border-l border-[#d5ddd7] pb-2 pl-4">
                      <ExclusiveOffersSlotPanel
                        variant="compact"
                        section={exclusiveEditor.section}
                        items={exclusiveEditor.items}
                        summary={exclusiveEditor.summary}
                        busy={exclusiveEditor.busy}
                        dragIndex={exclusiveEditor.dragIndex}
                        onSectionChange={exclusiveEditor.handleSectionChange}
                        onSectionToggle={exclusiveEditor.handleSectionToggle}
                        onAdd={onAddExclusive}
                        onDragStart={exclusiveEditor.onDragStart}
                        onDragOver={exclusiveEditor.onDragOver}
                        onDragEnd={exclusiveEditor.onDragEnd}
                        onToggleVisible={exclusiveEditor.handleToggleVisible}
                        onPriceChange={exclusiveEditor.handlePriceChange}
                        onTitleChange={exclusiveEditor.handleTitleChange}
                        onImageChange={exclusiveEditor.handleImageChange}
                        onRemove={exclusiveEditor.handleRemove}
                      />
                    </div>
                  ) : null}

                  {slotOpen && !exclusive && nestedBanners.length > 0 ? (
                    <div className="relative ml-[11px] space-y-0.5 border-l border-[#d5ddd7] pb-1 pl-4">
                      {nestedBanners.map((banner) => {
                        const editable = toEditableBanner(banner, slot)
                        const bannerMenuKey = `banner:${banner.id}`
                        const typeLabel =
                          banner.bannerType || slot.displayType || slot.type || 'Static'
                        const status = resolveBannerStatus(banner)
                        return (
                          <div
                            key={banner.id}
                            className="flex items-center gap-2.5 rounded-[10px] px-1.5 py-2 hover:bg-[#f7f9f7]"
                          >
                            <span
                              className={cn(
                                'h-[7px] w-[7px] shrink-0 rounded-full',
                                statusDotClass(status),
                              )}
                              aria-hidden
                            />
                            {banner.imageUrl ? (
                              <AdminMediaImage
                                src={banner.imageUrl}
                                className="h-9 w-9 shrink-0 rounded-[8px] object-cover"
                                fallbackClassName="h-9 w-9 shrink-0 rounded-[8px] bg-[#eceeec]"
                                iconSize={14}
                              />
                            ) : (
                              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[8px] bg-[#eceeec]">
                                <ImageIcon size={14} className="text-[#9e9e9e]" />
                              </span>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[13px] font-semibold text-[#17231c]">
                                {banner.title || banner.name || 'Banner'}
                              </p>
                              <p className="mt-0.5 text-[11.5px] text-[#8a948e]">
                                {typeLabel} · {status}
                              </p>
                            </div>
                            <SlotActionMenu
                              menuId={menuId}
                              setMenuId={setMenuId}
                              itemId={bannerMenuKey}
                              label={banner.title || banner.name || 'Banner'}
                              canEdit={Boolean(editable)}
                              canDelete={Boolean(editable)}
                              onEdit={() => onEdit?.(editable)}
                              onDelete={() => onDelete?.(editable)}
                            />
                          </div>
                        )
                      })}
                    </div>
                  ) : null}
                </div>
              )
            })}
          </div>
        </div>
      ) : null}
    </section>
  )
}

function PreviewSlot({ label, placementKey, onAdd, onEdit, banner }) {
  const hasBanner = Boolean(banner?.imageUrl || banner?.name || banner?.title)

  const handleSlotClick = () => {
    if (banner?.id && hasBanner) {
      onEdit?.(banner)
      return
    }
    onAdd?.({ placement: label, placementKey: placementKey || '' })
  }

  const handleAddAnother = (event) => {
    event.stopPropagation()
    onAdd?.({ placement: label, placementKey: placementKey || '' })
  }

  return (
    <button
      type="button"
      onClick={handleSlotClick}
      className={cn(
        'relative flex w-full flex-col items-center overflow-hidden rounded-[10px] border border-dashed border-[#81c784] text-center hover:bg-[#e8f5e9]',
        hasBanner
          ? banner?.imageUrl
            ? 'min-h-[112px] justify-end border-solid bg-[#e8f5e9]'
            : 'min-h-[72px] justify-center border-solid bg-[#e8f5e9]'
          : 'justify-center bg-[#e8f5e9]/70 px-2 py-3',
      )}
    >
      {banner?.imageUrl ? (
        <AdminMediaImage
          src={banner.imageUrl}
          className="absolute inset-0 h-full w-full object-cover"
          fallbackClassName="absolute inset-0 h-full w-full"
          iconSize={18}
        />
      ) : null}
      {hasBanner ? (
        <span
          className={cn(
            'relative z-[1] flex w-full flex-col items-center gap-0.5 px-2 py-2',
            banner?.imageUrl && 'mt-auto bg-gradient-to-t from-black/25 to-transparent pt-6',
          )}
        >
          <span
            className={cn(
              'line-clamp-1 text-[11px] font-bold',
              banner?.imageUrl ? 'text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.65)]' : 'text-[#137333]',
            )}
          >
            {banner.name || banner.title}
          </span>
          {banner.subtitle ? (
            <span
              className={cn(
                'line-clamp-1 text-[9px]',
                banner?.imageUrl ? 'text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.55)]' : 'text-[#66a06a]',
              )}
            >
              {banner.subtitle}
            </span>
          ) : null}
          <span
            role="button"
            tabIndex={0}
            onClick={handleAddAnother}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                handleAddAnother(event)
              }
            }}
            className={cn(
              'mt-0.5 text-[9px] font-semibold underline-offset-2 hover:underline',
              banner?.imageUrl ? 'text-white/95 drop-shadow-[0_1px_2px_rgba(0,0,0,0.55)]' : 'text-[#2e7d32]',
            )}
          >
            + Add another
          </span>
        </span>
      ) : (
        <>
          <span className="text-[12px] font-bold text-[#2e7d32]">+ Add banner here</span>
          <span className="mt-0.5 text-[10px] font-medium text-[#66a06a]">{label}</span>
        </>
      )}
    </button>
  )
}

function normalizeChampPreviewScreenId(screenId) {
  const key = String(screenId || 'home').toLowerCase()
  if (key === 'orders') return 'jobs'
  return key
}

function bannerForPreviewSlot(slot, banners = []) {
  if (slot?.slotBanners?.length) {
    return slot.slotBanners.find((banner) => banner.imageUrl) || slot.slotBanners[0]
  }
  if (!slot?.id) return null
  const matches = banners.filter(
    (banner) =>
      banner.placementKey === slot.id ||
      normalizePlacementKey(banner.placementKey) === normalizePlacementKey(slot.id),
  )
  if (!matches.length) return null
  return matches.find((banner) => banner.imageUrl) || matches[0]
}

function ChampPhoneLivePreview({ screenId = 'home', slots, onAdd, onEdit, banners = [] }) {
  const previewScreenId = normalizeChampPreviewScreenId(screenId)
  const previewSlots = slots.filter((slot) => slot.showInPreview !== false)

  const bannerForSlot = (slot) => bannerForPreviewSlot(slot, banners)

  const topSlot = previewSlots[0] || null
  const midSlot = previewSlots[1] || null

  return (
    <div className="mx-auto w-full max-w-[280px]">
      <div className="h-[720px] overflow-hidden rounded-[28px] border-[5px] border-[#1a1a1a] bg-white shadow-[0_12px_32px_rgba(20,40,28,.12)]">
        <div className="flex items-center justify-between bg-[#f7f8f7] px-4 py-2 text-[11px] font-semibold text-[#17231c]">
          <span>9:41</span>
          <span className="font-bold tracking-wide">Champ</span>
          <span className="inline-flex items-center gap-0.5 text-[10px]">
            <span className="h-[7px] w-[7px] rounded-full bg-[#17231c]/30" />
            <span className="h-[7px] w-[7px] rounded-full bg-[#17231c]/55" />
            <span className="h-[7px] w-[10px] rounded-[2px] bg-[#17231c]/80" />
          </span>
        </div>

        <div className="space-y-3 bg-[#fafbfa] p-3">
          {previewScreenId === 'home' ? (
            <>
              {topSlot ? (
                <PreviewSlot
                  label={topSlot.previewLabel || topSlot.label}
                  placementKey={topSlot.id}
                  banner={bannerForSlot(topSlot)}
                  onAdd={onAdd}
                  onEdit={onEdit}
                />
              ) : null}
              <div className="rounded-[12px] border border-[#e7ebe8] bg-white px-3 py-2 text-[10px] text-[#7c8780]">
                Scheduled orders · map · status cards
              </div>
              <div className="h-[120px] rounded-[12px] bg-[#e8edf0]" />
              {midSlot ? (
                <PreviewSlot
                  label={midSlot.previewLabel || midSlot.label}
                  placementKey={midSlot.id}
                  banner={bannerForSlot(midSlot)}
                  onAdd={onAdd}
                  onEdit={onEdit}
                />
              ) : null}
              <div className="rounded-[12px] border border-[#e7ebe8] bg-white p-2">
                <p className="text-[10px] font-bold text-[#17231c]">Today&apos;s summary</p>
                <div className="mt-2 grid grid-cols-3 gap-1">
                  <div className="h-8 rounded-[8px] bg-[#eef2ef]" />
                  <div className="h-8 rounded-[8px] bg-[#eef2ef]" />
                  <div className="h-8 rounded-[8px] bg-[#eef2ef]" />
                </div>
              </div>
              <div className="h-10 rounded-full bg-[#1aa054]" />
            </>
          ) : null}

          {previewScreenId === 'jobs' ? (
            <>
              {topSlot ? (
                <PreviewSlot
                  label={topSlot.previewLabel || topSlot.label}
                  placementKey={topSlot.id}
                  banner={bannerForSlot(topSlot)}
                  onAdd={onAdd}
                  onEdit={onEdit}
                />
              ) : null}
              <div className="flex rounded-full bg-[#edf0ed] p-1">
                <span className="flex-1 rounded-full bg-white py-1.5 text-center text-[10px] font-bold text-[#17231c]">
                  Instant
                </span>
                <span className="flex-1 py-1.5 text-center text-[10px] font-medium text-[#7c8780]">
                  Scheduled
                </span>
              </div>
              <div className="rounded-[12px] border border-[#c8e6c9] bg-white p-3">
                <p className="text-[10px] font-bold text-[#137333]">ON THE WAY</p>
                <p className="mt-1 text-[11px] font-bold text-[#17231c]">Active delivery card</p>
                <p className="mt-1 text-[10px] text-[#7c8780]">Live order data (not a banner)</p>
              </div>
            </>
          ) : null}

          {previewScreenId === 'earnings' ? (
            <>
              <div className="flex rounded-full bg-[#edf0ed] p-1">
                <span className="flex-1 py-1.5 text-center text-[10px] font-medium text-[#7c8780]">Today</span>
                <span className="flex-1 rounded-full bg-white py-1.5 text-center text-[10px] font-bold text-[#17231c]">
                  This week
                </span>
                <span className="flex-1 py-1.5 text-center text-[10px] font-medium text-[#7c8780]">Month</span>
              </div>
              {topSlot ? (
                <PreviewSlot
                  label={topSlot.previewLabel || topSlot.label}
                  placementKey={topSlot.id}
                  banner={bannerForSlot(topSlot)}
                  onAdd={onAdd}
                  onEdit={onEdit}
                />
              ) : null}
              <div className="rounded-[12px] bg-[#1b5e3b] p-3 text-white">
                <p className="text-[10px] opacity-80">This week · earnings</p>
                <p className="text-[18px] font-bold">BHD 0.000</p>
              </div>
              <div className="rounded-[10px] bg-[#fff8e1] px-2 py-2 text-[9px] text-[#9a6510]">
                Earnings breakdown (live data)
              </div>
            </>
          ) : null}

          {previewScreenId === 'global' ? (
            <div className="relative flex h-[560px] items-center justify-center rounded-[12px] bg-[#eef2ef]">
              <p className="text-[11px] font-medium text-[#7c8780]">App home (dimmed)</p>
              {topSlot ? (
                <div className="absolute inset-x-4 top-1/2 -translate-y-1/2">
                  <PreviewSlot
                    label={topSlot.previewLabel || topSlot.label}
                    placementKey={topSlot.id}
                    banner={bannerForSlot(topSlot)}
                    onAdd={onAdd}
                  onEdit={onEdit}
                  />
                </div>
              ) : null}
            </div>
          ) : null}

          {!['home', 'jobs', 'earnings', 'global'].includes(previewScreenId) && previewSlots.length > 0
            ? previewSlots.map((slot) => (
                <PreviewSlot
                  key={slot.id}
                  label={slot.previewLabel || slot.label}
                  placementKey={slot.id}
                  banner={bannerForSlot(slot)}
                  onAdd={onAdd}
                  onEdit={onEdit}
                />
              ))
            : null}
        </div>
      </div>
    </div>
  )
}

function PhoneLivePreview({
  platform = 'customer',
  screenId = 'home',
  slots,
  onAdd,
  onEdit,
  banners = [],
  exclusiveSection,
  exclusiveItems = [],
  onAddExclusive,
}) {
  if (platform === 'champ') {
    return (
      <ChampPhoneLivePreview
        screenId={screenId}
        slots={slots}
        onAdd={onAdd}
        onEdit={onEdit}
        banners={banners}
      />
    )
  }

  const previewSlots = slots.filter((slot) => slot.showInPreview !== false && !isExclusiveOffersSlot(slot))
  const visibleExclusive = exclusiveItems.filter((item) => item.isVisible)
  const showExclusive =
    exclusiveSection?.isVisible !== false && visibleExclusive.length > 0
  const hiddenExclusiveCount = exclusiveItems.length - visibleExclusive.length

  const bannerForSlot = (slot) => {
    const fromSlot = bannerForPreviewSlot(slot, banners)
    if (fromSlot) return fromSlot
    if (!slot?.id) return null
    const matches = banners.filter(
      (banner) =>
        banner.placementKey === slot.id ||
        (banner.placement &&
          slot.label &&
          String(banner.placement).toLowerCase().replace(/[—–-]/g, '·') ===
            String(slot.label).toLowerCase().replace(/[—–-]/g, '·')),
    )
    if (!matches.length) return null
    return matches.find((banner) => banner.imageUrl) || matches[0]
  }

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
            <PreviewSlot
              label={previewSlots[0].previewLabel || previewSlots[0].label}
              placementKey={previewSlots[0].id}
              banner={bannerForSlot(previewSlots[0])}
              onAdd={onAdd}
              onEdit={onEdit}
            />
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
            <PreviewSlot
              label={previewSlots[1].previewLabel || previewSlots[1].label}
              placementKey={previewSlots[1].id}
              banner={bannerForSlot(previewSlots[1])}
              onAdd={onAdd}
              onEdit={onEdit}
            />
          ) : null}

          <div>
            <p className="mb-2 text-[12px] font-bold text-[#17231c]">Top picks near you</p>
            <div className="space-y-2">
              <div className="h-11 rounded-[10px] bg-[#e8f5e9]" />
              <div className="h-11 rounded-[10px] bg-[#e8f5e9]" />
            </div>
          </div>

          {showExclusive ? (
            <div>
              <p className="mb-2 text-[12px] font-bold text-[#17231c]">
                {exclusiveSection?.title || 'Super Exclusive offers'}
              </p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {visibleExclusive.map((item) => (
                  <div
                    key={item.id}
                    className="w-[88px] shrink-0 rounded-[10px] border border-[#c8e6c9] bg-white p-1.5"
                  >
                    {item.imageUrl ? (
                      <AdminMediaImage
                        src={item.imageUrl}
                        className="mb-1 h-[48px] w-full rounded-[8px] object-cover"
                        fallbackClassName="mb-1 h-[48px] w-full rounded-[8px] bg-[#eceeec]"
                        iconSize={14}
                      />
                    ) : (
                      <div className="mb-1 grid h-[48px] w-full place-items-center rounded-[8px] bg-[#eceeec] text-[#8a948e]">
                        <Package size={14} />
                      </div>
                    )}
                    <p className="line-clamp-2 text-[9px] font-semibold leading-tight text-[#17231c]">
                      {item.title}
                    </p>
                    <p className="mt-0.5 text-[9.5px] font-bold text-[#137333]">
                      BHD {formatExclusiveBhd(item.offerPrice)}
                    </p>
                  </div>
                ))}
              </div>
              {hiddenExclusiveCount > 0 ? (
                <p className="mt-1.5 text-[10px] font-medium text-[#8a948e]">
                  {hiddenExclusiveCount} hidden from carousel
                </p>
              ) : null}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onAddExclusive?.()}
              className="flex w-full flex-col items-center justify-center rounded-[10px] border border-dashed border-[#81c784] bg-[#e8f5e9]/70 px-2 py-3 text-center hover:bg-[#e8f5e9]"
            >
              <span className="text-[12px] font-bold text-[#2e7d32]">+ Add products here</span>
              <span className="mt-0.5 text-[10px] font-medium text-[#66a06a]">
                {exclusiveSection?.title || 'Super Exclusive offers'}
              </span>
            </button>
          )}

          {previewSlots[2] ? (
            <PreviewSlot
              label={previewSlots[2].previewLabel || previewSlots[2].label}
              placementKey={previewSlots[2].id}
              banner={bannerForSlot(previewSlots[2])}
              onAdd={onAdd}
              onEdit={onEdit}
            />
          ) : null}
        </div>
      </div>
    </div>
  )
}

function MobilePreviewModal({
  open,
  onClose,
  platform,
  screenId,
  screenChips = [],
  onScreenChange,
  slots,
  banners,
  onAdd,
  onEdit,
  exclusiveSection,
  exclusiveItems,
  onAddExclusive,
}) {
  if (!open) return null

  const appLabel = platform === 'champ' ? 'Champ app' : 'Customer app'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true">
      <button
        type="button"
        className="absolute inset-0 bg-[rgba(26,28,26,0.5)]"
        aria-label="Close preview"
        onClick={onClose}
      />
      <div className="relative flex max-h-[95vh] w-full max-w-[420px] flex-col overflow-hidden rounded-[16px] bg-white shadow-[0_18px_40px_rgba(26,28,26,0.2)]">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[#eceeec] px-4 py-3">
          <div>
            <h3 className="text-[15px] font-bold text-[#17231c]">Mobile preview</h3>
            <p className="text-[12px] text-[#7c8780]">
              {appLabel} · reflects your current banner changes
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-[8px] text-[#8a948e] hover:bg-[#f7f9f7]"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {screenChips.length > 0 ? (
          <div className="flex shrink-0 flex-wrap gap-1.5 border-b border-[#eceeec] px-4 py-2.5">
            {screenChips.map((chip) => {
              const active = screenId === chip.id
              const Icon = chip.Icon
              return (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => onScreenChange?.(chip.id)}
                  className={cn(
                    'inline-flex h-[30px] items-center gap-1 rounded-full border px-2.5 text-[11px] font-bold transition',
                    active
                      ? 'border-[#1aa054] bg-[#e8f7ed] text-[#137333]'
                      : 'border-[#e4e8e4] bg-white text-[#637068] hover:border-[#cfd6d1]',
                  )}
                >
                  {chip.iconSrc ? (
                    <img src={chip.iconSrc} alt="" className="h-3 w-3 object-contain" />
                  ) : Icon ? (
                    <Icon size={12} strokeWidth={2.2} />
                  ) : null}
                  {chip.label}
                </button>
              )
            })}
          </div>
        ) : null}

        <div className="overflow-y-auto px-4 py-5">
          <p className="mb-3 text-center text-[11.5px] text-[#7c8780]">
            Tap a banner to edit · empty slot to add
          </p>
          <PhoneLivePreview
            platform={platform}
            screenId={screenId}
            slots={slots}
            banners={banners}
            onAdd={onAdd}
            onEdit={onEdit}
            exclusiveSection={exclusiveSection}
            exclusiveItems={exclusiveItems}
            onAddExclusive={onAddExclusive}
          />
        </div>
      </div>
    </div>
  )
}

function BannersAdsTab({
  appKey,
  platform,
  onAdd,
  onEdit,
  onDelete,
  onScreenChange,
  bannersRefreshKey = 0,
  exclusiveEditor,
  onAddExclusive,
  mobilePreviewOpen = false,
  onMobilePreviewClose,
}) {
  const [screenId, setScreenId] = useState('home')
  const [menuId, setMenuId] = useState(null)
  const [openSlots, setOpenSlots] = useState({})
  const {
    slots: apiSlots,
    isLoading: placementsLoading,
    error: placementsError,
    refetch: refetchPlacements,
  } = useAdminUiEditorPlacements(appKey, screenId)
  const {
    banners: apiBanners,
    isLoading: bannersLoading,
    error: bannersError,
    refetch: refetchBanners,
    enabled: bannersEnabled,
  } = useAdminUiEditorBanners(appKey)

  useEffect(() => {
    if (bannersRefreshKey > 0) {
      refetchBanners()
      refetchPlacements()
    }
  }, [bannersRefreshKey, refetchBanners, refetchPlacements])

  useEffect(() => {
    setScreenId(platform === 'champ' ? 'home' : 'home')
    setOpenSlots({})
    setMenuId(null)
  }, [platform, appKey])

  const screenChips = useMemo(
    () => (platform === 'champ' ? CHAMP_BANNER_SCREEN_CHIPS : BANNER_SCREEN_CHIPS),
    [platform],
  )

  useEffect(() => {
    if (!screenChips.some((chip) => chip.id === screenId)) {
      setScreenId(screenChips[0]?.id || 'home')
    }
  }, [screenChips, screenId])

  useEffect(() => {
    onScreenChange?.(screenId)
  }, [screenId, onScreenChange])

  const slotFallback =
    platform === 'champ'
      ? CHAMP_BANNER_SLOTS_BY_SCREEN[screenId] || CHAMP_BANNER_SLOTS_BY_SCREEN.home
      : BANNER_SLOTS_BY_SCREEN[screenId] || BANNER_SLOTS_BY_SCREEN.home
  const slots = apiSlots.length > 0 ? apiSlots : slotFallback
  const rawBanners = bannersEnabled
    ? apiBanners
    : platform === 'champ'
      ? apiBanners
      : apiBanners.length > 0
        ? apiBanners
        : ALL_BANNERS
  const banners = useMemo(() => {
    const app = String(appKey || 'CUSTOMER').toUpperCase()
    return rawBanners.filter((banner) => !banner.appTarget || banner.appTarget === app)
  }, [rawBanners, appKey])
  const exclusiveSection = exclusiveEditor?.section
  const exclusiveItems = exclusiveEditor?.items ?? []

  const slotsWithBanners = useMemo(() => {
    const normalizePlacement = (value) =>
      String(value || '')
        .toLowerCase()
        .replace(/[—–-]/g, '·')
        .replace(/\s+/g, ' ')
        .trim()

    const mapped = slots.map((slot) => {
      const matched = banners.filter(
        (banner) =>
          banner.placementKey === slot.id ||
          normalizePlacementKey(banner.placementKey) === normalizePlacementKey(slot.id) ||
          (banner.placement &&
            slot.label &&
            normalizePlacement(banner.placement) === normalizePlacement(slot.label)),
      )
      const slotBanners = matched.map((banner) => {
        const status = resolveBannerStatus(banner)
        return {
          id: banner.id,
          title: banner.name || banner.title || 'Banner',
          name: banner.name || banner.title || 'Banner',
          bannerType: banner.type || slot.displayType || slot.type || 'Static',
          type: banner.type || slot.displayType || slot.type || 'Static',
          status,
          isActive: status === 'Active',
          imageUrl: banner.imageUrl || '',
          placement: banner.placement || slot.label || slot.id,
          placementKey: banner.placementKey || slot.id,
          raw: banner.raw || banner,
        }
      })
      const activeCount = slotBanners.filter((item) => item.status === 'Active').length
      const count = slotBanners.length
      return {
        ...slot,
        slotBanners,
        active: count > 0 ? activeCount : slot.active || 0,
        activeCount: count > 0 ? activeCount : slot.activeCount || 0,
        banners: count > 0 ? count : slot.banners,
        bannerCount: count > 0 ? count : slot.bannerCount || slot.banners || 0,
      }
    })

    if (platform === 'customer' && screenId === 'home') {
      return injectExclusiveOffersSlot(mapped, exclusiveSection, exclusiveItems)
    }
    return mapped
  }, [slots, banners, platform, screenId, exclusiveSection, exclusiveItems])

  useEffect(() => {
    setOpenSlots((prev) => {
      const next = { ...prev }
      for (const slot of slotsWithBanners) {
        if (next[slot.id] == null) next[slot.id] = true
      }
      return next
    })
  }, [slotsWithBanners])

  const toggleSlot = (slotId) => {
    setOpenSlots((prev) => ({ ...prev, [slotId]: !prev[slotId] }))
  }

  const handlePreviewEdit = (banner) => {
    onMobilePreviewClose?.()
    onEdit?.(banner)
  }

  return (
    <div className="space-y-3">
      {(placementsError || bannersError) && (
        <p className="text-[13px] text-[#c91a24]">
          {placementsError?.message || bannersError?.message || 'Unable to load banners.'}{' '}
          <button
            type="button"
            className="underline"
            onClick={() => {
              refetchPlacements()
              refetchBanners()
            }}
          >
            Retry
          </button>
        </p>
      )}
      {(placementsLoading || bannersLoading) && apiSlots.length === 0 && apiBanners.length === 0 ? (
        <p className="text-[13px] text-[#8a948e]">Loading banners & placements…</p>
      ) : null}

      <section className="rounded-[14px] border border-[#eceeec] bg-white p-4 max-[900px]:p-3">
        <div className="flex gap-8 max-[980px]:grid-cols-1">
          <div>
            <h3 className="text-[15px] font-bold text-[#17231c]">Live preview — point where to place</h3>
            <p className="mt-0.5 text-[12.5px] text-[#7c8780]">
              {platform === 'champ'
                ? 'Champ app preview — tap a slot to add or edit banners for that screen'
                : 'Tap a slot to add banners, or manage Super Exclusive offers inline on the right'}
            </p>
            <div className="mt-4 flex items-center justify-center">
              <PhoneLivePreview
                platform={platform}
                screenId={screenId}
                slots={slotsWithBanners}
                banners={banners}
                onAdd={onAdd}
                onEdit={handlePreviewEdit}
                exclusiveSection={exclusiveSection}
                exclusiveItems={exclusiveItems}
                onAddExclusive={onAddExclusive}
              />
            </div>
          </div>

          <div className="flex min-w-0 flex-col">
            <div className="mb-3 flex flex-wrap gap-1.5">
              {screenChips.map((chip) => {
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
                    ) : Icon ? (
                      <Icon size={13} strokeWidth={2.2} />
                    ) : null}
                    {chip.label}
                  </button>
                )
              })}
            </div>

            <h4 className="mb-2 text-[13px] font-bold text-[#17231c]">Slots on this screen</h4>
            <div className="space-y-1.5">
              {slotsWithBanners.map((slot) => {
                const nestedBanners = Array.isArray(slot.slotBanners) ? slot.slotBanners : []
                const exclusiveItemsForSlot = Array.isArray(slot.exclusiveItems)
                  ? slot.exclusiveItems
                  : []
                const exclusive = isExclusiveOffersSlot(slot)
                const slotOpen = openSlots[slot.id] !== false
                const count = exclusive ? exclusiveSlotCount(slot) : Number(slot.bannerCount ?? slot.banners ?? nestedBanners.length ?? 0)
                const active = exclusive
                  ? exclusiveSlotLiveCount(slot)
                  : Number(slot.activeCount ?? slot.active ?? 0)
                const primaryBanner = nestedBanners[0] || null
                const slotLabel = slot.label || slotDisplayLabel(slot)
                const slotMenuKey = `ads-slot:${slot.id}`
                const slotMenuOpen =
                  menuId === slotMenuKey ||
                  nestedBanners.some((banner) => menuId === `ads-banner:${banner.id}`)

                return (
                  <div
                    key={slot.id}
                    className={cn(
                      'rounded-[12px] border border-[#e7ebe8] bg-white',
                      slotMenuOpen ? 'relative z-40 overflow-visible' : 'overflow-hidden',
                    )}
                  >
                    <div className="flex items-center gap-2 px-2.5 py-2">
                      <button
                        type="button"
                        onClick={() => toggleSlot(slot.id)}
                        className="flex min-w-0 flex-1 items-center gap-2 text-left"
                        aria-expanded={slotOpen}
                      >
                        <CollapseChevron open={slotOpen} />
                        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-[#eef2ef] text-[#637068]">
                          {exclusive ? (
                            <Package size={16} strokeWidth={2} />
                          ) : (
                            <ImageIcon size={16} strokeWidth={2} />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-bold text-[#17231c]">{slotLabel}</p>
                          <p className="mt-0.5 text-[12px] text-[#7c8780]">
                            {exclusive
                              ? `${count} product${count === 1 ? '' : 's'}${active > 0 ? ` · ${active} live` : ''}`
                              : `${count} banner${count === 1 ? '' : 's'}${active > 0 ? ` · ${active} active` : ''}`}
                          </p>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          exclusive
                            ? onAddExclusive?.()
                            : onAdd?.({
                                placement: slotLabel,
                                placementKey: slot.id,
                              })
                        }
                        className="inline-flex h-[30px] shrink-0 items-center gap-1 rounded-full border border-[#1aa054] bg-white px-3 text-[12px] font-bold text-[#1aa054] hover:bg-[#e8f7ed]"
                      >
                        <Plus size={13} strokeWidth={2.8} />
                        Add
                      </button>
                      {!exclusive ? (
                        <SlotActionMenu
                          menuId={menuId}
                          setMenuId={setMenuId}
                          itemId={slotMenuKey}
                          label={slotLabel}
                          canEdit={Boolean(primaryBanner)}
                          canDelete={Boolean(primaryBanner)}
                          onEdit={() => onEdit?.(primaryBanner)}
                          onDelete={() => onDelete?.(primaryBanner)}
                        />
                      ) : null}
                    </div>

                    {slotOpen && exclusive && exclusiveEditor ? (
                      <div className="border-t border-[#eef1ef] bg-[#fafbfa] px-2 py-2">
                        <ExclusiveOffersSlotPanel
                          variant="compact"
                          section={exclusiveEditor.section}
                          items={exclusiveEditor.items}
                          summary={exclusiveEditor.summary}
                          busy={exclusiveEditor.busy}
                          dragIndex={exclusiveEditor.dragIndex}
                          onSectionChange={exclusiveEditor.handleSectionChange}
                          onSectionToggle={exclusiveEditor.handleSectionToggle}
                          onAdd={onAddExclusive}
                          onDragStart={exclusiveEditor.onDragStart}
                          onDragOver={exclusiveEditor.onDragOver}
                          onDragEnd={exclusiveEditor.onDragEnd}
                          onToggleVisible={exclusiveEditor.handleToggleVisible}
                          onPriceChange={exclusiveEditor.handlePriceChange}
                          onTitleChange={exclusiveEditor.handleTitleChange}
                          onImageChange={exclusiveEditor.handleImageChange}
                          onRemove={exclusiveEditor.handleRemove}
                        />
                      </div>
                    ) : null}

                    {slotOpen && !exclusive && nestedBanners.length > 0 ? (
                      <div className="space-y-0.5 border-t border-[#eef1ef] bg-[#fafbfa] px-2 py-1.5">
                        {nestedBanners.map((banner) => {
                          const status = resolveBannerStatus(banner)
                          const typeLabel = banner.bannerType || banner.type || 'Static'
                          const bannerMenuKey = `ads-banner:${banner.id}`
                          return (
                            <div
                              key={banner.id}
                              className="flex items-center gap-2.5 rounded-[10px] px-1.5 py-2 hover:bg-white"
                            >
                              <span
                                className={cn(
                                  'h-[7px] w-[7px] shrink-0 rounded-full',
                                  statusDotClass(status),
                                )}
                                aria-hidden
                              />
                              {banner.imageUrl ? (
                                <AdminMediaImage
                                  src={banner.imageUrl}
                                  className="h-9 w-9 shrink-0 rounded-[8px] object-cover"
                                  fallbackClassName="h-9 w-9 shrink-0 rounded-[8px] bg-[#eceeec]"
                                  iconSize={14}
                                />
                              ) : (
                                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[8px] bg-[#eceeec]">
                                  <ImageIcon size={14} className="text-[#9e9e9e]" />
                                </span>
                              )}
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-[13px] font-semibold text-[#17231c]">
                                  {banner.title || banner.name || 'Banner'}
                                </p>
                                <p className="mt-0.5 text-[11.5px] text-[#8a948e]">
                                  {typeLabel} · {status}
                                </p>
                              </div>
                              <SlotActionMenu
                                menuId={menuId}
                                setMenuId={setMenuId}
                                itemId={bannerMenuKey}
                                label={banner.title || banner.name || 'Banner'}
                                canEdit
                                canDelete
                                onEdit={() => onEdit?.(banner)}
                                onDelete={() => onDelete?.(banner)}
                              />
                            </div>
                          )
                        })}
                      </div>
                    ) : null}
                  </div>
                )
              })}
            </div>

            <div className="mt-3 flex items-start gap-2 rounded-[10px] border border-[#f3e0a8] bg-[#fff8e1] px-3 py-2.5 text-[12px] text-[#9a6510]">
              <Lightbulb size={14} className="mt-0.5 shrink-0" />
              <p>
                {platform === 'champ'
                  ? 'Switch Champ screens above (Home / Orders / Earnings / Pop-up) to manage banners per screen. All content comes from the API after publish.'
                  : 'Switch screens above (Store page / Category / Pop-up) to place banners there too.'}
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
              {banners.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-[13px] text-[#8a948e]">
                    No banners yet
                  </td>
                </tr>
              ) : (
                banners.map((banner) => (
                  <tr key={banner.id} className="border-b border-[#edf0ee] last:border-b-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        {banner.imageUrl ? (
                          <AdminMediaImage
                            src={banner.imageUrl}
                            className="h-9 w-9 shrink-0 rounded-[10px] object-cover"
                            fallbackClassName={cn(
                              'h-9 w-9 shrink-0 rounded-[10px]',
                              banner.thumb,
                            )}
                            iconSize={15}
                          />
                        ) : (
                          <span
                            className={cn(
                              'grid h-9 w-9 shrink-0 place-items-center rounded-[10px]',
                              banner.thumb,
                            )}
                          >
                            <ImageIcon size={15} className="text-[#637068]/70" />
                          </span>
                        )}
                        <div className="min-w-0">
                          <span className="block truncate text-[13px] font-semibold text-[#17231c]">
                            {banner.name}
                          </span>
                          {banner.schedule ? (
                            <span className="mt-0.5 block truncate text-[11px] text-[#8a948e]">
                              {banner.schedule}
                            </span>
                          ) : null}
                        </div>
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
                          STATUS_STYLE[banner.status] || STATUS_STYLE.Draft,
                        )}
                      >
                        {banner.status}
                      </span>
                    </td>
                    <td className="relative px-4 py-3 text-right">
                      <div className="inline-block">
                        <button
                          type="button"
                          aria-label={`${banner.name} options`}
                          aria-haspopup="menu"
                          aria-expanded={menuId === banner.id}
                          onClick={() => setMenuId(menuId === banner.id ? null : banner.id)}
                          className="grid h-8 w-8 place-items-center rounded-full text-[#9e9e9e] hover:bg-[#f5f5f5] hover:text-[#616161]"
                        >
                          <MoreVertical size={16} />
                        </button>
                        {menuId === banner.id ? (
                          <div
                            role="menu"
                            className="absolute top-[calc(100%-6px)] right-4 z-50 w-[140px] overflow-hidden rounded-[10px] border border-[#e4e8e4] bg-white py-1 shadow-[0_10px_24px_rgba(20,40,28,.14)]"
                          >
                            <button
                              type="button"
                              role="menuitem"
                              className="flex w-full px-3.5 py-2.5 text-left text-[13px] font-medium text-[#17231c] hover:bg-[#f6f8f6]"
                              onClick={() => {
                                setMenuId(null)
                                onEdit?.(banner)
                              }}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              role="menuitem"
                              className="flex w-full px-3.5 py-2.5 text-left text-[13px] font-medium text-[#c91a24] hover:bg-[#fff5f5]"
                              onClick={() => {
                                setMenuId(null)
                                onDelete?.(banner)
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <MobilePreviewModal
        open={mobilePreviewOpen}
        onClose={onMobilePreviewClose}
        platform={platform}
        screenId={screenId}
        screenChips={screenChips}
        onScreenChange={setScreenId}
        slots={slotsWithBanners}
        banners={banners}
        onAdd={onAdd}
        onEdit={handlePreviewEdit}
        exclusiveSection={exclusiveSection}
        exclusiveItems={exclusiveItems}
        onAddExclusive={onAddExclusive}
      />
    </div>
  )
}

function CategoryIconButton({
  category,
  onUploaded,
  disabled = false,
  uploading = false,
  size = 32,
}) {
  const inputRef = useRef(null)
  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={ADMIN_IMAGE_UPLOAD_ACCEPT}
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0]
          event.target.value = ''
          if (file) onUploaded?.(file)
        }}
      />
      <button
        type="button"
        disabled={disabled || uploading}
        title="Upload or replace image"
        aria-label={`Upload or replace image for ${category?.name || 'category'}`}
        onClick={() => inputRef.current?.click()}
        className="relative grid shrink-0 place-items-center overflow-hidden rounded-[10px] border border-[#e4e8e4] bg-white hover:border-[#1aa054] disabled:opacity-60"
        style={{ width: size, height: size }}
      >
        {category?.iconUrl ? (
          <AdminMediaImage
            src={category.iconUrl}
            className="h-full w-full object-cover"
            fallbackClassName="h-full w-full bg-[#e8ebe8]"
            iconSize={14}
          />
        ) : (
          <span className="grid h-full w-full place-items-center bg-[#e8ebe8] text-[#9aa49d]">
            <ImageOff size={Math.max(12, Math.round(size * 0.4))} strokeWidth={1.8} />
          </span>
        )}
        <span className="absolute inset-x-0 bottom-0 bg-black/45 py-[1px] text-center text-[8px] font-bold text-white">
          {uploading ? '…' : 'Edit'}
        </span>
      </button>
    </>
  )
}

function kindLabel(kind) {
  if (kind === 'ORDER_MODE') return 'Order mode'
  if (kind === 'SUB_TYPE') return 'Sub-type'
  return 'Store type'
}

const CUSTOMER_HOME_TILE_LIMIT = 8

function findCategoryInTree(categories, id) {
  for (const item of categories) {
    if (item.id === id) return item
    if (item.children?.length) {
      const child = item.children.find((row) => row.id === id)
      if (child) return child
    }
  }
  return null
}

function updateCategoryInTree(categories, id, updater) {
  return categories.map((item) => {
    if (item.id === id) return updater(item)
    if (item.children?.length) {
      const nextChildren = item.children.map((child) =>
        child.id === id ? updater(child) : child,
      )
      if (nextChildren.some((child, index) => child !== item.children[index])) {
        return { ...item, children: nextChildren }
      }
    }
    return item
  })
}

function CategoryIntegrityBadges({ category }) {
  if (!category.kindMismatch) return null
  return (
    <span className="shrink-0 rounded-full bg-[#fff3e0] px-2 py-1 text-[10px] font-bold text-[#e65100]">
      Kind mismatch — run Repair
    </span>
  )
}

function unavailableRefLabel(category) {
  if (category.refActive === false) return 'Inactive in Store Management'
  if (category.refPublishStatus && category.refPublishStatus !== 'PUBLISHED') {
    return 'Unpublished in Store Management'
  }
  return 'Unavailable in Store Management'
}

function storeManagementLink(category) {
  if (category.kind === 'STORE_TYPE' && category.refId) {
    return `/admin/stores/${encodeURIComponent(category.refId)}`
  }
  return '/admin/stores'
}

function CategoryRow({
  category,
  variant = 'parent',
  indexLabel,
  dragIndex,
  rowIndex,
  busy,
  uploadingId,
  onDragStart,
  onDragOver,
  onDragEnd,
  onRenameLocal,
  onRenamePersist,
  onUploadIcon,
  onToggleHidden,
  onRemove,
}) {
  const isParent = variant === 'parent'
  const isUnavailable = variant === 'unavailable'
  const isDragging = isParent && dragIndex === rowIndex

  if (isUnavailable) {
    return (
      <div className="flex items-center gap-2 rounded-[12px] border border-[#f0d8da] bg-[#fdf6f6] px-2.5 py-2 w-fit max-w-full opacity-90">
        <span className="h-8 w-6 shrink-0" aria-hidden="true" />
        <span className="w-9 shrink-0 text-[12px] font-bold text-[#8a948e]">{indexLabel}</span>
        {category.iconUrl ? (
          <AdminMediaImage
            src={category.iconUrl}
            className="h-8 w-8 shrink-0 rounded-[8px] object-cover opacity-60"
            fallbackClassName="h-8 w-8 shrink-0 rounded-[8px] bg-[#e8ebe8]"
            iconSize={12}
          />
        ) : (
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[8px] bg-[#eceeec] text-[#9aa49d]">
            <ImageOff size={14} strokeWidth={1.8} />
          </span>
        )}
        <div className="min-w-[140px] flex-1">
          <span className="block text-[13px] font-semibold text-[#69756d]">{category.name}</span>
          {category.parentName ? (
            <span className="text-[10.5px] text-[#8a948e]">Sub-type of {category.parentName}</span>
          ) : null}
        </div>
        <span className="shrink-0 rounded-full bg-white px-2 py-1 text-[10px] font-bold uppercase tracking-[0.03em] text-[#6b746e]">
          {kindLabel(category.kind)}
        </span>
        {category.code || category.refId ? (
          <span className="max-w-[88px] truncate text-[10px] text-[#8a948e]">
            {category.code || category.refId}
          </span>
        ) : null}
        <span className="shrink-0 rounded-full bg-[#fdecea] px-2 py-1 text-[10px] font-bold text-[#c62828]">
          {unavailableRefLabel(category)}
        </span>
        <Link
          to={storeManagementLink(category)}
          className="shrink-0 text-[11px] font-bold text-[#147940] underline hover:text-[#0f5a2e]"
        >
          Store Management
        </Link>
        <button
          type="button"
          aria-label={`Remove ${category.name} from home`}
          disabled={busy}
          onClick={() => onRemove?.(category)}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[#8a948e] hover:bg-white hover:text-[#c62828] disabled:opacity-60"
        >
          <Trash2 size={15} />
        </button>
      </div>
    )
  }

  return (
    <div
      draggable={isParent}
      onDragStart={isParent ? onDragStart : undefined}
      onDragOver={isParent ? onDragOver : undefined}
      onDragEnd={isParent ? onDragEnd : undefined}
      className={cn(
        'flex items-center gap-2 rounded-[12px] bg-[#f3f5f4] px-2.5 py-2 w-fit max-w-full',
        isParent ? '' : 'ml-8 border-l-2 border-[#dce3de] bg-[#f8faf8]',
        isDragging && 'ring-1 ring-[#1aa054] bg-[#eaf6ee]',
        category.isHidden && 'opacity-55',
      )}
    >
      {isParent ? (
        <button
          type="button"
          aria-label={`Reorder ${category.name}`}
          className="grid h-8 w-6 shrink-0 cursor-grab place-items-center text-[#b0b8b3] active:cursor-grabbing"
        >
          <GripVertical size={16} strokeWidth={2.2} />
        </button>
      ) : (
        <span className="h-8 w-6 shrink-0" aria-hidden="true" />
      )}
      <span className="w-9 shrink-0 text-[12px] font-bold text-[#8a948e]">{indexLabel}</span>
      <CategoryIconButton
        category={category}
        size={isParent ? 36 : 32}
        uploading={uploadingId === category.id}
        disabled={busy || uploadingId === category.id}
        onUploaded={onUploadIcon}
      />
      <input
        value={category.name}
        onChange={(event) => onRenameLocal(category.id, event.target.value)}
        onBlur={() => onRenamePersist(category)}
        className="h-[38px] min-w-[140px] flex-1 rounded-[10px] border border-[#e4e8e4] bg-white px-3 text-[13px] font-semibold text-[#17231c] outline-none focus:border-[#1aa054]"
      />
      <span className="shrink-0 rounded-full bg-white px-2 py-1 text-[10px] font-bold uppercase tracking-[0.03em] text-[#6b746e]">
        {kindLabel(category.kind)}
      </span>
      {category.code || category.refId ? (
        <span className="max-w-[88px] truncate text-[10px] text-[#8a948e]">
          {category.code || category.refId}
        </span>
      ) : null}
      {isParent ? <CategoryIntegrityBadges category={category} /> : null}
      <button
        type="button"
        aria-label={category.isHidden ? `Show ${category.name}` : `Hide ${category.name}`}
        onClick={() => onToggleHidden(category)}
        className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[#8a948e] hover:bg-white hover:text-[#455249]"
      >
        {category.isHidden ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>
      {isParent ? (
        <button
          type="button"
          aria-label={`Remove ${category.name} from home`}
          disabled={busy}
          onClick={() => onRemove(category)}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[#8a948e] hover:bg-white hover:text-[#c62828] disabled:opacity-60"
        >
          <Trash2 size={15} />
        </button>
      ) : null}
    </div>
  )
}

function AddToHomeModal({ open, onClose, onSubmit, isSubmitting }) {
  const [catalog, setCatalog] = useState({ storeTypes: [], orderModes: [] })
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!open) return undefined
    setSelected(null)
    setError(null)
    setLoading(true)
    adminUiEditorService
      .getHomeCatalog()
      .then((result) => {
        setCatalog(result?.data || { storeTypes: [], orderModes: [] })
      })
      .catch((err) => setError(err))
      .finally(() => setLoading(false))
    return undefined
  }, [open])

  if (!open) return null

  const sections = [
    { title: 'Store types', items: catalog.storeTypes || [] },
    { title: 'Order modes', items: catalog.orderModes || [] },
  ]

  const addableItems = [
    ...(catalog.storeTypes || []),
    ...(catalog.orderModes || []),
  ].filter((item) => !item.onHome)

  const canAdd =
    addableItems.length > 0 && selected && !selected.onHome && selected?.kind && (selected?.id || selected?.refId)

  const cascadeSubTypes =
    selected?.structure === 'TWO_LEVEL' && Array.isArray(selected.subTypes)
      ? selected.subTypes.filter((sub) => !sub.onHome)
      : []

  const handleAdd = async () => {
    if (!canAdd) {
      if (!addableItems.length) {
        setError(
          Object.assign(new Error('All published records are already on the home grid.'), {
            message: 'All published records are already on the home grid.',
          }),
        )
        return
      }
      setError(
        Object.assign(new Error('Pick a Store Management record.'), {
          message: 'Pick a Store Management record.',
        }),
      )
      return
    }
    if (selected.onHome) {
      setError(
        Object.assign(new Error('Already on the home grid.'), {
          message: 'Already on the home grid.',
        }),
      )
      return
    }
    try {
      await onSubmit?.({
        kind: selected.kind,
        refId: selected.refId || selected.id,
        name: selected.name,
      })
    } catch (err) {
      setError(err)
    }
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/40"
        disabled={isSubmitting}
        onClick={() => !isSubmitting && onClose?.()}
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-[480px] rounded-t-[16px] bg-white p-5 shadow-[0_18px_44px_rgba(0,0,0,0.28)] sm:rounded-[16px]"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-[16px] font-bold text-[#17231c]">Add to home</h3>
            <p className="mt-0.5 text-[12.5px] text-[#7c8780]">
              Pick a published Store Management record. Display name can be edited after adding.
            </p>
          </div>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-[8px] text-[#8a948e] hover:bg-[#f7f9f7]"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mb-4 max-h-[360px] space-y-4 overflow-y-auto pr-1">
          {loading ? <p className="text-[13px] text-[#8a948e]">Loading catalog…</p> : null}
          {!loading
            ? sections.map((section) => (
                <div key={section.title}>
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.04em] text-[#8a948e]">
                    {section.title}
                  </p>
                  <div className="space-y-1.5">
                    {section.items.length ? (
                      section.items.map((item) => {
                        const key = item.refId || item.id
                        const active = (selected?.refId || selected?.id) === key
                        return (
                          <button
                            key={key}
                            type="button"
                            disabled={item.onHome || isSubmitting}
                            onClick={() => setSelected(item)}
                            className={cn(
                              'flex w-full items-center justify-between rounded-[10px] border px-3 py-2 text-left',
                              active ? 'border-[#1aa054] bg-[#eef8f1]' : 'border-[#e4e8e4] bg-white',
                              item.onHome && 'cursor-not-allowed opacity-50',
                            )}
                          >
                            <span>
                              <span className="block text-[13px] font-semibold text-[#17231c]">
                                {item.name}
                              </span>
                              <span className="text-[11px] text-[#8a948e]">
                                {kindLabel(item.kind)}
                                {item.code ? ` · ${item.code}` : ''}
                                {item.structure === 'TWO_LEVEL' ? ' · two-level' : ''}
                              </span>
                            </span>
                            <span className="text-[11px] font-bold text-[#8a948e]">
                              {item.onHome
                                ? item.onHomeVisible === false
                                  ? 'On home (hidden)'
                                  : 'On home'
                                : active
                                  ? 'Selected'
                                  : 'Add'}
                            </span>
                          </button>
                        )
                      })
                    ) : (
                      <p className="text-[12.5px] text-[#8a948e]">No published records.</p>
                    )}
                  </div>
                </div>
              ))
            : null}
        </div>

        {!loading && addableItems.length === 0 ? (
          <p className="mb-3 rounded-[10px] bg-[#f3f5f4] px-3 py-2 text-[12.5px] text-[#69756d]">
            All published records are already on the home grid.
          </p>
        ) : null}

        {selected?.structure === 'TWO_LEVEL' && cascadeSubTypes.length ? (
          <p className="mb-3 rounded-[10px] border border-[#dcefe3] bg-[#eef8f1] px-3 py-2 text-[12.5px] text-[#147940]">
            Includes nested sub-types: {cascadeSubTypes.map((sub) => sub.name).join(', ')}.
          </p>
        ) : null}

        {error ? (
          <p className="mb-3 text-[12.5px] text-[#c91a24]">
            {formatApiErrorMessage(error, 'Unable to add this record.')}
          </p>
        ) : null}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="inline-flex h-[36px] items-center rounded-full border border-[#d5dbd6] px-4 text-[12.5px] font-bold text-[#455249] hover:bg-[#f7f9f7]"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isSubmitting || loading || !canAdd}
            onClick={handleAdd}
            className="inline-flex h-[36px] items-center rounded-full bg-[#1aa054] px-4 text-[12.5px] font-bold text-white hover:bg-[#158a47] disabled:opacity-60"
          >
            {isSubmitting ? 'Adding…' : 'Add to home'}
          </button>
        </div>
      </div>
    </div>
  )
}

function CategoriesTab({ onMessage }) {
  const {
    categories: apiCategories,
    unavailableCategories: apiUnavailableCategories,
    unavailableCount,
    isLoading,
    error,
    refetch,
    enabled,
  } = useAdminUiEditorHomeCategories()
  const [categories, setCategories] = useState([])
  const [unavailableCategories, setUnavailableCategories] = useState([])
  const [unavailableOpen, setUnavailableOpen] = useState(false)
  const categoriesRef = useRef(categories)
  const [dragIndex, setDragIndex] = useState(null)
  const [busy, setBusy] = useState(false)
  const [uploadingId, setUploadingId] = useState(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [localError, setLocalError] = useState(null)

  useEffect(() => {
    categoriesRef.current = categories
  }, [categories])

  // Real API: mirror live home grid only; inactive SM refs go to unavailable section.
  useEffect(() => {
    if (!enabled) {
      setCategories(HOME_CATEGORIES)
      setUnavailableCategories([])
      return
    }
    setCategories(apiCategories)
    setUnavailableCategories(apiUnavailableCategories)
  }, [apiCategories, apiUnavailableCategories, enabled])

  const renameCategoryLocal = (id, name) => {
    setCategories((prev) => updateCategoryInTree(prev, id, (item) => ({ ...item, name })))
  }

  const persistRename = async (category) => {
    if (!enabled || !category?.id) return
    const nextName = String(category.name || '').trim()
    if (!nextName) {
      const original = findCategoryInTree(apiCategories, category.id)
      if (original) {
        setCategories((prev) =>
          updateCategoryInTree(prev, category.id, (item) => ({ ...item, name: original.name })),
        )
      }
      return
    }
    const original = findCategoryInTree(apiCategories, category.id)
    if (original && original.name === nextName) return
    setLocalError(null)
    try {
      await adminUiEditorService.patchHomeCategory(category.id, {
        name: nextName,
        isFeatured: category.isFeatured !== false,
        sortOrder: category.sortOrder ?? 0,
        isActive: !category.isHidden,
        iconUrl: category.iconUrl ?? undefined,
      })
      await refetch()
    } catch (err) {
      setLocalError(err)
    }
  }

  const uploadCategoryIcon = async (category, file) => {
    if (!category?.id || !file) return
    setLocalError(null)
    try {
      validateAdminImageFile(file, { maxBytes: ADMIN_IMAGE_UPLOAD_MAX_BYTES })
    } catch (err) {
      setLocalError(err)
      return
    }

    setUploadingId(category.id)
    try {
      const result = await adminUploadService.uploadImage(file, { feature: 'ui-editor' })
      const url = result?.data?.url
      if (!url) throw new Error('Upload succeeded but no image URL was returned.')

      setCategories((prev) =>
        updateCategoryInTree(prev, category.id, (item) => ({ ...item, iconUrl: url })),
      )

      if (enabled) {
        await adminUiEditorService.patchHomeCategory(category.id, {
          iconUrl: url,
          name: category.name,
          isFeatured: category.isFeatured !== false,
          sortOrder: category.sortOrder ?? 0,
          isActive: !category.isHidden,
        })
        await refetch()
      }
      onMessage?.('Category icon updated.')
    } catch (err) {
      setLocalError(err)
    } finally {
      setUploadingId(null)
    }
  }

  const handleCreateSubmit = async (payload) => {
    setLocalError(null)
    if (!enabled) {
      setCategories((prev) => [
        ...prev,
        {
          id: `cat-new-${Date.now()}`,
          name: payload.name,
          kind: payload.kind,
          refId: payload.refId,
          iconUrl: payload.iconUrl || null,
          isHidden: false,
        },
      ])
      setCreateOpen(false)
      return
    }

    setBusy(true)
    try {
      const created = await adminUiEditorService.createHomeCategory({
        kind: payload.kind,
        refId: payload.refId,
        name: payload.name,
      })
      if (created?.data) {
        setCategories((prev) => [...prev, created.data])
      }
      await refetch()
      setCreateOpen(false)
      onMessage?.('Added to home.')
    } catch (err) {
      setLocalError(err)
      throw err
    } finally {
      setBusy(false)
    }
  }

  const toggleHidden = async (category) => {
    const nextHidden = !category.isHidden
    setCategories((prev) =>
      updateCategoryInTree(prev, category.id, (item) => ({
        ...item,
        isHidden: nextHidden,
        isActive: !nextHidden,
      })),
    )
    if (!enabled) return
    setLocalError(null)
    try {
      await adminUiEditorService.patchHomeCategory(category.id, {
        name: category.name,
        isFeatured: category.isFeatured !== false,
        sortOrder: category.sortOrder ?? 0,
        isActive: !nextHidden,
        iconUrl: category.iconUrl ?? undefined,
      })
      await refetch()
    } catch (err) {
      setLocalError(err)
      setCategories((prev) =>
        updateCategoryInTree(prev, category.id, (item) => ({
          ...item,
          isHidden: category.isHidden,
          isActive: !category.isHidden,
        })),
      )
    }
  }

  const removeFromHome = async (category) => {
    if (!category?.id) return
    const nestedNote = category.children?.length
      ? ` This will also remove ${category.children.length} nested sub-type presentation row(s) from home.`
      : ''
    if (
      !window.confirm(
        `Remove “${category.name}” from the home grid? Store Management is unchanged.${nestedNote}`,
      )
    ) {
      return
    }
    if (!enabled) {
      setCategories((prev) => prev.filter((item) => item.id !== category.id))
      setUnavailableCategories((prev) => prev.filter((item) => item.id !== category.id))
      return
    }
    setBusy(true)
    setLocalError(null)
    try {
      await adminUiEditorService.deleteHomeCategory(category.id)
      await refetch()
      onMessage?.('Removed from home.')
    } catch (err) {
      setLocalError(err)
    } finally {
      setBusy(false)
    }
  }

  const removeAllUnavailableFromHome = async () => {
    if (!unavailableCategories.length) return
    if (
      !window.confirm(
        `Remove all ${unavailableCategories.length} unavailable tile(s) from the home grid? Store Management records are unchanged.`,
      )
    ) {
      return
    }
    setBusy(true)
    setLocalError(null)
    try {
      for (const category of unavailableCategories) {
        await adminUiEditorService.deleteHomeCategory(category.id)
      }
      await refetch()
      onMessage?.(`Removed ${unavailableCategories.length} unavailable tile(s) from home.`)
    } catch (err) {
      setLocalError(err)
      await refetch()
    } finally {
      setBusy(false)
    }
  }

  const runCleanup = async () => {
    if (!enabled) return
    if (
      !window.confirm(
        'Repair home categories? Fixes kind mismatches, removes duplicate rows for the same Store Management record, and hides tiles whose store type is inactive.',
      )
    ) {
      return
    }
    setBusy(true)
    setLocalError(null)
    try {
      const result = await adminUiEditorService.cleanupHomeCategories()
      await refetch()
      const raw = result?.raw || {}
      const cascade = raw.cascadeRepair || {}
      const parts = [
        raw.kindFixed ? `${raw.kindFixed} kind fix(es)` : null,
        raw.duplicatesRemoved ? `${raw.duplicatesRemoved} duplicate(s) removed` : null,
        raw.hiddenInactiveRefs ? `${raw.hiddenInactiveRefs} hidden (inactive SM)` : null,
        cascade.synced ? `${cascade.synced} sub-type row(s) synced` : null,
        cascade.removed ? `${cascade.removed} orphan sub-type row(s) removed` : null,
      ].filter(Boolean)
      onMessage?.(parts.length ? `Cleanup done: ${parts.join(', ')}.` : 'Cleanup done — nothing to fix.')
    } catch (err) {
      setLocalError(err)
    } finally {
      setBusy(false)
    }
  }

  const onDragStart = (index) => setDragIndex(index)

  const onDragOver = (event, index) => {
    event.preventDefault()
    if (dragIndex === null || dragIndex === index) return
    setCategories((prev) => {
      const next = [...prev]
      const [moved] = next.splice(dragIndex, 1)
      next.splice(index, 0, moved)
      const ordered = next.map((item, sortOrder) => ({ ...item, sortOrder }))
      categoriesRef.current = ordered
      return ordered
    })
    setDragIndex(index)
  }

  const onDragEnd = async () => {
    setDragIndex(null)
    if (!enabled) return
    setLocalError(null)
    const ordered = categoriesRef.current.map((item, sortOrder) => ({ ...item, sortOrder }))
    setCategories(ordered)
    try {
      await adminUiEditorService.reorderHomeCategories(ordered)
      await refetch()
    } catch (err) {
      setLocalError(err)
      await refetch()
    }
  }

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_minmax(250px,300px)] items-start gap-5 max-[980px]:grid-cols-1">
      <section className="rounded-[14px] border border-[#eceeec] bg-white p-4">
        <div className="mb-3.5 flex flex-wrap items-start gap-2">
          <div className="min-w-0">
            <h3 className="text-[16px] font-bold text-[#17231c]">Home categories</h3>
            <p className="mt-0.5 text-[12.5px] text-[#7c8780]">
              Drag to reorder · rename · change icon · hide. Only live Store Management records appear
              here.
            </p>
          </div>
          <button
            type="button"
            disabled={busy || !enabled}
            onClick={runCleanup}
            className="inline-flex h-[36px] shrink-0 items-center gap-1 rounded-full border border-[#d5dbd6] bg-white px-3 text-[12.5px] font-bold text-[#455249] hover:bg-[#f7f9f7] disabled:opacity-60"
          >
            Repair duplicates
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => setCreateOpen(true)}
            className="inline-flex h-[36px] shrink-0 items-center gap-1 rounded-full bg-[#1aa054] px-4 text-[12.5px] font-bold text-white shadow-[0_1px_2px_rgba(20,40,28,.12)] hover:bg-[#158a47] disabled:opacity-60"
          >
            <Plus size={14} strokeWidth={2.8} />
            Add to home
          </button>
        </div>

        {enabled && isLoading && apiCategories.length === 0 ? (
          <p className="mb-3 text-[13px] text-[#8a948e]">Loading categories…</p>
        ) : null}
        {enabled && (error || localError) ? (
          <p className="mb-3 text-[13px] text-[#c91a24]">
            {formatApiErrorMessage(localError || error, 'Unable to load categories.')}{' '}
            <button type="button" className="underline" onClick={refetch}>
              Retry
            </button>
          </p>
        ) : null}

        <div className="space-y-2">
          {categories.map((category, index) => (
            <div key={category.id} className="space-y-1.5">
              <CategoryRow
                category={category}
                variant="parent"
                indexLabel={`#${index + 1}`}
                dragIndex={dragIndex}
                rowIndex={index}
                busy={busy}
                uploadingId={uploadingId}
                onDragStart={() => onDragStart(index)}
                onDragOver={(event) => onDragOver(event, index)}
                onDragEnd={onDragEnd}
                onRenameLocal={renameCategoryLocal}
                onRenamePersist={(row) => {
                  const current = findCategoryInTree(categories, row.id) || row
                  persistRename(current)
                }}
                onUploadIcon={(file) => uploadCategoryIcon(category, file)}
                onToggleHidden={toggleHidden}
                onRemove={removeFromHome}
              />
              {category.children?.length
                ? category.children.map((child, childIndex) => (
                    <CategoryRow
                      key={child.id}
                      category={child}
                      variant="child"
                      indexLabel={`${index + 1}.${childIndex + 1}`}
                      busy={busy}
                      uploadingId={uploadingId}
                      onRenameLocal={renameCategoryLocal}
                      onRenamePersist={(row) => {
                        const current = findCategoryInTree(categories, row.id) || row
                        persistRename(current)
                      }}
                      onUploadIcon={(file) => uploadCategoryIcon(child, file)}
                      onToggleHidden={toggleHidden}
                    />
                  ))
                : null}
            </div>
          ))}
        </div>

        {enabled && unavailableCategories.length ? (
          <div className="mt-5 border-t border-[#eceeec] pt-4">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setUnavailableOpen((open) => !open)}
                className="inline-flex items-center gap-1.5 text-[13px] font-bold text-[#69756d] hover:text-[#455249]"
              >
                <ChevronDown
                  size={16}
                  className={cn('transition', unavailableOpen ? 'rotate-0' : '-rotate-90')}
                />
                Unavailable in Store Management ({unavailableCount || unavailableCategories.length})
              </button>
              {unavailableOpen ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={removeAllUnavailableFromHome}
                  className="inline-flex h-[32px] items-center rounded-full border border-[#d5dbd6] bg-white px-3 text-[11.5px] font-bold text-[#c62828] hover:bg-[#fdf6f6] disabled:opacity-60"
                >
                  Remove all from home
                </button>
              ) : null}
            </div>
            {unavailableOpen ? (
              <>
                <p className="mb-3 text-[12px] text-[#8a948e]">
                  These tiles reference inactive or unpublished Store Management records. They never
                  appear in the customer app. Reactivate in Store Management or remove them from home.
                </p>
                <div className="space-y-2">
                  {unavailableCategories.map((category, index) => (
                    <div key={category.id} className="space-y-1.5">
                      <CategoryRow
                        category={category}
                        variant="unavailable"
                        indexLabel={`!${index + 1}`}
                        busy={busy}
                        onRemove={removeFromHome}
                      />
                      {category.children?.length
                        ? category.children.map((child, childIndex) => (
                            <CategoryRow
                              key={child.id}
                              category={{ ...child, parentName: category.name }}
                              variant="unavailable"
                              indexLabel={`!${index + 1}.${childIndex + 1}`}
                              busy={busy}
                              onRemove={removeFromHome}
                            />
                          ))
                        : null}
                    </div>
                  ))}
                </div>
              </>
            ) : null}
          </div>
        ) : null}
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
                {categories
                  .filter((category) => !category.isHidden)
                  .slice(0, CUSTOMER_HOME_TILE_LIMIT)
                  .map((category) => (
                    <div
                      key={`preview-${category.id}`}
                      className="flex aspect-square min-w-0 flex-col items-center justify-center gap-1 rounded-[12px] bg-[#f3f5f4] px-1 py-1"
                    >
                      {category.iconUrl ? (
                        <AdminMediaImage
                          src={category.iconUrl}
                          className="h-7 w-7 rounded-[8px] object-cover"
                          fallbackClassName="h-7 w-7 rounded-[8px] bg-[#e8ebe8]"
                          iconSize={12}
                        />
                      ) : (
                        <span className="grid h-7 w-7 place-items-center rounded-[8px] bg-[#e8ebe8] text-[#9aa49d]">
                          <ImageOff size={14} strokeWidth={1.8} />
                        </span>
                      )}
                      <span className="w-full truncate text-center text-[9.5px] font-semibold leading-tight text-[#17231c]">
                        {category.name}
                      </span>
                    </div>
                  ))}
              </div>
              <p className="mt-2 text-center text-[9.5px] text-[#8a948e]">
                Customer home shows up to {CUSTOMER_HOME_TILE_LIMIT} tiles.
              </p>
            </div>
          </div>
        </div>
      </div>

      <AddToHomeModal
        open={createOpen}
        onClose={() => !busy && setCreateOpen(false)}
        isSubmitting={busy}
        onSubmit={handleCreateSubmit}
      />
    </div>
  )
}

export default function AdminUiEditorPage() {
  const [platform, setPlatform] = useState('customer')
  const [tab, setTab] = useState('banners')
  const [bannerModal, setBannerModal] = useState({
    open: false,
    mode: 'create',
    placement: '',
    placementKey: '',
    bannerId: null,
    initialBanner: null,
  })
  const [bannerScreenId, setBannerScreenId] = useState('home')
  const [bannersMobilePreviewOpen, setBannersMobilePreviewOpen] = useState(false)
  const [bannersRefreshKey, setBannersRefreshKey] = useState(0)
  const [bannerTargets, setBannerTargets] = useState([])
  const [bannerTargetsLoading, setBannerTargetsLoading] = useState(false)
  const [bannerSaveError, setBannerSaveError] = useState(null)
  const [previewState, setPreviewState] = useState({
    open: false,
    loading: false,
    data: null,
    error: null,
    screen: 'home',
  })
  const [actionMessage, setActionMessage] = useState(null)
  const [exclusiveModalOpen, setExclusiveModalOpen] = useState(false)
  const exclusiveEditor = useExclusiveOffersEditor({ onMessage: setActionMessage })
  const exclusiveSection = exclusiveEditor.section
  const exclusiveItems = exclusiveEditor.items
  const { apps, isLoading: appsLoading, error: appsError, refetch: refetchApps } =
    useAdminUiEditorApps()
  const appKey = platform === 'champ' ? 'CHAMP' : 'CUSTOMER'

  const visibleTabs = useMemo(
    () =>
      platform === 'champ'
        ? TABS.filter((item) => item.id === 'screen-map' || item.id === 'banners')
        : TABS,
    [platform],
  )

  useEffect(() => {
    if (platform === 'champ' && (tab === 'categories' || tab === 'exclusive-offers')) {
      setTab('banners')
    }
  }, [platform, tab])
  const {
    screens: apiScreens,
    apps: screenMapApps,
    isLoading: screenMapLoading,
    error: screenMapError,
    refetch: refetchScreenMap,
  } = useAdminUiEditorScreenMap(appKey)
  const {
    meta: bannersMeta,
    banners: allBanners,
    refetch: refetchBanners,
  } = useAdminUiEditorBanners(appKey)

  const { mutate: previewScreen, isLoading: previewLoading } = useApiMutation(
    ({ app, screen }) => adminUiEditorService.getPreview(app, screen),
  )
  const {
    mutate: publishUi,
    isLoading: isPublishing,
    error: publishError,
    reset: resetPublish,
  } = useApiMutation((app) => adminUiEditorService.publish(app))
  const {
    mutate: saveBanner,
    isLoading: isSavingBanner,
  } = useApiMutation(async ({ mode, bannerId, form, app, placements }) => {
    if (mode === 'edit' && bannerId) {
      return adminUiEditorService.updateBanner(bannerId, form, {
        appTarget: app,
        placements,
      })
    }
    return adminUiEditorService.createBanner(form, { appTarget: app, placements })
  })

  const screens = useMemo(() => {
    const base =
      apiScreens.length > 0
        ? apiScreens
        : platform === 'customer'
          ? CUSTOMER_SCREENS
          : CHAMP_SCREENS
    const enriched = enrichScreensWithBanners(base, allBanners)
    if (platform !== 'customer') return enriched
    return enriched.map((screen) => {
      if (screen.id !== 'home') return screen
      return {
        ...screen,
        slots: injectExclusiveOffersSlot(screen.slots, exclusiveSection, exclusiveItems),
      }
    })
  }, [apiScreens, platform, allBanners, exclusiveSection, exclusiveItems])

  const modalPlacements = useMemo(() => {
    const fromMeta = bannersMeta?.placements || []
    if (fromMeta.length > 0) {
      return fromMeta.map((item) => ({
        id: item.id,
        key: item.id,
        label: item.label || item.id,
      }))
    }
    const fromScreenMap = apiScreens.flatMap((screen) =>
      (screen.slots || []).map((slot) => ({
        id: slot.id,
        key: slot.id,
        label: slot.label || slot.id,
      })),
    )
    if (fromScreenMap.length > 0) return fromScreenMap
    return BANNER_PLACEMENTS.map((label) => ({ id: label, key: label, label }))
  }, [bannersMeta, apiScreens])

  const appButtons = useMemo(() => {
    const source = apps.length > 0 ? apps : screenMapApps
    if (source.length > 0) {
      return source.map((app) => ({
        platform: app.platform || (String(app.key).toUpperCase() === 'CHAMP' ? 'champ' : 'customer'),
        key: app.key,
        label: app.label,
      }))
    }
    return [
      { platform: 'customer', key: 'CUSTOMER', label: 'Customer app' },
      { platform: 'champ', key: 'CHAMP', label: 'Champ app' },
    ]
  }, [apps, screenMapApps])

  useEffect(() => {
    if (!appButtons.some((item) => item.platform === platform)) {
      setPlatform(appButtons[0]?.platform || 'customer')
    }
  }, [appButtons, platform])

  const loadBannerTargets = async (tapAction = 'OPEN_STORE') => {
    setBannerTargetsLoading(true)
    try {
      const result = await adminUiEditorService.getBannerTargets(tapAction, {
        params: { app: appKey },
      })
      setBannerTargets(result?.data?.targets || [])
    } catch {
      setBannerTargets([])
    } finally {
      setBannerTargetsLoading(false)
    }
  }

  const openBannerModal = (input = '') => {
    const placementKey =
      typeof input === 'string' ? '' : input?.placementKey || input?.id || ''
    if (placementKey === EXCLUSIVE_OFFERS_SLOT_ID) {
      setExclusiveModalOpen(true)
      return
    }
    const placement =
      typeof input === 'string' ? input : input?.placement || input?.label || ''
    setBannerSaveError(null)
    setBannerModal({
      open: true,
      mode: 'create',
      placement,
      placementKey,
      bannerId: null,
      initialBanner: null,
    })
    loadBannerTargets('OPEN_STORE')
  }

  const openEditBannerModal = async (banner) => {
    if (!banner?.id) return
    setBannerSaveError(null)
    setBannerModal({
      open: true,
      mode: 'edit',
      placement: banner.placement || '',
      placementKey: banner.placementKey || banner.raw?.placementKey || '',
      bannerId: banner.id,
      initialBanner: {
        type:
          String(banner.type || '')
            .toLowerCase()
            .includes('scroll')
            ? 'scroll'
            : String(banner.type || '')
                  .toLowerCase()
                  .includes('pop')
              ? 'popup'
              : 'static',
        title: banner.name || '',
        subtitle: banner.subtitle || '',
        ctaLabel: banner.ctaLabel || banner.raw?.ctaLabel || '',
        imageUrl: banner.imageUrl || '',
        tapAction: (() => {
          const raw = String(banner.tapAction || banner.raw?.tapAction || '').trim()
          const map = {
            OPEN_STORE: 'Open store',
            OPEN_CATEGORY: 'Open category',
            OPEN_OFFER: 'Open offer',
            OPEN_CHAMP_SCREEN: 'Open Champ screen',
            OPEN_URL: 'Open URL',
            NONE: 'No action',
            NO_ACTION: 'No action',
          }
          return map[raw.toUpperCase()] || raw || (platform === 'champ' ? 'Open URL' : 'Open store')
        })(),
        target: banner.target || '',
        targetId: banner.targetId || '',
        ctaUrl: banner.ctaUrl || banner.raw?.ctaUrl || '',
        placement: banner.placement || '',
        placementKey: banner.placementKey || banner.raw?.placementKey || '',
        start: banner.start || '2026-03-22',
        end: banner.end || '2026-03-30',
        audience: banner.audience || 'All customers',
        active: banner.status === 'Active' || banner.isActive === true,
      },
    })
    loadBannerTargets(
      String(banner.tapActionKey || banner.raw?.tapAction || (platform === 'champ' ? 'OPEN_URL' : 'OPEN_STORE')).toUpperCase(),
    )
    try {
      const result = await adminUiEditorService.getBanner(banner.id)
      if (result?.data) {
        const detail = result.data
        setBannerModal((prev) => ({
          ...prev,
          open: true,
          mode: 'edit',
          bannerId: banner.id,
          placement: detail.placement || prev.placement,
          placementKey: detail.placementKey || prev.placementKey,
          // Keep list thumbnail URL if detail omits / returns empty imageUrl
          initialBanner: {
            ...detail,
            imageUrl: detail.imageUrl || banner.imageUrl || prev.initialBanner?.imageUrl || '',
            ctaUrl: detail.ctaUrl || banner.ctaUrl || prev.initialBanner?.ctaUrl || '',
            targetId: detail.targetId || banner.targetId || prev.initialBanner?.targetId || '',
          },
        }))
        if (detail.tapActionKey) {
          loadBannerTargets(detail.tapActionKey)
        }
      }
    } catch (err) {
      setBannerSaveError(err)
    }
  }

  const closeBannerModal = () => {
    if (isSavingBanner) return
    setBannerSaveError(null)
    setBannerModal({
      open: false,
      mode: 'create',
      placement: '',
      placementKey: '',
      bannerId: null,
      initialBanner: null,
    })
  }

  const handleBannerSubmit = async (form) => {
    setBannerSaveError(null)
    setActionMessage(null)
    try {
      await saveBanner({
        mode: bannerModal.mode,
        bannerId: bannerModal.bannerId,
        form,
        app: appKey,
        placements: modalPlacements,
      })
      setBannersRefreshKey((key) => key + 1)
      refetchScreenMap()
      refetchBanners()
      setActionMessage(
        bannerModal.mode === 'edit' ? 'Banner updated.' : 'Banner created.',
      )
      setBannerModal({
        open: false,
        mode: 'create',
        placement: '',
        placementKey: '',
        bannerId: null,
        initialBanner: null,
      })
    } catch (err) {
      setBannerSaveError(err)
    }
  }

  const handleDeleteBanner = async (banner) => {
    if (!banner?.id) return
    const confirmed = window.confirm(`Delete banner “${banner.name}”?`)
    if (!confirmed) return
    setActionMessage(null)
    try {
      await adminUiEditorService.deleteBanner(banner.id)
      setBannersRefreshKey((key) => key + 1)
      refetchScreenMap()
      refetchBanners()
      setActionMessage('Banner deleted.')
    } catch (err) {
      setActionMessage(err?.message || 'Unable to delete banner.')
    }
  }

  const handlePreview = async (screen = 'home') => {
    const screenKey = String(screen || bannerScreenId || 'home')
    setActionMessage(null)
    setPreviewState({ open: true, loading: true, data: null, error: null, screen: screenKey })
    try {
      const result = await previewScreen({ app: appKey, screen: screenKey })
      setPreviewState({
        open: true,
        loading: false,
        data: result?.data || null,
        error: null,
        screen: screenKey,
      })
    } catch (err) {
      setPreviewState({
        open: true,
        loading: false,
        data: null,
        error: err,
        screen: screenKey,
      })
    }
  }

  const handleAddExclusiveProducts = async (payload) => {
    setActionMessage(null)
    try {
      await exclusiveEditor.handleAddProducts(payload)
      setExclusiveModalOpen(false)
    } catch (err) {
      setActionMessage(err?.message || 'Unable to add products.')
      throw err
    }
  }

  const handlePublish = async () => {
    setActionMessage(null)
    resetPublish()
    try {
      if (tab === 'categories') {
        await adminUiEditorService.publishHomeCategories()
        setActionMessage(
          'Published home grid. Visible tiles are now live for the customer app (respects visibility and publish status).',
        )
        return
      }
      if (tab === 'exclusive-offers') {
        await adminUiEditorService.publishExclusiveOffers()
        await exclusiveEditor.refetch()
        setActionMessage(
          'Published Super Exclusive offers. The customer home carousel is now live (respects visibility and product availability).',
        )
        return
      }
      await publishUi(appKey)
      setActionMessage(`Published ${appKey === 'CHAMP' ? 'Champ' : 'Customer'} app UI.`)
    } catch {
      // surfaced via publishError for UI publish; categories use actionMessage
      if (tab === 'categories') {
        setActionMessage('Unable to publish categories.')
      } else if (tab === 'exclusive-offers') {
        setActionMessage('Unable to publish exclusive offers.')
      }
    }
  }

  const headerPreviewScreen =
    tab === 'banners'
      ? bannerScreenId
      : tab === 'categories' || tab === 'exclusive-offers'
        ? 'home'
        : screens[0]?.id || 'home'

  return (
    <div className="px-5 py-4 pb-8 max-[700px]:px-3">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {tab === 'categories' || tab === 'exclusive-offers' ? (
            <div className="inline-flex h-[32px] items-center gap-1.5 rounded-[8px] bg-white px-3 text-[12px] font-bold text-[#17231c] shadow-[0_1px_3px_rgba(20,40,28,.12)]">
              <Smartphone size={14} strokeWidth={2.1} />
              {tab === 'categories' ? 'Customer app home grid' : 'Customer app exclusive offers'}
            </div>
          ) : (
            <div className="inline-flex items-center rounded-[10px] bg-[#e9ebe9] p-[3px]">
              {appButtons.map((app) => (
                <button
                  key={app.key}
                  type="button"
                  onClick={() => setPlatform(app.platform)}
                  className={cn(
                    'inline-flex h-[32px] items-center gap-1.5 rounded-[8px] px-3 text-[12px] font-bold transition',
                    platform === app.platform
                      ? 'bg-white text-[#17231c] shadow-[0_1px_3px_rgba(20,40,28,.12)]'
                      : 'text-[#69756d] hover:text-[#455249]',
                  )}
                >
                  {app.platform === 'champ' ? (
                    <img src={motoBike} alt="" className="h-4 w-4 object-contain" />
                  ) : (
                    <Smartphone size={14} strokeWidth={2.1} />
                  )}
                  {app.label}
                </button>
              ))}
            </div>
          )}
          <div>
            <h2 className="text-[20px] font-bold tracking-[-0.02em] text-[#17231c]">UI Editor</h2>
            <p className="mt-0.5 text-[12.5px] text-[#7c8780]">
              {tab === 'categories'
                ? 'Customer home category grid — shared across the customer app'
                : tab === 'exclusive-offers'
                  ? 'Curated product carousel on customer home — prices & visibility'
                  : platform === 'champ'
                    ? 'Banners & screens for the Champ driver app'
                    : 'Banners, ads, categories & screens for the customer app'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <PreviewButton
            loading={tab !== 'banners' && (previewState.loading || previewLoading)}
            onClick={() => {
              if (tab === 'banners') {
                setBannersMobilePreviewOpen(true)
                return
              }
              handlePreview(headerPreviewScreen)
            }}
          />
          <button
            type="button"
            disabled={isPublishing}
            onClick={handlePublish}
            className="inline-flex h-[36px] items-center gap-1.5 rounded-full bg-[#1aa054] px-4 text-[12.5px] font-bold text-white shadow-[0_1px_2px_rgba(20,40,28,.15)] hover:bg-[#158a47] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPublishing
              ? 'Publishing…'
              : tab === 'categories'
                ? 'Publish home grid'
                : tab === 'exclusive-offers'
                  ? 'Publish exclusive offers'
                  : 'Publish'}
          </button>
        </div>
      </div>

      {appsError ? (
        <p className="mb-3 text-[13px] text-[#c91a24]">
          {appsError.message || 'Unable to load apps.'}{' '}
          <button type="button" className="underline" onClick={refetchApps}>
            Retry
          </button>
        </p>
      ) : null}
      {appsLoading && apps.length === 0 ? (
        <p className="mb-3 text-[13px] text-[#8a948e]">Loading apps…</p>
      ) : null}
      {publishError ? (
        <p className="mb-3 text-[13px] text-[#c91a24]">
          {publishError.message || 'Unable to publish UI.'}
        </p>
      ) : null}
      {actionMessage ? <p className="mb-3 text-[13px] text-[#147940]">{actionMessage}</p> : null}

      <div className="mb-3 flex items-center gap-1 rounded-[10px] bg-[#e8f0ea] p-[3px]">
        {visibleTabs.map((item) => (
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
              Each screen exposes fixed &quot;slots&quot;. Add banners/ads per slot, or curated products in
              Super Exclusive offers on the customer home screen.
            </p>
          </div>

          {screenMapError ? (
            <p className="mb-3 text-[13px] text-[#c91a24]">
              {screenMapError.message || 'Unable to load screen map.'}{' '}
              <button type="button" className="underline" onClick={refetchScreenMap}>
                Retry
              </button>
            </p>
          ) : null}
          {screenMapLoading && apiScreens.length === 0 ? (
            <p className="mb-3 text-[13px] text-[#8a948e]">Loading screen map…</p>
          ) : null}

          <div className="space-y-3">
            {screens.map((screen) => (
              <ScreenCard
                key={screen.id}
                screen={screen}
                onAdd={openBannerModal}
                onAddExclusive={() => setExclusiveModalOpen(true)}
                exclusiveEditor={exclusiveEditor}
                onEdit={openEditBannerModal}
                onDelete={handleDeleteBanner}
                onPreview={handlePreview}
                previewLoading={
                  (previewState.loading || previewLoading) && previewState.screen === screen.id
                }
              />
            ))}
          </div>
        </>
      ) : null}

      {tab === 'banners' ? (
        <BannersAdsTab
          appKey={appKey}
          platform={platform}
          onAdd={openBannerModal}
          onEdit={openEditBannerModal}
          onDelete={handleDeleteBanner}
          onScreenChange={setBannerScreenId}
          bannersRefreshKey={bannersRefreshKey}
          exclusiveEditor={exclusiveEditor}
          onAddExclusive={() => setExclusiveModalOpen(true)}
          mobilePreviewOpen={bannersMobilePreviewOpen}
          onMobilePreviewClose={() => setBannersMobilePreviewOpen(false)}
        />
      ) : null}

      {tab === 'categories' ? (
        <CategoriesTab onMessage={setActionMessage} />
      ) : null}

      {tab === 'exclusive-offers' ? (
        <ExclusiveOffersTab editor={exclusiveEditor} />
      ) : null}

      <AddExclusiveProductsModal
        open={exclusiveModalOpen}
        onClose={() => !exclusiveEditor.busy && setExclusiveModalOpen(false)}
        isSubmitting={exclusiveEditor.busy}
        onSubmit={handleAddExclusiveProducts}
      />

      <AdminNewBannerModal
        open={bannerModal.open}
        mode={bannerModal.mode}
        placement={bannerModal.placement}
        placementKey={bannerModal.placementKey}
        placements={modalPlacements}
        initialBanner={bannerModal.initialBanner}
        targets={bannerTargets}
        targetsLoading={bannerTargetsLoading}
        tapActions={platform === 'champ' ? CHAMP_TAP_ACTIONS : undefined}
        audiences={platform === 'champ' ? CHAMP_AUDIENCES : undefined}
        onTapActionChange={loadBannerTargets}
        onClose={closeBannerModal}
        onSubmit={handleBannerSubmit}
        isSubmitting={isSavingBanner}
        error={bannerSaveError}
      />

      <PreviewModal
        open={previewState.open}
        onClose={() =>
          setPreviewState((prev) => ({ ...prev, open: false, loading: false, error: null }))
        }
        preview={previewState.data}
        error={previewState.error}
      />
    </div>
  )
}
