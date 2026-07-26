import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'

const cn = (...parts) => parts.filter(Boolean).join(' ')

const labelClass = 'mb-1.5 block text-[12px] font-medium text-[#7c8780]'
const inputClass =
  'box-border h-[40px] w-full rounded-[8px] border border-[rgba(0,0,0,0.1)] bg-white px-3 text-[13px] text-[#17231c] outline-none transition placeholder:text-[#9aa49d] focus:border-[#1aa054]'

const ROLES = ['Vendor admin', 'Branch manager', 'Staff']
const BRANCH_OPTIONS = ['All branches', 'Manama — Al Seef', 'Juffair — Road 2401', 'Riffa — East', 'Riffa']
const STATUS_OPTIONS = ['Active', 'Inactive', 'Invited']

const PERMISSIONS = [
  { id: 'orders', label: 'Orders', hint: 'Accept, prepare, complete orders / orders history' },
  { id: 'catalog', label: 'Catalog / menu', hint: 'Edit items & availability' },
  { id: 'hours', label: 'Working hours', hint: 'Open / close & set hours' },
  { id: 'staff', label: 'Staff', hint: 'View staff' },
  { id: 'delivery', label: 'Delivery settings', hint: 'View Radius, ETA, min order' },
  { id: 'promotions', label: 'Promotions', hint: 'Create & manage promotions' },
]

function Field({ label, children, className = '' }) {
  return (
    <label className={cn('block', className)}>
      <span className={labelClass}>{label}</span>
      {children}
    </label>
  )
}

function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={cn(
        'relative h-[28px] w-[48px] shrink-0 rounded-full transition',
        checked ? 'bg-[#1aa054]' : 'bg-[#d5dbd7]',
      )}
    >
      <span
        className={cn(
          'absolute top-[3px] h-[22px] w-[22px] rounded-full bg-white shadow transition',
          checked ? 'left-[23px]' : 'left-[3px]',
        )}
      />
    </button>
  )
}

