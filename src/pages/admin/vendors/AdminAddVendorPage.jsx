import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Check,
  ChevronDown,
  ChevronLeft,
  MoreVertical,
  Plus,
  Upload,
} from 'lucide-react'
import houseIcon from '../../../assets/icon-house.png'
import editIcon from '../../../assets/icon-edit.png'
import AdminAddVendorReview, { AdminAddVendorActivateButton } from '../AdminAddVendorReview'

const cn = (...parts) => parts.filter(Boolean).join(' ')

// Preview screenshot for branch editor (opened from the “Edit ›” button in step 2).
// Uses Vite dev-server file access (/@fs) since the image lives in Cursor workspaceStorage.
const BRANCH_EDITOR_PREVIEW_IMG =
  '/@fs/C:/Users/Win%2010/.cursor/projects/d-Safayet-Yjeek-Vendor-and-admin-portal/assets/c__Users_Win_10_AppData_Roaming_Cursor_User_workspaceStorage_8388b19e22cd67ed76a52baa6a772474_images_main-8f206716-f851-4158-b3e0-d943e2f6c5d7.png'

function Badge({ children, tone = 'green' }) {
  const tones = {
    green: 'bg-[#e8f7ed] text-[#147940]',
    yellow: 'bg-[#fff5d9] text-[#9a6510]',
    red: 'bg-[#fdebea] text-[#bf3c36]',
    gray: 'bg-[#eff2f0] text-[#637068]',
  }
  return <span className={cn('inline-flex rounded-full px-2 py-1 text-[10px] font-medium', tones[tone])}>{children}</span>
}

const ADD_VENDOR_STEPS = [
  { id: 1, label: 'Store info', short: 'Store info', continueTo: 'Branches', subtitle: 'Step 1 — store profile, contact and address' },
  { id: 2, label: 'Branches', short: 'Branches', continueTo: 'Users', subtitle: 'Step 2 — branches, radius, ETA, min order, fees' },
  { id: 3, label: 'Users & roles', short: 'Users & roles', continueTo: 'Compliance', subtitle: 'Step 3 — owner login, staff & branch users' },
  { id: 4, label: 'Commission & fees', short: 'Commission & fees', continueTo: 'SLA', subtitle: 'Step 4 — documents, approval, commission & payouts' },
  { id: 5, label: 'SLA', short: 'SLA', continueTo: 'Review', subtitle: 'Step 5 — service modes and SLA configuration' },
  { id: 6, label: 'Review', short: 'Review & activate', continueTo: null, subtitle: 'Step 5 — confirm everything and activate the vendor' },
]

const INITIAL_BRANCHES = [
  { id: 'b1', name: 'Manama — Al Seef', detail: 'Block 436 · radius 5 km · ETA 35 min · min BHD 3.000' },
  { id: 'b2', name: 'Juffair — Road 2401', detail: 'Block 240 · radius 4 km · ETA 30 min · min BHD 2.500' },
  { id: 'b3', name: 'Riffa — East', detail: 'Block 911 · radius 6 km · ETA 40 min · min BHD 3.500' },
]

const INITIAL_USERS = [
  { id: 'u1', name: 'Sara Ali', role: 'Branch manager', branch: 'Manama — Al Seef', status: 'Active' },
  { id: 'u2', name: 'Yousif Hasan', role: 'Staff', branch: 'Juffair — Road 2401', status: 'Active' },
  { id: 'u3', name: 'Noora Faisal', role: 'Staff', branch: 'Riffa — East', status: 'Active' },
]

function VendorField({ label, children, className = '' }) {
  return (
    <label className={cn('block', className)}>
      <span className="mb-1.5 block text-[12px] font-medium text-[#7c8780]">{label}</span>
      {children}
    </label>
  )
}

function VendorInput({ className = '', ...props }) {
  return (
    <input
      className={cn(
        'h-[40px] w-full rounded-[8px] border border-[rgba(0,0,0,0.1)] bg-white px-3 text-[13px] text-[#17231c] outline-none transition placeholder:text-[#9aa49d] focus:border-[#1aa054]',
        className,
      )}
      {...props}
    />
  )
}

