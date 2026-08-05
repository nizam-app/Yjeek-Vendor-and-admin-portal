import { ArrowRight, Plus } from 'lucide-react'
import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useApiResource } from '../../../hooks/useApiResource'
import { apiConfig, isAdminRealApiFeature } from '../../../api/config'
import { adminService } from '../../../services/adminService'
import { ApiState } from '../../../components/admin/ApiState'
import { Badge } from '../../../components/admin/Badge'
import { cn } from '../../../components/admin/cn'

const statTone = {
  ink: 'text-[#17231c]',
  orange: 'text-[#c4841a]',
  green: 'text-[#1aa054]',
}

const codeToneClass = {
  green: 'bg-[#e8f7ed] text-[#147940]',
  purple: 'bg-[#f1eafe] text-[#7752a8]',
  gray: 'bg-[#eff2f0] text-[#637068]',
}

const VIEW_TABS = ['Notifications', 'Promo codes']

function useRealMarketing() {
  return isAdminRealApiFeature('marketing') || !apiConfig.adminUseMockApi
}

function notificationTone(status) {
  if (status === 'Sent' || status === 'Delivered') return 'green'
  if (status === 'Scheduled') return 'blue'
  if (status === 'Failed') return 'red'
  return 'gray'
}

function promoStatusTone(status) {
  if (status === 'Active') return 'green'
  if (status === 'Paused') return 'yellow'
  if (status === 'Expired') return 'gray'
  return 'gray'
}

function isPromoCodesModel(value) {
  return Boolean(
    value &&
      typeof value === 'object' &&
      Array.isArray(value.stats) &&
      Array.isArray(value.columns) &&
      Array.isArray(value.rows),
  )
}

function isNotificationsModel(value) {
  return Boolean(
    value &&
      typeof value === 'object' &&
      Array.isArray(value.channels) &&
      Array.isArray(value.columns) &&
      Array.isArray(value.rows),
  )
}

function Card({ title, children, className }) {
  return (
    <section
      className={cn(
        'rounded-[14px] border border-[#eceeec] bg-white p-5 shadow-[0_1px_2px_rgba(20,40,28,.03)] max-[700px]:p-4',
        className,
      )}
    >
      {title ? <h3 className="mb-4 text-[15px] font-bold text-[#17231c]">{title}</h3> : null}
      {children}
    </section>
  )
}

