import { ChevronDown, ChevronLeft, ChevronRight, CircleGauge, LogOut } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { AdminShellProvider, useAdminShell } from '../context/AdminShellContext'
import { cn } from '../components/admin/cn'
import { AdminTopbarTools } from '../components/admin/AdminTopbarTools'
import {
  ADMIN_PAGE_TITLES,
  filterAdminNavForUser,
  firstAllowedAdminPath,
} from '../config/adminNavManifest'
import { adminNavIcon } from '../config/adminNavIcons'

const SIDEBAR_COLLAPSED_KEY = 'admin-sidebar-collapsed'

const pageTitles = ADMIN_PAGE_TITLES

function readCollapsedPreference() {
  try {
    return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1'
  } catch {
    return false
  }
}

function guardedNavClick(event, { to, pathname, navigate, attemptNavigation, end = false }) {
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
    return
  }
  const targetPath = String(to).split('?')[0]
  const isActive = end ? pathname === targetPath : pathname === targetPath || pathname.startsWith(`${targetPath}/`)
  if (isActive) return
  event.preventDefault()
  attemptNavigation(to, () => navigate(to))
}

function AdminSidebar({ collapsed, onToggleCollapsed }) {
  const { user, logout } = useAuth()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { attemptNavigation } = useAdminShell()
  const { dashboard, topLevel } = useMemo(() => filterAdminNavForUser(user), [user])
  const dashboardChildren = dashboard?.children ?? []
  const dashboardHome = dashboardChildren[0]?.path || firstAllowedAdminPath(user)
  const dashboardActive = dashboardChildren.some(
    (child) => pathname === child.path || pathname.startsWith(`${child.path}/`),
  )
  const [dashboardOpen, setDashboardOpen] = useState(dashboardActive)
  const DashboardIcon = adminNavIcon(dashboard?.iconId || 'Activity')

  useEffect(() => {
    if (dashboardActive) setDashboardOpen(true)
    else setDashboardOpen(false)
  }, [dashboardActive])

  function signOut() {
    logout()
    navigate('/login')
  }

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-30 flex flex-col gap-1 bg-[#102d22] pb-[18px] pt-5 text-white transition-[width] duration-200 max-[900px]:hidden',
        collapsed ? 'w-[68px] items-center px-2' : 'w-[250px] px-[14px]',
      )}
    >
      <div
        className={cn(
          'flex items-center',
          collapsed ? 'w-full flex-col gap-1.5' : 'h-[31px] justify-between gap-2 px-0.5',
        )}
      >
        <div className={cn('flex min-w-0 items-center gap-2', collapsed && 'justify-center')}>
          <div className="grid h-[18px] w-[30px] shrink-0 place-items-center rounded-full bg-[#37c86c] text-[18px] font-bold text-[#102d22]">
            Y
          </div>
          {!collapsed ? (
            <div>
              <div className="text-[16px] font-bold leading-4 text-white">Yjeek</div>
              <div className="mt-0.5 text-[9px] font-bold tracking-[.08em] text-[#39c86d]">ADMIN CONSOLE</div>
            </div>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onToggleCollapsed}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-[#9fb2a8] transition hover:bg-[#1a392d] hover:text-white"
        >
          {collapsed ? <ChevronRight size={16} strokeWidth={1.8} /> : <ChevronLeft size={16} strokeWidth={1.8} />}
        </button>
      </div>

      <nav className={cn('flex-1 overflow-y-auto pb-2', collapsed && 'w-full')}>
        {dashboard ? (
          collapsed ? (
            <NavLink
              to={dashboardHome}
              title={dashboard.label}
              onClick={(event) =>
                guardedNavClick(event, {
                  to: dashboardHome,
                  pathname,
                  navigate,
                  attemptNavigation,
                  end: true,
                })
              }
              className={() =>
                cn(
                  'mx-auto mb-0.5 flex h-9 w-9 items-center justify-center rounded-[9px] border transition',
                  dashboardActive
                    ? 'border-[#168b4a] bg-[#173a2c] text-[#f3faf5]'
                    : 'border-transparent text-[#bfcac4] hover:bg-[#1a392d] hover:text-white',
                )
              }
            >
              <DashboardIcon
                size={15}
                strokeWidth={1.8}
                className={dashboardActive ? 'text-[#2EC75E]' : 'text-white'}
              />
            </NavLink>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setDashboardOpen((open) => !open)}
                className={`flex h-[36px] w-full items-center gap-2.5 rounded-[9px] border px-2.5 text-[13px] font-medium transition ${
                  dashboardActive
                    ? 'border-[#168b4a] bg-[#173a2c] text-[#f3faf5]'
                    : 'border-transparent text-[#bfcac4] hover:bg-[#1a392d] hover:text-white'
                }`}
              >
                <DashboardIcon
                  size={15}
                  strokeWidth={1.8}
                  className={dashboardActive ? 'text-[#2EC75E]' : 'text-white'}
                />
                <span className="min-w-0 flex-1 text-left">{dashboard.label}</span>
                <ChevronDown
                  size={12}
                  strokeWidth={1.8}
                  className={`shrink-0 transition-transform ${dashboardOpen ? 'rotate-0' : '-rotate-90'}`}
                />
              </button>
              {dashboardOpen ? (
                <div className="mb-0.5">
                  {dashboardChildren.map((child) => (
                    <NavLink
                      key={child.path}
                      to={child.path}
                      end={child.path !== '/admin/scheduled'}
                      onClick={(event) =>
                        guardedNavClick(event, {
                          to: child.path,
                          pathname,
                          navigate,
                          attemptNavigation,
                          end: child.path !== '/admin/scheduled',
                        })
                      }
                      className={({ isActive }) =>
                        `flex h-[27px] mt-1 items-center gap-2 rounded-sm px-[34px] text-[12.5px] font-medium transition ${
                          isActive ||
                          (child.path === '/admin/scheduled' && pathname.startsWith('/admin/scheduled/'))
                            ? 'bg-[#28473a] font-medium text-white'
                            : 'text-[#c4d0c9] hover:bg-[#1a392d] hover:text-white'
                        }`
                      }
                    >
                      <span className="h-[3px] w-[3px] rounded-full bg-current" />
                      {child.label}
                    </NavLink>
                  ))}
                </div>
              ) : null}
            </>
          )
        ) : null}
        {topLevel.map((item) => {
          const Icon = adminNavIcon(item.iconId)
          const to = item.path
          return (
            <NavLink
              key={to}
              to={to}
              title={collapsed ? item.label : undefined}
              onClick={(event) =>
                guardedNavClick(event, { to, pathname, navigate, attemptNavigation })
              }
              className={({ isActive }) =>
                cn(
                  'flex items-center rounded-[9px] border text-[13px] font-medium transition',
                  collapsed
                    ? 'mx-auto mb-0.5 h-9 w-9 justify-center px-0'
                    : 'h-[38px] gap-2.5 px-2.5',
                  isActive
                    ? 'border-[#168b4a] bg-[#173a2c] font-medium text-[#f3faf5]'
                    : 'border-transparent text-[#bfcac4] hover:bg-[#1a392d] hover:text-white',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={15} strokeWidth={1.8} className={isActive ? 'text-[#2EC75E]' : undefined} />
                  {!collapsed ? <span className="min-w-0 flex-1">{item.label}</span> : null}
                </>
              )}
            </NavLink>
          )
        })}
      </nav>

      <div className={cn(collapsed && 'flex w-full flex-col items-center gap-1')}>
        <button
          type="button"
          onClick={() => attemptNavigation('/admin/account', () => navigate('/admin/account'))}
          title={collapsed ? user?.name || 'Account' : undefined}
          className={cn(
            'flex items-center text-left transition',
            collapsed
              ? 'h-9 w-9 justify-center rounded-[9px]'
              : 'min-h-[36px] w-full gap-2 rounded-md px-2.5',
            pathname === '/admin/account' || pathname.startsWith('/admin/account/')
              ? 'bg-[#2a5544]'
              : 'bg-[#234438] hover:bg-[#2a5544]',
          )}
        >
          <div className="grid h-[18px] w-[25px] shrink-0 place-items-center rounded-full bg-[#36c66b] text-[9px] font-bold text-[#0e3423]">
            {user?.initials || '—'}
          </div>
          {!collapsed ? (
            <div className="min-w-0">
              <div className="text-[12px] text-white">{user?.name}</div>
              <div className="truncate text-[10px] font-normal text-[#9fb2a8]">{user?.email}</div>
            </div>
          ) : null}
        </button>
        <button
          type="button"
          onClick={signOut}
          title={collapsed ? 'Sign out' : undefined}
          className={cn(
            'flex items-center font-medium text-[#ef817c] hover:text-[#ffaba7]',
            collapsed ? 'h-9 w-9 justify-center rounded-[9px] hover:bg-[#1a392d]' : 'h-[32px] w-full gap-2 px-2.5 text-[13px]',
          )}
        >
          <LogOut size={14} />
          {!collapsed ? 'Sign out' : null}
        </button>
      </div>
    </aside>
  )
}

