import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Check, ChevronDown, ChevronLeft, Copy, Eye, EyeOff, KeyRound } from 'lucide-react'
import { formatApiErrorMessage } from '../../../api/errors'
import { isAdminRealApiFeature, apiConfig } from '../../../api/config'
import { useApiResource } from '../../../hooks/useApiResource'
import { mapPermissionFlagsToOverrides } from '../../../mappers/admin/mapAdminUsers'
import { adminService } from '../../../services/adminService'
import { ApiState } from '../../../components/admin/ApiState'
import { cn } from '../../../components/admin/cn'

const roleToneClass = {
  purple: 'bg-[#f1eafe] text-[#7752a8]',
  blue: 'bg-[#eaf2fc] text-[#2b66a5]',
  green: 'bg-[#e8f7ed] text-[#147940]',
  orange: 'bg-[#fff1e4] text-[#c4841a]',
  cyan: 'bg-[#e8f6fb] text-[#2a7a96]',
  gray: 'bg-[#eff2f0] text-[#637068]',
}

const statusStyle = {
  Active: { pill: 'bg-[#e8f7ed] text-[#147940]', dot: 'bg-[#1aa054]', text: 'text-[#147940]' },
  Pending: { pill: 'bg-[#fff5d9] text-[#9a6510]', dot: 'bg-[#d79a1c]', text: 'text-[#9a6510]' },
  Suspended: { pill: 'bg-[#fdebea] text-[#bf3c36]', dot: 'bg-[#d6453d]', text: 'text-[#bf3c36]' },
}

const ACTIONS = ['view', 'create', 'edit', 'delete', 'approve', 'export']
const ACTION_LABELS = {
  view: 'View',
  create: 'Create',
  edit: 'Edit',
  delete: 'Delete',
  approve: 'Approve',
  export: 'Export',
}

const SCOPE_LEVELS = [
  { value: 'GLOBAL', label: 'Global (all countries)' },
  { value: 'COUNTRY', label: 'Country' },
  { value: 'ZONE', label: 'Zone / City' },
]

const FALLBACK_COUNTRIES = [
  { code: 'BH', name: 'Bahrain' },
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'AE', name: 'UAE' },
  { code: 'KW', name: 'Kuwait' },
  { code: 'QA', name: 'Qatar' },
  { code: 'OM', name: 'Oman' },
]

const FALLBACK_ZONES = ['Manama', 'Muharraq', 'Riffa', 'Isa Town', 'Hamad Town', 'Sitra']

function Card({ title, subtitle, children }) {
  return (
    <section className="rounded-[14px] border border-[#eceeec] bg-white p-5 shadow-[0_1px_2px_rgba(20,40,28,.03)] max-[700px]:p-4">
      {title ? <h3 className="text-[15px] font-bold text-[#17231c]">{title}</h3> : null}
      {subtitle ? <p className="mt-0.5 text-[12px] text-[#7c8780]">{subtitle}</p> : null}
      <div className="mt-4">{children}</div>
    </section>
  )
}

function InfoItem({ label, value, valueClass }) {
  return (
    <div className="min-w-0">
      <p className="text-[11.5px] text-[#7c8780]">{label}</p>
      <p className={cn('mt-1 truncate text-[13px] font-medium text-[#17231c]', valueClass)}>{value}</p>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <label className="min-w-0 block">
      <span className="text-[11.5px] text-[#7c8780]">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  )
}

const inputClass =
  'h-9 w-full rounded-[10px] border border-[#dfe4e0] bg-white px-3 text-[13px] text-[#17231c] outline-none focus:border-[#1aa054]'

