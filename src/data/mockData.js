export const vendor = {
  name: 'Green Kitchen',
  role: 'Group admin',
  adminName: 'Green Kitchen Admin',
  adminRole: 'vendor_admin',
  email: 'admin@greenkitchen.bh',
}

export const kpis = [
  { label: 'Revenue (Day)', value: '842.500', prefix: 'BHD', delta: '12% vs prev' },
  { label: 'Completed', value: '128', delta: '8% vs prev' },
  { label: 'Active Now', value: '6' },
  { label: 'Rejected', value: '2' },
  { label: 'Cancelled', value: '3' },
  { label: 'Acceptance', value: '97.0%' },
  { label: 'Avg Prep', value: '14 min' },
]

export const revenueDays = [
  { day: 'TUE', height: 42 },
  { day: 'WED', height: 58 },
  { day: 'THU', height: 48 },
  { day: 'FRI', height: 78 },
  { day: 'SAT', height: 92 },
  { day: 'SUN', height: 70 },
  { day: 'MON', height: 55 },
]

export const topSellers = [
  { name: 'Chicken Shawarma', sold: 64 },
  { name: 'Gourmet Mezze Platter', sold: 41 },
  { name: 'Lamb Ouzi', sold: 33 },
  { name: 'Fresh Juice — Large', sold: 28 },
]

export const recentOrders = [
  { id: '#YJK-…58', type: 'Delivery', status: 'Preparing', branch: 'Manama', total: '11.000 BHD' },
  { id: '#YJK-…57', type: 'Delivery', status: 'Ready', branch: 'Seef', total: '28.800 BHD' },
  { id: '#YJK-…42', type: 'Dine-in', status: 'Completed', branch: 'Adliya', total: '20.500 BHD' },
  { id: '#YJK-…41', type: 'Delivery', status: 'Delivered', branch: 'Manama', total: '9.600 BHD' },
  { id: '#YJK-…38', type: 'Delivery', status: 'Cancelled', branch: 'Seef', total: '14.500 BHD' },
]

export const liveOrders = {
  new: [
    {
      id: '#YJK-…61',
      total: '5.400 BHD',
      items: '2× Chicken Shawarma · 1× Fresh Juice',
      customer: 'Demo Customer · just now',
      sla: '0:48',
      branch: 'Green Kitchen — Manama',
      customerName: 'Demo Customer',
      customerPhone: '+973 3300 0000',
      address: 'Home • Adliya, Bldg 23, Road 3825, Flat 83',
      orderType: 'Delivery · On Demand',
      prepTimeRequired: '20 mins',
      customerNote: "Extra garlic sauce, no pickles. Please call on arrival.",
      itemsList: [
        { qty: 2, name: 'Chicken Shawarma', price: '3.000 BHD' },
        { qty: 1, name: 'Fresh Juice — Large', price: '2.000 BHD' },
        { qty: 1, name: 'Baklava Box', price: '0.400 BHD' },
      ],
    },
    {
      id: '#YJK-…73',
      total: '6.200 BHD',
      items: '1× Burger Combo · 1× Fries',
      customer: 'Ali H. · just now',
      sla: '0:48',
      type: 'Pickup',
    },
    {
      id: '#YJK-…56',
      total: '3.200 BHD',
      items: '1× Falafel Wrap · 1× Soda',
      customer: 'Demo Customer · 4 min ago',
      status: 'rejected',
      reason: 'Out of stock',
    },
  ],
  accepted: [
    {
      id: '#YJK-…59',
      total: '11.000 BHD',
      items: '1× Gourmet Mezze Platter',
      customer: 'Sara A. · 1 min ago',
    },
  ],
  preparing: [
    {
      id: '#YJK-…57',
      total: '15.000 BHD',
      items: '3× Lamb Ouzi',
      customer: 'Ahmed K. · 6 min',
      prepTime: '07:12',
    },
    {
      id: '#YJK-…55',
      total: '9.600 BHD',
      items: '1× Mixed Grill',
      customer: 'Mariam · 11 min',
      prepTime: '18:40',
      prepDelay: true,
      type: 'Pickup',
    },
    {
      id: '#YJK-…70',
      total: '4.100 BHD',
      items: '3× Lamb Ouzi',
      customer: 'Ahmed K. · 6 min',
      prepTime: '07:12',
      type: 'Pickup',
    },
  ],
  ready: [
    {
      id: '#YJK9PCSSGHS',
      total: '11.000 BHD',
      items: '2× Macarons Box',
      customer: 'Demo Customer · 12:57 PM',
      readyLabel: 'Ready · awaiting champ',
      handoverLabel: 'Handover to champ',
      handoverType: 'champ',
      champName: 'Ahmed Ali',
    },
    {
      id: '#YJK-…66',
      total: '3.500 BHD',
      items: '2× Macarons Box',
      customer: 'Yousef A. · awaiting collection',
      readyLabel: 'Ready · awaiting customer',
      handoverLabel: 'Handover to customer',
      noShow: true,
      type: 'Pickup',
    },
    {
      id: '#YJK-…47',
      when: 'Today · 11-12 PM',
      status: 'no-show-cancelled',
      note: "Customer didn't arrive within grace period.",
    },
  ],
}

