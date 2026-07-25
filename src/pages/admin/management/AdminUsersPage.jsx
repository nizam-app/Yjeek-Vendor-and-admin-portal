import { useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Calendar, ChevronDown, Download, Plus, Search } from 'lucide-react'
import { useApiResource } from '../../../hooks/useApiResource'
import { adminService } from '../../../services/adminService'
import { ApiState } from '../../../components/admin/ApiState'
import { Badge } from '../../../components/admin/Badge'
import { cn } from '../../../components/admin/cn'

const statTone = {
  ink: 'text-[#17231c]',
  green: 'text-[#1aa054]',
  red: 'text-[#d6453d]',
}

const roleToneClass = {
  purple: 'bg-[#f1eafe] text-[#7752a8]',
  blue: 'bg-[#eaf2fc] text-[#2b66a5]',
  green: 'bg-[#e8f7ed] text-[#147940]',
  orange: 'bg-[#fff1e4] text-[#c4841a]',
  cyan: 'bg-[#e8f6fb] text-[#2a7a96]',
  gray: 'bg-[#eff2f0] text-[#637068]',
}

function statusTone(status) {
  if (status === 'Active') return 'green'
  if (status === 'Pending') return 'yellow'
  if (status === 'Suspended') return 'red'
  return 'gray'
}

function twoFaTone(value) {
  if (value === 'On') return 'green'
  if (value === 'Off') return 'gray'
  return null
}

function activityTypeTone(type) {
  if (type === 'Edit') return 'blue'
  if (type === 'Create') return 'green'
  if (type === 'Approve') return 'yellow'
  if (type === 'Delete') return 'red'
  if (type === 'Export') return 'purple'
  return 'gray'
}

function FilterSelect({ options, value, onChange, label }) {
  return (
    <div className="relative inline-flex h-[34px] items-center rounded-sm border border-[#e4e8e4] bg-white pl-3 pr-7 text-[12px] font-medium text-[#455249]">
      <span className="whitespace-nowrap">{value}</span>
      <ChevronDown
        size={13}
        strokeWidth={2.2}
        className="pointer-events-none absolute right-2.5 text-[#7c8780]"
        aria-hidden
      />
      <select
        aria-label={label}
        className="absolute inset-0 h-full w-full cursor-pointer appearance-none opacity-0 outline-none"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  )
}

function DateFilter({ label, value, onChange }) {
  return (
    <label className="relative inline-flex h-[34px] items-center gap-2 rounded-sm border border-[#e4e8e4] bg-white pl-3 pr-3 text-[12px] font-medium text-[#455249]">
      <Calendar size={13} strokeWidth={2.2} className="text-[#7c8780]" aria-hidden />
      <span className="whitespace-nowrap text-[#7c8780]">{label}</span>
      <span className="whitespace-nowrap">{value}</span>
      <input
        type="date"
        aria-label={label}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0 outline-none"
        onChange={(event) => {
          if (!event.target.value) return
          const date = new Date(`${event.target.value}T00:00:00`)
          onChange(
            date.toLocaleDateString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            }),
          )
        }}
      />
    </label>
  )
}

function tabFromPath(pathname) {
  if (pathname.includes('/roles')) return 'Roles'
  if (pathname.includes('/activity')) return 'Activity log'
  return 'Users'
}

function tabPath(item) {
  if (item === 'Roles') return '/admin/users/roles'
  if (item === 'Activity log') return '/admin/users/activity'
  return '/admin/users'
}

