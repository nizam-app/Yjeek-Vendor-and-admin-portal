export const adminDashboardMock = {
  summary: [
    { value: '12', label: 'Pending' },
    { value: '8', label: 'Accepted' },
    { value: '15', label: 'Preparing' },
    { value: '6', label: 'Ready' },
    { value: '22', label: 'Picked up' },
    { value: '140', label: 'Delivered' },
    { value: '3', label: 'Cancelled', tone: 'red' },
    { value: '80', label: 'Online Vendor' },
    { value: '28', label: 'Online Champ' },
  ],
  map: {
    tabs: ['Champs', 'Orders', 'Vendors', 'Zones', 'Heatmap'],
    activeTabs: ['Champs', 'Orders', 'Vendors'],
    legend: [
      { label: 'Idle / light', color: '#35b86a' },
      { label: 'Busy 3–4', color: '#e1a128' },
      { label: 'Overloaded', color: '#d94748' },
      { label: 'Vendor open', color: '#3979ba' },
    ],
    scopeNote: 'Map scope auto-applies from your access (country / region / zone).',
  },
  incidents: [
    { priority: 'P1', title: 'Food poisoning report', detail: '#YJK-…2YK · resolved', tone: 'red' },
    { priority: 'P2', title: 'Damaged bag', detail: '#YJK-…7VZ · resolved', tone: 'yellow' },
    { priority: 'P3', title: 'Vendor ghost', detail: '#YJK-…0YB · resolved', tone: 'blue' },
    { priority: 'P2', title: 'Spilled order', detail: '#YJK-…KXE · resolved', tone: 'yellow' },
    { priority: 'P4', title: 'Missing extras', detail: '#YJK-…QF2 · resolved', tone: 'gray' },
  ],
  slaColumns: [
    {
      title: 'Critical',
      count: 34,
      tone: 'red',
      orders: [
        { id: 'YJK-…2YKZ9VF', detail: 'Green Kitchen · Ready', timeLeft: '41m' },
        { id: 'YJK-…7VZSSWC5', detail: 'Lulu Express · Ready', timeLeft: '38m' },
      ],
    },
    {
      title: 'At Risk',
      count: 7,
      tone: 'yellow',
      orders: [
        { id: 'YJK-…0YBIGQHT', detail: 'Sharaf DG · Accepted', timeLeft: '12m' },
        { id: 'YJK-…KXEQWHMP', detail: 'VEERA · Accepted', timeLeft: '9m' },
      ],
    },
    { title: 'On Track', count: 0, tone: 'green', orders: [] },
  ],
}

export const adminChatsMock = [
  { id: 'chat-ahmed', initials: 'AK', name: 'Ahmed K.', role: 'Champ', message: 'I will be 5 min late', unreadCount: 2 },
  { id: 'chat-aisha', initials: 'AM', name: 'Aisha Mohammed', role: 'Customer', message: 'Can I get a partial refund?', unreadCount: 1 },
  { id: 'chat-yousif', initials: 'Y', name: 'Yousif', role: 'Champ', message: 'Order picked up', unreadCount: 0 },
]

