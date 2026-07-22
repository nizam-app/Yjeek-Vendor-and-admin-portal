import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, Star } from 'lucide-react'
import { useApiResource } from '../../../hooks/useApiResource'
import { adminService } from '../../../services/adminService'
import { ApiState } from '../../../components/admin/ApiState'
import { AdminCustomerWallet } from '../../../components/admin/management/AdminCustomerWallet'
import { AdminCustomerSupport } from '../../../components/admin/management/AdminCustomerSupport'
import AdminSuspendCustomerModal from '../../../components/admin/AdminSuspendCustomerModal'
import { cn } from '../../../components/admin/cn'

export default function AdminCustomerDetailPage() {
  const { customerId } = useParams()
  const navigate = useNavigate()
  const [tab, setTab] = useState('Overview')
  const [accountActive, setAccountActive] = useState(null)
  const [suspendOpen, setSuspendOpen] = useState(false)
  const { data, error, isLoading, refetch } = useApiResource(
    () => adminService.getCustomerDetail(customerId),
    [customerId],
  )

  if (!data) return <ApiState isLoading={isLoading} error={error} onRetry={refetch} />

  const active = accountActive ?? data.accountActive

  return (
    <div className="px-5 pb-10 pt-4 max-[700px]:px-3">
      <AdminSuspendCustomerModal
        open={suspendOpen}
        onClose={() => setSuspendOpen(false)}
        customerName={data.name}
        onConfirm={() => setAccountActive(false)}
      />
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/admin/customers')}
          className="inline-flex h-[34px] shrink-0 items-center gap-1 rounded-full border border-[#e4e8e4] bg-white px-3 text-[13px] font-medium text-[#455249] shadow-[0_1px_2px_rgba(20,40,28,.04)] hover:bg-[#f6f8f6]"
        >
          <ChevronLeft size={15} strokeWidth={2.2} />
          Customers
        </button>

        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div
            className="grid h-12 w-12 shrink-0 place-items-center rounded-full text-[15px] font-bold"
            style={{ background: data.avatarBg, color: data.avatarText }}
          >
            {data.initials}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-[22px] font-bold tracking-[-0.02em] text-[#17231c]">{data.name}</h2>
              <span className="inline-flex rounded-full bg-[#e8f7ed] px-2.5 py-[3px] text-[11px] font-bold text-[#147940]">
                {data.status}
              </span>
            </div>
            <p className="mt-1 truncate text-[12.5px] text-[#7c8780]">
              {data.phone} · {data.email} · joined {data.joinedYear}
            </p>
          </div>
        </div>
      </div>

      <div className="mb-4 overflow-x-auto overscroll-x-contain touch-pan-x [-webkit-overflow-scrolling:touch]">
        <div className="inline-flex w-full min-w-full items-center rounded-[10px] bg-[#ebeceb] p-[4px]">
          {data.tabs.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setTab(item)}
              className={cn(
                'h-[32px] shrink-0 flex-1 rounded-[8px] px-3.5 text-[12.5px] whitespace-nowrap transition',
                tab === item
                  ? 'bg-white font-bold shadow-[0_1px_3px_rgba(20,40,28,.12)]'
                  : 'font-medium hover:text-[#455249]',
              )}
              style={{ color: tab === item ? '#1aa054' : '#69756d' }}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {tab === 'Overview' ? (
        <>
          <div className="mb-4 grid grid-cols-7 gap-3 max-[1300px]:grid-cols-4 max-[900px]:grid-cols-3 max-[600px]:grid-cols-2 max-[420px]:grid-cols-1">
            {data.metrics.map(({ label, value, star, tone }) => {
              const valueColor =
                tone === 'green' ? '#1aa054' : tone === 'orange' ? '#c4841a' : '#17231c'

              return (
                <div
                  key={label}
                  className="rounded-[14px] border border-[#eceeec] bg-white px-4 py-3.5 shadow-[0_1px_2px_rgba(20,40,28,.03)]"
                >
                  <p className="text-[12px] text-[#7c8780]">{label}</p>
                  <p
                    className="mt-2 flex items-center gap-1 text-[22px] font-bold leading-none tracking-[-0.02em]"
                    style={{ color: valueColor }}
                  >
                    {star ? <Star size={15} className="shrink-0 fill-[#1aa054] text-[#1aa054]" /> : null}
                    <span>{value}</span>
                  </p>
                </div>
              )
            })}
          </div>

          <div className="grid grid-cols-[minmax(0,1.7fr)_minmax(260px,1fr)] items-start gap-4 max-[900px]:grid-cols-1">
            <section className="rounded-[14px] border border-[#eceeec] bg-white px-5 py-5 shadow-[0_1px_2px_rgba(20,40,28,.03)]">
              <h3 className="mb-1 text-[15px] font-bold text-[#17231c]">Profile</h3>
              {data.profile.map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-center  gap-6 border-b  border-[#f0f2f0] py-3.5 last:border-0 last:pb-0"
                >
                  <span className="flex-1 shrink-0 text-[12.5px] text-[#7c8780]">{label}</span>
                  <span className="flex-4 text-left text-[13px] font-medium text-[#17231c]">{value}</span>
                </div>
              ))}
            </section>

            <section className="rounded-[14px] border border-[#eceeec] bg-white px-5 py-5 shadow-[0_1px_2px_rgba(20,40,28,.03)]">
              <h3 className="mb-4 text-[15px] font-bold text-[#17231c]">Status &amp; controls</h3>

              <div className="flex items-start  gap-3 border-b border-[#f0f2f0] pb-3">
                <div className="min-w-0">
                  <p className="text-[13px] font-bold text-[#17231c]">Account active</p>
                  <p className="mt-0.5 text-[12px] leading-[16px] text-[#7c8780]">
                    {active ? data.accountActiveHint : 'Cannot order or log in'}
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={active}
                  onClick={() => setAccountActive(!active)}
                  className={cn(
                    'relative mt-0.5 h-[28px] w-[48px] shrink-0 rounded-full transition',
                    active ? 'bg-[#1aa054]' : 'bg-[#d5dbd7]',
                  )}
                >
                  <span
                    className={cn(
                      'absolute top-[3px] h-[22px] w-[22px] rounded-full bg-white shadow transition',
                      active ? 'left-[23px]' : 'left-[3px]',
                    )}
                  />
                </button>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3 border-b border-[#f0f2f0] pb-3.5">
                <span className="text-[13px] text-[#7c8780]">Devices</span>
                <span className="text-right text-[13px] font-bold text-[#17231c]">{data.devices}</span>
              </div>

              <div className="mt-3.5 flex items-center justify-between gap-3">
                <span className="text-[13px] text-[#7c8780]">Payment methods</span>
                <span className="text-right text-[13px] font-bold text-[#17231c]">{data.paymentMethods}</span>
              </div>

              <div className="mt-5 flex flex-col gap-2.5">
                <button
                  type="button"
                  className="inline-flex h-[40px] w-fit items-center justify-center rounded-full border border-[#E3E5E3] bg-white px-4 text-[13px] font-bold text-[#1aa054] hover:bg-[#f3faf5]"
                >
                  Reset password
                </button>
                <button
                  type="button"
                  onClick={() => setSuspendOpen(true)}
                  className="inline-flex h-[40px] w-fit items-center justify-center rounded-full border border-[#f0b8b6] bg-white px-4 text-[13px] font-bold text-[#d64044] hover:bg-[#fdebec]"
                >
                  Suspend customer
                </button>
              </div>
            </section>
          </div>
        </>
      ) : tab === 'Wallet & cashback' ? (
        <AdminCustomerWallet wallet={data.wallet} />
      ) : tab === 'Support' ? (
        <AdminCustomerSupport support={data.support} />
      ) : (
        <section className="rounded-[14px] border border-[#eceeec] bg-white px-5 py-10 text-center shadow-[0_1px_2px_rgba(20,40,28,.03)]">
          <p className="text-[14px] font-medium text-[#17231c]">{tab}</p>
          <p className="mt-1 text-[12.5px] text-[#7c8780]">This tab will be available in a later update.</p>
        </section>
      )}
    </div>
  )
}