function VendorSelect({ children, className = '', ...props }) {
  return (
    <div className={cn('relative', className)}>
      <select
        className="h-[40px] w-full appearance-none rounded-[8px] border border-[rgba(0,0,0,0.1)] bg-white px-3 pr-9 text-[13px] text-[#17231c] outline-none transition focus:border-[#1aa054]"
        {...props}
      >
        {children}
      </select>
      <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#7c8780]" />
    </div>
  )
}

function VendorUploadBox({ label }) {
  return (
    <VendorField label={label}>
      <button
        type="button"
        className="flex h-[120px] w-full flex-col items-center justify-center gap-2 rounded-[10px] border border-[#e4e8e4] bg-[#f3f5f3] text-[#7c8780] transition hover:border-[#1aa054] hover:bg-[#eef7f1]"
      >
        <Upload size={18} strokeWidth={1.8} />
        <span className="text-[12px] font-medium">Upload image</span>
      </button>
    </VendorField>
  )
}

function VendorCard({ title, subtitle, children, className = '' }) {
  return (
    <section className={cn('rounded-[14px] border border-[#eceeec] bg-white p-5 shadow-[0_1px_3px_rgba(20,40,28,.04)] max-[700px]:p-4', className)}>
      {title ? (
        <div className="mb-4">
          <h3 className="text-[15px] font-bold text-[#17231c]">{title}</h3>
          {subtitle ? <p className="mt-1 text-[12px] text-[#7c8780]">{subtitle}</p> : null}
        </div>
      ) : null}
      {children}
    </section>
  )
}

