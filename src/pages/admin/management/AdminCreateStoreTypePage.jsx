import { useMemo, useState } from 'react'
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
import { CatalogStoreIcon, catalogStoreIconSrc } from '../../../components/CatalogStoreIcons'
import { useApiResource } from '../../../hooks/useApiResource'
import { apiConfig, isAdminRealApiFeature } from '../../../api/config'
import { formatApiErrorMessage } from '../../../api/errors'
import { adminService } from '../../../services/adminService'
import { ApiState } from '../../../components/admin/ApiState'
import { cn } from '../../../components/admin/cn'

const labelClass = 'mb-1.5 block text-[12px] font-medium text-[#7c8780]'
const inputClass =
  'box-border h-[40px] w-full rounded-[8px] border border-[rgba(0,0,0,0.1)] bg-white px-3 text-[13px] text-[#17231c] outline-none transition placeholder:text-[#9aa49d] focus:border-[#1aa054]'

const ORDER_MODES = [
  'On-Demand Delivery',
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
  'On-Demand Delivery': false,
  Pickup: false,
  'Dine-in': false,
  Scheduled: false,
  Services: false,
}

const ICON_EMOJI_BY_KEY = {
  all: '🛒',
  food: '🍔',
  food_drink: '🍔',
  'food-drink': '🍔',
  groceries: '🛒',
  grocery: '🛒',
  pharmacy: '💊',
  cosmetics: '💄',
  vape: '💨',
  'dine-in': '🍽️',
  dine_in: '🍽️',
  pickup: '🥡',
  gifts: '🎁',
  fashion: '👗',
  electronics: '📱',
  jewelry: '💍',
}

function useRealStoreTypes() {
  return isAdminRealApiFeature('store-types') || !apiConfig.adminUseMockApi
}

function mockInitialValues(storeTypeId, isEdit) {
  if (!isEdit) {
    return {
      displayName: '',
      internalKey: '',
      homeOrder: '',
      visibleInApp: true,
      iconId: 'food',
      iconEmoji: '🍔',
      iconUrl: null,
      modes: { ...EMPTY_MODES },
      categories: [],
      badges: [],
    }
  }

  const iconId = catalogStoreIconSrc[storeTypeId] ? storeTypeId : 'food'
  const displayName =
    storeTypeId === 'dine-in'
      ? 'Dine In'
      : `${String(storeTypeId || '').charAt(0).toUpperCase()}${String(storeTypeId || '').slice(1)}`

  return {
    displayName,
    internalKey: String(storeTypeId || '').replace(/-/g, '_'),
    homeOrder: '5',
    visibleInApp: true,
    iconId,
    iconEmoji: null,
    iconUrl: null,
    modes: {
      'On-Demand Delivery': true,
      Pickup: true,
      'Dine-in': true,
      Scheduled: false,
      Services: false,
    },
    categories: DEFAULT_CATEGORIES,
    badges: DEFAULT_BADGES,
  }
}

