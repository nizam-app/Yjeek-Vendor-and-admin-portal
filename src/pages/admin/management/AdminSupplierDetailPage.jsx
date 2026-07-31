import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, Star } from 'lucide-react'
import editIcon from '../../../assets/icon-edit.png'
import motoBikeIcon from '../../../assets/moto_bike.png'
import carIcon from '../../../assets/💨.png'
import { useApiResource } from '../../../hooks/useApiResource'
import { apiConfig, isAdminRealApiFeature } from '../../../api/config'
import { adminService } from '../../../services/adminService'
import { ApiState } from '../../../components/admin/ApiState'
import { Badge } from '../../../components/admin/Badge'
import { cn } from '../../../components/admin/cn'

const MOCK_SUPPLIER_DETAILS = {
  'sup-speedx': {
    id: 'SUP-3PL-02',
    slug: 'sup-speedx',
    name: 'SpeedX Logistics',
    initials: 'SX',
    avatarBg: '#1aa054',
    avatarText: '#ffffff',
    type: '3PL',
    typeLabel: '3PL partner',
    status: 'Active',
    zone: 'Manama',
    joinedShort: 'Jan 2025',
    joinedFull: '12 Jan 2025',
    rating: '4.7',
    contactPerson: 'Ahmed Ali',
    phone: '+973 3300 1122',
    email: 'ops@speedx.com',
    metrics: [
      { label: 'Total champs', value: '90', tone: 'ink' },
      { label: 'Online now', value: '38', tone: 'green' },
      { label: 'Deliveries (7d)', value: '1,240', tone: 'ink' },
      { label: 'On-time', value: '94%', tone: 'ink' },
    ],
    champsCount: 90,
    champs: [
      { name: 'Khalid Ahmed', vehicle: 'Bike', zone: 'Manama', status: 'Online' },
      { name: 'Sami Hasan', vehicle: 'Car', zone: 'Muharraq', status: 'Online' },
      { name: 'Omar Yusuf', vehicle: 'Bike', zone: 'Riffa', status: 'Offline' },
      { name: 'Ali Saleh', vehicle: 'Car', zone: 'Manama', status: 'On delivery' },
    ],
    periodFrom: '01 Jun 2026',
    periodTo: '27 Jun 2026',
    performance: [
      { value: '1,240', label: 'Deliveries', tone: 'ink' },
      { value: '96%', label: 'Completion rate', tone: 'green' },
      { value: '24 min', label: 'Avg delivery time', tone: 'ink' },
      { value: '38', label: 'Cancellations', tone: 'red' },
      { value: '94%', label: 'On-time rate', tone: 'ink' },
    ],
  },
  'sup-yjeek': {
    id: 'SUP-IN-01',
    slug: 'sup-yjeek',
    name: 'Yjeek Fleet',
    initials: 'YF',
    avatarBg: '#1aa054',
    avatarText: '#ffffff',
    type: 'In-house',
    typeLabel: 'In-house',
    status: 'Active',
    zone: 'Manama',
    joinedShort: 'Mar 2024',
    joinedFull: '01 Mar 2024',
    rating: '4.8',
    contactPerson: 'Ops Desk',
    phone: '+973 1700 1000',
    email: 'fleet@yjeek.com',
    metrics: [
      { label: 'Total champs', value: '180', tone: 'ink' },
      { label: 'Online now', value: '92', tone: 'green' },
      { label: 'Deliveries (7d)', value: '3,410', tone: 'ink' },
      { label: 'On-time', value: '96%', tone: 'ink' },
    ],
    champsCount: 180,
    champs: [
      { name: 'Khalid Ahmed', vehicle: 'Bike', zone: 'Manama', status: 'Online' },
      { name: 'Sami Hasan', vehicle: 'Car', zone: 'Muharraq', status: 'On delivery' },
      { name: 'Omar Yusuf', vehicle: 'Bike', zone: 'Riffa', status: 'Offline' },
      { name: 'Ali Saleh', vehicle: 'Car', zone: 'Manama', status: 'Online' },
    ],
    periodFrom: '01 Jun 2026',
    periodTo: '27 Jun 2026',
    performance: [
      { value: '3,410', label: 'Deliveries', tone: 'ink' },
      { value: '97%', label: 'Completion rate', tone: 'green' },
      { value: '22 min', label: 'Avg delivery time', tone: 'ink' },
      { value: '41', label: 'Cancellations', tone: 'red' },
      { value: '96%', label: 'On-time rate', tone: 'ink' },
    ],
  },
  'sup-rapidgo': {
    id: 'SUP-3PL-03',
    slug: 'sup-rapidgo',
    name: 'RapidGo',
    initials: 'RG',
    avatarBg: '#2b66a5',
    avatarText: '#ffffff',
    type: '3PL',
    typeLabel: '3PL partner',
    status: 'Active',
    zone: 'Muharraq',
    joinedShort: 'Aug 2025',
    joinedFull: '18 Aug 2025',
    rating: '4.5',
    contactPerson: 'Sara Nasser',
    phone: '+973 3400 2211',
    email: 'ops@rapidgo.bh',
    metrics: [
      { label: 'Total champs', value: '42', tone: 'ink' },
      { label: 'Online now', value: '18', tone: 'green' },
      { label: 'Deliveries (7d)', value: '620', tone: 'ink' },
      { label: 'On-time', value: '91%', tone: 'ink' },
    ],
    champsCount: 42,
    champs: [
      { name: 'Hassan Ali', vehicle: 'Bike', zone: 'Muharraq', status: 'Online' },
      { name: 'Noor Faisal', vehicle: 'Car', zone: 'Manama', status: 'On delivery' },
      { name: 'Yusuf Karim', vehicle: 'Bike', zone: 'Riffa', status: 'Offline' },
      { name: 'Rami Said', vehicle: 'Car', zone: 'Isa Town', status: 'Online' },
    ],
    periodFrom: '01 Jun 2026',
    periodTo: '27 Jun 2026',
    performance: [
      { value: '620', label: 'Deliveries', tone: 'ink' },
      { value: '93%', label: 'Completion rate', tone: 'green' },
      { value: '27 min', label: 'Avg delivery time', tone: 'ink' },
      { value: '22', label: 'Cancellations', tone: 'red' },
      { value: '91%', label: 'On-time rate', tone: 'ink' },
    ],
  },
}

