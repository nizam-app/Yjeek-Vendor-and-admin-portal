import { useEffect, useMemo, useRef, useState } from 'react'
import { Calendar as CalendarIcon, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from './cn'

const WEEKDAYS = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA']
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

export function todayLocalIsoDate() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function localDateToStartIso(dateValue) {
  const raw = String(dateValue || '').trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null
  const date = new Date(`${raw}T00:00:00`)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString()
}

export function localDateToEndIso(dateValue) {
  const raw = String(dateValue || '').trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null
  const date = new Date(`${raw}T23:59:59.999`)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString()
}

function parseIsoDate(value) {
  const raw = String(value || '').trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null
  const [y, m, d] = raw.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  if (Number.isNaN(date.getTime())) return null
  return date
}

function toIsoDate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function formatDisplay(value) {
  const date = parseIsoDate(value)
  if (!date) return ''
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

/**
 * Styled calendar date picker — click opens a calendar.
 * - `min` omitted → defaults to today (promo / schedule fields)
 * - `min={null}` → no lower bound (birth dates, already-expired docs)
 *
 * Click the month/year header to switch to month grid, then year grid for fast navigation.
 */
export function AdminDatePicker({
  value,
  onChange,
  min,
  max,
  placeholder = 'DD/MM/YYYY',
  disabled = false,
  className,
}) {
  const rootRef = useRef(null)
  const minDate = useMemo(() => {
    if (min === null) return null
    if (min === undefined) return parseIsoDate(todayLocalIsoDate())
    return parseIsoDate(min)
  }, [min])
  const maxDate = useMemo(() => parseIsoDate(max), [max])
  const selected = useMemo(() => parseIsoDate(value), [value])
  const [open, setOpen] = useState(false)
  const [view, setView] = useState(() => selected || minDate || new Date())
  // 'days' | 'months' | 'years'
  const [mode, setMode] = useState('days')

  useEffect(() => {
    if (!open) return
    setView(selected || minDate || new Date())
    setMode('days')
  }, [open, selected, minDate])

  useEffect(() => {
    function onDocMouseDown(event) {
      if (!rootRef.current?.contains(event.target)) setOpen(false)
    }
    function onKeyDown(event) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDocMouseDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [])

  const year = view.getFullYear()
  const month = view.getMonth()

  function canGoPrev() {
    if (mode === 'years') {
      if (!minDate) return true
      return year - 12 >= minDate.getFullYear() - 12
    }
    if (mode === 'months') {
      if (!minDate) return true
      return year - 1 >= (minDate?.getFullYear() ?? 1900)
    }
    const prevMonthEnd = new Date(year, month, 0)
    return !minDate || startOfDay(prevMonthEnd) >= startOfDay(minDate)
  }

  function canGoNext() {
    if (mode === 'years') {
      if (!maxDate) return true
      return year + 12 <= maxDate.getFullYear() + 12
    }
    if (mode === 'months') {
      if (!maxDate) return true
      return year + 1 <= (maxDate?.getFullYear() ?? 2100)
    }
    if (!maxDate) return true
    const nextMonthStart = new Date(year, month + 1, 1)
    return startOfDay(nextMonthStart) <= startOfDay(maxDate)
  }

  function goPrev() {
    if (mode === 'years') {
      setView(new Date(year - 12, month, 1))
    } else if (mode === 'months') {
      setView(new Date(year - 1, month, 1))
    } else {
      setView(new Date(year, month - 1, 1))
    }
  }

  function goNext() {
    if (mode === 'years') {
      setView(new Date(year + 12, month, 1))
    } else if (mode === 'months') {
      setView(new Date(year + 1, month, 1))
    } else {
      setView(new Date(year, month + 1, 1))
    }
  }

  function isDisabledDay(date) {
    const day = startOfDay(date)
    if (minDate && day < startOfDay(minDate)) return true
    if (maxDate && day > startOfDay(maxDate)) return true
    return false
  }

  function pick(date) {
    if (isDisabledDay(date)) return
    onChange?.(toIsoDate(date))
    setOpen(false)
  }

  function pickMonth(m) {
    setView(new Date(year, m, 1))
    setMode('days')
  }

  function pickYear(y) {
    setView(new Date(y, month, 1))
    setMode('months')
  }

  function handleHeaderClick() {
    if (mode === 'days') setMode('months')
    else if (mode === 'months') setMode('years')
  }

  const today = startOfDay(new Date())

  // Days grid
  const firstWeekday = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < firstWeekday; i += 1) cells.push(null)
  for (let day = 1; day <= daysInMonth; day += 1) cells.push(new Date(year, month, day))

  // Years range (12 years centered around current)
  const yearStart = year - 5
  const yearEnd = year + 6

  const headerLabel =
    mode === 'years'
      ? `${yearStart} – ${yearEnd}`
      : mode === 'months'
        ? `${year}`
        : `${MONTHS[month]} ${year}`

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          'box-border flex h-[40px] w-full items-center gap-2 rounded-[8px] border border-[rgba(0,0,0,0.1)] bg-white px-3 text-left text-[13px] outline-none transition focus:border-[#1aa054] disabled:opacity-60',
          value ? 'text-[#17231c]' : 'text-[#9aa49d]',
        )}
      >
        <CalendarIcon size={15} strokeWidth={2} className="shrink-0 text-[#1aa054]" aria-hidden />
        <span className="min-w-0 flex-1 truncate">{formatDisplay(value) || placeholder}</span>
      </button>

      {open ? (
        <div className="absolute left-0 top-[calc(100%+6px)] z-30 w-[292px] overflow-hidden rounded-[14px] border border-[#e4e8e4] bg-white p-3 shadow-[0_12px_32px_rgba(20,40,28,.14)]">
          {/* Header: prev / month-year / next */}
          <div className="mb-2 flex items-center justify-between gap-2">
            <button
              type="button"
              aria-label="Previous"
              disabled={!canGoPrev()}
              onClick={goPrev}
              className="grid h-8 w-8 place-items-center rounded-full text-[#455249] hover:bg-[#f3f5f3] disabled:opacity-30"
            >
              <ChevronLeft size={16} strokeWidth={2.2} />
            </button>
            <button
              type="button"
              onClick={handleHeaderClick}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[13px] font-bold text-[#17231c] hover:bg-[#f3f5f3]"
            >
              {headerLabel}
              {mode !== 'years' ? (
                <ChevronDown size={12} strokeWidth={2.5} className="text-[#7c8780]" />
              ) : null}
            </button>
            <button
              type="button"
              aria-label="Next"
              disabled={!canGoNext()}
              onClick={goNext}
              className="grid h-8 w-8 place-items-center rounded-full text-[#455249] hover:bg-[#f3f5f3] disabled:opacity-30"
            >
              <ChevronRight size={16} strokeWidth={2.2} />
            </button>
          </div>

          {/* Years grid */}
          {mode === 'years' ? (
            <div className="grid grid-cols-4 gap-1">
              {Array.from({ length: 12 }, (_, i) => yearStart + i).map((y) => {
                const isDisabled =
                  (minDate && y < minDate.getFullYear()) ||
                  (maxDate && y > maxDate.getFullYear())
                const isCurrent = y === new Date().getFullYear()
                const isSelected = y === year
                return (
                  <button
                    key={y}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => pickYear(y)}
                    className={cn(
                      'grid h-10 place-items-center rounded-lg text-[13px] font-medium transition',
                      isDisabled && 'cursor-not-allowed text-[#c5cbc6]',
                      !isDisabled && !isSelected && 'text-[#17231c] hover:bg-[#e8f7ed] hover:text-[#147940]',
                      isSelected && 'bg-[#1aa054] font-bold text-white hover:bg-[#158a47]',
                      !isSelected && isCurrent && !isDisabled && 'ring-1 ring-[#1aa054]/40',
                    )}
                  >
                    {y}
                  </button>
                )
              })}
            </div>
          ) : null}

          {/* Months grid */}
          {mode === 'months' ? (
            <div className="grid grid-cols-3 gap-1">
              {MONTHS_SHORT.map((mName, i) => {
                const isDisabled =
                  (minDate && (year < minDate.getFullYear() || (year === minDate.getFullYear() && i < minDate.getMonth()))) ||
                  (maxDate && (year > maxDate.getFullYear() || (year === maxDate.getFullYear() && i > maxDate.getMonth())))
                const isCurrent = i === new Date().getMonth() && year === new Date().getFullYear()
                const isSelected = i === month
                return (
                  <button
                    key={mName}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => pickMonth(i)}
                    className={cn(
                      'grid h-10 place-items-center rounded-lg text-[13px] font-medium transition',
                      isDisabled && 'cursor-not-allowed text-[#c5cbc6]',
                      !isDisabled && !isSelected && 'text-[#17231c] hover:bg-[#e8f7ed] hover:text-[#147940]',
                      isSelected && 'bg-[#1aa054] font-bold text-white hover:bg-[#158a47]',
                      !isSelected && isCurrent && !isDisabled && 'ring-1 ring-[#1aa054]/40',
                    )}
                  >
                    {mName}
                  </button>
                )
              })}
            </div>
          ) : null}

          {/* Days grid */}
          {mode === 'days' ? (
            <>
              <div className="mb-1 grid grid-cols-7 gap-0.5">
                {WEEKDAYS.map((day) => (
                  <div
                    key={day}
                    className="grid h-8 place-items-center text-[10px] font-bold uppercase tracking-[0.04em] text-[#8a948e]"
                  >
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-0.5">
                {cells.map((date, index) => {
                  if (!date) {
                    return <div key={`empty-${index}`} className="h-9" />
                  }
                  const iso = toIsoDate(date)
                  const disabledDay = isDisabledDay(date)
                  const isSelected = selected && toIsoDate(selected) === iso
                  const isToday = startOfDay(date).getTime() === today.getTime()
                  return (
                    <button
                      key={iso}
                      type="button"
                      disabled={disabledDay}
                      onClick={() => pick(date)}
                      className={cn(
                        'grid h-9 place-items-center rounded-full text-[12.5px] font-medium transition',
                        disabledDay && 'cursor-not-allowed text-[#c5cbc6]',
                        !disabledDay && !isSelected && 'text-[#17231c] hover:bg-[#e8f7ed] hover:text-[#147940]',
                        isSelected && 'bg-[#1aa054] font-bold text-white hover:bg-[#158a47]',
                        !isSelected && isToday && !disabledDay && 'ring-1 ring-[#1aa054]/40',
                      )}
                    >
                      {date.getDate()}
                    </button>
                  )
                })}
              </div>
            </>
          ) : null}

          <div className="mt-2 flex items-center justify-between border-t border-[#edf0ee] pt-2">
            <button
              type="button"
              className="rounded-full px-2.5 py-1 text-[12px] font-bold text-[#1aa054] hover:bg-[#e8f7ed]"
              onClick={() => {
                const todayIso = todayLocalIsoDate()
                if (min && todayIso < min) return
                if (max && todayIso > max) return
                onChange?.(todayIso)
                setOpen(false)
              }}
            >
              Today
            </button>
            {value ? (
              <button
                type="button"
                className="rounded-full px-2.5 py-1 text-[12px] font-medium text-[#7c8780] hover:bg-[#f3f5f3]"
                onClick={() => {
                  onChange?.('')
                  setOpen(false)
                }}
              >
                Clear
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}
