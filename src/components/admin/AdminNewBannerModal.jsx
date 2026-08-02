import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, Upload } from 'lucide-react'
import { formatApiErrorMessage } from '../../api/errors'
import { resolveAdminMediaUrl } from '../../mappers/admin/mapAdminUpload'
import {
  ADMIN_IMAGE_UPLOAD_ACCEPT,
  ADMIN_IMAGE_UPLOAD_MAX_BYTES,
  adminUploadService,
  validateAdminImageFile,
} from '../../services/admin/uploadService'
import { cn } from './cn'

const DEFAULT_BANNER_TYPES = [
  { id: 'static', label: 'Static banner' },
  { id: 'scroll', label: 'Scroll / carousel' },
  { id: 'popup', label: 'Pop-up ad' },
]

const DEFAULT_TAP_ACTIONS = ['Open store', 'Open category', 'Open URL', 'No action']
const DEFAULT_TARGETS = ['Green Kitchen', 'All stores', 'Pharmacy near you', 'Custom']
export const BANNER_PLACEMENTS = [
  'Home top · scroll banner',
  'Between sections',
  'Below a section',
  'Pop-up ad (on open)',
  'Store page top',
  'Category top · scroll',
]
const DEFAULT_AUDIENCES = ['All customers', 'New customers', 'Returning customers', 'VIP']

const TAP_ACTION_TO_API = {
  'Open store': 'OPEN_STORE',
  'Open category': 'OPEN_CATEGORY',
  'Open URL': 'OPEN_URL',
  'No action': 'NONE',
}

const labelClass = 'block text-[12px] font-semibold leading-[15px] text-[#6B736E]'
const inputClass =
  'box-border h-[38px] w-full rounded-[10px] border-[1.2px] border-[#E3E6E3] bg-white px-[14px] text-[13px] font-medium leading-4 text-[#1C211F] outline-none transition focus:border-[#2E9E4D]'

function FieldLabel({ children }) {
  return <span className={labelClass}>{children}</span>
}

function TextInput({ value, onChange, disabled }) {
  return (
    <input
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      className={cn(inputClass, disabled && 'opacity-60')}
    />
  )
}