function AdminTopbar({ collapsed }) {
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
    || (/^\/admin\/marketing\/promo-codes\/[^/]+\/edit$/.test(pathname)
      ? 'Marketing · Edit promo code'
      : null)
    || (/^\/admin\/marketing\/geofence\/[^/]+\/edit$/.test(pathname)
      ? 'Marketing · Edit geofence offer'
      : null)
    || (() => {
      const match = pathname.match(/^\/admin\/marketing\/notifications\/([^/]+)$/)
      if (!match) return null
      const id = match[1]
      if (id === 'customers' || id === 'vendors') return null
      return id === 'ntf-7791' || id === 'ntf-7770' ? 'Customer Management' : 'Vendor Management'
    })()
    || 'Admin Console'

  return (
    <header
      className={cn(
        'fixed right-0 top-0 z-20 flex h-[44px] items-center justify-between border-b border-[#e7ebe8] bg-white px-4 transition-[left] duration-200 max-[900px]:left-0',
        collapsed ? 'left-[68px]' : 'left-[250px]',
      )}
    >
      <div className="flex items-center gap-2">
        <CircleGauge className="hidden text-[#118446] max-[900px]:block" size={20} />
        <h1 className="text-[20px] font-bold tracking-[-.02em] text-[#17231c]">{title}</h1>
      </div>
      <div className="flex items-center gap-2">
        <AdminTopbarTools />
      </div>
    </header>
  )
}

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(readCollapsedPreference)

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

  return (
    <AdminShellProvider>
      <div className="admin-shell h-full overflow-hidden bg-[#f5f7f5] text-[#17231c]">
        <AdminSidebar collapsed={collapsed} onToggleCollapsed={toggleCollapsed} />
        <AdminTopbar collapsed={collapsed} />
        <main
          className={cn(
            'flex h-full min-h-0 flex-col overflow-y-auto overflow-x-hidden pt-[44px] transition-[padding-left] duration-200 max-[900px]:pl-0 [-webkit-overflow-scrolling:touch]',
            collapsed ? 'pl-[68px]' : 'pl-[250px]',
          )}
        >
          <Outlet />
        </main>
      </div>
    </AdminShellProvider>
  )
}
