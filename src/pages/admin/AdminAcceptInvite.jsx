import { useMemo, useState } from 'react'
import { Check, Eye, EyeOff, Lock } from 'lucide-react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { adminUserService } from '../../services/admin/userService'
import { adminAuthService } from '../../services/admin/authService'

const securityFeatures = [
  'Role-based access for every team',
  'Two-factor authentication enforced',
  'Every action is audited and logged',
]

function passwordRuleMessage(password) {
  if (password.length < 12) return 'Password must be at least 12 characters.'
  if (password.length > 128) return 'Password must be at most 128 characters.'
  if (!/[A-Z]/.test(password)) return 'Password requires an uppercase letter.'
  if (!/[a-z]/.test(password)) return 'Password requires a lowercase letter.'
  if (!/[0-9]/.test(password)) return 'Password requires a number.'
  if (!/[^A-Za-z0-9]/.test(password)) return 'Password requires a symbol.'
  return ''
}

export default function AdminAcceptInvite() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = String(searchParams.get('token') || '').trim()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [acceptedEmail, setAcceptedEmail] = useState('')
  const [accepted, setAccepted] = useState(false)

  const fieldClass = useMemo(
    () =>
      `mt-1.5 h-[42px] w-full rounded-[8px] border bg-white px-3.5 text-[13px] outline-none transition disabled:opacity-60 ${
        error
          ? 'border-[#cf383b] focus:border-[#cf383b] focus:ring-2 focus:ring-[#cf383b]/15'
          : 'border-[#dce2dd] focus:border-[#19a84f] focus:ring-2 focus:ring-[#19a84f]/15'
      }`,
    [error],
  )

  async function handleSubmit(event) {
    event.preventDefault()
    if (isLoading) return

    const ruleError = passwordRuleMessage(password)
    if (ruleError) {
      setError(ruleError)
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const result = await adminUserService.acceptInvite({ token, password })
      setAcceptedEmail(result.email || '')
      setAccepted(true)
    } catch (err) {
      setError(
        adminAuthService.getLoginErrorMessage(
          err,
          'This invitation is invalid or expired. Ask an admin to resend it.',
        ),
      )
    } finally {
      setIsLoading(false)
    }
  }

  let panel
  if (!token) {
    panel = (
      <div className="w-full max-w-[375px]">
        <h2 className="text-[20px] font-bold tracking-[-.025em] text-[#1e2922]">Invitation link is incomplete</h2>
        <p className="mt-2 text-[12px] text-[#758078]">
          Open the Accept invitation link from your email, or ask an admin to resend it.
        </p>
        <Link
          to="/login"
          className="mt-6 inline-flex h-[42px] w-full items-center justify-center rounded-[8px] bg-[#19a84f] text-[13px] font-medium text-white hover:bg-[#148d43]"
        >
          Back to sign in
        </Link>
      </div>
    )
  } else if (accepted) {
    panel = (
      <div className="w-full max-w-[375px]">
        <h2 className="text-[20px] font-bold tracking-[-.025em] text-[#1e2922]">Invitation accepted</h2>
        <p className="mt-2 text-[12px] text-[#758078]">
          {acceptedEmail
            ? `Your account ${acceptedEmail} is ready. Sign in with the password you just set.`
            : 'Your account is ready. Sign in with the password you just set.'}
        </p>
        <button
          type="button"
          onClick={() => navigate('/login', { replace: true })}
          className="mt-6 h-[42px] w-full rounded-[8px] bg-[#19a84f] text-[13px] font-medium text-white hover:bg-[#148d43]"
        >
          Sign in
        </button>
      </div>
    )
  } else {
    panel = (
      <form className="w-full max-w-[375px]" onSubmit={handleSubmit}>
        <h2 className="text-[20px] font-bold tracking-[-.025em] text-[#1e2922]">Set your password</h2>
        <p className="mt-1 text-[12px] text-[#758078]">
          Use 12+ characters with upper, lower, number, and a symbol.
        </p>

        {error ? (
          <div className="mt-4 rounded-[8px] border border-[#f3c8c8] bg-[#fdecec] px-3 py-2.5 text-[12px] font-medium text-[#cf383b]">
            {error}
          </div>
        ) : null}

        <label htmlFor="invite-password" className="mt-5 block text-[11px] font-medium uppercase tracking-[.05em] text-[#647068]">
          Password
        </label>
        <div className="relative">
          <input
            id="invite-password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(event) => {
              setPassword(event.target.value)
              setError('')
            }}
            autoComplete="new-password"
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

        <label htmlFor="invite-confirm" className="mt-4 block text-[11px] font-medium uppercase tracking-[.05em] text-[#647068]">
          Confirm password
        </label>
        <input
          id="invite-confirm"
          type={showPassword ? 'text' : 'password'}
          value={confirmPassword}
          onChange={(event) => {
            setConfirmPassword(event.target.value)
            setError('')
          }}
          autoComplete="new-password"
          disabled={isLoading}
          className={fieldClass}
        />

        <button
          type="submit"
          disabled={isLoading}
          className="mt-4 h-[42px] w-full rounded-[8px] bg-[#19a84f] text-[13px] font-medium text-white hover:bg-[#148d43] disabled:pointer-events-none disabled:opacity-60"
        >
          {isLoading ? 'Saving…' : 'Accept invitation'}
        </button>

        <p className="mt-5 flex items-center justify-center gap-1.5 text-[11px] text-[#8a938d]">
          <Lock size={12} className="text-[#c4a035]" />
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-[#19a84f] hover:text-[#148d43]">
            Sign in
          </Link>
        </p>
      </form>
    )
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
              Accept your invitation
              <br />
              to the control center
            </h1>
            <p className="mt-5 max-w-[370px] text-[12px] leading-[1.45] text-white/80">
              Set a permanent password, then sign in with your invited email.
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

        <section className="flex flex-1 items-center justify-center px-8 py-12">{panel}</section>
      </div>
    </div>
  )
}
