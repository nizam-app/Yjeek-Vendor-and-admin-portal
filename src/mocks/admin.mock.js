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

const adminIncidentBoardShared = {
  refreshIntervalSeconds: 3,
  filters: ['All orders', 'All chats', 'Chat · Champ', 'Chat · Customer'],
}

export const adminPickupMock = {
  ...adminIncidentBoardShared,
  activeCount: 26,
  activeLabel: 'active pickups',
  columns: [
    {
      id: 'incident',
      title: 'Incident',
      count: 34,
      tone: 'red',
      orders: [
        { id: 'YJK…2YKZ9VF', vendor: 'Green Kitchen', timeLeft: '41m', detail: 'Ready · Ahmed K.', hasIncident: true },
        { id: 'YJK…7VZSSWC5', vendor: 'Lulu Express', timeLeft: '38m', detail: 'Ready · Sara M.', hasIncident: true },
        { id: 'YJK…0YBIGQHT', vendor: 'Sharaf DG', timeLeft: '12m', detail: 'Preparing · Omar F.', hasIncident: true },
        { id: 'YJK…KXEQWHMP', vendor: 'VEERA', timeLeft: '9m', detail: 'Ready · Unassigned', hasIncident: true },
        { id: 'YJK…9QTBM', vendor: 'Marine & Co.', timeLeft: '22m', detail: 'Preparing · Mariam', hasIncident: true },
        { id: 'YJK…4PLX82', vendor: 'Burger Lab', timeLeft: '17m', detail: 'Ready · Unassigned', hasIncident: true },
      ],
    },
    {
      id: 'on-track',
      title: 'On Track',
      count: 0,
      tone: 'green',
      orders: [],
    },
  ],
  incidents: [
    { id: 'pickup-food', priority: 'P1', title: 'Food poisoning report', detail: '#YJK-…2YK · resolved', tone: 'red' },
    { id: 'pickup-bag', priority: 'P2', title: 'Damaged bag', detail: '#YJK-…7VZ · resolved', tone: 'yellow' },
    { id: 'pickup-ghost', priority: 'P3', title: 'Vendor ghost', detail: '#YJK-…0YB · resolved', tone: 'blue' },
    { id: 'pickup-spill', priority: 'P2', title: 'Spilled order', detail: '#YJK-…KXE · resolved', tone: 'yellow' },
    { id: 'pickup-extras', priority: 'P4', title: 'Missing extras', detail: '#YJK-…QF2 · resolved', tone: 'gray' },
    { id: 'pickup-fraud', priority: 'P1', title: 'Fraud flag', detail: '#YJK-…11C · resolved', tone: 'red' },
  ],
  chats: adminChatsMock,
}

export const adminDineInMock = {
  ...adminIncidentBoardShared,
  activeCount: 18,
  activeLabel: 'active dine-in',
  columns: [
    {
      id: 'incident',
      title: 'Incident',
      count: 12,
      tone: 'red',
      orders: [
        { id: 'YJK…DIN8A2K', vendor: 'Cafe Lilou', timeLeft: '28m', detail: 'Seated · Table 4', hasIncident: true },
        { id: 'YJK…DIN3F9P', vendor: 'Bait Al Lulu', timeLeft: '19m', detail: 'Waiting · Table 12', hasIncident: true },
        { id: 'YJK…DIN7M1Q', vendor: 'Villa Mamas', timeLeft: '14m', detail: 'Order delayed · Unassigned', hasIncident: true },
        { id: 'YJK…DIN2R5T', vendor: 'Ishtiraq', timeLeft: '7m', detail: 'No-show risk · Host desk', hasIncident: true },
      ],
    },
    {
      id: 'on-track',
      title: 'On Track',
      count: 6,
      tone: 'green',
      orders: [
        { id: 'YJK…DIN9K4W', vendor: 'The Grove', timeLeft: '35m', detail: 'Seated · Table 2', hasIncident: false },
        { id: 'YJK…DIN6H8C', vendor: 'Fusions', timeLeft: '42m', detail: 'Preparing · Table 8', hasIncident: false },
      ],
    },
  ],
  incidents: [
    { id: 'dine-noshow', priority: 'P1', title: 'Table no-show', detail: '#YJK-…DIN · resolved', tone: 'red' },
    { id: 'dine-allergy', priority: 'P1', title: 'Allergy alert', detail: '#YJK-…DIN · open', tone: 'red' },
    { id: 'dine-wait', priority: 'P2', title: 'Long wait complaint', detail: '#YJK-…DIN · resolved', tone: 'yellow' },
    { id: 'dine-table', priority: 'P3', title: 'Wrong table seated', detail: '#YJK-…DIN · resolved', tone: 'blue' },
    { id: 'dine-bill', priority: 'P4', title: 'Bill dispute', detail: '#YJK-…DIN · resolved', tone: 'gray' },
  ],
  chats: [
    { id: 'chat-dine-1', initials: 'NK', name: 'Noura K.', role: 'Customer', message: 'Our table is still empty', unreadCount: 2 },
    { id: 'chat-dine-2', initials: 'HF', name: 'Hassan F.', role: 'Champ', message: 'Guest arrived at host desk', unreadCount: 0 },
    { id: 'chat-dine-3', initials: 'RM', name: 'Rania M.', role: 'Customer', message: 'Can we move to outdoor?', unreadCount: 1 },
  ],
}