const metricTone = {
  ink: 'text-[#17231c]',
  green: 'text-[#1aa054]',
  red: 'text-[#e14b42]',
}

function typeTone(type) {
  if (type === 'In-house') return 'green'
  if (type === '3PL') return 'blue'
  return 'gray'
}

function statusTone(status) {
  if (status === 'Online') return 'green'
  if (status === 'On delivery') return 'blue'
  return 'gray'
}

function VehicleLabel({ type }) {
  if (type === 'Bike') {
    return (
      <span className="inline-flex items-center gap-1.5">
        <img src={motoBikeIcon} alt="" className="h-3.5 w-3.5 object-contain" />
        Bike
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5">
      <img src={carIcon} alt="" className="h-3.5 w-3.5 object-contain" />
      Car
    </span>
  )
}

function InfoItem({ label, children, valueClassName }) {
  return (
    <div className="min-w-0">
      <p className="text-[12px] text-[#7c8780]">{label}</p>
      <p className={cn('mt-1 text-[13px] font-medium text-[#17231c]', valueClassName)}>{children}</p>
    </div>
  )
}

function PeriodField({ label, value }) {
  return (
    <label className="inline-flex h-[36px] items-center gap-2 rounded-full border border-[#e4e8e4] bg-white px-3">
      <span className="text-[12px] font-medium text-[#7c8780]">📅</span>
      <span className="text-[12px] font-medium text-[#7c8780]">{label}</span>
      <input
        type="text"
        readOnly
        value={value}
        className="w-[96px] border-0 bg-transparent p-0 text-[12.5px] font-medium text-[#17231c] outline-none"
      />
    </label>
  )
}

function PerfCard({ value, label, tone }) {
  return (
    <div className="rounded-[12px] border border-[#eceeec] bg-white px-4 py-3.5 shadow-[0_1px_2px_rgba(20,40,28,.03)]">
      <p
        className={cn(
          'text-[20px] font-bold leading-none tracking-[-0.02em]',
          metricTone[tone] || metricTone.ink,
        )}
      >
        {value}
      </p>
      <p className="mt-1.5 text-[12px] text-[#7c8780]">{label}</p>
    </div>
  )
}

function defaultPeriodFilters() {
  const now = new Date()
  const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString()
  const to = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999),
  ).toISOString()
  return { from, to }
}

