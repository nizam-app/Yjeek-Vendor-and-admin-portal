import { useEffect, useMemo, useState } from 'react'
import { Check, ChevronDown, Info } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
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

const FALLBACK_TEMPLATES = [
  'Operations Manager',
  'Country Manager',
  'Operations Supervisor',
  'Dispatcher',
  'Support Agent',
  'Finance',
  'Marketing Manager',
  'Start from scratch',
]

const FALLBACK_SCOPE_LEVELS = [
  { value: 'GLOBAL', label: 'Global (all countries)' },
  { value: 'COUNTRY', label: 'Country' },
  { value: 'ZONE', label: 'Zone / City' },
]

const FALLBACK_ACTIONS = ['view', 'create', 'edit', 'delete', 'approve', 'export']
const FALLBACK_ACTION_LABELS = {
  view: 'View',
  create: 'Create',
  edit: 'Edit',
  delete: 'Delete',
  approve: 'Approve',
  export: 'Export',
}

const FALLBACK_MODULES = [
  { id: 'live-dashboard', key: 'LIVE_DASHBOARD', label: 'Live Dashboard' },
  { id: 'scheduled-orders', key: 'SCHEDULED_ORDERS', label: 'Scheduled Orders' },
  { id: 'vendor-management', key: 'VENDOR_MANAGEMENT', label: 'Vendor Management' },
  { id: 'store-management', key: 'STORE_MANAGEMENT', label: 'Store Management' },
  { id: 'fleet-management', key: 'FLEET_MANAGEMENT', label: 'Fleet Management' },
  { id: 'customer-management', key: 'CUSTOMER_MANAGEMENT', label: 'Customer Management' },
  { id: 'marketing', key: 'MARKETING', label: 'Marketing' },
  { id: 'ui-editor', key: 'UI_EDITOR', label: 'UI Editor' },
  { id: 'users-roles', key: 'USERS_ROLES', label: 'Users & Roles' },
  { id: 'reports', key: 'REPORTS', label: 'Reports' },
  { id: 'sla-models', key: 'SLA_MODELS', label: 'SLA Models' },
  { id: 'settings', key: 'SETTINGS', label: 'Settings' },
]

