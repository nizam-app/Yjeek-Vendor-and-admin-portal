import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Check,
  ChevronDown,
  ChevronLeft,
  MoreVertical,
  Plus,
} from 'lucide-react'
import houseIcon from '../../../assets/icon-house.png'
import editIcon from '../../../assets/icon-edit.png'
import AdminAddVendorReview, { AdminAddVendorActivateButton } from '../AdminAddVendorReview'
import { AdminVendorSlaConfigs, buildAllowedModesFromStoreType } from '../../../components/admin/AdminVendorSlaConfigs'
import AdminPasswordField from '../../../components/admin/AdminPasswordField'
import { isAdminRealApiFeature } from '../../../api/config'
import { formatApiErrorMessage } from '../../../api/errors'
import AdminVendorImageUpload from '../../../components/admin/AdminVendorImageUpload'
import { showError, showFlashMessage, showInfo, showSuccess } from '../../../utils/toast'
import {
  flattenAdminMenuCategoryOptions,
  matchAdminStoreTypeId,
} from '../../../mappers/admin/mapAdminStoreTypes'
import {
  mapAdminCommissionToWizardForm,
  mapAdminCustomFeesToWizard,
} from '../../../mappers/admin/mapAdminVendorCommission'
import {
  mapAdminServiceModesToLabels,
  mapSlaModelConfigToWizardModes,
  mergeWizardSlaModes,
} from '../../../mappers/admin/mapAdminVendorSla'
import { requiresServiceSubTypeSelection } from '../../../mappers/admin/mapAdminCreateVendor'
import { adminService } from '../../../services/adminService'
import { useAdminShell } from '../../../context/AdminShellContext'

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

const ADD_VENDOR_WIZARD_PATH = '/admin/vendors/new'
const ADD_VENDOR_DRAFT_STORAGE_KEY = 'admin-add-vendor-wizard-draft'

function canCreateServerDraft({ form, branches }) {
  return Boolean(
    trimWizardText(form?.storeName) &&
      trimWizardText(form?.storeTypeId) &&
      trimWizardText(form?.ownerName) &&
      trimWizardText(form?.ownerEmail) &&
      trimWizardText(form?.ownerPassword) &&
      Array.isArray(branches) &&
      branches.length > 0,
  )
}

function trimWizardText(value) {
  return String(value ?? '').trim()
}

function isWizardInternalPath(pathname, editVendorId) {
  if (
    pathname === ADD_VENDOR_WIZARD_PATH ||
    pathname.startsWith(`${ADD_VENDOR_WIZARD_PATH}/branches/`) ||
    pathname.startsWith(`${ADD_VENDOR_WIZARD_PATH}/users/`)
  ) {
    return true
  }
  if (!editVendorId) return false
  const vendorBase = `/admin/vendors/${encodeURIComponent(String(editVendorId))}`
  return (
    pathname === `${vendorBase}/branches/new` ||
    pathname.startsWith(`${vendorBase}/branches/`) ||
    pathname === `${vendorBase}/users/new` ||
    pathname.startsWith(`${vendorBase}/users/`)
  )
}

const WIZARD_FORM_DIRTY_KEYS = [
  'storeName',
  'legalName',
  'storeType',
  'storeTypeId',
  'catalogIds',
  'subCategory',
  'subcategoryId',
  'description',
  'logoUrl',
  'coverUrl',
  'area',
  'cuisineTags',
  'ownerName',
  'ownerEmail',
  'ownerPhone',
  'ownerPassword',
  'crNumber',
  'vatNumber',
  'commissionModel',
  'commissionRate',
  'serviceFee',
  'vatOnCommission',
  'currency',
  'fixedPct',
  'debitPct',
  'creditPct',
  'applePayPct',
  'googleWalletPct',
  'otherChargesPct',
  'fixedCharge',
  'acceptSla',
  'prepSla',
  'readySla',
  'hotFood',
  'slaModelId',
]

function pickWizardFormFields(form) {
  const picked = {}
  for (const key of WIZARD_FORM_DIRTY_KEYS) {
    const value = form?.[key]
    if (Array.isArray(value)) {
      picked[key] = [...value].map(String).sort()
    } else if (typeof value === 'string') {
      picked[key] = value.trim()
    } else {
      picked[key] = value
    }
  }
  return picked
}

function serializeWizardSnapshot({
  form,
  branches,
  users,
  customFees,
  commissionTiers,
  serviceModes,
  slaConfigs,
  vendorVisible,
  vendorActive,
}) {
  return JSON.stringify({
    form: pickWizardFormFields(form),
    branches,
    users,
    customFees,
    commissionTiers,
    serviceModes,
    slaConfigs,
    vendorVisible,
    vendorActive,
    // Legacy key kept so older session drafts still hydrate.
    activateImmediately: Boolean(vendorVisible && vendorActive),
  })
}

function readWizardSessionDraft() {
  try {
    const raw = sessionStorage.getItem(ADD_VENDOR_DRAFT_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : null
  } catch {
    return null
  }
}

function writeWizardSessionDraft(draft) {
  try {
    sessionStorage.setItem(
      ADD_VENDOR_DRAFT_STORAGE_KEY,
      JSON.stringify({ ...draft, savedAt: Date.now() }),
    )
  } catch {
    /* ignore quota / private mode */
  }
}

function clearWizardSessionDraft() {
  try {
    sessionStorage.removeItem(ADD_VENDOR_DRAFT_STORAGE_KEY)
  } catch {
    /* ignore */
  }
}

function isWizardDraftDirty({
  step,
  form,
  branches,
  users,
  customFees,
  commissionTiers,
  serviceModes,
  useRealCreateApi,
}) {
  if (step > 1) return true
  if (trimWizardText(form?.storeName)) return true
  if (trimWizardText(form?.legalName)) return true
  if (trimWizardText(form?.description)) return true
  if (trimWizardText(form?.storeTypeId)) return true
  if (trimWizardText(form?.logoUrl) || trimWizardText(form?.coverUrl)) return true
  if (useRealCreateApi) {
    if (Array.isArray(branches) && branches.length > 0) return true
    if (Array.isArray(users) && users.length > 0) return true
    if (Array.isArray(customFees) && customFees.length > 0) return true
    if (Array.isArray(commissionTiers) && commissionTiers.length > 0) return true
  }
  if (Array.isArray(serviceModes) && serviceModes.length !== 3) return true
  return false
}

function applyWizardDraft(draft, setters) {
  if (!draft || typeof draft !== 'object') return
  if (draft.form && typeof draft.form === 'object' && setters.setForm) {
    setters.setForm((prev) => ({ ...prev, ...draft.form }))
  }
  if (setters.setBranches && Array.isArray(draft.branches)) setters.setBranches(draft.branches)
  if (setters.setUsers && Array.isArray(draft.users)) setters.setUsers(draft.users)
  if (setters.setCustomFees && Array.isArray(draft.customFees)) {
    setters.setCustomFees(draft.customFees)
  }
  if (setters.setCommissionTiers && Array.isArray(draft.commissionTiers)) {
    setters.setCommissionTiers(draft.commissionTiers)
  }
  if (setters.setServiceModes && Array.isArray(draft.serviceModes)) {
    setters.setServiceModes(draft.serviceModes)
  }
  if (draft.slaConfigs && typeof draft.slaConfigs === 'object' && setters.setSlaConfigs) {
    setters.setSlaConfigs(draft.slaConfigs)
  }
  if (draft.step != null && setters.setStep) setters.setStep(Number(draft.step) || 1)
  if (typeof draft.vendorVisible === 'boolean' && setters.setVendorVisible) {
    setters.setVendorVisible(draft.vendorVisible)
  } else if (typeof draft.activateImmediately === 'boolean' && setters.setVendorVisible) {
    setters.setVendorVisible(draft.activateImmediately)
  }
  if (typeof draft.vendorActive === 'boolean' && setters.setVendorActive) {
    setters.setVendorActive(draft.vendorActive)
  } else if (typeof draft.activateImmediately === 'boolean' && setters.setVendorActive) {
    setters.setVendorActive(draft.activateImmediately)
  }
}

function LeaveWizardModal({ open, busy, isEdit, onStay, onLeave, onSaveDraft }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[140] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/40"
        disabled={busy}
        onClick={() => !busy && onStay?.()}
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-[420px] rounded-t-[16px] bg-white p-5 shadow-[0_18px_44px_rgba(0,0,0,0.28)] sm:rounded-[16px]"
      >
        <h3 className="text-[16px] font-bold text-[#17231c]">
          {isEdit ? 'Leave vendor setup?' : 'Leave add vendor?'}
        </h3>
        <p className="mt-2 text-[13px] leading-relaxed text-[#7c8780]">
          {isEdit
            ? 'You have unsaved changes on this vendor. Save your progress, or leave without saving.'
            : 'You have unsaved progress on this vendor setup. Save a draft to continue later from Add vendor, or leave without saving.'}
        </p>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={onStay}
            className="inline-flex h-[36px] items-center rounded-full border border-[#d5dbd6] px-4 text-[12.5px] font-bold text-[#455249] hover:bg-[#f7f9f7] disabled:opacity-60"
          >
            Keep editing
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onLeave}
            className="inline-flex h-[36px] items-center rounded-full border border-[#f5c6c4] bg-white px-4 text-[12.5px] font-bold text-[#d64044] hover:bg-[#fdebec] disabled:opacity-60"
          >
            Leave without saving
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onSaveDraft}
            className="inline-flex h-[36px] items-center rounded-full bg-[#1aa054] px-4 text-[12.5px] font-bold text-white hover:bg-[#158a47] disabled:opacity-60"
          >
            {busy ? 'Saving…' : 'Save Draft'}
          </button>
        </div>
      </div>
    </div>
  )
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
      <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[10px] leading-none text-[#69756d]">
        ▾
      </span>
    </div>
  )
}

/**
 * Multi-select catalogs. Primary store type = first selected id (storeTypeId).
 * Keeps single-select compatibility via onPrimaryChange.
 */
