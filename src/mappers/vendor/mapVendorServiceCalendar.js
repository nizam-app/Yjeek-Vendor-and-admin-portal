import { ApiError } from '../../api/errors'

/**
 * Map one calendar day from the services calendar API.
 * Sample: { date: "2026-07-10", count: 1, statuses: { confirmed: 1 } }
 */
export function mapVendorServiceCalendarDay(day) {
  if (!day || typeof day !== 'object' || !day.date) {
    throw new ApiError({ message: 'Invalid services calendar day from the server.' })
  }

  const statuses =
    day.statuses && typeof day.statuses === 'object' && !Array.isArray(day.statuses)
      ? Object.fromEntries(
          Object.entries(day.statuses)
            .map(([key, value]) => [String(key), Number(value) || 0])
            .filter(([, count]) => count > 0),
        )
      : {}

  return {
    date: String(day.date),
    count: Number(day.count) || 0,
    statuses,
  }
}

/**
 * Normalize services calendar response for month grid UI.
 * Confirmed shape:
 * { month: "2026-07", totalBookings: 1, days: [{ date, count, statuses }] }
 */
export function mapVendorServiceCalendarResponse(data) {
  if (!data || typeof data !== 'object') {
    throw new ApiError({ message: 'Invalid services calendar response from the server.' })
  }

  // Legacy mock shape: { calendar: { counts }, days }
  if (data.calendar && typeof data.calendar === 'object' && data.calendar.counts) {
    const counts = data.calendar.counts
    const days = Object.entries(counts).map(([date, count]) => ({
      date,
      count: Number(count) || 0,
      statuses: {},
    }))
    return {
      month: data.calendar.month || null,
      totalBookings: days.reduce((sum, day) => sum + day.count, 0),
      days,
      countsByDate: Object.fromEntries(days.map((day) => [day.date, day.count])),
      daysByDate: Object.fromEntries(days.map((day) => [day.date, day])),
    }
  }

  if (!Array.isArray(data.days)) {
    throw new ApiError({ message: 'Invalid services calendar response from the server.' })
  }

  const days = data.days
    .map((item) => {
      try {
        return mapVendorServiceCalendarDay(item)
      } catch {
        return null
      }
    })
    .filter(Boolean)

  return {
    month: data.month != null ? String(data.month) : null,
    totalBookings: Number(data.totalBookings) || days.reduce((sum, day) => sum + day.count, 0),
    days,
    countsByDate: Object.fromEntries(days.map((day) => [day.date, day.count])),
    daysByDate: Object.fromEntries(days.map((day) => [day.date, day])),
  }
}

export const emptyVendorServiceCalendar = {
  month: null,
  totalBookings: 0,
  days: [],
  countsByDate: {},
  daysByDate: {},
}
