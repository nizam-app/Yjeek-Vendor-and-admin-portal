/**
 * UI copy for Automation → Vendor Status.
 * Documents live Vendor Admin / BranchOperationalStatus + openingHours — not demo data.
 * This tab is informational; nothing is configurable here.
 */

import {
  BRANCH_OPERATIONAL_STATUS,
  OPENING_HOURS_TIME_KEYS,
} from '../../../lib/vendorStatusRules'

export const VENDOR_STATUS_UI = {
  header: {
    title: 'Vendor Status Rules',
    subtitle:
      'Reference · Owned by Vendor Admin / Vendor app · Not configurable in Automation · checkout visibility rules',
  },
  searchBanner: {
    label: 'All statuses show in customer search — none hide the vendor',
    body: 'Every status keeps the vendor visible and browsable. What changes is whether the customer can place an order. Orders of all types — on-demand, same day, next day, standard, economy — are blocked for every non-Open status.',
  },
  statusTable: {
    title: 'Status definitions and checkout rules',
    columns: ['Status', 'Who sets it', 'Customer sees', 'Checkout', 'All scheduled tiers'],
    statuses: [
      {
        id: BRANCH_OPERATIONAL_STATUS.OPEN,
        label: 'Open',
        schema: BRANCH_OPERATIONAL_STATUS.OPEN,
        dotColor: '#16a34a',
        setBy: 'System — based on openingHours.open',
        customerSees: 'No banner',
        checkoutAllowed: true,
        scheduledAllowed: true,
      },
      {
        id: BRANCH_OPERATIONAL_STATUS.BUSY,
        label: 'Busy',
        schema: BRANCH_OPERATIONAL_STATUS.BUSY,
        dotColor: '#d97706',
        setBy: 'Vendor sets manually in Vendor App',
        customerSees: '"Busy" badge',
        checkoutAllowed: false,
        scheduledAllowed: false,
      },
      {
        id: BRANCH_OPERATIONAL_STATUS.LAST_ORDER_REACHED,
        label: 'Last Order Reached',
        schema: BRANCH_OPERATIONAL_STATUS.LAST_ORDER_REACHED,
        dotColor: '#6b7280',
        setBy: 'System — based on openingHours.lastOrder',
        customerSees: '"Closed for now"',
        checkoutAllowed: false,
        scheduledAllowed: false,
      },
      {
        id: BRANCH_OPERATIONAL_STATUS.CLOSED,
        label: 'Closed',
        schema: BRANCH_OPERATIONAL_STATUS.CLOSED,
        dotColor: '#dc2626',
        setBy: 'System — based on openingHours.close',
        customerSees: '"Closed" badge',
        checkoutAllowed: false,
        scheduledAllowed: false,
      },
      {
        id: BRANCH_OPERATIONAL_STATUS.TEMPORARILY_CLOSED,
        label: 'Temporarily Closed',
        schema: BRANCH_OPERATIONAL_STATUS.TEMPORARILY_CLOSED,
        dotColor: '#7c3aed',
        setBy: 'Vendor or Ops sets manually',
        customerSees: '"Temporarily Closed"',
        checkoutAllowed: false,
        scheduledAllowed: false,
      },
    ],
  },
  timeFields: {
    title: 'Vendor time fields — three separate keys, per day of week',
    subtitle:
      'Set per vendor · per branch · per day in Vendor Admin · openingHours.lastOrder ≠ openingHours.close',
    criticalNotice: {
      label: 'Critical distinction',
      body: 'VendorLocation.openingHours stores open, lastOrder, and close as three distinct keys per day. lastOrder must never be treated as the same as close. A vendor closing at 23:00 may stop accepting delivery orders at 22:00 — that gap is vendor-defined on the Vendors page.',
    },
    fields: [
      {
        id: OPENING_HOURS_TIME_KEYS.open,
        key: 'openingHours.open',
        description: 'When vendor starts accepting on-demand and scheduled orders',
        badge: 'Set per vendor · per day',
        badgeTone: 'on',
      },
      {
        id: OPENING_HOURS_TIME_KEYS.lastOrder,
        key: 'openingHours.lastOrder',
        description: 'Latest time for new order placement · triggers Last Order Reached / closed-for-now',
        badge: 'Vendor-defined · ≠ close',
        badgeTone: 'warn',
      },
      {
        id: OPENING_HOURS_TIME_KEYS.close,
        key: 'openingHours.close',
        description: 'When vendor closes · upper bound for scheduled order delivery windows',
        badge: 'Set per vendor · per day',
        badgeTone: 'on',
      },
    ],
  },
}