export default function AdminAddVendorPage({ onBack }) {
  const location = useLocation()
  const navigate = useNavigate()
  const handleBack = onBack || (() => navigate('/admin/vendors'))
  const [step, setStep] = useState(location.state?.step ?? 1)
  const [form, setForm] = useState({
    storeName: 'Green Kitchen',
    legalName: 'Green Kitchen W.L.L',
    storeType: 'Food & Beverage',
    subCategory: 'None',
    description: 'Healthy home-style meals across Bahrain',
    ownerName: 'Mohammed Ahmed',
    ownerEmail: 'owner@greenkitchen.bh',
    ownerPhone: '+973 3812 1212',
    ownerPassword: '12&cdq#poin*123456',
    crNumber: '110111-3',
    vatNumber: '220011223300',
    commissionModel: '% of order',
    commissionRate: '15',
    serviceFee: '0.300',
    vatOnCommission: '10% (auto)',
    currency: 'BHD (fixed)',
    fixedPct: '1.000',
    debitPct: '0.500',
    creditPct: '2.000',
    applePayPct: '1.500',
    googleWalletPct: '1.500',
    otherChargesPct: '0.500',
    fixedCharge: '0.050',
    acceptSla: '2 min',
    prepSla: '18 min',
    readySla: '20 min',
    hotFood: 'Required',
  })
  const [branches, setBranches] = useState(INITIAL_BRANCHES)
  const [users, setUsers] = useState(INITIAL_USERS)
  const [customFees, setCustomFees] = useState([
    { id: 'f1', name: 'Packaging fee', value: 'BHD 0.250' },
    { id: 'f2', name: 'Priority handling', value: '2.5 %' },
  ])
  const [serviceModes, setServiceModes] = useState([])
  const [feeDraft, setFeeDraft] = useState({ name: '', amount: '0.000', type: 'BHD' })

  const current = ADD_VENDOR_STEPS[step - 1]
  const update = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }))

  const goNext = () => {
    if (step < ADD_VENDOR_STEPS.length) setStep(step + 1)
    else handleBack()
  }

  const addBranch = () => {
    navigate('/admin/vendors/new/branches/new', {
      state: { storeName: form.storeName, mode: 'create', step: 2 },
    })
  }

  const addUser = () => {
    navigate('/admin/vendors/new/users/new', {
      state: {
        storeName: form.storeName,
        mode: 'create',
        step: 3,
        branches,
      },
    })
  }

  const addCustomFee = () => {
    if (!feeDraft.name.trim() || !feeDraft.amount.trim()) return
    setCustomFees((prev) => [
      ...prev,
      {
        id: `f${Date.now()}`,
        name: feeDraft.name.trim(),
        value: feeDraft.type === 'BHD' ? `BHD ${feeDraft.amount}` : `${feeDraft.amount} %`,
      },
    ])
    setFeeDraft({ name: '', amount: '0.000', type: 'BHD' })
  }

  const toggleServiceMode = (mode) => {
    setServiceModes((prev) => (
      prev.includes(mode) ? prev.filter((item) => item !== mode) : [...prev, mode]
    ))
  }

  return (
    <div className="flex min-h-[calc(100vh-44px)] flex-col px-5 pb-5 pt-4 max-[700px]:px-3">
      <div className="mb-4 flex flex-wrap items-start gap-3">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex h-[32px] items-center gap-1 rounded-full border border-[#dfe4e0] bg-white px-3 text-[12px] font-medium text-[#455249] hover:bg-[#f6f8f6]"
        >
          <ChevronLeft size={14} strokeWidth={2} />
          Back
        </button>
        <div className="min-w-0 flex-1">
          <h2 className="text-[18px] font-bold tracking-[-0.02em] text-[#17231c]">
            Add vendor · {current.short}
          </h2>
          <p className="mt-0.5 text-[12px] text-[#7c8780]">{current.subtitle}</p>
        </div>
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-y-2">
        {ADD_VENDOR_STEPS.map((item, index) => {
          const active = step === item.id
          const done = item.id < step
          return (
            <div key={item.id} className="flex items-center">
              <button
                type="button"
                onClick={() => setStep(item.id)}
                className={cn(
                  'inline-flex h-[34px] items-center gap-2 rounded-full px-2.5 pr-3.5 text-[12px] font-medium whitespace-nowrap transition',
                  active && 'border border-[#1aa054] bg-[#e8f7ed] text-[#147940]',
                  done && !active && 'border border-[#1aa054] bg-[#1aa054] text-white',
                  !active && !done && 'border border-transparent bg-[#eef0ee] text-[#7c8780] hover:bg-[#e6e9e6]',
                )}
              >
                <span
                  className={cn(
                    'grid h-[22px] w-[22px] place-items-center rounded-full text-[11px] font-bold',
                    active && 'bg-[#1aa054] text-white',
                    done && !active && 'bg-white text-[#1aa054]',
                    !active && !done && 'bg-white text-[#8a948e]',
                  )}
                >
                  {done && !active ? <Check size={12} strokeWidth={3} /> : item.id}
                </span>
                {item.label}
              </button>
              {index < ADD_VENDOR_STEPS.length - 1 ? (
                <span className="mx-1.5 h-px w-5 shrink-0 bg-[#d5dbd7] min-[1100px]:mx-2 min-[1100px]:w-7" />
              ) : null}
            </div>
          )
        })}
      </div>

      <div className="flex-1 space-y-3">
        {step === 1 ? (
          <VendorCard title="Store profile">
            <div className="grid grid-cols-2 gap-x-4 gap-y-4 max-[700px]:grid-cols-1">
              <VendorField label="Store name">
                <VendorInput value={form.storeName} onChange={update('storeName')} />
              </VendorField>
              <VendorField label="Legal name">
                <VendorInput value={form.legalName} onChange={update('legalName')} />
              </VendorField>
              <VendorField label="Store type">
                <VendorSelect value={form.storeType} onChange={update('storeType')}>
                  <option>Food & Beverage</option>
                  <option>Grocery</option>
                  <option>Electronics</option>
                  <option>Fashion</option>
                  <option>Other</option>
                </VendorSelect>
              </VendorField>
              <VendorField label="Sub-category">
                <VendorSelect value={form.subCategory} onChange={update('subCategory')}>
                  <option>None</option>
                  <option>Healthy food</option>
                  <option>Fast food</option>
                  <option>Cafe</option>
                </VendorSelect>
              </VendorField>
              <VendorField label="Short description" className="col-span-2 max-[700px]:col-span-1">
                <VendorInput value={form.description} onChange={update('description')} />
              </VendorField>
              <VendorUploadBox label="Logo" />
              <VendorUploadBox label="Cover image" />
            </div>
          </VendorCard>
        ) : null}

        {step === 2 ? (
          <VendorCard title="Branches" subtitle="Add each physical branch. You can fine-tune each one after.">
            <div className="space-y-2.5">
              {branches.map((branch) => (
                <div
                  key={branch.id}
                  className="flex items-center gap-3 rounded-[12px] border border-[#e8ebe9] bg-[#fafbfa] px-3.5 py-3"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-[#e7f5eb] p-1.5">
                    <img src={houseIcon} alt="" className="h-full w-full object-contain" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-bold text-[#17231c]">{branch.name}</p>
                    <p className="mt-0.5 truncate text-[11px] text-[#7c8780]">{branch.detail}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      navigate(`/admin/vendors/new/branches/${encodeURIComponent(branch.id)}`, {
                        state: { branch, storeName: form.storeName },
                      })
                    }
                    className="inline-flex shrink-0 items-center gap-1 text-[12px] font-medium text-[#1aa054] hover:underline"
                  >
                    <img src={editIcon} alt="" className="h-3.5 w-3.5 object-contain" />
                    Edit ›
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addBranch}
                className="flex h-[42px] w-full items-center justify-center gap-1.5 rounded-sm border border-[#1aa054] bg-white text-[13px] font-medium text-[#1aa054] hover:bg-[#f3faf5]"
              >
                <Plus size={15} strokeWidth={2.2} /> Add branch 
              </button>
            </div>
          </VendorCard>
        ) : null}

        {step === 3 ? (
          <>
            <VendorCard title="Vendor admin (owner login)" subtitle="Primary account used to manage this vendor">
              <div className="grid grid-cols-2 gap-x-4 gap-y-4 max-[700px]:grid-cols-1">
                <VendorField label="Full name">
                  <VendorInput value={form.ownerName} onChange={update('ownerName')} />
                </VendorField>
                <VendorField label="Email">
                  <VendorInput value={form.ownerEmail} onChange={update('ownerEmail')} />
                </VendorField>
                <VendorField label="Phone">
                  <VendorInput value={form.ownerPhone} onChange={update('ownerPhone')} />
                </VendorField>
                <VendorField label="Password">
                  <VendorInput type="text" value={form.ownerPassword} onChange={update('ownerPassword')} />
                </VendorField>
              </div>
            </VendorCard>

            <VendorCard title="Additional users" subtitle="Staff accounts with branch-level access">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-[#edf0ee]">
                      {['Name', 'Role', 'Branch', 'Status', ''].map((col) => (
                        <th key={col || 'actions'} className="whitespace-nowrap px-1 pb-2.5 text-[10px] font-medium uppercase tracking-[0.04em] text-[#8a948e]">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-b border-[#f0f2f0] last:border-0">
                        <td className="whitespace-nowrap py-3 pr-3 text-[13px] font-bold text-[#17231c]">{user.name}</td>
                        <td className="whitespace-nowrap py-3 pr-3 text-[12px] text-[#455249]">{user.role}</td>
                        <td className="whitespace-nowrap py-3 pr-3 text-[12px] text-[#455249]">{user.branch}</td>
                        <td className="whitespace-nowrap py-3 pr-3">
                          <Badge tone="green">{user.status}</Badge>
                        </td>
                        <td className="py-3 text-right">
                          <button
                            type="button"
                            onClick={() =>
                              navigate(`/admin/vendors/new/users/${encodeURIComponent(user.id)}`, {
                                state: { user, storeName: form.storeName, step: 3, branches },
                              })
                            }
                            className="grid h-8 w-8 place-items-center rounded-md text-[#8a948e] hover:bg-[#f3f5f3]"
                            aria-label={`Edit ${user.name}`}
                          >
                            <MoreVertical size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button
                type="button"
                onClick={addUser}
                className="mt-3 flex h-[42px] w-full items-center justify-center gap-1.5 rounded-sm border border-[#1aa054] bg-white text-[13px] font-medium text-[#1aa054] hover:bg-[#f3faf5]"
              >
                <Plus size={15} strokeWidth={2.2} /> Add user
              </button>
            </VendorCard>
          </>
        ) : null}

        {step === 4 ? (
          <>
            <VendorCard title="Documents & compliance">
              <div className="grid grid-cols-2 gap-x-4 gap-y-4 max-[700px]:grid-cols-1">
                <VendorField label="CR number">
                  <VendorInput value={form.crNumber} onChange={update('crNumber')} />
                </VendorField>
                <VendorField label="VAT number">
                  <VendorInput value={form.vatNumber} onChange={update('vatNumber')} />
                </VendorField>
              </div>
            </VendorCard>

            <VendorCard title="Commission & fees">
              <p className="mb-2 text-[12px] font-medium text-[#7c8780]">Commission model</p>
              <div className="mb-4 flex flex-wrap w-fit items-center rounded-[10px] bg-[#e9ebe9] p-[3px]">
                {['% of order', 'Flat per order', 'Tiered'].map((model) => (
                  <button
                    key={model}
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, commissionModel: model }))}
                    className={cn(
                      'h-[30px] rounded-[8px] px-3.5 text-[12px]',
                      form.commissionModel === model
                        ? 'bg-white font-bold text-[#17231c] shadow-[0_1px_3px_rgba(20,40,28,.12)]'
                        : 'font-medium text-[#69756d]',
                    )}
                  >
                    {model}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-4 max-[700px]:grid-cols-1">
                <VendorField label="Commission rate (%)">
                  <VendorInput value={form.commissionRate} onChange={update('commissionRate')} />
                </VendorField>
                <VendorField label="Platform service fee (BHD)">
                  <VendorInput value={form.serviceFee} onChange={update('serviceFee')} />
                </VendorField>
                <VendorField label="VAT on commission">
                  <VendorInput value={form.vatOnCommission} onChange={update('vatOnCommission')} />
                </VendorField>
                <VendorField label="Currency">
                  <VendorInput value={form.currency} onChange={update('currency')} />
                </VendorField>
              </div>
            </VendorCard>

            <VendorCard title="Online gateway fees">
              <div className="grid grid-cols-3 gap-x-4 gap-y-4 max-[800px]:grid-cols-2 max-[520px]:grid-cols-1">
                <VendorField label="Fixed %"><VendorInput value={form.fixedPct} onChange={update('fixedPct')} /></VendorField>
                <VendorField label="Debit %"><VendorInput value={form.debitPct} onChange={update('debitPct')} /></VendorField>
                <VendorField label="Credit %"><VendorInput value={form.creditPct} onChange={update('creditPct')} /></VendorField>
                <VendorField label="Apple Pay %"><VendorInput value={form.applePayPct} onChange={update('applePayPct')} /></VendorField>
                <VendorField label="Google Wallet %"><VendorInput value={form.googleWalletPct} onChange={update('googleWalletPct')} /></VendorField>
                <VendorField label="Other charges %"><VendorInput value={form.otherChargesPct} onChange={update('otherChargesPct')} /></VendorField>
                <VendorField label="Fixed charge / transaction (BHD)" className="col-span-3 max-[800px]:col-span-2 max-[520px]:col-span-1">
                  <VendorInput value={form.fixedCharge} onChange={update('fixedCharge')} />
                </VendorField>
              </div>
            </VendorCard>

            <VendorCard title="Custom fees">
              <div className="flex flex-wrap items-end gap-2.5">
                <VendorField label="Fee name" className="min-w-[180px] flex-1">
                  <VendorInput
                    value={feeDraft.name}
                    onChange={(e) => setFeeDraft((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Packaging fee"
                  />
                </VendorField>
                <VendorField label="Amount / value" className="w-[120px]">
                  <VendorInput
                    value={feeDraft.amount || '0.000'}
                    onChange={(e) => setFeeDraft((prev) => ({ ...prev, amount: e.target.value }))}
                    placeholder="0.000"
                  />
                </VendorField>
                <div>
                  <span className="mb-1.5 block text-[12px] font-medium text-[#7c8780]">Type</span>
                  <div className="flex rounded-sm bg-[#e9ebe9] p-[3px]">
                    {['BHD', '%'].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setFeeDraft((prev) => ({ ...prev, type }))}
                        className={cn(
                          'h-[34px] rounded-sm px-3.5 text-[12px]',
                          feeDraft.type === type
                            ? 'border border-[#e1e5e2] bg-white font-bold text-[#17231c] shadow-[0_1px_2px_rgba(20,40,28,.08)]'
                            : 'font-medium text-[#69756d]',
                        )}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={addCustomFee}
                  className="inline-flex h-[40px] items-center gap-1 rounded-[8px] bg-[#1aa054] px-4 text-[13px] font-medium text-white hover:bg-[#158a47]"
                >
                  <Plus size={14} /> Add fee
                </button>
              </div>

              <p className="mb-2 mt-4 text-[10px] font-medium uppercase tracking-[0.06em] text-[#8a948e]">Added fees</p>
              <div className="space-y-2">
                {customFees.map((fee) => (
                  <div
                    key={fee.id}
                    className="flex h-[40px] items-center gap-3 rounded-[8px] border border-[#dceee3] bg-[#f3faf5] px-3.5"
                  >
                    <span className="min-w-0 flex-1 truncate text-[13px] text-[#17231c]">{fee.name}</span>
                    <span className="shrink-0 text-[13px] font-bold text-[#1aa054]">{fee.value}</span>
                    <button
                      type="button"
                      onClick={() => setCustomFees((prev) => prev.filter((item) => item.id !== fee.id))}
                      className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-[16px] text-[#9aa49d] hover:bg-[#e4f3ea] hover:text-[#69756d]"
                      aria-label={`Remove ${fee.name}`}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </VendorCard>
          </>
        ) : null}

        {step === 5 ? (
          <VendorCard title="Service modes & SLA">
            <div className="flex flex-wrap gap-2.5">
              {[
                'Hot food · on demand',
                'Dine-in',
                'Pickup',
                'Scheduled delivery',
                'Services',
              ].map((mode) => {
                const selected = serviceModes.includes(mode)
                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => toggleServiceMode(mode)}
                    className={cn(
                      'inline-flex h-[36px] items-center gap-2 rounded-full border bg-white px-3.5 text-[13px] font-medium transition',
                      selected
                        ? 'border-[#1aa054] text-[#147940]'
                        : 'border-[#e1e5e2] text-[#455249] hover:border-[#c9d0cb]',
                    )}
                  >
                    <span
                      className={cn(
                        'grid h-[16px] w-[16px] place-items-center rounded-full border',
                        selected
                          ? 'border-[#1aa054] bg-[#1aa054] text-white'
                          : 'border-[#c9d0cb] bg-white',
                      )}
                    >
                      {selected ? <Check size={10} strokeWidth={3} /> : null}
                    </span>
                    {mode}
                  </button>
                )
              })}
            </div>
          </VendorCard>
        ) : null}

        {step === 6 ? (
          <AdminAddVendorReview
            form={form}
            branches={branches}
            users={users}
            onActivate={() => handleBack()}
          />
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap justify-end gap-2">
        <button
          type="button"
          className="inline-flex h-[36px] items-center rounded-full border border-[#d7e8dc] bg-white px-4 text-[13px] font-medium text-[#1aa054] hover:bg-[#f3faf5]"
        >
          Save draft
        </button>
        {step === 6 ? (
          <AdminAddVendorActivateButton onClick={() => handleBack()} />
        ) : (
          <button
            type="button"
            onClick={goNext}
            className="inline-flex h-[36px] items-center gap-1.5 rounded-full bg-[#1aa054] px-4 text-[13px] font-medium text-white hover:bg-[#158a47]"
          >
            Continue → {current.continueTo}
          </button>
        )}
      </div>

    </div>
  )
}
