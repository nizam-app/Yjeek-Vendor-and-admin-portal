import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronDown,
  Coffee,
  ShoppingCart,
  Store,
  X,
} from 'lucide-react'
import { formatApiErrorMessage } from '../../../api/errors'
import { adminService } from '../../../services/adminService'
import { cn } from '../../../components/admin/cn'

const labelClass =
  'mb-1.5 block text-[12px] font-medium leading-none text-[#7c8780]'
const sectionLabelClass =
  'text-[11px] font-medium uppercase tracking-[0.06em] text-[#8a948e]'
const inputClass =
  'box-border h-[40px] w-full rounded-[8px] border border-[rgba(0,0,0,0.1)] bg-white px-3 text-[13px] text-[#17231c] outline-none transition placeholder:text-[#9aa49d] focus:border-[#1aa054]'

const DISCOUNT_TYPES = ['Percentage %', 'Fixed amount', 'Free delivery', 'BOGO']
const SCOPE_OPTIONS = ['All stores', 'Specific vendors', 'Categories', 'Services']
const CHANNEL_OPTIONS = ['App', 'Auto-apply', 'Show on home banner', 'Send via push']
const AUDIENCE_OPTIONS = ['New customers', 'All customers', 'Returning customers', 'VIP segment']

const VENDOR_OPTIONS = [
  { name: 'Green Kitchen', Icon: Store },
  { name: 'Lulu Express', Icon: ShoppingCart },
  { name: 'Marina Café', Icon: Coffee },
  { name: 'Burger Hub', Icon: Store },
  { name: 'Fresh Mart', Icon: ShoppingCart },
]

function Field({ label, children, className }) {
  return (
    <label className={cn('block min-w-0', className)}>
      <span className={labelClass}>{label}</span>
      {children}
    </label>
  )
}

function Select({ children, className, ...props }) {
  return (
    <div className={cn('relative', className)}>
      <select
        className={cn(
          inputClass,
          'appearance-none pr-9 [-webkit-appearance:none] [-moz-appearance:none] [&::-ms-expand]:hidden',
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        size={15}
        strokeWidth={2}
        className="pointer-events-none absolute right-3 top-1/2 z-[1] -translate-y-1/2 text-[#7c8780]"
        aria-hidden
      />
    </div>
  )
}

function DateField({ value, onChange, placeholder, disabled }) {
  return (
    <div className="relative">
      <input
        className={cn(inputClass, 'pr-9')}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
      />
      <ChevronDown
        size={15}
        strokeWidth={2}
        className="pointer-events-none absolute right-3 top-1/2 z-[1] -translate-y-1/2 text-[#7c8780]"
        aria-hidden
      />
    </div>
  )
}

function PillGroup({ options, value, onChange, multi = false, disabled = false }) {
  const selected = multi ? value : [value]

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const isActive = selected.includes(option)
        return (
          <button
            key={option}
            type="button"
            disabled={disabled}
            onClick={() => {
              if (!multi) {
                onChange(option)
                return
              }
              onChange(
                isActive
                  ? value.filter((item) => item !== option)
                  : [...value, option],
              )
            }}
            className={cn(
              'inline-flex h-[34px] items-center rounded-full border px-3.5 text-[12.5px] font-bold transition disabled:opacity-60',
              isActive
                ? 'border-[#1aa054] bg-[#e8f7ed] text-[#1aa054]'
                : 'border-[#e4e8e4] bg-white text-[#69756d] hover:bg-[#f6f8f6] hover:text-[#455249]',
            )}
          >
            {option}
          </button>
        )
      })}
    </div>
  )
}

function Card({ title, subtitle, children }) {
  return (
    <section className="rounded-[14px] border border-[#eceeec] bg-white p-5 shadow-[0_1px_2px_rgba(20,40,28,.03)] max-[700px]:p-4">
      {title ? <h3 className="text-[15px] font-bold text-[#17231c]">{title}</h3> : null}
      {subtitle ? <p className="mt-1 text-[12.5px] text-[#7c8780]">{subtitle}</p> : null}
      <div className={title || subtitle ? 'mt-4' : undefined}>{children}</div>
    </section>
  )
}

function VendorIcon({ name }) {
  const Icon = VENDOR_OPTIONS.find((item) => item.name === name)?.Icon || Store
  return <Icon size={13} strokeWidth={2} className="shrink-0 text-[#59655e]" aria-hidden />
}

