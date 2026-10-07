import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Check,
  ChefHat,
  ChevronLeft,
  ChevronRight,
  Flame,
  Leaf,
  Plus,
  Snowflake,
  Sparkles,
  Star,
  Trash2,
  Wheat,
  X,
} from 'lucide-react'
import vegetarianBadgeIcon from '../../../assets/🥗.png'
import { useApiResource } from '../../../hooks/useApiResource'
import { apiConfig, isAdminRealApiFeature } from '../../../api/config'
import { formatApiErrorMessage } from '../../../api/errors'
import { adminService } from '../../../services/adminService'
import { adminSlaModelsService } from '../../../services/admin/slaModelsService'
import { mapPlatformCommercialDefaultsToForm } from '../../../mappers/admin/mapPlatformCommercialDefaults'
import AdminIconImageUpload from '../../../components/admin/AdminIconImageUpload'
import { AdminLeaveFormModal } from '../../../components/admin/AdminLeaveFormModal'
import { ApiState } from '../../../components/admin/ApiState'
import { cn } from '../../../components/admin/cn'
import AdminItemClassConvertModal from '../../../components/admin/management/AdminItemClassConvertModal'
import AdminStoreTypeCatalogCard from '../../../components/admin/management/AdminStoreTypeCatalogCard'
import AdminStoreTypeHotFoodDefaults, {
  EMPTY_HOT_FOOD_DEFAULTS,
  buildHotFoodDefaultsPayload,
  hotFoodSeedMissingMessage,
  normalizeHotFoodDefaults,
} from '../../../components/admin/management/AdminStoreTypeHotFoodDefaults'
import AdminScheduledFeesPanel from '../../../components/admin/management/AdminScheduledFeesPanel'
import {
  EMPTY_SCHEDULED_FEES,
  buildScheduledFeesPayload,
  normalizeScheduledFees,
  scheduledFreeDeliveryMissingMessage,
} from '../../../components/admin/management/scheduledFeesForm'
import { useAdminFormNavigationGuard } from '../../../hooks/useAdminFormNavigationGuard'
import { normalizeItemClasses } from '../../../mappers/admin/mapAdminStoreTypes'
import { commissionServiceLabelsForStoreTypeModes } from '../../../mappers/admin/mapAdminVendorCommission'
import { mapStoreTypeCommissionDefaultsResponse } from '../../../mappers/admin/mapStoreTypeCommissionDefaults'
import AdminStoreTypeCommissionSection from '../../../components/admin/management/AdminStoreTypeCommissionSection'

const labelClass = 'mb-1.5 block text-[12px] font-medium text-[#7c8780]'
const inputClass =
  'box-border h-[40px] w-full rounded-[8px] border border-[rgba(0,0,0,0.1)] bg-white px-3 text-[13px] text-[#17231c] outline-none transition placeholder:text-[#9aa49d] focus:border-[#1aa054]'

const ORDER_MODES = [
  'Hot food — on demand',
  'Pickup',
  'Dine-in',
  'Scheduled',
  'Services',
]

const DEFAULT_BADGES = [
  { id: 'spicy', label: 'Spicy', Icon: Flame, bg: '#fdebec', text: '#d64044' },
  { id: 'vegan', label: 'Vegan', Icon: Leaf, bg: '#e8f7ed', text: '#147940' },
  { id: 'vegetarian', label: 'Vegetarian', iconSrc: vegetarianBadgeIcon, bg: '#e8f7ed', text: '#147940' },
  { id: 'bestseller', label: 'Bestseller', Icon: Star, bg: '#fff5d9', text: '#9a6510' },
  { id: 'new', label: 'New', Icon: Sparkles, bg: '#eaf2fc', text: '#2b66a5' },
  { id: 'chef', label: "Chef's special", Icon: ChefHat, bg: '#f1eafe', text: '#7752a8' },
  { id: 'halal', label: 'Halal', Icon: Check, bg: '#e8f7ed', text: '#147940' },
  { id: 'gluten', label: 'Gluten-free', Icon: Wheat, bg: '#fff5d9', text: '#9a6510' },
  { id: 'frozen', label: 'Frozen', Icon: Snowflake, bg: '#eaf2fc', text: '#2b66a5' },
  { id: 'hot', label: 'Hot deal', Icon: Flame, bg: '#fdebec', text: '#d64044' },
]

const DEFAULT_CATEGORIES = [
  {
    id: 'c1',
    name: 'Main dishes',
    visible: true,
    itemCount: 24,
    subCategoryCount: 3,
    children: [
      {
        id: 'c1-1',
        name: 'Grilled',
        children: [{ id: 'c1-1-1', name: 'Meat' }],
      },
      {
        id: 'c1-2',
        name: 'Rice dishes',
        children: [{ id: 'c1-2-1', name: 'Chicken' }],
      },
    ],
  },
]

const EMPTY_MODES = {
  'Hot food — on demand': false,
  Pickup: false,
  'Dine-in': false,
  Scheduled: false,
  Services: false,
}

const DEFAULT_ALLOWED_VEHICLES = { bike: true, car: true }
const DEFAULT_ITEM_CLASSES = { allowsNormalItems: true, allowsSpecialItems: true }

function normalizeAllowedVehicles(value) {
  if (!value || typeof value !== 'object') return { ...DEFAULT_ALLOWED_VEHICLES }
  return {
    bike: value.bike !== undefined ? Boolean(value.bike) : true,
    car: value.car !== undefined ? Boolean(value.car) : true,
  }
}

function useRealStoreTypes() {
  return isAdminRealApiFeature('store-types') || !apiConfig.adminUseMockApi
}

function serializeStoreTypeState(state) {
  return JSON.stringify({
    displayName: String(state.displayName || '').trim(),
    displayNameAr: String(state.displayNameAr || '').trim(),
    internalKey: String(state.internalKey || '').trim(),
    homeOrder: String(state.homeOrder || '').trim(),
    visibleInApp: Boolean(state.visibleInApp),
    iconUrl: state.iconUrl || null,
    modes: state.modes || {},
    allowedVehicles: normalizeAllowedVehicles(state.allowedVehicles),
    itemClasses: normalizeItemClasses(state.itemClasses),
    structure: state.structure || 'SINGLE',
    subTypes: state.subTypes || [],
    categories: state.categories || [],
    badges: (state.badges || []).map((badge) => ({
      id: badge.id,
      label: badge.label,
      bg: badge.bg,
      text: badge.text,
    })),
    catalogMode: state.catalogMode || 'MODIFIERS',
    lowStockThreshold: String(state.lowStockThreshold ?? 5),
    hotFood: state.hotFood || EMPTY_HOT_FOOD_DEFAULTS,
    scheduledFees: state.scheduledFees || EMPTY_SCHEDULED_FEES,
  })
}

function mockInitialValues(storeTypeId, isEdit) {
  if (!isEdit) {
    return {
      displayName: '',
      displayNameAr: '',
      internalKey: '',
      homeOrder: '',
      visibleInApp: true,
      iconUrl: null,
      modes: { ...EMPTY_MODES },
      allowedVehicles: { ...DEFAULT_ALLOWED_VEHICLES },
      itemClasses: { ...DEFAULT_ITEM_CLASSES },
      structure: 'SINGLE',
      subTypes: [],
      categories: [],
      badges: [],
      catalogMode: 'MODIFIERS',
      lowStockThreshold: 5,
      hotFood: normalizeHotFoodDefaults(null),
      scheduledFees: normalizeScheduledFees(null),
    }
  }

  const displayName =
    storeTypeId === 'dine-in'
      ? 'Dine In'
      : `${String(storeTypeId || '').charAt(0).toUpperCase()}${String(storeTypeId || '').slice(1)}`

  return {
    displayName,
    displayNameAr: '',
    internalKey: String(storeTypeId || '').replace(/-/g, '_'),
    homeOrder: '5',
    visibleInApp: true,
    iconUrl: null,
    modes: {
      'Hot food — on demand': true,
      Pickup: true,
      'Dine-in': true,
      Scheduled: false,
      Services: false,
    },
    allowedVehicles: { ...DEFAULT_ALLOWED_VEHICLES },
    itemClasses: { ...DEFAULT_ITEM_CLASSES },
    structure: 'SINGLE',
    subTypes: [],
    categories: DEFAULT_CATEGORIES,
    badges: DEFAULT_BADGES,
    catalogMode: 'MODIFIERS',
    lowStockThreshold: 5,
    hotFood: normalizeHotFoodDefaults(null),
    scheduledFees: normalizeScheduledFees(null),
  }
}

