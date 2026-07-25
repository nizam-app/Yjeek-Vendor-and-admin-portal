import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, Mail, Star } from 'lucide-react'
import editIcon from '../../../assets/icon-edit.png'
import banIcon from '../../../assets/⛔.png'
import motoBikeIcon from '../../../assets/moto_bike.png'
import carIcon from '../../../assets/💨.png'
import { useApiResource } from '../../../hooks/useApiResource'
import { adminService } from '../../../services/adminService'
import { ApiState } from '../../../components/admin/ApiState'
import { Badge } from '../../../components/admin/Badge'
import AdminSuspendChampModal from '../../../components/admin/AdminSuspendChampModal'
import AdminTerminateChampModal from '../../../components/admin/AdminTerminateChampModal'
import { AdminChampEarnings } from '../../../components/admin/management/AdminChampEarnings'
import { cn } from '../../../components/admin/cn'

function tierTone(tier) {
  if (tier === 'Elite') return 'purple'
  if (tier === 'Gold') return 'yellow'
  if (tier === 'At Risk') return 'red'
  if (tier === 'Bronze') return 'bronze'
  return 'gray'
}

function VehicleLabel({ type }) {
  if (type === 'Bike') {
    return (
      <span className="inline-flex items-center gap-1">
        <img src={motoBikeIcon} alt="" className="h-3.5 w-3.5 object-contain" />
        Bike
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1">
      <img src={carIcon} alt="" className="h-3.5 w-3.5 object-contain" />
      Car
    </span>
  )
}

export default function AdminChampDetailPage() {
  const { champId } = useParams()
  const navigate = useNavigate()
  const [tab, setTab] = useState('Overview')
  const [online, setOnline] = useState(null)
  const [suspendOpen, setSuspendOpen] = useState(false)
  const [terminateOpen, setTerminateOpen] = useState(false)
  const { data, error, isLoading, refetch } = useApiResource(
    () => adminService.getChampDetail(champId),
    [champId],
  )

  if (!data) return <ApiState isLoading={isLoading} error={error} onRetry={refetch} />

  const isOnline = online ?? data.online

  return (
    <div className="px-5 pb-10 pt-4 max-[700px]:px-3">
      <AdminSuspendChampModal
        open={suspendOpen}
        onClose={() => setSuspendOpen(false)}
        onConfirm={() => setOnline(false)}
      />
      <AdminTerminateChampModal
        open={terminateOpen}
        onClose={() => setTerminateOpen(false)}
        champName={data.name}
        champId={data.id}
        defaultCod={data.cod || 'BHD 12.000'}
      />

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/admin/fleet')}
          className="inline-flex h-[34px] shrink-0 items-center gap-1 rounded-full border border-[#e4e8e4] bg-white px-3 text-[13px] font-semibold text-[#1C211F] shadow-[0_1px_2px_rgba(20,40,28,.04)] hover:bg-[#f6f8f6]"
        >
          <ChevronLeft size={15} strokeWidth={2.2} />
          Champs
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
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e8f7ed] px-2.5 py-[3px] text-[11px] font-bold text-[#147940]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#1aa054]" />
                {data.status}
              </span>
              <Badge tone={tierTone(data.tier)}>{data.tier}</Badge>
            </div>
            <p className="mt-1 flex flex-wrap items-center gap-x-1.5 text-[12.5px] text-[#7c8780]">
              <span>{data.id}</span>
              <span>·</span>
              <VehicleLabel type={data.vehicle} />
              <span>·</span>
              <span>{data.supplier}</span>
              <span>·</span>
              <span>{data.zone}</span>
              <span>·</span>
              <span className="inline-flex items-center gap-0.5">
                <Star size={11} className="fill-[#6B736E] text-[#6B736E]" />
                {data.rating}
              </span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="inline-flex h-[36px] shrink-0 items-center gap-1.5 rounded-full border border-[#dfe4e0] bg-white px-3.5 text-[13px] font-medium text-[#17231c] shadow-[0_1px_2px_rgba(20,40,28,.04)] hover:bg-[#f6f8f6]"
          >
            <Mail size={14} strokeWidth={1.8} className="text-[#59655e]" />
            Message
          </button>
          <button
            type="button"
            onClick={() => setSuspendOpen(true)}
            className="inline-flex h-[36px] shrink-0 items-center rounded-full bg-[#fdebec] px-3.5 text-[13px] font-bold text-[#d64044] hover:bg-[#f9d9da]"
          >
            Suspend
          </button>
          <button
            type="button"
            className="inline-flex h-[36px] shrink-0 items-center gap-1.5 rounded-full border border-[#dfe4e0] bg-white px-3.5 text-[13px] font-medium text-[#127338] shadow-[0_1px_2px_rgba(20,40,28,.04)] hover:bg-[#f6f8f6]"
          >
            <img src={editIcon} alt="" className="h-3.5 w-3.5 object-contain" />
            Edit
          </button>
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
          <div className="mb-4 grid grid-cols-5 gap-3 max-[1100px]:grid-cols-3 max-[700px]:grid-cols-2 max-[420px]:grid-cols-1">
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
              <h3 className="mb-1 text-[15px] font-bold text-[#17231c]">Champ profile</h3>
              {data.profile.map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-center gap-6 border-b border-[#f0f2f0] py-3.5 last:border-0 last:pb-0"
                >
                  <span className="w-[140px] shrink-0 text-[12.5px] text-[#7c8780]">{label}</span>
                  <span className="min-w-0 text-[13px] font-medium text-[#17231c]">
                    {label === 'Vehicle type' ? <VehicleLabel type={data.vehicle} /> : value}
                  </span>
                </div>
              ))}
            </section>

            <section className="rounded-[14px] border border-[#eceeec] bg-white px-5 py-5 shadow-[0_1px_2px_rgba(20,40,28,.03)]">
              <h3 className="mb-4 text-[15px] font-bold text-[#17231c]">Status &amp; controls</h3>

              <div className="flex items-start  gap-3 border-b border-[#f0f2f0] pb-3">
                <div className="min-w-0">
                  <p className="text-[13px] font-bold text-[#17231c]">Online</p>
                  <p className="mt-0.5 text-[12px] leading-[16px] text-[#7c8780]">
                    {isOnline ? data.onlineHint : data.offlineHint}
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={isOnline}
                  onClick={() => setOnline(!isOnline)}
                  className={cn(
                    'relative mt-0.5 h-[28px] w-[48px] shrink-0 rounded-full transition',
                    isOnline ? 'bg-[#1aa054]' : 'bg-[#d5dbd7]',
                  )}
                >
                  <span
                    className={cn(
                      'absolute top-[3px] h-[22px] w-[22px] rounded-full bg-white shadow transition',
                      isOnline ? 'left-[23px]' : 'left-[3px]',
                    )}
                  />
                </button>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3 border-b border-[#f0f2f0] pb-3.5">
                <span className="text-[13px] text-[#7c8780]">Current zone</span>
                <span className="text-right text-[13px] font-bold text-[#17231c]">{data.zoneDetail}</span>
              </div>

              <div className="mt-3.5 flex items-center justify-between gap-3">
                <span className="text-[13px] text-[#7c8780]">COD</span>
                <span className="text-right text-[13px] font-bold text-[#17231c]">{data.cod}</span>
              </div>

              <div className="mt-5 flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={() => setSuspendOpen(true)}
                  className="inline-flex h-[40px] w-fit items-center justify-center rounded-full bg-[#fdebec] px-4 text-[13px] font-bold text-[#d64044] hover:bg-[#f9d9da]"
                >
                  Suspend champ
                </button>
                <button
                  type="button"
                  onClick={() => setTerminateOpen(true)}
                  className="inline-flex h-[36px] w-fit items-center justify-center gap-1.5 rounded-full bg-[#d64044] px-4 text-[13px] font-bold text-white hover:bg-[#c0383c]"
                >
                ⊘ 
                  Terminate
                </button>
              </div>
            </section>
          </div>
        </>
      ) : tab === 'Earnings' ? (
        <AdminChampEarnings earnings={data.earnings} />
      ) : (
        <section className="rounded-[14px] border border-[#eceeec] bg-white px-5 py-10 text-center shadow-[0_1px_2px_rgba(20,40,28,.03)]">
          <p className="text-[14px] font-medium text-[#17231c]">{tab}</p>
          <p className="mt-1 text-[12.5px] text-[#7c8780]">This tab will be available in a later update.</p>
        </section>
      )}
    </div>
  )
}
