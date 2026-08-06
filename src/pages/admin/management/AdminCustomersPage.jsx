import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search } from 'lucide-react'
import { useApiResource } from '../../../hooks/useApiResource'
import { apiConfig, isAdminRealApiFeature } from '../../../api/config'
import { adminService } from '../../../services/adminService'
import { ApiState } from '../../../components/admin/ApiState'
import { Badge } from '../../../components/admin/Badge'
import { AdminFilterSelect } from '../../../components/admin/AdminFilterSelect'
import { cn } from '../../../components/admin/cn'

const AGE_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'under18', label: 'Under 18' },
  { value: '18-24', label: '18–24' },
  { value: '25-34', label: '25–34' },
  { value: '35-44', label: '35–44' },
  { value: '45+', label: '45+' },
]

const GENDER_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'Male', label: 'Male' },
  { value: 'Female', label: 'Female' },
  { value: 'Other', label: 'Other' },
]

function matchesAgeFilter(age, filter) {
  if (!filter) return true
  const n = typeof age === 'number' ? age : Number(age)
  if (!Number.isFinite(n)) return false
  if (filter === 'under18') return n < 18
  if (filter === '18-24') return n >= 18 && n <= 24
  if (filter === '25-34') return n >= 25 && n <= 34
  if (filter === '35-44') return n >= 35 && n <= 44
  if (filter === '45+') return n >= 45
  return true
}

const statTone = {
  ink: 'text-[#17231c]',
  green: 'text-[#1aa054]',
  orange: 'text-[#c4841a]',
  red: 'text-[#e14b42]',
}

function customerStatusTone(status) {
  if (status === 'Active' || status === 'New') return 'green'
  if (status === 'Suspended') return 'yellow'
  return 'gray'
}

function useRealCustomers() {
  return isAdminRealApiFeature('customers') || !apiConfig.adminUseMockApi
}