function initialFromDetail(detail, deliveryDefaults = null, commissionDefaults = null) {
  const slug = detail.internalKey || detail.slug || ''

  return {
    displayName: detail.displayName || '',
    displayNameAr: detail.displayNameAr || '',
    internalKey: slug,
    homeOrder: detail.homeOrder || '',
    visibleInApp: Boolean(detail.visibleInApp),
    iconUrl: detail.iconUrl || null,
    modes: detail.modes || { ...EMPTY_MODES },
    allowedVehicles: normalizeAllowedVehicles(
      deliveryDefaults?.allowedVehicles ?? detail.allowedVehicles ?? DEFAULT_ALLOWED_VEHICLES,
    ),
    itemClasses: normalizeItemClasses(detail.itemClasses),
    structure: detail.structure === 'TWO_LEVEL' ? 'TWO_LEVEL' : 'SINGLE',
    subTypes: Array.isArray(detail.subTypes)
      ? detail.subTypes.map((sub) => ({
          ...sub,
          iconUrl: sub.iconUrl || null,
        }))
      : [],
    categories: Array.isArray(detail.categories) ? detail.categories : [],
    badges: (Array.isArray(detail.badges) ? detail.badges : []).map((badge) => ({
      ...badge,
      Icon: badge.Icon || Check,
    })),
    catalogMode:
      detail.catalogMode === 'VARIANTS' || detail.catalogMode === 'HYBRID'
        ? 'VARIANTS'
        : 'MODIFIERS',
    lowStockThreshold: detail.lowStockThreshold ?? 5,
    hotFood: normalizeHotFoodDefaults(deliveryDefaults?.hotFoodOnDemand),
    scheduledFees: normalizeScheduledFees(deliveryDefaults?.scheduled),
    commercialInheritance: deliveryDefaults?.inheritance ?? null,
    commission: commissionDefaults?.commission ?? null,
    commissionSectionInheritance: commissionDefaults?.sectionInheritance ?? 'empty',
  }
}

function findCategory(nodes, id) {
  for (const node of nodes || []) {
    if (node.id === id) return node
    const found = findCategory(node.children, id)
    if (found) return found
  }
  return null
}

function ActionIconButton({ label, onClick, danger = false, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'grid h-7 w-7 shrink-0 place-items-center rounded-md text-[#8a948e] hover:bg-[#f3f5f3]',
        danger && 'hover:bg-[#fdebec] hover:text-[#d64044]',
      )}
      aria-label={label}
    >
      {children}
    </button>
  )
}

function EditIcon() {
  return <span className="text-[14px]">✎</span>
}

