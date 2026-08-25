import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, Mail, Star } from 'lucide-react'
import editIcon from '../../../assets/icon-edit.png'
import banIcon from '../../../assets/⛔.png'
import motoBikeIcon from '../../../assets/moto_bike.png'
import carIcon from '../../../assets/💨.png'
import { useApiResource } from '../../../hooks/useApiResource'
import { apiConfig, isAdminRealApiFeature } from '../../../api/config'
import { formatApiErrorMessage } from '../../../api/errors'
import { adminService } from '../../../services/adminService'
import { ApiState } from '../../../components/admin/ApiState'
import { Badge } from '../../../components/admin/Badge'
import AdminSuspendChampModal from '../../../components/admin/AdminSuspendChampModal'
import AdminTerminateChampModal from '../../../components/admin/AdminTerminateChampModal'
import AdminReconcilePodModal from '../../../components/admin/AdminReconcilePodModal'
import { AdminChampEarnings } from '../../../components/admin/management/AdminChampEarnings'
import { cn } from '../../../components/admin/cn'

function tierTone(tier) {
  if (tier === 'Elite') return 'purple'
  if (tier === 'Gold') return 'yellow'
  if (tier === 'At Risk') return 'red'
  if (tier === 'Bronze') return 'bronze'
  return 'gray'
}