export const adminServicesMock = {
  ...adminIncidentBoardShared,
  activeCount: 9,
  activeLabel: 'active services',
  columns: [
    {
      id: 'incident',
      title: 'Incident',
      count: 5,
      tone: 'red',
      orders: [
        { id: 'YJK…SVC1A9D', vendor: 'Home Cleaning Pro', timeLeft: '55m', detail: 'En route · Late', hasIncident: true },
        { id: 'YJK…SVC4B2E', vendor: 'AC Fix Bahrain', timeLeft: '33m', detail: 'Parts missing · Unassigned', hasIncident: true },
        { id: 'YJK…SVC8C7F', vendor: 'Sparkle Laundry', timeLeft: '21m', detail: 'Pickup missed · Ali R.', hasIncident: true },
      ],
    },
    {
      id: 'on-track',
      title: 'On Track',
      count: 4,
      tone: 'green',
      orders: [
        { id: 'YJK…SVC2D5G', vendor: 'Pet Care Plus', timeLeft: '48m', detail: 'In progress · Sara N.', hasIncident: false },
        { id: 'YJK…SVC6E3H', vendor: 'Move & Pack', timeLeft: '1h 10m', detail: 'Confirmed · Khalid A.', hasIncident: false },
      ],
    },
  ],
  incidents: [
    { id: 'svc-late', priority: 'P1', title: 'Provider running late', detail: '#YJK-…SVC · open', tone: 'red' },
    { id: 'svc-parts', priority: 'P2', title: 'Missing spare parts', detail: '#YJK-…SVC · open', tone: 'yellow' },
    { id: 'svc-cancel', priority: 'P2', title: 'Last-minute cancel', detail: '#YJK-…SVC · resolved', tone: 'yellow' },
    { id: 'svc-access', priority: 'P3', title: 'Building access issue', detail: '#YJK-…SVC · resolved', tone: 'blue' },
    { id: 'svc-payment', priority: 'P4', title: 'Payment mismatch', detail: '#YJK-…SVC · resolved', tone: 'gray' },
  ],
  chats: [
    { id: 'chat-svc-1', initials: 'AR', name: 'Ali R.', role: 'Champ', message: 'Traffic near Seef, 10 min late', unreadCount: 1 },
    { id: 'chat-svc-2', initials: 'SN', name: 'Sara N.', role: 'Champ', message: 'Service started on site', unreadCount: 0 },
    { id: 'chat-svc-3', initials: 'JM', name: 'Jassim M.', role: 'Customer', message: 'Please confirm arrival time', unreadCount: 3 },
  ],
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
    { id: '#YJK-…50', tags: ['★ Special', 'Standard'], payment: 'Awaiting', route: 'VEERA → Juffair', slot: '30 Jun · 1–3 PM', champ: 'Ahmed K.', action: 'Remind champ', prep: '~20 min', column: 'response' },
    { id: '#YJK-…57', tags: ['Normal', 'Same Day'], payment: 'Declined', route: 'Sharaf DG → Adliya', slot: '01 Jul · 1–3 PM', champ: 'Omar F.', action: 'Reassign champ', actionTone: 'red', prep: '~20 min', column: 'response' },
    { id: '#YJK-…57', tags: ['★ Special', 'Next Day'], payment: 'Time expired · champ didn’t accept', route: 'Sharaf DG → Adliya', slot: '01 Jul · 1–3 PM', champ: 'Omar F.', action: 'Reassign champ', actionTone: 'red', prep: '~20 min', column: 'response' },
    { id: '#YJK-…50', tags: ['Normal', 'Economy'], payment: 'Awaiting', route: 'VEERA → Juffair', slot: '30 Jun · 1–3 PM', champ: 'Ahmed K.', action: 'Remind champ', prep: '~20 min', column: 'response' },
    { id: '#YJK-…50', tags: ['★ Special', 'Economy'], payment: 'Awaiting', route: 'VEERA → Juffair', slot: '30 Jun · 1–3 PM', champ: 'Ahmed K.', timer: '⌛ 12 min to confirm', prep: '~20 min', column: 'confirmation' },
    { id: '#YJK-…57', tags: ['Normal', 'Standard'], payment: 'Declined', route: 'Sharaf DG → Adliya', slot: '01 Jul · 1–3 PM', champ: 'Omar F.', action: 'Reassign champ', actionTone: 'red', prep: '~20 min', column: 'confirmation' },
    { id: '#YJK-…57', tags: ['★ Special', 'Same Day'], payment: 'Time expired · champ didn’t accept', route: 'Sharaf DG → Adliya', slot: '01 Jul · 1–3 PM', champ: 'Omar F.', action: 'Reassign champ', actionTone: 'red', prep: '~20 min', column: 'confirmation' },
    { id: '#YJK-…50', tags: ['Normal', 'Next Day'], payment: 'Awaiting', route: 'VEERA → Juffair', slot: '30 Jun · 1–3 PM', champ: 'Ahmed K.', timer: '⌛ 12 min to confirm', prep: '~20 min', column: 'confirmation' },
    { id: '#YJK-…50', tags: ['★ Special', 'Next Day'], payment: 'Preparing', route: 'VEERA → Juffair', slot: '30 Jun · 1–3 PM', champ: 'Ahmed K.', action: '◷ Opens in 2h 10m', actionTone: 'blue', note: 'Tracking in 10m · auto-moves to before window', prep: '~20 min', column: 'confirmed' },
    { id: '#YJK-…55', tags: ['Normal', 'Economy'], payment: 'Ready for pickup', route: 'Lulu Express → Seef', slot: '30 Jun · 6–8 PM', champ: 'Yusuf R.', action: '◷ Opens in 4h 50m', actionTone: 'blue', note: 'Tracking in 3h 50m · auto-moves to before window', footer: 'Force pickup now', prep: '~20 min', column: 'confirmed' },
    { id: '#YJK-…61', tags: ['Normal', 'Standard'], payment: 'Preparing', route: 'Burger Lab → Manama', slot: '30 Jun · 3–5 PM', champ: 'Sara N.', action: '◷ Opens in 1h 20m', actionTone: 'blue', prep: '~25 min', column: 'confirmed' },
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
    title: 'Vendor Management',
    action: 'Add vendor',
    stats: [
      { label: 'Total vendors', value: '48', tone: 'ink' },
      { label: 'Active', value: '39', tone: 'green' },
      { label: 'Pending approval', value: '6', tone: 'orange' },
      { label: 'Suspended', value: '3', tone: 'red' },
    ],
    tabs: ['All', 'Active', 'Pending', 'Suspended'],
    columns: ['Vendor', 'Vendor ID', 'Category', 'Orders', 'Branches', 'Users', 'Rating', 'Status'],
    rows: [
      { name: 'Green Kitchen', id: 'VND-1024', category: 'Hot food', orders: '1,240', branches: '3', users: '12', rating: '4.7', status: 'Active' },
      { name: 'Lulu Express', id: 'VND-1088', category: 'Grocery', orders: '3,802', branches: '8', users: '41', rating: '4.5', status: 'Active' },
      { name: 'Sharaf DG', id: 'VND-1102', category: 'Electronics', orders: '980', branches: '2', users: '18', rating: '4.3', status: 'Draft' },
      { name: 'VEERA', id: 'VND-1145', category: 'Fashion', orders: '640', branches: '1', users: '7', rating: '4.1', status: 'Active' },
      { name: 'Bloom & Co.', id: 'VND-1151', category: 'Flowers', orders: '318', branches: '2', users: '6', rating: '4.6', status: 'Active' },
      { name: 'Marine & Co.', id: 'VND-1160', category: 'Seafood', orders: '420', branches: '2', users: '9', rating: '4.6', status: 'Suspended' },
      { name: 'Burger Lab', id: 'VND-1182', category: 'Fast food', orders: '2,110', branches: '5', users: '22', rating: '4.4', status: 'Active' },
      { name: 'Healthy Bowl', id: 'VND-1199', category: 'Healthy food', orders: '710', branches: '3', users: '11', rating: '4.8', status: 'Pending' },
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

function vendorInitials(name) {
  return String(name || '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || 'V'
}

const GREEN_KITCHEN_BRANCHES = [
  {
    id: 'b1',
    name: 'Manama — Al Seef',
    block: 'Block 436',
    area: 'Manama',
    radius: '5 km',
    eta: '35 min',
    minOrder: 'BHD 3.000',
    hours: '08:00–23:00',
    status: 'Open',
  },
  {
    id: 'b2',
    name: 'Juffair — Road 2401',
    block: 'Block 240',
    area: 'Manama',
    radius: '4 km',
    eta: '30 min',
    minOrder: 'BHD 2.500',
    hours: '08:00–23:00',
    status: 'Open',
  },
  {
    id: 'b3',
    name: 'Riffa — East',
    block: 'Block 911',
    area: 'Riffa',
    radius: '6 km',
    eta: '40 min',
    minOrder: 'BHD 3.500',
    hours: '08:00–23:00',
    status: 'Force-closed',
  },
  {
    id: 'b4',
    name: 'Muharraq — Souq',
    block: 'Block 203',
    area: 'Muharraq',
    radius: '5 km',
    eta: '35 min',
    minOrder: 'BHD 3.000',
    hours: 'Closed today',
    status: 'Closed',
  },
  {
    id: 'b5',
    name: 'Saar — Mall area',
    block: 'Block 525',
    area: 'Saar',
    radius: '5 km',
    eta: '30 min',
    minOrder: 'BHD 3.000',
    hours: '08:00–23:00',
    status: 'Open',
  },
]

function buildVendorBranches(vendorName, branchCount) {
  if (branchCount <= GREEN_KITCHEN_BRANCHES.length) {
    return GREEN_KITCHEN_BRANCHES.slice(0, branchCount)
  }

  return [
    ...GREEN_KITCHEN_BRANCHES,
    ...Array.from({ length: branchCount - GREEN_KITCHEN_BRANCHES.length }, (_, index) => ({
      id: `b-extra-${index + 1}`,
      name: `${vendorName} — Branch ${GREEN_KITCHEN_BRANCHES.length + index + 1}`,
      block: `Block ${100 + index}`,
      area: 'Manama',
      radius: '5 km',
      eta: '35 min',
      minOrder: 'BHD 3.000',
      hours: '08:00–23:00',
      status: 'Open',
    })),
  ]
}

const GREEN_KITCHEN_USERS = [
  {
    id: 'u1',
    name: 'Asmaa Ilsaey',
    email: 'owner@greenkitchen.bh',
    role: 'Vendor admin',
    branch: 'All branches',
    lastActive: '2 min ago',
    status: 'Active',
  },
  {
    id: 'u2',
    name: 'Sara Ali',
    email: 'sara@greenkitchen.bh',
    role: 'Branch manager',
    branch: 'Manama — Al Seef',
    lastActive: '1 h ago',
    status: 'Active',
  },
  {
    id: 'u3',
    name: 'Yousif Hasan',
    email: 'yousif@greenkitchen.bh',
    role: 'Operation staff',
    branch: 'Manama — Al Seef',
    lastActive: 'Today',
    status: 'Active',
  },
  {
    id: 'u4',
    name: 'Noora Faisal',
    email: 'noora@greenkitchen.bh',
    role: 'Branch manager',
    branch: 'Riffa — East',
    lastActive: 'Today',
    status: 'Active',
  },
  {
    id: 'u5',
    name: 'Omar Khalid',
    email: 'omar@greenkitchen.bh',
    role: 'Operation staff',
    branch: 'Juffair — Road 2401',
    lastActive: '3 d ago',
    status: 'Active',
  },
  {
    id: 'u6',
    name: 'Laila Ahmed',
    email: 'laila@greenkitchen.bh',
    role: 'Operation staff',
    branch: 'Saar — Mall area',
    lastActive: '3 d ago',
    status: 'Active',
  },
  {
    id: 'u7',
    name: 'Fatima Hassan',
    email: 'fatima@greenkitchen.bh',
    role: 'Branch manager',
    branch: 'Muharraq — Souq',
    lastActive: '1 d ago',
    status: 'Active',
  },
  {
    id: 'u8',
    name: 'Hassan Mahmood',
    email: 'hassan@greenkitchen.bh',
    role: 'Operation staff',
    branch: 'Riffa — East',
    lastActive: '—',
    status: 'Active',
  },
]

function buildVendorUsers(userCount) {
  if (userCount <= GREEN_KITCHEN_USERS.length) {
    return GREEN_KITCHEN_USERS.slice(0, userCount)
  }

  return [
    ...GREEN_KITCHEN_USERS,
    ...Array.from({ length: userCount - GREEN_KITCHEN_USERS.length }, (_, index) => ({
      id: `u-extra-${index + 1}`,
      name: `Staff member ${GREEN_KITCHEN_USERS.length + index + 1}`,
      email: `staff${GREEN_KITCHEN_USERS.length + index + 1}@greenkitchen.bh`,
      role: 'Operation staff',
      branch: 'All branches',
      lastActive: '—',
      status: 'Active',
    })),
  ]
}

const DELIVERY_ZONE_DEFAULTS = {
  radiusKm: '5',
  etaMin: '35',
  minOrder: '2.000',
  deliveryContribution: '0.300',
  freeDeliveryOver: '8.000',
  freeDeliveryEnabled: true,
  maxDistanceKm: '8',
  extraContributionPerKm: '0.100',
  maxContribution: '0.800',
}

const DELIVERY_BRANCH_OVERRIDES = [
  { id: 'dz1', name: 'Manama — Al Seef', radius: '5 km', eta: '35 min', minOrder: 'BHD 3.000', deliveryFee: 'BHD 0.800' },
  { id: 'dz2', name: 'Riffa — Bu Kuwarah', radius: '6 km', eta: '40 min', minOrder: 'BHD 3.000', deliveryFee: 'BHD 1.000' },
  { id: 'dz3', name: 'Muharraq — Busaiteen', radius: '5 km', eta: '35 min', minOrder: 'BHD 2.500', deliveryFee: 'BHD 0.800' },
  { id: 'dz4', name: 'Hidd — Industrial', radius: '4 km', eta: '30 min', minOrder: 'BHD 4.000', deliveryFee: 'BHD 1.200' },
  { id: 'dz5', name: 'Isa Town — Central', radius: '5 km', eta: '35 min', minOrder: 'BHD 3.000', deliveryFee: 'BHD 0.800' },
]

function buildVendorDeliveryZones(branches) {
  const overrides = DELIVERY_BRANCH_OVERRIDES.slice(0, branches.length)

  if (branches.length > DELIVERY_BRANCH_OVERRIDES.length) {
    overrides.push(
      ...branches.slice(DELIVERY_BRANCH_OVERRIDES.length).map((branch) => ({
        id: branch.id,
        name: branch.name,
        radius: `${DELIVERY_ZONE_DEFAULTS.radiusKm} km`,
        eta: `${DELIVERY_ZONE_DEFAULTS.etaMin} min`,
        minOrder: `BHD ${DELIVERY_ZONE_DEFAULTS.minOrder}`,
        deliveryFee: `BHD ${DELIVERY_ZONE_DEFAULTS.deliveryContribution}`,
      })),
    )
  }

  return {
    defaults: { ...DELIVERY_ZONE_DEFAULTS },
    overrides,
  }
}

function buildVendorPromotions() {
  return [
    {
      id: 'p1',
      name: 'Ramadan 20% Off',
      type: '% off',
      scope: 'All branches',
      period: '1–30 Ramadan',
      used: 420,
      status: 'Active',
      detailType: 'Percentage off (20%)',
      discountCap: 'BHD 3.000',
      minOrder: 'BHD 5.000',
      detailScope: 'All branches · entire menu',
      detailPeriod: '22–30 Mar 2026',
      eligibility: 'Everyone · code RAMADAN20',
      usedLabel: '420 of 1000',
    },
    {
      id: 'p2',
      name: 'Free Delivery Weekend',
      type: 'Free delivery',
      scope: 'All branches',
      period: 'Fri–Sat',
      used: 310,
      status: 'Active',
      detailType: 'Free delivery',
      discountCap: '—',
      minOrder: 'BHD 5.000',
      detailScope: 'All branches',
      detailPeriod: 'Fri–Sat',
      eligibility: 'Everyone',
      usedLabel: '310 of 2000',
    },
    {
      id: 'p3',
      name: 'Buy 1 Get 1 Burger',
      type: 'BOGO',
      scope: 'Manama, Riffa',
      period: 'Starts 1 Jul',
      used: 0,
      status: 'Scheduled',
      detailType: 'Buy X Get Y',
      discountCap: '—',
      minOrder: '—',
      detailScope: 'Manama, Riffa · selected items',
      detailPeriod: 'Starts 1 Jul 2026',
      eligibility: 'Everyone',
      usedLabel: '0 of 1000',
    },
    {
      id: 'p4',
      name: 'First Order Free Delivery',
      type: 'Free delivery',
      scope: 'All branches',
      period: 'Ongoing',
      used: 240,
      status: 'Active',
      detailType: 'Free delivery',
      discountCap: '—',
      minOrder: 'BHD 3.000',
      detailScope: 'All branches',
      detailPeriod: 'Ongoing',
      eligibility: 'New customers',
      usedLabel: '240 of 5000',
    },
    {
      id: 'p5',
      name: 'Pizza Combo Deal',
      type: 'Item deal',
      scope: 'Manama — Al Seef',
      period: '1–10 Apr',
      used: 502,
      status: 'Ended',
      detailType: 'Item / category deal',
      discountCap: 'BHD 2.000',
      minOrder: 'BHD 4.000',
      detailScope: 'Manama — Al Seef · selected items',
      detailPeriod: '1–10 Apr 2026',
      eligibility: 'Everyone',
      usedLabel: '502 of 800',
    },
  ]
}

/** Build per-vendor detail payload from the vendors list row (demo). */
export function buildAdminVendorDetail(vendorId) {
  const row = adminManagementMock.vendors.rows.find((item) => item.id === vendorId)
    || adminManagementMock.vendors.rows[0]
  const isDemoKitchen = row.id === 'VND-1024'
  const branchCount = isDemoKitchen ? 5 : (Number(String(row.branches).replace(/,/g, '')) || 1)
  const userCount = isDemoKitchen ? 8 : (Number(String(row.users).replace(/,/g, '')) || 1)
  const isActive = row.status === 'Active'
  const branches = buildVendorBranches(row.name, branchCount)
  const users = buildVendorUsers(userCount)
  const deliveryZones = buildVendorDeliveryZones(branches)
  const promotions = buildVendorPromotions()

  return {
    id: row.id,
    name: row.name,
    initials: vendorInitials(row.name),
    status: row.status,
    storeType: 'Food & Beverage',
    category: row.category,
    rating: row.rating,
    branchesLabel: `${branchCount} branches`,
    legalName: `${row.name} W.L.L`,
    delivery: 'Radius 5 km · ETA 35 min · min BHD 3.000',
    storeOnline: isActive,
    storeOnlineHint: isActive ? 'Visible & accepting orders' : 'Hidden from customers',
    dispatchMode: 'Auto-dispatch',
    metrics: [
      { label: 'Orders (30d)', value: isDemoKitchen ? '1,284' : row.orders },
      { label: 'GMV (30d)', value: 'BHD 8,940' },
      { label: 'Avg rating', value: row.rating, star: true, tone: 'green' },
      { label: 'Active branches', value: `${branchCount} / ${branchCount}`, tone: 'green' },
      { label: 'Open issues', value: isActive ? '2' : '0', tone: isActive ? 'orange' : 'ink' },
    ],
    tabs: ['Overview', 'Branches', 'Users & staff', 'Delivery zones', 'Promotions', 'Commission & fees', 'SLA'],
    branches,
    users,
    deliveryZones,
    promotions,
  }
}

