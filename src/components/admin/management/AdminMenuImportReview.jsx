import { useCallback, useEffect, useState } from 'react'
import { Pencil, Plus, Trash2, X } from 'lucide-react'
import { Badge } from '../Badge'
import AdminConfirmDialog from '../AdminConfirmDialog'
import AdminMediaImage from '../AdminMediaImage'
import { resolveAdminMediaUrl } from '../../../mappers/admin/mapAdminUpload'
import { adminMenuImportService } from '../../../services/admin/menuImportService'
import { showError, showSuccess } from '../../../utils/toast'
import {
  canEditReview,
  formatBhd,
  messageForMenuImportError,
} from '../../../mappers/admin/mapAdminMenuImport'
import AdminEditImportItemModal from './AdminEditImportItemModal'

const cardClass =
  'rounded-[14px] border border-[#eceeec] bg-white p-5 shadow-[0_1px_2px_rgba(20,40,28,.03)]'
const primaryBtn =
  'inline-flex h-[34px] items-center justify-center gap-1.5 rounded-full bg-[#1aa054] px-4 text-[12px] font-bold text-white hover:bg-[#158a47] disabled:opacity-50'
const outlineBtn =
  'inline-flex h-[34px] items-center justify-center gap-1.5 rounded-full border border-[#dfe4e0] bg-white px-3 text-[12px] font-medium text-[#127338] hover:bg-[#f6f8f6] disabled:opacity-50'
const ghostBtn =
  'inline-flex size-8 items-center justify-center rounded-full text-[#637068] hover:bg-[#f3f5f3] disabled:opacity-50'
const inputClass =
  'box-border h-[40px] w-full rounded-[8px] border border-[rgba(0,0,0,0.1)] bg-white px-3 text-[13px] text-[#17231c] outline-none focus:border-[#1aa054]'
const arInputClass = `${inputClass} text-right`
const arCellClass = 'px-3 py-2.5 text-[12px] text-[#455249] text-right'
const arItemCellClass = 'px-3 py-2.5 text-[13px] font-semibold text-[#17231c] text-right'

