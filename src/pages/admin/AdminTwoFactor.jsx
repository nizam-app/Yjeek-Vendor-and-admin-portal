import { useEffect, useRef, useState } from 'react'
import { Check, ShieldCheck } from 'lucide-react'
import { Navigate, useNavigate } from 'react-router-dom'
import { ADMIN_DEMO_CODE, useAuth } from '../../context/AuthContext'

const securityFeatures = [
  'Role-based access for every team',
  'Two-factor authentication enforced',
  'Every action is audited and logged',
]

const RESEND_DELAY_SECONDS = 27

export default function AdminTwoFactor() {
  const { user, pendingAdmin, verifyAdmin, cancelAdminLogin } = useAuth()
  const navigate = useNavigate()
  const inputRefs = useRef([])
  const [digits, setDigits] = useState(['3', '9', '', '', '', ''])
  const [trusted, setTrusted] = useState(true)
  const [error, setError] = useState('')
  const [resendSeconds, setResendSeconds] = useState(RESEND_DELAY_SECONDS)

  useEffect(() => {
    if (resendSeconds === 0) return undefined

    const timerId = window.setTimeout(() => {
      setResendSeconds((seconds) => Math.max(0, seconds - 1))
    }, 1000)

    return () => window.clearTimeout(timerId)
  }, [resendSeconds])

  if (user?.role === 'admin') return <Navigate to="/admin/dashboard" replace />
  if (!pendingAdmin) return <Navigate to="/login" replace />

  function updateDigit(index, value) {
    const digit = value.replace(/\D/g, '').slice(-1)
    const next = [...digits]
    next[index] = digit
    setDigits(next)
    setError('')
    if (digit && index < 5) inputRefs.current[index + 1]?.focus()
  }

  function handleKeyDown(index, event) {
    if (event.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  function handlePaste(event) {
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!pasted) return
    event.preventDefault()
    const next = Array.from({ length: 6 }, (_, index) => pasted[index] || '')
    setDigits(next)
    inputRefs.current[Math.min(pasted.length, 5)]?.focus()
  }

  function handleSubmit(event) {
    event.preventDefault()
    if (!verifyAdmin(digits.join(''))) {
      setError('Incorrect verification code. Please try again.')
      return
    }
    navigate('/admin/dashboard', { replace: true })
  }

  function returnToLogin() {
    cancelAdminLogin()
    navigate('/login', { replace: true })
  }

  function handleResend() {
    if (resendSeconds > 0) return

    setResendSeconds(RESEND_DELAY_SECONDS)
    setError('')
  }

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
            <div className="mb-2 flex items-center gap-2 text-[#1e2922]">
           
              <h2 className="text-[20px] font-bold tracking-[-.025em]">Two-factor verification</h2>
            </div>
            <p className="text-[12px] text-[#758078]">Enter the 6-digit code from your authenticator app.</p>

            <label className="mt-5 block text-[13px] font-medium uppercase tracking-[.05em] text-[#647068]">
              Verification code
            </label>
            <div className="mt-1.5 flex gap-2" onPaste={handlePaste}>
              {digits.map((digit, index) => (
                <input
                  key={index}
                  ref={(element) => { inputRefs.current[index] = element }}
                  value={digit}
                  onChange={(event) => updateDigit(index, event.target.value)}
                  onKeyDown={(event) => handleKeyDown(index, event)}
                  inputMode="numeric"
                  autoComplete={index === 0 ? 'one-time-code' : 'off'}
                  aria-label={`Verification digit ${index + 1}`}
                  className="h-[55px] w-[52px] rounded-[9px] border border-[#dce2dd] bg-white text-center text-xl font-bold outline-none transition focus:border-[#19a84f] focus:ring-2 focus:ring-[#19a84f]/15"
                />
              ))}
            </div>

            {error ? <p className="mt-2 text-[11px] font-medium text-[#cf383b]">{error}</p> : null}

            <label className="mt-4 flex cursor-pointer items-center gap-2 text-[13px] font-medium text-[#405047]">
              <input type="checkbox" checked={trusted} onChange={(event) => setTrusted(event.target.checked)} className="peer sr-only" />
              <span className="grid h-5 w-5 place-items-center rounded-[5px] border border-[#19a84f] bg-white text-transparent peer-checked:bg-[#19a84f] peer-checked:text-white">
                <Check size={13} strokeWidth={3} />
              </span>
              Trust this device for 30 days
            </label>

            <button type="submit" className="mt-4 h-[38px] w-full rounded-[7px] bg-[#19a84f] text-[13px] font-medium text-white hover:bg-[#148d43]">
              Verify &amp; continue
            </button>
            <div className="mt-3 text-center text-[10px] text-[#169a49]">
              Demo code: <strong>{ADMIN_DEMO_CODE}</strong>
            </div>
            <button
              type="button"
              onClick={handleResend}
              disabled={resendSeconds > 0}
              aria-live="polite"
              className="mt-3 w-full text-center text-[13px] font-medium text-[#169a49] disabled:cursor-not-allowed disabled:opacity-75"
            >
              {resendSeconds > 0
                ? `Resend code in 0:${String(resendSeconds).padStart(2, '0')}`
                : 'Resend code'}
            </button>
            <button type="button" onClick={returnToLogin} className="mt-4 w-full text-center text-[13px] font-medium text-[#169a49]">
              Use a backup code instead
            </button>
          </form>
        </section>
      </div>
    </div>
  )
}
