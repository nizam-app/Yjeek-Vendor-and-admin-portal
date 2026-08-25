import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronDown, ChevronLeft } from 'lucide-react'
import motoBikeIcon from '../../../assets/moto_bike.png'
import carIcon from '../../../assets/💨.png'
import uploadIcon from '../../../assets/⬆.png'
import imageUploadIcon from '../../../assets/🖼.png'
import { cn } from '../../../components/admin/cn'
import {
  AdminDatePicker,
  todayLocalIsoDate,
} from '../../../components/admin/AdminDatePicker'
import { AdminLeaveFormModal } from '../../../components/admin/AdminLeaveFormModal'
import { apiConfig, isAdminRealApiFeature } from '../../../api/config'
import { formatApiErrorMessage } from '../../../api/errors'
import {
  CHAMP_DOC_SLOT_META,
  mapAdminChampDetailToForm,
} from '../../../mappers/admin/mapAdminFleet'
import AdminMediaImage from '../../../components/admin/AdminMediaImage'
import { adminService } from '../../../services/adminService'
import { useAdminFormNavigationGuard } from '../../../hooks/useAdminFormNavigationGuard'
import {
  ADMIN_IMAGE_UPLOAD_ACCEPT,
  ADMIN_IMAGE_UPLOAD_MAX_BYTES,
  adminUploadService,
  validateAdminImageFile,
} from '../../../services/admin/uploadService'

const labelClass = 'mb-1.5 block text-[12px] font-medium text-[#7c8780]'
const inputClass =
  'box-border h-[40px] w-full rounded-[8px] border border-[rgba(0,0,0,0.1)] bg-white px-3 text-[13px] text-[#17231c] outline-none transition placeholder:text-[#9aa49d] focus:border-[#1aa054]'

const SPECIAL_ITEMS = [
  'Age-restricted 18+',
  'Pharmacy',
  'Fragile',
  'Vape & Tobacco',
  'Pharmacy / Rx',
  'Vape',
  'Jewelry',
  'Electronics',
  'High-value',
  'Frozen / Chilled',
]

function isSupplierActive(supplier) {
  const status = String(supplier?.status || '').trim().toLowerCase()
  if (status === 'active') return true
  return String(supplier?.statusRaw || supplier?.status || '').trim().toUpperCase() === 'ACTIVE'
}

function formatSupplierOption(supplier) {
  const name = String(supplier?.name || '').trim()
  const type = String(supplier?.type || '').trim()
  if (!name) return '—'
  if (type === 'In-house') return `${name} (In-house)`
  if (type === '3PL') return `${name} (3PL)`
  return name
}

function dedupeSuppliers(list) {
  const byId = new Map()
  for (const item of list) {
    if (!item?.id) continue
    byId.set(item.id, item)
  }
  return [...byId.values()]
}

const EMPTY_DOCS = Object.fromEntries(Object.keys(CHAMP_DOC_SLOT_META).map((key) => [key, '']))

const EMPTY_CHAMP_FORM = {
  fullName: '',
  phone: '',
  email: '',
  nationality: '',
  supplierId: '',
  supplier: '',
  cpr: '',
  cprExpiry: '',
  birthDate: '',
  passport: '',
  passportExpiry: '',
  visa: '',
  visaExpiry: '',
  insuranceExpiry: '',
  licenseExpiry: '',
  plate: '',
  make: '',
  model: '',
  color: '',
  year: '',
  vehicleType: 'Bike',
  specialItems: false,
  dailyLimit: '',
  orderLimit: '',
  onLimit: '',
}

function serializeChampDraft(form, docs, selectedSlugs, specialTypes) {
  return JSON.stringify({
    form,
    docs,
    selectedSlugs: [...(selectedSlugs || [])].sort(),
    specialTypes: [...(specialTypes || [])].sort(),
  })
}

function Field({ label, children, className }) {
  return (
    <label className={cn('block min-w-0', className)}>
      <span className={labelClass}>{label}</span>
      {children}
    </label>
  )
}

