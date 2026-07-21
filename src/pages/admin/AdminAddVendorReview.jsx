import { useState } from 'react'
import { Check } from 'lucide-react'

const cn = (...parts) => parts.filter(Boolean).join(' ')

export default function AdminAddVendorReview({
  form,
  branches,
  users,
  onActivate,
}) {
  const [activateImmediately, setActivateImmediately] = useState(true)

  const branchNames = branches
    .map((branch) => branch.name.split('—')[0]?.trim() || branch.name)
    .slice(0, 3)
    .join(', ')

  const staffCount = users.length
  const summaryRows = [
    ['Store', `${form.storeName} · ${form.storeType}`],
    ['Branches', `${branches.length} (${branchNames})`],
    ['Delivery', 'Radius 5 km · ETA 35 min · min BHD 3.000'],
    ['Users', `1 admin · ${staffCount} staff/managers`],
  ]

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
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[14px] border border-[#eceeec] bg-white p-5 shadow-[0_1px_3px_rgba(20,40,28,.04)]">
        <h3 className="mb-4 text-[15px] font-bold text-[#17231c]">Activation</h3>

        <div className="rounded-[10px] border border-[#cfe9d8] bg-[#e8f7ed] px-3.5 py-3">
          <p className="text-[13px] font-bold text-[#147940]">Ready to go live</p>
          <p className="mt-1 text-[12px] leading-[16px] text-[#2f7a4d]">
            Store will appear in the customer app once activated. License can be completed after.
          </p>
        </div>

        <div className="mt-4 flex items-center  gap-3">
          <div>
            <p className="text-[13px] font-bold text-[#17231c]">Activate immediately</p>
            <p className="mt-0.5 text-[12px] text-[#7c8780]">Otherwise saved as draft.</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={activateImmediately}
            onClick={() => setActivateImmediately((prev) => !prev)}
            className={cn(
              'relative h-[26px] w-[46px] shrink-0 rounded-full transition',
              activateImmediately ? 'bg-[#1aa054]' : 'bg-[#d5dbd7]',
            )}
          >
            <span
              className={cn(
                'absolute top-[3px] h-[20px] w-[20px] rounded-full bg-white shadow transition',
                activateImmediately ? 'left-[23px]' : 'left-[3px]',
              )}
            />
          </button>
        </div>
      </section>
    </div>
  )
}

export function AdminAddVendorActivateButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-[36px] items-center gap-1.5 rounded-full bg-[#1aa054] px-4 text-[13px] font-medium text-white hover:bg-[#158a47]"
    >
      <Check size={14} strokeWidth={2.5} />
      Activate vendor
    </button>
  )
}
