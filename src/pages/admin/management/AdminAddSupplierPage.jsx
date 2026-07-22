import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { cn } from '../../../components/admin/cn'

const labelClass = 'mb-1.5 block text-[12px] font-medium text-[#7c8780]'
const inputClass =
  'box-border h-[40px] w-full rounded-[8px] border border-[rgba(0,0,0,0.1)] bg-white px-3 text-[13px] text-[#17231c] outline-none transition placeholder:text-[#9aa49d] focus:border-[#1aa054]'

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
  const goBack = () => navigate('/admin/fleet/suppliers')

  const [form, setForm] = useState({
    name: '',
    type: '3PL',
    contactPerson: '',
    phone: '',
    email: '',
  })

  const update = (key) => (event) => {
    setForm((prev) => ({ ...prev, [key]: event.target.value }))
  }

  return (
    <div className="px-5 pb-10 pt-4 max-[700px]:px-3">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={goBack}
            className="inline-flex h-[34px] shrink-0 items-center gap-1 rounded-full border border-[#e4e8e4] bg-white px-3 text-[13px] font-medium text-[#455249] shadow-[0_1px_2px_rgba(20,40,28,.04)] hover:bg-[#f6f8f6]"
          >
            <ChevronLeft size={15} strokeWidth={2.2} />
            Suppliers
          </button>
          <h2 className="text-[20px] font-bold tracking-[-0.02em] text-[#17231c]">Add supplier</h2>
        </div>
        <button
          type="button"
          onClick={goBack}
          className="inline-flex h-[34px] items-center rounded-full bg-[#1aa054] px-4 text-[12px] font-bold text-white shadow-[0_1px_2px_rgba(20,40,28,.15)] hover:bg-[#158a47]"
        >
          Create supplier
        </button>
      </div>

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
          onClick={goBack}
          className="inline-flex h-[36px] items-center rounded-full border border-[#dfe4e0] bg-white px-4 text-[13px] font-medium text-[#455249] hover:bg-[#f6f8f6]"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