export default function AdminCustomersPage() {
  const navigate = useNavigate()
  const useReal = useRealCustomers()
  const [tab, setTab] = useState('All')
  const [query, setQuery] = useState('')
  const [search, setSearch] = useState('')
  const [ageFilter, setAgeFilter] = useState('')
  const [genderFilter, setGenderFilter] = useState('')

  const { data, error, isLoading, refetch } = useApiResource(
    () => {
      if (useReal) {
        return adminService.listAdminCustomers({
          search,
          statusTab: tab,
          limit: 20,
        })
      }
      return adminService.getManagement('customers')
    },
    [useReal, search, tab],
  )

  const rows = useMemo(() => {
    if (!data?.rows) return []
    const base = useReal
      ? data.rows
      : data.rows.filter((row) => {
          const matchesTab = tab === 'All' || row.status === tab
          const haystack = `${row.name} ${row.contact} ${row.email} ${row.status}`.toLowerCase()
          return matchesTab && haystack.includes(query.toLowerCase())
        })
    return base.filter((row) => {
      const matchesGender =
        !genderFilter || String(row.gender || '').toLowerCase() === genderFilter.toLowerCase()
      const matchesAge = matchesAgeFilter(row.age, ageFilter)
      return matchesGender && matchesAge
    })
  }, [data, tab, query, useReal, ageFilter, genderFilter])

  if (!data) return <ApiState isLoading={isLoading} error={error} onRetry={refetch} />

  const openCustomer = (customerId) => {
    navigate(`/admin/customers/${encodeURIComponent(customerId)}`)
  }

  const onSearchKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      if (useReal) setSearch(query.trim())
    }
  }

  return (
    <div className="px-5 py-4 pb-8 max-[700px]:px-3">
      <div className="mb-3.5 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[20px] font-bold tracking-[-0.02em] text-[#17231c]">{data.title}</h2>
          <p className="mt-1 max-w-[560px] text-[12.5px] leading-[18px] text-[#7c8780]">
            {data.subtitle}
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/admin/customers/new')}
          className="inline-flex h-[34px] shrink-0 items-center gap-1.5 rounded-full bg-[#1aa054] px-4 text-[12px] font-bold text-white shadow-[0_1px_2px_rgba(20,40,28,.15)] hover:bg-[#158a47]"
        >
          <Plus size={14} strokeWidth={2.2} />
          {data.action}
        </button>
      </div>

      <div className="mb-4 grid grid-cols-6 gap-3 max-[1200px]:grid-cols-3 max-[700px]:grid-cols-2 max-[480px]:grid-cols-1">
        {data.stats.map(({ label, value, tone }) => (
          <div
            key={label}
            className="rounded-[14px] border border-[#eceeec] bg-white px-4 py-3.5 shadow-[0_1px_2px_rgba(20,40,28,.03)]"
          >
            <p className="text-[12px] text-[#7c8780]">{label}</p>
            <p className={cn('mt-1.5 text-[22px] font-bold leading-none tracking-[-0.02em]', statTone[tone] || statTone.ink)}>
              {value}
            </p>
          </div>
        ))}
      </div>

      <div className="mb-3 flex flex-wrap items-end gap-2">
        <div className="flex flex-wrap items-center rounded-[10px] bg-[#e9ebe9] p-[3px]">
          {data.tabs.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setTab(item)}
              className={cn(
                'h-[28px] rounded-[8px] px-3.5 text-[12px]',
                tab === item
                  ? 'bg-white font-bold text-[#17231c] shadow-[0_1px_3px_rgba(20,40,28,.12)]'
                  : 'font-medium text-[#69756d] hover:text-[#455249]',
              )}
            >
              {item}
            </button>
          ))}
        </div>
        <AdminFilterSelect
          fieldLabel="Age"
          label="Filter by age"
          shape="square"
          options={AGE_OPTIONS}
          value={ageFilter}
          onChange={setAgeFilter}
          className="h-[32px] min-w-[96px] font-bold text-[#6B736E]"
        />
        <AdminFilterSelect
          fieldLabel="Gender"
          label="Filter by gender"
          shape="square"
          options={GENDER_OPTIONS}
          value={genderFilter}
          onChange={setGenderFilter}
          className="h-[32px] min-w-[96px] font-bold text-[#6B736E]"
        />

        <span className="flex-1" />

        <label className="flex h-[32px] w-[240px] items-center gap-2 rounded-sm border border-[#e4e8e4] bg-white px-3 shadow-[0_1px_2px_rgba(20,40,28,.04)] max-[700px]:w-full">
          <Search size={14} className="text-[#9aa49d]" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              if (!useReal) return
            }}
            onBlur={() => {
              if (useReal) setSearch(query.trim())
            }}
            onKeyDown={onSearchKeyDown}
            className="min-w-0 flex-1 border-0 bg-transparent text-[12px] text-[#17231c] outline-none placeholder:text-[#9aa49d]"
            placeholder="Search name / phone / email"
          />
        </label>
      </div>

      <section className="overflow-hidden rounded-[14px] border border-[#eceeec] bg-white shadow-[0_1px_2px_rgba(20,40,28,.03)]">
        <div className="w-full max-w-full overflow-x-auto overscroll-x-contain touch-pan-x [-webkit-overflow-scrolling:touch]">
          <table className="w-full min-w-[1180px] border-collapse text-left">
            <thead>
              <tr className="border-b border-[#edf0ee] bg-[#fafbfa]">
                {data.columns.map((column) => (
                  <th
                    key={column}
                    className="whitespace-nowrap px-4 py-3 text-[10px] font-medium uppercase tracking-[0.05em] text-[#8a948e]"
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.id}
                  role="link"
                  tabIndex={0}
                  onClick={() => openCustomer(row.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      openCustomer(row.id)
                    }
                  }}
                  className="cursor-pointer border-b border-[#f0f2f0] last:border-0 even:bg-[#fafbfa] hover:bg-[#f6f8f6]"
                >
                  <td className="whitespace-nowrap px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="grid h-8 w-8 shrink-0 place-items-center rounded-sm text-[11px] font-bold"
                        style={{ background: row.avatarBg, color: row.avatarText }}
                      >
                        {row.initials}
                      </span>
                      <span className="text-[13px] font-bold text-[#17231c]">{row.name}</span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-[12.5px] text-[#455249]">{row.contact}</td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-[12.5px] text-[#455249]">{row.email}</td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-[12.5px] text-[#455249]">{row.gender}</td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-[12.5px] text-[#455249]">{row.age}</td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-[12.5px] text-[#455249]">{row.orders}</td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-[12.5px] text-[#455249]">{row.spent}</td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-[12.5px] font-medium text-[#1aa054]">{row.wallet}</td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-[12.5px] text-[#455249]">{row.refund}</td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-[12.5px] text-[#455249]">{row.refundAmount}</td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-[12.5px] text-[#455249]">{row.joined}</td>
                  <td className="whitespace-nowrap px-4 py-3.5">
                    <Badge tone={customerStatusTone(row.status)}>{row.status}</Badge>
                  </td>
                </tr>
              ))}
              {!rows.length ? (
                <tr>
                  <td
                    colSpan={data.columns.length}
                    className="px-4 py-10 text-center text-[13px] text-[#7c8780]"
                  >
                    No customers found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
