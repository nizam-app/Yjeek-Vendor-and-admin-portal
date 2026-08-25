import { useCallback, useEffect, useMemo, useState } from 'react'
import { Check, ChevronDown, Eye, EyeOff } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useApiResource } from '../../../hooks/useApiResource'
import { isAdminRealApiFeature, apiConfig } from '../../../api/config'
import { formatApiErrorMessage } from '../../../api/errors'
import { mapApiRoleToPermissionFlags } from '../../../mappers/admin/mapAdminRoles'
import { adminService } from '../../../services/adminService'
import { ApiState } from '../../../components/admin/ApiState'
import { cn } from '../../../components/admin/cn'

const inputClass =
  'box-border h-[40px] w-full rounded-[8px] border border-[rgba(0,0,0,0.1)] bg-white px-3 text-[13px] text-[#17231c] outline-none transition placeholder:text-[#9aa49d] focus:border-[#1aa054]'
const labelClass = 'mb-1.5 block text-[12px] font-medium text-[#68736c]'

const steps = ['Account', 'Role & scope', 'Review']

const FALLBACK_SCOPE_LEVELS = [
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

const ACTIONS = ['view', 'create', 'edit', 'delete', 'approve', 'export']
const ACTION_LABELS = {
  view: 'View',
  create: 'Create',
  edit: 'Edit',
  delete: 'Delete',
  approve: 'Approve',
  export: 'Export',
}

const FALLBACK_MODULES = [
  { key: 'LIVE_DASHBOARD', label: 'Live Dashboard' },
  { key: 'SCHEDULED_ORDERS', label: 'Scheduled Orders' },
  { key: 'VENDOR_MANAGEMENT', label: 'Vendor Management' },
  { key: 'STORE_MANAGEMENT', label: 'Store Management' },
  { key: 'FLEET_MANAGEMENT', label: 'Fleet Management' },
  { key: 'CUSTOMER_MANAGEMENT', label: 'Customer Management' },
  { key: 'MARKETING', label: 'Marketing' },
  { key: 'UI_EDITOR', label: 'UI Editor' },
  { key: 'USERS_ROLES', label: 'Users & Roles' },
  { key: 'REPORTS', label: 'Reports' },
  { key: 'SETTINGS', label: 'Settings' },
]

function emptyPermissions(modules) {
  return modules.reduce((acc, module) => {
    const key = module.key || module.module || module.id
    acc[key] = ACTIONS.reduce((row, action) => {
      row[action] = false
      return row
    }, {})
    return acc
  }, {})
}

function Card({ title, subtitle, children }) {
  return (
    <section className="rounded-[14px] border border-[#e3e7e4] bg-white p-5 shadow-[0_1px_2px_rgba(20,40,28,.03)] max-[700px]:p-4">
      <h3 className="text-[15px] font-bold text-[#17231c]">{title}</h3>
      {subtitle ? <p className="mt-0.5 text-[12px] text-[#7c8780]">{subtitle}</p> : null}
      <div className="mt-4">{children}</div>
    </section>
  )
}

function Field({ label, children }) {
  return (
    <label className="block min-w-0">
      <span className={labelClass}>{label}</span>
      {children}
    </label>
  )
}

function ReviewField({ label, value }) {
  return (
    <div className="min-w-0">
      <p className="text-[12px] text-[#7c8780]">{label}</p>
      <p className="mt-1 truncate text-[13px] font-medium text-[#17231c]">{value || '—'}</p>
    </div>
  )
}

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

function PillGroup({ options, value, onChange, multi = false, lockedValue = null }) {
  const normalized = options.map((option) =>
    typeof option === 'object'
      ? { value: option.value ?? option.code ?? option.id, label: option.label ?? option.name ?? option.value }
      : { value: option, label: option },
  )
  const selected = multi ? value : [value]

  return (
    <div className="flex flex-wrap gap-2">
      {normalized.map((option) => {
        const isActive = selected.includes(option.value)
        const isLockedOut =
          lockedValue != null && !multi && String(option.value) !== String(lockedValue)
        return (
          <button
            key={option.value}
            type="button"
            disabled={isLockedOut}
            title={
              isLockedOut
                ? 'Scope is fixed by the selected role'
                : undefined
            }
            onClick={() => {
              if (isLockedOut) return
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
              isLockedOut && 'cursor-not-allowed opacity-40 hover:bg-white',
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

function PermissionCheckbox({ checked, onChange, label, disabled = false }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      aria-disabled={disabled}
      disabled={disabled}
      onClick={disabled ? undefined : onChange}
      className={cn(
        'grid h-[17px] w-[17px] place-items-center rounded-[4px] border transition',
        checked
          ? 'border-[#1aa054] bg-[#1aa054] text-white'
          : 'border-[#cfd6d1] bg-white',
        disabled
          ? 'cursor-not-allowed opacity-70'
          : checked
            ? ''
            : 'hover:border-[#9aa49d]',
      )}
    >
      {checked ? <Check size={12} strokeWidth={3} /> : null}
    </button>
  )
}

function scopePatchForLevel(scopeLevel, current, countryOptions, zoneOptions = []) {
  if (scopeLevel === 'GLOBAL') {
    return { countries: [], zones: [] }
  }
  const countries = current.countries?.length
    ? current.countries
    : countryOptions[0]?.code
      ? [countryOptions[0].code]
      : ['BH']
  if (scopeLevel !== 'ZONE') {
    return { countries, zones: [] }
  }
  const zones = current.zones?.length
    ? current.zones
    : zoneOptions[0]
      ? [zoneOptions[0]]
      : []
  return {
    countries: countries.includes('BH') ? countries : ['BH', ...countries.filter((c) => c !== 'BH')],
    zones,
  }
}

export default function AdminCreateUserPage() {
  const navigate = useNavigate()
  const useRealUsers = isAdminRealApiFeature('users') || !apiConfig.adminUseMockApi
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [submitError, setSubmitError] = useState(null)

  const { data: meta, error: metaError, isLoading: metaLoading, refetch: refetchMeta } =
    useApiResource(
      () => (useRealUsers ? adminService.getAdminUsersMeta() : Promise.resolve({ data: null })),
      [useRealUsers],
    )

  const { data: rolesPage, error: rolesError, isLoading: rolesLoading, refetch: refetchRoles } =
    useApiResource(
      () => (useRealUsers ? adminService.listAdminRoles() : Promise.resolve({ data: null })),
      [useRealUsers],
    )

  const roleOptions = useMemo(() => {
    if (meta?.roles?.length) return meta.roles
    const rows = rolesPage?.roles?.rows || []
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      scopeLevel: row.scopeLevelValue || row.scopeLevel || '',
      permissions: row.permissions || {},
      permissionsMatrix: row.permissionsMatrix || [],
    }))
  }, [meta, rolesPage])

  const countryOptions = useMemo(() => {
    if (meta?.countries?.length) return meta.countries
    return FALLBACK_COUNTRIES
  }, [meta])

  const zoneOptions = useMemo(() => {
    if (meta?.zones?.length) {
      return meta.zones.map((z) => z.name || z.id)
    }
    return FALLBACK_ZONES
  }, [meta])

  const scopeLevelOptions = useMemo(() => {
    if (meta?.scopeLevels?.length) {
      return meta.scopeLevels.map((item) => ({
        value: String(item.value || item).toUpperCase(),
        label: item.label || item.value || item,
      }))
    }
    return FALLBACK_SCOPE_LEVELS
  }, [meta])

  const modules = useMemo(() => {
    if (meta?.modules?.length) {
      return meta.modules.map((m) => ({
        key: m.module || m.key,
        label: m.moduleLabel || m.label || m.module || m.key,
      }))
    }
    return FALLBACK_MODULES
  }, [meta])

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    countryCode: '+973',
    jobTitle: '',
    username: '',
    password: '',
    roleId: '',
    scopeLevel: 'COUNTRY',
    countries: ['BH'],
    zones: [],
  })
  const [permissions, setPermissions] = useState(() => emptyPermissions(FALLBACK_MODULES))
  const [bootstrapped, setBootstrapped] = useState(false)

  const applyRoleLimits = useCallback(
    (role, currentForm = {}) => {
      const scopeLevel = String(role?.scopeLevel || 'COUNTRY').toUpperCase() || 'COUNTRY'
      const nextForm = {
        ...currentForm,
        roleId: role?.id || currentForm.roleId || '',
        scopeLevel,
        ...scopePatchForLevel(scopeLevel, currentForm, countryOptions, zoneOptions),
      }
      const flags = mapApiRoleToPermissionFlags(role || {}, modules)
      setPermissions(Object.keys(flags).length ? flags : emptyPermissions(modules))
      return nextForm
    },
    [countryOptions, zoneOptions, modules],
  )

  useEffect(() => {
    if (!useRealUsers || bootstrapped) return
    if (metaLoading || rolesLoading) return

    const firstRole = roleOptions[0]
    setForm((current) => {
      const withPassword = {
        ...current,
        password: meta?.suggestedTemporaryPassword || current.password,
        countries: current.countries.length
          ? current.countries
          : countryOptions[0]?.code
            ? [countryOptions[0].code]
            : ['BH'],
      }
      if (!firstRole) {
        setPermissions(emptyPermissions(modules))
        return withPassword
      }
      return applyRoleLimits(firstRole, withPassword)
    })
    setBootstrapped(true)
  }, [
    useRealUsers,
    bootstrapped,
    metaLoading,
    rolesLoading,
    roleOptions,
    meta,
    countryOptions,
    modules,
    applyRoleLimits,
  ])

  const selectedRole = roleOptions.find((role) => String(role.id) === String(form.roleId))
  const lockedScopeLevel = String(selectedRole?.scopeLevel || form.scopeLevel || '').toUpperCase()
  const scopeLabel =
    scopeLevelOptions.find((item) => item.value === form.scopeLevel)?.label || form.scopeLevel

  const update = (key) => (event) => {
    const value = event.target.value
    setForm((current) => ({
      ...current,
      [key]: value,
      ...(key === 'email' && (!current.username || current.username === current.email)
        ? { username: value }
        : {}),
    }))
  }

  const onRoleChange = async (roleId) => {
    const fromMeta = roleOptions.find((role) => String(role.id) === String(roleId))
    if (fromMeta?.permissionsMatrix?.length || Object.keys(fromMeta?.permissions || {}).length) {
      setForm((current) => applyRoleLimits(fromMeta, { ...current, roleId }))
      return
    }

    setForm((current) => applyRoleLimits(fromMeta || { id: roleId, scopeLevel: current.scopeLevel }, { ...current, roleId }))

    if (!roleId || !useRealUsers) return
    try {
      const result = await adminService.getAdminRoleDetail(roleId)
      const detail = result?.data
      if (!detail) return
      setForm((current) =>
        applyRoleLimits(
          {
            id: roleId,
            scopeLevel: detail.scopeLevelValue || detail.scopeLevel || fromMeta?.scopeLevel,
            permissions: detail.permissions || detail.raw?.permissions || {},
            permissionsMatrix: detail.permissionsMatrix || [],
          },
          current,
        ),
      )
    } catch {
      // Keep role-locked scope even if permission detail fails.
    }
  }

  const setScopeLevel = (scopeLevel) => {
    if (lockedScopeLevel && scopeLevel !== lockedScopeLevel) return
    setForm((current) => ({
      ...current,
      scopeLevel,
      ...scopePatchForLevel(scopeLevel, current, countryOptions, zoneOptions),
    }))
  }

  const cancel = () => navigate('/admin/users')
  const showCountries = form.scopeLevel !== 'GLOBAL'
  const showZones = form.scopeLevel === 'ZONE'

  const countryLabels = form.countries
    .map((code) => countryOptions.find((c) => c.code === code)?.name || code)
    .join(', ')

  async function handleCreate() {
    setSubmitError(null)

    if (!useRealUsers) {
      navigate('/admin/users')
      return
    }

    if (!String(form.password || '').trim()) {
      setSubmitError('Password is required.')
      setStep(0)
      return
    }

    setSaving(true)
    try {
      const created = await adminService.createAdminUser({
        ...form,
        username: form.username || form.email,
        sendInvite: false,
        temporaryPassword: form.password,
        password: form.password,
        permissionOverrides: {},
      })
      const id = created?.data?.row?.id
      navigate(id ? `/admin/users/${encodeURIComponent(id)}` : '/admin/users')
    } catch (err) {
      setSubmitError(formatApiErrorMessage(err, 'Failed to create user.'))
    } finally {
      setSaving(false)
    }
  }

  const goNext = async () => {
    if (step === 0 && !String(form.password || '').trim()) {
      setSubmitError('Password is required.')
      return
    }
    if (step < steps.length - 1) {
      setSubmitError(null)
      setStep((current) => current + 1)
      return
    }
    await handleCreate()
  }

  if (useRealUsers && (metaLoading || rolesLoading) && !bootstrapped) {
    return (
      <ApiState
        isLoading
        error={metaError || rolesError}
        onRetry={() => {
          refetchMeta()
          refetchRoles()
        }}
      />
    )
  }

  return (
    <div className="px-5 py-4 pb-8 max-[700px]:px-3">
      <div className="mb-3.5">
        <h2 className="text-[20px] font-bold tracking-[-0.02em] text-[#17231c]">Create user</h2>
        <p className="mt-0.5 text-[12.5px] text-[#7c8780]">
          Create an admin account with a password. The user can log in immediately.
        </p>
      </div>

      <div className="mb-4 inline-flex items-center gap-1">
        {['Users', 'Roles', 'Activity log'].map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => {
              if (item === 'Users') navigate('/admin/users')
              if (item === 'Roles') navigate('/admin/users/roles')
              if (item === 'Activity log') navigate('/admin/users/activity')
            }}
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

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {steps.map((item, index) => (
          <button
            key={item}
            type="button"
            onClick={() => setStep(index)}
            className={cn(
              'inline-flex h-[34px] items-center gap-1.5 rounded-full border px-3.5 text-[12px] font-medium transition',
              index === step
                ? 'border-[#1aa054] bg-[#e8f7ed] text-[#147940]'
                : index < step
                  ? 'border-[#bfe8cc] bg-white text-[#147940]'
                  : 'border-[#dfe4e0] bg-white text-[#69756d] hover:bg-[#f6f8f6]',
            )}
          >
            {index < step ? <Check size={13} strokeWidth={2.5} /> : <span>{index + 1}</span>}
            {item}
          </button>
        ))}
      </div>

      {submitError ? (
        <div className="mb-3 rounded-[10px] border border-[#f5c6c4] bg-[#fdebec] px-3 py-2 text-[12px] text-[#d64044]">
          {submitError}
        </div>
      ) : null}

      {step === 0 ? (
        <div className="space-y-4">
          <Card title="Account info">
            <div className="grid grid-cols-2 gap-x-3 gap-y-4 max-[700px]:grid-cols-1">
              <Field label="Full name">
                <input
                  className={inputClass}
                  placeholder="e.g. Khalid Omar"
                  value={form.fullName}
                  onChange={update('fullName')}
                />
              </Field>
              <Field label="Email">
                <input
                  type="email"
                  className={inputClass}
                  placeholder="name@yjeek.com"
                  value={form.email}
                  onChange={update('email')}
                />
              </Field>
              <Field label="Phone">
                <input
                  className={inputClass}
                  placeholder="+973 3xxx xxxx"
                  value={form.phone}
                  onChange={update('phone')}
                />
              </Field>
              <Field label="Job title">
                <input
                  className={inputClass}
                  placeholder="e.g. Operations Manager"
                  value={form.jobTitle}
                  onChange={update('jobTitle')}
                />
              </Field>
            </div>
          </Card>

          <Card title="Login credentials">
            <div className="grid max-w-[420px] gap-4">
              <Field label="Username">
                <input
                  className={inputClass}
                  placeholder="name@yjeek.com"
                  value={form.username}
                  onChange={update('username')}
                />
              </Field>
              <Field label="Password">
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className={cn(inputClass, 'pr-11')}
                    value={form.password}
                    onChange={update('password')}
                    placeholder="Min 12 chars · upper, lower, number, symbol"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-2.5 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-md text-[#7c8780] hover:bg-[#f3f5f3] hover:text-[#455249]"
                  >
                    {showPassword ? <EyeOff size={16} strokeWidth={2} /> : <Eye size={16} strokeWidth={2} />}
                  </button>
                </div>
              </Field>
              <p className="text-[11px] text-[#8a948e]">
                Required. Share this password with the user securely. Account is Active right away —
                no invite email.
              </p>
            </div>
          </Card>
        </div>
      ) : null}

      {step === 1 ? (
        <Card
          title="Role & scope"
          subtitle="Role locks scope level and permissions. Countries / zones stay editable within that scope."
        >
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
                      {role.scopeLevel ? ` · ${role.scopeLevel}` : ''}
                    </option>
                  ))}
                </Select>
              </div>
            </Field>

            <div>
              <p className={labelClass}>Scope level</p>
              <PillGroup
                options={scopeLevelOptions}
                value={form.scopeLevel}
                lockedValue={lockedScopeLevel || null}
                onChange={setScopeLevel}
              />
              {lockedScopeLevel ? (
                <p className="mt-1.5 text-[11px] text-[#8a948e]">
                  Locked to {lockedScopeLevel} by {selectedRole?.name || 'selected role'}.
                </p>
              ) : null}
            </div>

            {showCountries ? (
              <div>
                <p className={labelClass}>Countries</p>
                <PillGroup
                  multi
                  options={countryOptions.map((c) => ({ value: c.code, label: c.name }))}
                  value={form.countries}
                  onChange={(countries) => setForm((current) => ({ ...current, countries }))}
                />
              </div>
            ) : null}

            {showZones ? (
              <div>
                <p className={labelClass}>Zones / Cities</p>
                <PillGroup
                  multi
                  options={zoneOptions}
                  value={form.zones}
                  onChange={(zones) => setForm((current) => ({ ...current, zones }))}
                />
              </div>
            ) : null}
          </div>
        </Card>
      ) : null}

      {step === 2 ? (
        <div className="space-y-4">
          <Card title="Account">
            <div className="grid grid-cols-4 gap-4 max-[900px]:grid-cols-2 max-[520px]:grid-cols-1">
              <ReviewField label="Full name" value={form.fullName} />
              <ReviewField label="Email" value={form.email} />
              <ReviewField label="Phone" value={form.phone} />
              <ReviewField label="Job title" value={form.jobTitle} />
            </div>
          </Card>

          <Card title="Login credentials">
            <div className="grid grid-cols-2 gap-4 max-[700px]:grid-cols-1">
              <ReviewField label="Username" value={form.username || form.email} />
              <ReviewField label="Password" value={form.password ? '••••••••' : '—'} />
            </div>
          </Card>

          <Card title="Role & scope">
            <div className="grid grid-cols-4 gap-4 max-[900px]:grid-cols-2 max-[520px]:grid-cols-1">
              <ReviewField label="Role" value={selectedRole?.name || '—'} />
              <ReviewField label="Scope level" value={scopeLabel} />
              <ReviewField
                label="Countries"
                value={form.scopeLevel === 'GLOBAL' ? 'All' : countryLabels || '—'}
              />
              <ReviewField
                label="Zones"
                value={form.zones.length ? form.zones.join(', ') : '—'}
              />
            </div>
          </Card>

          <Card
            title="Permissions"
            subtitle="Filled automatically from the selected role. Checkboxes are locked on create (permissionOverrides stay empty)."
          >
            <div className="overflow-hidden rounded-[12px] border border-[#eceeec]">
              <div className="w-full max-w-full overflow-x-auto overscroll-x-contain touch-pan-x [-webkit-overflow-scrolling:touch]">
                <table className="w-full min-w-[720px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-[#edf0ee] bg-[#f6f8f6]">
                      <th className="whitespace-nowrap px-4 py-2.5 text-[10px] font-medium uppercase tracking-[0.05em] text-[#8a948e]">
                        Module
                      </th>
                      {ACTIONS.map((action) => (
                        <th
                          key={action}
                          className="whitespace-nowrap px-4 py-2.5 text-center text-[10px] font-medium uppercase tracking-[0.05em] text-[#8a948e]"
                        >
                          {ACTION_LABELS[action]}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {modules.map((module) => {
                      const key = module.key
                      return (
                        <tr key={key} className="border-b border-[#edf0ee] bg-white last:border-0">
                          <td className="whitespace-nowrap px-4 py-3 text-[13px] font-medium text-[#17231c]">
                            {module.label}
                          </td>
                          {ACTIONS.map((action) => (
                            <td key={action} className="px-4 py-3">
                              <div className="flex justify-center">
                                <PermissionCheckbox
                                  checked={Boolean(permissions[key]?.[action])}
                                  disabled
                                  label={`${ACTION_LABELS[action]} ${module.label}`}
                                />
                              </div>
                            </td>
                          ))}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
        {step > 0 ? (
          <button
            type="button"
            disabled={saving}
            onClick={() => setStep((current) => current - 1)}
            className="inline-flex h-[36px] items-center rounded-full border border-[#dfe4e0] bg-white px-4 text-[12.5px] font-bold text-[#455249] hover:bg-[#f6f8f6] disabled:opacity-60"
          >
            Back
          </button>
        ) : (
          <button
            type="button"
            onClick={cancel}
            className="inline-flex h-[36px] items-center rounded-full border border-[#dfe4e0] bg-white px-4 text-[12.5px] font-bold text-[#455249] hover:bg-[#f6f8f6]"
          >
            Cancel
          </button>
        )}
        <button
          type="button"
          disabled={saving}
          onClick={goNext}
          className="inline-flex h-[36px] items-center rounded-full bg-[#1aa054] px-5 text-[12.5px] font-bold text-white hover:bg-[#158a47] disabled:opacity-60"
        >
          {saving
            ? 'Creating…'
            : step === 0
              ? 'Next: Role & scope'
              : step === 1
                ? 'Next: Review'
                : 'Create user'}
        </button>
      </div>
    </div>
  )
}
