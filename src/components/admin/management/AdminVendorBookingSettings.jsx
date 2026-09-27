import { useEffect, useState } from 'react'

const inputClass =
  'box-border h-[40px] w-full rounded-[8px] border border-[rgba(0,0,0,0.1)] bg-white px-3 text-[13px] text-[#17231c] outline-none focus:border-[#1aa054]'
const labelClass = 'mb-1.5 block text-[12px] font-medium text-[#7c8780]'

/**
 * Services v1 S05 — admin override of vendor booking settings
 * (same payload as vendor panel GET/PATCH /vendor-panel/settings/booking).
 */
export function AdminVendorBookingSettings({
  data,
  onSave,
  saving = false,
  error = null,
  saveMessage = null,
}) {
  const booking = data?.booking && typeof data.booking === 'object' ? data.booking : {}
  const platform = data?.platformDefaults && typeof data.platformDefaults === 'object'
    ? data.platformDefaults
    : {}

  const [form, setForm] = useState(() => ({
    acceptBookings: booking.acceptBookings !== false,
    bufferMin: Number(booking.bufferMin) || 0,
    slotDurationMin: Number(booking.slotDurationMin) || 60,
    leadTimeHours: Number(booking.leadTimeHours) || 2,
    maxConcurrentPerSlot:
      booking.maxConcurrentPerSlot == null ? '' : Number(booking.maxConcurrentPerSlot),
    bookingWindowDays:
      Number(booking.bookingWindowDays) ||
      Number(platform.defaultBookingWindowDays) ||
      30,
    enabledSlots: Array.isArray(booking.enabledSlots) ? booking.enabledSlots.join(', ') : '',
  }))

  useEffect(() => {
    setForm({
      acceptBookings: booking.acceptBookings !== false,
      bufferMin: Number(booking.bufferMin) || 0,
      slotDurationMin: Number(booking.slotDurationMin) || 60,
      leadTimeHours: Number(booking.leadTimeHours) || 2,
      maxConcurrentPerSlot:
        booking.maxConcurrentPerSlot == null ? '' : Number(booking.maxConcurrentPerSlot),
      bookingWindowDays:
        Number(booking.bookingWindowDays) ||
        Number(platform.defaultBookingWindowDays) ||
        30,
      enabledSlots: Array.isArray(booking.enabledSlots) ? booking.enabledSlots.join(', ') : '',
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.vendorId, booking.bufferMin, booking.bookingWindowDays])

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))

  const handleSave = () => {
    const slots = String(form.enabledSlots || '')
      .split(/[,\s]+/)
      .map((s) => s.trim())
      .filter((s) => /^\d{1,2}:\d{2}$/.test(s))
      .map((s) => {
        const [h, m] = s.split(':')
        return `${String(Number(h)).padStart(2, '0')}:${m}`
      })

    const payload = {
      acceptBookings: Boolean(form.acceptBookings),
      bufferMin: Number(form.bufferMin) || 0,
      slotDurationMin: Number(form.slotDurationMin) || 60,
      leadTimeHours: Number(form.leadTimeHours) || 0,
      maxConcurrentPerSlot:
        form.maxConcurrentPerSlot === '' || form.maxConcurrentPerSlot == null
          ? null
          : Number(form.maxConcurrentPerSlot),
      bookingWindowDays: Number(form.bookingWindowDays) || 30,
      enabledSlots: slots.length
        ? slots
        : Array.isArray(booking.enabledSlots) && booking.enabledSlots.length
          ? booking.enabledSlots
          : ['10:00', '11:30', '13:00', '15:00', '16:30'],
      fulfillmentModes: booking.fulfillmentModes || { inSalon: true, atHome: true },
      bookingDays: booking.bookingDays || {
        mon: true,
        tue: true,
        wed: true,
        thu: true,
        fri: true,
        sat: true,
        sun: true,
      },
      blockedDates: Array.isArray(booking.blockedDates) ? booking.blockedDates : [],
      coveredAreas: Array.isArray(booking.coveredAreas) ? booking.coveredAreas : [],
    }
    onSave?.(payload)
  }

  return (
    <div className="space-y-4">
      <section className="rounded-[14px] border border-[#eceeec] bg-white px-5 py-5 shadow-[0_1px_2px_rgba(20,40,28,.03)]">
        <h3 className="text-[16px] font-bold text-[#17231c]">Booking settings</h3>
        <p className="mt-1 text-[12px] text-[#7c8780]">
          Override this provider’s booking controls without the vendor panel. Platform default
          window: {platform.defaultBookingWindowDays ?? 30} days · cancel free window:{' '}
          {platform.cancelWindowHours ?? 2}h · cancel fee: {platform.cancelFeePercent ?? 50}%.
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3 max-[720px]:grid-cols-1">
          <label className={labelClass}>
            Accept bookings
            <div className="mt-1.5">
              <button
                type="button"
                role="switch"
                aria-checked={form.acceptBookings}
                onClick={() => setField('acceptBookings', !form.acceptBookings)}
                className={`box-border flex h-[22px] w-[38px] items-center rounded-[11px] px-[3px] ${
                  form.acceptBookings ? 'justify-end bg-[#1aa054]' : 'justify-start bg-[#C7CFC7]'
                }`}
              >
                <span className="size-4 rounded-lg bg-white" />
              </button>
            </div>
          </label>
          <label className={labelClass}>
            Buffer between slots (min)
            <input
              type="number"
              min={0}
              className={`${inputClass} mt-1.5`}
              value={form.bufferMin}
              onChange={(e) => setField('bufferMin', e.target.value)}
            />
          </label>
          <label className={labelClass}>
            Booking window (days)
            <input
              type="number"
              min={1}
              max={365}
              className={`${inputClass} mt-1.5`}
              value={form.bookingWindowDays}
              onChange={(e) => setField('bookingWindowDays', e.target.value)}
            />
          </label>
          <label className={labelClass}>
            Slot duration (min)
            <input
              type="number"
              min={15}
              className={`${inputClass} mt-1.5`}
              value={form.slotDurationMin}
              onChange={(e) => setField('slotDurationMin', e.target.value)}
            />
          </label>
          <label className={labelClass}>
            Lead time (hours)
            <input
              type="number"
              min={0}
              className={`${inputClass} mt-1.5`}
              value={form.leadTimeHours}
              onChange={(e) => setField('leadTimeHours', e.target.value)}
            />
          </label>
          <label className={labelClass}>
            Max concurrent / slot (blank = staff count)
            <input
              type="number"
              min={0}
              className={`${inputClass} mt-1.5`}
              value={form.maxConcurrentPerSlot}
              onChange={(e) => setField('maxConcurrentPerSlot', e.target.value)}
            />
          </label>
          <label className={`${labelClass} col-span-2 max-[720px]:col-span-1`}>
            Enabled slots (HH:MM, comma-separated)
            <input
              className={`${inputClass} mt-1.5`}
              value={form.enabledSlots}
              onChange={(e) => setField('enabledSlots', e.target.value)}
            />
          </label>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="inline-flex h-[36px] items-center rounded-sm bg-[#1aa054] px-4 text-[13px] font-bold text-white hover:bg-[#158a47] disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save booking settings'}
          </button>
          {saveMessage ? <p className="text-[12px] text-[#1aa054]">{saveMessage}</p> : null}
          {error ? <p className="text-[12px] text-[#d64044]">{error}</p> : null}
        </div>
      </section>
    </div>
  )
}
