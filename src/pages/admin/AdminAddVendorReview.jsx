import { Check } from 'lucide-react'

const cn = (...parts) => parts.filter(Boolean).join(' ')

function StatusToggle({ label, hint, checked, onChange }) {
  return (
    <div className="mt-4 flex items-center gap-3">
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-bold text-[#17231c]">{label}</p>
        <p className="mt-0.5 text-[12px] text-[#7c8780]">{hint}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange?.(!checked)}
        className={cn(
          'relative h-[26px] w-[46px] shrink-0 rounded-full transition',
          checked ? 'bg-[#1aa054]' : 'bg-[#d5dbd7]',
        )}
      >
        <span
          className={cn(
            'absolute top-[3px] h-[20px] w-[20px] rounded-full bg-white shadow transition',
            checked ? 'left-[23px]' : 'left-[3px]',
          )}
        />
      </button>
    </div>
  )
}

export default function AdminAddVendorReview({
  form,
  branches,
  users,
  vendorVisible = true,
  vendorActive = true,
  onVendorVisibleChange,
  onVendorActiveChange,
}) {
  const branchNames = (branches || [])
    .map((branch) => String(branch.name || '').split('—')[0]?.trim() || branch.name)
    .filter(Boolean)
    .slice(0, 3)
    .join(', ')

  const staffCount = (users || []).length
  const ownerLabel = form?.ownerEmail || form?.ownerName ? '1 owner' : 'No owner'
  const summaryRows = [
    ['Store', `${form.storeName} · ${form.storeType}`],
    ['Branches', `${(branches || []).length}${branchNames ? ` (${branchNames})` : ''}`],
    [
      'Location',
      [form.area, form.city].filter(Boolean).join(', ') || '—',
    ],
    ['Users', `${ownerLabel} · ${staffCount} additional`],
  ]

  let statusTitle = 'Hidden from customer app'
  let statusBody = 'Vendor will not appear in search or category listings until Visible is ON.'
  if (vendorVisible && vendorActive) {
    statusTitle = 'Visible and accepting orders'
    statusBody = 'Store appears in the customer app and customers can place orders.'
  } else if (vendorVisible && !vendorActive) {
    statusTitle = 'Visible but unavailable for ordering'
    statusBody = 'Store appears in the customer app, but customers cannot place orders.'
  }

  return (
    <div className="grid grid-cols-3 gap-3 max-[900px]:grid-cols-1">
      <section className="col-span-2 rounded-[14px] border border-[#eceeec] bg-white p-5 shadow-[0_1px_3px_rgba(20,40,28,.04)]">
        <h3 className="mb-4 text-[15px] font-bold text-[#17231c]">Summary</h3>
        <div className="space-y-0">
          {summaryRows.map(([label, value]) => (
            <div
              key={label}
              className="flex items-start justify-between gap-4 border-b border-[#eef1ef] py-3 last:border-0"
            >
              <span className="shrink-0 text-[13px] text-[#7c8780] flex-1">{label}</span>
              <span className="shrink-0 text-black text-[#7c8780] flex-3">{value}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[14px] border border-[#eceeec] bg-white p-5 shadow-[0_1px_3px_rgba(20,40,28,.04)]">
        <h3 className="mb-4 text-[15px] font-bold text-[#17231c]">Customer app status</h3>

        <div className="rounded-[10px] border border-[#cfe9d8] bg-[#e8f7ed] px-3.5 py-3">
          <p className="text-[13px] font-bold text-[#147940]">{statusTitle}</p>
          <p className="mt-1 text-[12px] leading-[16px] text-[#2f7a4d]">{statusBody}</p>
        </div>

        <StatusToggle
          label="Visible"
          hint={
            vendorVisible
              ? 'Shown in customer search and category listings.'
              : 'Hidden from the customer app.'
          }
          checked={vendorVisible}
          onChange={onVendorVisibleChange}
        />

        <StatusToggle
          label="Active"
          hint={
            vendorActive
              ? 'Vendor can receive orders; customers can check out.'
              : 'Customers cannot place orders (can still browse if Visible is ON).'
          }
          checked={vendorActive}
          onChange={onVendorActiveChange}
        />
      </section>
    </div>
  )
}

export function AdminAddVendorActivateButton({ onClick, disabled = false, label = 'Create Vendor' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-[36px] items-center gap-1.5 rounded-full bg-[#1aa054] px-4 text-[13px] font-medium text-white hover:bg-[#158a47] disabled:opacity-60"
    >
      <Check size={14} strokeWidth={2.5} />
      {label}
    </button>
  )
}
