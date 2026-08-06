import { useEffect, useMemo, useRef, useState } from 'react'
import { GripVertical } from 'lucide-react'
import { resolveAdminMediaUrl } from '../mappers/admin/mapAdminUpload'
import { formatApiErrorMessage } from '../api/errors'
import {
  validateVendorImageFile,
  VENDOR_IMAGE_UPLOAD_ACCEPT,
} from '../services/vendor/uploadService'
import OptionGroupModal from './OptionGroupModal'

const BADGE_OPTIONS = [
  'New',
  'Bestseller',
  'Halal',
  'Spicy',
  'Vegan',
  'Vegetarian',
  'Gluten-free',
  'Healthy',
]
const TIME_SLOTS = ['All day', 'Breakfast', 'Lunch', 'Dinner', 'Late night']

const DEFAULT_OPTION_GROUPS = [
  {
    title: 'Choose a drink',
    detail: 'Pepsi · 7Up · Mirinda · Water · Orange juice',
    tag: 'Required · pick 1',
    tagTone: 'required',
  },
  {
    title: 'Choose a sauce',
    detail: 'Garlic · Ranch · BBQ · Sweet chili',
    tag: 'Optional · multi',
    tagTone: 'optional',
  },
]

/** Prefill matching Figma sample (demos / mocks only) */
export const SAMPLE_PRODUCT = {
  id: null,
  name: 'Classic Burger',
  nameAr: 'برجر كلاسيك',
  category: 'Food · Mains',
  categoryValue: 'Main course',
  subcategory: 'None',
  subSubcategory: 'None',
  icon: '🍔',
  price: '2.500 BHD +',
  priceValue: '2.500',
  stock: 'Made to order',
  status: 'Active',
  prepTime: '20',
  descriptionEn: 'Juicy beef patty, lettuce, tomato & house sauce.',
  descriptionAr: 'برجر لحم مع خس وطماطم وصوص.',
  badges: ['New', 'Bestseller', 'Halal'],
  timeSlot: 'All day',
  availableFrom: '11:00',
  availableTo: '23:00',
  optionGroups: DEFAULT_OPTION_GROUPS,
  addOns: [
    { name: 'Extra cheese', price: '+0.500' },
    { name: 'Make it a meal (fries + drink)', price: '+1.200' },
    { name: '', price: '+0.000' },
  ],
  active: true,
  cardTone: '#FFF4D6',
  badge: 'Options',
  badgeTone: 'options',
  imageUrl: null,
  imageUrls: [],
  imageFiles: [null, null, null, null],
  imagePreviews: [null, null, null, null],
}

/** Blank form for “Add product” — inputs show placeholders only */
export const EMPTY_PRODUCT = {
  id: null,
  name: '',
  nameAr: '',
  category: '',
  categoryValue: '',
  subcategory: 'None',
  subSubcategory: 'None',
  icon: '🍔',
  price: '',
  priceValue: '',
  stock: 'Made to order',
  status: 'Active',
  prepTime: '',
  descriptionEn: '',
  descriptionAr: '',
  badges: [],
  timeSlot: 'All day',
  availableFrom: '',
  availableTo: '',
  optionGroups: [],
  addOns: [{ name: '', price: '+0.000' }],
  active: true,
  cardTone: '#FFF4D6',
  badge: null,
  badgeTone: null,
  imageUrl: null,
  imageUrls: [],
  imageFiles: [null, null, null, null],
  imagePreviews: [null, null, null, null],
  categoryRootId: '',
  subcategoryId: '',
  subSubcategoryId: '',
  catalogCategoryId: '',
  platformCategoryId: null,
}

/** Dedupe imageUrl + imageUrls into main + extras (extras-only list). */
function normalizeRemoteImages(product = {}) {
  const seen = new Set()
  const urls = []
  const push = (value) => {
    const url = String(value || '').trim()
    if (!url || url.startsWith('blob:') || url.startsWith('data:')) return
    if (seen.has(url)) return
    seen.add(url)
    urls.push(url)
  }
  push(product.imageUrl)
  if (Array.isArray(product.imageUrls)) {
    product.imageUrls.forEach(push)
  }
  return {
    imageUrl: urls[0] || null,
    imageUrls: urls.slice(1),
  }
}

