import { useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { cn } from '../../../components/admin/cn'

const inputClass =
  'box-border h-[40px] w-full rounded-[8px] border border-[rgba(0,0,0,0.1)] bg-white px-3 text-[13px] text-[#17231c] outline-none transition placeholder:text-[#9aa49d] focus:border-[#1aa054]'
const labelClass = 'mb-1.5 block text-[12px] font-medium text-[#68736c]'

const steps = ['Account', 'Role & scope', 'Review']
const roles = [
  'Super Admin',
  'Admin',
  'Country Manager',
  'Operations Manager',
  'Operations Supervisor',
  'Dispatcher',
  'Support Agent',
  'Finance',
  'Marketing Manager',
]
const SCOPE_LEVELS = ['Global (all countries)', 'Country', 'Zone / City']
const COUNTRIES = ['Bahrain', 'Saudi Arabia', 'UAE', 'Kuwait', 'Qatar', 'Oman']
const ZONES = ['Manama', 'Muharraq', 'Riffa', 'Isa Town', 'Hamad Town', 'Sitra']

const ACTIONS = ['view', 'create', 'edit', 'delete', 'approve']
const ACTION_LABELS = {
  view: 'View',
  create: 'Create',
  edit: 'Edit',
  delete: 'Delete',
  approve: 'Approve',
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
  const options = Array.isArray(children) ? children : []
  const display =
    options.find((child) => child?.props?.value === value)?.props?.children ?? value

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
  const selected = multi ? value : [value]

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const isActive = selected.includes(option)
        return (
          <button
            key={option}
            type="button"
            onClick={() => {
              if (!multi) {
                onChange(option)
                return
              }
              onChange(
                isActive
                  ? value.filter((item) => item !== option)
                  : [...value, option],
              )
            }}
            className={cn(
              'h-[32px] rounded-full border px-3.5 text-[12.5px] transition',
              isActive
                ? 'border-[#1aa054] bg-[#e8f7ed] font-bold text-[#147940]'
                : 'border-[#e0e5e1] bg-white font-medium text-[#59655e] hover:bg-[#f6f8f6]',
            )}
          >
            {option}
          </button>
        )
      })}
    </div>
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

export default function AdminCreateUserPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    jobTitle: '',
    username: 'name@yjeek.com',
    password: 'Yj#9kQ2m!',
    role: 'Operations Manager',
    scopeLevel: 'Country',
    countries: ['Bahrain'],
    zones: ['Manama', 'Muharraq'],
  })
  const [permissions, setPermissions] = useState(buildDefaultPermissions)

  const update = (key) => (event) => {
    const value = event.target.value
    setForm((current) => ({
      ...current,
      [key]: value,
      ...(key === 'email' && (!current.username || current.username === current.email || current.username === 'name@yjeek.com')
        ? { username: value || 'name@yjeek.com' }
        : {}),
    }))
  }

  const setScopeLevel = (scopeLevel) => {
    setForm((current) => ({
      ...current,
      scopeLevel,
      ...(scopeLevel === 'Global (all countries)'
        ? { countries: [], zones: [] }
        : {
            countries: current.countries.length ? current.countries : ['Bahrain'],
            zones: current.zones.length ? current.zones : ['Manama', 'Muharraq'],
          }),
    }))
  }

  const togglePermission = (moduleId, action) => {
    setPermissions((current) => ({
      ...current,
      [moduleId]: { ...current[moduleId], [action]: !current[moduleId][action] },
    }))
  }

  const cancel = () => navigate('/admin/users')
  const showCountries = form.scopeLevel !== 'Global (all countries)'
  const showZones = form.scopeLevel !== 'Global (all countries)'
  const scopeLevelLabel = form.scopeLevel.replace(' (all countries)', '').replace(' / City', '')

  const goNext = () => {
    if (step < steps.length - 1) {
      setStep((current) => current + 1)
      return
    }
    navigate('/admin/users')
  }

  return (
    <div className="px-5 py-4 pb-8 max-[700px]:px-3">
      <div className="mb-3.5">
        <h2 className="text-[20px] font-bold tracking-[-0.02em] text-[#17231c]">Create user</h2>
        <p className="mt-0.5 text-[12.5px] text-[#7c8780]">Invite a staff member to the admin panel</p>
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
              <Field label="Temporary password">
                <input
                  className={inputClass}
                  value={form.password}
                  onChange={update('password')}
                />
              </Field>
            </div>
          </Card>
        </div>
      ) : null}

      {step === 1 ? (
        <Card
          title="Role & scope"
          subtitle="Role defines permissions. Scope limits which country / zones the user can manage."
        >
          <div className="space-y-4">
            <Field label="Role">
              <div className="max-w-[420px]">
                <Select label="Role" value={form.role} onChange={update('role')}>
                  {roles.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </Select>
              </div>
            </Field>

            <div>
              <p className={labelClass}>Scope level</p>
              <PillGroup
                options={SCOPE_LEVELS}
                value={form.scopeLevel}
                onChange={setScopeLevel}
              />
            </div>

            {showCountries ? (
              <div>
                <p className={labelClass}>Countries</p>
                <PillGroup
                  multi
                  options={COUNTRIES}
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
                  options={ZONES}
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
              <ReviewField label="Username" value={form.username} />
              <ReviewField label="Password" value={form.password} />
            </div>
          </Card>

          <Card title="Role & scope">
            <div className="grid grid-cols-4 gap-4 max-[900px]:grid-cols-2 max-[520px]:grid-cols-1">
              <ReviewField label="Role" value={form.role} />
              <ReviewField label="Scope level" value={scopeLevelLabel} />
              <ReviewField
                label="Countries"
                value={form.countries.length ? form.countries.join(', ') : 'All'}
              />
              <ReviewField
                label="Zones"
                value={form.zones.length ? form.zones.join(', ') : '—'}
              />
            </div>
          </Card>

          <Card
            title="Permissions"
            subtitle="Inherited from role — toggle to override for this user."
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
                                onChange={() => togglePermission(module.id, action)}
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
          </Card>
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
        {step > 0 ? (
          <button
            type="button"
            onClick={() => setStep((current) => current - 1)}
            className="inline-flex h-[36px] items-center rounded-full border border-[#dfe4e0] bg-white px-4 text-[12.5px] font-bold text-[#455249] hover:bg-[#f6f8f6]"
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
          onClick={goNext}
          className="inline-flex h-[36px] items-center rounded-full bg-[#1aa054] px-5 text-[12.5px] font-bold text-white hover:bg-[#158a47]"
        >
          {step === 0 ? 'Next: Role & scope' : step === 1 ? 'Next: Review' : 'Create & invite'}
        </button>
      </div>
    </div>
  )
}
