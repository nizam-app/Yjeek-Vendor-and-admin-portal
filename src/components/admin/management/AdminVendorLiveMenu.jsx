import { useCallback, useEffect, useMemo, useState } from 'react'
import { Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { ApiError } from '../../../api/errors'
import { adminStoresCatalogService } from '../../../services/admin/storesCatalogService'
import { adminUploadService, validateAdminImageFile } from '../../../services/admin/uploadService'
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

function formatPrice(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return '—'
  return `${n.toFixed(3)} BHD`
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
  }
}

function ProductFormModal({
  open,
  mode,
  form,
  setForm,
  categoryOptions,
  busy,
  error,
  onClose,
  onSave,
  onUploadImage,
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/35 p-4">
      <div className="max-h-[90vh] w-full max-w-[520px] overflow-y-auto rounded-[16px] bg-white p-5 shadow-xl">
        <h3 className="text-[15px] font-bold text-[#17231c]">
          {mode === 'create' ? 'Add menu item' : 'Edit menu item'}
        </h3>
        <p className="mt-1 text-[12px] text-[#7c8780]">
          Changes apply to the live vendor catalog.
        </p>

        {error ? (
          <p className="mt-3 text-[12px] font-medium text-[#d64044]" role="alert">
            {error}
          </p>
        ) : null}

        <div className="mt-4 grid gap-3">
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
                onChange={(e) => setForm((prev) => ({ ...prev, availableTo: e.target.value }))}
                disabled={busy}
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>Image</label>
            <div className="flex items-center gap-3">
              {form.imageUrl ? (
                <img
                  src={form.imageUrl}
                  alt=""
                  className="h-14 w-14 rounded-[10px] object-cover border border-[#eceeec]"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-[10px] border border-dashed border-[#dfe4e0] text-[10px] text-[#9aa49d]">
                  None
                </div>
              )}
              <label className={`${outlineBtn} cursor-pointer`}>
                Upload
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  disabled={busy}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    e.target.value = ''
                    if (file) onUploadImage(file)
                  }}
                />
              </label>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 pt-1">
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
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" className={outlineBtn} disabled={busy} onClick={onClose}>
            Cancel
          </button>
          <button type="button" className={primaryBtn} disabled={busy} onClick={onSave}>
            {busy ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * Live vendor menu editor (Menu Settings → Menu).
 */
export function AdminVendorLiveMenu({ vendorId, storeName }) {
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [catalog, setCatalog] = useState(null)
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [query, setQuery] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState('create')
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(() => emptyProductForm())
  const [formError, setFormError] = useState('')
  const [categoryName, setCategoryName] = useState('')
  const [categoryBusy, setCategoryBusy] = useState(false)

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

  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase()
    return products.filter((item) => {
      if (categoryFilter === 'uncategorized' && item.catalogCategoryId) return false
      if (
        categoryFilter !== 'all' &&
        categoryFilter !== 'uncategorized' &&
        item.catalogCategoryId !== categoryFilter
      ) {
        return false
      }
      if (!q) return true
      return (
        item.name.toLowerCase().includes(q) ||
        String(item.nameAr || '')
          .toLowerCase()
          .includes(q)
      )
    })
  }, [products, categoryFilter, query])

  const openCreate = () => {
    setModalMode('create')
    setEditingId(null)
    setForm(
      emptyProductForm(
        categoryFilter !== 'all' && categoryFilter !== 'uncategorized' ? categoryFilter : '',
      ),
    )
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

  const handleToggle = async (product, field) => {
    setBusy(true)
    try {
      await adminStoresCatalogService.updateProduct(product.id, {
        [field]: !product[field],
      })
      await load()
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : err?.message || 'Failed to update item.'
      showError(message)
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

  const handleDeleteCategory = async (category) => {
    if (!window.confirm(`Delete category “${category.name}”?`)) return
    setCategoryBusy(true)
    try {
      await adminStoresCatalogService.deleteCatalogCategory(vendorId, category.id)
      if (categoryFilter === category.id) setCategoryFilter('all')
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

  return (
    <div className="space-y-4">
      <div className={`${cardClass} px-5 py-4`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-[15px] font-bold text-[#17231c]">Live menu</h3>
            <p className="mt-1 max-w-[560px] text-[12px] leading-[18px] text-[#7c8780]">
              Full control of categories and items for this vendor
              {storeName ? ` · ${storeName}` : ''}.
            </p>
          </div>
          <button type="button" className={primaryBtn} disabled={busy || loading} onClick={openCreate}>
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

      <div className="grid grid-cols-[240px_minmax(0,1fr)] gap-4 max-[900px]:grid-cols-1">
        <aside className={`${cardClass} p-4`}>
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.04em] text-[#7c8780]">
            Categories
          </p>
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => setCategoryFilter('all')}
              className={`flex w-full items-center justify-between rounded-[8px] px-2.5 py-2 text-left text-[12.5px] ${
                categoryFilter === 'all'
                  ? 'bg-[#eaf7ef] font-semibold text-[#127338]'
                  : 'text-[#455249] hover:bg-[#f6f8f6]'
              }`}
            >
              <span>All items</span>
              <span className="text-[11px] text-[#9aa49d]">{products.length}</span>
            </button>
            <button
              type="button"
              onClick={() => setCategoryFilter('uncategorized')}
              className={`flex w-full items-center justify-between rounded-[8px] px-2.5 py-2 text-left text-[12.5px] ${
                categoryFilter === 'uncategorized'
                  ? 'bg-[#eaf7ef] font-semibold text-[#127338]'
                  : 'text-[#455249] hover:bg-[#f6f8f6]'
              }`}
            >
              <span>Uncategorized</span>
            </button>
            {(catalog?.catalogCategories || []).map((cat) => (
              <div key={cat.id} className="group">
                <div
                  className={`flex w-full items-center gap-1 rounded-[8px] px-2.5 py-2 ${
                    categoryFilter === cat.id ? 'bg-[#eaf7ef]' : 'hover:bg-[#f6f8f6]'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setCategoryFilter(cat.id)}
                    className={`min-w-0 flex-1 text-left text-[12.5px] ${
                      categoryFilter === cat.id
                        ? 'font-semibold text-[#127338]'
                        : 'text-[#455249]'
                    }`}
                  >
                    <span className="block truncate">{cat.name}</span>
                    <span className="text-[10px] text-[#9aa49d]">{cat.productCount} items</span>
                  </button>
                  <button
                    type="button"
                    title="Delete category"
                    className="rounded p-1 text-[#9aa49d] opacity-0 hover:bg-white hover:text-[#d64044] group-hover:opacity-100"
                    disabled={categoryBusy}
                    onClick={() => handleDeleteCategory(cat)}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
                {(cat.children || []).map((child) => (
                  <button
                    key={child.id}
                    type="button"
                    onClick={() => setCategoryFilter(child.id)}
                    className={`ml-3 flex w-[calc(100%-0.75rem)] items-center justify-between rounded-[8px] px-2.5 py-1.5 text-left text-[12px] ${
                      categoryFilter === child.id
                        ? 'bg-[#eaf7ef] font-semibold text-[#127338]'
                        : 'text-[#69756d] hover:bg-[#f6f8f6]'
                    }`}
                  >
                    <span className="truncate">{child.name}</span>
                  </button>
                ))}
              </div>
            ))}
          </div>

          <div className="mt-4 border-t border-[#f0f2f0] pt-3">
            <label className={labelClass}>New category</label>
            <div className="flex gap-2">
              <input
                className={inputClass}
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                placeholder="Category name"
                disabled={categoryBusy}
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
        </aside>

        <section className={`${cardClass} overflow-hidden`}>
          <div className="flex flex-wrap items-center gap-2 border-b border-[#f0f2f0] px-4 py-3">
            <div className="relative min-w-[200px] flex-1">
              <Search
                size={14}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9aa49d]"
              />
              <input
                className={`${inputClass} pl-8`}
                placeholder="Search items…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <button type="button" className={outlineBtn} disabled={loading} onClick={load}>
              Refresh
            </button>
          </div>

          {loading ? (
            <p className="px-4 py-10 text-center text-[12px] text-[#7c8780]">Loading menu…</p>
          ) : filteredProducts.length === 0 ? (
            <p className="px-4 py-10 text-center text-[12px] text-[#7c8780]">
              No menu items in this view. Add an item or import a menu.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left">
                <thead>
                  <tr className="border-b border-[#f0f2f0] text-[11px] font-bold uppercase tracking-[0.04em] text-[#9aa49d]">
                    <th className="px-4 py-2.5 font-bold">Item</th>
                    <th className="px-4 py-2.5 font-bold">Category</th>
                    <th className="px-4 py-2.5 font-bold">Price</th>
                    <th className="px-4 py-2.5 font-bold">Status</th>
                    <th className="px-4 py-2.5 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((item) => (
                    <tr key={item.id} className="border-b border-[#f5f6f5] last:border-0">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt=""
                              className="h-10 w-10 rounded-[8px] object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-[8px] bg-[#f3f5f3]" />
                          )}
                          <div className="min-w-0">
                            <p className="truncate text-[13px] font-semibold text-[#17231c]">
                              {item.name}
                            </p>
                            {item.nameAr ? (
                              <p className="truncate text-[11px] text-[#7c8780]" dir="rtl">
                                {item.nameAr}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[12px] text-[#69756d]">
                        {item.catalogCategoryName || '—'}
                      </td>
                      <td className="px-4 py-3 text-[12.5px] font-medium text-[#17231c]">
                        {formatPrice(item.price)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <button
                            type="button"
                            className={`w-fit rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                              item.isActive
                                ? 'bg-[#eaf7ef] text-[#127338]'
                                : 'bg-[#f3f4f3] text-[#7c8780]'
                            }`}
                            disabled={busy}
                            onClick={() => handleToggle(item, 'isActive')}
                          >
                            {item.isActive ? 'Active' : 'Inactive'}
                          </button>
                          <button
                            type="button"
                            className={`w-fit rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                              item.isAvailable
                                ? 'bg-[#eef3ff] text-[#3b5bdb]'
                                : 'bg-[#f3f4f3] text-[#7c8780]'
                            }`}
                            disabled={busy}
                            onClick={() => handleToggle(item, 'isAvailable')}
                          >
                            {item.isAvailable ? 'Available' : 'Unavailable'}
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            className="rounded-[8px] p-2 text-[#127338] hover:bg-[#eaf7ef]"
                            disabled={busy}
                            onClick={() => openEdit(item)}
                            title="Edit"
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
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <ProductFormModal
        open={modalOpen}
        mode={modalMode}
        form={form}
        setForm={setForm}
        categoryOptions={categoryOptions}
        busy={busy}
        error={formError}
        onClose={() => !busy && setModalOpen(false)}
        onSave={handleSaveProduct}
        onUploadImage={handleUploadImage}
      />
    </div>
  )
}
