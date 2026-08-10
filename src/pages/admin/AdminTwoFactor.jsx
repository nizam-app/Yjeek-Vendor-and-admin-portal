import { useRef, useState } from 'react'
import { Check } from 'lucide-react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { adminAuthService } from '../../services/admin/authService'

const securityFeatures = [
  'Role-based access for every team',
  'Two-factor authentication enforced',
  'Every action is audited and logged',
]

export default function AdminTwoFactor() {
  const { user, pendingAdmin, verifyAdmin, cancelAdminLogin } = useAuth()
  const navigate = useNavigate()
  const inputRefs = useRef([])
  const [digits, setDigits] = useState(['', '', '', '', '', ''])
  const [backupCode, setBackupCode] = useState('')
  const [useBackupCode, setUseBackupCode] = useState(false)
  const [trusted, setTrusted] = useState(true)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  if (user?.role === 'admin') return <Navigate to="/admin/dashboard" replace />
  if (!pendingAdmin) return <Navigate to="/admin/login" replace />

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
    setError('')
    inputRefs.current[Math.min(pasted.length, 5)]?.focus()
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (isLoading) return

    const code = useBackupCode
      ? backupCode.trim()
      : digits.join('')

    if (!useBackupCode && code.length !== 6) {
      setError('Enter the 6-digit code from your authenticator app.')
      return
    }
    if (useBackupCode && code.replace(/[\s-]/g, '').length < 8) {
      setError('Enter a valid backup code.')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      await verifyAdmin(code, { trustDevice: trusted })
      navigate('/admin/dashboard', { replace: true })
    } catch (err) {
      setError(adminAuthService.getVerifyErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  function returnToLogin() {
    if (isLoading) return
    cancelAdminLogin()
    navigate('/admin/login', { replace: true })
  }

  function toggleBackupMode() {
    if (isLoading) return
    setUseBackupCode((prev) => !prev)
    setError('')
    setDigits(['', '', '', '', '', ''])
    setBackupCode('')
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
            <p className="text-[12px] text-[#758078]">
              {useBackupCode
                ? 'Enter one of your one-time backup codes.'
                : 'Enter the 6-digit code from your authenticator app.'}
            </p>

            <label className="mt-5 block text-[13px] font-medium uppercase tracking-[.05em] text-[#647068]">
              Verification code
            </label>

            {useBackupCode ? (
              <input
                type="text"
                value={backupCode}
                onChange={(event) => {
                  setBackupCode(event.target.value.toUpperCase())
                  setError('')
                }}
                autoComplete="one-time-code"
                disabled={isLoading}
                placeholder="XXXX-XXXX"
                className="mt-1.5 h-[55px] w-full rounded-[9px] border border-[#dce2dd] bg-white px-4 text-center text-lg font-bold tracking-[0.2em] outline-none transition focus:border-[#19a84f] focus:ring-2 focus:ring-[#19a84f]/15 disabled:opacity-60"
              />
            ) : (
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
                    disabled={isLoading}
                    className="h-[55px] w-[52px] rounded-[9px] border border-[#dce2dd] bg-white text-center text-xl font-bold outline-none transition focus:border-[#19a84f] focus:ring-2 focus:ring-[#19a84f]/15 disabled:opacity-60"
                  />
                ))}
              </div>
            )}

            {error ? <p className="mt-2 text-[11px] font-medium text-[#cf383b]">{error}</p> : null}

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
              className="mt-4 h-[38px] w-full rounded-[7px] bg-[#19a84f] text-[13px] font-medium text-white hover:bg-[#148d43] disabled:opacity-60 disabled:pointer-events-none"
            >
              {isLoading ? 'Verifying…' : 'Verify & continue'}
            </button>

            <button
              type="button"
              onClick={toggleBackupMode}
              disabled={isLoading}
              className="mt-3 w-full text-center text-[13px] font-medium text-[#169a49] disabled:opacity-60"
            >
              {useBackupCode ? 'Use authenticator app instead' : 'Use a backup code instead'}
            </button>

            <button
              type="button"
              onClick={returnToLogin}
              disabled={isLoading}
              className="mt-4 w-full text-center text-[13px] font-medium text-[#758078] hover:text-[#405047] disabled:opacity-60"
            >
              Back to sign in
            </button>
          </form>
        </section>
      </div>
    </div>
  )
}