function VendorCatalogMultiSelect({
  options = [],
  selectedIds = [],
  primaryId = '',
  onChange,
  disabled = false,
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const onDoc = (event) => {
      if (rootRef.current?.contains(event.target)) return
      setOpen(false)
    }
    const onKey = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const selectedSet = new Set(selectedIds.map(String))
  const selectedOptions = options.filter((opt) => selectedSet.has(String(opt.id)))
  const primary = selectedOptions.find((opt) => String(opt.id) === String(primaryId)) || selectedOptions[0]

  const toggle = (id) => {
    const key = String(id)
    if (selectedSet.has(key)) {
      if (selectedIds.length <= 1) return
      const next = selectedIds.filter((item) => String(item) !== key)
      const nextPrimary = next.includes(String(primaryId)) ? primaryId : (next[0] || '')
      onChange({ catalogIds: next, storeTypeId: nextPrimary })
      return
    }
    const next = [...selectedIds, key]
    const nextPrimary = primaryId || key
    onChange({ catalogIds: next, storeTypeId: nextPrimary })
  }

  const removeChip = (id) => {
    if (selectedIds.length <= 1) return
    const key = String(id)
    const next = selectedIds.filter((item) => String(item) !== key)
    const nextPrimary = next.includes(String(primaryId)) ? primaryId : (next[0] || '')
    onChange({ catalogIds: next, storeTypeId: nextPrimary })
  }

  const setPrimary = (id) => {
    const key = String(id)
    if (!selectedSet.has(key)) return
    const rest = selectedIds.filter((item) => String(item) !== key)
    onChange({ catalogIds: [key, ...rest], storeTypeId: key })
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex min-h-[40px] w-full items-center gap-2 rounded-[8px] border border-[rgba(0,0,0,0.1)] bg-white px-3 py-1.5 text-left outline-none transition focus:border-[#1aa054]',
          disabled && 'cursor-not-allowed opacity-60',
        )}
      >
        <div className="flex min-w-0 flex-1 flex-wrap gap-1.5">
          {selectedOptions.length === 0 ? (
            <span className="text-[13px] text-[#9aa49d]">Select one or more catalogs</span>
          ) : (
            selectedOptions.map((opt) => {
              const isPrimary = String(opt.id) === String(primary?.id)
              return (
                <span
                  key={opt.id}
                  className={cn(
                    'inline-flex max-w-full items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium',
                    isPrimary
                      ? 'bg-[#e8f7ed] text-[#147940]'
                      : 'bg-[#f1f4f1] text-[#455249]',
                  )}
                >
                  <span className="truncate">{opt.name}</span>
                  {isPrimary ? <span className="text-[9px] opacity-80">· primary</span> : null}
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation()
                      removeChip(opt.id)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        e.stopPropagation()
                        removeChip(opt.id)
                      }
                    }}
                    className="grid h-3.5 w-3.5 place-items-center rounded-full text-[10px] hover:bg-black/10"
                    aria-label={`Remove ${opt.name}`}
                  >
                    ×
                  </span>
                </span>
              )
            })
          )}
        </div>
        <ChevronDown size={14} className={cn('shrink-0 text-[#69756d] transition', open && 'rotate-180')} />
      </button>

      {open ? (
        <div className="absolute left-0 top-[calc(100%+4px)] z-40 w-full overflow-hidden rounded-[12px] border border-[#e2e6e3] bg-white shadow-[0_12px_32px_rgba(20,40,28,.16)]">
          <div className="border-b border-[#edf0ee] px-3 py-2 text-[11px] text-[#7c8780]">
            Select catalogs for this vendor. Mark one as primary for sub-category & listing.
          </div>
          <div className="max-h-[260px] space-y-0.5 overflow-y-auto p-1.5">
            {options.length === 0 ? (
              <p className="px-2 py-3 text-center text-[11px] text-[#8a948e]">No store types loaded</p>
            ) : (
              options.map((opt) => {
                const checked = selectedSet.has(String(opt.id))
                const isPrimary = checked && String(opt.id) === String(primary?.id)
                return (
                  <div
                    key={opt.id}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-[8px] px-2 py-2 transition',
                      checked ? 'bg-[#e8f7ed]' : 'hover:bg-[#f5f8f5]',
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => toggle(opt.id)}
                      className="flex min-w-0 flex-1 items-center gap-2 text-left"
                    >
                      <span className={cn(
                        'grid h-[15px] w-[15px] shrink-0 place-items-center rounded-[3px] border',
                        checked ? 'border-[#19ad5b] bg-[#19ad5b] text-white' : 'border-[#c5cdc7] bg-white',
                      )}>
                        {checked ? <Check size={10} strokeWidth={3} /> : null}
                      </span>
                      <span className={cn(
                        'min-w-0 flex-1 truncate text-[12px] font-semibold',
                        checked ? 'text-[#147940]' : 'text-[#314039]',
                      )}
                      >
                        {opt.name}
                      </span>
                    </button>
                    {checked ? (
                      <button
                        type="button"
                        onClick={() => setPrimary(opt.id)}
                        className={cn(
                          'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium',
                          isPrimary
                            ? 'bg-[#19ad5b] text-white'
                            : 'border border-[#d7ddd8] bg-white text-[#6a746e] hover:border-[#19ad5b] hover:text-[#147940]',
                        )}
                      >
                        {isPrimary ? 'Primary' : 'Make primary'}
                      </button>
                    ) : null}
                  </div>
                )
              })
            )}
          </div>
        </div>
      ) : null}
    </div>
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
  const { registerNavigationGuard } = useAdminShell()
  const allowLeaveRef = useRef(false)
  const sessionRestoredRef = useRef(false)
  const isEdit = location.state?.mode === 'edit'
  const editVendorId = location.state?.vendorId
  const returnTab = location.state?.returnTab
  const defaultBack = useCallback(() => {
    if (isEdit && editVendorId) {
      navigate(`/admin/vendors/${encodeURIComponent(editVendorId)}`, {
        state: returnTab ? { tab: returnTab } : undefined,
      })
      return
    }
    navigate('/admin/vendors')
  }, [editVendorId, isEdit, navigate, returnTab])
  const handleBack = onBack || defaultBack
  const [step, setStep] = useState(location.state?.step ?? 1)
  const [form, setForm] = useState({
    storeName: '',
    legalName: '',
    storeType: 'Food & Beverage',
    storeTypeId: '',
    catalogIds: [],
    storeSubTypeId: '',
    serviceSubTypeId: '',
    categoryLabel: 'Food & Beverage',
    subCategory: 'None',
    subcategoryId: '',
    description: '',
    logoUrl: '',
    coverUrl: '',
    city: 'Manama',
    area: 'Seef',
    cuisineTags: [],
    ownerName: '',
    ownerEmail: '',
    ownerPhone: '+973 ',
    ownerCountryCode: '+973',
    ownerPassword: '',
    crNumber: '',
    vatNumber: '',
    // Prefer neutral defaults when real API is on — edit load / create APIs overwrite these.
    commissionModel: isAdminRealApiFeature('vendors') ? '% of order' : 'Tiered',
    commissionRate: '15',
    serviceFee: '0.300',
    vatOnCommission: '10',
    currency: 'BHD',
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
    slaModelId: '',
  })
  const useRealVendorsApi = isAdminRealApiFeature('vendors')
  const useRealCreateApi = !isEdit && useRealVendorsApi
  const [storeTypes, setStoreTypes] = useState([])
  const [storeTypesLoading, setStoreTypesLoading] = useState(false)
  const [storeTypesError, setStoreTypesError] = useState(null)
  const [subCategories, setSubCategories] = useState([])
  const [slaModels, setSlaModels] = useState([])
  const [slaModelDefaults, setSlaModelDefaults] = useState(null)
  const [slaConfigs, setSlaConfigs] = useState({})
  const [slaLoading, setSlaLoading] = useState(false)
  const [slaSaving, setSlaSaving] = useState(false)
  const [slaError, setSlaError] = useState(null)
  const [usersLoading, setUsersLoading] = useState(false)
  const [usersError, setUsersError] = useState(null)
  const [ownerStaffId, setOwnerStaffId] = useState(null)
  const [ownerPasswordSaving, setOwnerPasswordSaving] = useState(false)
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileError, setProfileError] = useState(null)
  const [branches, setBranches] = useState(() => (useRealCreateApi ? [] : INITIAL_BRANCHES))
  const [branchesLoading, setBranchesLoading] = useState(false)
  const [branchesError, setBranchesError] = useState(null)
  const [users, setUsers] = useState(() => (useRealCreateApi ? [] : INITIAL_USERS))
  const [customFees, setCustomFees] = useState(() =>
    isAdminRealApiFeature('vendors') ? [] : [
      { id: 'f1', name: 'Packaging fee', value: 'BHD 0.250', amount: 0.25, type: 'BHD' },
      { id: 'f2', name: 'Priority handling', value: '2.5 %', amount: 2.5, type: '%' },
    ],
  )
  const [commissionTiers, setCommissionTiers] = useState([])
  const [commissionLoading, setCommissionLoading] = useState(false)
  const [commissionSaving, setCommissionSaving] = useState(false)
  const [commissionError, setCommissionError] = useState(null)
  const [serviceModes, setServiceModes] = useState(() =>
    isAdminRealApiFeature('vendors') ? [] : ['Hot food · on demand', 'Pickup', 'Scheduled delivery'],
  )
  const [feeDraft, setFeeDraft] = useState({ name: '', amount: '0.000', type: 'BHD' })
  const [tierDraft, setTierDraft] = useState({ fromAmount: '0', ratePct: '15' })
  const [createSaving, setCreateSaving] = useState(false)
  const [createError, setCreateError] = useState(null)
  const [activateSaving, setActivateSaving] = useState(false)
  const [vendorVisible, setVendorVisible] = useState(true)
  const [vendorActive, setVendorActive] = useState(true)
  const [editAccountStatus, setEditAccountStatus] = useState(null)
  const [leaveModalOpen, setLeaveModalOpen] = useState(false)
  const [leaveBusy, setLeaveBusy] = useState(false)
  const pendingLeaveActionRef = useRef(null)
  const [editBaseline, setEditBaseline] = useState(null)

  useEffect(() => {
    if (location.state?.flash) {
      showFlashMessage(String(location.state.flash))
      navigate(location.pathname, { replace: true, state: { ...location.state, flash: undefined } })
    }
  }, [location.pathname, location.state, navigate])

  const current = ADD_VENDOR_STEPS[step - 1]
  const update = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }))
  const useRealStoreApi = isEdit && Boolean(editVendorId) && useRealVendorsApi

  const editDataReady =
    isEdit &&
    (!useRealStoreApi ||
      (!profileLoading &&
        !branchesLoading &&
        !commissionLoading &&
        !usersLoading &&
        !slaLoading))

  const wizardSnapshot = useMemo(
    () =>
      serializeWizardSnapshot({
        form,
        branches,
        users,
        customFees,
        commissionTiers,
        serviceModes,
        slaConfigs,
        vendorVisible,
        vendorActive,
      }),
    [
      vendorActive,
      vendorVisible,
      branches,
      commissionTiers,
      customFees,
      form,
      serviceModes,
      slaConfigs,
      users,
    ],
  )

  const syncEditBaseline = useCallback(() => {
    setEditBaseline(wizardSnapshot)
  }, [wizardSnapshot])

  useEffect(() => {
    if (!editDataReady) return
    setEditBaseline(
      serializeWizardSnapshot({
        form,
        branches,
        users,
        customFees,
        commissionTiers,
        serviceModes,
        slaConfigs,
        vendorVisible,
        vendorActive,
      }),
    )
    // Reset baseline only after edit data loads or when returning from branch/user editors.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editDataReady, location.key])
  const stepBusy = profileSaving || commissionSaving || createSaving || slaSaving || activateSaving
  const stepLoading =
    (step === 1 && profileLoading) ||
    (step === 3 && usersLoading) ||
    (step === 4 && commissionLoading) ||
    (step === 5 && slaLoading)

  function buildWizardDraft(overrides = {}) {
    return {
      step,
      form,
      branches,
      users,
      customFees,
      commissionTiers,
      serviceModes,
      slaConfigs,
      vendorVisible,
      vendorActive,
      ...overrides,
    }
  }

  const persistWizardDraft = useCallback(
    (overrides = {}) => {
      if (isEdit) return
      writeWizardSessionDraft(buildWizardDraft(overrides))
    },
    [
      vendorActive,
      vendorVisible,
      branches,
      commissionTiers,
      customFees,
      form,
      isEdit,
      serviceModes,
      slaConfigs,
      step,
      users,
    ],
  )

  const wizardDirty = isEdit
    ? editBaseline != null && wizardSnapshot !== editBaseline
    : isWizardDraftDirty({
        step,
        form,
        branches,
        users,
        customFees,
        commissionTiers,
        serviceModes,
        useRealCreateApi,
      })

  const shouldBlockNavigation = useCallback(
    (to) => {
      if (allowLeaveRef.current || !wizardDirty) return false
      if (location.pathname !== ADD_VENDOR_WIZARD_PATH) return false
      return !isWizardInternalPath(to, editVendorId)
    },
    [editVendorId, location.pathname, wizardDirty],
  )

  useEffect(() => {
    return registerNavigationGuard((to, proceed) => {
      if (shouldBlockNavigation(to)) {
        pendingLeaveActionRef.current = proceed
        setLeaveModalOpen(true)
        return
      }
      proceed()
    })
  }, [registerNavigationGuard, shouldBlockNavigation])

  useEffect(() => {
    if (location.state?.step != null) setStep(location.state.step)
  }, [location.key, location.state?.step])

  useEffect(() => {
    if (isEdit || sessionRestoredRef.current) return
    if (location.state?.wizardDraft) return

    const saved = readWizardSessionDraft()
    if (!saved) return

    sessionRestoredRef.current = true
    applyWizardDraft(saved, {
      setForm,
      setBranches,
      setUsers,
      setCustomFees,
      setCommissionTiers,
      setServiceModes,
      setSlaConfigs,
      setStep,
      setVendorVisible,
      setVendorActive,
    })
  }, [isEdit, location.state?.wizardDraft])

  useEffect(() => {
    const st = location.state
    if (!st) return

    const draft = st.wizardDraft
    if (draft) {
      sessionRestoredRef.current = true
      const setters = {
        setForm,
        setCustomFees,
        setCommissionTiers,
        setServiceModes,
        setSlaConfigs,
        setStep,
        setVendorVisible,
        setVendorActive,
      }
      if (!isEdit) {
        setters.setBranches = setBranches
        setters.setUsers = setUsers
      }
      applyWizardDraft(draft, setters)
    }

    if (st.savedBranch) {
      const saved = st.savedBranch
      setBranches((prev) => {
        const idx = prev.findIndex((b) => String(b.id) === String(saved.id))
        if (idx >= 0) {
          const next = [...prev]
          next[idx] = { ...prev[idx], ...saved }
          return next
        }
        return [...prev, saved]
      })
    }

    if (st.savedUser) {
      const saved = st.savedUser
      setUsers((prev) => {
        const idx = prev.findIndex((u) => String(u.id) === String(saved.id))
        if (idx >= 0) {
          const next = [...prev]
          next[idx] = { ...prev[idx], ...saved }
          return next
        }
        return [...prev, saved]
      })
    }
  }, [location.key, isEdit])

  useEffect(() => {
    if (isEdit || !wizardDirty) return undefined
    const timer = window.setTimeout(() => persistWizardDraft(), 400)
    return () => window.clearTimeout(timer)
  }, [isEdit, persistWizardDraft, wizardDirty])

  useEffect(() => {
    if (!wizardDirty) return undefined
    const onBeforeUnload = (event) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [wizardDirty])

  const finishLeave = useCallback(() => {
    allowLeaveRef.current = true
    setLeaveModalOpen(false)
    const action = pendingLeaveActionRef.current
    pendingLeaveActionRef.current = null
    action?.()
  }, [])

  const requestLeave = useCallback(
    (action) => {
      if (!wizardDirty) {
        action()
        return
      }
      pendingLeaveActionRef.current = action
      setLeaveModalOpen(true)
    },
    [wizardDirty],
  )

  const handleStayEditing = () => {
    setLeaveModalOpen(false)
    pendingLeaveActionRef.current = null
  }

  const handleLeaveWithoutSaving = () => {
    if (!isEdit) clearWizardSessionDraft()
    finishLeave()
  }

  const handleLeaveSaveDraft = async () => {
    setLeaveBusy(true)
    try {
      if (useRealStoreApi) {
        let ok = true
        if (step === 1) ok = await saveStoreProfile()
        else if (step === 4) ok = await saveCommission()
        else if (step === 5) ok = await saveSla()
        if (!ok) return
        syncEditBaseline()
        finishLeave()
        return
      }
      if (isEdit) {
        syncEditBaseline()
        finishLeave()
        return
      }
      if (useRealCreateApi && (step === 6 || canCreateServerDraft({ form, branches }))) {
        await submitCreateVendor({
          activate: false,
          submitForApproval: step === 6,
          successMessage: step === 6
            ? 'Vendor submitted for approval.'
            : 'Vendor saved as draft.',
        })
        setLeaveModalOpen(false)
        pendingLeaveActionRef.current = null
        return
      }
      persistWizardDraft()
      allowLeaveRef.current = true
      setLeaveModalOpen(false)
      pendingLeaveActionRef.current = null
      showInfo(
        useRealCreateApi
          ? 'Progress saved locally. Complete owner login and at least one branch to save a server draft.'
          : 'Progress saved locally.',
      )
      navigate('/admin/vendors')
    } finally {
      setLeaveBusy(false)
    }
  }

  useEffect(() => {
    if (!useRealCreateApi) return undefined

    let cancelled = false
    setProfileLoading(true)
    setProfileError(null)
    setStoreTypesLoading(true)
    setStoreTypesError(null)
    setSlaError(null)

    Promise.allSettled([
      adminService.listStoreTypes(),
      adminService.listSlaModels({ limit: 50 }),
    ])
      .then(([typesResult, slaResult]) => {
        if (cancelled) return

        if (typesResult.status === 'fulfilled') {
          const types = typesResult.value?.data?.storeTypes || []
          setStoreTypes(types)
          if (!types.length) {
            setStoreTypesError('No store types returned from Store Management.')
          }
          setForm((prev) => {
            let next = prev
            if (!prev.storeTypeId) {
              const matched =
                types.find((t) => t.name === prev.storeType) || types[0]
              if (matched) {
                next = {
                  ...next,
                  storeTypeId: matched.id,
                  storeType: matched.name || prev.storeType,
                  catalogIds: prev.catalogIds?.length ? prev.catalogIds : [matched.id],
                  storeSubTypeId: '',
                  serviceSubTypeId: '',
                }
              }
            } else if (!prev.catalogIds?.length && prev.storeTypeId) {
              next = { ...next, catalogIds: [prev.storeTypeId] }
            }
            return next
          })
        } else {
          const message = formatApiErrorMessage(
            typesResult.reason,
            'Failed to load store types from Store Management.',
          )
          setStoreTypes([])
          setStoreTypesError(message)
          setProfileError(message)
        }

        if (slaResult.status === 'fulfilled') {
          const models = slaResult.value?.data?.slaModels || []
          setSlaModels(models)
          setForm((prev) => {
            if (prev.slaModelId) return prev
            const preferred = models.find((m) => m.isDefault) || models[0]
            if (!preferred) return prev
            return { ...prev, slaModelId: preferred.id }
          })
          const preferred =
            (slaResult.value?.data?.slaModels || []).find((m) => m.isDefault) ||
            (slaResult.value?.data?.slaModels || [])[0]
          if (preferred?.id) {
            applySlaModelDefaults(preferred.id, { preserveCustomized: false })
          }
        } else {
          setSlaModels([])
          setSlaError(
            formatApiErrorMessage(
              slaResult.reason,
              'Failed to load SLA models. Store info can still continue; assign an SLA model when permission is available.',
            ),
          )
        }
      })
      .finally(() => {
        if (!cancelled) {
          setProfileLoading(false)
          setStoreTypesLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [useRealCreateApi])

  useEffect(() => {
    if (!useRealStoreApi) return undefined

    let cancelled = false
    setProfileLoading(true)
    setProfileError(null)
    setStoreTypesLoading(true)
    setStoreTypesError(null)
    setSlaError(null)

    Promise.allSettled([
      adminService.getVendorDetail(editVendorId),
      adminService.listStoreTypes(),
      adminService.listSlaModels({ limit: 50 }),
    ])
      .then(([vendorResult, typesResult, slaResult]) => {
        if (cancelled) return

        const types =
          typesResult.status === 'fulfilled'
            ? typesResult.value?.data?.storeTypes || []
            : []
        const models =
          slaResult.status === 'fulfilled'
            ? slaResult.value?.data?.slaModels || []
            : []

        if (typesResult.status === 'fulfilled') {
          setStoreTypes(types)
          if (!types.length) {
            setStoreTypesError('No store types returned from Store Management.')
          }
        } else {
          setStoreTypes([])
          setStoreTypesError(
            formatApiErrorMessage(
              typesResult.reason,
              'Failed to load store types from Store Management.',
            ),
          )
        }

        if (slaResult.status === 'fulfilled') {
          setSlaModels(models)
        } else {
          setSlaModels([])
          setSlaError(
            formatApiErrorMessage(
              slaResult.reason,
              'Failed to load SLA models.',
            ),
          )
        }

        if (vendorResult.status !== 'fulfilled') {
          setProfileError(
            formatApiErrorMessage(vendorResult.reason, 'Failed to load store profile.'),
          )
          return
        }

        const vendor = vendorResult.value?.data || {}
        const matchedTypeId =
          vendor.storeTypeId || matchAdminStoreTypeId(types, vendor.categoryLabel || vendor.storeType)

        const loadedCatalogIds = Array.isArray(vendor.catalogIds) && vendor.catalogIds.length
          ? vendor.catalogIds.map(String)
          : matchedTypeId
            ? [String(matchedTypeId)]
            : []

        setForm((prev) => ({
          ...prev,
          storeName: vendor.name || '',
          legalName:
            vendor.legalNameRaw && vendor.legalNameRaw !== '—'
              ? vendor.legalNameRaw
              : vendor.legalName && vendor.legalName !== '—'
                ? vendor.legalName
                : '',
          storeType: vendor.categoryLabel || vendor.storeType || prev.storeType,
          storeTypeId: matchedTypeId || '',
          catalogIds: loadedCatalogIds,
          subCategory: vendor.subCategory || 'None',
          subcategoryId: vendor.subcategoryId || '',
          storeSubTypeId: vendor.storeSubTypeId || '',
          serviceSubTypeId: vendor.serviceSubTypeId || '',
          description: vendor.description || '',
          logoUrl: vendor.logoUrl || '',
          coverUrl: vendor.coverUrl || '',
          area: vendor.area || '',
          cuisineTags: vendor.cuisineTags || [],
          crNumber: vendor.crNumber || '',
          vatNumber: vendor.vatNumber || '',
          slaModelId: vendor.slaModelId || prev.slaModelId,
        }))
        if (typeof vendor.isCustomerVisible === 'boolean') {
          setVendorVisible(vendor.isCustomerVisible)
        } else if (typeof vendor.storeOnline === 'boolean') {
          setVendorVisible(vendor.storeOnline)
        }
        if (typeof vendor.isOnline === 'boolean') {
          setVendorActive(vendor.isOnline)
        } else if (typeof vendor.storeOnline === 'boolean') {
          setVendorActive(vendor.storeOnline)
        }
        setEditAccountStatus(vendor.accountStatus || null)
      })
      .finally(() => {
        if (!cancelled) {
          setProfileLoading(false)
          setStoreTypesLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [useRealStoreApi, editVendorId])

  useEffect(() => {
    if (!useRealStoreApi) return undefined

    let cancelled = false
    setBranchesLoading(true)
    setBranchesError(null)

    adminService
      .listVendorBranches(editVendorId)
      .then((response) => {
        if (cancelled) return
        setBranches(response?.data?.branches || [])
      })
      .catch((err) => {
        if (cancelled) return
        setBranches([])
        setBranchesError(err?.message || 'Failed to load branches.')
      })
      .finally(() => {
        if (!cancelled) setBranchesLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [useRealStoreApi, editVendorId, location.key])

  useEffect(() => {
    if (!useRealStoreApi) return undefined

    let cancelled = false
    setCommissionLoading(true)
    setCommissionError(null)

    adminService
      .getVendorCommission(editVendorId)
      .then((response) => {
        if (cancelled) return
        const commission = response?.data
        if (!commission) {
          setCustomFees([])
          setCommissionTiers([])
          return
        }
        setForm((prev) => ({
          ...prev,
          ...mapAdminCommissionToWizardForm(commission),
        }))
        setCustomFees(mapAdminCustomFeesToWizard(commission.customFees))
        setCommissionTiers(Array.isArray(commission.commissionTiers) ? commission.commissionTiers : [])
      })
      .catch((err) => {
        if (cancelled) return
        setCommissionError(err?.message || 'Failed to load commission.')
      })
      .finally(() => {
        if (!cancelled) setCommissionLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [useRealStoreApi, editVendorId, location.key])

  useEffect(() => {
    const storeTypeId = form.storeTypeId
    if (!storeTypeId || !useRealVendorsApi) {
      setSubCategories([])
      return undefined
    }

    let cancelled = false
    adminService
      .getAdminStoreType(storeTypeId)
      .then((response) => {
        if (cancelled) return
        const cats = Array.isArray(response?.data?.categories) ? response.data.categories : []
        setSubCategories(flattenAdminMenuCategoryOptions(cats))
      })
      .catch(() => {
        if (!cancelled) setSubCategories([])
      })

    return () => {
      cancelled = true
    }
  }, [form.storeTypeId, useRealVendorsApi])

  const selectedStoreType = storeTypes.find((t) => String(t.id) === String(form.storeTypeId))
  const allowedServiceModes = buildAllowedModesFromStoreType(selectedStoreType)
  const storeSubTypes = Array.isArray(selectedStoreType?.subTypes) ? selectedStoreType.subTypes : []
  const servicesStoreType = storeTypes.find(
    (t) => String(t.slug) === 'services' || (t.structure === 'TWO_LEVEL' && String(t.slug).includes('service')),
  ) || storeTypes.find((t) => t.structure === 'TWO_LEVEL' && t.id !== selectedStoreType?.id)
  const serviceSubTypes = Array.isArray(servicesStoreType?.subTypes) ? servicesStoreType.subTypes : []
  const showServiceSubType = requiresServiceSubTypeSelection(
    selectedStoreType?.slug,
    serviceModes.includes('Services'),
  )

  // Prune modes that are no longer allowed for the selected store type (never auto-enable).
  useEffect(() => {
    if (!form.storeTypeId || !storeTypes.length) return
    setServiceModes((prev) => {
      const next = prev.filter((mode) => allowedServiceModes.includes(mode))
      return next.length === prev.length ? prev : next
    })
  }, [form.storeTypeId, storeTypes.length, allowedServiceModes.join('|')])

  useEffect(() => {
    if (!useRealStoreApi) return undefined

    let cancelled = false
    setUsersLoading(true)
    setUsersError(null)

    adminService
      .listVendorStaff(editVendorId)
      .then((response) => {
        if (cancelled) return
        const all = response?.data?.users || []
        const owner = all.find((u) => u && u.isOwner)
        const list = all.filter((u) => u && !u.isOwner)
        setUsers(list)
        if (owner) {
          setOwnerStaffId(owner.id || null)
          setForm((prev) => ({
            ...prev,
            ownerName: owner.name && owner.name !== 'Untitled' ? owner.name : prev.ownerName,
            ownerEmail: owner.email && owner.email !== '—' ? owner.email : prev.ownerEmail,
            ownerPhone: owner.phone || prev.ownerPhone,
            ownerPassword: owner.password || '',
          }))
        } else {
          setOwnerStaffId(null)
        }
      })
      .catch((err) => {
        if (cancelled) return
        setUsers([])
        setUsersError(err?.message || 'Failed to load users.')
      })
      .finally(() => {
        if (!cancelled) setUsersLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [useRealStoreApi, editVendorId, location.key])

  const applySlaModelDefaults = useCallback(async (modelId, { preserveCustomized = true } = {}) => {
    const id = String(modelId || '').trim()
    if (!id || !isAdminRealApiFeature('vendors')) {
      setSlaModelDefaults(null)
      return null
    }
    try {
      const response = await adminService.getSlaModel(id)
      // Always inherit from published rules — not unpublished draft.
      const config =
        response?.data?.publishedConfig ||
        response?.data?.raw?.publishedConfig ||
        response?.data?.config ||
        {}
      const defaults = mapSlaModelConfigToWizardModes(config)
      setSlaModelDefaults(defaults)
      setSlaConfigs((prev) => {
        if (!preserveCustomized) return { ...defaults }
        return mergeWizardSlaModes(defaults, prev, Object.keys(defaults))
      })
      return defaults
    } catch (err) {
      showError(formatApiErrorMessage(err) || err?.message || 'Failed to load SLA model.')
      return null
    }
  }, [])

  useEffect(() => {
    if (!useRealStoreApi) return undefined

    let cancelled = false
    setSlaLoading(true)
    setSlaError(null)

    Promise.allSettled([
      adminService.getVendorSla(editVendorId),
      adminService.listSlaModels({ limit: 50 }),
    ])
      .then(async ([slaResult, modelsResult]) => {
        if (cancelled) return

        if (modelsResult.status === 'fulfilled') {
          setSlaModels(modelsResult.value?.data?.slaModels || [])
        } else {
          setSlaModels([])
          setSlaError(
            formatApiErrorMessage(modelsResult.reason, 'Failed to load SLA models.'),
          )
        }

        if (slaResult.status !== 'fulfilled') {
          if (!cancelled) {
            setSlaError(
              formatApiErrorMessage(slaResult.reason, 'Failed to load SLA.'),
            )
          }
          return
        }

        const sla = slaResult.value?.data
        if (!sla) return
        const labels = mapAdminServiceModesToLabels(sla.serviceModes || {})
        // Prune effect (allowedServiceModes) drops modes not supported by store type.
        if (labels.length) setServiceModes(labels)

        const modelId = sla.slaModelId || sla.modelId || ''
        setForm((prev) => ({
          ...prev,
          slaModelId: modelId || prev.slaModelId,
          acceptSla:
            sla.config?.acceptanceCutoffMin != null
              ? `${sla.config.acceptanceCutoffMin} min`
              : prev.acceptSla,
          prepSla:
            sla.config?.prepTimeHotFoodMin != null
              ? `${sla.config.prepTimeHotFoodMin} min`
              : prev.prepSla,
          readySla:
            sla.config?.readyOnTimeTargetPct != null
              ? `${sla.config.readyOnTimeTargetPct}%`
              : sla.config?.readyOnlineTargetPct != null
                ? `${sla.config.readyOnlineTargetPct}%`
                : prev.readySla,
        }))
        if (sla.config?.modeConfigs && typeof sla.config.modeConfigs === 'object') {
          setSlaConfigs(sla.config.modeConfigs)
        }
        if (modelId) {
          try {
            const response = await adminService.getSlaModel(modelId)
            if (cancelled) return
            const published =
              response?.data?.publishedConfig ||
              response?.data?.raw?.publishedConfig ||
              response?.data?.config ||
              {}
            const defaults = mapSlaModelConfigToWizardModes(published)
            setSlaModelDefaults(defaults)
            setSlaConfigs((prev) => mergeWizardSlaModes(defaults, prev, Object.keys(defaults)))
          } catch (err) {
            if (!cancelled) {
              setSlaError(formatApiErrorMessage(err, 'Failed to load SLA model.'))
            }
          }
        }
      })
      .finally(() => {
        if (!cancelled) setSlaLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [useRealStoreApi, editVendorId])

  async function saveStoreProfile() {
    if (!useRealStoreApi) return true
    setProfileError(null)
    setProfileSaving(true)
    try {
      const response = await adminService.updateVendor(editVendorId, form)
      const vendor = response?.data
      if (vendor) {
        setForm((prev) => ({
          ...prev,
          storeName: vendor.name || prev.storeName,
          legalName:
            vendor.legalNameRaw && vendor.legalNameRaw !== '—'
              ? vendor.legalNameRaw
              : prev.legalName,
          description: vendor.description ?? prev.description,
          logoUrl: vendor.logoUrl || prev.logoUrl,
          coverUrl: vendor.coverUrl || prev.coverUrl,
          area: vendor.area || prev.area,
          cuisineTags: vendor.cuisineTags || prev.cuisineTags,
          storeType: vendor.categoryLabel || prev.storeType,
          storeTypeId: vendor.storeTypeId || prev.storeTypeId,
          storeSubTypeId:
            vendor.storeSubTypeId !== undefined && vendor.storeSubTypeId !== null
              ? vendor.storeSubTypeId
              : prev.storeSubTypeId,
          serviceSubTypeId:
            vendor.serviceSubTypeId !== undefined && vendor.serviceSubTypeId !== null
              ? vendor.serviceSubTypeId
              : prev.serviceSubTypeId,
          catalogIds: Array.isArray(vendor.catalogIds) && vendor.catalogIds.length
            ? vendor.catalogIds.map(String)
            : (vendor.storeTypeId ? [String(vendor.storeTypeId)] : prev.catalogIds),
          subcategoryId:
            vendor.subcategoryId !== undefined && vendor.subcategoryId !== null
              ? vendor.subcategoryId
              : prev.subcategoryId,
          subCategory: vendor.subCategory || prev.subCategory,
          crNumber: vendor.crNumber ?? prev.crNumber,
          vatNumber: vendor.vatNumber ?? prev.vatNumber,
        }))
      }
      return true
    } catch (err) {
      setProfileError(err?.message || 'Failed to update store profile.')
      return false
    } finally {
      setProfileSaving(false)
    }
  }

  async function saveCommission() {
    if (!useRealStoreApi) return true
    setCommissionError(null)
    setCommissionSaving(true)
    try {
      // CR / VAT live on store profile — persist with this step's Documents card.
      const crNumber = String(form.crNumber || '').trim()
      const vatNumber = String(form.vatNumber || '').trim()
      if (crNumber || vatNumber) {
        await adminService.updateVendor(editVendorId, { crNumber, vatNumber })
      }

      const response = await adminService.updateVendorCommission(editVendorId, form, {
        wizard: true,
        customFees,
        commissionTiers,
      })
      const commission = response?.data
      if (commission) {
        setForm((prev) => ({
          ...prev,
          ...mapAdminCommissionToWizardForm(commission),
        }))
        setCustomFees(mapAdminCustomFeesToWizard(commission.customFees))
        setCommissionTiers(Array.isArray(commission.commissionTiers) ? commission.commissionTiers : [])
      }
      return true
    } catch (err) {
      setCommissionError(err?.message || 'Failed to update commission.')
      return false
    } finally {
      setCommissionSaving(false)
    }
  }

  async function saveSla() {
    if (!useRealStoreApi) return true
    if (!String(form.slaModelId || '').trim()) {
      setSlaError('Select an SLA model before continuing.')
      showError('Select an SLA model before continuing.')
      return false
    }
    setSlaError(null)
    setSlaSaving(true)
    try {
      const modesForSave = serviceModes.filter((mode) => allowedServiceModes.includes(mode))
      const configsForSave = Object.fromEntries(
        Object.entries(slaConfigs || {}).filter(([mode]) => modesForSave.includes(mode)),
      )
      await adminService.updateVendorSla(editVendorId, {
        slaModelId: form.slaModelId,
        selectedModes: modesForSave,
        acceptSla: Number(String(form.acceptSla).replace(/[^\d.]/g, '')) || undefined,
        prepSla: Number(String(form.prepSla).replace(/[^\d.]/g, '')) || undefined,
        slaConfigs: configsForSave,
        config: {
          acceptanceCutoffMin: Number(String(form.acceptSla).replace(/[^\d.]/g, '')) || undefined,
          prepTimeHotFoodMin: Number(String(form.prepSla).replace(/[^\d.]/g, '')) || undefined,
        },
      })
      return true
    } catch (err) {
      setSlaError(err?.message || 'Failed to update SLA.')
      return false
    } finally {
      setSlaSaving(false)
    }
  }

  async function submitCreateVendor({
    activate,
    submitForApproval = false,
    redirectToEdit = false,
    successMessage = '',
    isCustomerVisible,
    isOnline,
  }) {
    if (!useRealCreateApi) {
      handleBack()
      return false
    }

    setCreateError(null)
    setCreateSaving(true)
    try {
      const response = await adminService.createVendor({
        form,
        branches,
        users,
        customFees,
        commissionTiers,
        serviceModes,
        slaConfigs,
        activate: Boolean(activate),
        submitForApproval: Boolean(submitForApproval) && !activate,
        isCustomerVisible,
        isOnline,
      })
      const id = response?.data?.id
      if (!id) {
        throw new Error('Vendor created but no id was returned.')
      }
      clearWizardSessionDraft()
      allowLeaveRef.current = true
      const message =
        successMessage ||
        (activate
          ? 'Vendor activated successfully.'
          : submitForApproval
            ? 'Vendor submitted for approval.'
            : 'Vendor saved as draft.')
      showSuccess(message)
      if (redirectToEdit) {
        navigate('/admin/vendors/new', {
          replace: true,
          state: {
            mode: 'edit',
            vendorId: id,
            step,
            storeName: form.storeName,
          },
        })
        return true
      }
      navigate(`/admin/vendors/${encodeURIComponent(id)}`)
      return true
    } catch (err) {
      const message = formatApiErrorMessage(err, 'Failed to create vendor.')
      setCreateError(message)
      showError(message)
      return false
    } finally {
      setCreateSaving(false)
    }
  }

  const validateTaxonomyBeforeAdvance = () => {
    if (!useRealVendorsApi) return true

    if (!form.storeTypeId) {
      const message = 'Select a store type from Store Management.'
      setCreateError(message)
      showError(message)
      return false
    }

    if (selectedStoreType?.structure === 'TWO_LEVEL' && !String(form.storeSubTypeId || '').trim()) {
      const message = 'Select a sub-type for this two-level store type.'
      setCreateError(message)
      showError(message)
      return false
    }

    if (showServiceSubType && !String(form.serviceSubTypeId || '').trim()) {
      const message = 'Select a services sub-type when Services mode is enabled.'
      setCreateError(message)
      showError(message)
      return false
    }

    return true
  }

  const goNext = async () => {
    if (step === 1 || step === 5) {
      if (!validateTaxonomyBeforeAdvance()) return
    }
    if (step === 1 && useRealStoreApi) {
      const ok = await saveStoreProfile()
      if (!ok) return
      syncEditBaseline()
    }
    if (step === 4 && useRealStoreApi) {
      const ok = await saveCommission()
      if (!ok) return
      syncEditBaseline()
    }
    if (step === 5 && useRealStoreApi) {
      const ok = await saveSla()
      if (!ok) return
      syncEditBaseline()
    }
    if (step < ADD_VENDOR_STEPS.length) setStep(step + 1)
    else handleBack()
  }

  async function submitActivateExistingVendor() {
    if (!editVendorId || !useRealStoreApi) return false

    setCreateError(null)
    setActivateSaving(true)
    try {
      const accountStatus = String(editAccountStatus || '').toUpperCase()
      const alreadyActive = accountStatus === 'ACTIVE'

      if (alreadyActive) {
        await adminService.updateVendorStoreControls(editVendorId, {
          isCustomerVisible: vendorVisible,
          isOnline: vendorActive,
        })
        allowLeaveRef.current = true
        showSuccess('Vendor status updated.')
      } else {
        await adminService.activateVendor(editVendorId, {
          activate: true,
          isCustomerVisible: vendorVisible,
          isOnline: vendorActive,
        })
        allowLeaveRef.current = true
        showSuccess('Vendor activated successfully.')
      }
      navigate(`/admin/vendors/${encodeURIComponent(editVendorId)}`)
      return true
    } catch (err) {
      const message = formatApiErrorMessage(err, 'Failed to update vendor.')
      setCreateError(message)
      showError(message)
      return false
    } finally {
      setActivateSaving(false)
    }
  }

  async function saveCreateFlowDraft() {
    persistWizardDraft()
    if (canCreateServerDraft({ form, branches })) {
      if (step === 6 && !validateTaxonomyBeforeAdvance()) return
      await submitCreateVendor({
        activate: false,
        submitForApproval: false,
        redirectToEdit: true,
        isCustomerVisible: false,
        isOnline: false,
        successMessage: 'Vendor saved as draft. Continue setup anytime from Edit vendor.',
      })
      return
    }
    showInfo(
      'Progress saved locally. Complete store type, owner login, and at least one branch to save a server draft.',
    )
  }

  const handleSaveDraft = async () => {
    if (useRealCreateApi) {
      await saveCreateFlowDraft()
      return
    }
    if (useRealStoreApi) {
      if (step === 1) {
        const ok = await saveStoreProfile()
        if (ok) {
          syncEditBaseline()
          showSuccess('Store profile saved.')
          allowLeaveRef.current = true
          handleBack()
        }
        return
      }
      if (step === 2 || step === 3 || step === 6) {
        syncEditBaseline()
        allowLeaveRef.current = true
        handleBack()
        return
      }
      if (step === 4) {
        const ok = await saveCommission()
        if (ok) {
          syncEditBaseline()
          showSuccess('Commission settings saved.')
          allowLeaveRef.current = true
          handleBack()
        }
        return
      }
      if (step === 5) {
        const ok = await saveSla()
        if (ok) {
          syncEditBaseline()
          showSuccess('SLA settings saved.')
          allowLeaveRef.current = true
          handleBack()
        }
        return
      }
    }
    if (!isEdit) {
      persistWizardDraft()
      showInfo(
        'Progress saved locally. Complete store type, owner login, and at least one branch to save a server draft.',
      )
    }
  }

  const handleActivateVendor = async () => {
    if (!validateTaxonomyBeforeAdvance()) return
    if (useRealCreateApi) {
      await submitCreateVendor({
        activate: true,
        submitForApproval: false,
        isCustomerVisible: vendorVisible,
        isOnline: vendorActive,
        successMessage: 'Vendor created successfully.',
      })
      return
    }
    if (isEdit && useRealStoreApi) {
      await submitActivateExistingVendor()
      return
    }
    handleBack()
  }

  const saveOwnerPassword = async () => {
    const nextPassword = String(form.ownerPassword || '').trim()
    if (!useRealStoreApi || !ownerStaffId) {
      showError('Owner account is not loaded yet.')
      return
    }
    if (nextPassword.length < 6) {
      showError('Password must be at least 6 characters.')
      return
    }
    setOwnerPasswordSaving(true)
    try {
      await adminService.updateStaff(editVendorId, ownerStaffId, { password: nextPassword })
      showSuccess('Owner password updated.')
    } catch (err) {
      showError(formatApiErrorMessage(err) || err?.message || 'Failed to update password.')
    } finally {
      setOwnerPasswordSaving(false)
    }
  }

  const addBranch = () => {
    if (useRealStoreApi) {
      navigate(`/admin/vendors/${encodeURIComponent(editVendorId)}/branches/new`, {
        state: {
          storeName: form.storeName,
          vendorId: editVendorId,
          mode: 'edit',
          returnTo: 'wizard',
          step: 2,
          wizardDraft: buildWizardDraft(),
        },
      })
      return
    }
    navigate('/admin/vendors/new/branches/new', {
      state: {
        storeName: form.storeName,
        mode: 'create',
        returnTo: 'wizard',
        step: 2,
        wizardDraft: buildWizardDraft(),
      },
    })
  }

  const editBranch = (branch) => {
    if (useRealStoreApi) {
      navigate(
        `/admin/vendors/${encodeURIComponent(editVendorId)}/branches/${encodeURIComponent(branch.id)}`,
        {
          state: {
            branch,
            storeName: form.storeName,
            vendorId: editVendorId,
            mode: 'edit',
            returnTo: 'wizard',
            step: 2,
            wizardDraft: buildWizardDraft(),
          },
        },
      )
      return
    }
    navigate(`/admin/vendors/new/branches/${encodeURIComponent(branch.id)}`, {
      state: {
        branch,
        storeName: form.storeName,
        mode: 'create',
        returnTo: 'wizard',
        step: 2,
        wizardDraft: buildWizardDraft(),
      },
    })
  }

  const addUser = () => {
    if (useRealStoreApi) {
      navigate(`/admin/vendors/${encodeURIComponent(editVendorId)}/users/new`, {
        state: {
          storeName: form.storeName,
          vendorId: editVendorId,
          mode: 'edit',
          returnTo: 'wizard',
          step: 3,
          branches,
          wizardDraft: buildWizardDraft(),
        },
      })
      return
    }
    navigate('/admin/vendors/new/users/new', {
      state: {
        storeName: form.storeName,
        mode: 'create',
        step: 3,
        branches,
        wizardDraft: buildWizardDraft(),
      },
    })
  }

  const editUser = (user) => {
    if (useRealStoreApi) {
      navigate(
        `/admin/vendors/${encodeURIComponent(editVendorId)}/users/${encodeURIComponent(user.id)}`,
        {
          state: {
            user,
            storeName: form.storeName,
            vendorId: editVendorId,
            mode: 'edit',
            returnTo: 'wizard',
            step: 3,
            branches,
            wizardDraft: buildWizardDraft(),
          },
        },
      )
      return
    }
    navigate(`/admin/vendors/new/users/${encodeURIComponent(user.id)}`, {
      state: {
        user,
        storeName: form.storeName,
        mode: 'create',
        step: 3,
        branches,
        wizardDraft: buildWizardDraft(),
      },
    })
  }

  const addCustomFee = () => {
    if (!feeDraft.name.trim() || !feeDraft.amount.trim()) return
    const amountNum = Number(feeDraft.amount)
    setCustomFees((prev) => [
      ...prev,
      {
        id: `f${Date.now()}`,
        name: feeDraft.name.trim(),
        amount: Number.isNaN(amountNum) ? 0 : amountNum,
        type: feeDraft.type,
        value: feeDraft.type === 'BHD' ? `BHD ${feeDraft.amount}` : `${feeDraft.amount} %`,
      },
    ])
    setFeeDraft({ name: '', amount: '0.000', type: 'BHD' })
  }

  const addCommissionTier = () => {
    const fromAmount = Number(tierDraft.fromAmount)
    const ratePct = Number(tierDraft.ratePct)
    if (Number.isNaN(fromAmount) || Number.isNaN(ratePct)) return
    setCommissionTiers((prev) => [...prev, { fromAmount, ratePct }])
    setTierDraft({ fromAmount: '0', ratePct: '15' })
  }

  const selectCommissionModel = (model) => {
    setForm((prev) => ({ ...prev, commissionModel: model }))
    if (model === 'Tiered' && commissionTiers.length === 0) {
      setCommissionTiers([
        { fromAmount: 0, ratePct: 18 },
        { fromAmount: 5000, ratePct: 15 },
        { fromAmount: 15000, ratePct: 12 },
      ])
    }
  }

  const toggleServiceMode = (mode) => {
    setServiceModes((prev) => {
      const turningOff = prev.includes(mode)
      const next = turningOff ? prev.filter((item) => item !== mode) : [...prev, mode]
      return next
    })
    if (mode === 'Services' && serviceModes.includes('Services')) {
      setForm((prev) => ({ ...prev, serviceSubTypeId: '' }))
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-44px)] flex-col px-5 pb-5 pt-4 max-[700px]:px-3 ">
      <div className="mb-4 flex flex-wrap items-start gap-3">
        <button
          type="button"
          onClick={() => requestLeave(handleBack)}
          className="inline-flex h-[32px] items-center gap-1 rounded-full border border-[#dfe4e0] bg-white px-3 text-[12px] font-medium text-[#455249] hover:bg-[#f6f8f6]"
        >
          <ChevronLeft size={14} strokeWidth={2} />
          Back
        </button>
        <div className="min-w-0 flex-1">
          <h2 className="text-[18px] font-bold tracking-[-0.02em] text-[#17231c]">
            {isEdit ? 'Edit vendor' : 'Add vendor'} · {current.short}
          </h2>
          <p className="mt-0.5 text-[12px] text-[#7c8780]">{current.subtitle}</p>
        </div>
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-y-2">
        {ADD_VENDOR_STEPS.map((item, index) => {
          const active = step === item.id
          const done = item.id < step
          return (
            <div key={item.id} className="flex items-center ">
              <button
                type="button"
                onClick={() => setStep(item.id)}
                className={cn(
                  'inline-flex h-[34px] items-center gap-2 rounded-full px-2.5 pr-3.5 text-[12px] font-medium whitespace-nowrap transition',
                  active && 'border border-2 border-[#1aa054] bg-[#e8f7ed] text-[#147940]',
                  done && !active && 'border border-[#1aa054] bg-[#1aa054] text-white',
                  !active && !done && 'border border-[#E3E5E3] bg-white text-[#7c8780] hover:bg-[#e6e9e6]',
                )}
              >
                <span
                  className={cn(
                    'grid h-[22px] w-[22px] place-items-center rounded-full text-[11px] font-bold',
                    active && 'bg-[#1aa054] text-white',
                    done && !active && 'bg-white text-[#1aa054]',
                    !active && !done && 'bg-[#E3E5E3] text-[#8a948e]',
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

      <div className="space-y-3">
        {step === 1 ? (
          <VendorCard title="Store profile">
            {profileLoading ? (
              <p className="mb-3 text-[13px] text-[#7c8780]">Loading store profile…</p>
            ) : null}
            {profileError ? (
              <div className="mb-3 rounded-[10px] border border-[#f5c6c4] bg-[#fdebec] px-3 py-2 text-[12px] text-[#d64044]">
                {profileError}
              </div>
            ) : null}
            <div className="grid grid-cols-2 gap-x-4 gap-y-4 max-[700px]:grid-cols-1">
              <VendorField label="Store name">
                <VendorInput value={form.storeName} onChange={update('storeName')} placeholder="e.g. Green Kitchen test" />
              </VendorField>
              <VendorField label="Legal name">
                <VendorInput value={form.legalName} onChange={update('legalName')} placeholder="e.g. Green Kitchen Express W.L.L." />
              </VendorField>
              <VendorField label="Store type">
                {storeTypesLoading ? (
                  <p className="text-[13px] text-[#7c8780]">Loading store types…</p>
                ) : storeTypes.length ? (
                  <VendorSelect
                    value={form.storeTypeId || ''}
                    onChange={(e) => {
                      const value = e.target.value
                      const primary = storeTypes.find((t) => String(t.id) === String(value))
                      setForm((prev) => ({
                        ...prev,
                        catalogIds: value ? [value] : [],
                        storeTypeId: value,
                        storeType: primary?.name || '',
                        categoryLabel: primary?.name || '',
                        subcategoryId: '',
                        storeSubTypeId: '',
                        serviceSubTypeId: '',
                        subCategory: 'None',
                      }))
                      setServiceModes([])
                    }}
                  >
                    <option value="">Select store type</option>
                    {storeTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </VendorSelect>
                ) : (
                  <div className="rounded-[10px] border border-[#f5c6c4] bg-[#fdebec] px-3 py-2 text-[12px] text-[#d64044]">
                    {storeTypesError ||
                      (useRealVendorsApi
                        ? 'Failed to load store types from Store Management.'
                        : 'Store types are unavailable. Enable the vendors API to load from Store Management.')}
                  </div>
                )}
              </VendorField>
              {selectedStoreType?.structure === 'TWO_LEVEL' ? (
                <VendorField label="Sub-type">
                  <VendorSelect
                    value={form.storeSubTypeId || ''}
                    onChange={(event) => {
                      const value = event.target.value
                      const matched = storeSubTypes.find((c) => c.id === value)
                      setForm((prev) => ({
                        ...prev,
                        storeSubTypeId: value,
                        subCategory: matched?.name || 'None',
                      }))
                    }}
                  >
                    <option value="">Select sub-type</option>
                    {storeSubTypes.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </VendorSelect>
                </VendorField>
              ) : (
                <VendorField label="Sub-category">
                  <VendorSelect
                    value={form.subcategoryId || ''}
                    onChange={(event) => {
                      const value = event.target.value
                      const matched = subCategories.find((c) => c.id === value)
                      setForm((prev) => ({
                        ...prev,
                        subcategoryId: value,
                        subCategory: matched?.name || (value ? prev.subCategory : 'None'),
                      }))
                    }}
                  >
                    <option value="">None</option>
                    {subCategories.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </VendorSelect>
                </VendorField>
              )}
              {showServiceSubType ? (
                <VendorField label="Services sub-type">
                  <VendorSelect
                    value={form.serviceSubTypeId || ''}
                    onChange={(event) => {
                      setForm((prev) => ({ ...prev, serviceSubTypeId: event.target.value }))
                    }}
                  >
                    <option value="">Select which service it appears under</option>
                    {serviceSubTypes.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </VendorSelect>
                </VendorField>
              ) : null}
              <VendorField label="Short description" className="col-span-2 max-[700px]:col-span-1">
                <VendorInput value={form.description} onChange={update('description')} />
              </VendorField>
              <AdminVendorImageUpload
                label="Logo"
                aspect={1}
                imageUrl={form.logoUrl}
                onUrlChange={(logoUrl) => setForm((prev) => ({ ...prev, logoUrl }))}
              />
              <AdminVendorImageUpload
                label="Cover image"
                aspect={16 / 9}
                imageUrl={form.coverUrl}
                onUrlChange={(coverUrl) => setForm((prev) => ({ ...prev, coverUrl }))}
              />
            </div>
          </VendorCard>
        ) : null}

        {step === 2 ? (
          <VendorCard title="Branches" subtitle="Add each physical branch. You can fine-tune each one after.">
            {branchesLoading ? (
              <p className="mb-3 text-[13px] text-[#7c8780]">Loading branches…</p>
            ) : null}
            {branchesError ? (
              <div className="mb-3 rounded-[10px] border border-[#f5c6c4] bg-[#fdebec] px-3 py-2 text-[12px] text-[#d64044]">
                {branchesError}
              </div>
            ) : null}
            <div className="space-y-2.5">
              {!branchesLoading && !branchesError && branches.length === 0 ? (
                <p className="text-[13px] text-[#7c8780]">No branches yet. Add a branch to get started.</p>
              ) : null}
              {branches.map((branch) => (
                <div
                  key={branch.id}
                  className="flex items-center gap-3 rounded-[12px] border border-[#e8ebe9] bg-white px-3.5 py-3"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-[#e7f5eb] p-1.5">
                    <img src={houseIcon} alt="" className="h-full w-full object-contain" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-bold text-[#17231c]">{branch.name}</p>
                    <p className="mt-0.5 truncate text-[11px] text-[#7c8780]">
                      {branch.detail ||
                        `${branch.block || '—'} · radius ${branch.radius || '—'} · ETA ${branch.eta || '—'} · min ${branch.minOrder || '—'}`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => editBranch(branch)}
                    className="inline-flex shrink-0 items-center gap-1 text-[12px] font-medium text-[#127338] hover:underline"
                  >
                    Edit ›
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addBranch}
                className="flex h-[42px] w-full items-center justify-center gap-1.5 rounded-sm border border border-[#1aa054] bg-white text-[13px] font-medium text-[#1aa054] hover:bg-[#f3faf5]"
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
                  <VendorInput
                    value={form.ownerName}
                    onChange={update('ownerName')}
                    disabled={isEdit}
                  />
                </VendorField>
                <VendorField label="Email">
                  <VendorInput
                    value={form.ownerEmail}
                    onChange={update('ownerEmail')}
                    disabled={isEdit}
                  />
                </VendorField>
                <VendorField label="Phone">
                  <VendorInput
                    value={form.ownerPhone}
                    onChange={update('ownerPhone')}
                    disabled={isEdit}
                  />
                </VendorField>
                <div className="block">
                  <span className="mb-1.5 block text-[12px] font-medium text-[#7c8780]">
                    Password{isEdit ? ' (visible to admin)' : ''}
                  </span>
                  <AdminPasswordField
                    value={form.ownerPassword}
                    onChange={(next) => setForm((prev) => ({ ...prev, ownerPassword: next }))}
                    placeholder={
                      isEdit
                        ? 'Shown when available — generate to set a new password'
                        : ''
                    }
                  />
                  {isEdit && useRealStoreApi ? (
                    <button
                      type="button"
                      onClick={saveOwnerPassword}
                      disabled={ownerPasswordSaving || !ownerStaffId}
                      className="mt-2 h-[36px] rounded-[8px] border border-[#d7ddd9] bg-white px-3 text-[12px] font-semibold text-[#17231c] transition hover:bg-[#f5f7f5] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {ownerPasswordSaving ? 'Saving…' : 'Update password'}
                    </button>
                  ) : null}
                </div>
              </div>
              {useRealStoreApi ? (
                <p className="mt-3 text-[11px] text-[#8a948e]">
                  {isEdit
                    ? 'Owner email and password are shown for admin. Use Update password after Generate or typing a new value. Older accounts may have no stored password until you set one.'
                    : 'Owner login is created with this vendor. Additional users below can still be added or edited.'}
                </p>
              ) : null}
            </VendorCard>

            <VendorCard title="Additional users" subtitle="Staff accounts with branch-level access">
              {usersLoading ? (
                <p className="mb-3 text-[13px] text-[#7c8780]">Loading users…</p>
              ) : null}
              {usersError ? (
                <div className="mb-3 rounded-[10px] border border-[#f5c6c4] bg-[#fdebec] px-3 py-2 text-[12px] text-[#d64044]">
                  {usersError}
                </div>
              ) : null}
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
                    {!usersLoading && users.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-3 text-[13px] text-[#7c8780]">
                          No additional users yet.
                        </td>
                      </tr>
                    ) : null}
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
                            onClick={() => editUser(user)}
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
                className="mt-3 flex h-[42px] w-full items-center justify-center gap-1.5 rounded-sm border border-2 border-[#1aa054] bg-white text-[13px] font-medium text-[#1aa054] hover:bg-[#f3faf5]"
              >
                <Plus size={15} strokeWidth={2.2} /> Add user
              </button>
            </VendorCard>
          </>
        ) : null}

        {step === 4 ? (
          <>
            {commissionLoading ? (
              <p className="text-[13px] text-[#7c8780]">Loading commission…</p>
            ) : null}
            {commissionError ? (
              <div className="rounded-[10px] border border-[#f5c6c4] bg-[#fdebec] px-3 py-2 text-[12px] text-[#d64044]">
                {commissionError}
              </div>
            ) : null}

            <VendorCard title="Documents & compliance">
              <div className="grid grid-cols-2 gap-x-4 gap-y-4 max-[700px]:grid-cols-1">
                <VendorField label="CR number">
                  <VendorInput value={form.crNumber} onChange={update('crNumber')} />
                </VendorField>
                <VendorField label="VAT number">
                  <VendorInput value={form.vatNumber} onChange={update('vatNumber')} />
                </VendorField>
              </div>
              {useRealStoreApi ? (
                <p className="mt-3 text-[11px] text-[#8a948e]">
                  CR / VAT are saved with Continue on this step (store profile PATCH).
                </p>
              ) : null}
            </VendorCard>

            <VendorCard title="Commission & fees">
              <p className="mb-2 text-[12px] font-medium text-[#7c8780]">Commission model</p>
              <div className="mb-4 flex flex-wrap w-fit items-center rounded-[10px] bg-[#e9ebe9] p-[3px]">
                {['% of order', 'Flat per order', 'Tiered'].map((model) => (
                  <button
                    key={model}
                    type="button"
                    onClick={() => selectCommissionModel(model)}
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
                  <VendorSelect value={form.currency || 'BHD'} onChange={update('currency')}>
                    <option value="BHD">BHD</option>
                  </VendorSelect>
                </VendorField>
              </div>
              {form.commissionModel === 'Tiered' ? (
                <div className="mt-4 rounded-[10px] border border-[#e8ebe9] bg-[#fafbfa] px-3 py-3">
                  <p className="text-[12px] font-medium text-[#455249]">Commission tiers</p>
                  <p className="mt-1 text-[11px] text-[#8a948e]">
                    Add rate bands by order volume (from amount → %).
                  </p>
                  <div className="mt-3 flex flex-wrap items-end gap-2.5">
                    <VendorField label="From amount" className="w-[140px]">
                      <VendorInput
                        value={tierDraft.fromAmount}
                        onChange={(e) => setTierDraft((prev) => ({ ...prev, fromAmount: e.target.value }))}
                        placeholder="0"
                      />
                    </VendorField>
                    <VendorField label="Rate %" className="w-[120px]">
                      <VendorInput
                        value={tierDraft.ratePct}
                        onChange={(e) => setTierDraft((prev) => ({ ...prev, ratePct: e.target.value }))}
                        placeholder="15"
                      />
                    </VendorField>
                    <button
                      type="button"
                      onClick={addCommissionTier}
                      className="inline-flex h-[40px] items-center gap-1 rounded-[8px] bg-[#1aa054] px-4 text-[13px] font-medium text-white hover:bg-[#158a47]"
                    >
                      <Plus size={14} /> Add tier
                    </button>
                  </div>
                  {commissionTiers.length === 0 ? (
                    <p className="mt-3 text-[11px] text-[#8a948e]">No tiers yet — add at least one before activating Tiered.</p>
                  ) : (
                    <ul className="mt-3 space-y-1.5">
                      {commissionTiers.map((tier, index) => (
                        <li
                          key={`${tier.fromAmount}-${tier.ratePct}-${index}`}
                          className="flex h-[36px] items-center gap-3 rounded-[8px] border border-[#dceee3] bg-white px-3 text-[12px] text-[#17231c]"
                        >
                          <span className="min-w-0 flex-1">From {tier.fromAmount} → {tier.ratePct}%</span>
                          <button
                            type="button"
                            onClick={() => setCommissionTiers((prev) => prev.filter((_, i) => i !== index))}
                            className="grid h-6 w-6 place-items-center rounded-full text-[16px] text-[#9aa49d] hover:bg-[#f3f5f3]"
                            aria-label={`Remove tier ${index + 1}`}
                          >
                            ×
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : null}
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
                {customFees.length === 0 ? (
                  <p className="text-[12px] text-[#8a948e]">No custom fees</p>
                ) : null}
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
              {useRealStoreApi && form.commissionModel !== 'Tiered' ? (
                <p className="mt-3 text-[11px] text-[#8a948e]">
                  Custom fees are saved with this step for every commission model.
                </p>
              ) : null}
            </VendorCard>
          </>
        ) : null}

        {step === 5 ? (
          <>
            <VendorCard title="Service modes & SLA">
              {isAdminRealApiFeature('vendors') ? (
                <div className="mb-4 max-w-md">
                  <VendorField label="SLA model">
                    {slaModels.length ? (
                      <VendorSelect
                        value={form.slaModelId}
                        onChange={async (event) => {
                          const nextId = event.target.value
                          setForm((prev) => ({ ...prev, slaModelId: nextId }))
                          if (nextId) {
                            await applySlaModelDefaults(nextId, { preserveCustomized: false })
                          } else {
                            setSlaModelDefaults(null)
                          }
                        }}
                      >
                        <option value="">Select SLA model</option>
                        {slaModels.map((model) => (
                          <option key={model.id} value={model.id}>
                            {model.name}
                            {model.isDefault ? ' (default)' : ''}
                          </option>
                        ))}
                      </VendorSelect>
                    ) : (
                      <div className="rounded-[10px] border border-[#f5c6c4] bg-[#fdebec] px-3 py-2 text-[12px] text-[#d64044]">
                        {slaError || 'No SLA models available.'}
                      </div>
                    )}
                  </VendorField>
                </div>
              ) : null}
              <div className="flex flex-wrap gap-2.5">
                {!form.storeTypeId ? (
                  <p className="text-[13px] text-[#7c8780]">Select a store type to see available order modes.</p>
                ) : !allowedServiceModes.length ? (
                  <div className="w-full rounded-[10px] border border-[#f5c6c4] bg-[#fdebec] px-3 py-2 text-[12px] text-[#d64044]">
                    No order modes are configured for this store type in Store Management.
                  </div>
                ) : (
                  allowedServiceModes.map((mode) => {
                  const selected = serviceModes.includes(mode)
                  return (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => toggleServiceMode(mode)}
                      className={cn(
                        'inline-flex h-[36px] items-center gap-2 rounded-full border px-3.5 text-[13px] font-medium transition',
                        selected
                          ? 'border-[#1aa054] bg-[#e8f7ed] text-[#147940]'
                          : 'border-[#e1e5e2] bg-white text-[#455249] hover:border-[#c9d0cb]',
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
                  })
                )}
              </div>
              {showServiceSubType ? (
                <div className="mt-4 max-w-md">
                  <VendorField label="Services sub-type">
                    <VendorSelect
                      value={form.serviceSubTypeId || ''}
                      onChange={(event) => {
                        setForm((prev) => ({ ...prev, serviceSubTypeId: event.target.value }))
                      }}
                    >
                      <option value="">Select which service it appears under</option>
                      {serviceSubTypes.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </VendorSelect>
                  </VendorField>
                </div>
              ) : null}
              <button
                type="button"
                onClick={() => navigate('/admin/sla-models')}
                className="mt-3 text-[12.5px] font-medium text-[#1aa054] hover:underline border border-[#DBDEDB] rounded-full px-3 py-2"
              >
                ↗ Open default Vendor SLA.
              </button>
            </VendorCard>

            <AdminVendorSlaConfigs
              selectedModes={serviceModes.filter((mode) => allowedServiceModes.includes(mode))}
              value={slaConfigs}
              onChange={setSlaConfigs}
              modelDefaults={slaModelDefaults}
            />
            {slaError ? (
              <div className="mt-3 rounded-[10px] border border-[#f5c6c4] bg-[#fdebec] px-3 py-2 text-[12px] text-[#d64044]">
                {slaError}
              </div>
            ) : null}
          </>
        ) : null}

        {step === 6 ? (
          <AdminAddVendorReview
            form={form}
            branches={branches}
            users={users}
            vendorVisible={vendorVisible}
            vendorActive={vendorActive}
            onVendorVisibleChange={setVendorVisible}
            onVendorActiveChange={setVendorActive}
          />
        ) : null}
      </div>

      {createError ? (
        <div className="mt-4 rounded-[10px] border border-[#f5c6c4] bg-[#fdebec] px-3 py-2 text-[12px] text-[#d64044]">
          {createError}
        </div>
      ) : null}

      <div className="mt-12 flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={handleSaveDraft}
          disabled={stepBusy || stepLoading}
          className="inline-flex h-[36px] items-center rounded-full border border-[#d7e8dc] bg-white px-4 text-[13px] font-medium text-[#1aa054] hover:bg-[#f3faf5] disabled:opacity-60"
        >
          {createSaving && useRealCreateApi
            ? 'Saving…'
            : activateSaving && isEdit
              ? 'Saving…'
            : stepBusy && (step === 1 || step === 4)
              ? 'Saving…'
              : isEdit && step === 6
                ? 'Back to vendor'
                : 'Save Draft'}
        </button>
        {step === 6 ? (
          <AdminAddVendorActivateButton
            onClick={handleActivateVendor}
            disabled={stepBusy || stepLoading}
            label={
              createSaving || activateSaving
                ? 'Saving…'
                : isEdit
                  ? String(editAccountStatus || '').toUpperCase() === 'ACTIVE'
                    ? 'Save status'
                    : 'Activate vendor'
                  : 'Create Vendor'
            }
          />
        ) : (
          <button
            type="button"
            onClick={goNext}
            disabled={stepBusy || stepLoading}
            className="inline-flex h-[36px] items-center gap-1.5 rounded-full bg-[#1aa054] px-4 text-[13px] font-medium text-white hover:bg-[#158a47] disabled:opacity-60"
          >
            {stepBusy && (step === 1 || step === 4) ? 'Saving…' : `Continue → ${current.continueTo}`}
          </button>
        )}
      </div>

      <LeaveWizardModal
        open={leaveModalOpen}
        busy={leaveBusy || createSaving}
        isEdit={isEdit}
        onStay={handleStayEditing}
        onLeave={handleLeaveWithoutSaving}
        onSaveDraft={handleLeaveSaveDraft}
      />
    </div>
  )
}
