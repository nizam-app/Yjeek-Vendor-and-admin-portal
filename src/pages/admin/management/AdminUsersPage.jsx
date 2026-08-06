import { useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Download, Plus, Search } from 'lucide-react'
import { useApiResource } from '../../../hooks/useApiResource'
import { isAdminRealApiFeature, apiConfig } from '../../../api/config'
import { formatApiErrorMessage } from '../../../api/errors'
import { adminService } from '../../../services/adminService'
import { ApiState } from '../../../components/admin/ApiState'
import { Badge } from '../../../components/admin/Badge'
import { AdminFilterSelect } from '../../../components/admin/AdminFilterSelect'
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
  const normalized = String(type || '').trim().toLowerCase()
  if (normalized === 'edit') return 'blue'
  if (normalized === 'create') return 'green'
  if (normalized === 'approve') return 'yellow'
  if (normalized === 'delete') return 'red'
  if (normalized === 'export') return 'purple'
  if (normalized === 'login' || normalized === 'logout') return 'gray'
  return 'gray'
}

function formatDateLabel(value) {
  const raw = String(value || '').trim()
  if (!raw) return '—'
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const date = new Date(`${raw}T00:00:00`)
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    }
  }
  return raw
}

function toApiDate(value) {
  const raw = String(value || '').trim()
  if (!raw) return ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return ''
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function DateFilter({ label, value, onChange }) {
  const isoValue = toApiDate(value)
  return (
    <label className="relative inline-flex h-[34px] items-center gap-2 rounded-sm border border-[#e4e8e4] bg-white pl-3 pr-3 text-[12px] font-medium text-[#455249]">
      📅
      <span className="whitespace-nowrap text-[#7c8780]">{label}</span>
      <span className="whitespace-nowrap">{formatDateLabel(value)}</span>
      <input
        type="date"
        aria-label={label}
        value={isoValue}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0 outline-none"
        onChange={(event) => {
          if (!event.target.value) return
          onChange(event.target.value)
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
  const useRealUsers = isAdminRealApiFeature('users') || !apiConfig.adminUseMockApi

  const [roleFilter, setRoleFilter] = useState('')
  const [countryFilter, setCountryFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [query, setQuery] = useState('')
  const [activityUserFilter, setActivityUserFilter] = useState(useRealUsers ? '' : 'All users')
  const [activityModuleFilter, setActivityModuleFilter] = useState(useRealUsers ? '' : 'All modules')
  const [activityActionFilter, setActivityActionFilter] = useState(useRealUsers ? '' : 'All actions')
  const [fromDate, setFromDate] = useState('2026-06-01')
  const [toDate, setToDate] = useState('2026-07-30')
  const [appliedActivityFilters, setAppliedActivityFilters] = useState({
    user: useRealUsers ? '' : 'All users',
    module: useRealUsers ? '' : 'All modules',
    action: useRealUsers ? '' : 'All actions',
    from: '2026-06-01',
    to: '2026-07-30',
  })
  const [exportBusy, setExportBusy] = useState(false)
  const [exportError, setExportError] = useState('')

  const { data: usersData, error: usersError, isLoading: usersLoading, refetch: refetchUsers } =
    useApiResource(
      () => {
        if (!(useRealUsers && tab === 'Users')) {
          return Promise.resolve({ data: null, meta: null })
        }
        return adminService.listAdminUsers({
          search: query,
          page: 1,
          limit: 20,
          roleId: roleFilter,
          country: countryFilter,
          status: statusFilter,
        })
      },
      [useRealUsers, tab, query, roleFilter, countryFilter, statusFilter],
    )

  const { data: rolesDataApi, error: rolesError, isLoading: rolesLoading, refetch: refetchRoles } =
    useApiResource(
      () => {
        if (!(useRealUsers && tab === 'Roles')) {
          return Promise.resolve({ data: null, meta: null })
        }
        return adminService.listAdminRoles()
      },
      [useRealUsers, tab],
    )

  const {
    data: activityDataApi,
    error: activityError,
    isLoading: activityLoading,
    refetch: refetchActivity,
  } = useApiResource(
    () => {
      if (!(useRealUsers && tab === 'Activity log')) {
        return Promise.resolve({ data: null, meta: null })
      }
      return adminService.listAdminActivity({
        userId: appliedActivityFilters.user,
        module: appliedActivityFilters.module,
        actionType: appliedActivityFilters.action,
        from: appliedActivityFilters.from,
        to: appliedActivityFilters.to,
        page: 1,
        limit: 50,
        includeMeta: true,
      })
    },
    [useRealUsers, tab, appliedActivityFilters],
  )

  const { data: mockData, error: mockError, isLoading: mockLoading, refetch: refetchMock } =
    useApiResource(
      () => {
        if (useRealUsers) {
          return Promise.resolve({ data: null, meta: null })
        }
        return adminService.getManagement('users')
      },
      [useRealUsers],
    )

  const data =
    useRealUsers && tab === 'Users'
      ? usersData
      : useRealUsers && tab === 'Roles'
        ? rolesDataApi
        : useRealUsers && tab === 'Activity log'
          ? activityDataApi
          : mockData
  const error =
    useRealUsers && tab === 'Users'
      ? usersError
      : useRealUsers && tab === 'Roles'
        ? rolesError
        : useRealUsers && tab === 'Activity log'
          ? activityError
          : mockError
  const isLoading =
    useRealUsers && tab === 'Users'
      ? usersLoading
      : useRealUsers && tab === 'Roles'
        ? rolesLoading
        : useRealUsers && tab === 'Activity log'
          ? activityLoading
          : mockLoading
  const refetch =
    useRealUsers && tab === 'Users'
      ? refetchUsers
      : useRealUsers && tab === 'Roles'
        ? refetchRoles
        : useRealUsers && tab === 'Activity log'
          ? refetchActivity
          : refetchMock

  const rows = useMemo(() => {
    if (!data?.rows) return []
    if (useRealUsers && tab === 'Users') return data.rows

    const q = query.trim().toLowerCase()
    const roleLabel =
      roleFilter === '' || roleFilter === 'All roles' ? 'All roles' : roleFilter
    const countryLabel =
      countryFilter === '' || countryFilter === 'All countries' ? 'All countries' : countryFilter
    const statusLabel =
      statusFilter === '' || statusFilter === 'All status' ? 'All status' : statusFilter

    return data.rows.filter((row) => {
      const matchesRole = roleLabel === 'All roles' || row.role === roleLabel
      const matchesCountry =
        countryLabel === 'All countries'
        || row.scope === countryLabel
        || (countryLabel === 'Bahrain' && ['Bahrain', 'Manama', 'Muharraq'].includes(row.scope))
      const matchesStatus = statusLabel === 'All status' || row.status === statusLabel
      const matchesQuery =
        !q
        || `${row.name} ${row.email} ${row.role} ${row.scope}`.toLowerCase().includes(q)
      return matchesRole && matchesCountry && matchesStatus && matchesQuery
    })
  }, [data, useRealUsers, tab, roleFilter, countryFilter, statusFilter, query])

  const activityRows = useMemo(() => {
    if (!data?.activityLog?.rows) return []
    if (useRealUsers && tab === 'Activity log') return data.activityLog.rows

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
  }, [data, appliedActivityFilters, useRealUsers, tab])

  const handleActivitySearch = () => {
    setAppliedActivityFilters({
      user: activityUserFilter,
      module: activityModuleFilter,
      action: activityActionFilter,
      from: toApiDate(fromDate) || fromDate,
      to: toApiDate(toDate) || toDate,
    })
  }

  const handleExportActivity = async () => {
    if (!useRealUsers) return
    setExportBusy(true)
    setExportError('')
    try {
      const result = await adminService.exportAdminActivity({
        from: toApiDate(fromDate) || appliedActivityFilters.from,
        to: toApiDate(toDate) || appliedActivityFilters.to,
      })
      const csv = result?.data || ''
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `activity-${toApiDate(fromDate) || 'from'}-${toApiDate(toDate) || 'to'}.csv`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      setExportError(formatApiErrorMessage(err, 'Failed to export activity.'))
    } finally {
      setExportBusy(false)
    }
  }

  if (!data) return <ApiState isLoading={isLoading} error={error} onRetry={refetch} />

  const rolesData = data.roles
  const activityData = data.activityLog
  const filterRoles = data.filters?.roles || ['All roles']
  const filterCountries = data.filters?.countries || ['All countries']
  const filterStatuses = data.filters?.statuses || ['All status']

  const header =
    tab === 'Roles' && rolesData
      ? { title: rolesData.title, subtitle: rolesData.subtitle, action: rolesData.action, to: '/admin/users/roles/new' }
      : tab === 'Activity log' && activityData
        ? { title: activityData.title, subtitle: activityData.subtitle, action: activityData.action }
        : { title: data.title, subtitle: data.subtitle, action: data.action, to: '/admin/users/new' }

  const viewTabs = data.viewTabs || ['Users', 'Roles', 'Activity log']

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
            disabled={exportBusy || !useRealUsers}
            onClick={handleExportActivity}
            className="inline-flex h-[34px] items-center gap-1.5 rounded-full border border-[#e4e8e4] bg-white px-4 text-[12px] font-bold text-[#455249] hover:bg-[#f8faf8] disabled:opacity-60"
          >
            <Download size={14} strokeWidth={2.2} />
            {exportBusy ? 'Exporting…' : header.action}
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

      {exportError ? (
        <div className="mb-3 rounded-[12px] border border-[#f3c6c3] bg-[#fdf2f1] px-4 py-3 text-[13px] text-[#bf3c36]">
          {exportError}
        </div>
      ) : null}

      <div className="mb-4 inline-flex items-center gap-1">
        {viewTabs.map((item) => (
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
            {(data.stats || []).map(({ label, value, tone }) => (
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
              <AdminFilterSelect
                label="Filter by role"
                shape="square"
                options={filterRoles}
                value={roleFilter || (typeof filterRoles[0] === 'string' ? filterRoles[0] : filterRoles[0]?.value) || ''}
                onChange={setRoleFilter}
              />
              <AdminFilterSelect
                label="Filter by country"
                shape="square"
                options={filterCountries}
                value={countryFilter || (typeof filterCountries[0] === 'string' ? filterCountries[0] : filterCountries[0]?.value) || ''}
                onChange={setCountryFilter}
              />
              <AdminFilterSelect
                label="Filter by status"
                shape="square"
                options={filterStatuses}
                value={statusFilter || (typeof filterStatuses[0] === 'string' ? filterStatuses[0] : filterStatuses[0]?.value) || ''}
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

            {error ? (
              <div className="mb-3 rounded-[10px] border border-[#f5c6c4] bg-[#fdebec] px-3 py-2 text-[12px] text-[#d64044]">
                {error.message || 'Failed to load users.'}
              </div>
            ) : null}

            <div className="overflow-hidden rounded-[12px] border border-[#eceeec]">
              <div className="w-full max-w-full overflow-x-auto overscroll-x-contain touch-pan-x [-webkit-overflow-scrolling:touch]">
                <table className="w-full min-w-[760px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-[#edf0ee] bg-[#f6f8f6]">
                      {(data.columns || []).map((column) => (
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
                    {isLoading ? (
                      <tr>
                        <td colSpan={(data.columns || []).length || 6} className="px-4 py-6 text-[13px] text-[#7c8780]">
                          Loading users…
                        </td>
                      </tr>
                    ) : null}
                    {!isLoading && rows.length === 0 ? (
                      <tr>
                        <td colSpan={(data.columns || []).length || 6} className="px-4 py-6 text-[13px] text-[#7c8780]">
                          No users found.
                        </td>
                      </tr>
                    ) : null}
                    {!isLoading
                      ? rows.map((row) => {
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
                        })
                      : null}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </>
      ) : tab === 'Roles' && rolesData ? (
        <section className="rounded-[14px] border border-[#eceeec] bg-white p-5 shadow-[0_1px_2px_rgba(20,40,28,.03)] max-[700px]:p-4">
          <h3 className="mb-3 text-[15px] font-bold text-[#17231c]">All roles</h3>

          {error ? (
            <div className="mb-3 rounded-[10px] border border-[#f5c6c4] bg-[#fdebec] px-3 py-2 text-[12px] text-[#d64044]">
              {error.message || 'Failed to load roles.'}
            </div>
          ) : null}

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
                  {isLoading ? (
                    <tr>
                      <td
                        colSpan={rolesData.columns.length || 5}
                        className="px-4 py-6 text-[13px] text-[#7c8780]"
                      >
                        Loading roles…
                      </td>
                    </tr>
                  ) : null}
                  {!isLoading && (!rolesData.rows || rolesData.rows.length === 0) ? (
                    <tr>
                      <td
                        colSpan={rolesData.columns.length || 5}
                        className="px-4 py-6 text-[13px] text-[#7c8780]"
                      >
                        No roles found.
                      </td>
                    </tr>
                  ) : null}
                  {!isLoading
                    ? (rolesData.rows || []).map((row) => (
                        <tr
                          key={row.id}
                          onClick={() =>
                            navigate(`/admin/users/roles/${encodeURIComponent(row.id)}/edit`)
                          }
                          className="cursor-pointer border-b border-[#edf0ee] bg-white last:border-0 hover:bg-[#f6f8f6]"
                        >
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
                      ))
                    : null}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      ) : tab === 'Activity log' && activityData ? (
        <>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-sm border border-[#eceeec] bg-[#f6f8f6] p-3 bg-white">
            <div className="flex flex-wrap items-center gap-2">
              <AdminFilterSelect
                label="Filter by user"
                shape="square"
                options={activityData.filters.users}
                value={activityUserFilter}
                onChange={setActivityUserFilter}
              />
              <AdminFilterSelect
                label="Filter by module"
                shape="square"
                options={activityData.filters.modules}
                value={activityModuleFilter}
                onChange={setActivityModuleFilter}
              />
              <AdminFilterSelect
                label="Filter by action"
                shape="square"
                options={activityData.filters.actions}
                value={activityActionFilter}
                onChange={setActivityActionFilter}
              />
              <DateFilter label="From" value={fromDate} onChange={setFromDate} />
              <DateFilter label="To" value={toDate} onChange={setToDate} />
            </div>
            <button
              type="button"
              onClick={handleActivitySearch}
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
                    {activityRows.length === 0 ? (
                      <tr>
                        <td
                          colSpan={activityData.columns.length}
                          className="px-4 py-6 text-[13px] text-[#7c8780]"
                        >
                          No activity found.
                        </td>
                      </tr>
                    ) : null}
                    {activityRows.map((row) => (
                      <tr key={row.id} className="border-b border-[#edf0ee] bg-white last:border-0">
                        <td className="whitespace-nowrap px-4 py-3.5 text-[12.5px] text-[#455249]">
                          {row.time}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5 text-[12.5px] text-[#17231c]">
                          {row.user}
                          {row.role && row.role !== '—' ? `, ${row.role}` : ''}
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
            {useRealUsers
              ? 'This tab is not connected to the real API yet.'
              : 'Staff activity history will appear here.'}
          </p>
        </section>
      )}
    </div>
  )
}
