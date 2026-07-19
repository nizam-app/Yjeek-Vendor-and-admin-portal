const labelClass =
  'mb-1.5 block text-[13px] font-medium tracking-[0.04em] text-[#69706E] uppercase'
const fieldClass =
  'box-border flex h-[42px] w-full items-center rounded-[10px] border border-[#E0E6E0] bg-white px-3.5 text-[13px] font-medium text-[#1A1A1A]'
const cardClass = 'rounded-[14px] border border-[#E0E6E0] bg-white p-5 shadow-card'

function Field({ label, value, width = 'w-[280px]' }) {
  return (
    <div className={`max-w-full ${width}`}>
      <label className={labelClass}>{label}</label>
      <div className={fieldClass}>{value}</div>
    </div>
  )
}

export default function Account() {
  return (
    <div className="px-[28px] pt-[26px] pb-10">
      <h1 className="mb-5 text-[20px] font-bold tracking-[-0.02em] text-ink">Account</h1>

      {/* Profile */}
      <section className={`${cardClass} mb-4`}>
        <h2 className="mb-4 text-[16px] font-bold text-ink">Profile</h2>

        <div className="mb-5 flex flex-wrap items-center gap-3">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-[#E5F5EB] text-[16px] font-bold text-[#127036]">
            GK
          </div>
          <div className="min-w-0">
            <p className="text-[16px] font-bold text-ink">Green Kitchen Admin</p>
            <p className="text-[12.5px] text-ink-muted">vendor_admin</p>
          </div>
          <button
            type="button"
            className="inline-flex h-[34px] shrink-0 items-center rounded-full  border border-[#E0E5E0] bg-white px-3.5 text-[12.5px] font-medium text-[#127036] hover:bg-[#f3faf5]"
          >
            Change photo
          </button>
        </div>

        <div className="mb-3.5 flex flex-wrap gap-4">
          <Field label="Full name" value="Asmaa Ilsaey" />
          <Field label="Display name" value="Green Kitchen" />
        </div>
        <div className="flex flex-wrap gap-4">
          <Field label="Email" value="asmaailsaey@gmail.com" width="w-[320px]" />
          <Field label="Phone" value="+973 3886 6620" />
        </div>
      </section>

      {/* Business details */}
      <section className={`${cardClass} mb-4`}>
        <h2 className="mb-4 text-[16px] font-bold text-ink">Business details</h2>

        <div className="mb-3.5">
          <Field label="Legal name" value="Green Kitchen W.L.L" width="w-[320px]" />
        </div>
        <div className="mb-3.5 flex flex-wrap gap-4">
          <Field label="CR number" value="110111-3" width="w-[220px]" />
          <Field label="VAT number" value="220011223300" width="w-[260px]" />
        </div>
        <Field
          label="Business address"
          value="Building 2732, Road 3649, Block 436, Al Seef, Bahrain"
          width="w-[560px]"
        />
      </section>

      {/* Payout & bank */}
      <section className={cardClass}>
        <h2 className="mb-3 text-[16px] font-bold text-ink">Payout &amp; bank</h2>

        <span className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-[#E5F5EB] px-2.5 py-[4px] text-[11px] font-bold text-[#127036]">
          <span className="size-1.5 rounded-full bg-[#2E9E4D]" aria-hidden />
          Verified
        </span>

        <div className="mb-3.5">
          <Field label="Bank name" value="National Bank of Bahrain" width="w-[320px]" />
        </div>
        <Field label="IBAN" value="BH•• •••• •••• •••• 4417" width="w-[320px]" />
      </section>
    </div>
  )
}
