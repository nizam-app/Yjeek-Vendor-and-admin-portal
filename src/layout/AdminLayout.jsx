import {
  Activity,
  BarChart3,
  Bell,
  Bike,
  ChevronDown,
  CircleGauge,
  Clock3,
  LogOut,
  Megaphone,
  PanelTop,
  Search,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Store,
  Users,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { cn } from '../components/admin/cn'

const dashboardChildren = [
  ['Full Overview', '/admin/dashboard'],
  ['Live orders', '/admin/live-orders'],
  ['Scheduled', '/admin/scheduled'],
  ['Pickup', '/admin/pickup'],
  ['Dine-in', '/admin/dine-in'],
  ['Services', '/admin/services'],
]

const navItems = [
  ['Vendor Management', '/admin/vendors', ShoppingBag],
  ['Store Management', '/admin/stores', Store],
  ['Fleet Management', '/admin/fleet', Bike],
  ['Customer Management', '/admin/customers', Users],
  ['Marketing', '/admin/marketing', Megaphone],
  ['SLA Models', '/admin/sla-models', Clock3],
  ['UI Editor', '/admin/ui-editor', PanelTop],
  ['Users', '/admin/users', ShieldCheck],
  ['Reports', '/admin/reports', BarChart3],
  ['Settings', '/admin/settings', Settings],
]

const pageTitles = {
  '/admin/dashboard': 'Live Dashboard',
  '/admin/live-orders': 'Live Orders',
  '/admin/scheduled': 'Scheduled Orders',
  '/admin/pickup': 'Live Dashboard',
  '/admin/dine-in': 'Live Dashboard',
  '/admin/services': 'Live Dashboard',
  '/admin/vendors': 'Vendor Management',
  '/admin/vendors/new': 'Vendor Management',
  '/admin/stores': 'Store Management',
  '/admin/stores/new': 'Store Management',
  '/admin/fleet': 'Fleet Management · Champs',
  '/admin/fleet/new': 'Fleet Management · Champs',
  '/admin/fleet/notify': 'Fleet Management · Champs',
  '/admin/fleet/suppliers': 'Fleet Management · Suppliers',
  '/admin/fleet/suppliers/new': 'Fleet Management · Suppliers',
  '/admin/customers': 'Customer Management',
  '/admin/marketing': 'Marketing · Notifications',
  '/admin/marketing/notifications/customers': 'Customer Management',
  '/admin/marketing/notifications/vendors': 'Vendor Management',
  '/admin/marketing/promo-codes': 'Marketing · Promo codes',
  '/admin/marketing/promo-codes/new': 'Marketing · Create promo code',
  '/admin/sla-models': 'SLA Models · Vendor SLA',
  '/admin/sla-models/champ': 'SLA Models · Champ SLA',
  '/admin/sla-models/dispatcher': 'SLA Models · Dispatcher SLA',

  '/admin/ui-editor': 'UI Editor',
  '/admin/users': 'Users & Roles · Users',
  '/admin/users/new': 'Users & Roles · Create user',
  '/admin/users/roles/new': 'Users & Roles · Create role',
  '/admin/users/roles': 'Users & Roles · Roles',
  '/admin/users/activity': 'Users & Roles · Activity log',
  '/admin/reports': 'Reports · Orders',
  '/admin/settings': 'Settings · General',
  '/admin/account': 'Account',
}

function AdminSidebar() {
  const { user, logout } = useAuth()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const dashboardActive = dashboardChildren.some(([, to]) => pathname === to || pathname.startsWith(`${to}/`))
  const [dashboardOpen, setDashboardOpen] = useState(dashboardActive)

  useEffect(() => {
    if (dashboardActive) setDashboardOpen(true)
    else setDashboardOpen(false)
  }, [dashboardActive])

  function signOut() {
    logout()
    navigate('/login')
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-[250px] flex-col gap-1 bg-[#102d22] px-[14px] pb-[18px] pt-5 text-white max-[900px]:hidden">
      <div className="flex h-[31px] items-center gap-2 px-0.5">
        <div className="grid h-[18px] w-[30px] place-items-center rounded-full bg-[#37c86c] text-[18px] font-bold text-[#102d22]">Y</div>
        <div>
          <div className="text-[16px] font-bold leading-4 text-white">Yjeek</div>
          <div className="mt-0.5 text-[9px] font-bold tracking-[.08em] text-[#39c86d]">ADMIN CONSOLE</div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto pb-2">
        <button
          type="button"
          onClick={() => setDashboardOpen((open) => !open)}
          className={`flex h-[36px] w-full items-center gap-2.5 rounded-[9px] border px-2.5 text-[13px] font-medium transition ${
            dashboardActive
              ? 'border-[#168b4a] bg-[#173a2c] text-[#f3faf5]'
              : 'border-transparent text-[#bfcac4] hover:bg-[#1a392d] hover:text-white'
          }`}
        >
          <Activity size={15} strokeWidth={1.8} className={`${dashboardActive ? 'text-[#2EC75E]' : 'text-white'}`}/>
          <span className="min-w-0 flex-1 text-left">Live Dashboard</span>
          <ChevronDown
            size={12}
            strokeWidth={1.8}
            className={`shrink-0 transition-transform ${dashboardOpen ? 'rotate-0' : '-rotate-90'}`}
          />
        </button>
        {dashboardOpen ? (
          <div className="mb-0.5">
            {dashboardChildren.map(([label, to]) => (
              <NavLink
                key={to}
                to={to}
                end={to !== '/admin/scheduled'}
                className={({ isActive }) =>
                  `flex h-[27px] mt-1 items-center gap-2 rounded-sm px-[34px] text-[12.5px] font-medium transition ${
                    isActive || (to === '/admin/scheduled' && pathname.startsWith('/admin/scheduled/'))
                      ? 'bg-[#28473a] font-medium text-white'
                      : 'text-[#c4d0c9] hover:bg-[#1a392d] hover:text-white'
                  }`
                }
              >
                <span className="h-[3px] w-[3px] rounded-full bg-current" />
                {label}
              </NavLink>
            ))}
          </div>
        ) : null}
        {navItems.map(([label, to, Icon]) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex h-[38px] items-center gap-2.5 rounded-[9px] border px-2.5 text-[13px] font-medium transition ${
                isActive
                  ? 'border-[#168b4a] bg-[#173a2c] font-medium text-[#f3faf5]'
                  : 'border-transparent text-[#bfcac4] hover:bg-[#1a392d] hover:text-white'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={15}
                  strokeWidth={1.8}
                  className={isActive ? 'text-[#2EC75E]' : undefined}
                />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div>
        <button
          type="button"
          onClick={() => navigate('/admin/account')}
          className={cn(
            'flex min-h-[36px] w-full items-center gap-2 rounded-md px-2.5 text-left transition',
            pathname === '/admin/account' || pathname.startsWith('/admin/account/')
              ? 'bg-[#2a5544]'
              : 'bg-[#234438] hover:bg-[#2a5544]',
          )}
        >
          <div className="grid h-[18px] w-[25px] place-items-center rounded-full bg-[#36c66b] text-[9px] font-bold text-[#0e3423]">
            {user?.initials || '—'}
          </div>
          <div className="min-w-0">
            <div className="text-[12px] text-white">{user?.name}</div>
            <div className="truncate text-[10px] font-normal text-[#9fb2a8]">{user?.email}</div>
          </div>
        </button>
        <button onClick={signOut} className="flex h-[32px] w-full items-center gap-2 px-2.5 text-[13px] font-medium text-[#ef817c] hover:text-[#ffaba7]">
          <LogOut size={14} />
          Sign out
        </button>
      </div>
    </aside>
  )
}

function AdminTopbar() {
  const { pathname, search } = useLocation()
  const settingsTab = new URLSearchParams(search).get('tab') || 'general'
  const settingsTitles = {
    general: 'Settings · General',
    localization: 'Settings · Localization & regions',
    notifications: 'Settings · Notifications',
    security: 'Settings · Security',
    integrations: 'Settings · Integrations',
  }

  const title =
    (pathname === '/admin/settings' ? settingsTitles[settingsTab] || settingsTitles.general : null)
    || pageTitles[pathname]
    || (pathname.startsWith('/admin/scheduled/assign') ? 'Scheduled Orders · Assign champ' : null)
    || (pathname.startsWith('/admin/scheduled/') ? 'Scheduled Orders' : null)
    || (pathname.startsWith('/admin/stores/') ? 'Store Management' : null)
    || (pathname.startsWith('/admin/vendors/') ? 'Vendor Management' : null)
    || (pathname.startsWith('/admin/fleet/suppliers') ? 'Fleet Management · Suppliers' : null)
    || (pathname.startsWith('/admin/fleet/') ? 'Fleet Management · Champs' : null)
    || (pathname.startsWith('/admin/customers/') ? 'Customer Management' : null)
    || (pathname.startsWith('/admin/users/') ? 'Users & Roles · User' : null)
    || (() => {
      const match = pathname.match(/^\/admin\/marketing\/notifications\/([^/]+)$/)
      if (!match) return null
      const id = match[1]
      if (id === 'customers' || id === 'vendors') return null
      return id === 'ntf-7791' || id === 'ntf-7770' ? 'Customer Management' : 'Vendor Management'
    })()
    || 'Admin Console'

  return (
    <header className="fixed left-[250px] right-0 top-0 z-20 flex h-[44px] items-center justify-between border-b border-[#e7ebe8] bg-white px-4 max-[900px]:left-0">
      <div className="flex items-center gap-2">
        <CircleGauge className="hidden text-[#118446] max-[900px]:block" size={20} />
        <h1 className="text-[20px] font-bold tracking-[-.02em] text-[#17231c]">{title}</h1>
      </div>
      <div className="flex items-center gap-2">
        <button className="flex h-[25px] items-center gap-1 rounded-md border border-[#dfe4e0] px-2 text-[12px] text-[#536158]">
          <span>🌍</span>
          Bahrain · All regions
          <ChevronDown size={10} />
        </button>
        <label className="flex h-[27px] w-[220px] items-center gap-2 rounded-md bg-[#f6f7f6] px-2.5 max-[700px]:hidden">
          <Search size={13} className="text-[#89938c]" />
          <input className="min-w-0 flex-1 border-0 bg-transparent text-[12px] outline-none" placeholder="Search orders, vendors, champs…" />
        </label>
        <button className="relative grid h-7 w-7 place-items-center rounded-md hover:bg-[#f3f6f4]">
          <Bell size={15} strokeWidth={1.7} />
          <span className="absolute right-1.5 top-1.5 h-1 w-1 rounded-full bg-[#e14b42]" />
        </button>
      </div>
    </header>
  )
}

export default function AdminLayout() {
  return (
    <div className="admin-shell h-full overflow-hidden bg-[#f5f7f5] text-[#17231c]">
      <AdminSidebar />
      <AdminTopbar />
      <main className="h-full overflow-y-auto overflow-x-hidden pl-[250px] pt-[44px] max-[900px]:pl-0 [-webkit-overflow-scrolling:touch]">
        <Outlet />
      </main>
    </div>
  )
}
