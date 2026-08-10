import { useEffect, useState } from 'react'
import { LogOut, Pencil } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { isAdminRealApiFeature } from '../../api/config'
import { useAuth } from '../../context/AuthContext'
import { cn } from '../../components/admin/cn'
import AdminTwoFactorSettings from './AdminTwoFactorSettings'

const MOCK_ACCOUNT_PROFILE = {
  initials: 'SA',
  fullName: 'Super Admin',
  email: 'Superadmin@yjeek.com',
  displayEmail: 'ops@yjeek.com',
  phone: '+973 3300 0001',
  jobTitle: 'Platform Owner',
  memberSince: '12 Jan 2024',
  memberSinceShort: 'Jan 2024',
  role: 'Super Admin',
  scope: 'Global (all countries)',
  scopeShort: 'Global access',
  accessLevel: 'Full system access',
  status: 'Active',
  createdBy: 'System',
  userId: 'USR-0001',
}

function formatMemberSince(iso, style = 'long') {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  if (style === 'short') {
    return date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
  }
  return date.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function profileFromAdminUser(user) {
  if (!user) {
    return {
      initials: '—',
      fullName: '—',
      email: '—',
      displayEmail: '—',
      phone: '—',
      jobTitle: '—',
      memberSince: '—',
      memberSinceShort: '—',
      role: '—',
      scope: '—',
      scopeShort: '—',
      accessLevel: '—',
      status: '—',
      createdBy: '—',
      userId: '—',
    }
  }

  const fullName = user.fullName || user.name || '—'
  const scope = user.scopeLabel || user.scopeLevel || '—'

  return {
    initials: user.initials || '—',
    fullName,
    email: user.email || '—',
    displayEmail: user.email || '—',
    phone: user.phone || '—',
    jobTitle: user.jobTitle || '—',
    memberSince: formatMemberSince(user.memberSince, 'long'),
    memberSinceShort: formatMemberSince(user.memberSince, 'short'),
    role: user.roleBadge || user.backendRole || '—',
    scope,
    scopeShort: user.scopeLabel || user.scopeLevel || '—',
    accessLevel: user.accessLevel || '—',
    status: user.statusLabel || user.status || '—',
    createdBy: user.createdBy || '—',
    userId: user.userId || user.userCode || '—',
  }
}

function Card({ title, children }) {
  return (
    <section className="rounded-[14px] border border-[#eceeec] bg-white p-5 shadow-[0_1px_2px_rgba(20,40,28,.03)] max-[700px]:p-4">
      {title ? <h3 className="mb-4 text-[15px] font-bold text-[#17231c]">{title}</h3> : null}
      {children}
    </section>
  )
}

function InfoItem({ label, value, valueClass }) {
  return (
    <div className="min-w-0">
      <p className="text-[11.5px] text-[#7c8780]">{label}</p>
      <p className={cn('mt-1 truncate text-[13px] font-semibold text-[#17231c]', valueClass)}>{value}</p>
    </div>
  )
}

export default function AdminAccountPage() {
  const navigate = useNavigate()
  const { user, logout, refreshAdminSession } = useAuth()
  const useReal = isAdminRealApiFeature('auth')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [loadError, setLoadError] = useState(null)

  useEffect(() => {
    if (!useReal) return undefined

    let cancelled = false

    async function loadMe() {
      setIsRefreshing(true)
      setLoadError(null)
      try {
        await refreshAdminSession()
      } catch (error) {
        if (!cancelled) setLoadError(error)
      } finally {
        if (!cancelled) setIsRefreshing(false)
      }
    }

    loadMe()
    return () => {
      cancelled = true
    }
  }, [useReal, refreshAdminSession])

  const profile = useReal
    ? profileFromAdminUser(user?.role === 'admin' ? user : null)
    : MOCK_ACCOUNT_PROFILE

  function signOut() {
    logout()
    navigate('/login')
  }

  return (
    <div className="px-5 py-4 pb-8 max-[700px]:px-3">
      <div>
        <div className="mb-3 flex min-h-[54px] flex-wrap items-center justify-between gap-4 px-0.5">
          <div className="flex min-w-0 items-center gap-3">
              <div className="grid h-[48px] w-[48px] shrink-0 place-items-center rounded-[13px] bg-[#e8f7ed] text-[16px] font-bold text-[#147940]">
                {profile.initials}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-[20px] font-bold tracking-[-0.02em] text-[#17231c]">{profile.fullName}</h2>
                  <span className="inline-flex rounded-full bg-[#f1eafe] px-2.5 py-1 text-[11px] font-bold text-[#7752a8]">
                    {profile.role}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e8f7ed] px-2.5 py-[3px] text-[11px] font-bold text-[#147940]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#1aa054]" />
                    {profile.status}
                  </span>
                </div>
                <p className="mt-1 text-[12.5px] text-[#7c8780]">
                  {profile.displayEmail} · {profile.scopeShort} · member since {profile.memberSinceShort}
                </p>
              </div>
            </div>

          <button
            type="button"
            className="inline-flex h-[36px] items-center gap-1.5 rounded-full bg-[#1aa054] px-4 text-[12.5px] font-bold text-white shadow-[0_1px_2px_rgba(20,40,28,.15)] hover:bg-[#158a47]"
          >
            <Pencil size={13.5} strokeWidth={2.2} />
            Edit profile
          </button>
        </div>

        {useReal && isRefreshing ? (
          <p className="mb-3 text-[12px] text-[#7c8780]">Refreshing account…</p>
        ) : null}
        {useReal && loadError ? (
          <p className="mb-3 text-[12px] text-[#d64044]">
            Unable to refresh account from server. Showing last saved session.
          </p>
        ) : null}

        <div className="space-y-3">
          <Card title="Profile">
            <div className="grid grid-cols-[135px_135px_180px] gap-y-4 max-[700px]:grid-cols-2 max-[450px]:grid-cols-1">
              <InfoItem label="Full name" value={profile.fullName} />
              <InfoItem label="Email" value={profile.email} />
              <div className="max-[700px]:hidden" />
              <InfoItem label="Phone" value={profile.phone} />
              <InfoItem label="Job title" value={profile.jobTitle} />
              <InfoItem label="Member since" value={profile.memberSince} />
            </div>
          </Card>

          <Card title="Role & access">
            <div className="grid grid-cols-[135px_135px_180px] gap-y-4 max-[700px]:grid-cols-2 max-[450px]:grid-cols-1">
              <InfoItem label="Role" value={profile.role} />
              <InfoItem label="Scope" value={profile.scope} />
              <InfoItem label="Access level" value={profile.accessLevel} />
              <InfoItem label="Status" value={profile.status} valueClass="text-[#147940]" />
              <InfoItem label="Created by" value={profile.createdBy} />
              <InfoItem label="User ID" value={profile.userId} />
            </div>
          </Card>

          {useReal ? (
            <Card title="Security">
              <AdminTwoFactorSettings
                totpEnabled={Boolean(user?.role === 'admin' && user?.totpEnabled)}
                onChanged={async () => {
                  try {
                    await refreshAdminSession()
                  } catch {
                    // Keep page usable; status refreshes on next visit.
                  }
                }}
              />
            </Card>
          ) : null}

          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={signOut}
              className="inline-flex h-[36px] items-center gap-1.5 rounded-full bg-[#fff1f1] px-4 text-[12.5px] font-bold text-[#d64044] hover:bg-[#f9d9da]"
            >
              <LogOut size={14} strokeWidth={2.2} />
              Sign out
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
