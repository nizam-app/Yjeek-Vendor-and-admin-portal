import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, Star } from 'lucide-react'
import { useApiResource } from '../../../hooks/useApiResource'
import { apiConfig, isAdminRealApiFeature } from '../../../api/config'
import { formatApiErrorMessage } from '../../../api/errors'
import { adminService } from '../../../services/adminService'
import { ApiState } from '../../../components/admin/ApiState'
import { AdminCustomerWallet } from '../../../components/admin/management/AdminCustomerWallet'
import { AdminCustomerSupport } from '../../../components/admin/management/AdminCustomerSupport'
import AdminSuspendCustomerModal from '../../../components/admin/AdminSuspendCustomerModal'
import { cn } from '../../../components/admin/cn'

function useRealCustomers() {
  return isAdminRealApiFeature('customers') || !apiConfig.adminUseMockApi
}

export default function AdminCustomerDetailPage() {
  const { customerId } = useParams()
  const navigate = useNavigate()
  const useReal = useRealCustomers()
  const [tab, setTab] = useState('Overview')
  const [accountActive, setAccountActive] = useState(null)
  const [suspendOpen, setSuspendOpen] = useState(false)
  const [actionBusy, setActionBusy] = useState('')
  const [actionError, setActionError] = useState('')
  const [actionSuccess, setActionSuccess] = useState('')

  const [wallet, setWallet] = useState(null)
  const [walletLoading, setWalletLoading] = useState(false)
  const [walletError, setWalletError] = useState(null)

  const [support, setSupport] = useState(null)
  const [supportLoading, setSupportLoading] = useState(false)
  const [supportError, setSupportError] = useState(null)

  const { data, error, isLoading, refetch, setData } = useApiResource(
    () => adminService.getCustomerDetail(customerId),
    [customerId],
  )

  useEffect(() => {
    setAccountActive(null)
    setWallet(null)
    setSupport(null)
    setWalletError(null)
    setSupportError(null)
    setActionError('')
    setActionSuccess('')
    setActionBusy('')
  }, [customerId])

  useEffect(() => {
    if (!customerId || !useReal) {
      setWalletLoading(false)
      setWalletError(null)
      return undefined
    }

    let cancelled = false
    setWalletLoading(true)
    setWalletError(null)

    adminService
      .getAdminCustomerWallet(customerId)
      .then((response) => {
        if (cancelled) return
        const next = response?.data || null
        setWallet(next)
        setData((prev) => (prev ? { ...prev, wallet: next } : prev))
      })
      .catch((err) => {
        if (cancelled) return
        setWallet(null)
        setWalletError(err?.message || 'Failed to load wallet.')
      })
      .finally(() => {
        if (!cancelled) setWalletLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [customerId, useReal, setData])

  useEffect(() => {
    if (!customerId || !useReal) {
      setSupportLoading(false)
      setSupportError(null)
      return undefined
    }

    let cancelled = false
    setSupportLoading(true)
    setSupportError(null)

    adminService
      .getAdminCustomerSupport(customerId)
      .then((response) => {
        if (cancelled) return
        const next = response?.data || null
        setSupport(next)
        setData((prev) => (prev ? { ...prev, support: next } : prev))
      })
      .catch((err) => {
        if (cancelled) return
        setSupport(null)
        setSupportError(err?.message || 'Failed to load support tickets.')
      })
      .finally(() => {
        if (!cancelled) setSupportLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [customerId, useReal, setData])

  if (!data) return <ApiState isLoading={isLoading} error={error} onRetry={refetch} />

  const active = accountActive ?? data.accountActive
  const isSuspended =
    !active || String(data.status || '').toLowerCase() === 'suspended'
  const resolvedCustomerId = data.id || customerId
  const walletForTab = useReal ? wallet : data.wallet
  const supportForTab = useReal ? support : data.support

  const handleSuspendSuccess = async () => {
    setActionError('')
    setActionSuccess('Customer suspended.')
    setAccountActive(false)
    await refetch()
  }

  const handleActivate = async () => {
    setActionBusy('activate')
    setActionError('')
    setActionSuccess('')
    try {
      await adminService.activateAdminCustomer(resolvedCustomerId)
      setAccountActive(true)
      setActionSuccess('Customer activated.')
      await refetch()
    } catch (err) {
      setActionError(formatApiErrorMessage(err, 'Failed to activate customer.'))
    } finally {
      setActionBusy('')
    }
  }

  const handleAccountToggle = () => {
    if (actionBusy) return
    if (active) {
      setSuspendOpen(true)
      return
    }
    handleActivate()
  }

  return (
    <div className="px-5 pb-10 pt-4 max-[700px]:px-3">
      <AdminSuspendCustomerModal
        open={suspendOpen}
        onClose={() => setSuspendOpen(false)}
        customerId={resolvedCustomerId}
        customerName={data.name}
        onSuccess={handleSuspendSuccess}
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
              <span
                className={cn(
                  'inline-flex rounded-full px-2.5 py-[3px] text-[11px] font-bold',
                  isSuspended
                    ? 'bg-[#fff0d6] text-[#9a6510]'
                    : 'bg-[#e8f7ed] text-[#147940]',
                )}
              >
                {isSuspended ? 'Suspended' : data.status}
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
                  disabled={Boolean(actionBusy)}
                  onClick={handleAccountToggle}
                  className={cn(
                    'relative mt-0.5 h-[28px] w-[48px] shrink-0 rounded-full transition disabled:opacity-60',
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
                {isSuspended ? (
                  <button
                    type="button"
                    disabled={actionBusy === 'activate'}
                    onClick={handleActivate}
                    className="inline-flex h-[40px] w-fit items-center justify-center rounded-full border border-[#b7e4c7] bg-white px-4 text-[13px] font-bold text-[#1aa054] hover:bg-[#f3faf5] disabled:opacity-60"
                  >
                    {actionBusy === 'activate' ? 'Activating…' : 'Activate customer'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setSuspendOpen(true)}
                    className="inline-flex h-[40px] w-fit items-center justify-center rounded-full border border-[#f0b8b6] bg-white px-4 text-[13px] font-bold text-[#d64044] hover:bg-[#fdebec]"
                  >
                    Suspend customer
                  </button>
                )}
              </div>
            </section>
          </div>
        </>
      ) : tab === 'Wallet & cashback' ? (
        <div className="space-y-3">
          {walletError ? <p className="text-[12px] text-[#d64044]">{walletError}</p> : null}
          {walletLoading && !walletForTab ? (
            <p className="py-10 text-center text-[13px] text-[#7c8780]">Loading wallet…</p>
          ) : (
            <AdminCustomerWallet wallet={walletForTab} />
          )}
        </div>
      ) : tab === 'Support' ? (
        <div className="space-y-3">
          {supportError ? <p className="text-[12px] text-[#d64044]">{supportError}</p> : null}
          {supportLoading && !supportForTab ? (
            <p className="py-10 text-center text-[13px] text-[#7c8780]">Loading support tickets…</p>
          ) : (
            <AdminCustomerSupport support={supportForTab} />
          )}
        </div>
      ) : (
        <section className="rounded-[14px] border border-[#eceeec] bg-white px-5 py-10 text-center shadow-[0_1px_2px_rgba(20,40,28,.03)]">
          <p className="text-[14px] font-medium text-[#17231c]">{tab}</p>
          <p className="mt-1 text-[12.5px] text-[#7c8780]">This tab will be available in a later update.</p>
        </section>
      )}
    </div>
  )
}
