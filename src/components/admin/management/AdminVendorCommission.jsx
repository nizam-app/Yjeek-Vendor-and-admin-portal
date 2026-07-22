import { useEffect, useState } from 'react'
import AdminCommissionEditModal from '../AdminCommissionEditModal'

export function AdminVendorCommission({ commission: initialCommission, onSaveCommission }) {
  const [commission, setCommission] = useState(initialCommission)
  const [editOpen, setEditOpen] = useState(false)

  useEffect(() => {
    setCommission(initialCommission)
  }, [initialCommission])

  const rows = [
    ['Model', commission.model],
    ['Commission rate', commission.rate],
    ['Platform service fee', commission.platformServiceFee],
    ['VAT on commission', commission.vatOnCommission],
  ]

  return (
    <>
      <section className="rounded-[14px] border border-[#eceeec] bg-white px-5 py-5 shadow-[0_1px_2px_rgba(20,40,28,.03)]">
        <h3 className="mb-1 text-[15px] font-bold text-[#17231c]">Commission &amp; fees</h3>

        <div className="mt-3">
          {rows.map(([label, value]) => (
            <div
              key={label}
              className="flex  items-center gap-6 border-b border-[#f0f2f0] py-3.5 last:border-0 last:pb-0"
            >
              <span className="flex-1 text-[12.5px] text-[#7c8780]">{label}</span>
              <span className="flex-1 text-[13px] font-medium text-[#17231c]">{value}</span>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setEditOpen(true)}
          className="mt-5 inline-flex h-[36px] items-center rounded-full border border-[#cfe8d8] bg-white px-4 text-[13px] font-medium text-[#1aa054] shadow-[0_1px_2px_rgba(20,40,28,.04)] hover:bg-[#f3faf5]"
        >
          Edit commission
        </button>
      </section>

      <AdminCommissionEditModal
        open={editOpen}
        commission={commission}
        onClose={() => setEditOpen(false)}
        onSave={(updated) => {
          setCommission(updated)
          onSaveCommission?.(updated)
        }}
      />
    </>
  )
}
