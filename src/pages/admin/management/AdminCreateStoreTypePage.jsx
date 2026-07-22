import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Check,
  ChefHat,
  ChevronLeft,
  ChevronRight,
  Flame,
  Leaf,
  Pencil,
  Plus,
  Snowflake,
  Sparkles,
  Star,
  Trash2,
  Wheat,
  X,
} from 'lucide-react'
// import editIcon from '../../../assets/icon-edit.png'
import vegetarianBadgeIcon from '../../../assets/🥗.png'
import { CatalogStoreIcon, catalogStoreIconSrc } from '../../../components/CatalogStoreIcons'
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

function CategoryNode({ node, depth = 0, onToggleVisible, onAddChild, onRemove }) {
  const subCount = node.subCategoryCount ?? node.children?.length ?? 0
  const itemCount = node.itemCount
    ?? node.children?.reduce((sum, child) => sum + (child.children?.length || 0), 0)
    ?? 0

  if (depth === 0) {
    return (
      <div className="rounded-[14px] border border-[#e8ebe9] bg-white">
        <div className="flex flex-wrap items-center  gap-3 px-4 py-3.5">
          <div className="min-w-0">
            <p className="text-[14px] font-bold leading-tight text-[#17231c]">{node.name}</p>
            <p className="mt-1 text-[12px] leading-tight text-[#8a948e]">
              Category · {itemCount} items · {subCount} sub-categories
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Toggle
              checked={Boolean(node.visible)}
              onChange={(next) => onToggleVisible(node.id, next)}
              label="Visible"
            />
            <ActionIconButton label={`Edit ${node.name}`}>
            <EditIcon />
            </ActionIconButton>
            <ActionIconButton label={`Delete ${node.name}`} danger onClick={() => onRemove(node.id)}>
              <Trash2 size={14} strokeWidth={1.8} />
            </ActionIconButton>
          </div>
        </div>

        <div className="px-4 pb-4">
          <button
            type="button"
            onClick={() => onAddChild(node.id, 1)}
            className="flex h-[38px] w-full items-center justify-center gap-1.5 rounded-[10px] border border-[#2E9E4D] bg-[#eaf7ef] text-[13px] font-medium text-[#1aa054] hover:bg-[#e0f3e7]"
          >
            <Plus size={15} strokeWidth={2.2} />
            Add sub-category
          </button>

          {(node.children?.length || 0) > 0 ? (
            <div className="relative mt-3 ml-1 space-y-4 border-l-2 border-[#cfe8d8] pl-4">
              {node.children.map((child) => (
                <CategoryNode
                  key={child.id}
                  node={child}
                  depth={1}
                  onToggleVisible={onToggleVisible}
                  onAddChild={onAddChild}
                  onRemove={onRemove}
                />
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
          <span className="text-[13px] font-bold text-[#17231c]">{node.name}</span>
          <span className="text-[12px] text-[#8a948e]">Sub-category</span>
          <div className="ml-auto flex items-center gap-0.5">
            <ActionIconButton label={`Edit ${node.name}`}>
              <EditIcon />
            </ActionIconButton>
            <ActionIconButton label={`Delete ${node.name}`} danger onClick={() => onRemove(node.id)}>
              <Trash2 size={14} strokeWidth={1.8} />
            </ActionIconButton>
          </div>
        </div>

        <div className="mt-2 space-y-2">
          <button
            type="button"
            onClick={() => onAddChild(node.id, 2)}
            className="flex h-[34px] w-full items-center justify-center gap-1.5 rounded-[8px] border border-[#2E9E4D] bg-[#eaf7ef] text-[12.5px] font-medium text-[#1aa054] hover:bg-[#e0f3e7]"
          >
            <Plus size={14} strokeWidth={2.2} />
            Add sub-sub category
          </button>

          {(node.children?.length || 0) > 0 ? (
            <div className="space-y-1.5">
              {node.children.map((child) => (
                <CategoryNode
                  key={child.id}
                  node={child}
                  depth={2}
                  onToggleVisible={onToggleVisible}
                  onAddChild={onAddChild}
                  onRemove={onRemove}
                />
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
      <span className="min-w-0 flex-1 text-[13px] font-medium text-[#17231c]">{node.name}</span>
      <ActionIconButton label={`Edit ${node.name}`}>
        <EditIcon />
      </ActionIconButton>
      <ActionIconButton label={`Delete ${node.name}`} danger onClick={() => onRemove(node.id)}>
        <Trash2 size={14} strokeWidth={1.8} />
      </ActionIconButton>
    </div>
  )
}

export default function AdminCreateStoreTypePage() {
  const navigate = useNavigate()
  const { storeTypeId } = useParams()
  const isEdit = Boolean(storeTypeId) && storeTypeId !== 'new'

  const initialIconId = isEdit && catalogStoreIconSrc[storeTypeId] ? storeTypeId : 'food'

  const [displayName, setDisplayName] = useState(isEdit ? (storeTypeId === 'dine-in' ? 'Dine In' : storeTypeId.charAt(0).toUpperCase() + storeTypeId.slice(1)) : 'Food')
  const [internalKey, setInternalKey] = useState(isEdit ? storeTypeId.replace(/-/g, '_') : 'food')
  const [homeOrder, setHomeOrder] = useState('5')
  const [visibleInApp, setVisibleInApp] = useState(true)
  const [iconId, setIconId] = useState(initialIconId)
  const [modes, setModes] = useState({
    'On-Demand Delivery': true,
    Pickup: true,
    'Dine-in': true,
    Scheduled: false,
    Services: false,
  })
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES)
  const [badges, setBadges] = useState(DEFAULT_BADGES)

  const titleName = displayName.trim() || 'New'

  const iconOptions = useMemo(() => Object.keys(catalogStoreIconSrc), [])

  const goBack = () => navigate('/admin/stores')

  const toggleMode = (mode) => {
    setModes((prev) => ({ ...prev, [mode]: !prev[mode] }))
  }

  const updateCategoryVisible = (id, visible) => {
    setCategories((prev) => prev.map((cat) => (cat.id === id ? { ...cat, visible } : cat)))
  }

  const addRootCategory = () => {
    const id = `c${Date.now()}`
    setCategories((prev) => [
      ...prev,
      { id, name: `Category ${prev.length + 1}`, visible: true, children: [] },
    ])
  }

  const addChildCategory = (parentId, depth) => {
    const label = depth === 1 ? 'Sub-category' : 'Sub-sub category'
    const walk = (nodes) => nodes.map((node) => {
      if (node.id === parentId) {
        const children = node.children || []
        return {
          ...node,
          children: [
            ...children,
            { id: `${parentId}-${children.length + 1}-${Date.now()}`, name: `${label} ${children.length + 1}`, children: [] },
          ],
        }
      }
      if (node.children?.length) return { ...node, children: walk(node.children) }
      return node
    })
    setCategories((prev) => walk(prev))
  }

  const removeCategory = (id) => {
    const walk = (nodes) => nodes
      .filter((node) => node.id !== id)
      .map((node) => ({
        ...node,
        children: node.children ? walk(node.children) : [],
      }))
    setCategories((prev) => walk(prev))
  }

  const removeBadge = (id) => {
    setBadges((prev) => prev.filter((badge) => badge.id !== id))
  }

  const addBadge = () => {
    const id = `badge-${Date.now()}`
    setBadges((prev) => [
      ...prev,
      { id, label: 'New badge', Icon: Check, bg: '#e8f7ed', text: '#147940' },
    ])
  }

  const cycleIcon = () => {
    const idx = iconOptions.indexOf(iconId)
    const next = iconOptions[(idx + 1) % iconOptions.length]
    setIconId(next)
  }

  return (
    <div className="px-5 pb-10 pt-4 max-[700px]:px-3">
      <div className="mb-5 flex  items-center justify-between gap-3">
        <div className=" flex items-center  gap-4">
          <button
            type="button"
            onClick={goBack}
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
          onClick={goBack}
          className="inline-flex h-[34px] shrink-0 items-center rounded-full bg-[#2E9E4D] px-4 text-[12px] font-bold text-white hover:bg-[#158a47]"
        >
          Publish
        </button>
      </div>

      <div className="space-y-4">
        <Card title="Identity">
          <div className="grid grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)] items-end gap-3 max-[800px]:grid-cols-1">
            <div>
              <span className={labelClass}>Icon</span>
              <div className="flex items-center gap-2.5">
                <span className="grid h-[48px] w-[48px] place-items-center overflow-hidden rounded-[12px] bg-[#f3f5f3]">
                  <CatalogStoreIcon id={iconId} className="size-8" />
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
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </label>

            <label className="block min-w-0">
              <span className={labelClass}>Internal key</span>
              <input
                className={inputClass}
                value={internalKey}
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
              onClick={addRootCategory}
              className="inline-flex h-[34px] items-center gap-1.5 rounded-full bg-[#2E9E4D] px-4 text-[12.5px] font-bold text-white shadow-[0_1px_2px_rgba(20,40,28,.12)] hover:bg-[#158a47]"
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
                onAddChild={addChildCategory}
                onRemove={removeCategory}
              />
            ))}
          </div>
        </Card>

        <Card
          title="Item badges"
          subtitle="Vendors tag menu items with these. Customers see them on item cards."
          action={(
            <button
              type="button"
              onClick={addBadge}
              className="inline-flex h-[34px] items-center gap-1.5 rounded-full bg-[#2E9E4D] px-4 text-[12.5px] font-bold text-white hover:bg-[#158a47]"
            >
              <Plus size={14} strokeWidth={2.4} />
              Add badge
            </button>
          )}
        >
          <div className="flex flex-wrap gap-2">
            {badges.map(({ id, label, Icon, iconSrc, bg, text }) => (
              <span
                key={id}
                className="inline-flex h-[34px] items-center gap-1.5 rounded-full px-3 text-[12.5px] font-medium"
                style={{ background: bg, color: text }}
              >
                {iconSrc ? (
                  <img src={iconSrc} alt="" className="h-3.5 w-3.5 object-contain" />
                ) : (
                  <Icon size={13} strokeWidth={2.2} />
                )}
                {label}
                <button
                  type="button"
                  className="ml-0.5 grid h-4 w-4 place-items-center opacity-55 hover:opacity-100"
                  aria-label={`Edit ${label}`}
                >
                  ✎
                </button>
                <button
                  type="button"
                  onClick={() => removeBadge(id)}
                  className="grid h-4 w-4 place-items-center opacity-55 hover:opacity-100"
                  aria-label={`Remove ${label}`}
                >
                  <X size={11} strokeWidth={2.4} />
                </button>
              </span>
            ))}
            <button
              type="button"
              onClick={addBadge}
              className="inline-flex h-[34px] items-center gap-1 rounded-full border border-[#cfe8d8] bg-white px-3 text-[12.5px] font-medium text-[#1aa054] hover:bg-[#f3faf5]"
            >
              <Plus size={13} strokeWidth={2.2} />
              Add badge
            </button>
          </div>
        </Card>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={goBack}
          className="text-[13px] font-medium text-[#7c8780] hover:text-[#455249]"
        >
          Cancel
        </button>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={goBack}
            className="inline-flex h-[36px] items-center rounded-full border border-[#d7e8dc] bg-white px-4 text-[13px] font-medium text-[#1aa054] hover:bg-[#f3faf5]"
          >
            Save draft
          </button>
          <button
            type="button"
            onClick={goBack}
            className="inline-flex h-[36px] items-center rounded-full bg-[#2E9E4D] px-4 text-[13px] font-bold text-white hover:bg-[#158a47]"
          >
            Publish store type
          </button>
        </div>
      </div>
    </div>
  )
}
