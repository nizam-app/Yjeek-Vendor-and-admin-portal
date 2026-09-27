import { useCallback, useEffect, useMemo, useState } from 'react'
import { GripVertical, Pencil, Plus, Trash2 } from 'lucide-react'
import { ApiError } from '../../../api/errors'
import AdminModifierImageThumb, { moveListItem } from '../AdminModifierImageThumb'
import { AdminItemClassSegment } from './AdminItemClassSegment'
import AdminOptionGroupModal from './AdminOptionGroupModal'
import { adminStoresCatalogService } from '../../../services/admin/storesCatalogService'
import { adminUploadService, validateAdminImageFile } from '../../../services/admin/uploadService'
import { adminVendorService } from '../../../services/admin/vendorService'
import { showError, showSuccess } from '../../../utils/toast'

const cardClass =
  'rounded-[14px] border border-[#eceeec] bg-white shadow-[0_1px_2px_rgba(20,40,28,.03)]'
const outlineBtn =
  'inline-flex h-[34px] items-center gap-1.5 rounded-full border border-[#dfe4e0] bg-white px-3.5 text-[12.5px] font-medium text-[#127338] shadow-[0_1px_2px_rgba(20,40,28,.04)] hover:bg-[#f6f8f6] disabled:opacity-50'
const primaryBtn =
  'inline-flex h-[34px] items-center gap-1.5 rounded-full bg-[#1aa054] px-3.5 text-[12.5px] font-semibold text-white shadow-[0_1px_2px_rgba(20,40,28,.08)] hover:bg-[#158a47] disabled:opacity-50'
const inputClass =
  'h-[36px] w-full rounded-[10px] border border-[#e3e7e4] bg-white px-3 text-[13px] text-[#17231c] outline-none focus:border-[#1aa054]'
const labelClass = 'mb-1 block text-[11px] font-semibold uppercase tracking-[0.04em] text-[#7c8780]'

function hasBothItemClasses(itemClasses) {
  return (
    itemClasses?.allowsNormalItems !== false && itemClasses?.allowsSpecialItems !== false
  )
}

function formatPrice(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return '—'
  return `${n.toFixed(3)} BHD`
}

function parseAddonPrice(raw) {
  const cleaned = String(raw || '')
    .replace(/[+,\s]/g, '')
    .trim()
  const n = Number(cleaned)
  return Number.isFinite(n) ? Math.max(0, n) : 0
}

function flattenCategories(categories) {
  const rows = []
  for (const cat of Array.isArray(categories) ? categories : []) {
    if (!cat?.id) continue
    rows.push(cat)
    for (const child of Array.isArray(cat.children) ? cat.children : []) {
      if (!child?.id) continue
      rows.push(child)
    }
  }
  return rows
}

function emptyProductForm(categoryId = '') {
  return {
    name: '',
    nameAr: '',
    description: '',
    price: '',
    catalogCategoryId: categoryId || '',
    imageUrl: '',
    isActive: true,
    isAvailable: true,
    availableFrom: '',
    availableTo: '',
    itemClass: 'NORMAL',
    optionGroups: [],
    addOns: [{ name: '', nameAr: '', price: '+0.000', imageUrl: null }],
  }
}

function mapLoadedOptionGroups(groups) {
  if (!Array.isArray(groups)) return []
  return groups.map((g) => {
    const maxSelect = Number(g.maxSelect ?? g.max ?? 1)
    const selection = maxSelect > 1 ? 'multiple' : 'single'
    const choices = Array.isArray(g.choices)
      ? g.choices
      : Array.isArray(g.options)
        ? g.options
        : []
    return {
      id: g.id || undefined,
      title: g.name || g.title || '',
      name: g.name || g.title || '',
      nameAr: g.nameAr || '',
      selection,
      minSelect: Number(g.minSelect ?? g.min ?? (selection === 'single' ? 1 : 0)),
      maxSelect,
      isRequired: Boolean(g.isRequired),
      tag: g.isRequired ? 'Required' : 'Optional',
      tagTone: g.isRequired ? 'required' : 'optional',
      detail: `${choices.length} choice${choices.length === 1 ? '' : 's'}`,
      choices: choices.map((c) => ({
        id: c.id || undefined,
        name: c.name || '',
        nameAr: c.nameAr || '',
        price:
          c.priceDelta != null
            ? `+${Number(c.priceDelta).toFixed(3)}`
            : c.price != null
              ? String(c.price).startsWith('+')
                ? c.price
                : `+${Number(c.price).toFixed(3)}`
              : '+0.000',
        imageUrl: c.imageUrl || null,
        isDefault: Boolean(c.isDefault),
      })),
    }
  })
}

