import { PageHeader } from '../components/ui'
import { vendor } from '../data/mockData'
import { useAuth } from '../context/AuthContext'

export default function Account() {
  const { user } = useAuth()

  const labelClass = 'block text-[11px] font-bold tracking-[0.04em] text-ink-muted mb-[6px]'
  const inputClass =
    'w-full h-11 border border-border rounded-md px-[14px] text-[13px] bg-white min-w-[220px] focus:outline-2 focus:outline-solid focus:outline-[rgba(26,166,77,0.25)] focus:border-green-primary'

  return (
    <div className="pt-[26px] px-[28px] pb-10">
      <PageHeader title="Account" subtitle="Vendor profile & security settings" />

      <div className="grid grid-cols-2 gap-4 max-[1200px]:grid-cols-1">
        <div className="bg-white border border-border rounded-lg shadow-card overflow-hidden py-[18px] px-5">
          <div className="text-[15px] font-bold mb-[14px] flex items-center justify-between">Profile</div>
          <div className="grid gap-[14px]">
            <div className="mb-[18px]">
              <label className={labelClass}>STORE NAME</label>
              <input className={inputClass} defaultValue={vendor.name} />
            </div>
            <div className="mb-[18px]">
              <label className={labelClass}>ADMIN NAME</label>
              <input className={inputClass} defaultValue={vendor.adminName} />
            </div>
            <div className="mb-[18px]">
              <label className={labelClass}>EMAIL</label>
              <input className={inputClass} defaultValue={user?.email || vendor.email} />
            </div>
            <div className="mb-[18px]">
              <label className={labelClass}>ROLE</label>
              <input className={inputClass} defaultValue={vendor.adminRole} readOnly />
            </div>
            <button
              type="button"
              className="bg-green-primary text-white rounded-md py-[10px] px-4 text-sm font-semibold hover:brightness-[0.96]"
              style={{ width: 'fit-content' }}
            >
              Save changes
            </button>
          </div>
        </div>

        <div className="bg-white border border-border rounded-lg shadow-card overflow-hidden py-[18px] px-5">
          <div className="text-[15px] font-bold mb-[14px] flex items-center justify-between">Security</div>
          <div className="grid gap-[14px]">
            <div className="mb-[18px]">
              <label className={labelClass}>CURRENT PASSWORD</label>
              <input className={inputClass} type="password" placeholder="••••••••••" />
            </div>
            <div className="mb-[18px]">
              <label className={labelClass}>NEW PASSWORD</label>
              <input className={inputClass} type="password" placeholder="••••••••••" />
            </div>
            <div className="mb-[18px]">
              <label className={labelClass}>CONFIRM PASSWORD</label>
              <input className={inputClass} type="password" placeholder="••••••••••" />
            </div>
            <button
              type="button"
              className="border border-border rounded-md py-2 px-[14px] text-[13px] font-medium bg-white text-ink hover:bg-[#f7f9f7]"
              style={{ width: 'fit-content' }}
            >
              Update password
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