function isPodCashOutstandingError(error) {
  const code =
    error?.raw?.error?.code ||
    error?.raw?.code ||
    error?.details?.code ||
    null
  if (String(code || '').toUpperCase() === 'POD_CASH_OUTSTANDING') return true
  const message = String(error?.message || '').toLowerCase()
  return message.includes('reconcile outstanding pod') || message.includes('pod cash')
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
  const useRealFleet = isAdminRealApiFeature('fleet') || !apiConfig.adminUseMockApi
  const [tab, setTab] = useState('Overview')
  const [online, setOnline] = useState(null)
  const [suspendOpen, setSuspendOpen] = useState(false)
  const [terminateOpen, setTerminateOpen] = useState(false)
  const [reconcileOpen, setReconcileOpen] = useState(false)
  const [actionBusy, setActionBusy] = useState('')
  const [actionError, setActionError] = useState('')
  const [actionSuccess, setActionSuccess] = useState('')

  const { data, error, isLoading, refetch } = useApiResource(
    () => adminService.getChampDetail(champId),
    [champId],
  )

  const {
    data: earnings,
    error: earningsError,
    isLoading: earningsLoading,
    refetch: refetchEarnings,
  } = useApiResource(
    () => {
      if (tab !== 'Earnings') return Promise.resolve({ data: null })
      if (useRealFleet) {
        return adminService.getAdminFleetChampEarnings(champId, { limit: 30 })
      }
      // Mock overview may embed earnings.
      return Promise.resolve({ data: data?.earnings || null })
    },
    [tab, champId, useRealFleet, data?.earnings],
  )

  if (!data) return <ApiState isLoading={isLoading} error={error} onRetry={refetch} />

  const isOnline = online ?? data.online
  const isSuspended = Boolean(data.isSuspended)
  const isTerminated = Boolean(data.isTerminated)
  const resolvedChampId = data.id || champId

  const handleSuspendSuccess = async () => {
    setActionError('')
    setActionSuccess('Champ suspended.')
    setOnline(false)
    await refetch()
  }

  const handleTerminateSuccess = async () => {
    setActionError('')
    setActionSuccess('Champ terminated.')
    setOnline(false)
    await refetch()
  }

  const handleReconcileSuccess = async () => {
    setActionError('')
    setActionSuccess('POD cash reconciled. Ask the champ to go online from the driver app.')
    setOnline(null)
    await refetch()
  }

  const handleUnsuspend = async () => {
    setActionBusy('unsuspend')
    setActionError('')
    setActionSuccess('')
    try {
      await adminService.unsuspendAdminFleetChamp(resolvedChampId)
      setActionSuccess('Champ unsuspended.')
      await refetch()
    } catch (err) {
      setActionError(formatApiErrorMessage(err, 'Failed to unsuspend champ.'))
    } finally {
      setActionBusy('')
    }
  }

  const handleToggleOnline = async () => {
    if (actionBusy === 'online' || isSuspended || isTerminated || data.canToggleOnline === false) return

    const nextOnline = !isOnline
    setActionBusy('online')
    setActionError('')
    setActionSuccess('')

    try {
      // Use route id — same {{champId}} Postman uses for fleet champ actions.
      const response = await adminService.setAdminFleetChampOnline(champId, nextOnline)
      if (response?.data && typeof response.data.online === 'boolean') {
        setOnline(response.data.online)
      } else {
        setOnline(nextOnline)
      }
      setActionSuccess(nextOnline ? 'Champ set online.' : 'Champ set offline.')
      await refetch()
      // Prefer server overview after refresh.
      setOnline(null)
    } catch (err) {
      if (nextOnline && isPodCashOutstandingError(err)) {
        setActionError(
          `Could not set online: daily cash limit reached (${data.cod} of ${data.cashLimit}). Reconcile POD cash, or retry — admin override should still work if the limit is not actually reached.`,
        )
      } else {
        setActionError(
          formatApiErrorMessage(
            err,
            nextOnline ? 'Failed to set champ online.' : 'Failed to set champ offline.',
          ),
        )
      }
    } finally {
      setActionBusy('')
    }
  }

  return (
    <div className="px-5 pb-10 pt-4 max-[700px]:px-3">
      <AdminSuspendChampModal
        open={suspendOpen}
        onClose={() => setSuspendOpen(false)}
        champId={resolvedChampId}
        onSuccess={handleSuspendSuccess}
      />
      <AdminTerminateChampModal
        open={terminateOpen}
        onClose={() => setTerminateOpen(false)}
        champName={data.name}
        champId={champId || resolvedChampId}
        defaultCod={data.cod || 'BHD 0.000'}
        onSuccess={handleTerminateSuccess}
      />
      <AdminReconcilePodModal
        open={reconcileOpen}
        onClose={() => setReconcileOpen(false)}
        champId={champId || resolvedChampId}
        champName={data.name}
        codAmount={data.cod || 'BHD 0.000'}
        podCashBalance={data.podCashBalance}
        onSuccess={handleReconcileSuccess}
      />

      {actionError ? (
        <div className="mb-4 rounded-[12px] border border-[#f0c9c6] bg-[#fff5f4] px-4 py-3 text-[13px] text-[#b42318]">
          {actionError}
        </div>
      ) : null}
      {actionSuccess ? (
        <div className="mb-4 rounded-[12px] border border-[#b7e4c7] bg-[#f0faf4] px-4 py-3 text-[13px] text-[#147940]">
          {actionSuccess}
        </div>
      ) : null}

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
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-[3px] text-[11px] font-bold',
                  isSuspended
                    ? 'bg-[#fdebec] text-[#d64044]'
                    : 'bg-[#e8f7ed] text-[#147940]',
                )}
              >
                <span
                  className={cn(
                    'h-1.5 w-1.5 rounded-full',
                    isSuspended ? 'bg-[#d64044]' : 'bg-[#1aa054]',
                  )}
                />
                {isSuspended ? 'Suspended' : data.status}
              </span>
              <Badge tone={tierTone(data.tier)}>{data.tier}</Badge>
            </div>
            <p className="mt-1 flex flex-wrap items-center gap-x-1.5 text-[12.5px] text-[#7c8780]">
              <span>{data.displayCode || data.id}</span>
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
          {isSuspended ? (
            <button
              type="button"
              disabled={actionBusy === 'unsuspend'}
              onClick={handleUnsuspend}
              className="inline-flex h-[36px] shrink-0 items-center rounded-full border border-[#1aa054] bg-white px-3.5 text-[13px] font-bold text-[#1aa054] hover:bg-[#f3faf5] disabled:opacity-60"
            >
              {actionBusy === 'unsuspend' ? 'Unsuspending…' : 'Unsuspend'}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setSuspendOpen(true)}
              className="inline-flex h-[36px] shrink-0 items-center rounded-full bg-[#fdebec] px-3.5 text-[13px] font-bold text-[#d64044] hover:bg-[#f9d9da]"
            >
              Suspend
            </button>
          )}
          <button
            type="button"
            onClick={() =>
              navigate(`/admin/fleet/${encodeURIComponent(champId || resolvedChampId)}/edit`)
            }
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

              <div className="flex items-start gap-3 border-b border-[#f0f2f0] pb-3">
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
                  aria-busy={actionBusy === 'online'}
                  disabled={
                    actionBusy === 'online' ||
                    isSuspended ||
                    isTerminated ||
                    data.canToggleOnline === false
                  }
                  onClick={handleToggleOnline}
                  className={cn(
                    'relative mt-0.5 h-[28px] w-[48px] shrink-0 rounded-full transition disabled:cursor-not-allowed disabled:opacity-50',
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

              <div className="mt-3.5 flex items-center justify-between gap-3 border-b border-[#f0f2f0] pb-3.5">
                <span className="text-[13px] text-[#7c8780]">COD</span>
                <span
                  className={cn(
                    'text-right text-[13px] font-bold',
                    data.hasOutstandingPod ? 'text-[#c4841a]' : 'text-[#17231c]',
                  )}
                >
                  {data.cod}
                </span>
              </div>

              {data.cashLimitReached ? (
                <div className="mt-3.5 rounded-[10px] border border-[#f3e0b8] bg-[#fff8ec] px-3.5 py-3">
                  <p className="text-[12px] leading-[16px] font-medium text-[#9a6b12]">
                    Daily cash limit reached ({data.cod} of {data.cashLimit}). The champ cannot go
                    online from the driver app until cash is reconciled. As admin, you can still set
                    them online here or use Reconcile POD cash.
                  </p>
                  <button
                    type="button"
                    onClick={() => setReconcileOpen(true)}
                    disabled={Boolean(actionBusy)}
                    className="mt-3 inline-flex h-[36px] items-center justify-center rounded-full bg-[#1aa054] px-4 text-[13px] font-bold text-white hover:bg-[#168f49] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Reconcile POD cash
                  </button>
                </div>
              ) : null}

              <div className="mt-5 flex flex-col gap-2.5">
                {isTerminated ? (
                  <p className="text-[12.5px] font-medium text-[#d64044]">
                    This champ is terminated and cannot be reactivated.
                  </p>
                ) : isSuspended ? (
                  <button
                    type="button"
                    disabled={actionBusy === 'unsuspend'}
                    onClick={handleUnsuspend}
                    className="inline-flex h-[40px] w-fit items-center justify-center rounded-full border border-[#1aa054] bg-white px-4 text-[13px] font-bold text-[#1aa054] hover:bg-[#f3faf5] disabled:opacity-60"
                  >
                    {actionBusy === 'unsuspend' ? 'Unsuspending…' : 'Unsuspend champ'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setSuspendOpen(true)}
                    className="inline-flex h-[40px] w-fit items-center justify-center rounded-full bg-[#fdebec] px-4 text-[13px] font-bold text-[#d64044] hover:bg-[#f9d9da]"
                  >
                    Suspend champ
                  </button>
                )}
                {!isTerminated ? (
                  <button
                    type="button"
                    onClick={() => setTerminateOpen(true)}
                    className="inline-flex h-[36px] w-fit items-center justify-center gap-1.5 rounded-full bg-[#d64044] px-4 text-[13px] font-bold text-white hover:bg-[#c0383c]"
                  >
                    ⊘ Terminate
                  </button>
                ) : null}
              </div>
            </section>
          </div>
        </>
      ) : tab === 'Earnings' ? (
        earningsLoading && !earnings ? (
          <div className="rounded-[14px] border border-[#eceeec] bg-white px-5 py-10 text-center text-[13px] text-[#7c8780]">
            Loading earnings…
          </div>
        ) : earningsError ? (
          <div className="rounded-[14px] border border-[#f2cccc] bg-[#fff5f5] px-5 py-6 text-[13px] text-[#a93e42]">
            {formatApiErrorMessage(earningsError, 'Unable to load earnings.')}
            <button
              type="button"
              onClick={refetchEarnings}
              className="ml-2 font-medium underline"
            >
              Try again
            </button>
          </div>
        ) : earnings ? (
          <AdminChampEarnings earnings={earnings} />
        ) : (
          <section className="rounded-[14px] border border-[#eceeec] bg-white px-5 py-10 text-center shadow-[0_1px_2px_rgba(20,40,28,.03)]">
            <p className="text-[14px] font-medium text-[#17231c]">Earnings</p>
            <p className="mt-1 text-[12.5px] text-[#7c8780]">No earnings data available.</p>
          </section>
        )
      ) : (
        <section className="rounded-[14px] border border-[#eceeec] bg-white px-5 py-10 text-center shadow-[0_1px_2px_rgba(20,40,28,.03)]">
          <p className="text-[14px] font-medium text-[#17231c]">{tab}</p>
          <p className="mt-1 text-[12.5px] text-[#7c8780]">This tab will be available in a later update.</p>
        </section>
      )}
    </div>
  )
}