function mapLoadedAddOns(addons) {
  if (!Array.isArray(addons) || !addons.length) {
    return [{ name: '', nameAr: '', price: '+0.000', imageUrl: null }]
  }
  return addons.map((a) => ({
    id: a.id || undefined,
    name: a.name || '',
    nameAr: a.nameAr || '',
    price: `+${Number(a.price ?? 0).toFixed(3)}`,
    imageUrl: a.imageUrl || null,
  }))
}

function ProductFormModal({
  open,
  mode,
  form,
  setForm,
  categoryOptions,
  itemClassEditable,
  itemClassLockedBy,
  busy,
  error,
  onClose,
  onSave,
  onUploadImage,
}) {
  const [optionModal, setOptionModal] = useState(null)
  const [addonDragIndex, setAddonDragIndex] = useState(null)

  if (!open) return null

  const reorderAddOns = (from, to) => {
    setForm((prev) => ({
      ...prev,
      addOns: moveListItem(prev.addOns, from, to),
    }))
  }

  return (
    <>
      <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/35 p-4">
        <div className="flex max-h-[92vh] w-full max-w-[560px] flex-col overflow-hidden rounded-[16px] bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-[#edf0ee] px-5 py-4">
            <div>
              <h3 className="text-[15px] font-bold text-[#17231c]">
                {mode === 'create' ? 'Add menu item' : 'Edit menu item'}
              </h3>
              <p className="mt-0.5 text-[12px] text-[#7c8780]">
                Categories, price, class, options and add-ons — live catalog.
              </p>
            </div>
            <button
              type="button"
              className="rounded-full p-2 text-[#637068] hover:bg-[#f3f5f3]"
              onClick={onClose}
              disabled={busy}
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
            {error ? (
              <p className="text-[12px] font-medium text-[#d64044]" role="alert">
                {error}
              </p>
            ) : null}

            <div>
              <label className={labelClass}>Name (EN)</label>
              <input
                className={inputClass}
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                disabled={busy}
              />
            </div>
            <div>
              <label className={labelClass}>Name (AR)</label>
              <input
                className={inputClass}
                dir="rtl"
                value={form.nameAr}
                onChange={(e) => setForm((prev) => ({ ...prev, nameAr: e.target.value }))}
                disabled={busy}
              />
            </div>
            <div>
              <label className={labelClass}>Price (BHD)</label>
              <input
                className={inputClass}
                type="number"
                min="0"
                step="0.001"
                value={form.price}
                onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
                disabled={busy}
              />
            </div>
            <div>
              <label className={labelClass}>Category</label>
              <select
                className={inputClass}
                value={form.catalogCategoryId}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, catalogCategoryId: e.target.value }))
                }
                disabled={busy}
              >
                <option value="">Uncategorized</option>
                {categoryOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.depth ? `— ${opt.name}` : opt.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>Item class</label>
              <AdminItemClassSegment
                value={form.itemClass || 'NORMAL'}
                editable={itemClassEditable}
                lockedBy={itemClassLockedBy}
                disabled={busy}
                showEditableHint
                onChange={(next) => setForm((prev) => ({ ...prev, itemClass: next }))}
              />
            </div>

            <div>
              <label className={labelClass}>Description</label>
              <textarea
                className="min-h-[72px] w-full rounded-[10px] border border-[#e3e7e4] bg-white px-3 py-2 text-[13px] text-[#17231c] outline-none focus:border-[#1aa054]"
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                disabled={busy}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Available from</label>
                <input
                  className={inputClass}
                  placeholder="09:00"
                  value={form.availableFrom}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, availableFrom: e.target.value }))
                  }
                  disabled={busy}
                />
              </div>
              <div>
                <label className={labelClass}>Available to</label>
                <input
                  className={inputClass}
                  placeholder="22:00"
                  value={form.availableTo}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, availableTo: e.target.value }))
                  }
                  disabled={busy}
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Image</label>
              <div className="flex items-center gap-2">
                <input
                  className={inputClass}
                  value={form.imageUrl}
                  onChange={(e) => setForm((prev) => ({ ...prev, imageUrl: e.target.value }))}
                  placeholder="Image URL"
                  disabled={busy}
                />
                <label className={`${outlineBtn} cursor-pointer`}>
                  Upload
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={busy}
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) onUploadImage(file)
                      e.target.value = ''
                    }}
                  />
                </label>
              </div>
              {form.imageUrl ? (
                <img
                  src={form.imageUrl}
                  alt=""
                  className="mt-2 h-16 w-16 rounded-[8px] object-cover"
                />
              ) : null}
            </div>

            <div className="flex flex-wrap gap-4">
              <label className="inline-flex items-center gap-2 text-[12.5px] text-[#455249]">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                  disabled={busy}
                />
                Active
              </label>
              <label className="inline-flex items-center gap-2 text-[12.5px] text-[#455249]">
                <input
                  type="checkbox"
                  checked={form.isAvailable}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, isAvailable: e.target.checked }))
                  }
                  disabled={busy}
                />
                Available
              </label>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[12.5px] font-bold text-[#17231c]">Options</p>
                <button
                  type="button"
                  className="text-[11px] font-medium text-[#127036] hover:underline"
                  onClick={() => setOptionModal({ mode: 'add' })}
                  disabled={busy}
                >
                  + Add option group
                </button>
              </div>
              <div className="space-y-2">
                {(form.optionGroups || []).map((group, idx) => (
                  <button
                    key={`${group.title || group.name}-${idx}`}
                    type="button"
                    onClick={() => setOptionModal({ mode: 'edit', index: idx, group })}
                    className="flex w-full flex-col gap-1 rounded-[10px] bg-[#F2F7F2] px-3 py-[11px] text-start hover:bg-[#E8F2E8]"
                    disabled={busy}
                  >
                    <div className="flex w-full items-center gap-2">
                      <span className="text-[12.5px] font-medium text-[#1A1A1A]">
                        {group.title || group.name || 'Untitled group'}
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
                {(form.optionGroups || []).length === 0 ? (
                  <p className="text-[12px] text-[#9aa49d]">No option groups yet.</p>
                ) : null}
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[12.5px] font-bold text-[#17231c]">Add-ons / extras</p>
                <button
                  type="button"
                  className="text-[11px] font-medium text-[#127036] hover:underline"
                  disabled={busy}
                  onClick={() =>
                    setForm((c) => ({
                      ...c,
                      addOns: [
                        ...(c.addOns || []),
                        { name: '', nameAr: '', price: '+0.000', imageUrl: null },
                      ],
                    }))
                  }
                >
                  + Add add-on
                </button>
              </div>
              <div className="space-y-2">
                {(form.addOns || []).map((addon, idx) => (
                  <div
                    key={addon.id || idx}
                    draggable={!busy}
                    onDragStart={() => setAddonDragIndex(idx)}
                    onDragOver={(event) => {
                      event.preventDefault()
                      event.dataTransfer.dropEffect = 'move'
                    }}
                    onDrop={(event) => {
                      event.preventDefault()
                      if (addonDragIndex == null || addonDragIndex === idx) return
                      reorderAddOns(addonDragIndex, idx)
                      setAddonDragIndex(null)
                    }}
                    onDragEnd={() => setAddonDragIndex(null)}
                    className={`space-y-1 rounded-[10px] bg-[#F2F7F2] px-3 py-2 ${
                      addonDragIndex === idx ? 'opacity-60 ring-1 ring-[#1aa054]' : ''
                    }`}
                  >
                    <div className="flex h-[40px] items-center gap-2">
                      <span className="shrink-0 cursor-grab text-[#949C94]">
                        <GripVertical size={14} />
                      </span>
                      <AdminModifierImageThumb
                        imageUrl={addon.imageUrl || null}
                        disabled={busy}
                        onChange={(url) =>
                          setForm((c) => {
                            const next = [...(c.addOns || [])]
                            next[idx] = { ...next[idx], imageUrl: url }
                            return { ...c, addOns: next }
                          })
                        }
                      />
                      <input
                        className={`${inputClass} flex-1`}
                        placeholder="Add-on name"
                        value={addon.name}
                        disabled={busy}
                        onChange={(e) =>
                          setForm((c) => {
                            const next = [...(c.addOns || [])]
                            next[idx] = { ...next[idx], name: e.target.value }
                            return { ...c, addOns: next }
                          })
                        }
                      />
                      <input
                        className={`${inputClass} w-[100px]`}
                        placeholder="+0.000"
                        value={addon.price}
                        disabled={busy}
                        onChange={(e) =>
                          setForm((c) => {
                            const next = [...(c.addOns || [])]
                            next[idx] = { ...next[idx], price: e.target.value }
                            return { ...c, addOns: next }
                          })
                        }
                      />
                      <button
                        type="button"
                        className="rounded p-1.5 text-[#d64044] hover:bg-white"
                        disabled={busy}
                        onClick={() =>
                          setForm((c) => ({
                            ...c,
                            addOns: (c.addOns || []).filter((_, i) => i !== idx),
                          }))
                        }
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-[#edf0ee] px-5 py-3">
            <button type="button" className={outlineBtn} disabled={busy} onClick={onClose}>
              Cancel
            </button>
            <button type="button" className={primaryBtn} disabled={busy} onClick={onSave}>
              {busy ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </div>

      <AdminOptionGroupModal
        open={Boolean(optionModal)}
        group={optionModal?.group || null}
        onClose={() => setOptionModal(null)}
        onSave={(saved) => {
          setForm((c) => {
            const next = [...(c.optionGroups || [])]
            const choices = (saved.choices || []).map((ch) => ({
              id: ch.id,
              name: ch.name || '',
              nameAr: ch.nameAr || '',
              price:
                ch.price != null
                  ? String(ch.price).startsWith('+')
                    ? ch.price
                    : `+${Number(ch.price).toFixed(3)}`
                  : `+${Number(ch.priceDelta ?? 0).toFixed(3)}`,
              priceDelta: ch.priceDelta ?? parseAddonPrice(ch.price),
              imageUrl: ch.imageUrl || null,
              isDefault: Boolean(ch.isDefault),
            }))
            const mapped = {
              ...saved,
              id: optionModal?.group?.id,
              name: saved.title || saved.name,
              title: saved.title || saved.name,
              tag: saved.tag || (saved.isRequired ? 'Required' : 'Optional'),
              tagTone: saved.isRequired || Number(saved.min) > 0 ? 'required' : 'optional',
              detail: saved.detail || `${choices.length} choices`,
              minSelect: Number(saved.minSelect ?? saved.min ?? 0),
              maxSelect: Number(saved.maxSelect ?? saved.max ?? 1),
              isRequired: Boolean(saved.isRequired || Number(saved.min) > 0),
              selection: saved.selection || 'single',
              choices,
            }
            if (optionModal?.mode === 'edit' && optionModal.index != null) {
              next[optionModal.index] = mapped
            } else {
              next.push(mapped)
            }
            return { ...c, optionGroups: next }
          })
          setOptionModal(null)
        }}
      />
    </>
  )
}

/**
 * Menu Settings → Menu (OG §04).
 * Stacked Categories + Items cards with class controls and full item editing.
 */
export function AdminVendorLiveMenu({ vendorId, storeName }) {
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [catalog, setCatalog] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState('create')
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(() => emptyProductForm())
  const [formError, setFormError] = useState('')
  const [formItemClassMeta, setFormItemClassMeta] = useState({
    editable: true,
    lockedBy: null,
  })
  const [categoryName, setCategoryName] = useState('')
  const [categoryBusy, setCategoryBusy] = useState(false)
  const [classBusyKey, setClassBusyKey] = useState('')
  const [renamingId, setRenamingId] = useState(null)
  const [renameValue, setRenameValue] = useState('')

  const load = useCallback(async () => {
    if (!vendorId) return
    setLoading(true)
    setError('')
    try {
      const data = await adminStoresCatalogService.getVendorCatalog(vendorId)
      setCatalog(data)
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : err?.message || 'Failed to load menu.'
      setError(message)
      setCatalog(null)
    } finally {
      setLoading(false)
    }
  }, [vendorId])

  useEffect(() => {
    load()
  }, [load])

  const categoryOptions = catalog?.categoryOptions || []
  const products = catalog?.products || []
  const flatCategories = useMemo(
    () => flattenCategories(catalog?.catalogCategories || []),
    [catalog?.catalogCategories],
  )

  const productsByCategory = useMemo(() => {
    const map = new Map()
    for (const item of products) {
      const key = item.catalogCategoryId || 'uncategorized'
      if (!map.has(key)) map.set(key, [])
      map.get(key).push(item)
    }
    return map
  }, [products])

  const uncategorized = productsByCategory.get('uncategorized') || []

  const vendorItemClasses = catalog?.vendor?.itemClasses || {
    allowsNormalItems: true,
    allowsSpecialItems: true,
  }
  const storeTypeItemClasses = catalog?.vendor?.storeType?.itemClasses || {
    allowsNormalItems: true,
    allowsSpecialItems: true,
  }
  const vendorClassEditable = hasBothItemClasses(storeTypeItemClasses)
  const vendorClassBusy = classBusyKey === 'vendor'
  const vendorBoth =
    vendorItemClasses.allowsNormalItems !== false &&
    vendorItemClasses.allowsSpecialItems !== false

  const openCreate = (categoryId = '') => {
    setModalMode('create')
    setEditingId(null)
    setForm(emptyProductForm(categoryId))
    setFormItemClassMeta({
      editable: vendorBoth,
      lockedBy: vendorBoth ? null : vendorClassEditable ? 'VENDOR' : 'STORE_TYPE',
    })
    setFormError('')
    setModalOpen(true)
  }

  const openEdit = async (product) => {
    setModalMode('edit')
    setEditingId(product.id)
    setFormError('')
    setBusy(true)
    try {
      const detail = await adminStoresCatalogService.getProduct(product.id)
      setForm({
        name: detail.name || '',
        nameAr: detail.nameAr || '',
        description: detail.description || '',
        price: detail.price != null ? String(detail.price) : '',
        catalogCategoryId: detail.catalogCategoryId || '',
        imageUrl: detail.imageUrl || '',
        isActive: detail.isActive !== false,
        isAvailable: detail.isAvailable !== false,
        availableFrom: detail.availableFrom || '',
        availableTo: detail.availableTo || '',
        itemClass: detail.effectiveItemClass || detail.itemClass || 'NORMAL',
        optionGroups: mapLoadedOptionGroups(detail.optionGroups),
        addOns: mapLoadedAddOns(detail.addons),
      })
      setFormItemClassMeta({
        editable: detail.editable === true,
        lockedBy: detail.lockedBy || null,
      })
      setModalOpen(true)
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : err?.message || 'Failed to load item.'
      showError(message)
    } finally {
      setBusy(false)
    }
  }

  const handleUploadImage = async (file) => {
    setBusy(true)
    setFormError('')
    try {
      validateAdminImageFile(file)
      const uploaded = await adminUploadService.uploadImage(file)
      setForm((prev) => ({ ...prev, imageUrl: uploaded.data.url }))
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : err?.message || 'Image upload failed.'
      setFormError(message)
    } finally {
      setBusy(false)
    }
  }

  const handleSaveProduct = async () => {
    const name = String(form.name || '').trim()
    const price = Number(form.price)
    if (!name) {
      setFormError('Name is required.')
      return
    }
    if (!Number.isFinite(price) || price < 0) {
      setFormError('Enter a valid price.')
      return
    }

    const filledAddOns = (form.addOns || [])
      .filter((a) => String(a.name || '').trim())
      .map((a, index) => ({
        ...(a.id ? { id: a.id } : {}),
        name: String(a.name).trim(),
        nameAr: String(a.nameAr || '').trim() || null,
        price: parseAddonPrice(a.price),
        imageUrl: a.imageUrl || null,
        sortOrder: index,
        isActive: true,
      }))

    const optionGroups = (form.optionGroups || []).map((g, index) => ({
      ...(g.id ? { id: g.id } : {}),
      name: g.name || g.title,
      nameAr: g.nameAr || null,
      minSelect: g.minSelect ?? (g.selection === 'single' ? 1 : 0),
      maxSelect: g.maxSelect ?? (g.selection === 'single' ? 1 : 2),
      isRequired: Boolean(g.isRequired),
      sortOrder: index,
      options: (Array.isArray(g.choices) ? g.choices : [])
        .filter((c) => String(c.name || '').trim())
        .map((c, choiceIndex) => ({
          ...(c.id ? { id: c.id } : {}),
          name: String(c.name).trim(),
          nameAr: String(c.nameAr || '').trim() || null,
          priceDelta:
            c.priceDelta != null && c.priceDelta !== ''
              ? Number(c.priceDelta) || 0
              : parseAddonPrice(c.price),
          imageUrl: c.imageUrl || null,
          isDefault: Boolean(c.isDefault),
          isAvailable: true,
          sortOrder: choiceIndex,
        })),
    }))

    const body = {
      name,
      nameAr: String(form.nameAr || '').trim() || null,
      description: String(form.description || '').trim() || null,
      price,
      catalogCategoryId: form.catalogCategoryId || null,
      imageUrl: form.imageUrl || null,
      imageUrls: form.imageUrl ? [form.imageUrl] : [],
      isActive: Boolean(form.isActive),
      isAvailable: Boolean(form.isAvailable),
      availableFrom: String(form.availableFrom || '').trim() || null,
      availableTo: String(form.availableTo || '').trim() || null,
      optionGroups,
      addons: filledAddOns,
    }
    if (formItemClassMeta.editable) {
      body.itemClass = form.itemClass === 'SPECIAL' ? 'SPECIAL' : 'NORMAL'
    }

    setBusy(true)
    setFormError('')
    try {
      if (modalMode === 'create') {
        await adminStoresCatalogService.createVendorProduct(vendorId, body)
        showSuccess('Menu item created.')
      } else {
        await adminStoresCatalogService.updateProduct(editingId, body)
        showSuccess('Menu item updated.')
      }
      setModalOpen(false)
      await load()
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : err?.message || 'Failed to save item.'
      setFormError(message)
    } finally {
      setBusy(false)
    }
  }

  const handleDeactivate = async (product) => {
    if (!window.confirm(`Deactivate “${product.name}”? It will be hidden from customers.`)) {
      return
    }
    setBusy(true)
    try {
      await adminStoresCatalogService.deleteProduct(product.id)
      showSuccess('Menu item deactivated.')
      await load()
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : err?.message || 'Failed to deactivate item.'
      showError(message)
    } finally {
      setBusy(false)
    }
  }

  const handleAddCategory = async () => {
    const name = categoryName.trim()
    if (!name) return
    setCategoryBusy(true)
    try {
      await adminStoresCatalogService.createCatalogCategory(vendorId, { name })
      setCategoryName('')
      showSuccess('Category created.')
      await load()
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : err?.message || 'Failed to create category.'
      showError(message)
    } finally {
      setCategoryBusy(false)
    }
  }

  const handleRenameCategory = async (category) => {
    const name = renameValue.trim()
    if (!name || name === category.name) {
      setRenamingId(null)
      return
    }
    setCategoryBusy(true)
    try {
      await adminStoresCatalogService.updateCatalogCategory(vendorId, category.id, { name })
      showSuccess('Category renamed.')
      setRenamingId(null)
      await load()
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : err?.message || 'Failed to rename category.'
      showError(message)
    } finally {
      setCategoryBusy(false)
    }
  }

  const handleDeleteCategory = async (category) => {
    if (!window.confirm(`Delete category “${category.name}”?`)) return
    setCategoryBusy(true)
    try {
      await adminStoresCatalogService.deleteCatalogCategory(vendorId, category.id)
      showSuccess('Category deleted.')
      await load()
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : err?.message || 'Failed to delete category.'
      showError(message)
    } finally {
      setCategoryBusy(false)
    }
  }

  const handleVendorClassToggle = async (key) => {
    if (!vendorClassEditable || vendorClassBusy) return
    const currentlyOn = Boolean(vendorItemClasses[key])
    if (currentlyOn) {
      const otherKey =
        key === 'allowsNormalItems' ? 'allowsSpecialItems' : 'allowsNormalItems'
      if (!vendorItemClasses[otherKey]) {
        showError('At least one item class must stay enabled.')
        return
      }
    }
    const next = {
      allowsNormalItems: vendorItemClasses.allowsNormalItems !== false,
      allowsSpecialItems: vendorItemClasses.allowsSpecialItems !== false,
      [key]: !currentlyOn,
    }
    setClassBusyKey('vendor')
    try {
      await adminVendorService.updateVendor(vendorId, {
        allowsNormalItems: next.allowsNormalItems,
        allowsSpecialItems: next.allowsSpecialItems,
      })
      showSuccess('Vendor item classes updated.')
      await load()
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err?.message || 'Failed to update vendor item classes.'
      showError(message)
    } finally {
      setClassBusyKey('')
    }
  }

  const handleCategoryItemClass = async (category, nextClass) => {
    if (!category?.editable || !category?.id) return
    if (category.itemClass == null && nextClass === (category.effectiveItemClass || 'NORMAL')) {
      return
    }
    if (category.itemClass === nextClass) return
    setClassBusyKey(`cat:${category.id}`)
    try {
      await adminStoresCatalogService.updateCatalogCategory(vendorId, category.id, {
        itemClass: nextClass,
      })
      await load()
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err?.message || 'Failed to update category class.'
      showError(message)
    } finally {
      setClassBusyKey('')
    }
  }

  const handleProductItemClass = async (product, nextClass) => {
    if (!product?.editable || !product?.id) return
    if ((product.itemClass || product.effectiveItemClass) === nextClass) return
    setClassBusyKey(`prod:${product.id}`)
    try {
      await adminStoresCatalogService.updateProduct(product.id, { itemClass: nextClass })
      await load()
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : err?.message || 'Failed to update item class.'
      showError(message)
    } finally {
      setClassBusyKey('')
    }
  }

  const categorySubcopy = vendorBoth
    ? 'Class can be set here because this vendor has both classes enabled.'
    : 'Class is locked by a level above — category selectors are read-only.'

  const renderItemRow = (item) => (
    <div
      key={item.id}
      className="flex flex-wrap items-center gap-3 border-b border-[#f0f2f0] px-4 py-3 last:border-0"
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt="" className="h-10 w-10 rounded-[8px] object-cover" />
        ) : (
          <div className="h-10 w-10 rounded-[8px] bg-[#f3f5f3]" />
        )}
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold text-[#17231c]">{item.name}</p>
          <p className="text-[11px] text-[#7c8780]">
            {formatPrice(item.price)}
            {item.optionGroupCount || item.addonCount
              ? ` · ${item.optionGroupCount || 0} option groups · ${item.addonCount || 0} add-ons`
              : ''}
          </p>
        </div>
      </div>
      <AdminItemClassSegment
        value={item.effectiveItemClass}
        editable={item.editable === true}
        lockedBy={item.lockedBy}
        disabled={Boolean(classBusyKey)}
        showEditableHint
        onChange={(next) => handleProductItemClass(item, next)}
      />
      <div className="flex gap-1">
        <button
          type="button"
          className="rounded-[8px] p-2 text-[#127338] hover:bg-[#eaf7ef]"
          disabled={busy}
          onClick={() => openEdit(item)}
          title="Edit item"
        >
          <Pencil size={14} />
        </button>
        <button
          type="button"
          className="rounded-[8px] p-2 text-[#d64044] hover:bg-[#fdeeee]"
          disabled={busy}
          onClick={() => handleDeactivate(item)}
          title="Deactivate"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )

  return (
    <div className="space-y-4">
      <div className={`${cardClass} px-5 py-4`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-[15px] font-bold text-[#17231c]">Menu</h3>
            <p className="mt-1 max-w-[640px] text-[12px] leading-[18px] text-[#7c8780]">
              Full ongoing control of categories, items, options, add-ons and item class
              {storeName ? ` · ${storeName}` : ''}.
            </p>
          </div>
          <button
            type="button"
            className={primaryBtn}
            disabled={busy || loading}
            onClick={() => openCreate()}
          >
            <Plus size={14} />
            Add item
          </button>
        </div>
        {error ? (
          <p className="mt-3 text-[12px] font-medium text-[#d64044]" role="alert">
            {error}
          </p>
        ) : null}
      </div>

      {!loading && catalog ? (
        <div className={`${cardClass} px-5 py-4`}>
          <h3 className="text-[15px] font-bold text-[#17231c]">Vendor item classes</h3>
          <p className="mt-1 text-[12px] text-[#7c8780]">
            {vendorClassEditable
              ? 'Store type allows both — choose which classes this vendor may carry.'
              : 'Store type has narrowed to one class — vendor and menu controls are locked.'}
          </p>
          <div className="mt-3 flex w-fit flex-col gap-2.5">
            {[
              ['allowsNormalItems', 'Normal items'],
              ['allowsSpecialItems', 'Special items'],
            ].map(([key, label]) => (
              <div
                key={key}
                className="flex items-center justify-between gap-6 rounded-[12px] bg-[#f3f5f3] px-4 py-3"
              >
                <span className="text-[13px] font-medium text-[#17231c]">{label}</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={vendorItemClasses[key] !== false}
                  disabled={!vendorClassEditable || vendorClassBusy}
                  onClick={() => handleVendorClassToggle(key)}
                  className={`relative h-[28px] w-[48px] shrink-0 rounded-full transition ${
                    vendorItemClasses[key] !== false ? 'bg-[#2E9E4D]' : 'bg-[#d5dbd7]'
                  } ${!vendorClassEditable || vendorClassBusy ? 'cursor-not-allowed opacity-55' : ''}`}
                >
                  <span
                    className={`absolute top-[3px] h-[22px] w-[22px] rounded-full bg-white shadow transition ${
                      vendorItemClasses[key] !== false ? 'left-[23px]' : 'left-[3px]'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
          {!vendorClassEditable ? (
            <div className="mt-3">
              <span className="rounded-[6px] border border-[#dfe4e0] bg-[#f0f2f1] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.03em] text-[#7c8780]">
                LOCKED BY STORE TYPE
              </span>
            </div>
          ) : null}
        </div>
      ) : null}

      {loading ? (
        <p className={`${cardClass} px-4 py-10 text-center text-[12px] text-[#7c8780]`}>
          Loading menu…
        </p>
      ) : (
        <>
          <section className={`${cardClass} overflow-hidden`}>
            <div className="border-b border-[#f0f2f0] px-5 py-4">
              <h3 className="text-[15px] font-bold text-[#17231c]">Categories</h3>
              <p className="mt-1 text-[12px] text-[#7c8780]">{categorySubcopy}</p>
            </div>
            <div>
              {flatCategories.length === 0 ? (
                <p className="px-5 py-6 text-[12px] text-[#7c8780]">
                  No categories yet. Add one below.
                </p>
              ) : (
                flatCategories.map((cat) => (
                  <div
                    key={cat.id}
                    className="flex flex-wrap items-center gap-3 border-b border-[#f0f2f0] px-5 py-3 last:border-0"
                  >
                    <div className="min-w-0 flex-1">
                      {renamingId === cat.id ? (
                        <input
                          className={inputClass}
                          value={renameValue}
                          autoFocus
                          disabled={categoryBusy}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onBlur={() => handleRenameCategory(cat)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleRenameCategory(cat)
                            if (e.key === 'Escape') setRenamingId(null)
                          }}
                        />
                      ) : (
                        <>
                          <p className="text-[13px] font-semibold text-[#17231c]">{cat.name}</p>
                          <p className="text-[11px] text-[#9aa49d]">
                            {(productsByCategory.get(cat.id) || []).length} items
                          </p>
                        </>
                      )}
                    </div>
                    <AdminItemClassSegment
                      value={cat.effectiveItemClass}
                      editable={cat.editable === true}
                      lockedBy={cat.lockedBy}
                      disabled={Boolean(classBusyKey)}
                      showEditableHint
                      onChange={(next) => handleCategoryItemClass(cat, next)}
                    />
                    <div className="flex gap-1">
                      <button
                        type="button"
                        className="rounded-[8px] p-2 text-[#127338] hover:bg-[#eaf7ef]"
                        disabled={categoryBusy}
                        title="Rename"
                        onClick={() => {
                          setRenamingId(cat.id)
                          setRenameValue(cat.name)
                        }}
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        className="rounded-[8px] p-2 text-[#d64044] hover:bg-[#fdeeee]"
                        disabled={categoryBusy}
                        title="Delete"
                        onClick={() => handleDeleteCategory(cat)}
                      >
                        <Trash2 size={14} />
                      </button>
                      <button
                        type="button"
                        className={outlineBtn}
                        disabled={busy}
                        onClick={() => openCreate(cat.id)}
                      >
                        <Plus size={14} />
                        Item
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="border-t border-[#f0f2f0] px-5 py-3">
              <label className={labelClass}>New category</label>
              <div className="flex gap-2">
                <input
                  className={inputClass}
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  placeholder="Category name"
                  disabled={categoryBusy}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddCategory()
                  }}
                />
                <button
                  type="button"
                  className={outlineBtn}
                  disabled={categoryBusy || !categoryName.trim()}
                  onClick={handleAddCategory}
                >
                  Add
                </button>
              </div>
            </div>
          </section>

          {flatCategories.map((cat) => {
            const items = productsByCategory.get(cat.id) || []
            const locked = cat.itemClass === 'NORMAL' || cat.itemClass === 'SPECIAL'
            return (
              <section key={`items-${cat.id}`} className={`${cardClass} overflow-hidden`}>
                <div className="border-b border-[#f0f2f0] px-5 py-4">
                  <h3 className="text-[15px] font-bold text-[#17231c]">Items — {cat.name}</h3>
                  <p className="mt-1 text-[12px] text-[#7c8780]">
                    {locked
                      ? `This category is locked to ${
                          cat.itemClass === 'SPECIAL' ? 'Special' : 'Normal'
                        }, so its items cannot change class.`
                      : 'This category allows both, so each item can be set individually.'}
                  </p>
                </div>
                {items.length === 0 ? (
                  <p className="px-5 py-6 text-[12px] text-[#7c8780]">No items in this category.</p>
                ) : (
                  items.map(renderItemRow)
                )}
              </section>
            )
          })}

          <section className={`${cardClass} overflow-hidden`}>
            <div className="border-b border-[#f0f2f0] px-5 py-4">
              <h3 className="text-[15px] font-bold text-[#17231c]">Items — Uncategorized</h3>
              <p className="mt-1 text-[12px] text-[#7c8780]">
                Items not assigned to a category.
              </p>
            </div>
            {uncategorized.length === 0 ? (
              <p className="px-5 py-6 text-[12px] text-[#7c8780]">No uncategorized items.</p>
            ) : (
              uncategorized.map(renderItemRow)
            )}
          </section>
        </>
      )}

      <ProductFormModal
        open={modalOpen}
        mode={modalMode}
        form={form}
        setForm={setForm}
        categoryOptions={categoryOptions}
        itemClassEditable={formItemClassMeta.editable}
        itemClassLockedBy={formItemClassMeta.lockedBy}
        busy={busy}
        error={formError}
        onClose={() => !busy && setModalOpen(false)}
        onSave={handleSaveProduct}
        onUploadImage={handleUploadImage}
      />
    </div>
  )
}