export const adminLiveOrdersMock = {
  activeOrderCount: 41,
  refreshIntervalSeconds: 3,
  filters: ['All orders', 'All chats', 'Chat · Champ', 'Chat · Customer'],
  columns: [
    {
      id: 'critical',
      title: 'Critical',
      count: 34,
      tone: 'red',
      orders: [
        { id: 'YJK…2YKZ9VF', vendor: 'Green Kitchen', temperature: 'Hot food', timeLeft: '41m', state: 'Preparing', hasIncident: true, contactType: 'Champ', rider: { name: 'Taha F.' } },
        { id: 'YJK…7VZSSWC5', vendor: 'Lulu Express', temperature: 'Hot food', timeLeft: '38m', state: 'Ready for pickup...', hasIncident: true, contactType: 'Customer', rider: { name: 'Ahmed' } },
        { id: 'YJK…9QTBM', vendor: 'Marine & Co.', temperature: 'Hot food', timeLeft: '22m', state: 'Preparing · Mariam', hasIncident: true, contactType: 'Champ', rider: { name: 'Mahmood' } },
      ],
    },
    {
      id: 'at-risk',
      title: 'At Risk',
      count: 7,
      tone: 'yellow',
      orders: [
        { id: 'YJK…0YBIGQHT', vendor: 'Sharaf DG', temperature: 'Hot food', timeLeft: '12m', state: 'Preparing', hasIncident: true, contactType: 'Customer', rider: { name: 'majid F.' } },
        { id: 'YJK…KXEQWHMP', vendor: 'VEERA', temperature: 'Hot food', timeLeft: '9m', state: 'Ready for pickup...', hasIncident: true, rider: { name: 'Ali' } },
        { id: '#YJK-…38', vendor: 'VEERA', temperature: 'Normal', schedule: 'Next Day', timeLeft: '25m', state: 'On the way...', hasIncident: true, rider: { name: 'Bander' } },
      ],
    },
    {
      id: 'on-track',
      title: 'On Track',
      count: 0,
      tone: 'green',
      orders: [
        { id: '#YJK-…38', vendor: 'Lulu Express → Manama', temperature: 'Normal', schedule: 'Next Day', timeLeft: '1m', state: 'Picked up', rider: { name: 'Omar F.' } },
        { id: 'YJK…KXEQWHMP', vendor: 'VEERA', temperature: 'Hot food', timeLeft: '2m', state: 'On the way...', rider: { name: 'Mahmood' } },
      ],
    },
  ],
  incidents: [
    { id: 'incident-food', priority: 'P1', title: 'Food poisoning report', detail: '#YJK-…2YK · resolved', tone: 'red' },
    { id: 'incident-bag', priority: 'P2', title: 'Damaged bag', detail: '#YJK-…7VZ · resolved', tone: 'yellow' },
    { id: 'incident-ghost', priority: 'P3', title: 'Vendor ghost', detail: '#YJK-…0YB · resolved', tone: 'blue' },
    { id: 'incident-spill', priority: 'P2', title: 'Spilled order', detail: '#YJK-…KXE · resolved', tone: 'yellow' },
    { id: 'incident-extras', priority: 'P4', title: 'Missing extras', detail: '#YJK-…QF2 · resolved', tone: 'gray' },
    { id: 'incident-fraud', priority: 'P1', title: 'Fraud flag', detail: '#YJK-…11C · resolved', tone: 'red' },
  ],
  chats: adminChatsMock,
}

export const adminOperationsMock = {
  columns: [
    { key: 'new', title: 'New', tone: '#20b665' },
    { key: 'response', title: 'Awaiting champ response', tone: '#dfa52b' },
    { key: 'confirmation', title: 'Awaiting champ confirmation', tone: '#dfa52b' },
    { key: 'confirmed', title: 'Confirmed', tone: '#20b665' },
  ],
  orders: [
    { id: '#YJK-…62', tags: ['★ Special', 'Standard'], payment: 'Paid · Ready for dispatch', route: 'The Green Kitchen → Seef', action: 'Assign date · time · champ', actionTone: 'green', column: 'new' },
    { id: '#YJK-…63', tags: ['Normal', 'Same Day'], payment: 'Accepted · Awaiting payment', route: 'Lulu Express → Manama', timer: '⌛ 4 min to Pay', column: 'new' },
    { id: '#YJK-…64', tags: ['Normal', 'Next Day'], payment: 'Awaiting vendor', route: 'VEERA → Juffair', timer: '⌛ 4 min to accept', column: 'new' },
    { id: '#YJK-…64', tags: ['★ Special', 'Economy'], payment: 'Time expired · vendor didn’t accept', route: 'VEERA → Juffair', action: 'Order Auto Cancelled', actionTone: 'redSoft', column: 'new' },
    { id: '#YJK-…62', tags: ['★ Special', 'Standard'], payment: 'Awaiting', route: 'VEERA → Juffair', slot: '30 Jun · 1–3 PM', champ: 'Ahmed K.', action: 'Remind champ', timer: '⌛ 47 min to confirm', column: 'response' },
    { id: '#YJK-…63', tags: ['Normal', 'Same Day'], payment: 'Declined', route: 'Sharaf DG → Adliya', slot: '01 Jul · 1–3 PM', champ: 'Omar F.', action: 'Reassign champ', actionTone: 'red', column: 'response' },
    { id: '#YJK-…57', tags: ['★ Special', 'Next Day'], payment: 'Time expired · champ didn’t accept', route: 'Sharaf DG → Adliya', slot: '01 Jul · 1–3 PM', champ: 'Omar F.', action: 'Reassign champ', actionTone: 'red', column: 'response' },
    { id: '#YJK-…50', tags: ['Normal', 'Economy'], payment: 'Awaiting', route: 'VEERA → Juffair', slot: '30 Jun · 1–3 PM', champ: 'Ahmed K.', action: 'Remind champ', timer: '⌛ 12 min to confirm', column: 'confirmation' },
    { id: '#YJK-…57', tags: ['Normal', 'Standard'], payment: 'Declined', route: 'Sharaf DG → Adliya', slot: '01 Jul · 1–3 PM', champ: 'Omar F.', action: 'Reassign champ', actionTone: 'red', column: 'confirmation' },
    { id: '#YJK-…57', tags: ['★ Special', 'Same Day'], payment: 'Time expired · champ didn’t accept', route: 'Sharaf DG → Adliya', slot: '01 Jul · 1–3 PM', champ: 'Omar F.', action: 'Reassign champ', actionTone: 'red', column: 'confirmation' },
    { id: '#YJK-…50', tags: ['Normal', 'Next Day'], payment: 'Preparing', route: 'VEERA → Juffair', slot: '30 Jun · 1–3 PM', champ: 'Ahmed K.', action: '◷ Opens in 2h 10m', actionTone: 'blue', note: 'Tracking in 10m · auto-moves to before window', column: 'confirmed' },
    { id: '#YJK-…55', tags: ['Normal', 'Economy'], payment: 'Ready for pickup', route: 'Lulu Express → Seef', slot: '30 Jun · 6–8 PM', champ: 'Yusuf R.', action: '◷ Opens in 4h 50m', actionTone: 'blue', note: 'Tracking in 3h 50m · auto-moves to before window', footer: 'Force pickup now', column: 'confirmed' },
  ],
  incidents: [
    { priority: 'P1', name: 'Champ no-show', detail: '#YJK-…57 · 01–PM window', status: 'Open', time: '5m ago' },
    { priority: 'P2', name: 'Missed re-confirm', detail: '#YJK-…52 · auto-released & re-offered', status: 'Resolved', time: '20m ago' },
    { priority: 'P2', name: 'Vendor late prep', detail: '#YJK-…40 · prep above SLA', status: 'Open', time: '12m ago' },
    { priority: 'P3', name: 'Customer reschedule', detail: '#YJK-…31 · moved to next window', status: 'Resolved', time: '1h ago' },
  ],
  chats: adminChatsMock,
}

