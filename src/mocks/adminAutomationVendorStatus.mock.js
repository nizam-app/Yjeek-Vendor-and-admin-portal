/** Frontend reference data for Automation → Vendor Status (read-only). */

export function getVendorStatusMock() {
  return {
    header: {
      title: 'Vendor Status Rules',
      subtitle: 'How vendor status affects checkout · all statuses remain visible in customer search',
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
          id: 'open',
          label: 'Open',
          dotColor: '#16a34a',
          setBy: 'System — based on opening_time',
          customerSees: 'No banner',
          checkoutAllowed: true,
          scheduledAllowed: true,
        },
        {
          id: 'busy',
          label: 'Busy',
          dotColor: '#d97706',
          setBy: 'Vendor sets manually in Vendor App',
          customerSees: '"Busy" badge',
          checkoutAllowed: false,
          scheduledAllowed: false,
        },
        {
          id: 'last-order-reached',
          label: 'Last Order Reached',
          dotColor: '#6b7280',
          setBy: 'System — based on last_order_cutoff',
          customerSees: '"Closed for now"',
          checkoutAllowed: false,
          scheduledAllowed: false,
        },
        {
          id: 'closed',
          label: 'Closed',
          dotColor: '#dc2626',
          setBy: 'System — based on closing_time',
          customerSees: '"Closed" badge',
          checkoutAllowed: false,
          scheduledAllowed: false,
        },
        {
          id: 'temporarily-closed',
          label: 'Temporarily Closed',
          dotColor: '#7c3aed',
          setBy: 'Vendor or Ops sets manually',
          customerSees: '"Temporarily Closed"',
          checkoutAllowed: false,
          scheduledAllowed: false,
        },
      ],
    },
    timeFields: {
      title: 'Vendor time fields — three separate fields, per day of week',
      subtitle: 'Set per vendor · per day · last_order_cutoff ≠ closing_time',
      criticalNotice: {
        label: 'Critical distinction',
        body: 'opening_time, last_order_cutoff, and closing_time are three distinct database fields. last_order_cutoff must never default to closing_time. A vendor closing at 23:00 may stop accepting delivery orders at 22:00 — that gap is vendor-defined.',
      },
      fields: [
        {
          id: 'opening_time',
          key: 'opening_time',
          description: 'When vendor starts accepting on-demand and scheduled orders',
          badge: 'Set per vendor · per day',
          badgeTone: 'on',
        },
        {
          id: 'last_order_cutoff',
          key: 'last_order_cutoff',
          description: 'Latest time for new order placement · triggers "Closed for now" status',
          badge: 'Default: 1hr before closing',
          badgeTone: 'warn',
        },
        {
          id: 'closing_time',
          key: 'closing_time',
          description: 'When vendor closes · upper bound for scheduled order delivery windows',
          badge: 'Set per vendor · per day',
          badgeTone: 'on',
        },
      ],
    },
  }
}