export default function AdminCreatePromoCodePage() {
  const navigate = useNavigate()
  const goBack = () => navigate('/admin/marketing/promo-codes')

  const [form, setForm] = useState({
    code: '',
    description: '',
    discountType: 'Percentage %',
    discountValue: '',
    maxDiscount: '',
    minOrder: '',
    totalUsageLimit: '',
    perCustomerLimit: '',
    audience: 'All customers',
    validFrom: '',
    validTo: '',
    scope: 'All stores',
    selectedTargets: [],
    search: '',
    channels: ['App'],
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  function update(field) {
    return (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }))
  }

  function removeTarget(name) {
    setForm((prev) => ({
      ...prev,
      selectedTargets: prev.selectedTargets.filter((item) => item !== name),
    }))
  }

  function addTarget(name) {
    setForm((prev) => {
      if (prev.selectedTargets.includes(name)) return prev
      return { ...prev, selectedTargets: [...prev.selectedTargets, name], search: '' }
    })
  }

  const filteredVendors = VENDOR_OPTIONS.filter(
    (vendor) =>
      vendor.name.toLowerCase().includes(form.search.toLowerCase()) &&
      !form.selectedTargets.includes(vendor.name),
  )

  async function handleCreate() {
    setError('')
    setSuccess('')
    setSubmitting(true)
    try {
      const response = await adminService.createAdminMarketingPromoCode(form)
      const createdCode = response?.data?.code || form.code
      setSuccess(`Promo code ${createdCode} created.`)
      navigate('/admin/marketing/promo-codes')
    } catch (err) {
      setError(formatApiErrorMessage(err, 'Failed to create promo code.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="px-5 py-4 pb-10 max-[700px]:px-3">
      <div className="mb-3.5">
        <h2 className="text-[20px] font-bold tracking-[-0.02em] text-[#17231c]">
          Create promo code
        </h2>
        <p className="mt-0.5 text-[12.5px] text-[#7c8780]">Set up a discount code</p>
      </div>

      <div className="mb-4 inline-flex items-center gap-1">
        {['Notifications', 'Promo codes'].map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => {
              navigate(item === 'Promo codes' ? '/admin/marketing/promo-codes' : '/admin/marketing')
            }}
            className={cn(
              'h-[34px] rounded-full px-4 text-[12.5px] font-bold transition',
              item === 'Promo codes'
                ? 'bg-[#e8f7ed] text-[#1aa054]'
                : 'bg-white text-[#69756d] ring-1 ring-[#e4e8e4] hover:text-[#455249]',
            )}
          >
            {item}
          </button>
        ))}
      </div>

      {error ? (
        <div className="mb-4 rounded-[12px] border border-[#f0c9c6] bg-[#fff5f4] px-4 py-3 text-[13px] text-[#b42318]">
          {error}
        </div>
      ) : null}
      {success ? (
        <div className="mb-4 rounded-[12px] border border-[#b7e4c7] bg-[#f0faf4] px-4 py-3 text-[13px] text-[#147940]">
          {success}
        </div>
      ) : null}

      <div className="space-y-4">
        <Card title="Code & discount">
          <div className="space-y-3.5">
            <div className="grid grid-cols-2 gap-3 max-[700px]:grid-cols-1">
              <Field label="Code">
                <input
                  className={inputClass}
                  value={form.code}
                  onChange={update('code')}
                  placeholder="e.g. WELCOME50"
                  disabled={submitting}
                />
              </Field>
              <Field label="Description">
                <input
                  className={inputClass}
                  value={form.description}
                  onChange={update('description')}
                  placeholder="e.g. 50% off first order"
                  disabled={submitting}
                />
              </Field>
            </div>
            <div>
              <p className={labelClass}>Discount type</p>
              <PillGroup
                options={DISCOUNT_TYPES}
                value={form.discountType}
                disabled={submitting}
                onChange={(discountType) => setForm((prev) => ({ ...prev, discountType }))}
              />
            </div>
            <div className="grid grid-cols-3 gap-3 max-[700px]:grid-cols-1">
              <Field label="Discount value">
                <input
                  className={inputClass}
                  value={form.discountValue}
                  onChange={update('discountValue')}
                  placeholder={form.discountType === 'Percentage %' ? '50' : '2'}
                  disabled={submitting}
                />
              </Field>
              <Field label="Max discount (cap)">
                <input
                  className={inputClass}
                  value={form.maxDiscount}
                  onChange={update('maxDiscount')}
                  placeholder="e.g. 2 or BHD 2"
                  disabled={submitting}
                />
              </Field>
              <Field label="Min order">
                <input
                  className={inputClass}
                  value={form.minOrder}
                  onChange={update('minOrder')}
                  placeholder="Not sent yet (API)"
                  disabled={submitting}
                />
              </Field>
            </div>
          </div>
        </Card>

        <Card title="Limits & eligibility">
          <div className="space-y-3.5">
            <div className="grid grid-cols-3 gap-3 max-[900px]:grid-cols-1">
              <Field label="Total usage limit">
                <input
                  className={inputClass}
                  value={form.totalUsageLimit}
                  onChange={update('totalUsageLimit')}
                  placeholder="e.g. 1000"
                  disabled={submitting}
                />
              </Field>
              <Field label="Per-customer limit">
                <input
                  className={inputClass}
                  value={form.perCustomerLimit}
                  onChange={update('perCustomerLimit')}
                  placeholder="Not sent yet (API)"
                  disabled={submitting}
                />
              </Field>
              <Field label="Eligible audience">
                <Select value={form.audience} onChange={update('audience')} disabled={submitting}>
                  {AUDIENCE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <div className="grid grid-cols-3 gap-3 max-[900px]:grid-cols-1">
              <Field label="Valid from">
                <DateField
                  value={form.validFrom}
                  onChange={update('validFrom')}
                  placeholder="Not sent yet (API)"
                  disabled={submitting}
                />
              </Field>
              <Field label="Valid to">
                <DateField
                  value={form.validTo}
                  onChange={update('validTo')}
                  placeholder="Not sent yet (API)"
                  disabled={submitting}
                />
              </Field>
              <Field label="Applies to">
                <Select
                  value={form.scope}
                  disabled={submitting}
                  onChange={(event) => {
                    const scope = event.target.value
                    setForm((prev) => ({
                      ...prev,
                      scope,
                      selectedTargets: scope === 'All stores' ? [] : prev.selectedTargets,
                    }))
                  }}
                >
                  {SCOPE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option === 'Specific vendors'
                        ? `Specific vendors (${form.selectedTargets.length})`
                        : option}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
          </div>
        </Card>

        <Card
          title="Applies to"
          subtitle="UI only for now — create API body does not include scope/vendors yet"
        >
          <div className="space-y-4">
            <div>
              <p className={cn(sectionLabelClass, 'mb-2')}>Scope</p>
              <PillGroup
                options={SCOPE_OPTIONS}
                value={form.scope}
                disabled={submitting}
                onChange={(scope) =>
                  setForm((prev) => ({
                    ...prev,
                    scope,
                    selectedTargets: scope === 'All stores' ? [] : prev.selectedTargets,
                  }))
                }
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className={sectionLabelClass}>Selected vendors</p>
                <span className="text-[12px] font-bold text-[#1aa054]">
                  {form.selectedTargets.length} selected
                </span>
              </div>

              <div className="relative rounded-[10px] border border-[rgba(0,0,0,0.1)] bg-white px-3 py-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  {form.selectedTargets.map((target) => (
                    <span
                      key={target}
                      className="inline-flex h-[30px] items-center gap-1.5 rounded-full bg-[#f3f5f3] px-2.5 text-[12px] font-medium text-[#17231c]"
                    >
                      <VendorIcon name={target} />
                      {target}
                      <button
                        type="button"
                        aria-label={`Remove ${target}`}
                        onClick={() => removeTarget(target)}
                        disabled={submitting}
                        className="grid h-4 w-4 place-items-center rounded-full text-[#7c8780] hover:bg-[#e4e8e4] hover:text-[#455249]"
                      >
                        <X size={11} strokeWidth={2.4} />
                      </button>
                    </span>
                  ))}
                  <input
                    className="min-w-[200px] flex-1 border-0 bg-transparent py-1 text-[13px] text-[#17231c] outline-none placeholder:text-[#9aa49d]"
                    placeholder="Search vendors, categories, services…"
                    value={form.search}
                    onChange={update('search')}
                    disabled={submitting}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && filteredVendors[0]) {
                        event.preventDefault()
                        addTarget(filteredVendors[0].name)
                      }
                    }}
                  />
                </div>

                {form.search && filteredVendors.length > 0 ? (
                  <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-10 overflow-hidden rounded-[10px] border border-[#eceeec] bg-white shadow-[0_8px_24px_rgba(20,40,28,.12)]">
                    {filteredVendors.map(({ name, Icon }) => (
                      <button
                        key={name}
                        type="button"
                        onClick={() => addTarget(name)}
                        className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-[13px] text-[#17231c] hover:bg-[#f6f8f6]"
                      >
                        <Icon size={14} strokeWidth={2} className="text-[#59655e]" />
                        {name}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </Card>

        <Card title="Channels" subtitle="UI only for now — create API body does not include channels yet">
          <PillGroup
            options={CHANNEL_OPTIONS}
            value={form.channels}
            multi
            disabled={submitting}
            onChange={(channels) => setForm((prev) => ({ ...prev, channels }))}
          />
        </Card>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          onClick={goBack}
          disabled={submitting}
          className="inline-flex h-[36px] items-center rounded-full border border-[#dfe4e0] bg-white px-4 text-[13px] font-medium text-[#455249] hover:bg-[#f6f8f6] disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleCreate}
          disabled={submitting}
          className="inline-flex h-[36px] items-center rounded-full bg-[#1aa054] px-4 text-[13px] font-bold text-white hover:bg-[#158a47] disabled:opacity-60"
        >
          {submitting ? 'Creating…' : 'Create promo code'}
        </button>
      </div>
    </div>
  )
}