export default function AdminMarketingPage() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const isPromo = pathname.includes('/promo-codes')
  const tab = isPromo ? 'Promo codes' : 'Notifications'
  const useReal = useRealMarketing()

  const { data, error, isLoading, refetch, setData } = useApiResource(
    () => {
      if (useReal && isPromo) {
        return adminService.listAdminMarketingPromoCodes({
          status: 'all',
          limit: 20,
        })
      }
      if (useReal && !isPromo) {
        return adminService.listAdminMarketingNotifications({
          target: 'all',
          status: 'all',
          limit: 20,
        })
      }
      return adminService.getManagement('marketing')
    },
    [useReal, isPromo],
  )

  // Drop previous tab payload immediately so we never render notifications shape on
  // the promo route (or vice versa) — that was crashing the page white.
  useEffect(() => {
    setData(null)
  }, [isPromo, setData])

  const promoCodes = isPromoCodesModel(data?.promoCodes) ? data.promoCodes : null
  const notifications = isNotificationsModel(data?.notifications) ? data.notifications : null
  const viewTabs = Array.isArray(data?.viewTabs) && data.viewTabs.length ? data.viewTabs : VIEW_TABS
  const header = isPromo ? promoCodes : notifications
  const ready = isPromo ? Boolean(promoCodes) : Boolean(notifications)

  if (!ready) {
    // While switching Notifications ↔ Promo codes, previous tab data is ignored until
    // the matching payload arrives (avoids crashing on .stats/.rows of the wrong shape).
    return (
      <ApiState
        isLoading={isLoading || !error}
        error={error}
        onRetry={refetch}
      />
    )
  }

  return (
    <div className="px-5 py-4 pb-8 max-[700px]:px-3">
      <div className="mb-3.5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-[20px] font-bold tracking-[-0.02em] text-[#17231c]">
            {header.title}
          </h2>
          <p className="mt-0.5 text-[12.5px] text-[#7c8780]">{header.subtitle}</p>
        </div>
        {isPromo ? (
          <button
            type="button"
            onClick={() => navigate('/admin/marketing/promo-codes/new')}
            className="inline-flex h-[34px] items-center gap-1.5 rounded-full bg-[#1aa054] px-4 text-[12px] font-bold text-white shadow-[0_1px_2px_rgba(20,40,28,.15)] hover:bg-[#158a47]"
          >
            <Plus size={14} strokeWidth={2.2} />
            {promoCodes.action || 'New promo code'}
          </button>
        ) : null}
      </div>

      <div className="mb-4 inline-flex items-center gap-1">
        {viewTabs.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => {
              navigate(item === 'Promo codes' ? '/admin/marketing/promo-codes' : '/admin/marketing')
            }}
            className={cn(
              'h-[34px] rounded-full px-4 text-[12.5px] font-bold transition',
              tab === item
                ? 'bg-[#e8f7ed] text-[#1aa054]'
                : 'bg-white text-[#69756d] ring-1 ring-[#e4e8e4] hover:text-[#455249]',
            )}
          >
            {item}
          </button>
        ))}
      </div>

      {isPromo ? (
        <>
          <div className="mb-4 grid grid-cols-4 gap-3 max-[1100px]:grid-cols-2 max-[520px]:grid-cols-1">
            {promoCodes.stats.map(({ label, value, tone }) => (
              <div
                key={label}
                className="rounded-[14px] border border-[#eceeec] bg-white px-4 py-3.5 shadow-[0_1px_2px_rgba(20,40,28,.03)]"
              >
                <p
                  className={cn(
                    'text-[22px] font-bold leading-none tracking-[-0.02em]',
                    statTone[tone] || statTone.ink,
                  )}
                >
                  {value}
                </p>
                <p className="mt-1.5 text-[12px] text-[#7c8780]">{label}</p>
              </div>
            ))}
          </div>

          <Card title="All promo codes">
            <div className="overflow-hidden rounded-[12px] border border-[#eceeec]">
              <div className="w-full max-w-full overflow-x-auto overscroll-x-contain touch-pan-x [-webkit-overflow-scrolling:touch]">
                <table className="w-full min-w-[760px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-[#edf0ee] bg-[#f6f8f6]">
                      {promoCodes.columns.map((column) => (
                        <th
                          key={column}
                          className="whitespace-nowrap px-4 py-2.5 text-[10px] font-medium uppercase tracking-[0.05em] text-[#8a948e]"
                        >
                          {column}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {promoCodes.rows.length ? (
                      promoCodes.rows.map((row) => (
                        <tr key={row.id} className="border-b border-[#edf0ee] bg-white last:border-0">
                          <td className="whitespace-nowrap px-4 py-3.5">
                            <span
                              className={cn(
                                'inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold',
                                codeToneClass[row.codeTone] || codeToneClass.green,
                              )}
                            >
                              {row.code}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3.5 text-[12.5px] text-[#455249]">
                            {row.description}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3.5 text-[12.5px] text-[#455249]">
                            {row.type}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3.5 text-[12.5px] text-[#455249]">
                            {row.maxDisc}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3.5 text-[12.5px] text-[#455249]">
                            {row.usedLimit}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3.5">
                            <Badge tone={promoStatusTone(row.status)}>{row.status}</Badge>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3.5 text-[12.5px] text-[#455249]">
                            {row.expiry}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={promoCodes.columns.length}
                          className="px-4 py-10 text-center text-[13px] text-[#7c8780]"
                        >
                          No promo codes yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        </>
      ) : (
        <>
          <div className="mb-4 grid grid-cols-2 gap-4 max-[900px]:grid-cols-1">
            {notifications.channels.map((channel) => (
              <Card key={channel.id}>
                <h3 className="text-[15px] font-bold text-[#17231c]">{channel.title}</h3>
                <p className="mt-1.5 text-[12.5px] leading-[18px] text-[#7c8780]">
                  {channel.description}
                </p>
                <button
                  type="button"
                  onClick={() => navigate(`/admin/marketing/notifications/${channel.id}`)}
                  className="mt-4 inline-flex h-[32px] items-center gap-1.5 rounded-full bg-[#1aa054] px-3.5 text-[12px] font-bold text-white transition hover:bg-[#158a47]"
                >
                  Open
                  <ArrowRight size={13} strokeWidth={2.2} />
                </button>
              </Card>
            ))}
          </div>

          <Card title="Recent notifications">
            <div className="overflow-hidden rounded-[12px] border border-[#eceeec]">
              <div className="w-full max-w-full overflow-x-auto overscroll-x-contain touch-pan-x [-webkit-overflow-scrolling:touch]">
                <table className="w-full min-w-[640px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-[#edf0ee] bg-[#f6f8f6]">
                      {notifications.columns.map((column) => (
                        <th
                          key={column}
                          className="whitespace-nowrap px-4 py-2.5 text-[10px] font-medium uppercase tracking-[0.05em] text-[#8a948e]"
                        >
                          {column}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {notifications.rows.length ? (
                      notifications.rows.map((row) => (
                        <tr
                          key={row.id}
                          role="link"
                          tabIndex={0}
                          onClick={() => navigate(`/admin/marketing/notifications/${row.id}`)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault()
                              navigate(`/admin/marketing/notifications/${row.id}`)
                            }
                          }}
                          className="cursor-pointer border-b border-[#edf0ee] bg-white last:border-0 hover:bg-[#fafbfa]"
                        >
                          <td className="whitespace-nowrap px-4 py-3.5 text-[12.5px] text-[#455249]">
                            {row.target}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3.5 text-[13px] font-medium text-[#17231c]">
                            {row.title}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3.5 text-[12.5px] text-[#455249]">
                            {row.channel}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3.5 text-[12.5px] text-[#455249]">
                            {row.sentAt}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3.5">
                            <Badge tone={notificationTone(row.status)}>{row.status}</Badge>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={notifications.columns.length}
                          className="px-4 py-10 text-center text-[13px] text-[#7c8780]"
                        >
                          No notifications yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  )
}
