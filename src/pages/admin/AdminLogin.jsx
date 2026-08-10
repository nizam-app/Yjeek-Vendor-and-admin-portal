import { useMemo, useState } from 'react'
import { Check, Eye, EyeOff, Lock } from 'lucide-react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { adminAuthService } from '../../services/admin/authService'

const securityFeatures = [
  'Role-based access for every team',
  'Two-factor authentication enforced',
  'Every action is audited and logged',
]

export default function AdminLogin() {
  const { user, loginAdmin, isAuthInitializing } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [trusted, setTrusted] = useState(true)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const sessionIp = useMemo(() => {
    try {
      return sessionStorage.getItem('yjeek_admin_session_ip') || null
    } catch {
      return null
    }
  }, [])

  if (isAuthInitializing) return null
  if (user?.role === 'admin') return <Navigate to="/admin/dashboard" replace />
  if (user?.role === 'vendor') return <Navigate to="/dashboard" replace />

  async function handleSubmit(event) {
    event.preventDefault()
    if (isLoading) return

    setIsLoading(true)
    setError('')

    try {
      const nextUser = await loginAdmin(email, password, { trustDevice: trusted })
      if (!nextUser) {
        setError('Incorrect email or password. Please recheck and try again.')
        return
      }
      if (nextUser.requiresTwoFactor) {
        navigate('/admin/verify', { replace: true })
        return
      }
      navigate('/admin/dashboard', { replace: true })
    } catch (err) {
      setError(adminAuthService.getLoginErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  const fieldClass = `mt-1.5 h-[42px] w-full rounded-[8px] border bg-white px-3.5 text-[13px] outline-none transition disabled:opacity-60 ${
    error
      ? 'border-[#cf383b] focus:border-[#cf383b] focus:ring-2 focus:ring-[#cf383b]/15'
      : 'border-[#dce2dd] focus:border-[#19a84f] focus:ring-2 focus:ring-[#19a84f]/15'
  }`

  return (
    <div className="admin-shell min-h-screen w-full bg-white">
      <div className="flex min-h-screen w-full bg-white max-[760px]:flex-col">
        <section className="relative flex w-[39%] min-w-[390px] flex-col bg-[#116b35] px-[64px] py-[64px] text-white max-[760px]:w-full max-[760px]:min-w-0 max-[760px]:px-7 max-[760px]:py-8">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-[10px] bg-white text-xl font-bold text-[#116b35]">Y</div>
            <div>
              <div className="text-base font-bold">Yjeek</div>
              <div className="text-[9px] font-medium tracking-[.02em] text-white/85">ADMIN CONSOLE</div>
            </div>
          </div>

          <div className="my-auto max-w-[390px] py-14">
            <h1 className="text-[20px] font-bold leading-[1.12] tracking-[-.02em]">
              Secure access to the Yjeek
              <br />
              control center
            </h1>
            <p className="mt-5 max-w-[370px] text-[12px] leading-[1.45] text-white/80">
              Operations, fleet, vendors and scheduled deliveries —
              <br />
              managed from one place.
            </p>
            <div className="mt-6 space-y-4">
              {securityFeatures.map((feature) => (
                <div key={feature} className="flex items-center gap-3 text-[11px] font-medium">
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-[#24a95a]">
                    <Check size={12} strokeWidth={3} />
                  </span>
                  {feature}
                </div>
              ))}
            </div>
          </div>

          <div className="text-[9px] leading-4 text-white/65">
            Authorized personnel only.
            <br />
            © 2026 Yjeek · All rights reserved
          </div>
        </section>

        <section className="flex flex-1 items-center justify-center px-8 py-12">
          <form className="w-full max-w-[375px]" onSubmit={handleSubmit}>
            <h2 className="text-[20px] font-bold tracking-[-.025em] text-[#1e2922]">Sign in to Console</h2>
            <p className="mt-1 text-[12px] text-[#758078]">Enter your credentials to continue.</p>

            {error ? (
              <div className="mt-4 rounded-[8px] border border-[#f3c8c8] bg-[#fdecec] px-3 py-2.5 text-[12px] font-medium text-[#cf383b]">
                {error}
              </div>
            ) : null}

            <label htmlFor="admin-email" className="mt-5 block text-[11px] font-medium uppercase tracking-[.05em] text-[#647068]">
              Email
            </label>
            <input
              id="admin-email"
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value)
                setError('')
              }}
              placeholder="ops@yjeek.com"
              autoComplete="username"
              disabled={isLoading}
              className={fieldClass}
            />

            <label htmlFor="admin-password" className="mt-4 block text-[11px] font-medium uppercase tracking-[.05em] text-[#647068]">
              Password
            </label>
            <div className="relative">
              <input
                id="admin-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value)
                  setError('')
                }}
                autoComplete="current-password"
                disabled={isLoading}
                className={`${fieldClass} pr-14`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] font-medium text-[#19a84f] hover:text-[#148d43]"
              >
                {showPassword ? (
                  <span className="inline-flex items-center gap-1"><EyeOff size={13} /> Hide</span>
                ) : (
                  <span className="inline-flex items-center gap-1"><Eye size={13} /> Show</span>
                )}
              </button>
            </div>

            <label className="mt-4 flex cursor-pointer items-center gap-2 text-[13px] font-medium text-[#405047]">
              <input
                type="checkbox"
                checked={trusted}
                onChange={(event) => setTrusted(event.target.checked)}
                disabled={isLoading}
                className="peer sr-only"
              />
              <span className="grid h-5 w-5 place-items-center rounded-[5px] border border-[#19a84f] bg-white text-transparent peer-checked:bg-[#19a84f] peer-checked:text-white">
                <Check size={13} strokeWidth={3} />
              </span>
              Trust this device for 30 days
            </label>

            <button
              type="submit"
              disabled={isLoading}
              className="mt-4 h-[42px] w-full rounded-[8px] bg-[#19a84f] text-[13px] font-medium text-white hover:bg-[#148d43] disabled:pointer-events-none disabled:opacity-60"
            >
              {isLoading ? 'Signing in…' : 'Sign in'}
            </button>

            <div className="relative my-5 text-center">
              <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-[#e5e8e5]" />
              <span className="relative bg-white px-3 text-[11px] font-medium text-[#8a938d]">or</span>
            </div>

            <button
              type="button"
              disabled={isLoading}
              className="h-[42px] w-full rounded-[8px] border border-[#dce2dd] bg-white text-[13px] font-medium text-[#1e2922] hover:bg-[#f7f9f7] disabled:pointer-events-none disabled:opacity-60"
            >
              Continue with company SSO
            </button>

            <p className="mt-5 flex items-center justify-center gap-1.5 text-[11px] text-[#8a938d]">
              <Lock size={12} className="text-[#c4a035]" />
              Protected by 2FA
              {sessionIp ? ` · Session from IP ${sessionIp}` : ' · Session secured'}
            </p>
          </form>
        </section>
      </div>
    </div>
  )
}