function SelectField({ value, onChange, options, label }) {
  return (
    <Field label={label}>
      <div className="relative">
        <select
          className={cn(inputClass, 'appearance-none pr-9')}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          {options.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
        ▾
      </div>
    </Field>
  )
}

const INITIAL_USERS = [
  { id: 'u1', name: 'Sara Ali', role: 'Branch manager', branch: 'Manama — Al Seef', status: 'Active', email: 'sara@greenkitchen.bh', phone: '+973 3xxx xxxx' },
  { id: 'u2', name: 'Yousif Hasan', role: 'Staff', branch: 'Juffair — Road 2401', status: 'Active', email: 'yousif@greenkitchen.bh', phone: '+973 3xxx xxxx' },
  { id: 'u3', name: 'Noora Faisal', role: 'Staff', branch: 'Riffa — East', status: 'Active', email: 'noora@greenkitchen.bh', phone: '+973 3xxx xxxx' },
]

function defaultPermissions(role) {
  if (role === 'Vendor admin') {
    return { orders: true, catalog: true, hours: true, staff: true, delivery: true, promotions: true }
  }
  if (role === 'Branch manager') {
    return { orders: true, catalog: false, hours: true, staff: false, delivery: false, promotions: false }
  }
  return { orders: true, catalog: false, hours: false, staff: false, delivery: false, promotions: false }
}

export default function AdminAddVendorUser() {
  const { vendorId, userId } = useParams()
  const navigate = useNavigate()
  const { state } = useLocation()

  const isVendorDetailFlow = Boolean(vendorId)
  const isNewUser = !userId || userId === 'new'
  const returnPath = isVendorDetailFlow
    ? `/admin/vendors/${encodeURIComponent(vendorId)}`
    : '/admin/vendors/new'
  const returnState = isVendorDetailFlow ? { tab: 'Users & staff' } : { step: 3 }

  const user = useMemo(() => {
    if (isNewUser) return null
    if (state?.user) return state.user
    return INITIAL_USERS.find((item) => String(item.id) === String(userId)) ?? null
  }, [isNewUser, state?.user, userId])

  const branchOptions = state?.branches?.length
    ? ['All branches', ...state.branches.map((b) => b.name || b)]
    : BRANCH_OPTIONS

  const [form, setForm] = useState({
    fullName: user?.name || (isNewUser ? 'Omar Khalid' : ''),
    email: user?.email || (isNewUser ? 'omar@greenkitchen.bh' : ''),
    phone: user?.phone || (isNewUser ? '+973 3xxx xxxx' : ''),
    password: '',
    role: user?.role === 'Operation staff' ? 'Staff' : (user?.role || 'Branch manager'),
    branch: user?.branch || 'Manama — Al Seef',
    status: user?.status || 'Active',
  })

  const [permissions, setPermissions] = useState(() => defaultPermissions(form.role))

  useEffect(() => {
    if (!user && isNewUser) return
    setForm({
      fullName: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      password: '',
      role: user?.role === 'Operation staff' ? 'Staff' : (user?.role || 'Branch manager'),
      branch: user?.branch || 'Manama — Al Seef',
      status: user?.status || 'Active',
    })
    setPermissions(defaultPermissions(user?.role === 'Operation staff' ? 'Staff' : (user?.role || 'Branch manager')))
  }, [user, isNewUser])

  const updateField = (key) => (event) => {
    setForm((prev) => ({ ...prev, [key]: event.target.value }))
  }

  const setRole = (role) => {
    setForm((prev) => ({ ...prev, role }))
    setPermissions(defaultPermissions(role))
  }

  const togglePermission = (id) => {
    setPermissions((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const goBack = () => navigate(returnPath, { state: returnState })

  const handleSave = () => {
    navigate(returnPath, { state: returnState })
  }

  return (
    <div className="px-5 pb-10 pt-4 max-[700px]:px-3">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 flex-wrap items-start gap-3">
          <button
            type="button"
            onClick={goBack}
            className="inline-flex h-[32px] shrink-0 items-center gap-1 rounded-full border border-[#dfe4e0] bg-white px-3 text-[12px] font-medium text-[#455249] hover:bg-[#f6f8f6]"
          >
            ‹ Back
          </button>
          <div className="min-w-0">
            <h2 className="text-[18px] font-bold tracking-[-0.02em] text-[#17231c]">
              Create &amp; Manage user
            </h2>
            <p className="mt-0.5 text-[12px] text-[#7c8780]">
              Add a vendor admin, branch manager or staff member.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSave}
          className="inline-flex h-[36px] shrink-0 items-center rounded-full bg-[#1aa054] px-4 text-[13px] font-medium text-white hover:bg-[#158a47]"
        >
          {isNewUser ? 'Create user' : 'Save changes'}
        </button>
      </div>

      <div className="space-y-4">
        <section className="rounded-[14px] border border-[#eceeec] bg-white px-5 py-5 shadow-[0_1px_2px_rgba(20,40,28,.03)]">
          <h3 className="mb-4 text-[15px] font-bold text-[#17231c]">User details</h3>
          <div className="grid grid-cols-2 gap-x-4 gap-y-4 max-[700px]:grid-cols-1">
            <Field label="Full name">
              <input className={inputClass} value={form.fullName} onChange={updateField('fullName')} />
            </Field>
            <Field label="Email">
              <input className={inputClass} value={form.email} onChange={updateField('email')} />
            </Field>
            <Field label="Phone">
              <input className={inputClass} value={form.phone} onChange={updateField('phone')} />
            </Field>
            <Field label="Password">
              <input
                className={inputClass}
                type="password"
                value={form.password}
                onChange={updateField('password')}
                placeholder={isNewUser ? '' : '••••••••'}
              />
            </Field>
          </div>
        </section>

        <section className="rounded-[14px] border border-[#eceeec] bg-white px-5 py-5 shadow-[0_1px_2px_rgba(20,40,28,.03)]">
          <h3 className="mb-4 text-[15px] font-bold text-[#17231c]">Role &amp; scope</h3>

          <p className={labelClass}>Role</p>
          <div className="mb-4 flex w-fit flex-wrap items-center rounded-[10px] bg-[#e9ebe9] p-[3px]">
            {ROLES.map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => setRole(role)}
                className={cn(
                  'h-[30px] rounded-[8px] px-3.5 text-[12px]',
                  form.role === role
                    ? 'bg-white font-bold text-[#17231c] shadow-[0_1px_3px_rgba(20,40,28,.12)]'
                    : 'font-medium text-[#69756d]',
                )}
              >
                {role}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-4 max-[700px]:grid-cols-1">
            <SelectField
              label="Assigned branch"
              value={form.branch}
              onChange={(value) => setForm((prev) => ({ ...prev, branch: value }))}
              options={branchOptions}
            />
            <SelectField
              label="Status"
              value={form.status}
              onChange={(value) => setForm((prev) => ({ ...prev, status: value }))}
              options={STATUS_OPTIONS}
            />
          </div>
        </section>

        <section className="rounded-[14px] border border-[#eceeec] bg-white px-5 py-5 shadow-[0_1px_2px_rgba(20,40,28,.03)]">
          <h3 className="mb-1 text-[15px] font-bold text-[#17231c]">Permissions</h3>
          <p className="mb-4 text-[12px] text-[#7c8780]">Toggle what this user can access.</p>

          <div className="space-y-0">
            {PERMISSIONS.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-4 border-b border-[#f0f2f0] py-3.5 last:border-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="text-[13px] font-bold text-[#17231c]">{item.label}</p>
                  <p className="mt-0.5 text-[12px] text-[#7c8780]">{item.hint}</p>
                </div>
                <Toggle
                  checked={Boolean(permissions[item.id])}
                  onChange={() => togglePermission(item.id)}
                  label={item.label}
                />
              </div>
            ))}
          </div>
        </section>

        <div className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={goBack}
            className="inline-flex h-[36px] items-center rounded-full border border-[#e4e8e4] bg-white px-4 text-[13px] font-medium text-[#455249] hover:bg-[#f6f8f6]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex h-[36px] items-center rounded-full bg-[#1aa054] px-4 text-[13px] font-medium text-white hover:bg-[#158a47]"
          >
            {isNewUser ? 'Create user' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
