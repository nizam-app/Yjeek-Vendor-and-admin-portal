import assert from 'node:assert/strict'
import test from 'node:test'
import {
  mapOpeningHoursToWizardHours,
  mapWizardHoursToOpeningHours,
} from '../src/mappers/admin/mapAdminVendorBranches.js'

test('24-hour day saves as 00:00–23:59 with last order at close', () => {
  const api = mapWizardHoursToOpeningHours({
    Monday: { open: true, mode: '24h', shifts: [{ from: '12:00 AM', to: '11:59 PM' }] },
    Friday: { open: false, mode: 'single', shifts: [] },
  })
  assert.deepEqual(api.mon, { open: '00:00', close: '23:59', lastOrder: '23:59' })
  assert.equal(api.fri, 'closed')
})

test('saved 24-hour day loads back as the 24 hours option', () => {
  const ui = mapOpeningHoursToWizardHours({
    mon: { open: '00:00', close: '23:59', lastOrder: '23:59' },
    tue: { open: '09:00', close: '23:00', lastOrder: '22:30' },
  })
  assert.equal(ui.Monday.mode, '24h')
  assert.equal(ui.Tuesday.mode, 'single')
  assert.equal(ui.Tuesday.shifts[0].from, '9:00 AM')
})

test('a single shift still keeps the 30-minute last-order gap', () => {
  const api = mapWizardHoursToOpeningHours({
    Monday: { open: true, mode: 'single', shifts: [{ from: '9:00 AM', to: '11:00 PM' }] },
  })
  assert.equal(api.mon.open, '09:00')
  assert.equal(api.mon.close, '23:00')
  assert.equal(api.mon.lastOrder, '22:30')
})