function buildForm(product) {
  const addOns = product.addOns?.length ? product.addOns.map((item) => ({ ...item })) : []
  while (addOns.length < 1) addOns.push({ name: '', price: '+0.000' })

  const remotes = normalizeRemoteImages(product)

  return {
    name: product.name ?? '',
    nameAr: product.nameAr ?? '',
    priceValue: product.priceValue ?? String(product.price || '').replace(/[^\d.]/g, ''),
    categoryValue: product.categoryValue ?? '',
    categoryRootId: product.categoryRootId ?? '',
    subcategoryId: product.subcategoryId ?? '',
    subSubcategoryId: product.subSubcategoryId ?? '',
    subcategory: product.subcategory ?? 'None',
    subSubcategory: product.subSubcategory ?? 'None',
    catalogCategoryId: product.catalogCategoryId ?? '',
    platformCategoryId: product.platformCategoryId ?? null,
    prepTime: product.prepTime ?? '',
    descriptionEn: product.descriptionEn ?? '',
    descriptionAr: product.descriptionAr ?? '',
    badges: [...(product.badges ?? [])],
    timeSlot: product.timeSlot ?? 'All day',
    availableFrom: product.availableFrom ?? '',
    availableTo: product.availableTo ?? '',
    optionGroups: product.optionGroups?.length ? product.optionGroups : [],
    addOns,
    active: product.active ?? product.status === 'Active',
    icon: product.icon ?? '🍔',
    imageUrl: remotes.imageUrl,
    imageUrls: remotes.imageUrls,
    imageFiles: [null, null, null, null],
    imagePreviews: [null, null, null, null],
  }
}

const labelClass = 'text-[13px] font-medium leading-[13px] text-[#69706E]'
const inputBox =
  'box-border flex h-[42px] w-full items-center rounded-[9px] border border-[#D6DBD6] bg-white px-3 text-[12.5px] font-medium leading-[15px] text-[#1A1A1A] outline-none placeholder:text-[#949C94] focus:border-[#1AA34D]'
const selectBox =
  'box-border flex h-[42px] w-full appearance-none items-center rounded-[9px] border border-[#D6DBD6] bg-white px-3 text-[12.5px] font-medium leading-[15px] text-[#1A1A1A] outline-none focus:border-[#1AA34D]'

function Chip({ selected, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`box-border inline-flex h-[29px] items-center gap-1 rounded-[18px] px-[13px] py-[7px] text-[12px] font-medium leading-[15px] ${
        selected
          ? 'border border-[#1AA34D] bg-[#E3F2EB] text-[#127036]'
          : 'border border-[#D6DBD6] bg-white text-[#1A1A1A]'
      }`}
    >
      {selected ? <span aria-hidden="true">✓</span> : null}
      {children}
    </button>
  )
}

