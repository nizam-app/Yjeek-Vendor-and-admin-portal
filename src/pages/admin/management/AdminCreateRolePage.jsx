import { useState } from 'react'
import { Check, ChevronDown, Info } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { cn } from '../../../components/admin/cn'

const inputClass =
  'box-border h-[40px] w-full rounded-[8px] border border-[rgba(0,0,0,0.1)] bg-white px-3 text-[13px] text-[#17231c] outline-none transition placeholder:text-[#9aa49d] focus:border-[#1aa054]'
const labelClass = 'mb-1.5 block text-[12px] font-medium text-[#68736c]'

const TEMPLATES = [
  'Operations Manager',
  'Country Manager',
  'Operations Supervisor',
  'Dispatcher',
  'Support Agent',
  'Finance',
  'Marketing Manager',
  'Start from scratch',
]

const SCOPE_LEVELS = ['Global (all countries)', 'Country', 'Zone / City']

const ACTIONS = ['view', 'create', 'edit', 'delete', 'approve']
const ACTION_LABELS = {
  view: 'View',
  create: 'Create',
  edit: 'Edit',
  delete: 'Delete',
  approve: 'Approve / Export',
}

const MODULES = [
  { id: 'live-dashboard', label: 'Live Dashboard', defaults: ['view', 'edit'] },
  { id: 'scheduled-orders', label: 'Scheduled Orders', defaults: ['view', 'create', 'edit', 'approve'] },
  { id: 'vendor-management', label: 'Vendor Management', defaults: ['view', 'edit'] },
  { id: 'store-management', label: 'Store Management', defaults: ['view'] },
  { id: 'fleet-management', label: 'Fleet Management', defaults: ['view', 'create', 'edit', 'approve'] },
  { id: 'customer-management', label: 'Customer Management', defaults: ['view', 'create', 'edit'] },
  { id: 'marketing', label: 'Marketing', defaults: ['view'] },
  { id: 'ui-editor', label: 'UI Editor', defaults: [] },
  { id: 'users-roles', label: 'Users & Roles', defaults: [] },
  { id: 'reports', label: 'Reports', defaults: ['view', 'approve'] },
  { id: 'settings', label: 'Settings', defaults: [] },
]

function buildDefaultPermissions() {
  return MODULES.reduce((acc, module) => {
    acc[module.id] = ACTIONS.reduce((row, action) => {
      row[action] = module.defaults.includes(action)
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
      <div className={subtitle ? 'mt-4' : 'mt-4'}>{children}</div>
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
  const [form, setForm] = useState({
    name: '',
    template: 'Operations Manager',
    description: '',
    scopeLevel: 'Zone / City',
  })
  const [permissions, setPermissions] = useState(buildDefaultPermissions)

  const update = (key) => (event) => {
    setForm((current) => ({ ...current, [key]: event.target.value }))
  }

  const toggle = (moduleId, action) => {
    setPermissions((current) => ({
      ...current,
      [moduleId]: { ...current[moduleId], [action]: !current[moduleId][action] },
    }))
  }

  const submit = (event) => {
    event.preventDefault()
    navigate('/admin/users/roles')
  }

  return (
    <form onSubmit={submit} className="px-5 py-4 pb-8 max-[700px]:px-3">
      <div className="mb-3.5">
        <h2 className="text-[20px] font-bold tracking-[-0.02em] text-[#17231c]">Create role</h2>
        <p className="mt-0.5 text-[12.5px] text-[#7c8780]">
          Name the role, set scope, and configure permissions
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
                />
              </Field>
              <Field label="Based on (template)">
                <div className="relative">
                  <div
                    className={cn(
                      inputClass,
                      'flex items-center pr-9',
                    )}
                  >
                    <span className="truncate">{form.template}</span>
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
                    value={form.template}
                    onChange={update('template')}
                  >
                    {TEMPLATES.map((template) => (
                      <option key={template} value={template}>
                        {template}
                      </option>
                    ))}
                  </select>
                </div>
              </Field>
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
                {SCOPE_LEVELS.map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setForm((current) => ({ ...current, scopeLevel: level }))}
                    className={cn(
                      'h-[32px] rounded-full border px-3.5 text-[12.5px] transition',
                      form.scopeLevel === level
                        ? 'border-[#1aa054] bg-[#e8f7ed] font-bold text-[#147940]'
                        : 'border-[#e0e5e1] bg-white font-medium text-[#59655e] hover:bg-[#f6f8f6]',
                    )}
                  >
                    {level}
                  </button>
                ))}
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
                  {MODULES.map((module) => (
                    <tr key={module.id} className="border-b border-[#edf0ee] bg-white last:border-0">
                      <td className="whitespace-nowrap px-4 py-3 text-[13px] font-medium text-[#17231c]">
                        {module.label}
                      </td>
                      {ACTIONS.map((action) => (
                        <td key={action} className="px-4 py-3">
                          <div className="flex justify-center">
                            <PermissionCheckbox
                              checked={permissions[module.id][action]}
                              onChange={() => toggle(module.id, action)}
                              label={`${ACTION_LABELS[action]} ${module.label}`}
                            />
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-3 flex items-start gap-2 rounded-[10px] bg-[#eef4fd] px-3.5 py-2.5">
            <Info size={14} strokeWidth={2} className="mt-[1px] shrink-0 text-[#2b66a5]" aria-hidden />
            <p className="text-[12px] leading-[17px] text-[#2b66a5]">
              Scope (country / zone) is set per-user when assigning this role. Permissions here define
              WHAT, scope defines WHERE.
            </p>
          </div>
        </Card>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => navigate('/admin/users/roles')}
          className="inline-flex h-[36px] items-center rounded-full border border-[#dfe4e0] bg-white px-4 text-[12.5px] font-bold text-[#455249] hover:bg-[#f6f8f6]"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="inline-flex h-[36px] items-center rounded-full bg-[#1aa054] px-5 text-[12.5px] font-bold text-white hover:bg-[#158a47]"
        >
          Create role
        </button>
      </div>
    </form>
  )
}
