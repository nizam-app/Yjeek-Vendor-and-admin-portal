import { useEffect, useRef, useState } from 'react'
import { GripVertical, Plus, X } from 'lucide-react'
import AdminIconImageUpload from '../AdminIconImageUpload'
import AdminMediaImage from '../AdminMediaImage'
import { resolveAdminMediaUrl } from '../../../mappers/admin/mapAdminUpload'
import { parseBhdInput } from '../../../mappers/admin/mapAdminMenuImport'
import {
  ADMIN_IMAGE_UPLOAD_ACCEPT,
  adminUploadService,
  validateAdminImageFile,
} from '../../../services/admin/uploadService'
import AdminOptionGroupModal from './AdminOptionGroupModal'

const labelClass = 'text-[12px] font-medium text-[#7c8780]'
const inputClass =
  'box-border h-[40px] w-full rounded-[8px] border border-[rgba(0,0,0,0.1)] bg-white px-3 text-[13px] text-[#17231c] outline-none focus:border-[#1aa054]'
const arInputClass = `${inputClass} text-right`
const textareaClass =
  'box-border min-h-[68px] w-full resize-none rounded-[8px] border border-[rgba(0,0,0,0.1)] bg-white px-3 py-2.5 text-[13px] text-[#17231c] outline-none focus:border-[#1aa054]'
const outlineBtn =
  'inline-flex h-[34px] items-center justify-center gap-1.5 rounded-full border border-[#dfe4e0] bg-white px-3 text-[12px] font-medium text-[#127338] hover:bg-[#f6f8f6] disabled:opacity-50'
const primaryBtn =
  'inline-flex h-[34px] items-center justify-center gap-1.5 rounded-full bg-[#1aa054] px-4 text-[12px] font-bold text-white hover:bg-[#158a47] disabled:opacity-50'
const ghostBtn =
  'inline-flex size-8 items-center justify-center rounded-full text-[#637068] hover:bg-[#f3f5f3] disabled:opacity-50'

const DEFAULT_BADGES = [
  { code: 'NEW', label: 'New' },
  { code: 'BESTSELLER', label: 'Bestseller' },
  { code: 'HALAL', label: 'Halal' },
  { code: 'SPICY', label: 'Spicy' },
  { code: 'VEGETARIAN', label: 'Vegetarian' },
  { code: 'VEGAN', label: 'Vegan' },
  { code: 'GLUTEN_FREE', label: 'Gluten free' },
  { code: 'HEALTHY', label: 'Healthy' },
]

const TIME_SLOTS = [
  { value: 'ALL_DAY', label: 'All day' },
  { value: 'BREAKFAST', label: 'Breakfast' },
  { value: 'LUNCH', label: 'Lunch' },
  { value: 'DINNER', label: 'Dinner' },
  { value: 'LATE_NIGHT', label: 'Late night' },
]