export const adminManagementMock = {
  vendors: {
    title: 'Vendors', subtitle: 'Onboard, review and manage every partner on Yjeek', action: 'Add vendor',
    stats: [{ label: 'Total vendors', value: '248' }, { label: 'Active', value: '184' }, { label: 'Under review', value: '16' }, { label: 'Paused', value: '12' }],
    columns: ['Vendor', 'Category', 'Stores', 'GMV this month', 'Commission', 'Status'],
    rows: [
      ['The Green Kitchen', 'Healthy food', '4', 'BHD 12,840', '18%', 'Active'],
      ['Burger Lab', 'Burgers', '7', 'BHD 21,405', '20%', 'Active'],
      ['Casa Mexicana', 'Mexican', '2', 'BHD 8,920', '18%', 'Under review'],
      ['Healthy Bowl', 'Healthy food', '3', 'BHD 9,140', '16%', 'Paused'],
    ],
  },
  stores: {
    title: 'Stores', subtitle: 'Monitor branch availability, menus and operational health', action: 'Add store',
    stats: [{ label: 'Total stores', value: '412' }, { label: 'Open now', value: '326' }, { label: 'Busy', value: '38' }, { label: 'Offline', value: '48' }],
    columns: ['Store', 'Vendor', 'Area', 'Orders today', 'Prep time', 'Status'],
    rows: [
      ['Green Kitchen · Seef', 'The Green Kitchen', 'Seef', '86', '18 min', 'Open'],
      ['Burger Lab · Juffair', 'Burger Lab', 'Juffair', '112', '24 min', 'Busy'],
      ['Casa Mexicana · Adliya', 'Casa Mexicana', 'Adliya', '54', '20 min', 'Open'],
      ['Healthy Bowl · Riffa', 'Healthy Bowl', 'Riffa', '0', '—', 'Offline'],
    ],
  },
  fleet: {
    title: 'Fleet', subtitle: 'Champ availability, assignment and compliance', action: 'Add champ',
    stats: [{ label: 'Total champs', value: '326' }, { label: 'Online', value: '96' }, { label: 'On delivery', value: '74' }, { label: 'Documents due', value: '9' }],
    columns: ['Champ', 'Phone', 'Zone', 'Today', 'Rating', 'Status'],
    rows: [
      ['Ahmed Khalil', '+973 36 123 456', 'Seef', '14 orders', '4.9', 'On delivery'],
      ['Noora Faisal', '+973 39 456 221', 'Manama', '11 orders', '4.8', 'Available'],
      ['Sami Rahman', '+973 33 821 902', 'Riffa', '9 orders', '4.7', 'Available'],
      ['Yousif Ali', '+973 37 665 102', 'Juffair', '12 orders', '4.6', 'Offline'],
    ],
  },
  customers: {
    title: 'Customers', subtitle: 'Customer activity, segments and service history', action: 'Create segment',
    stats: [{ label: 'Customers', value: '48.2k' }, { label: 'Active this month', value: '21.4k' }, { label: 'New this week', value: '1,248' }, { label: 'Avg. order', value: 'BHD 12.4' }],
    columns: ['Customer', 'Segment', 'Orders', 'Lifetime value', 'Last order', 'Status'],
    rows: [
      ['Aisha Mohammed', 'VIP', '86', 'BHD 1,340', 'Today, 12:42', 'Active'],
      ['Mohammed Ahmed', 'Frequent', '42', 'BHD 684', 'Yesterday', 'Active'],
      ['Fatima Ali', 'New', '2', 'BHD 38', '18 Jul', 'Active'],
      ['Yousif Hasan', 'At risk', '18', 'BHD 291', '21 Jun', 'Inactive'],
    ],
  },
  marketing: {
    title: 'Marketing campaigns', subtitle: 'Promotions, placements and customer engagement', action: 'New campaign',
    stats: [{ label: 'Active campaigns', value: '18' }, { label: 'Redemptions', value: '12.8k' }, { label: 'Revenue influenced', value: 'BHD 42k' }, { label: 'Avg. ROI', value: '4.2×' }],
    columns: ['Campaign', 'Audience', 'Budget', 'Redemptions', 'Ends', 'Status'],
    rows: [
      ['Weekend Feast', 'All customers', 'BHD 2,000', '2,842', '20 Jul', 'Active'],
      ['Welcome Bahrain', 'New customers', 'BHD 1,200', '1,406', '31 Jul', 'Active'],
      ['Green Week', 'Healthy segment', 'BHD 800', '940', '22 Jul', 'Scheduled'],
      ['Ramadan Rewards', 'All customers', 'BHD 4,500', '8,210', 'Ended', 'Completed'],
    ],
  },
  'sla-models': {
    title: 'SLA models', subtitle: 'Configure service targets by order type, zone and vendor', action: 'Create SLA model',
    stats: [{ label: 'SLA models', value: '14' }, { label: 'Orders in SLA', value: '91.8%' }, { label: 'Warnings today', value: '38' }, { label: 'Breaches today', value: '12' }],
    columns: ['Model', 'Applies to', 'Accept', 'Prepare', 'Deliver', 'Status'],
    rows: [
      ['Standard delivery', 'All zones', '5 min', '25 min', '35 min', 'Active'],
      ['Express · Seef', 'Seef zone', '3 min', '15 min', '20 min', 'Active'],
      ['Scheduled orders', 'All scheduled', '10 min', '30 min', '—', 'Active'],
      ['Dine-in service', 'Dine-in', '5 min', '20 min', '—', 'Draft'],
    ],
  },
  users: {
    title: 'Admin users', subtitle: 'Control console access, teams and permissions', action: 'Invite user',
    stats: [{ label: 'Users', value: '42' }, { label: 'Active', value: '38' }, { label: 'Teams', value: '7' }, { label: 'Pending invites', value: '4' }],
    columns: ['User', 'Email', 'Team', 'Role', 'Last active', 'Status'],
    rows: [
      ['Sara Ahmed', 'sara@yjeek.com', 'Operations', 'Super Admin', 'Now', 'Active'],
      ['Omar Hasan', 'omar@yjeek.com', 'Vendor success', 'Manager', '12 min ago', 'Active'],
      ['Noora Ali', 'noora@yjeek.com', 'Marketing', 'Editor', '1 hour ago', 'Active'],
      ['Ali Jassim', 'ali@yjeek.com', 'Finance', 'Viewer', 'Invited', 'Pending'],
    ],
  },
  reports: {
    title: 'Reports', subtitle: 'Platform analytics, exports and scheduled reporting', action: 'Create report',
    stats: [{ label: 'Saved reports', value: '24' }, { label: 'Scheduled', value: '8' }, { label: 'Exports this month', value: '142' }, { label: 'Data freshness', value: '< 5 min' }],
    columns: ['Report', 'Category', 'Frequency', 'Owner', 'Last generated', 'Status'],
    rows: [
      ['Daily operations', 'Operations', 'Daily', 'Sara Ahmed', 'Today, 08:00', 'Ready'],
      ['Vendor settlements', 'Finance', 'Weekly', 'Ali Jassim', '15 Jul', 'Ready'],
      ['Champ performance', 'Fleet', 'Weekly', 'Omar Hasan', '14 Jul', 'Ready'],
      ['Campaign ROI', 'Marketing', 'Monthly', 'Noora Ali', '1 Jul', 'Scheduled'],
    ],
  },
}
