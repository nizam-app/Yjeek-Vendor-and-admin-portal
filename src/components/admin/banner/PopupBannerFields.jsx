const labelClass = 'block text-[12px] font-semibold leading-[15px] text-[#6B736E]'
const inputClass =
  'box-border h-[38px] w-full rounded-[10px] border-[1.2px] border-[#E3E6E3] bg-white px-[14px] text-[13px] font-medium leading-4 text-[#1C211F] outline-none transition focus:border-[#2E9E4D]'

const FREQUENCIES = [
  { value: 'ONCE', label: 'Once only' },
  { value: 'ONCE_PER_SESSION', label: 'Once per session' },
  { value: 'ONCE_PER_DAY', label: 'Once per day' },
  { value: 'EVERY_OPEN', label: 'Every time the app opens' },
]

const TRIGGERS = [
  { value: 'APP_LAUNCH', label: 'On app launch' },
  { value: 'HOME_SCREEN', label: 'On home screen' },
  { value: 'OTHER', label: 'Other placement' },
]

export default function PopupBannerFields({ form, setField, busy }) {
  return (
    <div className="flex w-full flex-col gap-3 rounded-[10px] border border-[#EEF1EE] bg-[#FAFBFA] p-3">
      <p className="text-[12.5px] font-bold text-[#17231c]">Pop-up behaviour</p>
      <label className="flex flex-col gap-1.5">
        <span className={labelClass}>Frequency</span>
        <select
          value={form.popupFrequency || 'ONCE_PER_SESSION'}
          disabled={busy}
          onChange={(e) => setField('popupFrequency', e.target.value)}
          className={inputClass}
        >
          {FREQUENCIES.map((item) => (
            <option key={item.value} value={item.value}>{item.label}</option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1.5">
        <span className={labelClass}>Where it appears</span>
        <select
          value={form.popupTrigger || 'APP_LAUNCH'}
          disabled={busy}
          onChange={(e) => setField('popupTrigger', e.target.value)}
          className={inputClass}
        >
          {TRIGGERS.map((item) => (
            <option key={item.value} value={item.value}>{item.label}</option>
          ))}
        </select>
      </label>
      <label className="flex items-center gap-2 text-[13px] font-medium text-[#1C211F]">
        <input
          type="checkbox"
          checked={form.popupDismissable !== false}
          disabled={busy}
          onChange={(e) => setField('popupDismissable', e.target.checked)}
        />
        Customer can dismiss / close
      </label>
      <label className="flex items-center gap-2 text-[13px] font-medium text-[#1C211F]">
        <input
          type="checkbox"
          checked={Boolean(form.popupDismissCounts)}
          disabled={busy}
          onChange={(e) => setField('popupDismissCounts', e.target.checked)}
        />
        Closing counts toward frequency limit
      </label>
    </div>
  )
}