function normalizeBadge(code) {
  return String(code || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
}

function parseAddonPrice(raw) {
  const cleaned = String(raw || '')
    .replace(/[+,\s]/g, '')
    .trim()
  const n = Number(cleaned)
  return Number.isFinite(n) ? Math.max(0, n) : 0
}

function buildInitialForm(item, categories, initialCategoryId) {
  const imageUrls = Array.isArray(item?.imageUrls)
    ? [...item.imageUrls]
    : item?.imageUrl
      ? [item.imageUrl]
      : []
  while (imageUrls.length < 4) imageUrls.push('')
  const slots = Array.isArray(item?.availabilitySlots) ? item.availabilitySlots : []
  const timeSlot = slots[0] || 'ALL_DAY'
  const addons =
    Array.isArray(item?.addons) && item.addons.length
      ? item.addons.map((a) => ({
          name: a.name || '',
          nameAr: a.nameAr || '',
          price: `+${Number(a.price ?? 0).toFixed(3)}`,
        }))
      : [{ name: '', nameAr: '', price: '+0.000' }]
  const optionGroups = Array.isArray(item?.optionGroups)
    ? item.optionGroups.map((g) => ({
        title: g.title || g.name || '',
        name: g.name || g.title || '',
        nameAr: g.nameAr || '',
        selection: Number(g.maxSelect ?? 1) > 1 ? 'multiple' : 'single',
        minSelect: g.minSelect ?? 0,
        maxSelect: g.maxSelect ?? 1,
        isRequired: Boolean(g.isRequired),
        tag: g.tag || (g.isRequired ? 'Required' : 'Optional'),
        tagTone: g.isRequired ? 'required' : 'optional',
        detail:
          g.detail ||
          (Array.isArray(g.options) ? g.options.map((o) => o.name).join(' · ') : '') ||
          (Array.isArray(g.choices) ? g.choices.map((c) => c.name).join(' · ') : ''),
        choices: Array.isArray(g.choices)
          ? g.choices
          : Array.isArray(g.options)
            ? g.options.map((o) => ({
                name: o.name,
                nameAr: o.nameAr || '',
                price: `+${Number(o.priceDelta ?? o.price ?? 0).toFixed(3)}`,
                isDefault: Boolean(o.isDefault),
              }))
            : [],
        options: Array.isArray(g.options) ? g.options : [],
      }))
    : []

  return {
    categoryId: initialCategoryId || item?.categoryId || categories[0]?.id || '',
    name: item?.name || '',
    nameAr: item?.nameAr || '',
    price: item ? Number(item.price).toFixed(3) : '',
    subcategory: item?.subcategory || '',
    subSubcategory: item?.subSubcategory || '',
    prepTime: item?.prepTimeMin != null ? String(item.prepTimeMin) : '',
    description: item?.description || '',
    descriptionAr: item?.descriptionAr || '',
    imageUrls: imageUrls.slice(0, 4),
    badges: Array.isArray(item?.badges) ? item.badges.map(normalizeBadge) : [],
    timeSlot,
    availableFrom: item?.availableFrom || '11:00',
    availableTo: item?.availableTo || '23:00',
    optionGroups,
    addOns: addons,
    active: item?.isActive === true,
  }
}

function Chip({ selected, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-[28px] items-center rounded-full px-3 text-[12px] font-medium ${
        selected ? 'bg-[#1aa054] text-white' : 'bg-[#f3f5f3] text-[#455249] hover:bg-[#e8ece8]'
      }`}
    >
      {children}
    </button>
  )
}

/**
 * Full food-catalog parity editor for admin staged import items.
 */
export default function AdminEditImportItemModal({
  open,
  mode = 'create',
  categories = [],
  initialCategoryId,
  item,
  busy = false,
  onClose,
  onSave,
}) {
  const [form, setForm] = useState(() => buildInitialForm(item, categories, initialCategoryId))
  const [uploadError, setUploadError] = useState('')
  const [uploadingSlot, setUploadingSlot] = useState(null)
  const [optionModal, setOptionModal] = useState(null)
  const fileRefs = useRef([])

  useEffect(() => {
    if (!open) return
    setForm(buildInitialForm(item, categories, initialCategoryId))
    setUploadError('')
    setOptionModal(null)
  }, [open, item, categories, initialCategoryId])

  useEffect(() => {
    if (!open) return undefined
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    function onKeyDown(e) {
      if (e.key === 'Escape' && !optionModal) onClose?.()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open, onClose, optionModal])

  if (!open) return null

  const updateField = (key, value) => setForm((c) => ({ ...c, [key]: value }))

  const toggleBadge = (code) => {
    const normalized = normalizeBadge(code)
    setForm((c) => {
      const has = c.badges.includes(normalized)
      return {
        ...c,
        badges: has ? c.badges.filter((b) => b !== normalized) : [...c.badges, normalized],
      }
    })
  }

  const setImageAt = (slot, url) => {
    setForm((c) => {
      const imageUrls = [...c.imageUrls]
      imageUrls[slot] = url || ''
      return { ...c, imageUrls }
    })
  }

  const handleImagePick = async (slot, file) => {
    if (!file) return
    setUploadError('')
    try {
      validateAdminImageFile(file)
      setUploadingSlot(slot)
      const uploaded = await adminUploadService.uploadImage(file, { feature: 'menu-import' })
      const url = uploaded?.data?.url || uploaded?.url || uploaded?.imageUrl || ''
      if (!url) throw new Error('Upload failed.')
      setImageAt(slot, url)
    } catch (err) {
      setUploadError(err?.message || 'Failed to upload image.')
    } finally {
      setUploadingSlot(null)
    }
  }

  const updateAddOn = (index, field, value) => {
    setForm((c) => ({
      ...c,
      addOns: c.addOns.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    }))
  }

  const submit = () => {
    const parsed = parseBhdInput(form.price)
    if (!form.name.trim() || parsed === null || !form.categoryId) return

    const imageUrls = form.imageUrls.map((u) => String(u || '').trim()).filter(Boolean).slice(0, 4)
    const filledAddOns = form.addOns
      .filter((a) => a.name.trim())
      .map((a, index) => ({
        name: a.name.trim(),
        nameAr: String(a.nameAr || '').trim() || undefined,
        price: parseAddonPrice(a.price),
        sortOrder: index,
        isActive: true,
      }))
    const optionGroups = form.optionGroups.map((g, index) => ({
      name: g.name || g.title,
      nameAr: g.nameAr || undefined,
      minSelect: g.minSelect ?? (g.selection === 'single' ? 1 : 0),
      maxSelect: g.maxSelect ?? (g.selection === 'single' ? 1 : 2),
      isRequired: Boolean(g.isRequired),
      sortOrder: index,
      options: (Array.isArray(g.options) && g.options.length
        ? g.options
        : (g.choices || []).map((c) => ({
            name: c.name,
            nameAr: c.nameAr || undefined,
            priceDelta: parseAddonPrice(c.price),
            isDefault: Boolean(c.isDefault),
            isAvailable: true,
          }))
      ).filter((o) => o.name),
    }))

    const prep = Number(form.prepTime)
    onSave({
      categoryId: form.categoryId,
      name: form.name.trim(),
      nameAr: form.nameAr.trim() || undefined,
      price: parsed,
      description: form.description.trim() || undefined,
      descriptionAr: form.descriptionAr.trim() || undefined,
      imageUrl: imageUrls[0] || undefined,
      imageUrls,
      subcategory: form.subcategory.trim() || null,
      subSubcategory: form.subSubcategory.trim() || null,
      prepTimeMin: Number.isFinite(prep) && prep > 0 ? Math.trunc(prep) : null,
      badges: form.badges,
      availabilitySlots: form.timeSlot ? [form.timeSlot] : ['ALL_DAY'],
      availableFrom: form.availableFrom.trim() || null,
      availableTo: form.availableTo.trim() || null,
      optionGroups,
      addons: filledAddOns,
      isActive: form.active,
    })
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
        <div className="flex max-h-[92vh] w-full max-w-[720px] flex-col overflow-hidden rounded-[14px] bg-white shadow-[0_12px_40px_rgba(20,40,28,.18)]">
          <div className="flex items-center justify-between border-b border-[#edf0ee] px-5 py-4">
            <h3 className="text-[15px] font-bold text-[#17231c]">
              {mode === 'edit' ? 'Edit product' : 'Add product'}
            </h3>
            <button type="button" className={ghostBtn} onClick={onClose} aria-label="Close">
              <X size={16} />
            </button>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
            {/* Images ×4 */}
            <div>
              <p className="mb-2 text-[12.5px] font-bold text-[#17231c]">Images</p>
              <div className="flex flex-wrap gap-2">
                {form.imageUrls.map((url, slot) => {
                  const isMain = slot === 0
                  return (
                    <div key={slot} className="relative">
                      <input
                        ref={(node) => {
                          fileRefs.current[slot] = node
                        }}
                        type="file"
                        accept={ADMIN_IMAGE_UPLOAD_ACCEPT}
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          e.target.value = ''
                          void handleImagePick(slot, file)
                        }}
                      />
                      {url ? (
                        <div className="relative flex size-[86px] overflow-hidden rounded-[11px] bg-[#E3F2EB]">
                          <AdminMediaImage
                            src={resolveAdminMediaUrl(url) || url}
                            alt=""
                            className="absolute inset-0 size-full object-cover"
                          />
                          {isMain ? (
                            <span className="absolute bottom-1.5 z-[1] inline-flex h-[21px] items-center rounded-[20px] bg-white px-2.5 text-[11px] font-medium text-[#127036]">
                              Main
                            </span>
                          ) : null}
                          <button
                            type="button"
                            disabled={busy || uploadingSlot != null}
                            onClick={() => setImageAt(slot, '')}
                            className="absolute top-1 end-1 z-[1] flex size-5 items-center justify-center rounded-full bg-black/55 text-[11px] text-white"
                            aria-label="Remove image"
                          >
                            ✕
                          </button>
                          <button
                            type="button"
                            disabled={busy || uploadingSlot != null}
                            className="absolute inset-0 z-0"
                            aria-label="Replace image"
                            onClick={() => fileRefs.current[slot]?.click()}
                          />
                        </div>
                      ) : (
                        <button
                          type="button"
                          disabled={busy || uploadingSlot != null}
                          onClick={() => fileRefs.current[slot]?.click()}
                          className={`box-border flex size-[86px] flex-col items-center justify-center gap-0.5 rounded-[11px] border-[1.5px] border-dashed border-[#C7CFC7] bg-white disabled:opacity-60 ${
                            isMain ? 'bg-[#E3F2EB]' : ''
                          }`}
                        >
                          <span className="text-[20px] font-bold text-[#949C94]">＋</span>
                          <span className="text-[10px] font-medium text-[#949C94]">
                            {uploadingSlot === slot ? '…' : isMain ? 'Main' : 'Add'}
                          </span>
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
              {uploadError ? (
                <p className="mt-1 text-[12px] font-medium text-[#C0392B]">{uploadError}</p>
              ) : (
                <p className="mt-1 text-[11px] text-[#949C94]">
                  Images are uploaded when you pick them. First slot is Main.
                </p>
              )}
            </div>

            {/* Names */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="block">
                <span className={`mb-1.5 block ${labelClass}`}>PRODUCT NAME (EN)</span>
                <input
                  className={inputClass}
                  value={form.name}
                  onChange={(e) => updateField('name', e.target.value)}
                />
              </label>
              <label className="block">
                <span className={`mb-1.5 block ${labelClass}`}>PRODUCT NAME (AR)</span>
                <input
                  className={arInputClass}
                  dir="rtl"
                  lang="ar"
                  value={form.nameAr}
                  onChange={(e) => updateField('nameAr', e.target.value)}
                />
              </label>
            </div>

            {/* Price · Category · Sub · Sub-sub · Prep */}
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
              <label className="block">
                <span className={`mb-1.5 block ${labelClass}`}>PRICE (BHD)</span>
                <input
                  className={inputClass}
                  value={form.price}
                  onChange={(e) => updateField('price', e.target.value)}
                  placeholder="0.000"
                />
              </label>
              <label className="block">
                <span className={`mb-1.5 block ${labelClass}`}>CATEGORY *</span>
                <select
                  className={inputClass}
                  value={form.categoryId}
                  onChange={(e) => updateField('categoryId', e.target.value)}
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className={`mb-1.5 block ${labelClass}`}>SUBCATEGORY</span>
                <input
                  className={inputClass}
                  value={form.subcategory}
                  onChange={(e) => updateField('subcategory', e.target.value)}
                  placeholder="Optional"
                />
              </label>
              <label className="block">
                <span className={`mb-1.5 block ${labelClass}`}>SUB-SUBCATEGORY</span>
                <input
                  className={inputClass}
                  value={form.subSubcategory}
                  onChange={(e) => updateField('subSubcategory', e.target.value)}
                  placeholder="Optional"
                />
              </label>
              <label className="block">
                <span className={`mb-1.5 block ${labelClass}`}>PREP TIME (MINS)</span>
                <input
                  className={inputClass}
                  value={form.prepTime}
                  onChange={(e) => updateField('prepTime', e.target.value)}
                  placeholder="20"
                />
              </label>
            </div>

            {/* Descriptions */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="block">
                <span className={`mb-1.5 block ${labelClass}`}>DESCRIPTION (EN)</span>
                <textarea
                  className={textareaClass}
                  value={form.description}
                  onChange={(e) => updateField('description', e.target.value)}
                />
              </label>
              <label className="block">
                <span className={`mb-1.5 block ${labelClass}`}>DESCRIPTION (AR)</span>
                <textarea
                  className={`${textareaClass} text-right`}
                  dir="rtl"
                  lang="ar"
                  value={form.descriptionAr}
                  onChange={(e) => updateField('descriptionAr', e.target.value)}
                />
              </label>
            </div>

            {/* Badges */}
            <div>
              <p className="mb-2 text-[12.5px] font-bold text-[#17231c]">Badges</p>
              <div className="flex flex-wrap gap-2">
                {DEFAULT_BADGES.map((badge) => (
                  <Chip
                    key={badge.code}
                    selected={form.badges.includes(badge.code)}
                    onClick={() => toggleBadge(badge.code)}
                  >
                    {badge.label}
                  </Chip>
                ))}
              </div>
            </div>

            {/* Availability slots */}
            <div>
              <p className="mb-2 text-[12.5px] font-bold text-[#17231c]">Availability time slots</p>
              <div className="mb-3 flex flex-wrap gap-2">
                {TIME_SLOTS.map((slot) => (
                  <Chip
                    key={slot.value}
                    selected={form.timeSlot === slot.value}
                    onClick={() => updateField('timeSlot', slot.value)}
                  >
                    {slot.label}
                  </Chip>
                ))}
              </div>
              <div className="flex flex-wrap gap-3">
                <label className="block w-[120px]">
                  <span className={`mb-1.5 block ${labelClass}`}>AVAILABLE FROM</span>
                  <input
                    className={inputClass}
                    value={form.availableFrom}
                    onChange={(e) => updateField('availableFrom', e.target.value)}
                    placeholder="11:00"
                  />
                </label>
                <label className="block w-[120px]">
                  <span className={`mb-1.5 block ${labelClass}`}>AVAILABLE TO</span>
                  <input
                    className={inputClass}
                    value={form.availableTo}
                    onChange={(e) => updateField('availableTo', e.target.value)}
                    placeholder="23:00"
                  />
                </label>
              </div>
            </div>

            {/* Options */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[12.5px] font-bold text-[#17231c]">Options</p>
                <button
                  type="button"
                  className="text-[11px] font-medium text-[#127036] hover:underline"
                  onClick={() => setOptionModal({ mode: 'add' })}
                >
                  + Add option group
                </button>
              </div>
              <div className="space-y-2">
                {form.optionGroups.map((group, idx) => (
                  <button
                    key={`${group.title}-${idx}`}
                    type="button"
                    onClick={() => setOptionModal({ mode: 'edit', index: idx, group })}
                    className="flex w-full flex-col gap-1 rounded-[10px] bg-[#F2F7F2] px-3 py-[11px] text-start hover:bg-[#E8F2E8]"
                  >
                    <div className="flex w-full items-center gap-2">
                      <span className="text-[12.5px] font-medium text-[#1A1A1A]">
                        {group.title || group.name}
                      </span>
                      <span className="min-w-0 flex-1" />
                      <span
                        className={`inline-flex h-[21px] items-center rounded-[20px] px-2.5 text-[11px] font-medium ${
                          group.tagTone === 'required'
                            ? 'bg-[#E6F0FF] text-[#2978DB]'
                            : 'bg-[#EBEDEB] text-[#69706E]'
                        }`}
                      >
                        {group.tag || 'Optional'}
                      </span>
                    </div>
                    {group.detail ? (
                      <span className="text-[11px] text-[#949C94]">{group.detail}</span>
                    ) : null}
                  </button>
                ))}
              </div>
            </div>

            {/* Add-ons */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[12.5px] font-bold text-[#17231c]">Add-ons / extras</p>
                <button
                  type="button"
                  className="text-[11px] font-medium text-[#127036] hover:underline"
                  onClick={() =>
                    setForm((c) => ({
                      ...c,
                      addOns: [...c.addOns, { name: '', nameAr: '', price: '+0.000' }],
                    }))
                  }
                >
                  + Add add-on
                </button>
              </div>
              <div className="space-y-2">
                {form.addOns.map((addon, idx) => (
                  <div
                    key={idx}
                    className="space-y-1 rounded-[10px] bg-[#F2F7F2] px-3 py-2"
                  >
                    <div className="flex h-[40px] items-center gap-2">
                      <GripVertical size={14} className="shrink-0 text-[#949C94]" />
                      <input
                        className="min-w-0 flex-1 border-none bg-transparent text-[13px] outline-none"
                        placeholder="Add-on name (EN)"
                        value={addon.name}
                        onChange={(e) => updateAddOn(idx, 'name', e.target.value)}
                      />
                      <input
                        className="w-[72px] shrink-0 border-none bg-transparent text-end text-[13px] text-[#127036] outline-none"
                        value={addon.price}
                        onChange={(e) => updateAddOn(idx, 'price', e.target.value)}
                      />
                      <button
                        type="button"
                        className={ghostBtn}
                        aria-label="Remove add-on"
                        onClick={() =>
                          setForm((c) => ({
                            ...c,
                            addOns: c.addOns.filter((_, i) => i !== idx),
                          }))
                        }
                      >
                        🗑
                      </button>
                    </div>
                    <input
                      className="w-full border-none bg-transparent text-[12px] outline-none"
                      dir="rtl"
                      placeholder="اسم الإضافة (AR)"
                      value={addon.nameAr || ''}
                      onChange={(e) => updateAddOn(idx, 'nameAr', e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Active */}
            <div className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-[12.5px] font-medium text-[#1A1A1A]">Active</p>
                <p className="text-[11px] text-[#949C94]">Visible to customers after go-live</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={form.active}
                onClick={() => updateField('active', !form.active)}
                className={`relative flex h-[22px] w-[38px] shrink-0 items-center rounded-[11px] px-[3px] ${
                  form.active ? 'justify-end bg-[#1AA34D]' : 'justify-start bg-[#C7CFC7]'
                }`}
              >
                <span className="size-4 rounded-lg bg-white shadow-sm" />
              </button>
            </div>

            {/* Keep compact single-image helper for create fallbacks */}
            {mode === 'create' && !form.imageUrls.some(Boolean) ? (
              <div className="rounded-[10px] border border-dashed border-[#dfe4e0] p-3">
                <p className="mb-2 text-[12px] text-[#7c8780]">Or upload via picker</p>
                <AdminIconImageUpload
                  iconUrl={null}
                  onUrlChange={(url) => setImageAt(0, url || '')}
                  size={72}
                  aspect={1}
                  feature="menu-import"
                  skipCrop
                  disabled={busy}
                />
              </div>
            ) : null}
          </div>

          <div className="flex justify-end gap-2 border-t border-[#edf0ee] px-5 py-4">
            <button type="button" className={outlineBtn} disabled={busy} onClick={onClose}>
              Cancel
            </button>
            <button
              type="button"
              className={primaryBtn}
              disabled={busy || !form.name.trim() || !form.categoryId}
              onClick={submit}
            >
              {busy ? 'Saving…' : 'Save product'}
            </button>
          </div>
        </div>
      </div>

      <AdminOptionGroupModal
        open={Boolean(optionModal)}
        group={optionModal?.group || null}
        onClose={() => setOptionModal(null)}
        onSave={(group) => {
          setForm((c) => {
            const next = [...c.optionGroups]
            if (optionModal?.mode === 'edit' && Number.isInteger(optionModal.index)) {
              next[optionModal.index] = group
            } else {
              next.push(group)
            }
            return { ...c, optionGroups: next }
          })
          setOptionModal(null)
        }}
      />
    </>
  )
}
