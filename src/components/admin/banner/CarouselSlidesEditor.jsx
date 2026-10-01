import { useEffect, useRef, useState } from 'react'
import { GripVertical, Plus, Trash2, Upload } from 'lucide-react'
import { formatApiErrorMessage } from '../../../api/errors'
import {
  ADMIN_IMAGE_UPLOAD_ACCEPT,
  adminUploadService,
  validateAdminImageFile,
} from '../../../services/admin/uploadService'
import AdminMediaImage from '../AdminMediaImage'
import BannerSchedulingSection from './BannerSchedulingSection'
import { cn } from '../cn'

const labelClass = 'block text-[12px] font-semibold leading-[15px] text-[#6B736E]'
const inputClass =
  'box-border h-[38px] w-full rounded-[10px] border-[1.2px] border-[#E3E6E3] bg-white px-[14px] text-[13px] font-medium leading-4 text-[#1C211F] outline-none transition focus:border-[#2E9E4D]'

function emptySlide(order = 0) {
  return {
    id: `slide-${Date.now()}-${order}`,
    title: '',
    subtitle: '',
    imageUrl: '',
    tapAction: 'Open store',
    targetId: '',
    ctaUrl: '',
    ctaLabel: '',
    start: '',
    end: '',
    scheduleAllDay: true,
    scheduleStartTime: '',
    scheduleEndTime: '',
    runUntilDeactivated: false,
    active: true,
    sortOrder: order,
  }
}

export default function CarouselSlidesEditor({
  form,
  setForm,
  busy,
  tapActions,
  targetOptions,
  targetsLoading,
  onTapActionChange,
}) {
  const fileRef = useRef(null)
  const [uploadIndex, setUploadIndex] = useState(null)
  const [uploadError, setUploadError] = useState(null)

  const slides = Array.isArray(form.slides) && form.slides.length ? form.slides : [emptySlide(0)]

  useEffect(() => {
    if (!Array.isArray(form.slides) || !form.slides.length) {
      setForm((prev) => ({ ...prev, slides: [emptySlide(0)] }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- seed once when carousel opens
  }, [])

  const setSlides = (next) => setForm((prev) => ({ ...prev, slides: next }))

  const updateSlide = (index, patch) => {
    setSlides(
      slides.map((slide, i) => (i === index ? { ...slide, ...patch } : slide)),
    )
  }

  const removeSlide = (index) => {
    if (slides.length <= 1) return
    setSlides(slides.filter((_, i) => i !== index).map((s, i) => ({ ...s, sortOrder: i })))
  }

  const addSlide = () => {
    setSlides([...slides, emptySlide(slides.length)])
  }

  const onDragStart = (index) => (event) => {
    event.dataTransfer.setData('text/plain', String(index))
  }

  const onDrop = (index) => (event) => {
    event.preventDefault()
    const from = Number(event.dataTransfer.getData('text/plain'))
    if (!Number.isFinite(from) || from === index) return
    const copy = [...slides]
    const [moved] = copy.splice(from, 1)
    copy.splice(index, 0, moved)
    setSlides(copy.map((s, i) => ({ ...s, sortOrder: i })))
  }

  const pickImage = (index) => {
    if (busy) return
    setUploadIndex(index)
    fileRef.current?.click()
  }

  const onFile = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    const index = uploadIndex
    setUploadIndex(null)
    if (!file || index == null) return
    setUploadError(null)
    try {
      validateAdminImageFile(file)
      const result = await adminUploadService.uploadImage(file, { feature: 'ui-editor' })
      const url = result?.data?.url
      if (!url) throw new Error('Upload succeeded but no URL returned.')
      updateSlide(index, { imageUrl: url })
    } catch (err) {
      setUploadError(err)
    }
  }

  return (
    <div className="flex w-full flex-col gap-3">
      <label className="flex w-full max-w-[200px] flex-col gap-1.5">
        <span className={labelClass}>Rotation speed (seconds)</span>
        <input
          type="number"
          min={2}
          max={120}
          value={form.rotationSeconds ?? 5}
          disabled={busy}
          onChange={(e) => setForm((prev) => ({ ...prev, rotationSeconds: Number(e.target.value) }))}
          className={cn(inputClass, busy && 'opacity-60')}
        />
      </label>

      <input ref={fileRef} type="file" accept={ADMIN_IMAGE_UPLOAD_ACCEPT} className="hidden" onChange={onFile} />

      {slides.map((slide, index) => (
        <div
          key={slide.id || index}
          className="rounded-[10px] border border-[#E3E6E3] bg-white p-3"
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop(index)}
        >
          <div className="mb-2 flex items-center gap-2">
            <button
              type="button"
              draggable={!busy}
              onDragStart={onDragStart(index)}
              className="text-[#6B736E]"
              aria-label="Drag to reorder"
            >
              <GripVertical size={16} />
            </button>
            <span className="text-[12.5px] font-bold text-[#17231c]">Banner {index + 1}</span>
            <div className="flex-1" />
            <label className="flex items-center gap-1.5 text-[12px] font-medium">
              <input
                type="checkbox"
                checked={slide.active !== false}
                disabled={busy}
                onChange={(e) => updateSlide(index, { active: e.target.checked })}
              />
              Active
            </label>
            <button
              type="button"
              disabled={busy || slides.length <= 1}
              onClick={() => removeSlide(index)}
              className="text-[#c91a24] disabled:opacity-40"
              aria-label="Remove slide"
            >
              <Trash2 size={15} />
            </button>
          </div>

          <button
            type="button"
            disabled={busy}
            onClick={() => pickImage(index)}
            className="relative mb-3 flex h-[72px] w-full items-center justify-center rounded-[10px] border border-dashed border-[#E3E6E3] bg-[#F7FAF7]"
          >
            {slide.imageUrl ? (
              <AdminMediaImage src={slide.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover rounded-[10px]" />
            ) : (
              <span className="inline-flex items-center gap-1 text-[12px] text-[#6B736E]">
                <Upload size={14} /> Upload image
              </span>
            )}
          </button>

          <div className="grid grid-cols-1 gap-3 min-[520px]:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className={labelClass}>Tap action</span>
              <select
                value={slide.tapAction}
                disabled={busy}
                onChange={(e) => {
                  updateSlide(index, { tapAction: e.target.value })
                  onTapActionChange?.(e.target.value)
                }}
                className={inputClass}
              >
                {tapActions.map((action) => (
                  <option key={action} value={action}>{action}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={labelClass}>Target {targetsLoading ? '…' : ''}</span>
              <select
                value={slide.targetId || ''}
                disabled={busy || targetsLoading}
                onChange={(e) => updateSlide(index, { targetId: e.target.value })}
                className={inputClass}
              >
                <option value="">Select…</option>
                {targetOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-3">
            <BannerSchedulingSection
              form={slide}
              busy={busy}
              title="Slide schedule"
              setField={(key, value) => updateSlide(index, { [key]: value })}
            />
          </div>
        </div>
      ))}

      {uploadError ? (
        <p className="text-[12px] text-[#c91a24]">
          {formatApiErrorMessage(uploadError, 'Unable to upload image.')}
        </p>
      ) : null}

      <button
        type="button"
        disabled={busy}
        onClick={addSlide}
        className="inline-flex h-[36px] items-center justify-center gap-1 rounded-[10px] border border-[#E3E6E3] bg-white text-[12.5px] font-semibold text-[#17231c]"
      >
        <Plus size={14} /> Add banner to carousel
      </button>
    </div>
  )
}