function Select({ value, onChange, children, label }) {
  const flat = (Array.isArray(children) ? children : [children]).flat().filter(Boolean)
  const selected = flat.find((child) => String(child?.props?.value) === String(value))
  const display = selected?.props?.children ?? (value ? String(value) : 'Select role')

  return (
    <div className="relative">
      <div className={cn(inputClass, 'flex items-center pr-9')}>
        <span className="truncate">{display}</span>
      </div>
      <ChevronDown
        size={15}
        strokeWidth={2}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#7c8780]"
        aria-hidden
      />
      <select
        aria-label={label}
        className="absolute inset-0 h-full w-full cursor-pointer appearance-none opacity-0 outline-none"
        value={value}
        onChange={onChange}
      >
        {children}
      </select>
    </div>
  )
}

function PillGroup({ options, value, onChange, multi = false }) {
  const normalized = options.map((option) =>
    typeof option === 'object'
      ? {
          value: option.value ?? option.code ?? option.id,
          label: option.label ?? option.name ?? option.value,
        }
      : { value: option, label: option },
  )
  const selected = multi ? value : [value]

  return (
    <div className="flex flex-wrap gap-2">
      {normalized.map((option) => {
        const isActive = selected.includes(option.value)
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => {
              if (!multi) {
                onChange(option.value)
                return
              }
              onChange(
                isActive
                  ? value.filter((item) => item !== option.value)
                  : [...value, option.value],
              )
            }}
            className={cn(
              'h-[32px] rounded-full border px-3.5 text-[12.5px] transition',
              isActive
                ? 'border-[#1aa054] bg-[#e8f7ed] font-bold text-[#147940]'
                : 'border-[#e0e5e1] bg-white font-medium text-[#59655e] hover:bg-[#f6f8f6]',
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

function PermissionMark({ granted, label }) {
  return (
    <span
      role="img"
      aria-label={label}
      className={cn(
        'grid h-[17px] w-[17px] place-items-center rounded-[4px] border',
        granted ? 'border-[#1aa054] bg-[#1aa054] text-white' : 'border-[#dfe4e0] bg-[#f6f8f6]',
      )}
    >
      {granted ? <Check size={12} strokeWidth={3} /> : null}
    </span>
  )
}

function PermissionCheckbox({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={cn(
        'grid h-[17px] w-[17px] place-items-center rounded-[4px] border transition',
        checked
          ? 'border-[#1aa054] bg-[#1aa054] text-white'
          : 'border-[#cfd6d1] bg-white hover:border-[#9aa49d]',
      )}
    >
      {checked ? <Check size={12} strokeWidth={3} /> : null}
    </button>
  )
}

function tabPath(item) {
  if (item === 'Roles') return '/admin/users/roles'
  if (item === 'Activity log') return '/admin/users/activity'
  return '/admin/users'
}

function permissionsRowsToFlags(rows = []) {
  return (Array.isArray(rows) ? rows : []).reduce((acc, row) => {
    const key = String(row?.moduleKey || row?.module || '').trim()
    if (!key) return acc
    acc[key] = ACTIONS.reduce((flags, action) => {
      flags[action] = Boolean(row[action])
      return flags
    }, {})
    return acc
  }, {})
}

function blankEditForm(detail) {
  return {
    fullName: detail?.fullNameValue || '',
    jobTitle: detail?.jobTitleValue || '',
    phone: detail?.phoneValue || '',
    countryCode: detail?.countryCode || '+973',
    roleId: detail?.roleId || '',
    scopeLevel: detail?.scopeLevelValue || 'COUNTRY',
    countries: Array.isArray(detail?.countriesValue) ? [...detail.countriesValue] : [],
    zones: Array.isArray(detail?.zonesValue)
      ? detail.zonesValue.map((z) => (typeof z === 'string' ? z : z?.name || z?.id || '')).filter(Boolean)
      : [],
    permissions: permissionsRowsToFlags(detail?.permissions),
  }
}

export default function AdminUserDetailPage() {
  const navigate = useNavigate()
  const { userId } = useParams()
  const useRealUsers = isAdminRealApiFeature('users') || !apiConfig.adminUseMockApi

  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState(null)
  const [actionBusy, setActionBusy] = useState('')
  const [actionError, setActionError] = useState('')
  const [actionSuccess, setActionSuccess] = useState('')
  const [tempPassword, setTempPassword] = useState(null)
  const [showTempPassword, setShowTempPassword] = useState(false)
  const [copiedPassword, setCopiedPassword] = useState(false)

  const { data, error, isLoading, refetch, setData } = useApiResource(
    () => adminService.getAdminUserDetail(userId),
    [userId],
  )

  const { data: meta } = useApiResource(
    () => (useRealUsers ? adminService.getAdminUsersMeta() : Promise.resolve({ data: null })),
    [useRealUsers],
  )

  const { data: rolesPage } = useApiResource(
    () => (useRealUsers ? adminService.listAdminRoles() : Promise.resolve({ data: null })),
    [useRealUsers],
  )

  const roleOptions = useMemo(() => {
    if (meta?.roles?.length) return meta.roles
    const rows = rolesPage?.roles?.rows || []
    return rows.map((row) => ({ id: row.id, name: row.name, scopeLevel: row.scopeLevelValue }))
  }, [meta, rolesPage])

  const countryOptions = useMemo(() => {
    if (meta?.countries?.length) return meta.countries
    return FALLBACK_COUNTRIES
  }, [meta])

  const zoneOptions = useMemo(() => {
    if (meta?.zones?.length) return meta.zones.map((z) => z.name || z.id)
    return FALLBACK_ZONES
  }, [meta])

  useEffect(() => {
    setEditing(false)
    setEditForm(null)
    setActionError('')
    setActionSuccess('')
    setTempPassword(null)
    setShowTempPassword(false)
    setCopiedPassword(false)
  }, [userId])

  if (!data) return <ApiState isLoading={isLoading} error={error} onRetry={refetch} />

  const row = data.row
  const detail = data.detail

  if (!row || !detail) {
    return (
      <div className="px-5 py-4 pb-8 max-[700px]:px-3">
        <button
          type="button"
          onClick={() => navigate('/admin/users')}
          className="mb-4 inline-flex h-[34px] items-center gap-1 rounded-full border border-[#e4e8e4] bg-white px-3 text-[13px] font-medium text-[#455249] hover:bg-[#f6f8f6]"
        >
          <ChevronLeft size={15} strokeWidth={2} />
          Users
        </button>
        <Card>
          <p className="text-[13px] text-[#7c8780]">User not found.</p>
        </Card>
      </div>
    )
  }

  const status = row.status
  const statusValue = String(row.statusValue || '').toUpperCase()
  const isPending = statusValue === 'PENDING' || status === 'Pending'
  const isSuspended = statusValue === 'SUSPENDED' || status === 'Suspended'
  const tone = statusStyle[status] || statusStyle.Active
  const actions = data.permissionActions || ACTIONS
  const permissions = detail.permissions || []
  const activity = detail.activity || []
  const busy = Boolean(actionBusy)
  const form = editForm || blankEditForm(detail)
  const selectedRole =
    roleOptions.find((role) => String(role.id) === String(form.roleId)) || null
  const showCountries = form.scopeLevel !== 'GLOBAL'
  const showZones = form.scopeLevel === 'ZONE'

  const startEdit = () => {
    setActionError('')
    setActionSuccess('')
    setEditForm(blankEditForm(detail))
    setEditing(true)
  }

  const cancelEdit = () => {
    setEditing(false)
    setEditForm(null)
    setActionError('')
  }

  const patchForm = (patch) => {
    setEditForm((current) => ({ ...(current || blankEditForm(detail)), ...patch }))
  }

  const setScopeLevel = (scopeLevel) => {
    patchForm({
      scopeLevel,
      ...(scopeLevel === 'GLOBAL'
        ? { countries: [], zones: [] }
        : {
            countries: form.countries.length
              ? form.countries
              : countryOptions[0]?.code
                ? [countryOptions[0].code]
                : ['BH'],
            zones: scopeLevel === 'ZONE' ? form.zones : [],
          }),
    })
  }

  const onRoleChange = async (roleId) => {
    patchForm({ roleId })
    if (!roleId || !useRealUsers) return
    try {
      const result = await adminService.getAdminRoleDetail(roleId)
      const matrix = result?.data?.permissionsMatrix || []
      if (matrix.length) {
        patchForm({
          roleId,
          permissions: permissionsRowsToFlags(
            matrix.map((row) => ({
              moduleKey: row.module,
              module: row.moduleLabel || row.module,
              view: row.view,
              create: row.create,
              edit: row.edit,
              delete: row.delete,
              approve: row.approve,
              export: row.export,
            })),
          ),
        })
      }
    } catch {
      // Keep current permission toggles if role detail fails.
    }
  }

  const togglePermission = (moduleKey, action) => {
    setEditForm((current) => {
      const base = current || blankEditForm(detail)
      return {
        ...base,
        permissions: {
          ...base.permissions,
          [moduleKey]: {
            ...base.permissions?.[moduleKey],
            [action]: !base.permissions?.[moduleKey]?.[action],
          },
        },
      }
    })
  }

  const saveEdit = async () => {
    setActionBusy('edit')
    setActionError('')
    setActionSuccess('')
    try {
      const result = await adminService.updateAdminUser(userId, {
        fullName: form.fullName,
        jobTitle: form.jobTitle,
        phone: form.phone,
        countryCode: form.countryCode,
        roleId: form.roleId,
        scopeLevel: form.scopeLevel,
        countries: form.scopeLevel === 'GLOBAL' ? [] : form.countries,
        zones: form.scopeLevel === 'ZONE' ? form.zones : [],
        permissionOverrides: mapPermissionFlagsToOverrides(form.permissions),
      })
      if (result?.data) setData(result.data)
      setEditing(false)
      setEditForm(null)
      setActionSuccess('User updated.')
    } catch (err) {
      setActionError(formatApiErrorMessage(err, 'Failed to update user.'))
    } finally {
      setActionBusy('')
    }
  }

  const handleResetPassword = async () => {
    const confirmed = window.confirm(
      'Generate a new password for this user? They can log in with it immediately. Share it securely.',
    )
    if (!confirmed) return

    setActionBusy('reset')
    setActionError('')
    setActionSuccess('')
    setTempPassword(null)
    setShowTempPassword(true)
    setCopiedPassword(false)
    try {
      const result = await adminService.resetAdminUserPassword(userId)
      const password = result?.data?.temporaryPassword || null
      if (!password) {
        throw new Error('Server did not return a generated password.')
      }
      setTempPassword(password)
      setActionSuccess('New password generated. Copy it and share it with the user securely.')
      await refetch()
    } catch (err) {
      setActionError(formatApiErrorMessage(err, 'Failed to reset password.'))
    } finally {
      setActionBusy('')
    }
  }

  const handleCopyPassword = async () => {
    if (!tempPassword) return
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(tempPassword)
      }
      setCopiedPassword(true)
      window.setTimeout(() => setCopiedPassword(false), 2000)
    } catch {
      setCopiedPassword(false)
    }
  }

  const handleResendInvite = async () => {
    setActionBusy('invite')
    setActionError('')
    setActionSuccess('')
    try {
      await adminService.resendAdminUserInvite(userId)
      setActionSuccess('Invitation resent.')
      await refetch()
    } catch (err) {
      setActionError(formatApiErrorMessage(err, 'Failed to resend invitation.'))
    } finally {
      setActionBusy('')
    }
  }

  const handleSuspendToggle = async () => {
    if (isPending) {
      setActionError('Pending invitations cannot be suspended or activated.')
      return
    }

    setActionBusy('suspend')
    setActionError('')
    setActionSuccess('')
    try {
      if (isSuspended) {
        await adminService.unsuspendAdminUser(userId)
        setActionSuccess('User reactivated.')
      } else {
        await adminService.suspendAdminUser(userId)
        setActionSuccess('User suspended.')
      }
      await refetch()
    } catch (err) {
      setActionError(
        formatApiErrorMessage(
          err,
          isSuspended ? 'Failed to reactivate user.' : 'Failed to suspend user.',
        ),
      )
    } finally {
      setActionBusy('')
    }
  }

  const permissionRows = editing
    ? Object.entries(form.permissions || {}).map(([moduleKey, flags]) => {
        const fromDetail = permissions.find((row) => row.moduleKey === moduleKey)
        return {
          moduleKey,
          module: fromDetail?.module || moduleKey,
          ...ACTIONS.reduce((acc, action) => {
            acc[action] = Boolean(flags?.[action])
            return acc
          }, {}),
        }
      })
    : permissions

  // Preserve API module order when editing.
  const orderedPermissionRows = editing
    ? (permissions.length
        ? permissions.map((row) => {
            const key = row.moduleKey || row.module
            const flags = form.permissions?.[key] || {}
            return {
              moduleKey: key,
              module: row.module,
              ...ACTIONS.reduce((acc, action) => {
                acc[action] = Boolean(flags[action])
                return acc
              }, {}),
            }
          })
        : permissionRows)
    : permissions

  const roleSubtitle = editing
    ? selectedRole
      ? `Editing permissions for ${selectedRole.name}`
      : 'Toggle permissions for this user'
    : detail.roleInheritedFrom || `Inherited from role — ${detail.roleFull}`

  return (
    <div className="px-5 py-4 pb-8 max-[700px]:px-3">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/admin/users')}
            className="inline-flex h-[34px] shrink-0 items-center gap-1 rounded-full border border-[#e4e8e4] bg-white px-3 text-[13px] font-medium text-[#455249] shadow-[0_1px_2px_rgba(20,40,28,.04)] hover:bg-[#f6f8f6]"
          >
            <ChevronLeft size={15} strokeWidth={2} />
            Users
          </button>

          <div
            className={cn(
              'grid h-11 w-11 shrink-0 place-items-center rounded-full text-[14px] font-bold',
              roleToneClass[row.roleTone] || roleToneClass.gray,
            )}
          >
            {detail.initials}
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-[20px] font-bold tracking-[-0.02em] text-[#17231c]">{row.name}</h2>
              <span
                className={cn(
                  'inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold',
                  roleToneClass[row.roleTone] || roleToneClass.gray,
                )}
              >
                {row.role}
              </span>
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-[3px] text-[11px] font-bold',
                  tone.pill,
                )}
              >
                <span className={cn('h-1.5 w-1.5 rounded-full', tone.dot)} />
                {status}
              </span>
            </div>
            <p className="mt-1 flex flex-wrap items-center gap-x-1.5 text-[12.5px] text-[#7c8780]">
              <span>{row.email}</span>
              <span>·</span>
              <span>{row.scope}</span>
              <span>·</span>
              <span>last active {row.lastActive}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => (editing ? cancelEdit() : startEdit())}
            className="inline-flex h-[34px] items-center gap-1.5 rounded-full border border-[#dfe4e0] bg-white px-3.5 text-[12.5px] font-bold text-[#455249] shadow-[0_1px_2px_rgba(20,40,28,.04)] hover:bg-[#f6f8f6] disabled:opacity-60"
          >
            ✎
            {editing ? 'Cancel' : 'Edit'}
          </button>
          {isPending ? (
            <button
              type="button"
              disabled={busy}
              onClick={handleResendInvite}
              className="inline-flex h-[34px] items-center gap-1.5 rounded-full border border-[#dfe4e0] bg-white px-3.5 text-[12.5px] font-bold text-[#455249] shadow-[0_1px_2px_rgba(20,40,28,.04)] hover:bg-[#f6f8f6] disabled:opacity-60"
            >
              {actionBusy === 'invite' ? 'Sending…' : 'Resend invite'}
            </button>
          ) : (
            <button
              type="button"
              disabled={busy}
              onClick={handleResetPassword}
              className="inline-flex h-[34px] items-center gap-1.5 rounded-full border border-[#dfe4e0] bg-white px-3.5 text-[12.5px] font-bold text-[#455249] shadow-[0_1px_2px_rgba(20,40,28,.04)] hover:bg-[#f6f8f6] disabled:opacity-60"
            >
              <KeyRound size={14} strokeWidth={2.2} />
              {actionBusy === 'reset' ? 'Generating…' : 'Reset password'}
            </button>
          )}
          <button
            type="button"
            disabled={busy || isPending}
            title={
              isPending
                ? 'Pending invitations cannot be suspended or activated'
                : undefined
            }
            onClick={handleSuspendToggle}
            className={cn(
              'inline-flex h-[34px] items-center rounded-full px-3.5 text-[12.5px] font-bold disabled:cursor-not-allowed disabled:opacity-50',
              isSuspended
                ? 'bg-[#e8f7ed] text-[#147940] hover:bg-[#d8f0e1]'
                : 'bg-[#fdebec] text-[#d64044] hover:bg-[#f9d9da]',
            )}
          >
            {actionBusy === 'suspend'
              ? isSuspended
                ? 'Reactivating…'
                : 'Suspending…'
              : isSuspended
                ? 'Reactivate'
                : 'Suspend'}
          </button>
        </div>
      </div>

      {actionError ? (
        <div className="mb-4 rounded-[12px] border border-[#f3c6c3] bg-[#fdf2f1] px-4 py-3 text-[13px] text-[#bf3c36]">
          {actionError}
        </div>
      ) : null}
      {actionSuccess ? (
        <div className="mb-4 rounded-[12px] border border-[#c6e8d2] bg-[#f1faf4] px-4 py-3 text-[13px] text-[#147940]">
          {actionSuccess}
          {tempPassword ? (
            <div className="mt-3 rounded-[10px] border border-[#c6e8d2] bg-white p-3">
              <p className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.04em] text-[#7c8780]">
                Generated password
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <code className="min-w-0 flex-1 rounded-[8px] bg-[#f6f8f6] px-3 py-2 text-[14px] font-bold tracking-wide text-[#17231c]">
                  {showTempPassword ? tempPassword : '••••••••••••'}
                </code>
                <button
                  type="button"
                  onClick={() => setShowTempPassword((prev) => !prev)}
                  aria-label={showTempPassword ? 'Hide password' : 'Show password'}
                  className="inline-flex h-[34px] items-center gap-1.5 rounded-full border border-[#dfe4e0] bg-white px-3 text-[12px] font-bold text-[#455249] hover:bg-[#f6f8f6]"
                >
                  {showTempPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  {showTempPassword ? 'Hide' : 'Show'}
                </button>
                <button
                  type="button"
                  onClick={handleCopyPassword}
                  className="inline-flex h-[34px] items-center gap-1.5 rounded-full bg-[#1aa054] px-3 text-[12px] font-bold text-white hover:bg-[#158a47]"
                >
                  <Copy size={13} />
                  {copiedPassword ? 'Copied' : 'Copy'}
                </button>
              </div>
              <p className="mt-2 text-[11px] text-[#7c8780]">
                This password is shown once. The user can log in with it immediately.
              </p>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="mb-4 inline-flex items-center gap-1">
        {(data.viewTabs || ['Users', 'Roles', 'Activity log']).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => navigate(tabPath(item))}
            className={cn(
              'h-[34px] rounded-full px-4 text-[12.5px] font-bold transition',
              item === 'Users'
                ? 'bg-[#e8f7ed] text-[#1aa054]'
                : 'bg-white text-[#69756d] ring-1 ring-[#e4e8e4] hover:text-[#455249]',
            )}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        <Card title="Account info">
          {editing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-x-6 gap-y-4 max-[700px]:grid-cols-2 max-[420px]:grid-cols-1">
                <Field label="Full name">
                  <input
                    className={inputClass}
                    value={form.fullName}
                    onChange={(e) => patchForm({ fullName: e.target.value })}
                  />
                </Field>
                <InfoItem label="Email" value={detail.email || row.email} />
                <Field label="Phone">
                  <div className="flex gap-2">
                    <input
                      className={cn(inputClass, 'w-[96px] shrink-0')}
                      value={form.countryCode}
                      onChange={(e) => patchForm({ countryCode: e.target.value })}
                      aria-label="Country code"
                    />
                    <input
                      className={inputClass}
                      value={form.phone}
                      onChange={(e) => patchForm({ phone: e.target.value })}
                      aria-label="Phone number"
                    />
                  </div>
                </Field>
                <Field label="Job title">
                  <input
                    className={inputClass}
                    value={form.jobTitle}
                    onChange={(e) => patchForm({ jobTitle: e.target.value })}
                  />
                </Field>
                <InfoItem label="Created" value={detail.created} />
                <InfoItem label="Created by" value={detail.createdBy} />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-x-6 gap-y-4 max-[700px]:grid-cols-2 max-[420px]:grid-cols-1">
              <InfoItem label="Full name" value={detail.fullName} />
              <InfoItem label="Email" value={detail.email || row.email} />
              <InfoItem label="Phone" value={detail.phone} />
              <InfoItem label="Job title" value={detail.jobTitle} />
              <InfoItem label="Created" value={detail.created} />
              <InfoItem label="Created by" value={detail.createdBy} />
            </div>
          )}
        </Card>

        <Card title="Role & scope">
          {editing ? (
            <div className="space-y-4">
              <Field label="Role">
                <div className="max-w-[420px]">
                  <Select
                    label="Role"
                    value={form.roleId}
                    onChange={(event) => onRoleChange(event.target.value)}
                  >
                    {!roleOptions.length ? <option value="">No roles available</option> : null}
                    {roleOptions.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </Select>
                </div>
              </Field>

              <div>
                <p className="mb-1.5 text-[11.5px] text-[#7c8780]">Scope level</p>
                <PillGroup options={SCOPE_LEVELS} value={form.scopeLevel} onChange={setScopeLevel} />
              </div>

              {showCountries ? (
                <div>
                  <p className="mb-1.5 text-[11.5px] text-[#7c8780]">Countries</p>
                  <PillGroup
                    multi
                    options={countryOptions.map((c) => ({ value: c.code, label: c.name }))}
                    value={form.countries}
                    onChange={(countries) => patchForm({ countries })}
                  />
                </div>
              ) : null}

              {showZones ? (
                <div>
                  <p className="mb-1.5 text-[11.5px] text-[#7c8780]">Zones / Cities</p>
                  <PillGroup
                    multi
                    options={zoneOptions}
                    value={form.zones}
                    onChange={(zones) => patchForm({ zones })}
                  />
                </div>
              ) : null}

              <div className="grid grid-cols-3 gap-x-6 gap-y-4 max-[700px]:grid-cols-2 max-[420px]:grid-cols-1">
                <InfoItem label="Status" value={status} valueClass={cn('font-bold', tone.text)} />
                <InfoItem label="2FA" value={detail.twoFa || row.twoFa} />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-x-6 gap-y-4 max-[700px]:grid-cols-2 max-[420px]:grid-cols-1">
              <InfoItem label="Role" value={detail.roleFull} />
              <InfoItem label="Scope level" value={detail.scopeLevel} />
              <InfoItem label="Countries" value={detail.countries} />
              <InfoItem label="Zones" value={detail.zones} />
              <InfoItem label="Status" value={status} valueClass={cn('font-bold', tone.text)} />
              <InfoItem label="2FA" value={detail.twoFa || row.twoFa} />
            </div>
          )}
        </Card>

        <Card title="Permissions" subtitle={roleSubtitle}>
          <div className="overflow-hidden rounded-[12px] border border-[#eceeec]">
            <div className="w-full max-w-full overflow-x-auto overscroll-x-contain touch-pan-x [-webkit-overflow-scrolling:touch]">
              <table className="w-full min-w-[680px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-[#edf0ee] bg-[#f6f8f6]">
                    <th className="whitespace-nowrap px-4 py-2.5 text-[10px] font-medium uppercase tracking-[0.05em] text-[#8a948e]">
                      Module
                    </th>
                    {actions.map((action) => (
                      <th
                        key={action}
                        className="whitespace-nowrap px-4 py-2.5 text-center text-[10px] font-medium uppercase tracking-[0.05em] text-[#8a948e]"
                      >
                        {ACTION_LABELS[action] || action}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {orderedPermissionRows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={actions.length + 1}
                        className="px-4 py-6 text-[13px] text-[#7c8780]"
                      >
                        No permissions returned.
                      </td>
                    </tr>
                  ) : null}
                  {orderedPermissionRows.map((entry) => (
                    <tr
                      key={entry.moduleKey || entry.module}
                      className="border-b border-[#edf0ee] bg-white last:border-0"
                    >
                      <td className="whitespace-nowrap px-4 py-3 text-[13px] font-medium text-[#17231c]">
                        {entry.module}
                      </td>
                      {actions.map((action) => (
                        <td key={action} className="px-4 py-3">
                          <div className="flex justify-center">
                            {editing ? (
                              <PermissionCheckbox
                                checked={Boolean(entry[action])}
                                onChange={() =>
                                  togglePermission(entry.moduleKey || entry.module, action)
                                }
                                label={`${ACTION_LABELS[action] || action} ${entry.module}`}
                              />
                            ) : (
                              <PermissionMark
                                granted={Boolean(entry[action])}
                                label={`${ACTION_LABELS[action] || action} ${entry.module}: ${
                                  entry[action] ? 'allowed' : 'not allowed'
                                }`}
                              />
                            )}
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Card>

        {editing ? (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={saveEdit}
              className="inline-flex h-[34px] items-center rounded-full bg-[#1aa054] px-4 text-[12.5px] font-bold text-white hover:bg-[#158a47] disabled:opacity-60"
            >
              {actionBusy === 'edit' ? 'Saving…' : 'Save changes'}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={cancelEdit}
              className="inline-flex h-[34px] items-center rounded-full border border-[#dfe4e0] bg-white px-4 text-[12.5px] font-bold text-[#455249] hover:bg-[#f6f8f6] disabled:opacity-60"
            >
              Cancel
            </button>
          </div>
        ) : null}

        <Card title="Recent activity">
          <div className="overflow-hidden rounded-[12px] border border-[#eceeec]">
            <div className="w-full max-w-full overflow-x-auto overscroll-x-contain touch-pan-x [-webkit-overflow-scrolling:touch]">
              <table className="w-full min-w-[620px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-[#edf0ee] bg-[#f6f8f6]">
                    {['Time', 'Action', 'Module', 'Target / IP'].map((column) => (
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
                  {activity.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-[13px] text-[#7c8780]">
                        No recent activity.
                      </td>
                    </tr>
                  ) : null}
                  {activity.map((entry, index) => (
                    <tr
                      key={entry.id || `${entry.time}-${index}`}
                      className="border-b border-[#edf0ee] bg-white last:border-0"
                    >
                      <td className="whitespace-nowrap px-4 py-3.5 text-[12.5px] text-[#455249]">
                        {entry.time}
                      </td>
                      <td className="px-4 py-3.5 text-[13px] font-medium text-[#17231c]">
                        {entry.action}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-[12.5px] text-[#455249]">
                        {entry.module}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-[12.5px] text-[#455249]">
                        {entry.target}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