function FieldSelect({ label, value, onChange, options, className = '' }) {
  const normalized = options.map((option) =>
    typeof option === 'string' ? { value: option, label: option } : option,
  )

  return (
    <div className={`flex min-w-0 flex-col items-start gap-1.5 ${className}`}>
      <label className={labelClass}>{label}</label>
      <div className="relative w-full">
        <select className={`${selectBox} pr-8`} value={value} onChange={onChange}>
          {normalized.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[10px] text-[#949C94]">
          ▾
        </span>
      </div>
    </div>
  )
}

/**
 * Add / Edit product modal (Figma 860px)
 * mode: 'add' | 'edit'
 */
export default function EditProductModal({
  open,
  product,
  mode = 'edit',
  onClose,
  onSave,
  categories = [],
  categoryTree = [],
  badgeOptions = [],
  catalogId = null,
  catalogSlug = '',
  isSaving = false,
  isLoadingDetail = false,
  saveError = '',
}) {
  const [form, setForm] = useState(null)
  const [optionModal, setOptionModal] = useState({ open: false, index: null, group: null })
  const [uploadError, setUploadError] = useState('')
  const fileInputRefs = useRef([])
  const isAdd = mode === 'add'
  const source = isAdd ? EMPTY_PRODUCT : product || EMPTY_PRODUCT

  const tree = useMemo(
    () => (Array.isArray(categoryTree) && categoryTree.length ? categoryTree : []),
    [categoryTree],
  )

  const resolvedBadgeOptions = useMemo(() => {
    if (Array.isArray(badgeOptions) && badgeOptions.length > 0) {
      return badgeOptions.map((badge) =>
        typeof badge === 'string'
          ? { label: badge, code: badge.toUpperCase().replace(/\s+/g, '_') }
          : {
              label: badge.label || badge.name || badge.code,
              code: badge.code || String(badge.label || '').toUpperCase().replace(/\s+/g, '_'),
            },
      )
    }
    if (String(catalogSlug).toLowerCase().includes('food')) {
      return BADGE_OPTIONS.map((label) => ({
        label,
        code: label.toUpperCase().replace(/[-\s]+/g, '_'),
      }))
    }
    return BADGE_OPTIONS.map((label) => ({
      label,
      code: label.toUpperCase().replace(/[-\s]+/g, '_'),
    }))
  }, [badgeOptions, catalogSlug])

  const categoryOptions = useMemo(() => {
    if (tree.length > 0) {
      return [
        { value: '', label: 'Select category' },
        ...tree.map((node) => ({ value: node.id, label: node.name })),
      ]
    }
    if (Array.isArray(categories) && categories.length > 0) {
      return [
        { value: '', label: 'Select category' },
        ...categories
          .filter((category) => !category.parentId && (category.depth === 0 || category.depth == null))
          .map((category) => ({
            value: category.id,
            label: category.name,
          })),
      ]
    }
    return [{ value: '', label: 'Select category' }]
  }, [tree, categories])

  const subcategoryNodes = useMemo(() => {
    if (!form?.categoryRootId) return []
    const root = tree.find((node) => node.id === form.categoryRootId)
    return Array.isArray(root?.children) ? root.children : []
  }, [tree, form?.categoryRootId])

  const subcategoryOptions = useMemo(() => {
    if (!subcategoryNodes.length) return [{ value: '', label: 'None' }]
    return [
      { value: '', label: 'None' },
      ...subcategoryNodes.map((node) => ({ value: node.id, label: node.name })),
    ]
  }, [subcategoryNodes])

  const subSubcategoryNodes = useMemo(() => {
    if (!form?.subcategoryId) return []
    const node = subcategoryNodes.find((item) => item.id === form.subcategoryId)
    return Array.isArray(node?.children) ? node.children : []
  }, [subcategoryNodes, form?.subcategoryId])

  const subSubcategoryOptions = useMemo(() => {
    if (!subSubcategoryNodes.length) return [{ value: '', label: 'None' }]
    return [
      { value: '', label: 'None' },
      ...subSubcategoryNodes.map((node) => ({ value: node.id, label: node.name })),
    ]
  }, [subSubcategoryNodes])

  useEffect(() => {
    if (!open) return
    const base = buildForm(isAdd ? EMPTY_PRODUCT : product || EMPTY_PRODUCT)
    const chain = Array.isArray(product?.categoryChain) ? product.categoryChain : []
    let categoryRootId = product?.categoryRootId || ''
    let subcategoryId = product?.subcategoryId || ''
    let subSubcategoryId = product?.subSubcategoryId || ''

    if (chain.length >= 1 && !categoryRootId) categoryRootId = chain[0].id
    if (chain.length === 2 && !subcategoryId) {
      // root + leaf: treat leaf as category (single level under root stored as catalogCategoryId)
      categoryRootId = chain[0].id
    }
    if (chain.length >= 3) {
      categoryRootId = chain[0].id
      subcategoryId = chain[1].id
      subSubcategoryId = chain[2].id
    }

    const leafId =
      subSubcategoryId ||
      subcategoryId ||
      categoryRootId ||
      product?.catalogCategoryId ||
      ''

    setForm((previous) => {
      if (previous?.imagePreviews) {
        previous.imagePreviews.forEach((url) => {
          if (url && String(url).startsWith('blob:')) URL.revokeObjectURL(url)
        })
      }
      return {
        ...base,
        categoryRootId,
        subcategoryId,
        subSubcategoryId,
        catalogCategoryId: leafId,
        categoryValue: product?.catalogCategoryName || base.categoryValue,
        platformCategoryId: catalogId || product?.platformCategoryId || null,
        optionGroups: isAdd ? [] : base.optionGroups,
        addOns: isAdd ? [{ name: '', price: '+0.000' }] : base.addOns,
        badges: isAdd ? [] : base.badges,
      }
    })
    setOptionModal({ open: false, index: null, group: null })
    setUploadError('')
  }, [open, product, mode, isAdd, catalogId])

  useEffect(() => {
    if (!open) return undefined
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    function onKeyDown(e) {
      if (e.key === 'Escape' && !optionModal.open) onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open, onClose, optionModal.open])

  if (!open) return null

  if (isLoadingDetail && !form) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[rgba(0,0,0,0.28)]">
        <div className="rounded-[12px] bg-white px-6 py-4 text-[13px] text-ink-muted shadow-lg">
          Loading product…
        </div>
      </div>
    )
  }

  if (!form) return null

  const remoteSlots = [
    form.imageUrl || null,
    ...(Array.isArray(form.imageUrls) ? form.imageUrls : []),
  ]
  const imageSlots = [0, 1, 2, 3].map((slot) => {
    const preview = form.imagePreviews?.[slot] || null
    if (preview) return preview
    return remoteSlots[slot] || null
  })

  function updateField(field, value) {
    setForm((c) => ({ ...c, [field]: value }))
  }

  function clearImageAtSlot(slotIndex) {
    setForm((current) => {
      const nextFiles = [...(current.imageFiles || [null, null, null, null])]
      const nextPreviews = [...(current.imagePreviews || [null, null, null, null])]
      while (nextFiles.length < 4) nextFiles.push(null)
      while (nextPreviews.length < 4) nextPreviews.push(null)

      if (nextPreviews[slotIndex] && String(nextPreviews[slotIndex]).startsWith('blob:')) {
        URL.revokeObjectURL(nextPreviews[slotIndex])
      }
      nextFiles[slotIndex] = null
      nextPreviews[slotIndex] = null

      const nextRemotes = [
        current.imageUrl || null,
        ...(Array.isArray(current.imageUrls) ? current.imageUrls : []),
      ]
      while (nextRemotes.length < 4) nextRemotes.push(null)
      // Clearing a slot that only had a remote URL
      if (!nextFiles[slotIndex]) nextRemotes[slotIndex] = null
      const cleanedRemotes = nextRemotes.filter(Boolean)

      return {
        ...current,
        imageFiles: nextFiles,
        imagePreviews: nextPreviews,
        imageUrl: cleanedRemotes[0] || null,
        imageUrls: cleanedRemotes.slice(1),
      }
    })
    setUploadError('')
  }

  function openImagePicker(slotIndex) {
    if (isSaving) return
    fileInputRefs.current[slotIndex]?.click()
  }

  function handleImageFileChange(slotIndex, event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    setUploadError('')
    try {
      validateVendorImageFile(file)
    } catch (err) {
      setUploadError(formatApiErrorMessage(err, 'Unable to use this image.'))
      return
    }

    const previewUrl = URL.createObjectURL(file)
    setForm((current) => {
      const nextFiles = [...(current.imageFiles || [null, null, null, null])]
      const nextPreviews = [...(current.imagePreviews || [null, null, null, null])]
      while (nextFiles.length < 4) nextFiles.push(null)
      while (nextPreviews.length < 4) nextPreviews.push(null)

      if (nextPreviews[slotIndex] && String(nextPreviews[slotIndex]).startsWith('blob:')) {
        URL.revokeObjectURL(nextPreviews[slotIndex])
      }
      nextFiles[slotIndex] = file
      nextPreviews[slotIndex] = previewUrl

      return {
        ...current,
        imageFiles: nextFiles,
        imagePreviews: nextPreviews,
      }
    })
  }

  function toggleBadge(badgeLabel) {
    setForm((c) => ({
      ...c,
      badges: c.badges.includes(badgeLabel)
        ? c.badges.filter((b) => b !== badgeLabel)
        : [...c.badges, badgeLabel],
    }))
  }

  function resolveLeafCategoryId(nextForm = form) {
    return (
      nextForm.subSubcategoryId ||
      nextForm.subcategoryId ||
      nextForm.categoryRootId ||
      nextForm.catalogCategoryId ||
      null
    )
  }

  function findCategoryName(id) {
    if (!id) return ''
    const walk = (nodes) => {
      for (const node of nodes || []) {
        if (node.id === id) return node.name
        const nested = walk(node.children)
        if (nested) return nested
      }
      return ''
    }
    return walk(tree) || categories.find((c) => c.id === id)?.name || ''
  }

  function updateAddOn(index, field, value) {
    setForm((c) => ({
      ...c,
      addOns: c.addOns.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    }))
  }

  function removeAddOn(index) {
    setForm((c) => ({ ...c, addOns: c.addOns.filter((_, i) => i !== index) }))
  }

  function addAddOn() {
    setForm((c) => ({ ...c, addOns: [...c.addOns, { name: '', price: '+0.000' }] }))
  }

  function openAddOptionGroup() {
    setOptionModal({ open: true, index: null, group: null })
  }

  function openEditOptionGroup(group, index) {
    setOptionModal({ open: true, index, group })
  }

  function closeOptionModal() {
    setOptionModal({ open: false, index: null, group: null })
  }

  function saveOptionGroup(savedGroup) {
    setForm((c) => {
      const next = [...c.optionGroups]
      if (optionModal.index === null || optionModal.index < 0) {
        next.push(savedGroup)
      } else {
        next[optionModal.index] = savedGroup
      }
      return { ...c, optionGroups: next }
    })
    closeOptionModal()
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (isSaving) return

    const priceValue = form.priceValue.trim() || '0.000'
    const name = form.name.trim() || 'Untitled product'
    const filledAddOns = form.addOns.filter((item) => item.name.trim())
    const hasOptions = Boolean(form.optionGroups?.length || filledAddOns.length)
    const leafCategoryId = resolveLeafCategoryId(form)
    const categoryName = findCategoryName(leafCategoryId) || form.categoryValue || '—'
    const remotes = normalizeRemoteImages(form)
    const imageUrl = remotes.imageUrl
    const imageUrls = remotes.imageUrls
    // Keep slot alignment (including nulls) so uploads merge with remotes correctly.
    const imageFiles = Array.isArray(form.imageFiles)
      ? [...form.imageFiles]
      : [null, null, null, null]
    while (imageFiles.length < 4) imageFiles.push(null)

    try {
      await onSave?.({
        ...EMPTY_PRODUCT,
        ...source,
        id: isAdd ? null : source.id,
        name,
        nameAr: form.nameAr,
        priceValue,
        price: `${priceValue} BHD${hasOptions ? ' +' : ''}`,
        category: categoryName,
        categoryValue: categoryName,
        platformCategoryId: catalogId || form.platformCategoryId || null,
        catalogCategoryId: leafCategoryId,
        catalogCategoryName: categoryName,
        categoryRootId: form.categoryRootId || '',
        subcategoryId: form.subcategoryId || '',
        subSubcategoryId: form.subSubcategoryId || '',
        subcategory: findCategoryName(form.subcategoryId) || 'None',
        subSubcategory: findCategoryName(form.subSubcategoryId) || 'None',
        prepTime: form.prepTime,
        descriptionEn: form.descriptionEn,
        descriptionAr: form.descriptionAr,
        badges: form.badges,
        timeSlot: form.timeSlot,
        availableFrom: form.availableFrom,
        availableTo: form.availableTo,
        optionGroups: form.optionGroups,
        addOns: filledAddOns,
        active: form.active,
        status: form.active ? 'Active' : 'Draft',
        badge: hasOptions ? 'Options' : 'Simple',
        badgeTone: hasOptions ? 'options' : 'simple',
        icon: form.icon || '🍔',
        stock: source.stock || 'Made to order',
        stockType: 'MADE_TO_ORDER',
        imageUrl,
        imageUrls,
        imageFiles,
      })
    } catch (err) {
      setUploadError(formatApiErrorMessage(err, 'Unable to save product images.'))
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-[rgba(0,0,0,0.28)] py-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-modal-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="flex w-[860px] max-w-[calc(100vw-24px)] flex-col items-start rounded-[16px] bg-white shadow-[0_20px_60px_rgba(26,28,26,0.22)]">
        {/* Header */}
        <div className="flex h-[57px] w-full shrink-0 flex-row items-center border-b border-[#E3E8E3] px-5 py-[18px] pl-[22px] pr-5">
          <h2 id="product-modal-title" className="min-w-0 flex-1 text-[16px] font-bold leading-[21px] text-[#1A1A1A]">
            {isAdd ? 'Add product' : 'Edit product'}
          </h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="text-[16px] font-normal leading-[19px] text-[#69706E] hover:text-[#1A1A1A]"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="relative flex w-full flex-col">
          {isLoadingDetail ? (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-b-[16px] bg-white/70 text-[13px] text-ink-muted">
              Loading product details…
            </div>
          ) : null}
          <div className="flex w-full flex-col items-start gap-4 px-[22px] pt-[18px] pb-[22px]">
            {/* Images */}
            <p className="text-[12.5px] font-bold leading-[15px] text-[#1A1A1A]">Images</p>

            <div className="flex h-[86px] flex-row items-start gap-[10px]">
              {imageSlots.map((url, slot) => {
                const displayUrl = resolveAdminMediaUrl(url) || url
                const isMain = slot === 0
                return (
                  <div key={slot} className="relative">
                    <input
                      ref={(node) => {
                        fileInputRefs.current[slot] = node
                      }}
                      type="file"
                      accept={VENDOR_IMAGE_UPLOAD_ACCEPT}
                      className="hidden"
                      onChange={(event) => handleImageFileChange(slot, event)}
                    />
                    {displayUrl ? (
                      <div className="relative flex size-[86px] shrink-0 flex-col items-center justify-center overflow-hidden rounded-[11px] bg-[#E3F2EB]">
                        <img
                          src={displayUrl}
                          alt=""
                          className="absolute inset-0 size-full object-cover"
                        />
                        {isMain ? (
                          <span className="absolute bottom-1.5 z-[1] inline-flex h-[21px] items-center rounded-[20px] bg-white px-2.5 py-1">
                            <span className="text-[11px] font-medium leading-[13px] text-[#127036]">
                              Main
                            </span>
                          </span>
                        ) : null}
                        <button
                          type="button"
                          aria-label="Remove image"
                          disabled={isSaving}
                          onClick={() => clearImageAtSlot(slot)}
                          className="absolute top-1 right-1 z-[1] flex size-5 items-center justify-center rounded-full bg-black/55 text-[11px] text-white hover:bg-black/70 disabled:opacity-50"
                        >
                          ✕
                        </button>
                        <button
                          type="button"
                          disabled={isSaving}
                          onClick={() => openImagePicker(slot)}
                          className="absolute inset-0 z-0"
                          aria-label={isMain ? 'Change main image' : 'Change image'}
                        />
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={isSaving}
                        onClick={() => openImagePicker(slot)}
                        className={`box-border flex size-[86px] shrink-0 flex-col items-center justify-center gap-0.5 rounded-[11px] border-[1.5px] border-dashed border-[#C7CFC7] bg-white disabled:opacity-60 ${
                          isMain ? 'bg-[#E3F2EB]' : ''
                        }`}
                      >
                        <span className="text-[20px] font-bold leading-6 text-[#949C94]">＋</span>
                        <span className="text-[10px] font-medium leading-3 text-[#949C94]">
                          {isMain ? 'Main' : 'Add'}
                        </span>
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
            {uploadError ? (
              <p className="-mt-2 text-[12px] font-medium text-[#C0392B]">{uploadError}</p>
            ) : (
              <p className="-mt-2 text-[11px] text-[#949C94]">
                Images are uploaded when you save the product.
              </p>
            )}

            {/* Names */}
            <div className="flex w-full flex-row items-start gap-[14px]">
              <div className="flex min-w-0 flex-1 flex-col items-start gap-1.5">
                <label className={labelClass}>PRODUCT NAME (EN)</label>
                <input
                  className={inputBox}
                  value={form.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder="e.g. Classic Burger"
                />
              </div>
              <div className="flex min-w-0 flex-1 flex-col items-start gap-1.5">
                <label className={labelClass}>PRODUCT NAME (AR)</label>
                <input
                  className={`${inputBox} text-right`}
                  dir="rtl"
                  value={form.nameAr}
                  onChange={(e) => updateField('nameAr', e.target.value)}
                  placeholder="اسم المنتج"
                />
              </div>
            </div>

            {/* Price · Category · Subcategory · Sub-subcategory · Prep time */}
            <div className="flex w-full flex-row items-start gap-[10px]">
              <div className="flex w-[84px] shrink-0 flex-col items-start gap-1.5">
                <label className={labelClass}>PRICE (BHD)</label>
                <input
                  className={inputBox}
                  value={form.priceValue}
                  onChange={(e) => updateField('priceValue', e.target.value)}
                  placeholder="0.000"
                />
              </div>

              <FieldSelect
                className="w-[148px] shrink-0"
                label="CATEGORY"
                value={form.categoryRootId || ''}
                onChange={(e) => {
                  const nextRoot = e.target.value
                  const selected = tree.find((node) => node.id === nextRoot)
                  setForm((current) => ({
                    ...current,
                    categoryRootId: nextRoot,
                    subcategoryId: '',
                    subSubcategoryId: '',
                    catalogCategoryId: nextRoot || '',
                    categoryValue: selected?.name || '',
                  }))
                }}
                options={categoryOptions}
              />

              {subcategoryNodes.length > 0 ? (
                <FieldSelect
                  className="min-w-0 flex-1"
                  label="SUBCATEGORY"
                  value={form.subcategoryId || ''}
                  onChange={(e) => {
                    const nextSub = e.target.value
                    const selected = subcategoryNodes.find((node) => node.id === nextSub)
                    setForm((current) => ({
                      ...current,
                      subcategoryId: nextSub,
                      subSubcategoryId: '',
                      catalogCategoryId: nextSub || current.categoryRootId || '',
                      subcategory: selected?.name || 'None',
                    }))
                  }}
                  options={subcategoryOptions}
                />
              ) : null}

              {subSubcategoryNodes.length > 0 ? (
                <FieldSelect
                  className="min-w-0 flex-1"
                  label="SUB-SUBCATEGORY"
                  value={form.subSubcategoryId || ''}
                  onChange={(e) => {
                    const nextLeaf = e.target.value
                    const selected = subSubcategoryNodes.find((node) => node.id === nextLeaf)
                    setForm((current) => ({
                      ...current,
                      subSubcategoryId: nextLeaf,
                      catalogCategoryId:
                        nextLeaf || current.subcategoryId || current.categoryRootId || '',
                      subSubcategory: selected?.name || 'None',
                    }))
                  }}
                  options={subSubcategoryOptions}
                />
              ) : null}

              <div className="flex w-[110px] shrink-0 flex-col items-start gap-1.5">
                <label className={labelClass}>PREP TIME (MINS)</label>
                <input
                  className={inputBox}
                  value={form.prepTime}
                  onChange={(e) => updateField('prepTime', e.target.value)}
                  placeholder="20"
                />
              </div>
            </div>

            {/* Descriptions */}
            <div className="flex w-full flex-row items-start gap-[14px]">
              <div className="flex min-w-0 flex-1 flex-col items-start gap-1.5">
                <label className={labelClass}>DESCRIPTION (EN)</label>
                <textarea
                  className="box-border h-[68px] w-full resize-none rounded-[9px] border border-[#D6DBD6] bg-white px-3 pt-2.5 text-[12.5px] font-medium leading-[15px] text-[#1A1A1A] outline-none focus:border-[#1AA34D] placeholder:text-[#949C94]"
                  value={form.descriptionEn}
                  onChange={(e) => updateField('descriptionEn', e.target.value)}
                  placeholder="Short description for the menu"
                />
              </div>
              <div className="flex min-w-0 flex-1 flex-col items-start gap-1.5">
                <label className={labelClass}>DESCRIPTION (AR)</label>
                <textarea
                  className="box-border h-[68px] w-full resize-none rounded-[9px] border border-[#D6DBD6] bg-white px-3 pt-2.5 text-right text-[12.5px] font-medium leading-[23px] text-[#1A1A1A] outline-none placeholder:text-[#949C94] focus:border-[#1AA34D]"
                  dir="rtl"
                  value={form.descriptionAr}
                  onChange={(e) => updateField('descriptionAr', e.target.value)}
                  placeholder="وصف قصير للقائمة"
                />
              </div>
            </div>

            {/* Badges */}
            <p className="text-[12.5px] font-bold leading-[15px] text-[#1A1A1A]">Badges</p>
            <div className="-mt-1 flex w-full flex-row flex-wrap content-start items-start gap-2">
              {resolvedBadgeOptions.map((badge) => (
                <Chip
                  key={badge.code || badge.label}
                  selected={form.badges.includes(badge.label)}
                  onClick={() => toggleBadge(badge.label)}
                >
                  {badge.label}
                </Chip>
              ))}
            </div>

            {/* Availability time slots */}
            <p className="text-[12.5px] font-bold leading-[15px] text-[#1A1A1A]">Availability time slots</p>
            <div className="-mt-1 flex w-full flex-row flex-wrap content-start items-start gap-2">
              {TIME_SLOTS.map((slot) => (
                <Chip key={slot} selected={form.timeSlot === slot} onClick={() => updateField('timeSlot', slot)}>
                  {slot}
                </Chip>
              ))}
            </div>

            <div className="flex flex-row items-start gap-[14px]">
              <div className="flex w-[100px] flex-col items-start gap-1.5">
                <label className={labelClass}>AVAILABLE FROM</label>
                <input
                  className={inputBox}
                  value={form.availableFrom}
                  onChange={(e) => updateField('availableFrom', e.target.value)}
                  placeholder="11:00"
                />
              </div>
              <div className="flex w-[100px] flex-col items-start gap-1.5">
                <label className={labelClass}>AVAILABLE TO</label>
                <input
                  className={inputBox}
                  value={form.availableTo}
                  onChange={(e) => updateField('availableTo', e.target.value)}
                  placeholder="23:00"
                />
              </div>
            </div>

            {/* Options */}
            <div className="flex w-full flex-row items-center">
              <p className="text-[12.5px] font-bold leading-[15px] text-[#1A1A1A]">Options</p>
              <span className="min-h-1.5 min-w-0 flex-1" />
              <button
                type="button"
                onClick={openAddOptionGroup}
                className="text-[11px] font-medium leading-[14px] text-[#127036] hover:underline"
              >
                + Add option group
              </button>
            </div>

            <div className="-mt-1 flex w-full flex-col gap-2">
              {form.optionGroups.map((group, idx) => {
                const required =
                  group.tagTone === 'required' || String(group.tag).toLowerCase().includes('required')
                return (
                  <button
                    key={`${group.title}-${idx}`}
                    type="button"
                    onClick={() => openEditOptionGroup(group, idx)}
                    className="flex w-full flex-col items-start gap-1 rounded-[10px] bg-[#F2F7F2] px-3 py-[11px] text-left transition hover:bg-[#E8F2E8]"
                  >
                    <div className="flex w-full flex-row items-center gap-2">
                      <span className="text-[12.5px] font-medium leading-[15px] text-[#1A1A1A]">
                        {group.title}
                      </span>
                      <span className="min-h-1.5 min-w-0 flex-1" />
                      <span
                        className={`inline-flex h-[21px] items-center rounded-[20px] px-2.5 py-1 text-[11px] font-medium leading-[13px] ${
                          required ? 'bg-[#E6F0FF] text-[#2978DB]' : 'bg-[#EBEDEB] text-[#69706E]'
                        }`}
                      >
                        {group.tag}
                      </span>
                      <span className="text-[16px] font-bold leading-[19px] text-[#949C94]">›</span>
                    </div>
                    <span className="w-full text-[11px] font-normal leading-[13px] text-[#949C94]">
                      {group.detail}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Add-ons / extras — same header pattern as Options */}
            <div className="flex w-full flex-row items-center">
              <p className="text-[12.5px] font-bold leading-[15px] text-[#1A1A1A]">Add-ons / extras</p>
              <span className="min-h-1.5 min-w-0 flex-1" />
              <button
                type="button"
                onClick={addAddOn}
                className="text-[11px] font-medium leading-[14px] text-[#127036] hover:underline"
              >
                + Add add-on
              </button>
            </div>

            <div className="-mt-1 flex w-full flex-col gap-2">
              {form.addOns.map((addon, idx) => {
                const empty = !addon.name.trim()
                return (
                  <div
                    key={idx}
                    className="flex h-[54px] w-full flex-row items-center gap-2 rounded-[10px] bg-[#F2F7F2] px-3 py-2.5"
                  >
                    <GripVertical size={14} className="shrink-0 text-[#949C94]" />
                    <span className="box-border flex size-[34px] shrink-0 items-center justify-center rounded-[8px] border-[1.4px] border-dashed border-[#C7CFC7] bg-white text-[12px]">
                      📷
                    </span>
                    <input
                      className={`min-w-0 flex-1 border-none bg-transparent outline-none ${
                        empty
                          ? 'text-[13px] font-normal leading-[16px] text-[#9EA69E]'
                          : 'text-[12.5px] font-medium leading-[15px] text-[#1A1A1A]'
                      }`}
                      placeholder="Add-on name"
                      value={addon.name}
                      onChange={(e) => updateAddOn(idx, 'name', e.target.value)}
                    />
                    <input
                      className={`w-[58px] shrink-0 border-none bg-transparent text-right outline-none ${
                        empty
                          ? 'text-[13px] font-normal leading-[16px] text-[#9EA69E]'
                          : 'text-[12.5px] font-medium leading-[15px] text-[#127036]'
                      }`}
                      value={addon.price}
                      onChange={(e) => updateAddOn(idx, 'price', e.target.value)}
                    />
                    <button
                      type="button"
                      aria-label="Remove add-on"
                      onClick={() => removeAddOn(idx)}
                      className="shrink-0 text-[13px] hover:opacity-80"
                    >
                      🗑
                    </button>
                  </div>
                )
              })}
            </div>

            {/* Availability */}
            <p className="text-[12.5px] font-bold leading-[15px] text-[#1A1A1A]">Availability</p>
            <div className="-mt-1 flex h-[30px] w-full flex-row items-center gap-2.5">
              <div className="flex min-w-0 flex-1 flex-col items-start gap-0.5">
                <span className="text-[12.5px] font-medium leading-[15px] text-[#1A1A1A]">Active</span>
                <span className="text-[11px] font-normal leading-[13px] text-[#949C94]">
                  Visible to customers
                </span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={form.active}
                onClick={() => updateField('active', !form.active)}
                className={`relative flex h-[22px] w-[38px] shrink-0 items-center rounded-[11px] px-[3px] transition-colors ${
                  form.active ? 'justify-end bg-[#1AA34D]' : 'justify-start bg-[#C7CFC7]'
                }`}
              >
                <span className="size-4 rounded-lg bg-white shadow-sm" />
              </button>
            </div>
          </div>

          <div className="h-px w-full bg-[#E3E8E3]" />

          {saveError ? (
            <div className="w-full px-[22px] pt-3 text-[12.5px] text-danger">{saveError}</div>
          ) : null}

          {/* Footer */}
          <div className="flex h-[68px] w-full flex-row items-center gap-[10px] px-[22px] pt-3.5 pb-4">
            <span className="min-h-1.5 min-w-0 flex-1" />
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving || isLoadingDetail}
              className="box-border inline-flex h-[38px] min-w-[80px] items-center justify-center rounded-[10px] border border-[#D6DBD6] bg-white px-[18px] py-[11px] text-[13px] font-medium leading-4 text-[#1A1A1A] disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || isLoadingDetail}
              className="inline-flex h-[38px] min-w-[120px] items-center justify-center rounded-[10px] bg-[#1AA34D] px-[18px] py-[11px] text-[13px] font-medium leading-4 text-white hover:brightness-[0.96] disabled:opacity-60"
            >
              {isSaving ? 'Saving…' : 'Save product'}
            </button>
          </div>
        </form>
      </div>

      <OptionGroupModal
        open={optionModal.open}
        group={optionModal.group}
        onClose={closeOptionModal}
        onSave={saveOptionGroup}
      />
    </div>
  )
}
