import { Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useApiResource } from '../../hooks/useApiResource'
import { adminService } from '../../services/adminService'
import { ApiErrorBanner, TableBodySkeleton } from './ApiState'
import { Badge } from './Badge'
import { cn } from './cn'

function emptyForm() {
  return {
    code: '',
    nameEn: '',
    nameAr: '',
    sortOrder: '',
    isActive: true,
  }
}

export default function AdminPromoCategoriesPanel() {
  const { data, error, isLoading, refetch } = useApiResource(
    () => adminService.listAdminMarketingPromoCategories(),
    [],
  )
  const items = useMemo(
    () => (Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : []),
    [data],
  )

  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState(null)
  const [busyId, setBusyId] = useState(null)

  function openCreate() {
    setEditingId(null)
    setForm(emptyForm())
    setFormError(null)
    setModalOpen(true)
  }

  function openEdit(row) {
    setEditingId(row.id)
    setForm({
      code: row.code || '',
      nameEn: row.nameEn || '',
      nameAr: row.nameAr || '',
      sortOrder: row.sortOrder != null ? String(row.sortOrder) : '',
      isActive: row.isActive !== false,
    })
    setFormError(null)
    setModalOpen(true)
  }

  async function onSave() {
    setSaving(true)
    setFormError(null)
    try {
      if (editingId) {
        await adminService.updateAdminMarketingPromoCategory(editingId, {
          nameEn: form.nameEn.trim(),
          nameAr: form.nameAr.trim(),
          sortOrder: form.sortOrder ? Number(form.sortOrder) : undefined,
          isActive: form.isActive,
        })
      } else {
        await adminService.createAdminMarketingPromoCategory({
          code: form.code.trim(),
          nameEn: form.nameEn.trim(),
          nameAr: form.nameAr.trim(),
          sortOrder: form.sortOrder ? Number(form.sortOrder) : undefined,
          isActive: form.isActive,
        })
      }
      setModalOpen(false)
      await refetch()
    } catch (err) {
      setFormError(err?.message || 'Could not save category')
    } finally {
      setSaving(false)
    }
  }

  async function onToggle(row) {
    setBusyId(row.id)
    try {
      if (row.isActive) {
        await adminService.retireAdminMarketingPromoCategory(row.id)
      } else {
        await adminService.restoreAdminMarketingPromoCategory(row.id)
      }
      await refetch()
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-[15px] font-bold text-[#17231c]">Promo categories</h3>
          <p className="mt-0.5 text-[12.5px] text-[#7c8780]">
            Vendors select from this list when creating a promotion. They never type a category.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex h-[34px] items-center gap-1.5 rounded-full bg-[#1aa054] px-4 text-[12px] font-bold text-white hover:bg-[#158a47]"
        >
          <Plus size={14} strokeWidth={2.2} />
          Add category
        </button>
      </div>

      {error ? <ApiErrorBanner error={error} onRetry={refetch} className="mb-3" /> : null}

      <div className="overflow-x-auto rounded-[14px] border border-[#eceeec] bg-white">
        <table className="w-full min-w-[720px] border-collapse text-left text-[12.5px]">
          <thead>
            <tr className="border-b border-[#eceeec] bg-[#f6f8f6] text-[10px] font-bold uppercase tracking-[0.08em] text-[#7a8a80]">
              <th className="px-3 py-2.5">Code</th>
              <th className="px-3 py-2.5">Name (EN)</th>
              <th className="px-3 py-2.5">Name (AR)</th>
              <th className="px-3 py-2.5">Status</th>
              <th className="px-3 py-2.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && !items.length ? (
              <TableBodySkeleton columns={5} rows={6} />
            ) : items.length ? (
              items.map((row) => (
                <tr
                  key={row.id}
                  className={cn(
                    'border-b border-[#f0f2f0] last:border-0',
                    !row.isActive && 'opacity-55',
                  )}
                >
                  <td className="px-3 py-2.5">
                    <code className="rounded bg-[#f2f5f3] px-1.5 py-0.5 font-mono text-[11.5px] text-[#114225]">
                      {row.code}
                    </code>
                  </td>
                  <td className="px-3 py-2.5 text-[#17231c]">{row.nameEn}</td>
                  <td className="px-3 py-2.5 text-[#17231c]" dir="rtl">
                    {row.nameAr}
                  </td>
                  <td className="px-3 py-2.5">
                    <Badge tone={row.isActive ? 'green' : 'gray'}>
                      {row.isActive ? 'Active' : 'Retired'}
                    </Badge>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        className="text-[12px] font-semibold text-[#1aa054] hover:underline"
                        onClick={() => openEdit(row)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        disabled={busyId === row.id}
                        className={cn(
                          'text-[12px] font-semibold hover:underline disabled:opacity-50',
                          row.isActive ? 'text-[#8C3A2B]' : 'text-[#1aa054]',
                        )}
                        onClick={() => onToggle(row)}
                      >
                        {row.isActive ? 'Retire' : 'Restore'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-3 py-10 text-center text-[#7c8780]">
                  No promo categories yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 rounded-[10px] border-l-[3px] border-[#CAA34D] bg-[#FFF8E1] px-4 py-3 text-[13px] text-[#5c5340]">
        <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#8a6d20]">
          Retire, never delete
        </p>
        <p>
          Retiring hides the category from the vendor dropdown while historical promotions keep
          their reference. There is no delete action by design.
        </p>
      </div>

      {modalOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-[rgba(10,25,16,.42)] p-5">
          <div className="w-full max-w-[430px] overflow-hidden rounded-[10px] bg-white shadow-[0_18px_50px_rgba(0,0,0,.3)]">
            <div className="border-b border-[#e4e7e5] px-[21px] pb-3.5 pt-[17px]">
              <h4 className="m-0 text-[15.5px] font-bold text-[#101a14]">
                {editingId ? 'Edit promo category' : 'Add promo category'}
              </h4>
              <p className="m-0 text-[12px] text-[#6b7a71]">
                Appears in the vendor promotion form once active
              </p>
            </div>

            <div className="px-[21px] py-[18px]">
              <div className="mb-[15px]">
                <label className="mb-[5px] block text-[10px] font-bold uppercase tracking-[0.11em] text-[#d97706]">
                  Code
                </label>
                <input
                  className="box-border w-full rounded-[6px] border border-[#cfd6d1] bg-white px-[11px] py-2 text-[13px] text-[#101a14] outline-none focus:border-[#1a8043] disabled:bg-[#f4f6f4] disabled:text-[#8a978f]"
                  value={form.code}
                  disabled={Boolean(editingId)}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                  placeholder="GRAND_PRIX"
                />
                <p className="mt-[5px] text-[11px] text-[#6b7a71]">
                  {editingId
                    ? 'Permanent — historical promotions reference this code.'
                    : 'Uppercase, no spaces. Permanent once saved — it is what historical promotions reference.'}
                </p>
              </div>

              <div className="mb-[15px] grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-[5px] block text-[10px] font-bold uppercase tracking-[0.11em] text-[#d97706]">
                    Name — English
                  </label>
                  <input
                    className="box-border w-full rounded-[6px] border border-[#cfd6d1] bg-white px-[11px] py-2 text-[13px] text-[#101a14] outline-none focus:border-[#1a8043]"
                    value={form.nameEn}
                    onChange={(e) => setForm((f) => ({ ...f, nameEn: e.target.value }))}
                    placeholder="Grand Prix Weekend"
                  />
                </div>
                <div>
                  <label className="mb-[5px] block text-[10px] font-bold uppercase tracking-[0.11em] text-[#d97706]">
                    Name — Arabic
                  </label>
                  <input
                    dir="rtl"
                    className="box-border w-full rounded-[6px] border border-[#cfd6d1] bg-white px-[11px] py-2 text-[13px] text-[#101a14] outline-none focus:border-[#1a8043]"
                    value={form.nameAr}
                    onChange={(e) => setForm((f) => ({ ...f, nameAr: e.target.value }))}
                    placeholder="عطلة الجائزة الكبرى"
                  />
                </div>
              </div>

              <div className="mb-[15px]">
                <label className="mb-[5px] block text-[10px] font-bold uppercase tracking-[0.11em] text-[#d97706]">
                  Sort order
                </label>
                <input
                  className="box-border w-full rounded-[6px] border border-[#cfd6d1] bg-white px-[11px] py-2 text-[13px] text-[#101a14] outline-none focus:border-[#1a8043]"
                  value={form.sortOrder}
                  onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
                  placeholder="15"
                />
                <p className="mt-[5px] text-[11px] text-[#6b7a71]">
                  Controls position in the vendor dropdown.
                </p>
              </div>

              <div className="mb-0">
                <label className="mb-[5px] block text-[10px] font-bold uppercase tracking-[0.11em] text-[#d97706]">
                  Status
                </label>
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={form.isActive}
                    aria-label="Active status"
                    onClick={() => setForm((f) => ({ ...f, isActive: !f.isActive }))}
                    className={cn(
                      'relative h-5 w-9 shrink-0 rounded-[11px] transition-colors',
                      form.isActive ? 'bg-[#1a8043]' : 'bg-[#c8d1cb]',
                    )}
                  >
                    <span
                      className={cn(
                        'absolute top-0.5 size-4 rounded-full bg-white transition-[left]',
                        form.isActive ? 'left-[18px]' : 'left-0.5',
                      )}
                    />
                  </button>
                  <span className="text-[13px] text-[#101a14]">
                    {form.isActive
                      ? 'Active — shown to vendors'
                      : 'Retired — hidden from vendors'}
                  </span>
                </div>
              </div>

              {formError ? (
                <p className="mt-3 text-[12.5px] text-[#bf3c36]">{formError}</p>
              ) : null}
            </div>

            <div className="flex justify-end gap-2 border-t border-[#e4e7e5] bg-[#fafbfa] px-[21px] py-[13px]">
              <button
                type="button"
                className="inline-flex items-center rounded-[17px] border border-[#cfd6d1] bg-white px-[17px] py-2 text-[12.5px] font-semibold text-[#4a5b50] hover:border-[#1a8043] hover:text-[#146334]"
                onClick={() => setModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                className="inline-flex items-center rounded-[17px] border-0 bg-[#1a8043] px-[17px] py-2 text-[12.5px] font-semibold text-white hover:bg-[#146334] disabled:opacity-60"
                onClick={onSave}
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
