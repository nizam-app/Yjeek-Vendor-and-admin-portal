import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutGrid,
  Zap,
  Calendar,
  ClipboardList,
  Menu,
  Home,
  Users,
  ClipboardCheck,
  Bell,
  CircleUser,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getVendorServiceModes } from '../mappers/vendor/authMapper'

const SIDEBAR_COLLAPSED_KEY = 'vendor-sidebar-collapsed'
const SIDEBAR_EXPANDED_W = '260px'
const SIDEBAR_COLLAPSED_W = '72px'

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutGrid },
  { to: '/live-orders', label: 'Live orders', icon: Zap },
  { to: '/scheduled', label: 'Scheduled', icon: Zap, requires: 'scheduledDelivery' },
  { to: '/services', label: 'Services', icon: Calendar, requires: 'services' },
  { to: '/orders-history', label: 'Orders history', icon: ClipboardList },
  { to: '/catalog', label: 'Catalog', icon: Menu },
  { to: '/branches', label: 'Branches', icon: Home },
  { to: '/staff', label: 'Staff', icon: Users },
  { to: '/promotions', label: 'Promotions', icon: ClipboardCheck },
  { to: '/notifications', label: 'Notifications', icon: Bell },
  { to: '/account', label: 'Account', icon: CircleUser },
]

function readCollapsedPreference() {
  try {
    return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1'
  } catch {
    return false
  }
}

export default function Sidebar() {
  const { user, logout } = useAuth()
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [collapsed, setCollapsed] = useState(readCollapsedPreference)
  const modes = getVendorServiceModes(user)
  const visibleLinks = links.filter((link) => !link.requires || modes[link.requires])

  useEffect(() => {
    document.documentElement.style.setProperty(
      '--sidebar-w',
      collapsed ? SIDEBAR_COLLAPSED_W : SIDEBAR_EXPANDED_W,
    )
    return () => {
      document.documentElement.style.setProperty('--sidebar-w', SIDEBAR_EXPANDED_W)
    }
  }, [collapsed])

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev
      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? '1' : '0')
      } catch {
        // ignore storage failures
      }
      return next
    })
  }

  async function handleSignOut() {
    if (isSigningOut) return
    setIsSigningOut(true)
    try {
      await logout()
    } finally {
      setIsSigningOut(false)
    }
  }

  return (
    <aside
      className={`shrink-0 bg-bg-white border-r border-border flex flex-col py-[18px] sticky top-0 h-screen overflow-y-auto transition-[width,padding] duration-200 max-[900px]:hidden ${
        collapsed ? 'w-[72px] items-center px-2' : 'w-[var(--sidebar-w)] px-[14px]'
      }`}
    >
      <div className={`flex items-center pb-4 ${collapsed ? 'w-full flex-col gap-2' : 'justify-between px-1'}`}>
        <div className={`flex items-center gap-2.5 ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-[34px] h-[17px] shrink-0 rounded-[17px] bg-green-primary text-white grid place-items-center text-[18px] font-bold">Y</div>
          {!collapsed ? (
            <div>
              <strong className="block text-base leading-[1.2]">Yjeek</strong>
              <span className="block text-[9px] font-bold tracking-[0.04em] text-green-primary">VENDOR</span>
            </div>
          ) : null}
        </div>
        <button
          type="button"
          onClick={toggleCollapsed}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-[#949994] transition hover:bg-[#f3f6f3] hover:text-ink"
        >
          {collapsed ? <ChevronRight size={16} strokeWidth={1.8} /> : <ChevronLeft size={16} strokeWidth={1.8} />}
        </button>
      </div>

      <nav className={`flex flex-col gap-[3px] flex-1 ${collapsed ? 'w-full items-center' : ''}`}>
        {visibleLinks.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            title={collapsed ? label : undefined}
            end={to === '/branches' || to === '/dashboard'}
            className={({ isActive }) =>
              `flex items-center rounded-md text-[13px] font-medium transition-colors duration-150 [&_svg]:w-5 [&_svg]:h-5 [&_svg]:shrink-0 ${
                collapsed ? 'h-10 w-10 justify-center px-0' : 'gap-3 py-[11px] px-3'
              } ${
                isActive ? 'bg-green-active-bg text-green-active-text font-medium' : 'text-ink-muted hover:bg-[#f3f6f3] hover:text-ink'
              }`
            }
          >
            <Icon strokeWidth={1.8} />
            {!collapsed ? label : null}
          </NavLink>
        ))}
        <div className="flex-1 min-h-6" />
        <button
          type="button"
          disabled={isSigningOut}
          title={collapsed ? 'Sign out' : undefined}
          className={`flex items-center rounded-md text-danger text-[13px] font-medium hover:bg-danger-soft disabled:opacity-60 disabled:pointer-events-none ${
            collapsed ? 'h-10 w-10 justify-center' : 'gap-3 py-[11px] px-3 w-full text-left'
          }`}
          onClick={handleSignOut}
        >
          <LogOut size={20} strokeWidth={1.8} />
          {!collapsed ? 'Sign out' : null}
        </button>
      </nav>
    </aside>
  )
}