function buildFallbackPermissions() {
  return FALLBACK_MODULES.reduce((acc, module) => {
    const key = module.key || module.id
    acc[key] = FALLBACK_ACTIONS.reduce((row, action) => {
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

export default function AdminCreateRolePage() {
  const navigate = useNavigate()
  const { roleId: roleIdParam } = useParams()
  const roleId = String(roleIdParam || '').trim()
  const isEdit = Boolean(roleId)
  const useRealUsers = isAdminRealApiFeature('users') || !apiConfig.adminUseMockApi

  const { data: meta, error: metaError, isLoading, refetch } = useApiResource(
    () => (useRealUsers ? adminService.getAdminRolesMeta() : Promise.resolve({ data: null })),
    [useRealUsers],
  )

  const {
    data: roleDetail,
    error: roleError,
    isLoading: roleLoading,
    refetch: refetchRole,
  } = useApiResource(() => {
    if (!useRealUsers || !isEdit) return Promise.resolve({ data: null })
    return adminService.getAdminRoleDetail(roleId)
  }, [useRealUsers, isEdit, roleId])

  const modules = useMemo(() => {
    if (meta?.modules?.length) return meta.modules
    return FALLBACK_MODULES
  }, [meta])

  const actionKeys = useMemo(() => {
    if (meta?.actionKeys?.length) return meta.actionKeys
    return FALLBACK_ACTIONS
  }, [meta])

  const scopeLevels = useMemo(() => {
    if (meta?.scopeLevels?.length) return meta.scopeLevels
    return FALLBACK_SCOPE_LEVELS
  }, [meta])

  const templates = useMemo(() => {
    const scratch = {
      id: '__scratch__',
      name: 'Start from scratch',
      permissions: {},
      scopeLevel: 'COUNTRY',
    }
    if (meta?.templates?.length) {
      // Scratch first — avoids inheriting a base role until the admin picks a template.
      return [scratch, ...meta.templates]
    }
    return [
      scratch,
      ...FALLBACK_TEMPLATES.filter((name) => name !== 'Start from scratch').map((name) => ({
        id: name,
        name,
        permissions: {},
      })),
    ]
  }, [meta])

  const [form, setForm] = useState({
    name: '',
    templateId: '__scratch__',
    description: '',
    scopeLevel: 'COUNTRY',
  })
  const [permissions, setPermissions] = useState(buildFallbackPermissions)
  const [metaApplied, setMetaApplied] = useState(false)
  const [roleApplied, setRoleApplied] = useState(false)
  const [saving, setSaving] = useState(false)
  const [submitError, setSubmitError] = useState(null)

  useEffect(() => {
    setRoleApplied(false)
  }, [roleId])

  useEffect(() => {
    if (!meta || metaApplied) return
    const nextScope = meta.scopeLevels?.[0]?.value || 'COUNTRY'
    if (!isEdit) {
      setForm((current) => ({
        ...current,
        templateId: '__scratch__',
        scopeLevel: nextScope,
      }))
      setPermissions(meta.emptyPermissions ? meta.emptyPermissions() : buildFallbackPermissions())
    }
    setMetaApplied(true)
  }, [meta, metaApplied, isEdit])

  useEffect(() => {
    if (!isEdit || !roleDetail || roleApplied) return
    if (!metaApplied && useRealUsers) return

    const moduleList = modules
    const actions = actionKeys
    setForm({
      name: roleDetail.name || '',
      templateId: roleDetail.basedOnRoleId || '__scratch__',
      description: roleDetail.description === '—' ? '' : roleDetail.description || '',
      scopeLevel: roleDetail.scopeLevelValue || roleDetail.raw?.scopeLevel || 'COUNTRY',
    })
    setPermissions(mapApiRoleToPermissionFlags(roleDetail, moduleList, actions))
    setRoleApplied(true)
  }, [isEdit, roleDetail, roleApplied, metaApplied, useRealUsers, modules, actionKeys])

  const update = (key) => (event) => {
    setForm((current) => ({ ...current, [key]: event.target.value }))
  }

  const onTemplateChange = (templateId) => {
    if (isEdit) return
    const template = templates.find((item) => String(item.id) === String(templateId))
    setForm((current) => ({
      ...current,
      templateId,
      description: template?.description || current.description,
      scopeLevel: template?.scopeLevel || current.scopeLevel,
    }))
    if (meta?.permissionsFromTemplate && template && templateId !== '__scratch__') {
      setPermissions(meta.permissionsFromTemplate(template))
    } else if (meta?.emptyPermissions) {
      setPermissions(meta.emptyPermissions())
    }
  }

  const toggle = (moduleKey, action) => {
    setPermissions((current) => ({
      ...current,
      [moduleKey]: { ...current[moduleKey], [action]: !current[moduleKey]?.[action] },
    }))
  }

  const selectedTemplateLabel =
    templates.find((item) => String(item.id) === String(form.templateId))?.name ||
    form.templateId ||
    'Start from scratch'

  const submit = async (event) => {
    event.preventDefault()
    setSubmitError(null)

    if (!useRealUsers) {
      navigate('/admin/users/roles')
      return
    }

    setSaving(true)
    try {
      if (isEdit) {
        await adminService.updateAdminRole(roleId, {
          name: form.name,
          description: form.description,
          scopeLevel: form.scopeLevel,
          permissionsMatrix: permissions,
          modules,
        })
      } else {
        await adminService.createAdminRole({
          name: form.name,
          description: form.description,
          scopeLevel: form.scopeLevel,
          templateId: form.templateId,
          basedOnRoleId: form.templateId,
          permissionsMatrix: permissions,
          modules,
        })
      }
      navigate('/admin/users/roles')
    } catch (err) {
      setSubmitError(
        formatApiErrorMessage(err, isEdit ? 'Failed to update role.' : 'Failed to create role.'),
      )
    } finally {
      setSaving(false)
    }
  }

  if (useRealUsers && isLoading && !meta) {
    return <ApiState isLoading error={metaError} onRetry={refetch} />
  }

  if (useRealUsers && isEdit && roleLoading && !roleDetail) {
    return (
      <ApiState
        isLoading
        error={roleError}
        onRetry={refetchRole}
      />
    )
  }

  if (useRealUsers && isEdit && roleError && !roleDetail) {
    return <ApiState error={roleError} onRetry={refetchRole} />
  }

  return (
    <form onSubmit={submit} className="px-5 py-4 pb-8 max-[700px]:px-3">
      <div className="mb-3.5">
        <h2 className="text-[20px] font-bold tracking-[-0.02em] text-[#17231c]">
          {isEdit ? 'Edit role' : 'Create role'}
        </h2>
        <p className="mt-0.5 text-[12.5px] text-[#7c8780]">
          {isEdit
            ? 'Update name, scope, and permissions for this role'
            : 'Name the role, set scope, and configure permissions'}
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
              item === 'Roles'
                ? 'bg-[#e8f7ed] text-[#1aa054]'
                : 'bg-white text-[#69756d] ring-1 ring-[#e4e8e4] hover:text-[#455249]',
            )}
          >
            {item}
          </button>
        ))}
      </div>

      {metaError ? (
        <div className="mb-3 rounded-[10px] border border-[#f5c6c4] bg-[#fdebec] px-3 py-2 text-[12px] text-[#d64044]">
          {metaError.message || 'Failed to load role meta.'}
        </div>
      ) : null}
      {roleError && isEdit ? (
        <div className="mb-3 rounded-[10px] border border-[#f5c6c4] bg-[#fdebec] px-3 py-2 text-[12px] text-[#d64044]">
          {roleError.message || 'Failed to load role.'}
        </div>
      ) : null}
      {submitError ? (
        <div className="mb-3 rounded-[10px] border border-[#f5c6c4] bg-[#fdebec] px-3 py-2 text-[12px] text-[#d64044]">
          {submitError}
        </div>
      ) : null}

      <div className="space-y-4">
        <Card title="Role details">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 max-[700px]:grid-cols-1">
              <Field label="Role name">
                <input
                  required
                  className={inputClass}
                  placeholder="e.g. Operations Supervisor"
                  value={form.name}
                  onChange={update('name')}
                  disabled={Boolean(roleDetail?.isSystem)}
                />
              </Field>
              {!isEdit ? (
                <Field label="Based on (template)">
                  <div className="relative">
                    <div className={cn(inputClass, 'flex items-center pr-9')}>
                      <span className="truncate">{selectedTemplateLabel}</span>
                    </div>
                    <ChevronDown
                      size={15}
                      strokeWidth={2}
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#7c8780]"
                      aria-hidden
                    />
                    <select
                      aria-label="Based on template"
                      className="absolute inset-0 h-full w-full cursor-pointer appearance-none opacity-0 outline-none"
                      value={form.templateId}
                      onChange={(event) => onTemplateChange(event.target.value)}
                    >
                      {templates.map((template) => (
                        <option key={template.id} value={template.id}>
                          {template.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </Field>
              ) : (
                <Field label="Type">
                  <div className={cn(inputClass, 'flex items-center text-[#68736c]')}>
                    {roleDetail?.type || (roleDetail?.isSystem ? 'System' : 'Active')}
                  </div>
                </Field>
              )}
            </div>

            <Field label="Description">
              <input
                className={inputClass}
                placeholder="Short description of this role"
                value={form.description}
                onChange={update('description')}
              />
            </Field>

            <div>
              <p className={labelClass}>Scope level</p>
              <div className="flex flex-wrap gap-2">
                {scopeLevels.map((level) => {
                  const value = level.value || level
                  const label = level.label || level
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setForm((current) => ({ ...current, scopeLevel: value }))}
                      disabled={Boolean(roleDetail?.isSystem)}
                      className={cn(
                        'h-[32px] rounded-full border px-3.5 text-[12.5px] transition',
                        form.scopeLevel === value
                          ? 'border-[#1aa054] bg-[#e8f7ed] font-bold text-[#147940]'
                          : 'border-[#e0e5e1] bg-white font-medium text-[#59655e] hover:bg-[#f6f8f6]',
                        roleDetail?.isSystem && 'cursor-not-allowed opacity-60',
                      )}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </Card>

        <Card title="Permissions" subtitle="Toggle what this role can do in each module">
          <div className="overflow-hidden rounded-[12px] border border-[#eceeec]">
            <div className="w-full max-w-full overflow-x-auto overscroll-x-contain touch-pan-x [-webkit-overflow-scrolling:touch]">
              <table className="w-full min-w-[720px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-[#edf0ee] bg-[#f6f8f6]">
                    <th className="whitespace-nowrap px-4 py-2.5 text-[10px] font-medium uppercase tracking-[0.05em] text-[#8a948e]">
                      Module
                    </th>
                    {actionKeys.map((action) => (
                      <th
                        key={action}
                        className="whitespace-nowrap px-4 py-2.5 text-center text-[10px] font-medium uppercase tracking-[0.05em] text-[#8a948e]"
                      >
                        {FALLBACK_ACTION_LABELS[action] || action}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {modules.map((module) => {
                    const moduleKey = module.key || module.id
                    return (
                      <tr key={moduleKey} className="border-b border-[#edf0ee] bg-white last:border-0">
                        <td className="whitespace-nowrap px-4 py-3 text-[13px] font-medium text-[#17231c]">
                          {module.label}
                        </td>
                        {actionKeys.map((action) => (
                          <td key={action} className="px-4 py-3">
                            <div className="flex justify-center">
                              <PermissionCheckbox
                                checked={Boolean(permissions[moduleKey]?.[action])}
                                onChange={() => toggle(moduleKey, action)}
                                label={`${FALLBACK_ACTION_LABELS[action] || action} ${module.label}`}
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

          <div className="mt-3 flex items-start gap-2 rounded-[10px] bg-[#eef4fd] px-3.5 py-2.5">
            <Info size={14} strokeWidth={2} className="mt-[1px] shrink-0 text-[#2b66a5]" aria-hidden />
            <p className="text-[12px] leading-[17px] text-[#2b66a5]">
              Scope (country / zone) is set per-user when assigning this role. Permissions here define
              WHAT, scope defines WHERE.
              {!isEdit
                ? ' Prefer “Start from scratch” unless you want the API to inherit unspecified modules from a template role.'
                : null}
            </p>
          </div>
        </Card>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => navigate('/admin/users/roles')}
          disabled={saving}
          className="inline-flex h-[36px] items-center rounded-full border border-[#dfe4e0] bg-white px-4 text-[12.5px] font-bold text-[#455249] hover:bg-[#f6f8f6] disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving || Boolean(roleDetail?.isSystem)}
          className="inline-flex h-[36px] items-center rounded-full bg-[#1aa054] px-5 text-[12.5px] font-bold text-white hover:bg-[#158a47] disabled:opacity-60"
        >
          {saving
            ? isEdit
              ? 'Saving…'
              : 'Creating…'
            : isEdit
              ? 'Save changes'
              : 'Create role'}
        </button>
      </div>
    </form>
  )
}