export const dineInOrders = {
  new: [
    { id: '#YJK-…73', guest: 'Layla', guests: 2, when: 'Today · 7:45 PM', sla: '0:48', tag: 'Prepare now' },
    { id: '#YJK-…74', guest: 'Layla', guests: 2, when: 'Today · 7:45 PM', note: 'Awaiting customer payment' },
  ],
  confirmed: [
    { id: '#YJK-…70', guest: 'Sara A.', guests: 2, when: 'Today · 7:30 PM', tag: 'Prepare now', arrived: true },
    { id: '#YJK-…71', guest: 'Ahmed K.', guests: 4, when: 'Today · 8:00 PM', tag: 'Prepare on arrival', arrived: false },
  ],
  preparing: [{ id: '#YJK-…72', guest: 'Mariam', guests: 2, when: 'Today · 7:30 PM', tag: 'Prepare now' }],
  ready: [
    { id: '#YJK-…68', guest: 'Yousif', guests: 3, tag: 'Prepare now', noShow: true },
    { id: '#YJK-…66', guest: 'Noor', guests: 2, when: 'Arrived · 7:05 PM', tag: 'Prepare on arrival' },
  ],
}

export const orderHistory = [
  { id: '#YJK9PCSSGHS', type: 'Delivery', status: 'Delivered', branch: 'Green Kitchen — Manama', customer: 'Demo Customer', when: 'May 20, 12:57 PM', total: '11.000 BHD' },
  { id: '#YJK-…59', type: 'Delivery', status: 'Delivered', branch: 'Green Kitchen — Seef', customer: 'Sara A.', when: 'Today, 14:02', total: '11.000 BHD' },
  { id: '#YJK-…42', type: 'Dine-in', status: 'Completed', branch: 'Green Kitchen — Adliya', customer: 'Mariam', when: 'Today, 13:30', total: '20.500 BHD' },
  { id: '#YJK-…41', type: 'Delivery', status: 'Delivered', branch: 'Green Kitchen — Manama', customer: 'Ahmed K.', when: 'Today, 12:10', total: '9.600 BHD' },
  { id: '#YJK-…38', type: 'Delivery', status: 'Cancelled', branch: 'Green Kitchen — Seef', customer: 'Noor', when: 'Today, 11:10', total: '14.500 BHD' },
  { id: '#YJK-…35', type: 'Delivery', status: 'Rejected', branch: 'Green Kitchen — Hidd', customer: 'Yousif', when: 'Yesterday, 22:40', total: '7.200 BHD' },
]

export const scheduledOrders = {
  new: [
    {
      id: '#YJK-…48',
      window: 'Same Day',
      windowTone: 'blue',
      when: 'Today · 8–10 PM',
      customer: 'Sara A. · 3 items',
      sla: '0:48',
    },
    {
      id: '#YJK-…48',
      window: 'Same Day',
      windowTone: 'blue',
      when: 'Today · 8–10 PM',
      customer: 'Sara A. · 3 items',
      note: 'Accepted-Awaiting payment',
      noteValue: '1:07',
    },
  ],
  confirmed: [
    { id: '#YJK-…50', window: 'Next Day', windowTone: 'purple', when: 'Tomorrow · 1–3 PM', customer: 'Ahmed K. · 2 items' },
    { id: '#YJK-…52', window: 'Standard', windowTone: 'orange', when: 'Wed · 6–8 PM', customer: 'Mohammed H. · 5 items' },
    { id: '#YJK-…35', window: 'Next Day', windowTone: 'purple', when: 'Tomorrow · 12–2 PM', customer: 'Layla M. · 2 items' },
  ],
  preparing: [
    { id: '#YJK-…55', window: 'Same Day', windowTone: 'blue', when: 'Today · 6–8 PM', customer: 'Yusuf R. · 1 item' },
  ],
  readyForPickup: [
    { id: '#YJK-…40', window: 'Economy', windowTone: 'gray', when: 'Sun · 4–6 PM', customer: 'Huda K. · 4 items' },
  ],
}

