import { cn } from '../cn'

const labelClass = 'block text-[12px] font-semibold leading-[15px] text-[#6B736E]'
const inputClass =
  'box-border h-[38px] w-full rounded-[10px] border-[1.2px] border-[#E3E6E3] bg-white px-[14px] text-[13px] font-medium leading-4 text-[#1C211F] outline-none transition focus:border-[#2E9E4D]'

function FieldLabel({ children }) {
  return <span className={labelClass}>{children}</span>
}

export default function BannerSchedulingSection({ form, setField, busy, title = 'Scheduling' }) {
  const runUntil = Boolean(form.runUntilDeactivated)
  const allDay = form.scheduleAllDay !== false

  return (
    <div className="flex w-full flex-col gap-3 rounded-[10px] border border-[#EEF1EE] bg-[#FAFBFA] p-3">
      <p className="text-[12.5px] font-bold text-[#17231c]">{title}</p>

      <div className="grid w-full grid-cols-1 gap-3 min-[520px]:grid-cols-2">
        <label className="flex min-w-0 flex-col gap-1.5">
          <FieldLabel>Start date</FieldLabel>
          <input
            type="date"
            value={form.start || ''}
            disabled={busy}
            onChange={(e) => setField('start', e.target.value)}
            className={cn(inputClass, busy && 'opacity-60')}
          />
        </label>
        <label className="flex min-w-0 flex-col gap-1.5">
          <FieldLabel>End date</FieldLabel>
          <input
            type="date"
            value={form.end || ''}
            disabled={busy || runUntil}
            onChange={(e) => setField('end', e.target.value)}
            className={cn(inputClass, (busy || runUntil) && 'opacity-60')}
          />
        </label>
      </div>

      <label className="flex items-center gap-2 text-[13px] font-medium text-[#1C211F]">
        <input
          type="checkbox"
          checked={runUntil}
          disabled={busy}
          onChange={(e) => setField('runUntilDeactivated', e.target.checked)}
        />
        Run until deactivated (no end date)
      </label>

      <label className="flex items-center gap-2 text-[13px] font-medium text-[#1C211F]">
        <input
          type="checkbox"
          checked={allDay}
          disabled={busy}
          onChange={(e) => setField('scheduleAllDay', e.target.checked)}
        />
        All day
      </label>

      {!allDay ? (
        <div className="grid w-full grid-cols-1 gap-3 min-[520px]:grid-cols-2">
          <label className="flex min-w-0 flex-col gap-1.5">
            <FieldLabel>Start time</FieldLabel>
            <input
              type="time"
              value={form.scheduleStartTime || ''}
              disabled={busy}
              onChange={(e) => setField('scheduleStartTime', e.target.value)}
              className={cn(inputClass, busy && 'opacity-60')}
            />
          </label>
          <label className="flex min-w-0 flex-col gap-1.5">
            <FieldLabel>End time</FieldLabel>
            <input
              type="time"
              value={form.scheduleEndTime || ''}
              disabled={busy}
              onChange={(e) => setField('scheduleEndTime', e.target.value)}
              className={cn(inputClass, busy && 'opacity-60')}
            />
          </label>
        </div>
      ) : null}
    </div>
  )
}
