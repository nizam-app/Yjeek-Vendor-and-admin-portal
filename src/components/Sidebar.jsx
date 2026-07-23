import { useState } from 'react'
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
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutGrid },
  { to: '/live-orders', label: 'Live orders', icon: Zap },
  { to: '/scheduled', label: 'Scheduled', icon: Zap },
  { to: '/services', label: 'Services', icon: Calendar },
  { to: '/orders-history', label: 'Orders history', icon: ClipboardList },
  { to: '/catalog', label: 'Catalog', icon: Menu },
  { to: '/branches', label: 'Branches', icon: Home },
  { to: '/staff', label: 'Staff', icon: Users },
  { to: '/promotions', label: 'Promotions', icon: ClipboardCheck },
  { to: '/notifications', label: 'Notifications', icon: Bell },
  { to: '/account', label: 'Account', icon: CircleUser },
]

export default function Sidebar() {
  const { logout } = useAuth()
  const [isSigningOut, setIsSigningOut] = useState(false)

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
    <aside className="w-[var(--sidebar-w)] shrink-0 bg-bg-white border-r border-border flex flex-col py-[18px] px-[14px] sticky top-0 h-screen overflow-y-auto max-[900px]:hidden">
      <div className="flex items-center justify-between px-1 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-[34px] h-[17px] rounded-[17px] bg-green-primary text-white grid place-items-center text-[18px] font-bold">Y</div>
          <div>
            <strong className="block text-base leading-[1.2]">Yjeek</strong>
            <span className="block text-[9px] font-bold tracking-[0.04em] text-green-primary">VENDOR</span>
          </div>
        </div>
        <ChevronLeft size={16} color="#949994" />
      </div>

      <nav className="flex flex-col gap-[3px] flex-1">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/branches' || to === '/catalog' || to === '/dashboard'}
            className={({ isActive }) =>
              `flex items-center gap-3 py-[11px] px-3 rounded-md text-[13px] font-medium transition-colors duration-150 [&_svg]:w-5 [&_svg]:h-5 [&_svg]:shrink-0 ${
                isActive ? 'bg-green-active-bg text-green-active-text font-medium' : 'text-ink-muted hover:bg-[#f3f6f3] hover:text-ink'
              }`
            }
          >
            <Icon strokeWidth={1.8} />
            {label}
          </NavLink>
        ))}
        <div className="flex-1 min-h-6" />
        <button
          type="button"
          disabled={isSigningOut}
          className="flex items-center gap-3 py-[11px] px-3 rounded-md text-danger text-[13px] font-medium w-full text-left hover:bg-danger-soft disabled:opacity-60 disabled:pointer-events-none"
          onClick={handleSignOut}
        >
          <LogOut size={20} strokeWidth={1.8} />
          Sign out
        </button>
      </nav>
    </aside>
  )
}
