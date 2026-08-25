import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { useApiResource } from '../../../hooks/useApiResource'
import { useAdminFormNavigationGuard } from '../../../hooks/useAdminFormNavigationGuard'
import { apiConfig, isAdminRealApiFeature } from '../../../api/config'
import { formatApiErrorMessage } from '../../../api/errors'
import { mapAdminSupplierDetailToForm } from '../../../mappers/admin/mapAdminFleet'
import { adminService } from '../../../services/adminService'
import { ApiState } from '../../../components/admin/ApiState'
import { AdminLeaveFormModal } from '../../../components/admin/AdminLeaveFormModal'
import { cn } from '../../../components/admin/cn'

const labelClass = 'mb-1.5 block text-[12px] font-medium text-[#7c8780]'
const inputClass =
  'box-border h-[40px] w-full rounded-[8px] border border-[rgba(0,0,0,0.1)] bg-white px-3 text-[13px] text-[#17231c] outline-none transition placeholder:text-[#9aa49d] focus:border-[#1aa054]'

const EMPTY_FORM = {
  name: '',
  type: '3PL',
  contactPerson: '',
  phone: '',
  email: '',
  city: 'Manama',
  commissionPct: '12',
}

function serializeSupplierForm(form) {
  return JSON.stringify(form)
}

function Field({ label, children, className }) {
  return (
    <label className={cn('block min-w-0', className)}>
      <span className={labelClass}>{label}</span>
      {children}
    </label>
  )
}

function Card({ title, children }) {
  return (
    <section className="rounded-[14px] border border-[#eceeec] bg-white p-5 shadow-[0_1px_2px_rgba(20,40,28,.03)] max-[700px]:p-4">
      {title ? <h3 className="mb-4 text-[15px] font-bold text-[#17231c]">{title}</h3> : null}
      {children}
    </section>
  )
}