export default function AdminUsersPage() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const tab = tabFromPath(pathname)
  const [roleFilter, setRoleFilter] = useState('All roles')
  const [countryFilter, setCountryFilter] = useState('All countries')
  const [statusFilter, setStatusFilter] = useState('All status')
  const [query, setQuery] = useState('')
  const [activityUserFilter, setActivityUserFilter] = useState('All users')
  const [activityModuleFilter, setActivityModuleFilter] = useState('All modules')
  const [activityActionFilter, setActivityActionFilter] = useState('All actions')
  const [fromDate, setFromDate] = useState('01 Jun 2026')
  const [toDate, setToDate] = useState('27 Jun 2026')
  const [appliedActivityFilters, setAppliedActivityFilters] = useState({
    user: 'All users',
    module: 'All modules',
    action: 'All actions',
  })

  const { data, error, isLoading, refetch } = useApiResource(
    () => adminService.getManagement('users'),
    [],
  )

  const rows = useMemo(() => {
    if (!data?.rows) return []
    const q = query.trim().toLowerCase()
    return data.rows.filter((row) => {
      const matchesRole = roleFilter === 'All roles' || row.role === roleFilter
      const matchesCountry =
        countryFilter === 'All countries'
        || row.scope === countryFilter
        || (countryFilter === 'Bahrain' && ['Bahrain', 'Manama', 'Muharraq'].includes(row.scope))
      const matchesStatus = statusFilter === 'All status' || row.status === statusFilter
      const matchesQuery =
        !q
        || `${row.name} ${row.email} ${row.role} ${row.scope}`.toLowerCase().includes(q)
      return matchesRole && matchesCountry && matchesStatus && matchesQuery
    })
  }, [data, roleFilter, countryFilter, statusFilter, query])

  const activityRows = useMemo(() => {
    if (!data?.activityLog?.rows) return []
    return data.activityLog.rows.filter((row) => {
      const matchesUser =
        appliedActivityFilters.user === 'All users' || row.user === appliedActivityFilters.user
      const matchesModule =
        appliedActivityFilters.module === 'All modules'
        || row.module === appliedActivityFilters.module
      const matchesAction =
        appliedActivityFilters.action === 'All actions'
        || row.type === appliedActivityFilters.action
      return matchesUser && matchesModule && matchesAction
    })
  }, [data, appliedActivityFilters])

  if (!data) return <ApiState isLoading={isLoading} error={error} onRetry={refetch} />

  const rolesData = data.roles
  const activityData = data.activityLog
  const header =
    tab === 'Roles' && rolesData
      ? { title: rolesData.title, subtitle: rolesData.subtitle, action: rolesData.action, to: '/admin/users/roles/new' }
      : tab === 'Activity log' && activityData
        ? { title: activityData.title, subtitle: activityData.subtitle, action: activityData.action }
        : { title: data.title, subtitle: data.subtitle, action: data.action, to: '/admin/users/new' }

  return (
    <div className="px-5 py-4 pb-8 max-[700px]:px-3">
      <div className="mb-3.5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-[20px] font-bold tracking-[-0.02em] text-[#17231c]">{header.title}</h2>
          <p className="mt-0.5 text-[12.5px] text-[#7c8780]">{header.subtitle}</p>
        </div>
        {tab === 'Activity log' ? (
          <button
            type="button"
            className="inline-flex h-[34px] items-center gap-1.5 rounded-full border border-[#e4e8e4] bg-white px-4 text-[12px] font-bold text-[#455249] hover:bg-[#f8faf8]"
          >
            <Download size={14} strokeWidth={2.2} />
            {header.action}
          </button>
        ) : (
          <Link
            to={header.to}
            className="inline-flex h-[34px] items-center gap-1.5 rounded-full bg-[#1aa054] px-4 text-[12px] font-bold text-white shadow-[0_1px_2px_rgba(20,40,28,.15)] hover:bg-[#158a47]"
          >
            <Plus size={14} strokeWidth={2.2} />
            {header.action}
          </Link>
        )}
      </div>

      <div className="mb-4 inline-flex items-center gap-1">
        {data.viewTabs.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => navigate(tabPath(item))}
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

      {tab === 'Users' ? (
        <>
          <div className="mb-4 grid grid-cols-4 gap-3 max-[1100px]:grid-cols-2 max-[520px]:grid-cols-1">
            {data.stats.map(({ label, value, tone }) => (
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

          <div className="mb-3 flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-sm border border-[#eceeec]">
            <div className="flex flex-wrap items-center gap-2">
              <FilterSelect
                label="Filter by role"
                options={data.filters.roles}
                value={roleFilter}
                onChange={setRoleFilter}
              />
              <FilterSelect
                label="Filter by country"
                options={data.filters.countries}
                value={countryFilter}
                onChange={setCountryFilter}
              />
              <FilterSelect
                label="Filter by status"
                options={data.filters.statuses}
                value={statusFilter}
                onChange={setStatusFilter}
              />
            </div>
            <label className="flex h-[34px] w-[220px] max-w-full items-center gap-2 rounded-sm border border-[#e4e8e4] bg-white px-3">
              <Search size={14} className="shrink-0 text-[#89938c]" aria-hidden />
              <input
                className="min-w-0 flex-1 border-0 bg-transparent text-[12.5px] text-[#17231c] outline-none placeholder:text-[#9aa49d]"
                placeholder="Search users"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
          </div>

          <section className="rounded-[14px] border border-[#eceeec] bg-white p-5 shadow-[0_1px_2px_rgba(20,40,28,.03)] max-[700px]:p-4">
            <h3 className="mb-3 text-[15px] font-bold text-[#17231c]">All users</h3>

            <div className="overflow-hidden rounded-[12px] border border-[#eceeec]">
              <div className="w-full max-w-full overflow-x-auto overscroll-x-contain touch-pan-x [-webkit-overflow-scrolling:touch]">
                <table className="w-full min-w-[760px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-[#edf0ee] bg-[#f6f8f6]">
                      {data.columns.map((column) => (
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
                    {rows.map((row) => {
                      const twoFa = twoFaTone(row.twoFa)
                      return (
                        <tr
                          key={row.id}
                          onClick={() => navigate(`/admin/users/${row.id}`)}
                          className="cursor-pointer border-b border-[#edf0ee] bg-white last:border-0 hover:bg-[#f8faf8]"
                        >
                          <td className="whitespace-nowrap px-4 py-3.5">
                            <p className="text-[13px] font-medium text-[#17231c]">
                              {row.name}
                              {row.you ? (
                                <span className="font-normal text-[#7c8780]"> (You)</span>
                              ) : null}
                            </p>
                            <p className="mt-0.5 text-[11px] text-[#8a948e]">{row.email}</p>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3.5">
                            <span
                              className={cn(
                                'inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold',
                                roleToneClass[row.roleTone] || roleToneClass.gray,
                              )}
                            >
                              {row.role}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3.5 text-[12.5px] text-[#455249]">
                            {row.scope}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3.5">
                            <Badge tone={statusTone(row.status)}>{row.status}</Badge>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3.5">
                            {twoFa ? (
                              <Badge tone={twoFa}>{row.twoFa}</Badge>
                            ) : (
                              <span className="text-[12.5px] text-[#8a948e]">—</span>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3.5 text-[12.5px] text-[#455249]">
                            {row.lastActive}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </>
      ) : tab === 'Roles' && rolesData ? (
        <section className="rounded-[14px] border border-[#eceeec] bg-white p-5 shadow-[0_1px_2px_rgba(20,40,28,.03)] max-[700px]:p-4">
          <h3 className="mb-3 text-[15px] font-bold text-[#17231c]">All roles</h3>

          <div className="overflow-hidden rounded-[12px] border border-[#eceeec]">
            <div className="w-full max-w-full overflow-x-auto overscroll-x-contain touch-pan-x [-webkit-overflow-scrolling:touch]">
              <table className="w-full min-w-[820px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-[#edf0ee] bg-[#f6f8f6]">
                    {rolesData.columns.map((column) => (
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
                  {rolesData.rows.map((row) => (
                    <tr key={row.id} className="border-b border-[#edf0ee] bg-white last:border-0">
                      <td className="whitespace-nowrap px-4 py-3.5">
                        <p className="text-[13px] font-medium text-[#17231c]">{row.name}</p>
                        <p className="mt-0.5 text-[11px] text-[#8a948e]">{row.description}</p>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-[12.5px] text-[#455249]">
                        {row.scopeLevel}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-[12.5px] text-[#455249]">
                        {row.users}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5">
                        <Badge tone={row.typeTone || (row.type === 'System' ? 'purple' : 'green')}>
                          {row.type}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5 text-[12.5px] text-[#455249]">
                        {row.permissions}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      ) : tab === 'Activity log' && activityData ? (
        <>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-sm border border-[#eceeec] bg-[#f6f8f6] p-3 bg-white">
            <div className="flex flex-wrap items-center gap-2">
              <FilterSelect
                label="Filter by user"
                options={activityData.filters.users}
                value={activityUserFilter}
                onChange={setActivityUserFilter}
              />
              <FilterSelect
                label="Filter by module"
                options={activityData.filters.modules}
                value={activityModuleFilter}
                onChange={setActivityModuleFilter}
              />
              <FilterSelect
                label="Filter by action"
                options={activityData.filters.actions}
                value={activityActionFilter}
                onChange={setActivityActionFilter}
              />
              <DateFilter label="From" value={fromDate} onChange={setFromDate} />
              <DateFilter label="To" value={toDate} onChange={setToDate} />
            </div>
            <button
              type="button"
              onClick={() =>
                setAppliedActivityFilters({
                  user: activityUserFilter,
                  module: activityModuleFilter,
                  action: activityActionFilter,
                })
              }
              className="inline-flex h-[34px] border border-[#e4e8e4] items-center gap-1.5 rounded-sm bg-white px-3.5 text-[12px] font-bold text-[#455249] hover:bg-[#f6f8f6]"
            >
              <Search size={14} strokeWidth={2.2} />
              Search
            </button>
          </div>

          <section className="rounded-[14px] border border-[#eceeec] bg-white p-5 shadow-[0_1px_2px_rgba(20,40,28,.03)] max-[700px]:p-4">
            <h3 className="mb-3 text-[15px] font-bold text-[#17231c]">Audit trail</h3>

            <div className="overflow-hidden rounded-[12px] border border-[#eceeec]">
              <div className="w-full max-w-full overflow-x-auto overscroll-x-contain touch-pan-x [-webkit-overflow-scrolling:touch]">
                <table className="w-full min-w-[860px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-[#edf0ee] bg-[#f6f8f6]">
                      {activityData.columns.map((column) => (
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
                    {activityRows.map((row) => (
                      <tr key={row.id} className="border-b border-[#edf0ee] bg-white last:border-0">
                        <td className="whitespace-nowrap px-4 py-3.5 text-[12.5px] text-[#455249]">
                          {row.time}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5 text-[12.5px] text-[#17231c]">
                          {row.user}, {row.role}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5 text-[12.5px] text-[#455249]">
                          {row.action}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5 text-[12.5px] text-[#455249]">
                          {row.module}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5">
                          <Badge tone={activityTypeTone(row.type)}>{row.type}</Badge>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5 text-[12.5px] text-[#8a948e]">
                          {row.ip}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </>
      ) : (
        <section className="rounded-[14px] border border-[#eceeec] bg-white p-5 shadow-[0_1px_2px_rgba(20,40,28,.03)]">
          <h3 className="text-[15px] font-bold text-[#17231c]">{tab}</h3>
          <p className="mt-1.5 text-[12.5px] text-[#7c8780]">
            Staff activity history will appear here.
          </p>
        </section>
      )}
    </div>
  )
}
