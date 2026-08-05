import { ChevronLeft, Mail, RotateCcw, Smartphone, Trash2 } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { useApiResource } from '../../../hooks/useApiResource'
import { apiConfig, isAdminRealApiFeature } from '../../../api/config'
import { adminService } from '../../../services/adminService'
import { ApiState } from '../../../components/admin/ApiState'
import { cn } from '../../../components/admin/cn'

const statTone = {
  ink: 'text-[#17231c]',
  green: 'text-[#1aa054]',
  red: 'text-[#d6453d]',
}

const typeTone = {
  Promo: 'bg-[#e8f7ed] text-[#147940]',
  Info: 'bg-[#eaf2fc] text-[#2b66a5]',
  Alert: 'bg-[#fff5d9] text-[#9a6510]',
  Policy: 'bg-[#f1eafe] text-[#7752a8]',
}

function useRealMarketing() {
  return isAdminRealApiFeature('marketing') || !apiConfig.adminUseMockApi
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

function ChannelIcon({ icon }) {
  if (icon === 'mail') {
    return <Mail size={15} strokeWidth={1.8} className="text-[#59655e]" aria-hidden />
  }
  return <Smartphone size={15} strokeWidth={1.8} className="text-[#59655e]" aria-hidden />
}

export default function AdminNotificationDetailPage() {
  const navigate = useNavigate()
  const { notificationId } = useParams()
  const useReal = useRealMarketing()

  const { data, error, isLoading, refetch } = useApiResource(
    () => {
      if (useReal) {
        return adminService.getAdminMarketingNotification(notificationId)
      }
      return adminService.getManagement('marketing')
    },
    [notificationId, useReal],
  )

  if (!data) return <ApiState isLoading={isLoading} error={error} onRetry={refetch} />

  const detail = useReal ? data : data.notifications?.details?.[notificationId]

  if (!detail) {
    return (
      <div className="px-5 py-4 pb-8 max-[700px]:px-3">
        <button
          type="button"
          onClick={() => navigate('/admin/marketing')}
          className="mb-4 inline-flex h-[34px] items-center gap-1 rounded-full border border-[#e4e8e4] bg-white px-3 text-[13px] font-medium text-[#455249] hover:bg-[#f6f8f6]"
        >
          <ChevronLeft size={15} strokeWidth={2} />
          Notifications
        </button>
        <Card>
          <p className="text-[13px] text-[#7c8780]">Notification not found.</p>
        </Card>
      </div>
    )
  }

  const metaRows = [
    ['Audience', detail.audience],
    ['Recipients', detail.recipientsLabel],
    ['Channels', detail.channelsLabel],
    ['Sent date', detail.sentDate],
    ['Sent time', detail.sentTime],
    ['Status', detail.status],
    ['Sent by', detail.sentBy],
  ]

  return (
    <div className="px-5 py-4 pb-8 max-[700px]:px-3">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-start gap-3">
          <button
            type="button"
            onClick={() => navigate('/admin/marketing')}
            className="inline-flex h-[34px] shrink-0 items-center gap-1 rounded-full border border-[#e4e8e4] bg-white px-3 text-[13px] font-medium text-[#455249] shadow-[0_1px_2px_rgba(20,40,28,.04)] hover:bg-[#f6f8f6]"
          >
            <ChevronLeft size={15} strokeWidth={2} />
            Notifications
          </button>
          <div className="min-w-0">
            <h2 className="text-[20px] font-bold tracking-[-0.02em] text-[#17231c]">
              Notification details
            </h2>
            <p className="mt-0.5 text-[12.5px] text-[#7c8780]">{detail.sentLabel}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="inline-flex h-[34px] items-center gap-1.5 rounded-full border border-[#e4e8e4] bg-white px-3.5 text-[12.5px] font-bold text-[#455249] hover:bg-[#f6f8f6]"
          >
            <RotateCcw size={14} strokeWidth={2.2} className="text-[#1aa054]" />
            Resend
          </button>
          <button
            type="button"
            className="inline-flex h-[34px] items-center gap-1.5 rounded-full border border-[#f0d4d2] bg-white px-3.5 text-[12.5px] font-bold text-[#d6453d] hover:bg-[#fdf6f5]"
          >
            <Trash2 size={14} strokeWidth={2.2} />
            Delete
          </button>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-4 gap-3 max-[1100px]:grid-cols-2 max-[520px]:grid-cols-1">
        {detail.stats.map(({ label, value, tone }) => (
          <div
            key={label}
            className="rounded-[14px] border border-[#eceeec] bg-white px-4 py-3.5 shadow-[0_1px_2px_rgba(20,40,28,.03)]"
          >
            <p className="text-[12px] text-[#7c8780]">{label}</p>
            <p
              className={cn(
                'mt-1.5 text-[22px] font-bold leading-none tracking-[-0.02em]',
                statTone[tone] || statTone.ink,
              )}
            >
              {value}
            </p>
          </div>
        ))}
      </div>

      <div className="mb-4 grid grid-cols-[minmax(0,1.35fr)_minmax(260px,1fr)] items-start gap-4 max-[900px]:grid-cols-1">
        <Card title="Message">
          <span
            className={cn(
              'mb-3 inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold',
              typeTone[detail.type] || typeTone.Info,
            )}
          >
            {detail.type}
          </span>
          <div className="rounded-[12px] border border-[#eceeec] bg-[#f6f8f6] p-3.5">
            <div className="flex items-start gap-2.5">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#1aa054] text-[13px] font-bold text-white">
                Y
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-bold text-[#17231c]">
                  {detail.sender || 'Yjeek Admin'}
                </p>
                <p className="mt-1 text-[13px] font-bold text-[#17231c]">{detail.title}</p>
                <p className="mt-1.5 text-[12.5px] leading-[18px] text-[#59655e]">{detail.body}</p>
              </div>
            </div>
          </div>
        </Card>

        <Card title="Audience & delivery">
          <dl className="space-y-3">
            {metaRows.map(([label, value]) => (
              <div
                key={label}
                className="grid grid-cols-[120px_minmax(0,1fr)] gap-3 max-[420px]:grid-cols-1 border-b border-[#edf0ee] pb-3"
              >
                <dt className="text-[12.5px] text-[#7c8780]">{label}</dt>
                <dd className="text-[12.5px] font-medium text-[#17231c]">{value}</dd>
              </div>
            ))}
          </dl>
        </Card>
      </div>

      <Card title="Delivery by channel">
        <div className="overflow-hidden rounded-[12px] border border-[#eceeec]">
          <div className="w-full max-w-full overflow-x-auto overscroll-x-contain touch-pan-x [-webkit-overflow-scrolling:touch]">
            <table className="w-full min-w-[520px] border-collapse text-left">
              <thead>
                <tr className="border-b border-[#edf0ee] bg-[#f6f8f6]">
                  {['Channel', 'Sent', 'Delivered', 'Opened', 'Failed'].map((column) => (
                    <th
                      key={column}
                      className="whitespace-nowrap px-4 py-2.5 text-[10px] font-medium uppercase tracking-[0.05em] text-[#8a948e]"
                    >
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white">
                {detail.channelRows?.length ? (
                  detail.channelRows.map((row) => (
                    <tr key={row.channel} className="border-b border-[#edf0ee] bg-white last:border-0">
                      <td className="whitespace-nowrap px-4 py-3.5">
                        <span className="inline-flex items-center gap-2 text-[13px] font-medium text-[#17231c]">
                          <ChannelIcon icon={row.icon} />
                          {row.channel}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-[12.5px] text-[#455249]">
                        {row.sent}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-[12.5px] text-[#455249]">
                        {row.delivered}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-[12.5px] text-[#455249]">
                        {row.opened}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-[12.5px] text-[#455249]">
                        {row.failed}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-[13px] text-[#7c8780]">
                      No channel delivery data yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </div>
  )
}
