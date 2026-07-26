/**
 * Convert between EditBranch UI hours and confirmed Update-branch openingHours.
 *
 * API shape (Postman PATCH Update branch):
 *   { mon: { open: "09:00", lastOrder: "22:30", close: "23:00" }, fri: "closed", ... }
 *
 * UI shape:
 *   { Monday: { open: true, mode: 'single'|'split', shifts: [{ from: '9:00 AM', to: '11:00 PM' }] }, ... }
 */

export const UI_DAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
]

const UI_TO_API_DAY = {
  Monday: 'mon',
  Tuesday: 'tue',
  Wednesday: 'wed',
  Thursday: 'thu',
  Friday: 'fri',
  Saturday: 'sat',
  Sunday: 'sun',
}

const API_TO_UI_DAY = {
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
  sun: 'Sunday',
}

export function defaultUiOpeningHours() {
  return {
    Monday: { open: true, mode: 'single', shifts: [{ from: '9:00 AM', to: '11:00 PM' }] },
    Tuesday: { open: true, mode: 'single', shifts: [{ from: '9:00 AM', to: '11:00 PM' }] },
    Wednesday: {
      open: true,
      mode: 'split',
      shifts: [
        { from: '8:00 AM', to: '12:00 PM' },
        { from: '4:00 PM', to: '10:00 PM' },
      ],
    },
    Thursday: { open: true, mode: 'single', shifts: [{ from: '9:00 AM', to: '11:00 PM' }] },
    Friday: { open: false, mode: 'single', shifts: [] },
    Saturday: { open: true, mode: 'single', shifts: [{ from: '10:00 AM', to: '12:00 AM' }] },
    Sunday: { open: true, mode: 'single', shifts: [{ from: '9:00 AM', to: '11:00 PM' }] },
  }
}

function pad2(n) {
  return String(n).padStart(2, '0')
}

/** "9:00 AM" | "11:00 PM" | "12:00 AM" → "09:00" | "23:00" | "00:00" */
export function to24Hour(time12) {
  const raw = String(time12 || '').trim()
  const match = raw.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
  if (!match) {
    // Already 24h or unknown — pass through if HH:MM
    const h24 = raw.match(/^(\d{1,2}):(\d{2})$/)
    if (h24) return `${pad2(Number(h24[1]))}:${h24[2]}`
    return '09:00'
  }

  let hour = Number(match[1])
  const minute = match[2]
  const period = match[3].toUpperCase()

  if (period === 'AM') {
    if (hour === 12) hour = 0
  } else if (hour !== 12) {
    hour += 12
  }

  return `${pad2(hour)}:${minute}`
}

/** "09:00" → "9:00 AM" */
export function to12Hour(time24) {
  const raw = String(time24 || '').trim()
  const match = raw.match(/^(\d{1,2}):(\d{2})$/)
  if (!match) return '9:00 AM'

  let hour = Number(match[1])
  const minute = match[2]
  const period = hour >= 12 ? 'PM' : 'AM'

  if (hour === 0) hour = 12
  else if (hour > 12) hour -= 12

  return `${hour}:${minute} ${period}`
}

function timeToMinutes(time24) {
  const [h, m] = String(time24 || '00:00')
    .split(':')
    .map((part) => Number(part) || 0)
  return h * 60 + m
}

function minutesToTime(total) {
  const normalized = ((total % (24 * 60)) + 24 * 60) % (24 * 60)
  const hour = Math.floor(normalized / 60)
  const minute = normalized % 60
  return `${pad2(hour)}:${pad2(minute)}`
}

/** Derive lastOrder as 30 minutes before close (clamped so it stays after open when possible). */
function deriveLastOrder(open24, close24) {
  const openMins = timeToMinutes(open24)
  let closeMins = timeToMinutes(close24)
  // Overnight close (e.g. 00:00 after evening open)
  if (closeMins <= openMins) closeMins += 24 * 60

  let lastOrderMins = closeMins - 30
  if (lastOrderMins <= openMins) lastOrderMins = openMins + 30
  if (lastOrderMins >= closeMins) lastOrderMins = closeMins

  return minutesToTime(lastOrderMins)
}

/**
 * UI hours → API openingHours for PATCH Update branch.
 */
export function mapUiHoursToApiOpeningHours(hours) {
  const source = hours && typeof hours === 'object' ? hours : defaultUiOpeningHours()
  const result = {}

  UI_DAYS.forEach((uiDay) => {
    const apiDay = UI_TO_API_DAY[uiDay]
    const day = source[uiDay]
    if (!day?.open || !Array.isArray(day.shifts) || day.shifts.length === 0) {
      result[apiDay] = 'closed'
      return
    }

    const first = day.shifts[0]
    const last = day.shifts[day.shifts.length - 1] || first
    const open = to24Hour(first.from)
    const close = to24Hour(last.to)
    result[apiDay] = {
      open,
      lastOrder: deriveLastOrder(open, close),
      close,
    }
  })

  return result
}

/**
 * API openingHours → UI hours for EditBranch form.
 * Split shifts are not represented in the API — always map open days as single shift.
 */
export function mapApiOpeningHoursToUi(openingHours) {
  const defaults = defaultUiOpeningHours()
  if (!openingHours || typeof openingHours !== 'object') return defaults

  const result = { ...defaults }

  Object.entries(openingHours).forEach(([apiDay, value]) => {
    const uiDay = API_TO_UI_DAY[String(apiDay).toLowerCase()]
    if (!uiDay) return

    if (value === 'closed' || value === null || value === false) {
      result[uiDay] = { open: false, mode: 'single', shifts: [] }
      return
    }

    if (typeof value === 'object' && value.open && value.close) {
      result[uiDay] = {
        open: true,
        mode: 'single',
        shifts: [{ from: to12Hour(value.open), to: to12Hour(value.close) }],
      }
    }
  })

  return result
}