function Select({ children, className, value, ...props }) {
  const isPlaceholder = value === '' || value == null
  return (
    <div className="relative">
      <select
        className={cn(
          inputClass,
          'appearance-none pr-9',
          isPlaceholder && 'text-[#9aa49d]',
          className,
        )}
        value={value}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        size={14}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#7c8780]"
      />
    </div>
  )
}

function UploadBox({ label, variant = 'file', imageUrl = '', category = 'documents', onUrlChange }) {
  const inputRef = useRef(null)
  const localPreviewRef = useRef(null)
  const [localPreviewUrl, setLocalPreviewUrl] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState(null)
  const iconSrc = variant === 'image' ? imageUploadIcon : uploadIcon

  const revokeLocalPreview = () => {
    if (localPreviewRef.current) {
      URL.revokeObjectURL(localPreviewRef.current)
      localPreviewRef.current = null
    }
    setLocalPreviewUrl('')
  }

  useEffect(
    () => () => {
      if (localPreviewRef.current) {
        URL.revokeObjectURL(localPreviewRef.current)
        localPreviewRef.current = null
      }
    },
    [],
  )

  const handlePick = () => {
    if (isUploading) return
    inputRef.current?.click()
  }

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    setUploadError(null)

    try {
      validateAdminImageFile(file, { maxBytes: ADMIN_IMAGE_UPLOAD_MAX_BYTES })
    } catch (err) {
      setUploadError(err)
      return
    }

    revokeLocalPreview()
    const objectUrl = URL.createObjectURL(file)
    localPreviewRef.current = objectUrl
    setLocalPreviewUrl(objectUrl)

    setIsUploading(true)
    try {
      const result = await adminUploadService.uploadFleetImage(file, {
        feature: 'fleet',
        category,
      })
      const url = result?.data?.url
      if (!url) {
        throw new Error('Upload succeeded but no image URL was returned.')
      }
      onUrlChange?.(url)
    } catch (err) {
      setUploadError(err)
    } finally {
      setIsUploading(false)
    }
  }

  const hasLocalPreview = Boolean(localPreviewUrl)
  const hasRemoteImage = Boolean(String(imageUrl || '').trim())
  const hasImage = hasLocalPreview || hasRemoteImage

  return (
    <div className="flex w-[140px] shrink-0 flex-col gap-1">
      <input
        ref={inputRef}
        type="file"
        accept={ADMIN_IMAGE_UPLOAD_ACCEPT}
        className="hidden"
        onChange={handleFileChange}
      />
      <button
        type="button"
        onClick={handlePick}
        disabled={isUploading}
        className={cn(
          'relative flex h-[110px] w-full flex-col items-center justify-center gap-1.5 overflow-hidden rounded-[10px] border border-dashed border-[#d5dbd7] bg-[#f6f8f6] transition hover:border-[#1aa054] hover:bg-[#eef7f1]',
          isUploading && 'cursor-wait opacity-80',
        )}
      >
        {hasLocalPreview ? (
          <img src={localPreviewUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : hasRemoteImage ? (
          <AdminMediaImage
            src={imageUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            fallbackClassName="absolute inset-0 h-full w-full"
          />
        ) : null}
        <span
          className={cn(
            'relative z-[1] flex flex-col items-center gap-1.5 px-2',
            hasImage && 'rounded-md bg-black/45 px-2 py-1.5 text-white',
          )}
        >
          {!hasImage ? <img src={iconSrc} alt="" className="h-5 w-5 object-contain" /> : null}
          <span className="text-center text-[12px] font-bold leading-tight">{label}</span>
          <span className={cn('text-[12px] font-medium', hasImage ? 'text-white' : 'text-[#1aa054]')}>
            {isUploading ? 'Uploading…' : hasImage ? 'Replace' : 'Upload'}
          </span>
        </span>
      </button>
      {uploadError ? (
        <p className="text-[11px] leading-snug text-[#b42318]">
          {formatApiErrorMessage(uploadError, 'Upload failed.')}
        </p>
      ) : null}
    </div>
  )
}

function Chip({ label, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex h-[32px] items-center rounded-full border px-3 text-[12px] font-medium transition',
        selected
          ? 'border-[#1aa054] bg-[#e8f7ed] text-[#147940]'
          : 'border-[#e4e8e4] bg-white text-[#59655e] hover:bg-[#f6f8f6]',
      )}
    >
      {label}
    </button>
  )
}