export function AdminMenuImportReview({ vendorId, imp, onImportUpdate, onCancel }) {
  const editable = canEditReview(imp.status)
  const [review, setReview] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const [parityChecked, setParityChecked] = useState(imp.isPriceParityVerified)
  const [catModal, setCatModal] = useState(null)
  const [itemModal, setItemModal] = useState(null)
  const [confirmAction, setConfirmAction] = useState(null)

  const loadReview = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await adminMenuImportService.getReview(vendorId, imp.id)
      setReview(data)
      setParityChecked(data.isPriceParityVerified)
      onImportUpdate(data)
    } catch (err) {
      setError(messageForMenuImportError(err, 'Failed to load review data.'))
    } finally {
      setLoading(false)
    }
  }, [vendorId, imp.id, onImportUpdate])

  useEffect(() => {
    void loadReview()
  }, [loadReview])

  const categories = review?.categories || []
  const flatItems = categories.flatMap((cat) =>
    cat.items.map((item) => ({
      ...item,
      categoryName: cat.name,
      categoryNameAr: cat.nameAr,
      categoryId: cat.id,
    })),
  )

  const handleParity = async (checked) => {
    if (!editable || !checked) {
      if (!imp.isPriceParityVerified) setParityChecked(false)
      return
    }
    setBusy(true)
    setError(null)
    try {
      const updated = await adminMenuImportService.verifyPriceParity(vendorId, imp.id)
      setParityChecked(updated.isPriceParityVerified)
      onImportUpdate(updated)
    } catch (err) {
      setParityChecked(false)
      setError(messageForMenuImportError(err, 'Failed to verify price parity.'))
    } finally {
      setBusy(false)
    }
  }

  const handlePublish = async () => {
    if (!editable || !parityChecked) return
    setBusy(true)
    setError(null)
    try {
      const updated = await adminMenuImportService.publish(vendorId, imp.id)
      onImportUpdate(updated)
    } catch (err) {
      setError(messageForMenuImportError(err, 'Failed to publish.'))
      void loadReview()
    } finally {
      setBusy(false)
    }
  }

  const handleDeleteItem = async (itemId) => {
    if (!editable) return
    setBusy(true)
    try {
      await adminMenuImportService.deleteItem(vendorId, imp.id, itemId)
      showSuccess('Item removed.')
      await loadReview()
      setConfirmAction(null)
    } catch (err) {
      const message = messageForMenuImportError(err, 'Failed to delete item.')
      setError(message)
      showError(message)
    } finally {
      setBusy(false)
    }
  }

  const handleDeleteCategory = async (categoryId) => {
    if (!editable) return
    setBusy(true)
    try {
      await adminMenuImportService.deleteCategory(vendorId, imp.id, categoryId)
      showSuccess('Category removed.')
      await loadReview()
      setConfirmAction(null)
    } catch (err) {
      const message = messageForMenuImportError(err, 'Failed to delete category.')
      setError(message)
      showError(message)
    } finally {
      setBusy(false)
    }
  }

  const handleSaveCategory = async ({ name, nameAr }) => {
    if (!editable || !catModal) return
    setBusy(true)
    try {
      const body = { name, ...(nameAr ? { nameAr } : {}) }
      if (catModal.mode === 'create') {
        await adminMenuImportService.createCategory(vendorId, imp.id, body)
      } else {
        await adminMenuImportService.patchCategory(vendorId, imp.id, catModal.category.id, body)
      }
      setCatModal(null)
      showSuccess(catModal.mode === 'create' ? 'Category added.' : 'Category updated.')
      await loadReview()
    } catch (err) {
      setError(messageForMenuImportError(err, 'Failed to save category.'))
    } finally {
      setBusy(false)
    }
  }

  const handleSaveItem = async (data) => {
    if (!editable || !itemModal) return
    setBusy(true)
    try {
      if (itemModal.mode === 'create') {
        await adminMenuImportService.createItem(vendorId, imp.id, data)
      } else {
        await adminMenuImportService.patchItem(vendorId, imp.id, itemModal.item.id, data)
      }
      setItemModal(null)
      showSuccess(itemModal.mode === 'create' ? 'Item added.' : 'Item updated.')
      await loadReview()
    } catch (err) {
      setError(messageForMenuImportError(err, 'Failed to save item.'))
    } finally {
      setBusy(false)
    }
  }

  if (loading && !review) {
    return (
      <div className={cardClass}>
        <p className="text-[12px] text-[#7c8780]">Loading review…</p>
      </div>
    )
  }

  return (
    <>
      <div className={cardClass}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-[15px] font-bold text-[#17231c]">
              {editable ? 'Review staged catalog' : 'Import snapshot'}
            </h3>
            <p className="text-[12px] text-[#7c8780]">
              {categories.length} categories · {flatItems.length} items
              {!editable && imp.status === 'COMPLETED' ? ' · read-only' : ''}
            </p>
          </div>
          <Badge tone={imp.status === 'COMPLETED' ? 'green' : 'blue'}>{imp.status}</Badge>
        </div>

        {imp.lastErrorMessage && imp.status === 'REVIEW' ? (
          <p className="mb-4 rounded-[10px] border border-[#f2cccc] bg-[#fff5f5] px-3 py-2 text-[12.5px] text-[#a93e42]">
            {imp.lastErrorMessage}
          </p>
        ) : null}

        {error ? (
          <p className="mb-3 text-[12px] font-medium text-[#d64044]" role="alert">
            {error}
          </p>
        ) : null}

        {editable ? (
          <div className="mb-4 flex flex-wrap gap-2">
            <button
              type="button"
              className={outlineBtn}
              disabled={busy}
              onClick={() => setCatModal({ mode: 'create' })}
            >
              <Plus size={14} />
              Add category
            </button>
            {categories[0] ? (
              <button
                type="button"
                className={outlineBtn}
                disabled={busy}
                onClick={() => setItemModal({ mode: 'create', categoryId: categories[0].id })}
              >
                <Plus size={14} />
                Add item
              </button>
            ) : null}
          </div>
        ) : null}

        {categories.length ? (
          <div className="space-y-4">
            {categories.map((cat) => (
              <section
                key={cat.id}
                className="overflow-hidden rounded-[10px] border border-[#edf0ee]"
              >
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#edf0ee] bg-[#fafbfa] px-3 py-2.5">
                  <div>
                    <span className="text-[13px] font-semibold text-[#17231c]">{cat.name}</span>
                    {cat.nameAr ? (
                      <span
                        className="mt-0.5 block text-right text-[12px] text-[#7c8780]"
                        dir="rtl"
                        lang="ar"
                      >
                        {cat.nameAr}
                      </span>
                    ) : null}
                    <span className="mt-1 block text-[11px] text-[#8a948e]">
                      {(cat.items || []).length} item{(cat.items || []).length === 1 ? '' : 's'}
                    </span>
                  </div>
                  {editable ? (
                    <div className="flex gap-1">
                      <button
                        type="button"
                        className={ghostBtn}
                        onClick={() => setCatModal({ mode: 'edit', category: cat })}
                        aria-label="Rename category"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        className={ghostBtn}
                        onClick={() =>
                          setConfirmAction({
                            type: 'category',
                            id: cat.id,
                            title: 'Delete category?',
                            message: 'Delete this category and all its items? This cannot be undone.',
                          })
                        }
                        aria-label="Delete category"
                      >
                        <Trash2 size={14} />
                      </button>
                      <button
                        type="button"
                        className={outlineBtn}
                        onClick={() => setItemModal({ mode: 'create', categoryId: cat.id })}
                      >
                        <Plus size={14} />
                        Item
                      </button>
                    </div>
                  ) : null}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] border-collapse text-left">
                    <thead>
                      <tr className="border-b border-[#edf0ee]">
                        {[
                          'Item (EN)',
                          'Item (AR)',
                          'Image',
                          'Price (BHD)',
                          'Description (EN)',
                          'Description (AR)',
                          editable ? '' : null,
                        ]
                          .filter((col) => col !== null)
                          .map((col) => (
                            <th
                              key={col || 'actions'}
                              className="whitespace-nowrap px-3 py-2 text-[10px] font-medium uppercase tracking-[0.05em] text-[#8a948e]"
                            >
                              {col}
                            </th>
                          ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(cat.items || []).length ? (
                        cat.items.map((row) => (
                          <tr key={row.id} className="border-b border-[#f3f5f3] last:border-b-0">
                            <td className="px-3 py-2.5 text-[13px] font-semibold text-[#17231c]">
                              {row.name}
                            </td>
                            <td className={arItemCellClass} dir="rtl" lang="ar">
                              {row.nameAr || '—'}
                            </td>
                            <td className="px-3 py-2.5">
                              {row.imageUrl ? (
                                <AdminMediaImage
                                  src={resolveAdminMediaUrl(row.imageUrl) || row.imageUrl}
                                  alt={row.name}
                                  className="size-10 rounded-[8px] border border-[#edf0ee] object-cover"
                                />
                              ) : (
                                <span className="text-[11px] text-[#b0b8b3]">No image</span>
                              )}
                            </td>
                            <td className="whitespace-nowrap px-3 py-2.5 text-[12px]">
                              {formatBhd(row.price)}
                            </td>
                            <td className="max-w-[200px] px-3 py-2.5 text-[12px] text-[#7c8780]">
                              <span className="line-clamp-2">{row.description || '—'}</span>
                            </td>
                            <td className={`max-w-[200px] ${arCellClass}`} dir="rtl" lang="ar">
                              <span className="line-clamp-2">{row.descriptionAr || '—'}</span>
                            </td>
                            {editable ? (
                              <td className="px-3 py-2.5">
                                <div className="flex gap-1">
                                  <button
                                    type="button"
                                    className={ghostBtn}
                                    onClick={() =>
                                      setItemModal({
                                        mode: 'edit',
                                        categoryId: cat.id,
                                        item: row,
                                      })
                                    }
                                    aria-label="Edit item"
                                  >
                                    <Pencil size={14} />
                                  </button>
                                  <button
                                    type="button"
                                    className={ghostBtn}
                                    onClick={() =>
                                      setConfirmAction({
                                        type: 'item',
                                        id: row.id,
                                        title: 'Delete item?',
                                        message: 'Remove this item from the staged menu?',
                                      })
                                    }
                                    aria-label="Delete item"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </td>
                            ) : null}
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={editable ? 7 : 6}
                            className="px-3 py-5 text-center text-[12px] text-[#7c8780]"
                          >
                            No items in this category
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            ))}
          </div>
        ) : (
          <p className="rounded-[10px] border border-[#edf0ee] px-3 py-6 text-center text-[12px] text-[#7c8780]">
            No categories staged
          </p>
        )}

        {editable ? (
          <div className="mt-5 border-t border-[#edf0ee] pt-4">
            <label className="flex items-start gap-2 text-[13px] text-[#17231c]">
              <input
                type="checkbox"
                className="mt-0.5"
                checked={parityChecked}
                disabled={busy}
                onChange={(e) => void handleParity(e.target.checked)}
              />
              I confirm staged prices match the source menu
            </label>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                className={primaryBtn}
                disabled={!parityChecked || busy}
                onClick={() => void handlePublish()}
              >
                {busy ? 'Publishing…' : 'Publish to Core'}
              </button>
              {typeof onCancel === 'function' ? (
                <button
                  type="button"
                  className={outlineBtn}
                  disabled={busy}
                  onClick={() => void onCancel()}
                >
                  Cancel import
                </button>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>

      <SimpleModal
        open={Boolean(catModal)}
        title={catModal?.mode === 'edit' ? 'Edit category' : 'Add category'}
        onClose={() => setCatModal(null)}
      >
        <CategoryForm
          initialName={catModal?.category?.name || ''}
          initialNameAr={catModal?.category?.nameAr || ''}
          busy={busy}
          onCancel={() => setCatModal(null)}
          onSave={handleSaveCategory}
        />
      </SimpleModal>

      <AdminEditImportItemModal
        open={Boolean(itemModal)}
        mode={itemModal?.mode || 'create'}
        categories={categories}
        initialCategoryId={itemModal?.categoryId}
        item={itemModal?.item}
        busy={busy}
        onClose={() => setItemModal(null)}
        onSave={(data) => void handleSaveItem(data)}
      />

      <AdminConfirmDialog
        open={Boolean(confirmAction)}
        title={confirmAction?.title || 'Confirm'}
        message={confirmAction?.message || ''}
        confirmLabel="Delete"
        busy={busy}
        onCancel={() => setConfirmAction(null)}
        onConfirm={() => {
          if (confirmAction?.type === 'category') {
            void handleDeleteCategory(confirmAction.id)
          } else if (confirmAction?.type === 'item') {
            void handleDeleteItem(confirmAction.id)
          }
        }}
      />
    </>
  )
}

function SimpleModal({ open, title, onClose, children }) {
  useEffect(() => {
    if (!open) return undefined
    function onKeyDown(e) {
      if (e.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-[440px] rounded-[14px] bg-white p-5 shadow-[0_12px_40px_rgba(20,40,28,.18)]">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-[15px] font-bold text-[#17231c]">{title}</h3>
          <button type="button" className={ghostBtn} onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

function CategoryForm({ initialName, initialNameAr, busy, onCancel, onSave }) {
  const [name, setName] = useState(initialName)
  const [nameAr, setNameAr] = useState(initialNameAr)
  useEffect(() => {
    setName(initialName)
    setNameAr(initialNameAr)
  }, [initialName, initialNameAr])

  return (
    <div>
      <label className="mb-1.5 block text-[12px] font-medium text-[#7c8780]">Category name (English)</label>
      <input
        className={inputClass}
        value={name}
        autoFocus
        onChange={(e) => setName(e.target.value)}
      />
      <label className="mb-1.5 mt-3 block text-[12px] font-medium text-[#7c8780]">Category name (Arabic)</label>
      <input
        className={arInputClass}
        value={nameAr}
        dir="rtl"
        lang="ar"
        onChange={(e) => setNameAr(e.target.value)}
      />
      <div className="mt-4 flex justify-end gap-2">
        <button type="button" className={outlineBtn} onClick={onCancel}>
          Cancel
        </button>
        <button
          type="button"
          className={primaryBtn}
          disabled={busy || !name.trim()}
          onClick={() => onSave({ name: name.trim(), nameAr: nameAr.trim() || undefined })}
        >
          Save
        </button>
      </div>
    </div>
  )
}