function DisplayNameLanguageToggle({ value, onChange, disabled = false }) {
  return (
    <div
      className={cn(
        'inline-flex shrink-0 rounded-full border border-[#e4e8e4] bg-white p-0.5',
        disabled && 'pointer-events-none opacity-60',
      )}
    >
      {[
        { key: 'en', label: 'English' },
        { key: 'ar', label: 'العربية' },
      ].map((opt) => (
        <button
          key={opt.key}
          type="button"
          disabled={disabled}
          onClick={() => onChange(opt.key)}
          className={cn(
            'h-[28px] rounded-full px-3 text-[11px] font-semibold transition',
            value === opt.key
              ? 'bg-[#e8f7ed] text-[#147940]'
              : 'text-[#7c8780] hover:bg-[#f6f8f6]',
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

function Toggle({ checked, onChange, label }) {
  return (
    <div className="flex items-center gap-2.5">
      {label ? (
        <span className={cn('text-[12.5px] font-medium', checked ? 'text-[#1aa054]' : 'text-[#7c8780]')}>
          {label}
        </span>
      ) : null}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative h-[28px] w-[48px] shrink-0 rounded-full transition',
          checked ? 'bg-[#2E9E4D]' : 'bg-[#d5dbd7]',
        )}
      >
        <span
          className={cn(
            'absolute top-[3px] h-[22px] w-[22px] rounded-full bg-white shadow transition',
            checked ? 'left-[23px]' : 'left-[3px]',
          )}
        />
      </button>
    </div>
  )
}

function Card({ title, subtitle, action, children }) {
  return (
    <section className="rounded-[14px] border border-[#eceeec] bg-white p-5 shadow-[0_1px_2px_rgba(20,40,28,.03)] max-[700px]:p-4">
      {(title || action) ? (
        <div className={cn('mb-4 flex flex-wrap justify-between gap-2', subtitle ? 'items-start' : 'items-center')}>
          <div className="min-w-0">
            {title ? <h3 className="text-[15px] font-bold text-[#17231c]">{title}</h3> : null}
            {subtitle ? <p className="mt-1 max-w-[520px] text-[12px] leading-[16px] text-[#7c8780]">{subtitle}</p> : null}
          </div>
          {action}
        </div>
      ) : null}
      {children}
    </section>
  )
}

function InlineNameRow({
  value,
  onChange,
  onSubmit,
  onCancel,
  placeholder = 'Name',
  disabled = false,
  autoFocus = true,
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        className={cn(inputClass, 'min-w-[180px] flex-1')}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            onSubmit()
          }
          if (e.key === 'Escape') onCancel()
        }}
      />
      <button
        type="button"
        disabled={disabled || !String(value || '').trim()}
        onClick={onSubmit}
        className="inline-flex h-[34px] items-center rounded-full bg-[#2E9E4D] px-3.5 text-[12px] font-bold text-white hover:bg-[#158a47] disabled:opacity-60"
      >
        Save
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={onCancel}
        className="inline-flex h-[34px] items-center rounded-full border border-[#dfe4e0] bg-white px-3 text-[12px] font-medium text-[#7c8780] hover:bg-[#f6f8f6] disabled:opacity-60"
      >
        Cancel
      </button>
    </div>
  )
}

function CategoryNode({
  node,
  depth = 0,
  onToggleVisible,
  onAddChild,
  onRemove,
  onEdit,
  editingId,
  editValue,
  onEditChange,
  onEditSave,
  onEditCancel,
  draftingParentId,
  draftValue,
  onDraftChange,
  onDraftSave,
  onDraftCancel,
  busy = false,
}) {
  const subCount = node.subCategoryCount ?? node.children?.length ?? 0
  const itemCount = node.itemCount
    ?? node.children?.reduce((sum, child) => sum + (child.children?.length || 0), 0)
    ?? 0
  const isEditing = editingId === node.id
  const isDraftingHere = draftingParentId === node.id

  const childProps = {
    onToggleVisible,
    onAddChild,
    onRemove,
    onEdit,
    editingId,
    editValue,
    onEditChange,
    onEditSave,
    onEditCancel,
    draftingParentId,
    draftValue,
    onDraftChange,
    onDraftSave,
    onDraftCancel,
    busy,
  }

  if (depth === 0) {
    return (
      <div className="rounded-[14px] border border-[#e8ebe9] bg-white">
        <div className="flex flex-wrap items-center gap-3 px-4 py-3.5">
          <div className="min-w-0 flex-1">
            {isEditing ? (
              <InlineNameRow
                value={editValue}
                onChange={onEditChange}
                onSubmit={onEditSave}
                onCancel={onEditCancel}
                placeholder="Category name"
                disabled={busy}
              />
            ) : (
              <>
                <p className="text-[14px] font-bold leading-tight text-[#17231c]">{node.name}</p>
                <p className="mt-1 text-[12px] leading-tight text-[#8a948e]">
                  Category · {itemCount} items · {subCount} sub-categories
                </p>
              </>
            )}
          </div>
          {!isEditing ? (
            <div className="flex shrink-0 items-center gap-2">
              <Toggle
                checked={Boolean(node.visible)}
                onChange={(next) => onToggleVisible(node.id, next)}
                label="Visible"
              />
              <ActionIconButton label={`Edit ${node.name}`} onClick={() => onEdit?.(node)}>
                <EditIcon />
              </ActionIconButton>
              <ActionIconButton label={`Delete ${node.name}`} danger onClick={() => onRemove(node.id)}>
                <Trash2 size={14} strokeWidth={1.8} />
              </ActionIconButton>
            </div>
          ) : null}
        </div>

        <div className="px-4 pb-4">
          {isDraftingHere ? (
            <InlineNameRow
              value={draftValue}
              onChange={onDraftChange}
              onSubmit={onDraftSave}
              onCancel={onDraftCancel}
              placeholder="Sub-category name"
              disabled={busy}
            />
          ) : (
            <button
              type="button"
              disabled={busy}
              onClick={() => onAddChild(node.id, 1)}
              className="flex h-[38px] w-full items-center justify-center gap-1.5 rounded-[10px] border border-[#2E9E4D] bg-[#eaf7ef] text-[13px] font-medium text-[#1aa054] hover:bg-[#e0f3e7] disabled:opacity-60"
            >
              <Plus size={15} strokeWidth={2.2} />
              Add sub-category
            </button>
          )}

          {(node.children?.length || 0) > 0 ? (
            <div className="relative mt-3 ml-1 space-y-4 border-l-2 border-[#cfe8d8] pl-4">
              {node.children.map((child) => (
                <CategoryNode key={child.id} node={child} depth={1} {...childProps} />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    )
  }

  if (depth === 1) {
    return (
      <div className="relative">
        <div className="flex min-h-[36px] flex-wrap items-center gap-2">
          <ChevronRight size={14} className="shrink-0 text-[#9aa49d]" strokeWidth={2.2} />
          {isEditing ? (
            <div className="min-w-0 flex-1">
              <InlineNameRow
                value={editValue}
                onChange={onEditChange}
                onSubmit={onEditSave}
                onCancel={onEditCancel}
                placeholder="Sub-category name"
                disabled={busy}
              />
            </div>
          ) : (
            <>
              <span className="text-[13px] font-bold text-[#17231c]">{node.name}</span>
              <span className="text-[12px] text-[#8a948e]">Sub-category</span>
              <div className="ml-auto flex items-center gap-0.5">
                <ActionIconButton label={`Edit ${node.name}`} onClick={() => onEdit?.(node)}>
                  <EditIcon />
                </ActionIconButton>
                <ActionIconButton label={`Delete ${node.name}`} danger onClick={() => onRemove(node.id)}>
                  <Trash2 size={14} strokeWidth={1.8} />
                </ActionIconButton>
              </div>
            </>
          )}
        </div>

        <div className="mt-2 space-y-2">
          {isDraftingHere ? (
            <InlineNameRow
              value={draftValue}
              onChange={onDraftChange}
              onSubmit={onDraftSave}
              onCancel={onDraftCancel}
              placeholder="Sub-sub category name"
              disabled={busy}
            />
          ) : (
            <button
              type="button"
              disabled={busy}
              onClick={() => onAddChild(node.id, 2)}
              className="flex h-[34px] w-full items-center justify-center gap-1.5 rounded-[8px] border border-[#2E9E4D] bg-[#eaf7ef] text-[12.5px] font-medium text-[#1aa054] hover:bg-[#e0f3e7] disabled:opacity-60"
            >
              <Plus size={14} strokeWidth={2.2} />
              Add sub-sub category
            </button>
          )}

          {(node.children?.length || 0) > 0 ? (
            <div className="space-y-1.5">
              {node.children.map((child) => (
                <CategoryNode key={child.id} node={child} depth={2} {...childProps} />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    )
  }

  return (
    <div className="ml-[100px] flex min-h-[36px] items-center gap-2.5 rounded-[10px] border border-[#ebeeed] bg-white px-3">
      <span className="text-[14px] leading-none text-[#9aa49d]">•</span>
      {isEditing ? (
        <div className="min-w-0 flex-1 py-1.5">
          <InlineNameRow
            value={editValue}
            onChange={onEditChange}
            onSubmit={onEditSave}
            onCancel={onEditCancel}
            placeholder="Name"
            disabled={busy}
          />
        </div>
      ) : (
        <>
          <span className="min-w-0 flex-1 text-[13px] font-medium text-[#17231c]">{node.name}</span>
          <ActionIconButton label={`Edit ${node.name}`} onClick={() => onEdit?.(node)}>
            <EditIcon />
          </ActionIconButton>
          <ActionIconButton label={`Delete ${node.name}`} danger onClick={() => onRemove(node.id)}>
            <Trash2 size={14} strokeWidth={1.8} />
          </ActionIconButton>
        </>
      )}
    </div>
  )
}

function StoreTypeForm({
  initial,
  onBack,
  storeTypeId = null,
  mode = 'create',
  canSaveRemote = false,
  liveCommercialInheritance = null,
  liveCommission = null,
  liveCommissionSectionInheritance = null,
  onDeliveryDefaultsRefetch = null,
  onCommissionDefaultsRefetch = null,
  liveHotFoodOnDemand = null,
  liveScheduledFees = null,
}) {
  const [displayName, setDisplayName] = useState(initial.displayName)
  const [displayNameAr, setDisplayNameAr] = useState(initial.displayNameAr || '')
  const [displayNameLang, setDisplayNameLang] = useState('en')
  const [internalKey, setInternalKey] = useState(initial.internalKey)
  const [homeOrder, setHomeOrder] = useState(initial.homeOrder)
  const [visibleInApp, setVisibleInApp] = useState(initial.visibleInApp)
  const [iconUrl, setIconUrl] = useState(initial.iconUrl)
  const [modes, setModes] = useState(initial.modes)
  const [servicesStoreTypeExists, setServicesStoreTypeExists] = useState(false)

  useEffect(() => {
    let cancelled = false
    adminService
      .listStoreTypes()
      .then((result) => {
        if (cancelled) return
        const rows = Array.isArray(result?.data?.storeTypes) ? result.data.storeTypes : []
        setServicesStoreTypeExists(
          rows.some((row) => String(row?.slug || '').trim().toLowerCase() === 'services'),
        )
      })
      .catch(() => {
        if (!cancelled) setServicesStoreTypeExists(false)
      })
    return () => {
      cancelled = true
    }
  }, [])
  const commissionServiceLabels = useMemo(
    () => commissionServiceLabelsForStoreTypeModes(modes),
    [modes],
  )
  const [allowedVehicles, setAllowedVehicles] = useState(() =>
    normalizeAllowedVehicles(initial.allowedVehicles),
  )
  const [itemClasses, setItemClasses] = useState(() =>
    normalizeItemClasses(initial.itemClasses),
  )
  const [itemClassConvertConfirm, setItemClassConvertConfirm] = useState(null)
  const [convertModal, setConvertModal] = useState({
    open: false,
    disable: null,
    preview: null,
    previewLoading: false,
    previewError: null,
    choice: 'convert',
  })
  const [structure, setStructure] = useState(initial.structure || 'SINGLE')
  const [subTypes, setSubTypes] = useState(
    Array.isArray(initial.subTypes) ? initial.subTypes : [],
  )
  const [categories, setCategories] = useState(initial.categories)
  const [badges, setBadges] = useState(initial.badges)
  const [catalogMode, setCatalogMode] = useState(initial.catalogMode || 'MODIFIERS')
  const [lowStockThreshold, setLowStockThreshold] = useState(
    String(initial.lowStockThreshold ?? 5),
  )
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [nestedBusy, setNestedBusy] = useState(false)
  const [draftingRoot, setDraftingRoot] = useState(false)
  const [rootDraftName, setRootDraftName] = useState('')
  const [draftingChild, setDraftingChild] = useState(null)
  const [childDraftName, setChildDraftName] = useState('')
  const [editingCategoryId, setEditingCategoryId] = useState(null)
  const [editingCategoryName, setEditingCategoryName] = useState('')
  const [draftingBadge, setDraftingBadge] = useState(false)
  const [badgeDraftLabel, setBadgeDraftLabel] = useState('')
  const [editingBadgeId, setEditingBadgeId] = useState(null)
  const [editingBadgeLabel, setEditingBadgeLabel] = useState('')
  const [hotFood, setHotFood] = useState(() =>
    normalizeHotFoodDefaults(initial.hotFood || null),
  )
  const [scheduledFees, setScheduledFees] = useState(() =>
    normalizeScheduledFees(initial.scheduledFees || null),
  )
  const [resettingCommercialSection, setResettingCommercialSection] = useState(null)

  const commercialInheritance = liveCommercialInheritance ?? initial.commercialInheritance

  useEffect(() => {
    if (liveHotFoodOnDemand) {
      setHotFood(normalizeHotFoodDefaults(liveHotFoodOnDemand))
    }
  }, [liveHotFoodOnDemand])

  useEffect(() => {
    if (liveScheduledFees) {
      setScheduledFees(normalizeScheduledFees(liveScheduledFees))
    }
  }, [liveScheduledFees])

  const applyDeliveryDefaultsApi = (data) => {
    if (!data || typeof data !== 'object') return
    if (data.hotFoodOnDemand) {
      setHotFood(normalizeHotFoodDefaults(data.hotFoodOnDemand))
    }
    if (data.scheduled) {
      setScheduledFees(normalizeScheduledFees(data.scheduled))
    }
    if (data.allowedVehicles) {
      setAllowedVehicles(normalizeAllowedVehicles(data.allowedVehicles))
    }
  }

  const handleResetCommercialSection = async (section) => {
    if (!storeTypeId || !canSaveRemote || resettingCommercialSection) return
    setResettingCommercialSection(section)
    setSaveError('')
    try {
      const result = await adminService.resetAdminStoreTypeCommercialSection(storeTypeId, section)
      applyDeliveryDefaultsApi(result?.data)
      if (typeof onDeliveryDefaultsRefetch === 'function') {
        await onDeliveryDefaultsRefetch()
      }
    } catch (err) {
      setSaveError(
        formatApiErrorMessage(err, 'Failed to reset section to SLA platform defaults.'),
      )
    } finally {
      setResettingCommercialSection(null)
    }
  }

  const baselineSnapshot = useMemo(() => serializeStoreTypeState(initial), [initial])
  const currentSnapshot = useMemo(
    () =>
      serializeStoreTypeState({
        displayName,
        displayNameAr,
        internalKey,
        homeOrder,
        visibleInApp,
        iconUrl,
        modes,
        allowedVehicles,
        itemClasses,
        structure,
        subTypes,
        categories,
        badges,
        catalogMode,
        lowStockThreshold,
        hotFood,
        scheduledFees,
      }),
    [
      displayName,
      displayNameAr,
      internalKey,
      homeOrder,
      visibleInApp,
      iconUrl,
      modes,
      allowedVehicles,
      itemClasses,
      structure,
      subTypes,
      categories,
      badges,
      catalogMode,
      lowStockThreshold,
      hotFood,
      scheduledFees,
    ],
  )
  const isDirty = currentSnapshot !== baselineSnapshot

  const {
    allowLeave,
    requestLeave,
    leaveModalOpen,
    handleStayEditing,
    handleLeaveWithoutSaving,
  } = useAdminFormNavigationGuard({ isDirty })

  const handleBack = () => requestLeave(onBack)

  const titleName = displayName.trim() || displayNameAr.trim() || 'New'
  const isEditMode = mode === 'edit'
  const canManageNested = Boolean(storeTypeId && isEditMode && canSaveRemote)
  const showAllowedVehicles =
    Boolean(modes['Hot food — on demand']) || Boolean(modes.Scheduled)

  const buildFormPayload = (publishStatus = 'DRAFT', visible = visibleInApp) => ({
    displayName,
    displayNameAr,
    internalKey,
    homeOrder,
    visibleInApp: visible,
    isActive: visible,
    iconUrl: iconUrl || null,
    modes,
    itemClasses: normalizeItemClasses(itemClasses),
    ...(itemClassConvertConfirm
      ? {
          confirmConvert: true,
          convertAction: itemClassConvertConfirm.convertAction,
        }
      : {}),
    structure,
    subTypes,
    categories,
    badges,
    publishStatus,
    catalogMode,
    lowStockThreshold,
  })

  const persistAllowedVehicles = async (targetStoreTypeId) => {
    const id = String(targetStoreTypeId || '').trim()
    if (!id) return
    if (!allowedVehicles.bike && !allowedVehicles.car) {
      throw new Error('At least one allowed vehicle (Bike or Car) must stay enabled.')
    }
    await adminService.updateAdminStoreTypeAllowedVehicles(id, {
      bike: Boolean(allowedVehicles.bike),
      car: Boolean(allowedVehicles.car),
    })
  }

  const persistModeFeeDefaults = async (targetStoreTypeId) => {
    const id = String(targetStoreTypeId || '').trim()
    if (!id) return
    const body = {}
    if (modes['Hot food — on demand']) {
      body.hotFoodOnDemand = buildHotFoodDefaultsPayload(hotFood)
    }
    if (modes.Scheduled) {
      body.scheduled = buildScheduledFeesPayload(scheduledFees)
    }
    if (!Object.keys(body).length) return
    await adminService.updateAdminStoreTypeDeliveryDefaults(id, body)
  }

  const closeConvertModal = () => {
    setConvertModal({
      open: false,
      disable: null,
      preview: null,
      previewLoading: false,
      previewError: null,
      choice: 'convert',
    })
  }

  const applyItemClassNarrow = (disable) => {
    const remaining = disable === 'SPECIAL' ? 'NORMAL' : 'SPECIAL'
    setItemClasses({
      allowsNormalItems: remaining === 'NORMAL',
      allowsSpecialItems: remaining === 'SPECIAL',
    })
    setItemClassConvertConfirm({
      convertAction: remaining === 'NORMAL' ? 'convert_to_normal' : 'convert_to_special',
      disable,
    })
    closeConvertModal()
  }

  const handleConvertModalConfirm = () => {
    if (convertModal.choice === 'cancel_change') {
      closeConvertModal()
      return
    }
    if (convertModal.disable === 'NORMAL' || convertModal.disable === 'SPECIAL') {
      applyItemClassNarrow(convertModal.disable)
    }
  }

  const requestItemClassToggle = async (key) => {
    const currentlyOn = Boolean(itemClasses[key])
    if (!currentlyOn) {
      setItemClasses((prev) => ({ ...prev, [key]: true }))
      setItemClassConvertConfirm(null)
      setSaveError('')
      return
    }

    const otherKey = key === 'allowsNormalItems' ? 'allowsSpecialItems' : 'allowsNormalItems'
    if (!itemClasses[otherKey]) {
      setSaveError('At least one item class (Normal or Special) must stay enabled.')
      return
    }

    const disable = key === 'allowsNormalItems' ? 'NORMAL' : 'SPECIAL'

    // Create / mock: no vendors yet — toggle locally without convert modal.
    if (!isEditMode || !canSaveRemote || !storeTypeId) {
      applyItemClassNarrow(disable)
      setItemClassConvertConfirm(null)
      return
    }

    setSaveError('')
    setConvertModal({
      open: true,
      disable,
      preview: null,
      previewLoading: true,
      previewError: null,
      choice: 'convert',
    })

    try {
      const result = await adminService.getAdminStoreTypeItemClassConvertPreview(
        storeTypeId,
        disable,
      )
      setConvertModal((prev) => ({
        ...prev,
        previewLoading: false,
        preview: result?.data ?? null,
        previewError: null,
      }))
    } catch (err) {
      setConvertModal((prev) => ({
        ...prev,
        previewLoading: false,
        preview: null,
        previewError: formatApiErrorMessage(err, 'Failed to load convert preview.'),
      }))
    }
  }

  const handleSave = async (intent = 'DRAFT') => {
    if (!canSaveRemote) {
      handleBack()
      return
    }

    if (isEditMode && !storeTypeId) {
      setSaveError('Missing store type id.')
      return
    }

    // Toggle is the source of truth for customer-app visibility (list Visible = PUBLISHED + isActive).
    const nextVisible = Boolean(visibleInApp)
    const publishStatus = nextVisible ? 'PUBLISHED' : 'DRAFT'

    if (nextVisible) {
      const hasMode = Object.values(modes || {}).some(Boolean)
      if (!hasMode) {
        setSaveError('Enable at least one order mode before making this store type visible.')
        return
      }
    }

    if (modes['Hot food — on demand']) {
      const feeError = hotFoodSeedMissingMessage(hotFood)
      if (feeError) {
        setSaveError(feeError)
        return
      }
    }

    if (modes.Scheduled) {
      const scheduledError = scheduledFreeDeliveryMissingMessage(scheduledFees)
      if (scheduledError) {
        setSaveError(scheduledError)
        return
      }
    }

    if (intent === 'PUBLISHED' && !nextVisible) {
      setSaveError('Turn on "Visible in customer app" to publish this store type.')
      return
    }

    setSaving(true)
    setSaveError('')
    try {
      if (isEditMode) {
        await adminService.updateAdminStoreType(
          storeTypeId,
          buildFormPayload(publishStatus, nextVisible),
        )
        await persistAllowedVehicles(storeTypeId)
        await persistModeFeeDefaults(storeTypeId)
      } else {
        const created = await adminService.createAdminStoreType(
          buildFormPayload(publishStatus, nextVisible),
        )
        const createdId = created?.data?.id
        if (createdId) {
          await persistAllowedVehicles(createdId)
          await persistModeFeeDefaults(createdId)
        }
      }
      allowLeave()
      onBack()
    } catch (err) {
      setSaveError(
        formatApiErrorMessage(
          err,
          isEditMode ? 'Failed to update store type.' : 'Failed to create store type.',
        ),
      )
    } finally {
      setSaving(false)
    }
  }

  const servicesModeBlocked =
    String(internalKey || '').trim().toLowerCase() !== 'services' && !servicesStoreTypeExists

  const toggleMode = (modeKey) => {
    if (modeKey === 'Services' && !modes.Services && servicesModeBlocked) {
      return
    }
    setSaveError('')
    setModes((prev) => ({ ...prev, [modeKey]: !prev[modeKey] }))
  }

  const toggleAllowedVehicle = (key) => {
    setAllowedVehicles((prev) => {
      const currentlyOn = Boolean(prev[key])
      if (currentlyOn) {
        const other = key === 'bike' ? 'car' : 'bike'
        if (!prev[other]) {
          setSaveError('At least one allowed vehicle (Bike or Car) must stay enabled.')
          return prev
        }
      }
      setSaveError('')
      return { ...prev, [key]: !currentlyOn }
    })
  }

  const insertCategoryInTree = (nodes, parentId, child) => {
    if (!parentId) return [...nodes, child]
    return nodes.map((node) => {
      if (node.id === parentId) {
        const children = [...(node.children || []), child]
        return { ...node, children, subCategoryCount: children.length }
      }
      if (node.children?.length) {
        return { ...node, children: insertCategoryInTree(node.children, parentId, child) }
      }
      return node
    })
  }

  const patchCategoryInTree = (nodes, id, patch) =>
    nodes.map((node) => {
      if (node.id === id) return { ...node, ...patch }
      if (node.children?.length) {
        return { ...node, children: patchCategoryInTree(node.children, id, patch) }
      }
      return node
    })

  const removeCategoryFromTree = (nodes, id) =>
    nodes
      .filter((node) => node.id !== id)
      .map((node) => ({
        ...node,
        children: node.children ? removeCategoryFromTree(node.children, id) : [],
      }))

  const runNested = async (action, fallbackMessage) => {
    setNestedBusy(true)
    setSaveError('')
    try {
      await action()
    } catch (err) {
      setSaveError(formatApiErrorMessage(err, fallbackMessage))
    } finally {
      setNestedBusy(false)
    }
  }

  const updateCategoryVisible = (id, visible) => {
    if (!canManageNested) {
      setCategories((prev) => patchCategoryInTree(prev, id, { visible }))
      return
    }
    const current = findCategory(categories, id)
    runNested(async () => {
      const { data } = await adminService.updateAdminStoreTypeMenuCategory(storeTypeId, id, {
        name: current?.name,
        isVisible: visible,
        visible,
      })
      setCategories((prev) =>
        patchCategoryInTree(prev, id, {
          visible: data.visible,
          name: data.name,
          itemCount: data.itemCount,
        }),
      )
    }, 'Failed to update category visibility.')
  }

  const startEditCategory = (node) => {
    setDraftingRoot(false)
    setDraftingChild(null)
    setEditingCategoryId(node.id)
    setEditingCategoryName(node.name || '')
  }

  const cancelEditCategory = () => {
    setEditingCategoryId(null)
    setEditingCategoryName('')
  }

  const saveEditCategory = () => {
    const name = String(editingCategoryName || '').trim()
    if (!name || !editingCategoryId) return
    const node = findCategory(categories, editingCategoryId)
    if (!node) return

    if (!canManageNested) {
      setCategories((prev) => patchCategoryInTree(prev, editingCategoryId, { name }))
      cancelEditCategory()
      return
    }

    runNested(async () => {
      const { data } = await adminService.updateAdminStoreTypeMenuCategory(
        storeTypeId,
        editingCategoryId,
        { name, isVisible: node.visible, visible: node.visible },
      )
      setCategories((prev) =>
        patchCategoryInTree(prev, editingCategoryId, {
          name: data.name,
          visible: data.visible,
        }),
      )
      cancelEditCategory()
    }, 'Failed to update category.')
  }

  const startAddRootCategory = () => {
    setEditingCategoryId(null)
    setDraftingChild(null)
    setDraftingRoot(true)
    setRootDraftName('')
  }

  const cancelAddRootCategory = () => {
    setDraftingRoot(false)
    setRootDraftName('')
  }

  const saveRootCategory = () => {
    const trimmed = String(rootDraftName || '').trim()
    if (!trimmed) return

    if (!canManageNested) {
      setCategories((prev) => [
        ...prev,
        { id: `c${Date.now()}`, name: trimmed, visible: true, children: [], itemCount: 0 },
      ])
      cancelAddRootCategory()
      return
    }

    runNested(async () => {
      const { data } = await adminService.addAdminStoreTypeMenuCategory(storeTypeId, {
        name: trimmed,
        sortOrder: categories.length + 1,
      })
      setCategories((prev) => [...prev, { ...data, children: [] }])
      cancelAddRootCategory()
    }, 'Failed to add category.')
  }

  const startAddChildCategory = (parentId) => {
    setEditingCategoryId(null)
    setDraftingRoot(false)
    setDraftingChild({ parentId })
    setChildDraftName('')
  }

  const cancelAddChildCategory = () => {
    setDraftingChild(null)
    setChildDraftName('')
  }

  const saveChildCategory = () => {
    const trimmed = String(childDraftName || '').trim()
    const parentId = draftingChild?.parentId
    if (!trimmed || !parentId) return

    if (!canManageNested) {
      setCategories((prev) =>
        insertCategoryInTree(prev, parentId, {
          id: `${parentId}-${Date.now()}`,
          name: trimmed,
          children: [],
          visible: true,
          itemCount: 0,
        }),
      )
      cancelAddChildCategory()
      return
    }

    runNested(async () => {
      const parent = findCategory(categories, parentId)
      const sortOrder = (parent?.children?.length || 0) + 1
      const { data } = await adminService.addAdminStoreTypeMenuCategory(storeTypeId, {
        name: trimmed,
        sortOrder,
        parentId,
      })
      setCategories((prev) => insertCategoryInTree(prev, parentId, { ...data, children: [] }))
      cancelAddChildCategory()
    }, 'Failed to add sub-category.')
  }

  const removeCategory = (id) => {
    if (!canManageNested) {
      setCategories((prev) => removeCategoryFromTree(prev, id))
      if (editingCategoryId === id) cancelEditCategory()
      return
    }

    runNested(async () => {
      await adminService.deleteAdminStoreTypeMenuCategory(storeTypeId, id)
      setCategories((prev) => removeCategoryFromTree(prev, id))
      if (editingCategoryId === id) cancelEditCategory()
    }, 'Failed to delete category.')
  }

  const removeBadge = (id) => {
    if (!canManageNested) {
      setBadges((prev) => prev.filter((badge) => badge.id !== id))
      if (editingBadgeId === id) {
        setEditingBadgeId(null)
        setEditingBadgeLabel('')
      }
      return
    }
    runNested(async () => {
      await adminService.deleteAdminStoreTypeBadge(storeTypeId, id)
      setBadges((prev) => prev.filter((badge) => badge.id !== id))
      if (editingBadgeId === id) {
        setEditingBadgeId(null)
        setEditingBadgeLabel('')
      }
    }, 'Failed to delete badge.')
  }

  const startEditBadge = (badge) => {
    setDraftingBadge(false)
    setEditingBadgeId(badge.id)
    setEditingBadgeLabel(badge.label || '')
  }

  const cancelEditBadge = () => {
    setEditingBadgeId(null)
    setEditingBadgeLabel('')
  }

  const saveEditBadge = () => {
    const label = String(editingBadgeLabel || '').trim()
    if (!label || !editingBadgeId) return
    const badge = badges.find((item) => item.id === editingBadgeId)
    if (!badge) return

    if (!canManageNested) {
      setBadges((prev) => prev.map((item) => (item.id === editingBadgeId ? { ...item, label } : item)))
      cancelEditBadge()
      return
    }

    runNested(async () => {
      const { data } = await adminService.updateAdminStoreTypeBadge(storeTypeId, editingBadgeId, {
        label,
        color: badge.bg,
        sortOrder: badge.sortOrder,
      })
      setBadges((prev) =>
        prev.map((item) =>
          item.id === editingBadgeId ? { ...item, ...data, Icon: item.Icon || Check } : item,
        ),
      )
      cancelEditBadge()
    }, 'Failed to update badge.')
  }

  const startAddBadge = () => {
    setEditingBadgeId(null)
    setDraftingBadge(true)
    setBadgeDraftLabel('')
  }

  const cancelAddBadge = () => {
    setDraftingBadge(false)
    setBadgeDraftLabel('')
  }

  const saveAddBadge = () => {
    const trimmed = String(badgeDraftLabel || '').trim()
    if (!trimmed) return

    if (!canManageNested) {
      setBadges((prev) => [
        ...prev,
        { id: `badge-${Date.now()}`, label: trimmed, Icon: Check, bg: '#e8f7ed', text: '#147940' },
      ])
      cancelAddBadge()
      return
    }

    runNested(async () => {
      const { data } = await adminService.addAdminStoreTypeBadge(storeTypeId, {
        label: trimmed,
        icon: '✓',
        color: '#e8f7ed',
        sortOrder: badges.length + 1,
      })
      setBadges((prev) => [...prev, { ...data, Icon: Check }])
      cancelAddBadge()
    }, 'Failed to add badge.')
  }

  return (
    <div className="px-5 pb-10 pt-4 max-[700px]:px-3">
      <div className="mb-5 flex  items-center justify-between gap-3">
        <div className=" flex items-center  gap-4">
          <button
            type="button"
            onClick={handleBack}
            className=" inline-flex items-center gap-1 rounded-full border border-[#dfe4e0] bg-white px-4 py-2.5 text-[12px] font-medium text-[#455249] hover:bg-[#f6f8f6]"
          >
            <ChevronLeft size={14} strokeWidth={2.2} />
            Store types
          </button>
          <div>
            <h2 className="text-[20px] font-bold tracking-[-0.02em] text-[#17231c]">
              Store type · {titleName}
            </h2>
            <p className="mt-1 text-[12.5px] text-[#7c8780]">
              Define identity, fulfillment, order modes, categories, badges &amp; rules.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => handleSave('PUBLISHED')}
          disabled={saving}
          className="inline-flex h-[34px] shrink-0 items-center rounded-full bg-[#2E9E4D] px-4 text-[12px] font-bold text-white hover:bg-[#158a47] disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Publish'}
        </button>
      </div>

      {saveError ? (
        <p className="mb-4 rounded-[10px] border border-[#f5d0d0] bg-[#fdebec] px-3 py-2 text-[12.5px] text-[#d64044]">
          {saveError}
        </p>
      ) : null}

      <div className="space-y-4">
        <Card title="Identity">
          <div className="flex flex-col gap-5 max-[800px]:gap-4 md:flex-row md:items-start">
            <div className="shrink-0 md:w-[132px]">
              <span className={labelClass}>Image</span>
              <AdminIconImageUpload
                iconUrl={iconUrl}
                onUrlChange={setIconUrl}
                size={48}
                feature="store-types"
                disabled={saving}
              />
            </div>

            <div className="grid min-w-0 flex-1 grid-cols-1 gap-5 md:grid-cols-2 md:gap-4">
              <label className="flex min-w-0 flex-col">
                <div className="mb-1.5 flex min-h-[28px] items-center justify-between gap-3">
                  <span className="text-[12px] font-medium text-[#7c8780]">Display name</span>
                  <DisplayNameLanguageToggle
                    value={displayNameLang}
                    onChange={setDisplayNameLang}
                    disabled={saving}
                  />
                </div>
                <input
                  className={inputClass}
                  dir={displayNameLang === 'ar' ? 'rtl' : 'ltr'}
                  lang={displayNameLang === 'ar' ? 'ar' : 'en'}
                  value={displayNameLang === 'ar' ? displayNameAr : displayName}
                  placeholder={
                    displayNameLang === 'ar'
                      ? isEditMode
                        ? undefined
                        : 'مثال: أطعمة'
                      : isEditMode
                        ? undefined
                        : 'e.g. Food'
                  }
                  onChange={(e) =>
                    displayNameLang === 'ar'
                      ? setDisplayNameAr(e.target.value)
                      : setDisplayName(e.target.value)
                  }
                />
              </label>

              <label className="flex min-w-0 flex-col">
                <div className="mb-1.5 flex min-h-[28px] items-center justify-between gap-3">
                  <span className="text-[12px] font-medium text-[#7c8780]">Internal key</span>
                  <span className="hidden h-[28px] shrink-0 md:inline-block md:w-[148px]" aria-hidden />
                </div>
                <input
                  className={inputClass}
                  value={internalKey}
                  placeholder={isEditMode ? undefined : 'e.g. food'}
                  onChange={(e) => setInternalKey(e.target.value)}
                  autoComplete="off"
                  spellCheck={false}
                />
              </label>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 items-end gap-4 md:grid-cols-2">
            <label className="block w-full min-w-0">
              <span className={labelClass}>Home order position</span>
              <input
                className={inputClass}
                value={homeOrder}
                placeholder={isEditMode ? undefined : 'e.g. 5'}
                onChange={(e) => setHomeOrder(e.target.value)}
              />
            </label>

            <div className="flex h-[40px] items-center justify-between gap-3 rounded-[10px] border border-[#eceeec] bg-[#f8faf8] px-4">
              <span className="text-[13px] font-medium text-[#17231c]">Visible in customer app</span>
              <Toggle checked={visibleInApp} onChange={setVisibleInApp} />
            </div>
          </div>
        </Card>

        <AdminStoreTypeCatalogCard
          storeTypeId={isEditMode ? storeTypeId : null}
          catalogMode={catalogMode}
          lowStockThreshold={lowStockThreshold}
          onCatalogModeChange={setCatalogMode}
          onLowStockChange={setLowStockThreshold}
          canPersistAttributes={Boolean(isEditMode && storeTypeId && canSaveRemote)}
        />

        <Card
          title="Catalog structure"
          subtitle="Single-level is a store type only. Two-level also has sub-types (e.g. Services → Salon)."
        >
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'SINGLE', label: 'Single level' },
              { id: 'TWO_LEVEL', label: 'Two-level' },
            ].map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setStructure(option.id)}
                className={cn(
                  'h-[34px] rounded-full border px-4 text-[12.5px] font-bold',
                  structure === option.id
                    ? 'border-[#1aa054] bg-[#e8f7ed] text-[#147940]'
                    : 'border-[#dfe4e0] bg-white text-[#455249]',
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
          {structure === 'TWO_LEVEL' ? (
            <div className="mt-4 space-y-3">
              {subTypes.map((sub, index) => (
                <div
                  key={sub.id || index}
                  className="flex flex-wrap items-center gap-2 rounded-[12px] border border-[#eceeec] bg-[#fafbfa] p-2.5"
                >
                  <AdminIconImageUpload
                    iconUrl={sub.iconUrl || null}
                    onUrlChange={(url) =>
                      setSubTypes((prev) =>
                        prev.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, iconUrl: url } : item,
                        ),
                      )
                    }
                    size={40}
                    feature="store-types"
                    disabled={saving}
                  />
                  <input
                    className={cn(inputClass, 'min-w-[160px] flex-1')}
                    value={sub.name}
                    placeholder={`Sub-type ${index + 1}`}
                    onChange={(event) => {
                      const name = event.target.value
                      setSubTypes((prev) =>
                        prev.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, name } : item,
                        ),
                      )
                    }}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setSubTypes((prev) => prev.filter((_, itemIndex) => itemIndex !== index))
                    }
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-[8px] text-[#8a948e] hover:bg-[#fdebec] hover:text-[#d64044]"
                    aria-label="Remove sub-type"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  setSubTypes((prev) => [
                    ...prev,
                    { id: `new-${Date.now()}`, name: '', iconUrl: null, isNew: true },
                  ])
                }
                className="inline-flex h-[34px] items-center gap-1.5 rounded-full border border-[#1aa054] bg-white px-3.5 text-[12.5px] font-medium text-[#1aa054]"
              >
                <Plus size={14} strokeWidth={2.4} />
                Add sub-type
              </button>
            </div>
          ) : null}
        </Card>

        <Card
          title="Order modes"
          subtitle="Which order types customers can use for stores of this type."
        >
          <p className="mb-3 max-w-xl text-[12.5px] leading-[18px] text-[#5c665f]">
            Services lets vendors of this type also appear under a Services sub-type.
          </p>
          <div className="flex w-fit flex-col gap-2.5">
            {ORDER_MODES.map((mode) => (
              <div key={mode}>
                <div className="flex items-center justify-between gap-3 rounded-[12px] bg-[#f3f5f3] px-4 py-3">
                  <span className="text-[13px] font-medium text-[#17231c]">{mode}</span>
                  <Toggle checked={Boolean(modes[mode])} onChange={() => toggleMode(mode)} />
                </div>
                {mode === 'Services' && servicesModeBlocked ? (
                  <p className="mt-1.5 max-w-[280px] text-[12px] leading-[16px] text-[#d64044]">
                    Create a Services store type before turning Services on.
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </Card>

        {commercialInheritance?.hotFoodOnDemand === 'inherited' ||
        commercialInheritance?.scheduled === 'inherited' ? (
          <div className="rounded-[12px] border border-[#d4e8dc] bg-[#f0faf4] px-4 py-3 text-[12.5px] text-[#2d5a40]">
            Some delivery fee fields are inherited from{' '}
            <strong>SLA platform defaults</strong>. Saving this store type after edits will override
            those values for new vendors.
          </div>
        ) : null}

        {modes['Hot food — on demand'] ? (
          <Card
            title="Hot food fees"
            subtitle="Defaults copied onto a branch the first time Hot food — on demand is turned on. Every field except service fee is required. Zero is allowed."
          >
            <AdminStoreTypeHotFoodDefaults
              value={hotFood}
              onChange={setHotFood}
              disabled={saving || Boolean(resettingCommercialSection)}
            />
            {isEditMode && canSaveRemote && commercialInheritance?.hotFoodOnDemand === 'overridden' ? (
              <button
                type="button"
                disabled={saving || resettingCommercialSection === 'hotFoodOnDemand'}
                onClick={() => void handleResetCommercialSection('hotFoodOnDemand')}
                className="mt-3 inline-flex h-[34px] items-center rounded-full border border-[#e4e8e4] bg-white px-4 text-[12px] font-bold text-[#455249] hover:bg-[#f8faf8] disabled:opacity-60"
              >
                {resettingCommercialSection === 'hotFoodOnDemand'
                  ? 'Resetting…'
                  : 'Reset hot food fees to SLA platform defaults'}
              </button>
            ) : null}
          </Card>
        ) : null}

        {modes.Scheduled ? (
          <Card
            title="Scheduled fees"
            subtitle="Flat rates per speed tier and item class. Copied onto a branch the first time Scheduled is turned on. Empty cells stay empty. No distance fields."
          >
            <AdminScheduledFeesPanel
              value={scheduledFees}
              onChange={setScheduledFees}
              disabled={saving || Boolean(resettingCommercialSection)}
            />
            {isEditMode && canSaveRemote && commercialInheritance?.scheduled === 'overridden' ? (
              <button
                type="button"
                disabled={saving || resettingCommercialSection === 'scheduled'}
                onClick={() => void handleResetCommercialSection('scheduled')}
                className="mt-3 inline-flex h-[34px] items-center rounded-full border border-[#e4e8e4] bg-white px-4 text-[12px] font-bold text-[#455249] hover:bg-[#f8faf8] disabled:opacity-60"
              >
                {resettingCommercialSection === 'scheduled'
                  ? 'Resetting…'
                  : 'Reset scheduled fees to SLA platform defaults'}
              </button>
            ) : null}
          </Card>
        ) : null}

        {showAllowedVehicles ? (
          <Card
            title="Allowed vehicles"
            subtitle="Which vehicles may carry orders for this store type. A vendor may narrow this further, never widen it."
          >
            <div className="flex w-fit flex-col gap-2.5">
              <div className="flex items-center justify-between gap-3 rounded-[12px] bg-[#f3f5f3] px-4 py-3">
                <span className="text-[13px] font-medium text-[#17231c]">Bike</span>
                <Toggle
                  checked={Boolean(allowedVehicles.bike)}
                  onChange={() => toggleAllowedVehicle('bike')}
                />
              </div>
              <div className="flex items-center justify-between gap-3 rounded-[12px] bg-[#f3f5f3] px-4 py-3">
                <span className="text-[13px] font-medium text-[#17231c]">Car</span>
                <Toggle
                  checked={Boolean(allowedVehicles.car)}
                  onChange={() => toggleAllowedVehicle('car')}
                />
              </div>
            </div>
            <div className="mt-3 rounded-[8px] border border-[#b9cfe9] bg-[#eaf2fc] px-3.5 py-2.5 text-[12px] leading-[1.5] text-[#2b66a5]">
              Set <strong>Car only</strong> where goods cannot travel by bike — for example pharmacy
              items needing refrigeration. When both are allowed, the system forces Car if the order
              exceeds the bike capacity threshold.
            </div>
          </Card>
        ) : null}

        {isEditMode && canSaveRemote && storeTypeId ? (
          <Card
            title="Commission & fees"
            subtitle="Inherited from SLA platform defaults unless overridden. Vendors inherit from this store type."
          >
            <AdminStoreTypeCommissionSection
              storeTypeId={storeTypeId}
              commission={liveCommission ?? initial.commission}
              enabledServiceLabels={commissionServiceLabels}
              sectionInheritance={
                liveCommissionSectionInheritance ?? initial.commissionSectionInheritance
              }
              onInheritanceChange={() => {
                if (typeof onCommissionDefaultsRefetch === 'function') {
                  void onCommissionDefaultsRefetch()
                }
              }}
              disabled={saving}
            />
          </Card>
        ) : null}

        <Card
          title="Item classes"
          subtitle="Which item classes stores of this type may carry. This is what opens or closes the choice for everything below."
        >
          <div className="flex w-fit flex-col gap-2.5">
            <div className="flex items-center justify-between gap-3 rounded-[12px] bg-[#f3f5f3] px-4 py-3">
              <span className="text-[13px] font-medium text-[#17231c]">Normal items</span>
              <Toggle
                checked={Boolean(itemClasses.allowsNormalItems)}
                onChange={() => requestItemClassToggle('allowsNormalItems')}
              />
            </div>
            <div className="flex items-center justify-between gap-3 rounded-[12px] bg-[#f3f5f3] px-4 py-3">
              <span className="text-[13px] font-medium text-[#17231c]">Special items</span>
              <Toggle
                checked={Boolean(itemClasses.allowsSpecialItems)}
                onChange={() => requestItemClassToggle('allowsSpecialItems')}
              />
            </div>
          </div>
          <div className="mt-3 rounded-[8px] border border-[#b9cfe9] bg-[#eaf2fc] px-3.5 py-2.5 text-[12px] leading-[1.5] text-[#2b66a5]">
            Both on ⇒ the class can be chosen per vendor, per category and per item. Only one on ⇒
            that class is forced everywhere and cannot be changed at any level.
          </div>
        </Card>

        <Card
          title="Menu categories"
          action={(
            <button
              type="button"
              onClick={startAddRootCategory}
              disabled={nestedBusy || draftingRoot}
              className="inline-flex h-[34px] items-center gap-1.5 rounded-full bg-[#2E9E4D] px-4 text-[12.5px] font-bold text-white shadow-[0_1px_2px_rgba(20,40,28,.12)] hover:bg-[#158a47] disabled:opacity-60"
            >
              <Plus size={14} strokeWidth={2.4} />
              Add category
            </button>
          )}
        >
          <div className="space-y-3">
            {categories.map((cat) => (
              <CategoryNode
                key={cat.id}
                node={cat}
                onToggleVisible={updateCategoryVisible}
                onAddChild={startAddChildCategory}
                onRemove={removeCategory}
                onEdit={startEditCategory}
                editingId={editingCategoryId}
                editValue={editingCategoryName}
                onEditChange={setEditingCategoryName}
                onEditSave={saveEditCategory}
                onEditCancel={cancelEditCategory}
                draftingParentId={draftingChild?.parentId || null}
                draftValue={childDraftName}
                onDraftChange={setChildDraftName}
                onDraftSave={saveChildCategory}
                onDraftCancel={cancelAddChildCategory}
                busy={nestedBusy}
              />
            ))}
            {draftingRoot ? (
              <div className="rounded-[14px] border border-[#e8ebe9] bg-white px-4 py-3.5">
                <InlineNameRow
                  value={rootDraftName}
                  onChange={setRootDraftName}
                  onSubmit={saveRootCategory}
                  onCancel={cancelAddRootCategory}
                  placeholder="Category name"
                  disabled={nestedBusy}
                />
              </div>
            ) : null}
          </div>
        </Card>

        <Card
          title="Item badges"
          subtitle="Vendors tag menu items with these. Customers see them on item cards."
          action={(
            <button
              type="button"
              onClick={startAddBadge}
              disabled={nestedBusy || draftingBadge}
              className="inline-flex h-[34px] items-center gap-1.5 rounded-full bg-[#2E9E4D] px-4 text-[12.5px] font-bold text-white hover:bg-[#158a47] disabled:opacity-60"
            >
              <Plus size={14} strokeWidth={2.4} />
              Add badge
            </button>
          )}
        >
          <div className="flex flex-wrap gap-2">
            {badges.map((badge) => {
              const { id, label, Icon, iconSrc, icon, bg, text } = badge
              if (editingBadgeId === id) {
                return (
                  <div key={id} className="w-full max-w-[360px]">
                    <InlineNameRow
                      value={editingBadgeLabel}
                      onChange={setEditingBadgeLabel}
                      onSubmit={saveEditBadge}
                      onCancel={cancelEditBadge}
                      placeholder="Badge label"
                      disabled={nestedBusy}
                    />
                  </div>
                )
              }
              return (
                <span
                  key={id}
                  className="inline-flex h-[34px] items-center gap-1.5 rounded-full px-3 text-[12.5px] font-medium"
                  style={{ background: bg, color: text }}
                >
                  {iconSrc ? (
                    <img src={iconSrc} alt="" className="h-3.5 w-3.5 object-contain" />
                  ) : icon ? (
                    <span className="text-[13px] leading-none" aria-hidden>{icon}</span>
                  ) : Icon ? (
                    <Icon size={13} strokeWidth={2.2} />
                  ) : null}
                  {label}
                  <button
                    type="button"
                    className="ml-0.5 grid h-4 w-4 place-items-center opacity-55 hover:opacity-100 disabled:opacity-40"
                    aria-label={`Edit ${label}`}
                    disabled={nestedBusy}
                    onClick={() => startEditBadge(badge)}
                  >
                    ✎
                  </button>
                  <button
                    type="button"
                    onClick={() => removeBadge(id)}
                    disabled={nestedBusy}
                    className="grid h-4 w-4 place-items-center opacity-55 hover:opacity-100 disabled:opacity-40"
                    aria-label={`Remove ${label}`}
                  >
                    <X size={11} strokeWidth={2.4} />
                  </button>
                </span>
              )
            })}
            {draftingBadge ? (
              <div className="w-full max-w-[360px]">
                <InlineNameRow
                  value={badgeDraftLabel}
                  onChange={setBadgeDraftLabel}
                  onSubmit={saveAddBadge}
                  onCancel={cancelAddBadge}
                  placeholder="Badge label"
                  disabled={nestedBusy}
                />
              </div>
            ) : (
              <button
                type="button"
                onClick={startAddBadge}
                disabled={nestedBusy}
                className="inline-flex h-[34px] items-center gap-1 rounded-full border border-[#cfe8d8] bg-white px-3 text-[12.5px] font-medium text-[#1aa054] hover:bg-[#f3faf5] disabled:opacity-60"
              >
                <Plus size={13} strokeWidth={2.2} />
                Add badge
              </button>
            )}
          </div>
        </Card>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={handleBack}
          disabled={saving}
          className="text-[13px] font-medium text-[#7c8780] hover:text-[#455249] disabled:opacity-60"
        >
          Cancel
        </button>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => handleSave('DRAFT')}
            disabled={saving}
            className="inline-flex h-[36px] items-center rounded-full border border-[#d7e8dc] bg-white px-4 text-[13px] font-medium text-[#1aa054] hover:bg-[#f3faf5] disabled:opacity-60"
          >
            {saving
              ? 'Saving…'
              : visibleInApp
                ? 'Save & make visible'
                : 'Save draft'}
          </button>
          <button
            type="button"
            onClick={() => handleSave('PUBLISHED')}
            disabled={saving}
            className="inline-flex h-[36px] items-center rounded-full bg-[#2E9E4D] px-4 text-[13px] font-bold text-white hover:bg-[#158a47] disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Publish store type'}
          </button>
        </div>
      </div>

      <AdminItemClassConvertModal
        open={convertModal.open}
        storeTypeName={displayName.trim() || 'this store type'}
        disable={convertModal.disable}
        preview={convertModal.preview}
        previewLoading={convertModal.previewLoading}
        previewError={convertModal.previewError}
        choice={convertModal.choice}
        confirming={saving}
        onChoiceChange={(next) => setConvertModal((prev) => ({ ...prev, choice: next }))}
        onCancel={closeConvertModal}
        onConfirm={handleConvertModalConfirm}
      />

      <AdminLeaveFormModal
        open={leaveModalOpen}
        busy={saving}
        title={isEditMode ? 'Leave store type setup?' : 'Leave add store type?'}
        message={
          isEditMode
            ? 'You have unsaved changes on this store type. Keep editing or leave without saving.'
            : 'You have unsaved progress on this store type form. Keep editing or leave without saving.'
        }
        onStay={handleStayEditing}
        onLeave={handleLeaveWithoutSaving}
      />
    </div>
  )
}

export default function AdminCreateStoreTypePage() {
  const navigate = useNavigate()
  const { storeTypeId } = useParams()
  const isEdit = Boolean(storeTypeId) && storeTypeId !== 'new'
  const useReal = useRealStoreTypes()

  const { data: detail, error, isLoading, refetch } = useApiResource(
    () => {
      if (!isEdit || !useReal) {
        return Promise.resolve({ data: null, meta: null })
      }
      return adminService.getAdminStoreType(storeTypeId)
    },
    [storeTypeId, isEdit, useReal],
  )

  const {
    data: deliveryDefaults,
    error: deliveryDefaultsError,
    isLoading: deliveryDefaultsLoading,
    refetch: refetchDeliveryDefaults,
  } = useApiResource(
    () => {
      if (!isEdit || !useReal) {
        return Promise.resolve({ data: null, meta: null })
      }
      return adminService.getAdminStoreTypeDeliveryDefaults(storeTypeId)
    },
    [storeTypeId, isEdit, useReal],
  )

  const {
    data: commissionDefaults,
    error: commissionDefaultsError,
    isLoading: commissionDefaultsLoading,
    refetch: refetchCommissionDefaults,
  } = useApiResource(
    () => {
      if (!isEdit || !useReal) {
        return Promise.resolve({ data: null, meta: null })
      }
      return adminService.getAdminStoreTypeCommissionDefaults(storeTypeId)
    },
    [storeTypeId, isEdit, useReal],
  )

  const commissionMapped = useMemo(() => {
    if (!commissionDefaults) return { commission: null, sectionInheritance: 'empty' }
    return mapStoreTypeCommissionDefaultsResponse(commissionDefaults)
  }, [commissionDefaults])

  const { data: platformCommercial, isLoading: platformCommercialLoading } = useApiResource(
    () => {
      if (isEdit || !useReal) {
        return Promise.resolve({ data: null, meta: null })
      }
      return adminSlaModelsService.getCommercialDefaults()
    },
    [isEdit, useReal],
  )

  const createInitial = useMemo(() => {
    const base = mockInitialValues(storeTypeId, false)
    if (!platformCommercial) return base
    const mapped = mapPlatformCommercialDefaultsToForm(platformCommercial)
    return {
      ...base,
      allowedVehicles: mapped.allowedVehicles,
      hotFood: mapped.hotFood,
      scheduledFees: mapped.scheduledFees,
    }
  }, [platformCommercial, storeTypeId])

  const newOrMockInitial = useMemo(() => {
    if (isEdit) return mockInitialValues(storeTypeId, true)
    if (useReal) return createInitial
    return mockInitialValues(storeTypeId, false)
  }, [isEdit, useReal, storeTypeId, createInitial])

  const goBack = () => navigate('/admin/stores')

  const defaultsLoadError = deliveryDefaultsError || commissionDefaultsError

  if (isEdit && useReal) {
    const defaultsStillLoading =
      (deliveryDefaultsLoading && !deliveryDefaults && !deliveryDefaultsError) ||
      (commissionDefaultsLoading && !commissionDefaults && !commissionDefaultsError)

    if (!detail || isLoading || defaultsStillLoading) {
      return (
        <ApiState
          isLoading={isLoading || deliveryDefaultsLoading || commissionDefaultsLoading}
          error={error || defaultsLoadError}
          onRetry={() => {
            refetch()
            refetchDeliveryDefaults()
            refetchCommissionDefaults()
          }}
        />
      )
    }

    if (defaultsLoadError) {
      return (
        <ApiState
          isLoading={false}
          error={defaultsLoadError}
          onRetry={() => {
            refetchDeliveryDefaults()
            refetchCommissionDefaults()
          }}
        />
      )
    }

    return (
      <StoreTypeForm
        key={detail.id}
        initial={initialFromDetail(detail, deliveryDefaults, commissionMapped)}
        liveCommercialInheritance={deliveryDefaults?.inheritance ?? null}
        liveHotFoodOnDemand={deliveryDefaults?.hotFoodOnDemand ?? null}
        liveScheduledFees={deliveryDefaults?.scheduled ?? null}
        liveCommission={commissionMapped.commission}
        liveCommissionSectionInheritance={commissionMapped.sectionInheritance}
        onDeliveryDefaultsRefetch={refetchDeliveryDefaults}
        onCommissionDefaultsRefetch={refetchCommissionDefaults}
        onBack={goBack}
        storeTypeId={detail.id}
        mode="edit"
        canSaveRemote
      />
    )
  }

  if (!isEdit && useReal && platformCommercialLoading && !platformCommercial) {
    return <ApiState isLoading={true} error={null} onRetry={() => undefined} />
  }

  return (
    <StoreTypeForm
      key={isEdit ? `mock-${storeTypeId}` : 'new'}
      initial={newOrMockInitial}
      onBack={goBack}
      storeTypeId={isEdit ? storeTypeId : null}
      mode={isEdit ? 'edit' : 'create'}
      canSaveRemote={useReal && !isEdit}
    />
  )
}
