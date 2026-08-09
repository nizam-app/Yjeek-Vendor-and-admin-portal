import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { isAdminRealApiFeature } from '../api/config'
import { useAuth } from '../context/AuthContext'
import { loginFeatures } from '../data/mockData'
import { adminAuthService } from '../services/admin/authService'
import { authService } from '../services/vendor/authService'

export default function Login() {
  const { user, login, isAuthInitializing } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  if (isAuthInitializing) return null

  if (user) return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/dashboard'} replace />

  async function handleSubmit(e) {
    e.preventDefault()
    if (isLoading) return

    setIsLoading(true)
    setError('')

    try {
      const nextUser = await login(email, password)
      if (!nextUser) {
        setError('Incorrect email or password. Please recheck and try again.')
        return
      }
      if (nextUser.requiresTwoFactor) {
        navigate('/admin/verify')
        return
      }
      navigate(nextUser.role === 'admin' ? '/admin/dashboard' : '/dashboard')
    } catch (err) {
      const message = isAdminRealApiFeature('auth')
        ? adminAuthService.getLoginErrorMessage(err)
        : authService.getLoginErrorMessage(err)
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  const fieldInputClass = `w-full h-11 border rounded-md px-[14px] text-[13px] focus:outline-2 focus:outline-solid ${
    error
      ? 'border-danger focus:outline-[rgba(219,38,38,0.15)] focus:border-danger'
      : 'border-border focus:outline-[rgba(26,166,77,0.25)] focus:border-green-primary'
  }`

  return (
    <div className="min-h-full flex bg-white max-[900px]:flex-col">
      <section className="w-[43%] min-w-[360px] bg-green-deep text-white py-[90px] px-[70px] flex flex-col justify-center gap-5 max-[900px]:w-full max-[900px]:min-w-0 max-[900px]:py-12 max-[900px]:px-7">
        <div>
          <div className="w-[116px]">
            <img
              src="/assets/yjeek-logo.png"
              alt="Yjeek"
              className="w-[116px] h-24 object-contain"
              onError={(e) => { e.currentTarget.style.display = 'none' }}
            />
          </div>
          <div className="text-[11px] font-bold text-green-soft tracking-[0.06em] mt-1">VENDOR &amp; ADMIN PORTAL</div>
        </div>
        <h1 className="text-[20px] font-bold leading-[1.25] max-w-[426px]">
          Run your Store, your branches,
          <br />
          and your finances — in one place.
        </h1>
        <div className="flex flex-col gap-[14px]">
          {loginFeatures.map((f) => (
            <div key={f.text} className="flex items-center gap-3 text-[14px] font-normal text-green-feat">
              <div className="w-[34px] h-[34px] rounded-[9px] bg-green-mid grid place-items-center text-[14px]">{f.icon}</div>
              <span>{f.text}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="flex-1 grid place-items-center py-10 px-6">
        <form className="w-full max-w-[420px]" onSubmit={handleSubmit}>
          <div className="flex justify-between items-start mb-[18px]">
            <div>
              <h2 className="text-xl font-bold">Welcome back</h2>
              <p className="mt-[2px] text-[14px] font-normal text-ink-muted">Sign in to your Yjeek workspace</p>
            </div>
            <button
              type="button"
              className="border border-border rounded-sm py-[7px] px-3 text-xs font-medium bg-white inline-flex items-center gap-1"
            >
              EN ▾
            </button>
          </div>

          {error ? (
            <div className="flex items-center gap-2.5 bg-danger-soft text-danger rounded-md py-3 px-[14px] text-[13px] mb-4">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          ) : null}

          <div className="mb-[18px]">
            <label htmlFor="email" className="block text-[13px] font-medium tracking-[0.04em] text-ink-muted mb-[6px]">
              EMAIL
            </label>
            <input
              id="email"
              type="email"
              className={fieldInputClass}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setError('')
              }}
              autoComplete="username"
              disabled={isLoading}
            />
          </div>

          <div className="mb-[18px]">
            <label htmlFor="password" className="block text-[13px] font-medium tracking-[0.04em] text-ink-muted mb-[6px]">
              PASSWORD
            </label>
            <input
              id="password"
              type="password"
              className={fieldInputClass}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setError('')
              }}
              autoComplete="current-password"
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-11 rounded-md bg-green-primary text-white text-[13px] font-medium hover:bg-green-active-text disabled:opacity-60 disabled:pointer-events-none"
          >
            Sign in
          </button>
        </form>
      </section>
    </div>
  )
}