export default function AdminSupplierDetailPage() {
  const { supplierId } = useParams()
  const navigate = useNavigate()
  const useRealFleet = isAdminRealApiFeature('fleet') || !apiConfig.adminUseMockApi
  const [period] = useState(defaultPeriodFilters)

  const { data: apiData, error, isLoading, refetch } = useApiResource(
    () => {
      if (!useRealFleet) {
        return Promise.resolve({
          data: MOCK_SUPPLIER_DETAILS[supplierId] || MOCK_SUPPLIER_DETAILS['sup-speedx'],
        })
      }
      return adminService.getAdminFleetSupplier(supplierId, period)
    },
    [supplierId, useRealFleet, period.from, period.to],
  )

  const data = useMemo(() => {
    if (apiData) return apiData
    if (!useRealFleet) return MOCK_SUPPLIER_DETAILS[supplierId] || MOCK_SUPPLIER_DETAILS['sup-speedx']
    return null
  }, [apiData, supplierId, useRealFleet])

  if (!data) return <ApiState isLoading={isLoading} error={error} onRetry={refetch} />

  const statusActive = String(data.status || '').toLowerCase() === 'active'

  return (
    <div className="px-5 pb-10 pt-4 max-[700px]:px-3">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/admin/fleet/suppliers')}
          className="inline-flex h-[34px] shrink-0 items-center gap-1 rounded-full border border-[#e4e8e4] bg-white px-3 text-[13px] font-medium text-[#455249] shadow-[0_1px_2px_rgba(20,40,28,.04)] hover:bg-[#f6f8f6]"
        >
          <ChevronLeft size={15} strokeWidth={2.2} />
          Suppliers
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
              <Badge tone={typeTone(data.type)} className="px-2.5 py-[3px] text-[11px] font-bold">
                {data.type}
              </Badge>
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-[3px] text-[11px] font-bold',
                  statusActive
                    ? 'bg-[#e8f7ed] text-[#147940]'
                    : 'bg-[#f3f5f3] text-[#69756d]',
                )}
              >
                <span
                  className={cn(
                    'h-1.5 w-1.5 rounded-full',
                    statusActive ? 'bg-[#1aa054]' : 'bg-[#9aa49d]',
                  )}
                />
                {data.status}
              </span>
            </div>
            <p className="mt-1 flex flex-wrap items-center gap-x-1.5 text-[12.5px] text-[#7c8780]">
              <span>{data.displayCode || data.id}</span>
              <span>·</span>
              <span>{data.zone}</span>
              <span>·</span>
              <span>joined {data.joinedShort}</span>
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
            onClick={() =>
              navigate(`/admin/fleet/suppliers/${encodeURIComponent(supplierId)}/edit`)
            }
            className="inline-flex h-[36px] items-center gap-1.5 rounded-full border border-[#dfe4e0] bg-white px-3.5 text-[13px] font-medium text-[#127338] shadow-[0_1px_2px_rgba(20,40,28,.04)] hover:bg-[#f6f8f6]"
          >
            <img src={editIcon} alt="" className="h-3.5 w-3.5 object-contain" />
            Edit
          </button>
          <button
            type="button"
            className="inline-flex h-[36px] items-center rounded-full border border-[#f3c8ca] bg-[#fdebec] px-3.5 text-[13px] font-bold text-[#d64044] hover:bg-[#f9d9da]"
          >
            {statusActive ? 'Deactivate' : 'Activate'}
          </button>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-4 gap-3 max-[900px]:grid-cols-2 max-[480px]:grid-cols-1">
        {(data.metrics || []).map(({ label, value, tone }) => (
          <div
            key={label}
            className="rounded-[14px] border border-[#eceeec] bg-white px-4 py-3.5 shadow-[0_1px_2px_rgba(20,40,28,.03)]"
          >
            <p
              className={cn(
                'mt-2 text-[22px] font-bold leading-none tracking-[-0.02em]',
                metricTone[tone] || metricTone.ink,
              )}
            >
              {value}
            </p>
            <p className="text-[12px] text-[#7c8780]">{label}</p>
          </div>
        ))}
      </div>

      <section className="mb-4 rounded-[14px] border border-[#eceeec] bg-white px-5 py-4 shadow-[0_1px_2px_rgba(20,40,28,.03)] max-[700px]:px-4">
        <h3 className="mb-4 text-[15px] font-bold text-[#17231c]">Supplier info</h3>
        <div className="grid grid-cols-3 gap-x-8 gap-y-4 max-[800px]:grid-cols-2 max-[520px]:grid-cols-1">
          <InfoItem label="Type">{data.typeLabel}</InfoItem>
          <InfoItem
            label="Status"
            valueClassName={statusActive ? 'font-medium text-green-800' : 'font-medium text-[#69756d]'}
          >
            {data.status}
          </InfoItem>
          <div className="max-[800px]:hidden" />
          <InfoItem label="Contact person">{data.contactPerson}</InfoItem>
          <InfoItem label="Phone">{data.phone}</InfoItem>
          <InfoItem label="Email">{data.email}</InfoItem>
          <InfoItem label="Joined">{data.joinedFull}</InfoItem>
        </div>
      </section>

      <section className="mb-4 rounded-[14px] border border-[#eceeec] bg-white p-5 shadow-[0_1px_2px_rgba(20,40,28,.03)] max-[700px]:p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-[15px] font-bold text-[#17231c]">Champs ({data.champsCount})</h3>
          <button
            type="button"
            onClick={() => navigate('/admin/fleet')}
            className="inline-flex h-[32px] items-center rounded-full border border-[#e4e8e4] bg-white px-3 text-[12px] font-bold text-[#17231c] hover:bg-[#f6f8f6]"
          >
            View all champs
          </button>
        </div>

        <div className="overflow-hidden rounded-[12px] border border-[#eceeec]">
          <div className="w-full max-w-full overflow-x-auto overscroll-x-contain touch-pan-x [-webkit-overflow-scrolling:touch]">
            <table className="w-full min-w-[560px] border-collapse text-left">
              <thead>
                <tr className="border-b border-[#edf0ee] bg-[#f6f8f6]">
                  {['Champ', 'Vehicle', 'Zone', 'Status'].map((column) => (
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
                {(data.champs || []).length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-[13px] text-[#7c8780]">
                      No champs for this supplier.
                    </td>
                  </tr>
                ) : null}
                {(data.champs || []).map((row) => (
                  <tr
                    key={row.id || row.name}
                    className={cn(
                      'border-b border-[#edf0ee] bg-white last:border-0',
                      row.id ? 'cursor-pointer hover:bg-[#f6f8f6]' : '',
                    )}
                    onClick={() => {
                      if (row.id) navigate(`/admin/fleet/${encodeURIComponent(row.id)}`)
                    }}
                  >
                    <td className="whitespace-nowrap px-4 py-3.5 text-[13px] font-medium text-[#17231c]">
                      {row.name}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-[12.5px] text-[#455249]">
                      <VehicleLabel type={row.vehicle} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-[12.5px] text-[#455249]">
                      {row.zone}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5">
                      <Badge tone={statusTone(row.status)}>{row.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="rounded-[14px] border border-[#eceeec] bg-white px-5 py-4 shadow-[0_1px_2px_rgba(20,40,28,.03)] max-[700px]:px-4">
        <h3 className="text-[15px] font-bold text-[#17231c]">Performance</h3>

        <div className="mt-3 mb-4 flex flex-wrap items-center gap-2">
          <span className="text-[12px] font-medium text-[#7c8780]">Period</span>
          <PeriodField label="From" value={data.periodFrom} />
          <PeriodField label="To" value={data.periodTo} />
        </div>

        <div className="grid grid-cols-3 gap-3 max-[800px]:grid-cols-2 max-[520px]:grid-cols-1">
          {(data.performance || []).slice(0, 3).map((item) => (
            <PerfCard key={item.label} {...item} />
          ))}
        </div>
        <div className="mt-3 grid grid-cols-3 gap-3 max-[800px]:grid-cols-2 max-[520px]:grid-cols-1">
          {(data.performance || []).slice(3).map((item) => (
            <PerfCard key={item.label} {...item} />
          ))}
        </div>
      </section>
    </div>
  )
}