export const serviceBookings = {
  new: [
    {
      id: '#YJK-…48',
      when: 'Today · 8–10 PM',
      customer: 'Sara A.',
      service: 'Haircut & styling',
      slaLabel: 'Confirm within (SLA 5min)',
      slaValue: '0:48',
      actions: ['Accept', 'Reject'],
    },
    {
      id: '#YJK-…48',
      when: 'Today · 8–10 PM',
      customer: 'Sara A.',
      service: 'Haircut & styling',
      slaLabel: 'Accepted-Awaiting payment',
      slaValue: '0:48',
      actions: [],
    },
  ],
  upcoming: [
    {
      id: '#YJK-…50',
      when: 'Today · 1–3 PM',
      customer: 'Ahmed K.',
      service: 'Haircut & styling',
      actions: ['Check-in', 'No Show'],
    },
    {
      id: '#YJK-…52',
      when: 'Today · 6–8 PM',
      customer: 'Mohammed H.',
      service: 'Haircut & styling',
      actions: ['Check-in', 'No Show'],
    },
    {
      id: '#YJK-…47',
      when: 'Today · 11–12 PM',
      customer: 'Khalid A.',
      service: 'Hair color',
      noShow: true,
      noShowReason: "Guest didn't arrive within grace period ·",
    },
  ],
  inProgress: [
    {
      id: '#YJK-…55',
      when: 'Today · 6–8 PM',
      customer: 'Yusuf R.',
      service: 'Haircut & styling',
      tag: 'Salon & Beauty',
      tagTone: 'blue',
      buttonLabel: 'Mark completed',
    },
    {
      id: '#YJK-…69',
      when: 'Today · 8–9 PM',
      customer: 'Noor A.',
      service: 'Haircut & styling',
      tag: 'At venue',
      tagTone: 'blueBright',
      buttonLabel: 'Mark completed',
    },
  ],
}

export const catalogItems = [
  { name: 'Classic Burger', category: 'Food · Mains', icon: '🍔', price: '2.500 BHD +', stock: 'Made to order', status: 'Active' },
  { name: 'Margherita Pizza', category: 'Food · Pizza', icon: '🍕', price: '3.500 BHD +', stock: 'Made to order', status: 'Active' },
  { name: 'Caesar Salad', category: 'Food · Salads', icon: '🥗', price: '2.200 BHD', stock: 'Made to order', status: 'Active' },
  { name: 'Orange Juice', category: 'Food · Drinks', icon: '🥤', price: '1.500 BHD', stock: 'Made to order', status: 'Active' },
  { name: 'Chocolate Cake', category: 'Food · Desserts', icon: '🍰', price: '2.000 BHD', stock: '12 left', status: 'Active' },
]

export const branches = [
  {
    name: 'Green Kitchen — Manama',
    address: 'Manama, Block 304',
    status: 'Open',
    radius: '5 km',
    phone: '+973 1700 0001',
    minOrder: '2.000 BHD',
  },
  {
    name: 'Green Kitchen — Seef',
    address: 'Seef District',
    status: 'Busy',
    radius: '6 km',
    eta: '35 min',
    phone: '+973 1700 0002',
    minOrder: '2.500 BHD',
  },
  {
    name: 'Green Kitchen — Hidd',
    address: 'Hidd',
    status: 'Closed',
    radius: '4 km',
    phone: '+973 1700 0003',
    minOrder: '2.000 BHD',
  },
  {
    name: 'Green Kitchen — Adliya',
    address: 'Adliya',
    status: 'Open',
    radius: '5 km',
    phone: '+973 1700 0004',
    minOrder: '3.000 BHD',
  },
  {
    name: 'Green Kitchen — Riffa',
    address: 'Riffa',
    status: 'Closed',
    radius: '8 km',
    phone: '+973 1700 0005',
    minOrder: '2.000 BHD',
  },
  {
    name: 'Green Kitchen — Muharraq',
    address: 'Muharraq',
    status: 'Suspended',
    phone: '+973 1700 0006',
  },
]