function Card({ title, children }) {
  return (
    <section className="rounded-[14px] border border-[#eceeec] bg-white p-5 shadow-[0_1px_2px_rgba(20,40,28,.03)] max-[700px]:p-4">
      {title ? <h3 className="mb-4 text-[15px] font-bold text-[#17231c]">{title}</h3> : null}
      {children}
    </section>
  )
}

function DocSection({ title, slots, docs, onDocChange }) {
  return (
    <Card title={title}>
      <div className="flex flex-wrap gap-3">
        {slots.map((slotKey) => {
          const meta = CHAMP_DOC_SLOT_META[slotKey]
          if (!meta) return null
          return (
            <UploadBox
              key={slotKey}
              label={meta.label}
              variant={meta.kind === 'document' ? 'file' : 'image'}
              category={meta.category}
              imageUrl={docs[slotKey] || ''}
              onUrlChange={(url) => onDocChange(slotKey, url)}
            />
          )
        })}
      </div>
    </Card>
  )
}

export default function AdminAddChampPage() {
  const navigate = useNavigate()
  const { champId } = useParams()
  const isEdit = Boolean(champId)
  const useRealFleet = isAdminRealApiFeature('fleet') || !apiConfig.adminUseMockApi
  const goBack = () => {
    if (isEdit) {
      navigate(`/admin/fleet/${encodeURIComponent(champId)}`)
      return
    }
    navigate('/admin/fleet')
  }

  const [form, setForm] = useState(EMPTY_CHAMP_FORM)

  const [docs, setDocs] = useState(() => ({ ...EMPTY_DOCS }))
  const [specialTypes, setSpecialTypes] = useState([])
  const [storeTypeOptions, setStoreTypeOptions] = useState([])
  /** Selected store-type slugs (Rule 9). */
  const [selectedSlugs, setSelectedSlugs] = useState([])
  const [storeTypesLoading, setStoreTypesLoading] = useState(false)
  const [storeTypesError, setStoreTypesError] = useState('')
  const [suppliers, setSuppliers] = useState([])
  const [suppliersError, setSuppliersError] = useState('')
  const [saving, setSaving] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [createdResult, setCreatedResult] = useState(null)
  const [loadingEdit, setLoadingEdit] = useState(isEdit)
  const [loadError, setLoadError] = useState('')
  const [editBaseline, setEditBaseline] = useState(null)
  const createBaseline = useMemo(
    () => serializeChampDraft(EMPTY_CHAMP_FORM, EMPTY_DOCS, [], []),
    [],
  )
  const draftSnapshot = useMemo(
    () => serializeChampDraft(form, docs, selectedSlugs, specialTypes),
    [form, docs, selectedSlugs, specialTypes],
  )
  const isDirty = isEdit
    ? editBaseline != null && draftSnapshot !== editBaseline
    : draftSnapshot !== createBaseline

  const {
    allowLeave,
    requestLeave,
    leaveModalOpen,
    handleStayEditing,
    handleLeaveWithoutSaving,
  } = useAdminFormNavigationGuard({
    isDirty,
    enabled: !loadingEdit,
  })

  const handleBack = () => requestLeave(goBack)

  const update = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))

  const toggleChip = (list, setList, value) => {
    setList((prev) => (prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]))
  }

  const onDocChange = (slotKey, url) => {
    setDocs((prev) => ({ ...prev, [slotKey]: url }))
  }

  useEffect(() => {
    if (!useRealFleet) return undefined

    let cancelled = false
    setStoreTypesLoading(true)
    setStoreTypesError('')

    ;(async () => {
      try {
        const typesRes = await adminService.listAdminStoreTypesForChampForm()
        if (cancelled) return
        const types = typesRes?.data?.storeTypes || []
        setStoreTypeOptions(types)
        if (!types.length) {
          setStoreTypesError('No store types returned from Store Management.')
        }
      } catch (err) {
        if (cancelled) return
        setStoreTypeOptions([])
        setStoreTypesError(formatApiErrorMessage(err, 'Failed to load store types from Store Management.'))
      } finally {
        if (!cancelled) setStoreTypesLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [useRealFleet])

  useEffect(() => {
    if (!useRealFleet) return undefined

    let cancelled = false
    ;(async () => {
      try {
        const result = await adminService.listAdminFleetSuppliers()
        if (cancelled) return
        const list = dedupeSuppliers(result?.data?.suppliers || [])
        setSuppliers(list)
        const activeCount = list.filter(isSupplierActive).length
        setSuppliersError(
          activeCount
            ? ''
            : list.length
              ? 'No active suppliers found. Activate a supplier first.'
              : 'No suppliers found. Create a supplier first.',
        )
      } catch (err) {
        if (cancelled) return
        setSuppliersError(formatApiErrorMessage(err, 'Failed to load suppliers.'))
      }
    })()

    return () => {
      cancelled = true
    }
  }, [useRealFleet, isEdit])

  useEffect(() => {
    if (!isEdit || !champId || !useRealFleet) {
      setLoadingEdit(false)
      return undefined
    }

    let cancelled = false
    setLoadingEdit(true)
    setLoadError('')

    ;(async () => {
      try {
        const [detailResult, docsResult] = await Promise.all([
          adminService.getChampDetail(champId),
          adminService.listChampDocuments(champId).catch(() => ({ data: null })),
        ])
        if (cancelled) return
        const mapped = mapAdminChampDetailToForm(detailResult?.data || detailResult, docsResult?.data)
        const {
          selectedSlugs: nextSelectedSlugs,
          storeTypes: nextStoreTypes,
          specialTypes: nextSpecialTypes,
          docs: nextDocs,
          ...nextForm
        } = mapped
        setForm((prev) => ({ ...prev, ...nextForm }))
        const hydratedSlugs = Array.isArray(nextSelectedSlugs)
          ? nextSelectedSlugs
          : Array.isArray(nextStoreTypes)
            ? nextStoreTypes
            : []
        setSelectedSlugs(hydratedSlugs)
        if (Array.isArray(nextSpecialTypes) && nextSpecialTypes.length) {
          setSpecialTypes(nextSpecialTypes)
        }
        if (nextDocs && typeof nextDocs === 'object') {
          setDocs((prev) => ({ ...prev, ...nextDocs }))
        }
        const hydratedSlugsFinal = Array.isArray(nextSelectedSlugs)
          ? nextSelectedSlugs
          : Array.isArray(nextStoreTypes)
            ? nextStoreTypes
            : []
        const specialFinal = Array.isArray(nextSpecialTypes) && nextSpecialTypes.length
          ? nextSpecialTypes
          : []
        setEditBaseline(
          serializeChampDraft(
            { ...EMPTY_CHAMP_FORM, ...nextForm },
            nextDocs && typeof nextDocs === 'object' ? { ...EMPTY_DOCS, ...nextDocs } : EMPTY_DOCS,
            hydratedSlugsFinal,
            specialFinal,
          ),
        )
      } catch (err) {
        if (!cancelled) {
          setLoadError(formatApiErrorMessage(err, 'Failed to load champ for edit.'))
        }
      } finally {
        if (!cancelled) setLoadingEdit(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [isEdit, champId, useRealFleet])

  const supplierOptions = useMemo(() => {
    const active = suppliers.filter(isSupplierActive)
    if (isEdit && form.supplierId) {
      const current = suppliers.find((item) => item.id === form.supplierId)
      if (current && !active.some((item) => item.id === current.id)) {
        return [current, ...active]
      }
    }
    return active
  }, [suppliers, isEdit, form.supplierId])

  const handleSupplierChange = (e) => {
    const value = e.target.value
    const match = supplierOptions.find((s) => s.id === value)
    setForm((prev) => ({
      ...prev,
      supplierId: value,
      supplier: match?.name || prev.supplier,
    }))
  }

  async function handleSave() {
    setSubmitError('')
    setCreatedResult(null)

    if (!useRealFleet) {
      goBack()
      return
    }

    if (storeTypesError || !storeTypeOptions.length) {
      setSubmitError(storeTypesError || 'Store types are required before saving a champ.')
      return
    }

    setSaving(true)
    try {
      const payload = {
        ...form,
        selectedSlugs,
        storeTypes: selectedSlugs,
        allowedCategories: selectedSlugs,
        specialTypes,
        specialItemTypes: specialTypes,
        docs,
      }

      if (isEdit) {
        await adminService.updateAdminFleetChamp(champId, payload)
        allowLeave()
        navigate(`/admin/fleet/${encodeURIComponent(champId)}`)
        return
      }

      const result = await adminService.createAdminFleetChamp(payload)
      const created = result?.data
      setCreatedResult(created)

      if (created?.temporaryPassword) {
        allowLeave()
        return
      }

      const id = created?.id
      allowLeave()
      navigate(id ? `/admin/fleet/${encodeURIComponent(id)}` : '/admin/fleet')
    } catch (err) {
      setSubmitError(
        formatApiErrorMessage(err, isEdit ? 'Failed to update champ.' : 'Failed to create champ.'),
      )
    } finally {
      setSaving(false)
    }
  }

  const goToCreatedChamp = () => {
    const id = createdResult?.id
    allowLeave()
    navigate(id ? `/admin/fleet/${encodeURIComponent(id)}` : '/admin/fleet')
  }

  return (
    <div className="px-5 pb-10 pt-4 max-[700px]:px-3">
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex h-[34px] shrink-0 items-center gap-1 rounded-full border border-[#e4e8e4] bg-white px-3 text-[13px] font-medium text-[#1C211F] shadow-[0_1px_2px_rgba(20,40,28,.04)] hover:bg-[#f6f8f6]"
        >
          <ChevronLeft size={15} strokeWidth={2.2} />
          Champs
        </button>
        <h2 className="text-[20px] font-bold tracking-[-0.02em] text-[#17231c]">
          {isEdit ? 'Edit champ' : 'Add champ'}
        </h2>
      </div>

      {loadError ? (
        <div className="mb-4 rounded-[12px] border border-[#f0c9c6] bg-[#fff5f4] px-4 py-3 text-[13px] text-[#b42318]">
          {loadError}
        </div>
      ) : null}

      {loadingEdit ? (
        <p className="mb-4 text-[13px] text-[#7c8780]">Loading champ…</p>
      ) : null}

      {submitError ? (
        <div className="mb-4 rounded-[12px] border border-[#f0c9c6] bg-[#fff5f4] px-4 py-3 text-[13px] text-[#b42318]">
          {submitError}
        </div>
      ) : null}

      {suppliersError && useRealFleet ? (
        <div className="mb-4 rounded-[12px] border border-[#f0e0b2] bg-[#fffbeb] px-4 py-3 text-[13px] text-[#92400e]">
          {suppliersError}
        </div>
      ) : null}

      {storeTypesError && useRealFleet ? (
        <div className="mb-4 rounded-[12px] border border-[#f0c9c6] bg-[#fff5f4] px-4 py-3 text-[13px] text-[#b42318]">
          {storeTypesError}
        </div>
      ) : null}

      {createdResult?.temporaryPassword ? (
        <div className="mb-4 rounded-[12px] border border-[#b7e4c7] bg-[#f0faf4] px-4 py-3 text-[13px] text-[#147940]">
          <p className="font-bold">
            Champ created{createdResult.displayCode ? ` (${createdResult.displayCode})` : ''}.
          </p>
          <p className="mt-1">
            Temporary password:{' '}
            <span className="font-mono font-bold tracking-wide">{createdResult.temporaryPassword}</span>
          </p>
          {createdResult.passwordResetRequired ? (
            <p className="mt-1 text-[#455249]">Password reset required on first login.</p>
          ) : null}
          <button
            type="button"
            onClick={goToCreatedChamp}
            className="mt-3 inline-flex h-[34px] items-center rounded-full bg-[#1aa054] px-4 text-[12px] font-bold text-white hover:bg-[#158a47]"
          >
            Open champ profile
          </button>
        </div>
      ) : null}

      <div className="space-y-4">
        <Card title="Personal">
          <div className="grid grid-cols-2 gap-3 max-[700px]:grid-cols-1">
            <Field label="Full name">
              <input
                className={inputClass}
                value={form.fullName}
                onChange={update('fullName')}
                placeholder={isEdit ? undefined : 'Khalid Ahmed'}
              />
            </Field>
            <Field label="Phone">
              <input
                className={inputClass}
                value={form.phone}
                onChange={update('phone')}
                placeholder={isEdit ? undefined : '+973 3xxx xxxx'}
              />
            </Field>
            <Field label="Email">
              <input
                className={inputClass}
                value={form.email}
                onChange={update('email')}
                placeholder={isEdit ? undefined : 'champ@email.com'}
              />
            </Field>
            <Field label="Nationality">
              <Select value={form.nationality} onChange={update('nationality')}>
                <option value="" disabled>
                  Select nationality
                </option>
                <option value="Bahraini">Bahraini</option>
                <option value="Indian">Indian</option>
                <option value="Pakistani">Pakistani</option>
                <option value="Filipino">Filipino</option>
                <option value="Other">Other</option>
              </Select>
            </Field>
          </div>

          <div className="mt-3 max-[700px]:grid-cols-1">
            <Field label="Supplier">
              <Select
                value={form.supplierId}
                onChange={handleSupplierChange}
                disabled={!useRealFleet || !supplierOptions.length}
              >
                <option value="" disabled>
                  {!useRealFleet
                    ? 'Real fleet API required'
                    : supplierOptions.length
                      ? 'Select supplier'
                      : 'No active suppliers'}
                </option>
                {supplierOptions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {formatSupplierOption(s)}
                    {!isSupplierActive(s) ? ' (inactive)' : ''}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-3 max-[900px]:grid-cols-2 max-[600px]:grid-cols-1">
            <Field label="CPR number">
              <input
                className={inputClass}
                value={form.cpr}
                onChange={update('cpr')}
                placeholder="CPR number"
              />
            </Field>
            <Field label="CPR Expiry date">
              <AdminDatePicker
                value={form.cprExpiry}
                onChange={(value) => setForm((prev) => ({ ...prev, cprExpiry: value }))}
                min={null}
                placeholder="DD/MM/YYYY"
              />
            </Field>
            <Field label="Birth date">
              <AdminDatePicker
                value={form.birthDate}
                onChange={(value) => setForm((prev) => ({ ...prev, birthDate: value }))}
                min={null}
                max={todayLocalIsoDate()}
                placeholder="DD/MM/YYYY"
              />
            </Field>
          </div>

          <div className="mt-3 grid grid-cols-4 gap-3 max-[1100px]:grid-cols-2 max-[600px]:grid-cols-1">
            <Field label="Passport number">
              <input
                className={inputClass}
                value={form.passport}
                onChange={update('passport')}
                placeholder={isEdit ? undefined : 'Passport number'}
              />
            </Field>
            <Field label="Passport Expiry date">
              <AdminDatePicker
                value={form.passportExpiry}
                onChange={(value) => setForm((prev) => ({ ...prev, passportExpiry: value }))}
                min={null}
                placeholder="DD/MM/YYYY"
              />
            </Field>
            <Field label="Visa number">
              <input
                className={inputClass}
                value={form.visa}
                onChange={update('visa')}
                placeholder={isEdit ? undefined : 'Visa number'}
              />
            </Field>
            <Field label="Visa Expiry date">
              <AdminDatePicker
                value={form.visaExpiry}
                onChange={(value) => setForm((prev) => ({ ...prev, visaExpiry: value }))}
                min={null}
                placeholder="DD/MM/YYYY"
              />
            </Field>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3 max-[700px]:grid-cols-1">
            <Field label="Vehicle insurance Expiry date">
              <AdminDatePicker
                value={form.insuranceExpiry}
                onChange={(value) => setForm((prev) => ({ ...prev, insuranceExpiry: value }))}
                min={null}
                placeholder="DD/MM/YYYY"
              />
            </Field>
            <Field label="Driving license Expiry date">
              <AdminDatePicker
                value={form.licenseExpiry}
                onChange={(value) => setForm((prev) => ({ ...prev, licenseExpiry: value }))}
                min={null}
                placeholder="DD/MM/YYYY"
              />
            </Field>
          </div>

          <div className="mt-3 grid grid-cols-5 gap-3 max-[1100px]:grid-cols-3 max-[700px]:grid-cols-2 max-[480px]:grid-cols-1">
            <Field label="Plate number">
              <input
                className={inputClass}
                value={form.plate}
                onChange={update('plate')}
                placeholder={isEdit ? undefined : '12345'}
              />
            </Field>
            <Field label="Make">
              <input
                className={inputClass}
                value={form.make}
                onChange={update('make')}
                placeholder={isEdit ? undefined : 'Honda'}
              />
            </Field>
            <Field label="Model">
              <input
                className={inputClass}
                value={form.model}
                onChange={update('model')}
                placeholder={isEdit ? undefined : 'PCX'}
              />
            </Field>
            <Field label="Color">
              <input
                className={inputClass}
                value={form.color}
                onChange={update('color')}
                placeholder={isEdit ? undefined : 'Red'}
              />
            </Field>
            <Field label="Year of make">
              <input
                className={inputClass}
                value={form.year}
                onChange={update('year')}
                placeholder={isEdit ? undefined : '2023'}
              />
            </Field>
          </div>
        </Card>

        <Card title="Vehicle type">
          <div className="inline-flex items-center gap-2 rounded-[12px] bg-[#f3f5f3] p-1.5 w-[554px] max-[700px]:w-full">
            {[
              { id: 'Bike', icon: <img src={motoBikeIcon} alt="" className="h-4 w-4 object-contain" /> },
              { id: 'Car', icon: <img src={carIcon} alt="" className="h-4 w-4 object-contain" /> },
            ].map(({ id, icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, vehicleType: id }))}
                className={cn(
                  'inline-flex h-[40px] items-center gap-2 rounded-[10px] w-full px-4 text-[13px] font-bold transition',
                  form.vehicleType === id
                    ? 'bg-white text-[#17231c] shadow-[0_1px_3px_rgba(20,40,28,.12)]'
                    : 'text-[#69756d] hover:text-[#455249]',
                )}
              >
                {icon}
                {id}
              </button>
            ))}
          </div>
        </Card>

        <DocSection title="Personal picture" slots={['personalPicture']} docs={docs} onDocChange={onDocChange} />
        <DocSection title="CPR" slots={['cprFront', 'cprBack']} docs={docs} onDocChange={onDocChange} />
        <DocSection
          title="Passport"
          slots={['passportFront', 'passportBack']}
          docs={docs}
          onDocChange={onDocChange}
        />
        <DocSection title="Visa" slots={['visaFront', 'visaBack']} docs={docs} onDocChange={onDocChange} />
        <DocSection
          title="Driving license"
          slots={['licenseFront', 'licenseBack']}
          docs={docs}
          onDocChange={onDocChange}
        />
        <DocSection
          title="Vehicle registration"
          slots={['regFront', 'regBack', 'vehiclePhoto1', 'vehiclePhoto2', 'vehiclePhoto3']}
          docs={docs}
          onDocChange={onDocChange}
        />
        <DocSection title="Vehicle insurance" slots={['insurance']} docs={docs} onDocChange={onDocChange} />

        <Card title="Delivery permissions & limits">
          <div className="mb-5 flex items-center w-fit gap-3 rounded-[12px] bg-[#f3f5f3] px-4 py-3">
            <div>
              <p className="text-[13px] font-bold text-[#17231c] mb-1">Can deliver special items</p>
              <p className="text-[12px] font-medium text-[#7c8780]">
                Alcohol, age-restricted, pharmacy, fragile or high-value items
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={form.specialItems}
              onClick={() => setForm((prev) => ({ ...prev, specialItems: !prev.specialItems }))}
              className={cn(
                'relative h-[28px] w-[48px] shrink-0 rounded-full transition',
                form.specialItems ? 'bg-[#1aa054]' : 'bg-[#d5dbd7]',
              )}
            >
              <span
                className={cn(
                  'absolute top-[3px] h-[22px] w-[22px] rounded-full bg-white shadow transition',
                  form.specialItems ? 'left-[23px]' : 'left-[3px]',
                )}
              />
            </button>
          </div>

          <div className="mb-5">
            <p className="mb-2.5 text-[12px] font-medium text-[#7c8780]">Special item types allowed</p>
            <div className="flex flex-wrap gap-2">
              {SPECIAL_ITEMS.map((item) => (
                <Chip
                  key={item}
                  label={item}
                  selected={specialTypes.includes(item)}
                  onClick={() => toggleChip(specialTypes, setSpecialTypes, item)}
                />
              ))}
            </div>
          </div>

          <div className="mb-5">
            <p className="mb-2.5 text-[12px] font-medium text-[#7c8780]">Allowed store types</p>
            {storeTypesLoading ? (
              <p className="text-[12px] text-[#7c8780]">Loading store types…</p>
            ) : storeTypeOptions.length ? (
              <div className="flex flex-wrap gap-2">
                {storeTypeOptions.map((item) => (
                  <Chip
                    key={item.slug}
                    label={item.name}
                    selected={selectedSlugs.includes(item.slug)}
                    onClick={() => toggleChip(selectedSlugs, setSelectedSlugs, item.slug)}
                  />
                ))}
              </div>
            ) : (
              <p className="text-[12px] text-[#b42318]">
                {storeTypesError || 'No store types available from Store Management.'}
              </p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3 max-[900px]:grid-cols-1">
            <Field label="Daily cash limit (COD)">
              <input
                className={inputClass}
                value={form.dailyLimit}
                onChange={update('dailyLimit')}
                placeholder={isEdit ? undefined : 'BHD 50.000'}
              />
            </Field>
            <Field label="Per-order cash limit">
              <input
                className={inputClass}
                value={form.orderLimit}
                onChange={update('orderLimit')}
                placeholder={isEdit ? undefined : 'BHD 20.000'}
              />
            </Field>
            <Field label="On reaching limit">
              <Select value={form.onLimit} onChange={update('onLimit')}>
                <option value="" disabled>
                  Select action
                </option>
                <option value="Stop cash orders">Stop cash orders</option>
                <option value="Notify only">Notify only</option>
                <option value="Require approval">Require approval</option>
              </Select>
            </Field>
          </div>
        </Card>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={handleBack}
          className="text-[13px] font-semibold hover:text-[#455249]  py-2.5 px-3 rounded-full bg-white text-black"
        >
          Cancel
        </button>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="inline-flex h-[36px] items-center rounded-full border border-[#1aa054] bg-white px-4 text-[13px] font-bold text-[#1aa054] hover:bg-[#f3faf5]"
          >
            Save draft
          </button>
          <button
            type="button"
            disabled={saving || loadingEdit || Boolean(createdResult?.id) || Boolean(loadError)}
            onClick={handleSave}
            className="inline-flex h-[36px] items-center rounded-full bg-[#1aa054] px-4 text-[13px] font-bold text-white hover:bg-[#158a47] disabled:opacity-60"
          >
            {saving
              ? isEdit
                ? 'Saving…'
                : 'Creating…'
              : isEdit
                ? 'Save changes'
                : 'Create champ'}
          </button>
        </div>
      </div>

      <AdminLeaveFormModal
        open={leaveModalOpen}
        busy={saving}
        title={isEdit ? 'Leave champ setup?' : 'Leave add champ?'}
        message={
          isEdit
            ? 'You have unsaved changes on this champ. Keep editing or leave without saving.'
            : 'You have unsaved progress on this champ form. Keep editing or leave without saving.'
        }
        onStay={handleStayEditing}
        onLeave={handleLeaveWithoutSaving}
      />
    </div>
  )
}
