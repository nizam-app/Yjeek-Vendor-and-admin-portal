import { useVendorAccount } from '../../hooks/vendor/useVendorAccount'

const labelClass =
  'mb-1.5 block text-[13px] font-medium tracking-[0.04em] text-[#69706E] uppercase'
const fieldClass =
  'box-border flex h-[42px] w-full items-center rounded-[10px] border border-[#E0E6E0] bg-white px-3.5 text-[13px] font-medium text-[#1A1A1A]'
const cardClass = 'rounded-[14px] border border-[#E0E6E0] bg-white p-5 shadow-card'

const verificationToneClass = {
  verified: 'bg-[#E5F5EB] text-[#127036]',
  pending: 'bg-[#FFF4CC] text-[#9A6B00]',
  rejected: 'bg-[#FDECEC] text-[#C0392B]',
  unverified: 'bg-[#EEF1EE] text-[#69706E]',
}

const verificationDotClass = {
  verified: 'bg-[#2E9E4D]',
  pending: 'bg-[#D98C1A]',
  rejected: 'bg-[#C0392B]',
  unverified: 'bg-[#9AA19C]',
}

function Field({ label, value, width = 'w-[280px]' }) {
  return (
    <div className={`max-w-full ${width}`}>
      <label className={labelClass}>{label}</label>
      <div className={fieldClass}>{value}</div>
    </div>
  )
}

export default function Account() {
  const { data, error, isLoading, refetch } = useVendorAccount()

  if (isLoading) {
    return <div className="p-7 text-[13px] text-ink-muted">Loading account…</div>
  }

  if (error || !data) {
    return (
      <div className="p-7 text-[13px] text-danger">
        Unable to load account.{' '}
        <button type="button" onClick={refetch} className="underline">
          Try again
        </button>
      </div>
    )
  }

  const { profile, business, payout } = data
  const tone = payout.verificationTone || 'unverified'

  return (
    <div className="px-[28px] pt-[26px] pb-10">
      <h1 className="mb-5 text-[20px] font-bold tracking-[-0.02em] text-ink">Account</h1>

      <section className={`${cardClass} mb-4`}>
        <h2 className="mb-4 text-[16px] font-bold text-ink">Profile</h2>

        <div className="mb-5 flex flex-wrap items-center gap-3">
          {profile.avatarUrl ? (
            <img
              src={profile.avatarUrl}
              alt=""
              className="size-14 shrink-0 rounded-full object-cover"
            />
          ) : (
            <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-[#E5F5EB] text-[16px] font-bold text-[#127036]">
              {profile.initials}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-[16px] font-bold text-ink">{profile.headerName}</p>
            <p className="text-[12.5px] text-ink-muted">{profile.role}</p>
          </div>
          <button
            type="button"
            className="inline-flex h-[34px] shrink-0 items-center rounded-full border border-[#E0E5E0] bg-white px-3.5 text-[12.5px] font-medium text-[#127036] hover:bg-[#f3faf5]"
          >
            Change photo
          </button>
        </div>

        <div className="mb-3.5 flex flex-wrap gap-4">
          <Field label="Full name" value={profile.fullName} />
          <Field label="Display name" value={profile.displayName} />
        </div>
        <div className="flex flex-wrap gap-4">
          <Field label="Email" value={profile.email} width="w-[320px]" />
          <Field label="Phone" value={profile.phone} />
        </div>
      </section>

      <section className={`${cardClass} mb-4`}>
        <h2 className="mb-4 text-[16px] font-bold text-ink">Business details</h2>

        <div className="mb-3.5">
          <Field label="Legal name" value={business.legalName} width="w-[320px]" />
        </div>
        <div className="mb-3.5 flex flex-wrap gap-4">
          <Field label="CR number" value={business.crNumber} width="w-[220px]" />
          <Field label="VAT number" value={business.vatNumber} width="w-[260px]" />
        </div>
        <Field label="Business address" value={business.businessAddress} width="w-[560px]" />
      </section>

      <section className={cardClass}>
        <h2 className="mb-3 text-[16px] font-bold text-ink">Payout &amp; bank</h2>

        <span
          className={`mb-4 inline-flex items-center gap-1.5 rounded-full px-2.5 py-[4px] text-[11px] font-bold ${
            verificationToneClass[tone] || verificationToneClass.unverified
          }`}
        >
          <span
            className={`size-1.5 rounded-full ${verificationDotClass[tone] || verificationDotClass.unverified}`}
            aria-hidden
          />
          {payout.verificationLabel}
        </span>

        <div className="mb-3.5">
          <Field label="Bank name" value={payout.bankName} width="w-[320px]" />
        </div>
        <Field label="IBAN" value={payout.ibanDisplay} width="w-[320px]" />
      </section>
    </div>
  )
}