function initialFromDetail(detail) {
  return {
    displayName: detail.displayName || '',
    internalKey: detail.internalKey || detail.slug || '',
    homeOrder: detail.homeOrder || '',
    visibleInApp: Boolean(detail.visibleInApp),
    iconId: detail.iconId || detail.slug || 'food',
    iconEmoji: detail.iconEmoji || null,
    iconUrl: detail.iconUrl || null,
    modes: detail.modes || { ...EMPTY_MODES },
    categories: Array.isArray(detail.categories) ? detail.categories : [],
    badges: (Array.isArray(detail.badges) ? detail.badges : []).map((badge) => ({
      ...badge,
      Icon: badge.Icon || Check,
    })),
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
}) {
  const [displayName, setDisplayName] = useState(initial.displayName)
  const [internalKey, setInternalKey] = useState(initial.internalKey)
  const [homeOrder, setHomeOrder] = useState(initial.homeOrder)
  const [visibleInApp, setVisibleInApp] = useState(initial.visibleInApp)
  const [iconId, setIconId] = useState(initial.iconId)
  const [iconEmoji, setIconEmoji] = useState(initial.iconEmoji)
  const [iconUrl, setIconUrl] = useState(initial.iconUrl)
  const [modes, setModes] = useState(initial.modes)
  const [categories, setCategories] = useState(initial.categories)
  const [badges, setBadges] = useState(initial.badges)
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

  const titleName = displayName.trim() || 'New'
  const iconOptions = useMemo(() => Object.keys(catalogStoreIconSrc), [])
  const isEditMode = mode === 'edit'
  const canManageNested = Boolean(storeTypeId && isEditMode && canSaveRemote)

  const buildFormPayload = (publishStatus = 'DRAFT') => ({
    displayName,
    internalKey,
    homeOrder,
    visibleInApp,
    iconId,
    iconEmoji,
    iconUrl,
    modes,
    publishStatus,
  })

  const handleSave = async (publishStatus = 'DRAFT') => {
    if (!canSaveRemote) {
      onBack()
      return
    }

    if (isEditMode && !storeTypeId) {
      setSaveError('Missing store type id.')
      return
    }

    setSaving(true)
    setSaveError('')
    try {
      if (isEditMode) {
        // Confirmed: PATCH /admin/store-types/:storeTypeId
        await adminService.updateAdminStoreType(storeTypeId, buildFormPayload(publishStatus))
      } else {
        await adminService.createAdminStoreType(buildFormPayload(publishStatus))
      }
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

  const toggleMode = (modeKey) => {
    setModes((prev) => ({ ...prev, [modeKey]: !prev[modeKey] }))
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

  const cycleIcon = () => {
    const idx = iconOptions.indexOf(iconId)
    const next = iconOptions[(idx + 1) % iconOptions.length]
    setIconId(next)
    setIconEmoji(ICON_EMOJI_BY_KEY[next] || null)
    setIconUrl(null)
  }

  return (
    <div className="px-5 pb-10 pt-4 max-[700px]:px-3">
      <div className="mb-5 flex  items-center justify-between gap-3">
        <div className=" flex items-center  gap-4">
          <button
            type="button"
            onClick={onBack}
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
          <div className="grid grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)] items-end gap-3 max-[800px]:grid-cols-1">
            <div>
              <span className={labelClass}>Icon</span>
              <div className="flex items-center gap-2.5">
                <span className="grid h-[48px] w-[48px] place-items-center overflow-hidden rounded-[12px] bg-[#f3f5f3]">
                  <CatalogStoreIcon
                    id={iconId}
                    emoji={iconEmoji}
                    iconUrl={iconUrl}
                    className="size-8"
                  />
                </span>
                <button
                  type="button"
                  onClick={cycleIcon}
                  className="inline-flex h-[34px] items-center rounded-full border border-[#1aa054] bg-white px-3.5 text-[12.5px] font-medium text-[#1aa054] hover:bg-[#f3faf5]"
                >
                  Change icon
                </button>
              </div>
            </div>

            <label className="block min-w-0">
              <span className={labelClass}>Display name</span>
              <input
                className={inputClass}
                value={displayName}
                placeholder={isEditMode ? undefined : 'e.g. Food'}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </label>

            <label className="block min-w-0">
              <span className={labelClass}>Internal key</span>
              <input
                className={inputClass}
                value={internalKey}
                placeholder={isEditMode ? undefined : 'e.g. food'}
                onChange={(e) => setInternalKey(e.target.value)}
              />
            </label>
          </div>

          <div className="mt-4 grid grid-cols-2 items-end gap-3 max-[700px]:grid-cols-1">
            <label className="block w-full ">
              <span className={labelClass}>Home order position</span>
              <input
                className={inputClass}
                value={homeOrder}
                placeholder={isEditMode ? undefined : 'e.g. 5'}
                onChange={(e) => setHomeOrder(e.target.value)}
              />
            </label>

            <div className="flex h-[48px] items-center justify-between gap-3 rounded-[12px] bg-[#f3f5f3] px-4">
              <span className="text-[13px] font-medium text-[#17231c]">Visible in customer app</span>
              <Toggle checked={visibleInApp} onChange={setVisibleInApp} />
            </div>
          </div>
        </Card>

        <Card
          title="Order modes"
          subtitle="Which order types customers can use for stores of this type."
        >
          <div className="flex w-fit flex-col gap-2.5">
            {ORDER_MODES.map((mode) => (
              <div
                key={mode}
                className="flex items-center justify-between gap-3 rounded-[12px] bg-[#f3f5f3] px-4 py-3"
              >
                <span className="text-[13px] font-medium text-[#17231c]">{mode}</span>
                <Toggle checked={Boolean(modes[mode])} onChange={() => toggleMode(mode)} />
              </div>
            ))}
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
          onClick={onBack}
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
            {saving ? 'Saving…' : 'Save draft'}
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

  const goBack = () => navigate('/admin/stores')

  if (isEdit && useReal) {
    if (!detail) {
      return <ApiState isLoading={isLoading} error={error} onRetry={refetch} />
    }

    return (
      <StoreTypeForm
        key={detail.id}
        initial={initialFromDetail(detail)}
        onBack={goBack}
        storeTypeId={detail.id}
        mode="edit"
        canSaveRemote
      />
    )
  }

  return (
    <StoreTypeForm
      key={isEdit ? `mock-${storeTypeId}` : 'new'}
      initial={mockInitialValues(storeTypeId, isEdit)}
      onBack={goBack}
      storeTypeId={isEdit ? storeTypeId : null}
      mode={isEdit ? 'edit' : 'create'}
      canSaveRemote={useReal && !isEdit}
    />
  )
}
