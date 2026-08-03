import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'
import { isAdminRealApiFeature } from '../../../api/config'
import { adminService } from '../../../services/adminService'

const cn = (...parts) => parts.filter(Boolean).join(' ')

const labelClass = 'mb-1.5 block text-[12px] font-medium text-[#7c8780]'
const inputClass =
  'box-border h-[40px] w-full rounded-[8px] border border-[rgba(0,0,0,0.1)] bg-white px-3 text-[13px] text-[#17231c] outline-none transition placeholder:text-[#9aa49d] focus:border-[#1aa054]'

const ROLES = ['Vendor admin', 'Branch manager', 'Staff']
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
    <div className={cn('block', className)}>
      <span className={labelClass}>{label}</span>
      {children}
    </div>
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

function SelectField({ value, onChange, options, label, disabled = false }) {
  return (
    <Field label={label}>
      <div className="relative block w-full">
        <select
          className={cn(inputClass, 'appearance-none pr-9')}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
        >
          {options.map((option) => {
            const optValue = typeof option === 'string' ? option : option.value
            const optLabel = typeof option === 'string' ? option : option.label
            return (
              <option key={String(optValue) || optLabel} value={optValue}>
                {optLabel}
              </option>
            )
          })}
        </select>
        <ChevronDown
          size={14}
          className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[#7c8780]"
          aria-hidden
        />
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

function emptyCreateForm(firstBranchId = '') {
  return {
    fullName: '',
    email: '',
    phone: '+973 ',
    password: '',
    role: 'Branch manager',
    branchId: firstBranchId,
    status: 'Active',
  }
}

export default function AdminAddVendorUser() {
  const { vendorId, userId } = useParams()
  const navigate = useNavigate()
  const { state } = useLocation()

  const isVendorDetailFlow = Boolean(vendorId) && vendorId !== 'new'
  const isNewUser = !userId || userId === 'new'
  const useRealStaffApi = isVendorDetailFlow && isAdminRealApiFeature('vendors')
  const returnToWizard = state?.returnTo === 'wizard'
  const returnPath = returnToWizard
    ? '/admin/vendors/new'
    : isVendorDetailFlow
      ? `/admin/vendors/${encodeURIComponent(vendorId)}`
      : '/admin/vendors/new'
  const returnState = returnToWizard
    ? {
        mode: state?.mode || (isVendorDetailFlow ? 'edit' : 'create'),
        vendorId: state?.vendorId || (isVendorDetailFlow ? vendorId : undefined),
        storeName: state?.storeName,
        step: state?.step || 3,
        wizardDraft: state?.wizardDraft || null,
      }
    : isVendorDetailFlow
      ? { tab: 'Users & staff' }
      : {
          mode: state?.mode || 'create',
          step: 3,
          wizardDraft: state?.wizardDraft || null,
          storeName: state?.storeName,
        }
  const isLocalWizardCreate = !useRealStaffApi && Boolean(state?.wizardDraft || state?.mode === 'create')

  const user = useMemo(() => {
    if (isNewUser) return null
    if (state?.user) return state.user
    return INITIAL_USERS.find((item) => String(item.id) === String(userId)) ?? null
  }, [isNewUser, state?.user, userId])

  const [branchList, setBranchList] = useState(() => {
    const fromState = Array.isArray(state?.branches) ? state.branches : []
    return fromState.filter((b) => b && (b.id || b.name))
  })
  const [branchesLoading, setBranchesLoading] = useState(false)

  const [form, setForm] = useState(() => {
    if (isNewUser) {
      const firstId = Array.isArray(state?.branches) ? state.branches.find((b) => b?.id)?.id || '' : ''
      return emptyCreateForm(firstId)
    }
    return {
      fullName: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      password: '',
      role: user?.role === 'Operation staff' ? 'Staff' : (user?.role || 'Branch manager'),
      branchId: user?.branchId || user?.branch || '',
      status: user?.status || 'Active',
    }
  })

  const [permissions, setPermissions] = useState(() =>
    user?.permissions && typeof user.permissions === 'object'
      ? {
          orders: Boolean(user.permissions.orders),
          catalog: Boolean(user.permissions.catalog),
          hours: Boolean(user.permissions.hours),
          staff: Boolean(user.permissions.staff),
          delivery: Boolean(user.permissions.delivery),
          promotions: Boolean(user.permissions.promotions),
        }
      : defaultPermissions(form.role),
  )
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)

  useEffect(() => {
    if (!useRealStaffApi) return undefined

    const fromState = Array.isArray(state?.branches) ? state.branches : []
    if (fromState.some((b) => b?.id)) {
      setBranchList(fromState.filter((b) => b && b.id))
      return undefined
    }

    let cancelled = false
    setBranchesLoading(true)
    adminService
      .listVendorBranches(vendorId)
      .then((response) => {
        if (cancelled) return
        setBranchList(response?.data?.branches || [])
      })
      .catch(() => {
        if (!cancelled) setBranchList([])
      })
      .finally(() => {
        if (!cancelled) setBranchesLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [useRealStaffApi, vendorId, state?.branches])

  const resolvedBranchOptions = useMemo(() => {
    if (!useRealStaffApi) {
      const names = state?.branches?.length
        ? state.branches.map((b) => b.name || b)
        : ['All branches', 'Manama — Al Seef', 'Juffair — Road 2401', 'Riffa — East', 'Riffa']
      return names.map((name) => ({ value: name, label: name }))
    }

    const options = branchList
      .filter((b) => b?.id)
      .map((b) => ({ value: b.id, label: b.name || b.id }))

    if (form.role === 'Vendor admin') {
      return [{ value: '', label: 'All branches' }, ...options]
    }

    return options.length
      ? options
      : [{ value: '', label: branchesLoading ? 'Loading…' : 'No branches' }]
  }, [useRealStaffApi, branchList, branchesLoading, state?.branches, form.role])

  useEffect(() => {
    if (!isNewUser || !useRealStaffApi) return
    if (form.branchId) return
    if (form.role === 'Vendor admin') return
    const first = branchList.find((b) => b?.id)
    if (first?.id) {
      setForm((prev) => ({ ...prev, branchId: first.id }))
    }
  }, [isNewUser, useRealStaffApi, branchList, form.branchId, form.role])

  useEffect(() => {
    if (!user && isNewUser) return
    setForm({
      fullName: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      password: '',
      role: user?.role === 'Operation staff' ? 'Staff' : (user?.role || 'Branch manager'),
      branchId: user?.branchId || user?.branch || '',
      status: user?.status || 'Active',
    })
    setPermissions(
      user?.permissions && typeof user.permissions === 'object'
        ? {
            orders: Boolean(user.permissions.orders),
            catalog: Boolean(user.permissions.catalog),
            hours: Boolean(user.permissions.hours),
            staff: Boolean(user.permissions.staff),
            delivery: Boolean(user.permissions.delivery),
            promotions: Boolean(user.permissions.promotions),
          }
        : defaultPermissions(user?.role === 'Operation staff' ? 'Staff' : (user?.role || 'Branch manager')),
    )
  }, [user, isNewUser])

  const updateField = (key) => (event) => {
    setForm((prev) => ({ ...prev, [key]: event.target.value }))
  }

  const setRole = (role) => {
    setForm((prev) => {
      const next = { ...prev, role }
      if (role === 'Vendor admin' && useRealStaffApi) {
        next.branchId = ''
      } else if (
        useRealStaffApi &&
        (!prev.branchId || prev.branchId === '') &&
        branchList[0]?.id
      ) {
        next.branchId = branchList[0].id
      }
      return next
    })
    setPermissions(defaultPermissions(role))
  }

  const togglePermission = (id) => {
    setPermissions((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const goBack = () => navigate(returnPath, { state: returnState })

  async function handleSave() {
    if (!useRealStaffApi) {
      if (isLocalWizardCreate || returnToWizard || returnPath === '/admin/vendors/new') {
        const branch =
          branchList.find((b) => String(b.id) === String(form.branchId)) || branchList[0]
        const savedUser = {
          id: state?.user?.id || `local-user-${Date.now()}`,
          name: form.fullName.trim() || 'New user',
          displayName: form.fullName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          password: form.password,
          role: form.role,
          branch: branch?.name || '',
          branchId: branch?.id || form.branchId || '',
          branchIndex: Math.max(
            0,
            branchList.findIndex((b) => String(b.id) === String(branch?.id || form.branchId)),
          ),
          status: form.status || 'Active',
          permissions: { ...permissions },
        }
        navigate(returnPath, {
          state: {
            ...returnState,
            savedUser,
          },
        })
        return
      }
      navigate(returnPath, { state: returnState })
      return
    }

    setSaveError(null)
    setSaving(true)
    try {
      const payload = { ...form, permissions }
      if (isNewUser) {
        await adminService.createVendorStaff(vendorId, payload, branchList)
      } else {
        await adminService.updateVendorStaff(vendorId, userId, payload, branchList)
      }
      navigate(returnPath, { state: returnState })
    } catch (err) {
      setSaveError(err?.message || (isNewUser ? 'Failed to create user.' : 'Failed to update user.'))
    } finally {
      setSaving(false)
    }
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
          disabled={saving}
          className="inline-flex h-[36px] shrink-0 items-center rounded-full bg-[#1aa054] px-4 text-[13px] font-medium text-white hover:bg-[#158a47] disabled:opacity-60"
        >
          {saving ? 'Saving…' : isNewUser ? 'Create user' : 'Save changes'}
        </button>
      </div>

      {saveError ? (
        <div className="mb-4 rounded-[10px] border border-[#f5c6c4] bg-[#fdebec] px-4 py-3 text-[13px] text-[#d64044]">
          {saveError}
        </div>
      ) : null}

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
              <input
                className={inputClass}
                value={form.phone}
                onChange={updateField('phone')}
                placeholder="+973 33008888"
              />
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
              value={form.branchId}
              onChange={(value) => setForm((prev) => ({ ...prev, branchId: value }))}
              options={resolvedBranchOptions}
            />
            <SelectField
              label="Status"
              value={form.status}
              onChange={(value) => setForm((prev) => ({ ...prev, status: value }))}
              options={STATUS_OPTIONS}
              disabled={useRealStaffApi && isNewUser}
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
            disabled={saving}
            className="inline-flex h-[36px] items-center rounded-full bg-[#1aa054] px-4 text-[13px] font-medium text-white hover:bg-[#158a47] disabled:opacity-60"
          >
            {saving ? 'Saving…' : isNewUser ? 'Create user' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