export default function AdminAddSupplierPage() {
  const navigate = useNavigate()
  const { supplierId } = useParams()
  const isEdit = Boolean(supplierId)
  const useRealFleet = isAdminRealApiFeature('fleet') || !apiConfig.adminUseMockApi

  const [form, setForm] = useState(EMPTY_FORM)
  const [editBaseline, setEditBaseline] = useState(null)
  const [bootstrapped, setBootstrapped] = useState(!isEdit)
  const [saving, setSaving] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const createBaseline = useMemo(() => serializeSupplierForm(EMPTY_FORM), [])
  const isDirty = isEdit
    ? editBaseline != null && serializeSupplierForm(form) !== editBaseline
    : serializeSupplierForm(form) !== createBaseline

  const {
    allowLeave,
    requestLeave,
    leaveModalOpen,
    handleStayEditing,
    handleLeaveWithoutSaving,
  } = useAdminFormNavigationGuard({
    isDirty,
    enabled: bootstrapped,
  })

  const goBack = () => {
    if (isEdit) {
      navigate(`/admin/fleet/suppliers/${encodeURIComponent(supplierId)}`)
      return
    }
    navigate('/admin/fleet/suppliers')
  }

  const handleBack = () => requestLeave(goBack)

  const { data: detail, error: loadError, isLoading: loadLoading, refetch } = useApiResource(
    () => {
      if (!isEdit) return Promise.resolve({ data: null })
      if (!useRealFleet) {
        return Promise.resolve({
          data: {
            name: 'SpeedX Logistics',
            type: '3PL',
            zone: 'Manama',
            contactPerson: 'Ahmed Ali',
            phone: '+973 3300 1122',
            email: 'ops@speedx.com',
            commissionPct: 12,
          },
        })
      }
      return adminService.getAdminFleetSupplier(supplierId)
    },
    [isEdit, supplierId, useRealFleet],
  )

  useEffect(() => {
    if (!isEdit) {
      setForm(EMPTY_FORM)
      setEditBaseline(null)
      setBootstrapped(true)
      return
    }
    if (!detail) return
    const mapped = mapAdminSupplierDetailToForm(detail)
    setForm(mapped)
    setEditBaseline(serializeSupplierForm(mapped))
    setBootstrapped(true)
  }, [isEdit, detail])

  const update = (key) => (event) => {
    setForm((prev) => ({ ...prev, [key]: event.target.value }))
  }

  async function handleSubmit() {
    setSubmitError('')

    if (!useRealFleet) {
      goBack()
      return
    }

    setSaving(true)
    try {
      if (isEdit) {
        await adminService.updateAdminFleetSupplier(supplierId, form)
        allowLeave()
        navigate(`/admin/fleet/suppliers/${encodeURIComponent(supplierId)}`)
        return
      }

      const result = await adminService.createAdminFleetSupplier(form)
      const id = result?.data?.id
      allowLeave()
      navigate(id ? `/admin/fleet/suppliers/${encodeURIComponent(id)}` : '/admin/fleet/suppliers')
    } catch (err) {
      setSubmitError(
        formatApiErrorMessage(err, isEdit ? 'Failed to update supplier.' : 'Failed to create supplier.'),
      )
    } finally {
      setSaving(false)
    }
  }

  if (isEdit && !bootstrapped) {
    return <ApiState isLoading={loadLoading} error={loadError} onRetry={refetch} />
  }

  return (
    <div className="px-5 pb-10 pt-4 max-[700px]:px-3">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex h-[34px] shrink-0 items-center gap-1 rounded-full border border-[#e4e8e4] bg-white px-3 text-[13px] font-medium text-[#455249] shadow-[0_1px_2px_rgba(20,40,28,.04)] hover:bg-[#f6f8f6]"
          >
            <ChevronLeft size={15} strokeWidth={2.2} />
            Suppliers
          </button>
          <h2 className="text-[20px] font-bold tracking-[-0.02em] text-[#17231c]">
            {isEdit ? 'Edit supplier' : 'Add supplier'}
          </h2>
        </div>
        <button
          type="button"
          disabled={saving}
          onClick={handleSubmit}
          className="inline-flex h-[34px] items-center rounded-full bg-[#1aa054] px-4 text-[12px] font-bold text-white shadow-[0_1px_2px_rgba(20,40,28,.15)] hover:bg-[#158a47] disabled:opacity-60"
        >
          {saving ? (isEdit ? 'Saving…' : 'Creating…') : isEdit ? 'Save changes' : 'Create supplier'}
        </button>
      </div>

      {submitError ? (
        <div className="mb-4 rounded-[12px] border border-[#f0c9c6] bg-[#fff5f4] px-4 py-3 text-[13px] text-[#b42318]">
          {submitError}
        </div>
      ) : null}

      <div className="space-y-4">
        <Card title="Supplier info">
          <div className="space-y-3">
            <Field label="Supplier name">
              <input
                className={inputClass}
                value={form.name}
                onChange={update('name')}
                placeholder="e.g. SpeedX Logistics"
              />
            </Field>
            <div>
              <span className={labelClass}>Type</span>
              <div className="inline-flex items-center gap-1 rounded-[12px] bg-[#f3f5f3] p-1.5">
                {['In-house', '3PL'].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, type }))}
                    className={cn(
                      'inline-flex h-[36px] min-w-[100px] items-center justify-center rounded-[10px] px-4 text-[13px] font-bold transition',
                      form.type === type
                        ? 'bg-white text-[#17231c] shadow-[0_1px_3px_rgba(20,40,28,.12)]'
                        : 'text-[#69756d] hover:text-[#455249]',
                    )}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 max-[700px]:grid-cols-1">
              <Field label="City">
                <input
                  className={inputClass}
                  value={form.city}
                  onChange={update('city')}
                  placeholder="e.g. Manama"
                />
              </Field>
              <Field label="Commission %">
                <input
                  className={inputClass}
                  value={form.commissionPct}
                  onChange={update('commissionPct')}
                  placeholder="e.g. 12"
                  inputMode="decimal"
                />
              </Field>
            </div>
          </div>
        </Card>

        <Card title="Contact">
          <div className="grid grid-cols-2 gap-3 max-[700px]:grid-cols-1">
            <Field label="Contact person">
              <input
                className={inputClass}
                value={form.contactPerson}
                onChange={update('contactPerson')}
                placeholder="e.g. Ahmed Ali"
              />
            </Field>
            <Field label="Phone">
              <input
                className={inputClass}
                value={form.phone}
                onChange={update('phone')}
                placeholder="+973 3xxx xxxx"
              />
            </Field>
          </div>
          <div className="mt-3">
            <Field label="Email">
              <input
                className={inputClass}
                type="email"
                value={form.email}
                onChange={update('email')}
                placeholder="ops@speedx.com"
              />
            </Field>
          </div>
        </Card>
      </div>

      <div className="mt-5 flex justify-end">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex h-[36px] items-center rounded-full border border-[#dfe4e0] bg-white px-4 text-[13px] font-medium text-[#455249] hover:bg-[#f6f8f6]"
        >
          Cancel
        </button>
      </div>

      <AdminLeaveFormModal
        open={leaveModalOpen}
        busy={saving}
        title={isEdit ? 'Leave supplier setup?' : 'Leave add supplier?'}
        message={
          isEdit
            ? 'You have unsaved changes on this supplier. Keep editing or leave without saving.'
            : 'You have unsaved progress on this supplier form. Keep editing or leave without saving.'
        }
        onStay={handleStayEditing}
        onLeave={handleLeaveWithoutSaving}
      />
    </div>
  )
}
