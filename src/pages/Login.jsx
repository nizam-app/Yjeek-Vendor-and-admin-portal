import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { loginFeatures } from '../data/mockData'

export default function Login() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('admin@greenkitchen.bh')
  const [password, setPassword] = useState('password123')
  const [error, setError] = useState('')

  if (user) return <Navigate to="/dashboard" replace />

  function handleSubmit(e) {
    e.preventDefault()
    if (!email.trim() || !password.trim()) {
      setError('Incorrect email or password. Please recheck and try again.')
      return
    }
    if (password.length < 4) {
      setError('Incorrect email or password. Please recheck and try again.')
      return
    }
    setError('')
    login(email.trim())
    navigate('/dashboard')
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
          <div className="text-[11px] font-bold text-green-soft tracking-[0.06em] mt-1">VENDOR PORTAL</div>
        </div>
        <h1 className="text-[26px] font-bold leading-[1.25] max-w-[426px]">
          Run your Store, your branches,
          <br />
          and your finances — in one place.
        </h1>
        <div className="flex flex-col gap-[14px]">
          {loginFeatures.map((f) => (
            <div key={f.text} className="flex items-center gap-3 text-sm font-medium text-green-feat">
              <div className="w-[34px] h-[34px] rounded-[9px] bg-green-mid grid place-items-center text-[15px]">{f.icon}</div>
              <span>{f.text}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="flex-1 grid place-items-center py-10 px-6">
        <form className="w-full max-w-[420px]" onSubmit={handleSubmit}>
          <div className="flex justify-between items-start mb-[18px]">
            <div>
              <h2 className="text-2xl font-bold">Welcome back</h2>
              <p className="mt-[2px] text-[13px] text-ink-muted">Sign in to your vendor dashboard</p>
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
            <label htmlFor="email" className="block text-[11px] font-bold tracking-[0.04em] text-ink-muted mb-[6px]">
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
            />
          </div>

          <div className="mb-[18px]">
            <label htmlFor="password" className="block text-[11px] font-bold tracking-[0.04em] text-ink-muted mb-[6px]">
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
            />
          </div>

          <button type="submit" className="w-full h-6 rounded-full bg-green-primary text-white text-[15px] font-semibold">
            Sign in
          </button>
        </form>
      </section>
    </div>
  )
}