function SelectField({ value, onChange, options, disabled }) {
  const normalized = options.map((option) =>
    typeof option === 'string'
      ? { value: option, label: option }
      : { value: option.value ?? option.id, label: option.label ?? option.value ?? option.id },
  )

  return (
    <div className="relative w-full">
      <select
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className={cn(inputClass, 'appearance-none pr-9', disabled && 'opacity-60')}
      >
        {normalized.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={14}
        className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[#6B736E]"
      />
    </div>
  )
}

function DateField({ value, onChange, disabled }) {
  return (
    <input
      type="date"
      value={value || ''}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      className={cn(inputClass, disabled && 'opacity-60')}
    />
  )
}

function normalizePlacement(value, placements = BANNER_PLACEMENTS) {
  if (!value) return placements[0] || ''
  const cleaned = String(value).replace(/—/g, '·').replace(/\s+/g, ' ').trim()
  const match = placements.find((item) => {
    const label = typeof item === 'string' ? item : item.label
    return String(label || '')
      .toLowerCase()
      .replace(/—/g, '·') === cleaned.toLowerCase()
  })
  if (!match) return cleaned
  return typeof match === 'string' ? match : match.label || match.value || cleaned
}

function buildBannerForm({
  placement = '',
  placementKey = '',
  placements = BANNER_PLACEMENTS,
  initial = null,
} = {}) {
  const placementLabels = placements.map((item) =>
    typeof item === 'string' ? item : item.label || item.value || item.id,
  )

  if (initial && typeof initial === 'object') {
    return {
      type: initial.type || 'static',
      title: initial.title || '',
      subtitle: initial.subtitle || '',
      imageUrl: initial.imageUrl || '',
      tapAction: initial.tapAction || DEFAULT_TAP_ACTIONS[0],
      target: initial.target || '',
      targetId: initial.targetId || '',
      placement: normalizePlacement(initial.placement || placement, placementLabels),
      placementKey: initial.placementKey || placementKey || '',
      start: initial.start || '2026-03-22',
      end: initial.end || '2026-03-30',
      audience: initial.audience || DEFAULT_AUDIENCES[0],
      active: initial.active !== false,
    }
  }

  return {
    type: 'static',
    title: 'Ramadan offers',
    subtitle: 'Up to 30% off',
    imageUrl: '',
    tapAction: DEFAULT_TAP_ACTIONS[0],
    target: '',
    targetId: '',
    placement: normalizePlacement(placement, placementLabels),
    placementKey: placementKey || '',
    start: '2026-03-22',
    end: '2026-03-30',
    audience: DEFAULT_AUDIENCES[0],
    active: true,
  }
}

/**
 * Reusable create/edit modal for banners & ads.
 */
export default function AdminNewBannerModal({
  open,
  onClose,
  onSubmit,
  placement = '',
  placementKey = '',
  placements = BANNER_PLACEMENTS,
  tapActions = DEFAULT_TAP_ACTIONS,
  audiences = DEFAULT_AUDIENCES,
  targets = DEFAULT_TARGETS,
  targetsLoading = false,
  onTapActionChange,
  initialBanner = null,
  mode = 'create',
  title,
  description,
  submitLabel,
  isSubmitting = false,
  error = null,
}) {
  const fileInputRef = useRef(null)
  const localPreviewRef = useRef(null)
  const [form, setForm] = useState(() =>
    buildBannerForm({ placement, placementKey, placements, initial: initialBanner }),
  )
  const [localPreviewUrl, setLocalPreviewUrl] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState(null)

  const revokeLocalPreview = () => {
    if (localPreviewRef.current) {
      URL.revokeObjectURL(localPreviewRef.current)
      localPreviewRef.current = null
    }
    setLocalPreviewUrl(null)
  }

  useEffect(() => {
    if (open) {
      revokeLocalPreview()
      setUploadError(null)
      setIsUploading(false)
      setForm(buildBannerForm({ placement, placementKey, placements, initial: initialBanner }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset only when modal opens / seed changes
  }, [open, placement, placementKey, placements, initialBanner])

  useEffect(() => {
    if (!open) return undefined
    const onKeyDown = (event) => {
      if (event.key === 'Escape' && !isSubmitting && !isUploading) onClose?.()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose, isSubmitting, isUploading])

  useEffect(() => {
    return () => {
      if (localPreviewRef.current) {
        URL.revokeObjectURL(localPreviewRef.current)
        localPreviewRef.current = null
      }
    }
  }, [])

  const placementOptions = useMemo(() => {
    const labels = placements.map((item) =>
      typeof item === 'string'
        ? { value: item, label: item }
        : {
            value: item.label || item.id || item.key,
            label: item.label || item.id || item.key,
            key: item.id || item.key,
          },
    )
    if (form.placement && !labels.some((item) => item.value === form.placement)) {
      return [{ value: form.placement, label: form.placement }, ...labels]
    }
    return labels
  }, [placements, form.placement])

  const targetOptions = useMemo(() => {
    const list = (targets || []).map((item) =>
      typeof item === 'string'
        ? { value: item, label: item }
        : { value: item.id || item.value || item.label, label: item.label || item.id },
    )
    if (form.target && !list.some((item) => item.value === form.target || item.label === form.target)) {
      return [{ value: form.targetId || form.target, label: form.target }, ...list]
    }
    return list.length > 0 ? list : DEFAULT_TARGETS.map((item) => ({ value: item, label: item }))
  }, [targets, form.target, form.targetId])

  if (!open) return null

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleTapActionChange = (value) => {
    setField('tapAction', value)
    onTapActionChange?.(TAP_ACTION_TO_API[value] || value)
  }

  const handlePlacementChange = (value) => {
    const match = placements.find((item) => {
      if (typeof item === 'string') return item === value
      return item.label === value || item.id === value || item.key === value
    })
    setForm((prev) => ({
      ...prev,
      placement: value,
      placementKey:
        (match && typeof match === 'object' ? match.id || match.key : '') || prev.placementKey,
    }))
  }

  const handleTargetChange = (value) => {
    const match = targetOptions.find((item) => item.value === value || item.label === value)
    setForm((prev) => ({
      ...prev,
      target: match?.label || value,
      targetId: match?.value || value,
    }))
  }

  const handlePickImage = () => {
    if (isSubmitting || isUploading) return
    fileInputRef.current?.click()
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
      const result = await adminUploadService.uploadImage(file, { feature: 'ui-editor' })
      const url = result?.data?.url
      if (!url) {
        throw new Error('Upload succeeded but no image URL was returned.')
      }
      // Keep blob preview until remote URL is confirmed; form stores server URL only.
      setForm((prev) => ({ ...prev, imageUrl: url }))
    } catch (err) {
      setUploadError(err)
      // Keep local preview so the user can see what they chose and retry.
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemoteImageLoad = () => {
    // Remote image is visible — safe to drop the temporary blob preview.
    if (form.imageUrl && localPreviewRef.current) {
      revokeLocalPreview()
    }
  }

  const handleRemoteImageError = () => {
    // Keep blob preview visible if the remote URL fails to render.
  }

  const handleSubmit = async () => {
    if (isSubmitting || isUploading) return
    await onSubmit?.(form)
  }

  const busy = isSubmitting || isUploading
  const remoteDisplayUrl = resolveAdminMediaUrl(form.imageUrl)
  const displayImage = localPreviewUrl || remoteDisplayUrl || ''
  const resolvedTitle =
    title || (mode === 'edit' ? 'Edit banner / ad' : 'New banner / ad')
  const resolvedDescription =
    description ||
    (mode === 'edit'
      ? 'Update banner, scroll banner, ad or pop-up'
      : 'Create a banner, scroll banner, ad or pop-up')
  const resolvedSubmit =
    submitLabel || (mode === 'edit' ? 'Save banner' : 'Create banner')

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close modal backdrop"
        onClick={() => !busy && onClose?.()}
        className="absolute inset-0 bg-black/40"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-new-banner-title"
        className="relative flex h-[699px] w-[560px] max-w-[calc(100vw-2rem)] flex-col items-start gap-4 overflow-hidden rounded-[16px] bg-white p-[22px] shadow-[0px_18px_44px_rgba(0,0,0,0.3)]"
      >
        <div className="flex w-full items-center gap-3">
          <div className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-[10px] bg-[#E3F2EB] text-[16px] leading-none text-[#127338]">
            🖼
          </div>
          <div className="flex min-w-0 flex-1 flex-col items-start gap-0.5">
            <h2 id="admin-new-banner-title" className="text-[16.5px] font-bold leading-5 text-[#1C211F]">
              {resolvedTitle}
            </h2>
            <p className="truncate text-[12px] font-normal leading-[15px] text-[#6B736E]">
              {resolvedDescription}
            </p>
          </div>
          <button
            type="button"
            aria-label="Close"
            disabled={busy}
            onClick={onClose}
            className="shrink-0 text-[16px] leading-[19px] text-[#6B736E] hover:text-[#1C211F] disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        <div className="flex w-full flex-col items-start gap-1.5">
          <FieldLabel>Type</FieldLabel>
          <div className="flex w-full items-start rounded-[10px] bg-[#EDF0ED] p-[3px]">
            {DEFAULT_BANNER_TYPES.map((item) => (
              <button
                key={item.id}
                type="button"
                disabled={busy}
                onClick={() => setField('type', item.id)}
                className={cn(
                  'flex h-[31px] flex-1 items-start justify-center rounded-[8px] px-3 py-2 text-[12px] leading-[15px] transition',
                  form.type === item.id
                    ? 'bg-white font-semibold text-[#1C211F]'
                    : 'font-medium text-[#737A75]',
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex w-full flex-col items-start gap-1.5">
          <FieldLabel>Image</FieldLabel>
          <input
            ref={fileInputRef}
            type="file"
            accept={ADMIN_IMAGE_UPLOAD_ACCEPT}
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            type="button"
            disabled={busy}
            onClick={handlePickImage}
            className={cn(
              'relative flex h-[77px] w-full flex-col items-center justify-center gap-1 overflow-hidden rounded-[10px] border-[1.2px] border-dashed border-[#E3E6E3] bg-[#F7FAF7] hover:bg-[#f0f4f0] disabled:opacity-60',
              displayImage && 'border-solid',
            )}
          >
            {displayImage ? (
              <>
                <img
                  src={displayImage}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                  onLoad={() => {
                    // If we are showing the remote URL, drop any leftover blob.
                    if (!localPreviewUrl || displayImage === remoteDisplayUrl) {
                      handleRemoteImageLoad()
                    } else if (remoteDisplayUrl && displayImage === localPreviewUrl) {
                      // Warm the remote URL; revoke blob once it loads.
                      const probe = new Image()
                      probe.onload = handleRemoteImageLoad
                      probe.onerror = handleRemoteImageError
                      probe.src = remoteDisplayUrl
                    }
                  }}
                  onError={handleRemoteImageError}
                />
                <span className="relative z-[1] rounded-md bg-white/90 px-3 py-1.5 text-[12px] font-medium leading-[15px] text-[#6B736E]">
                  {isUploading ? 'Uploading…' : 'Change image'}
                </span>
              </>
            ) : (
              <>
                <Upload size={18} strokeWidth={2} className="text-[#6B736E]" />
                <span className="text-[12px] font-medium leading-[15px] text-[#6B736E]">
                  {isUploading ? 'Uploading…' : 'Upload image (1200×400 recommended)'}
                </span>
              </>
            )}
          </button>
          {uploadError ? (
            <p className="w-full text-[12px] font-medium text-[#c91a24]">
              {formatApiErrorMessage(uploadError, 'Unable to upload image.')}{' '}
              <button
                type="button"
                className="underline"
                disabled={busy}
                onClick={handlePickImage}
              >
                Retry
              </button>
            </p>
          ) : null}
        </div>

        <div className="flex w-full items-start gap-4">
          <label className="flex min-w-0 flex-1 flex-col items-start gap-1.5">
            <FieldLabel>Title</FieldLabel>
            <TextInput
              value={form.title}
              disabled={busy}
              onChange={(value) => setField('title', value)}
            />
          </label>
          <label className="flex min-w-0 flex-1 flex-col items-start gap-1.5">
            <FieldLabel>Subtitle / CTA</FieldLabel>
            <TextInput
              value={form.subtitle}
              disabled={busy}
              onChange={(value) => setField('subtitle', value)}
            />
          </label>
        </div>

        <div className="flex w-full items-start gap-4">
          <label className="flex min-w-0 flex-1 flex-col items-start gap-1.5">
            <FieldLabel>Tap action</FieldLabel>
            <SelectField
              value={form.tapAction}
              disabled={busy}
              onChange={handleTapActionChange}
              options={tapActions.length ? tapActions : DEFAULT_TAP_ACTIONS}
            />
          </label>
          <label className="flex min-w-0 flex-1 flex-col items-start gap-1.5">
            <FieldLabel>Target{targetsLoading ? '…' : ''}</FieldLabel>
            <SelectField
              value={form.targetId || form.target}
              disabled={busy || targetsLoading}
              onChange={handleTargetChange}
              options={targetOptions}
            />
          </label>
        </div>

        <label className="flex w-[188px] max-w-full flex-col items-start gap-1.5">
          <FieldLabel>Placement</FieldLabel>
          <SelectField
            value={form.placement}
            disabled={busy}
            onChange={handlePlacementChange}
            options={placementOptions}
          />
        </label>

        <div className="flex w-full items-start gap-4">
          <label className="flex min-w-0 flex-1 flex-col items-start gap-1.5">
            <FieldLabel>Start</FieldLabel>
            <DateField
              value={form.start}
              disabled={busy}
              onChange={(value) => setField('start', value)}
            />
          </label>
          <label className="flex min-w-0 flex-1 flex-col items-start gap-1.5">
            <FieldLabel>End</FieldLabel>
            <DateField
              value={form.end}
              disabled={busy}
              onChange={(value) => setField('end', value)}
            />
          </label>
        </div>

        <div className="flex w-full items-start gap-4">
          <label className="flex min-w-0 flex-1 flex-col items-start gap-1.5">
            <FieldLabel>Audience</FieldLabel>
            <SelectField
              value={form.audience}
              disabled={busy}
              onChange={(value) => setField('audience', value)}
              options={audiences.length ? audiences : DEFAULT_AUDIENCES}
            />
          </label>
          <div className="flex min-w-0 flex-1 flex-col items-start gap-1.5">
            <FieldLabel>Active</FieldLabel>
            <div className="flex h-[38px] w-full items-center gap-2.5 rounded-[10px] bg-[#F7FAF7] px-3 py-[9px]">
              <span className="text-[13px] font-semibold leading-4 text-[#1C211F]">
                Publish immediately
              </span>
              <div className="flex-1" />
              <button
                type="button"
                role="switch"
                aria-checked={form.active}
                disabled={busy}
                onClick={() => setField('active', !form.active)}
                className={cn(
                  'relative flex h-[26px] w-[44px] shrink-0 items-center rounded-xl px-1 transition',
                  form.active ? 'justify-end bg-[#2E9E4D]' : 'justify-start bg-[#cfd6d1]',
                )}
              >
                <span className="h-[18px] w-[18px] rounded-full bg-white" />
              </button>
            </div>
          </div>
        </div>

        {error ? (
          <p className="w-full text-[12.5px] font-medium text-[#c91a24]">
            {formatApiErrorMessage(error, 'Unable to save banner.')}
          </p>
        ) : null}

        <div className="mt-auto flex w-full items-center gap-2.5">
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className="inline-flex h-[38px] items-center justify-center rounded-[20px] border-[1.2px] border-[#E3E6E3] bg-white px-[18px] text-[13px] font-semibold leading-4 text-[#1C211F] hover:bg-[#F7FAF7] disabled:opacity-60"
          >
            Cancel
          </button>
          <div className="flex-1" />
          <button
            type="button"
            disabled={busy}
            onClick={handleSubmit}
            className="inline-flex h-[38px] items-center justify-center rounded-[20px] bg-[#2E9E4D] px-[18px] text-[13px] font-semibold leading-4 text-white hover:bg-[#278a43] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isUploading ? 'Uploading…' : isSubmitting ? 'Saving…' : resolvedSubmit}
          </button>
        </div>
      </div>
    </div>
  )
}