export const staff = [
  { name: 'Manama Branch Manager', email: 'manama@greenkitchen.bh', phone: '+973 1700 0001', branch: 'Manama', status: 'Active' },
  { name: 'Seef Branch Manager', email: 'seef@greenkitchen.bh', phone: '+973 1700 0002', branch: 'Seef', status: 'Active' },
  { name: 'Hidd Branch Manager', email: 'hidd@greenkitchen.bh', phone: '+973 1700 0003', branch: 'Hidd', status: 'Inactive' },
  { name: 'Adliya Branch Manager', email: 'adliya@greenkitchen.bh', phone: '+973 1700 0004', branch: 'Adliya', status: 'Active' },
  { name: 'Riffa Branch Manager', email: 'riffa@greenkitchen.bh', phone: '+973 1700 0005', branch: 'Riffa', status: 'Active' },
  { name: 'Kitchen Lead — Manama', email: 'kot.manama@greenkitchen.bh', phone: '+973 1700 0011', branch: 'Manama', status: 'Active' },
]

export const promotionKpis = [
  { label: 'Active promotions', value: '6', delta: '+2 this month' },
  { label: 'Redemptions (30d)', value: '1,240', delta: '+18%' },
  { label: 'Revenue from promos', value: 'BHD 3,820', delta: '+24%' },
  { label: 'Avg. discount', value: '12%', note: 'per order' },
]

export const promotionFilters = ['All', 'Active', 'Scheduled', 'Paused', 'Ended']

export const promotions = [
  {
    title: 'Ramadan 20% Off',
    subtitle: 'Auto-applied · all menu',
    type: 'Item / category deal',
    scope: 'All menu',
    status: 'Active',
    period: '1–30 Ramadan',
    used: 420,
  },
  {
    title: 'Free Delivery Weekend',
    subtitle: 'Fri–Sat · min BHD 5',
    type: 'Free delivery',
    scope: 'All branches',
    status: 'Active',
    period: 'Fri–Sat',
    used: 310,
  },
  {
    title: 'Buy 1 Get 1 Burger',
    subtitle: 'BOGO · selected items',
    type: 'Buy X Get Y',
    scope: 'Selected items',
    status: 'Scheduled',
    period: 'Starts 1 Jul',
    used: 0,
  },
  {
    title: 'BHD 2 Off over BHD 10',
    subtitle: 'Amount off · all menu',
    type: 'Item / category deal',
    scope: 'All menu',
    status: 'Paused',
    period: 'Paused',
    used: 95,
  },
  {
    title: 'Combo Meal Deal',
    subtitle: 'Item deal · Main dishes',
    type: 'Item / category deal',
    scope: 'Main dishes',
    status: 'Active',
    period: 'Ongoing',
    used: 240,
  },
  {
    title: 'Eid Special 15%',
    subtitle: 'Auto-applied · all menu',
    type: '% off',
    scope: 'All menu',
    status: 'Ended',
    period: '1–10 Apr',
    used: 502,
  },
]

export const notifications = [
  { title: 'New order #YJK-…61', body: 'Delivery · Manama · Accept within 60s', time: 'Just now', unread: true },
  { title: 'Seef marked Busy', body: 'Branch status changed by Seef Branch Manager', time: '12 min ago', unread: true },
  { title: 'Promotion ending soon', body: 'Lunch Combo 15% Off ends in 2 days', time: '1 hr ago', unread: false },
  { title: 'Weekly digest ready', body: 'Revenue and acceptance summary for last 7 days', time: 'Yesterday', unread: false },
]

export const loginFeatures = [
  { icon: '🧾', text: 'Live orders & KOT board across all branches' },
  { icon: '🍽️', text: 'Full menu, categories, add-ons & availability' },
  { icon: '🏬', text: 'Branch status, hours & delivery coverage' },
  { icon: '📊', text: 'Daily dashboard & operational-day history' },
]
