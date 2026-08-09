import { useState } from 'react'
import { adminAuthService } from '../../services/admin/authService'

function Field({ id, label, type = 'text', value, onChange, placeholder, disabled, autoComplete }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1 block text-[11.5px] font-medium text-[#7c8780]">{label}</span>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete={autoComplete}
        className="h-10 w-full rounded-[9px] border border-[#dce2dd] bg-white px-3 text-[13px] text-[#17231c] outline-none focus:border-[#19a84f] focus:ring-2 focus:ring-[#19a84f]/15 disabled:opacity-60"
      />
    </label>
  )
}

function BackupCodesList({ codes }) {
  if (!codes?.length) return null
  return (
    <div className="rounded-[10px] border border-[#eceeec] bg-[#f7faf8] p-3">
      <p className="text-[12px] font-semibold text-[#17231c]">Save these backup codes now</p>
      <p className="mt-1 text-[11.5px] text-[#7c8780]">Each code works once. Store them somewhere safe.</p>
      <ul className="mt-2 grid grid-cols-2 gap-1.5 font-mono text-[12.5px] font-semibold text-[#147940] max-[450px]:grid-cols-1">
        {codes.map((code) => (
          <li key={code} className="rounded-md bg-white px-2 py-1.5 border border-[#e4ebe6]">
            {code}
          </li>
        ))}
      </ul>
    </div>
  )
}

/**
 * Account → Security: wire Admin 2FA setup / confirm / disable / backup-codes.
 */
export default function AdminTwoFactorSettings({ totpEnabled, onChanged }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const [setup, setSetup] = useState(null)
  const [confirmCode, setConfirmCode] = useState('')
  const [backupCodes, setBackupCodes] = useState([])

  const [disableCode, setDisableCode] = useState('')
  const [disablePassword, setDisablePassword] = useState('')

  const [regenCode, setRegenCode] = useState('')
  const [showDisable, setShowDisable] = useState(false)
  const [showRegen, setShowRegen] = useState(false)

  function resetFeedback() {
    setError('')
    setMessage('')
  }

  async function startSetup() {
    if (busy) return
    setBusy(true)
    resetFeedback()
    setBackupCodes([])
    try {
      const next = await adminAuthService.setup2fa()
      setSetup(next)
      setConfirmCode(next.currentCode || '')
      setMessage('Add the secret to your authenticator app (30s period), then confirm.')
    } catch (err) {
      setError(adminAuthService.getVerifyErrorMessage(err, 'Could not start 2FA setup.'))
    } finally {
      setBusy(false)
    }
  }

  async function confirmSetup(event) {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    resetFeedback()
    try {
      const result = await adminAuthService.confirm2fa({ code: confirmCode })
      setBackupCodes(result.backupCodes)
      setSetup(null)
      setConfirmCode('')
      setMessage('Two-factor authentication is now enabled.')
      await onChanged?.()
    } catch (err) {
      setError(adminAuthService.getVerifyErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  async function disable2fa(event) {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    resetFeedback()
    try {
      await adminAuthService.disable2fa({
        code: disableCode,
        password: disablePassword,
      })
      setDisableCode('')
      setDisablePassword('')
      setShowDisable(false)
      setBackupCodes([])
      setMessage('Two-factor authentication has been disabled.')
      await onChanged?.()
    } catch (err) {
      setError(adminAuthService.getVerifyErrorMessage(err, 'Could not disable 2FA.'))
    } finally {
      setBusy(false)
    }
  }

  async function regenerate(event) {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    resetFeedback()
    try {
      const result = await adminAuthService.regenerateBackupCodes({ code: regenCode })
      setBackupCodes(result.backupCodes)
      setRegenCode('')
      setShowRegen(false)
      setMessage('New backup codes generated. Save them now.')
    } catch (err) {
      setError(adminAuthService.getVerifyErrorMessage(err, 'Could not regenerate backup codes.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[13px] font-semibold text-[#17231c]">Authenticator app (TOTP)</p>
          <p className="mt-0.5 text-[12px] text-[#7c8780]">
            Use Google Authenticator / Authy. Codes refresh every 30 seconds.
          </p>
        </div>
        <span
          className={
            totpEnabled
              ? 'inline-flex rounded-full bg-[#e8f7ed] px-2.5 py-1 text-[11px] font-bold text-[#147940]'
              : 'inline-flex rounded-full bg-[#f2f4f2] px-2.5 py-1 text-[11px] font-bold text-[#6b746e]'
          }
        >
          {totpEnabled ? 'On' : 'Off'}
        </span>
      </div>

      {error ? <p className="text-[12px] font-medium text-[#d64044]">{error}</p> : null}
      {message ? <p className="text-[12px] font-medium text-[#147940]">{message}</p> : null}

      <BackupCodesList codes={backupCodes} />

      {!totpEnabled ? (
        <div className="space-y-3">
          {!setup ? (
            <button
              type="button"
              disabled={busy}
              onClick={startSetup}
              className="inline-flex h-9 items-center rounded-full bg-[#1aa054] px-4 text-[12.5px] font-bold text-white hover:bg-[#158a47] disabled:opacity-60"
            >
              {busy ? 'Starting…' : 'Enable 2FA'}
            </button>
          ) : (
            <form className="space-y-3" onSubmit={confirmSetup}>
              <div className="rounded-[10px] border border-[#eceeec] bg-[#f7faf8] p-3">
                <p className="text-[11.5px] text-[#7c8780]">Secret key</p>
                <p className="mt-1 break-all font-mono text-[13px] font-semibold text-[#17231c]">{setup.secret}</p>
                {setup.otpauthUrl ? (
                  <>
                    <p className="mt-3 text-[11.5px] text-[#7c8780]">otpauth URL (for QR)</p>
                    <p className="mt-1 break-all font-mono text-[11px] text-[#405047]">{setup.otpauthUrl}</p>
                  </>
                ) : null}
                {setup.currentCode ? (
                  <p className="mt-3 text-[12px] text-[#147940]">
                    Dev current code: <strong>{setup.currentCode}</strong>
                  </p>
                ) : null}
              </div>
              <Field
                id="confirm-2fa-code"
                label="6-digit code from authenticator"
                value={confirmCode}
                onChange={setConfirmCode}
                placeholder="123456"
                disabled={busy}
                autoComplete="one-time-code"
              />
              <div className="flex flex-wrap gap-2">
                <button
                  type="submit"
                  disabled={busy || confirmCode.trim().length < 6}
                  className="inline-flex h-9 items-center rounded-full bg-[#1aa054] px-4 text-[12.5px] font-bold text-white hover:bg-[#158a47] disabled:opacity-60"
                >
                  {busy ? 'Confirming…' : 'Confirm & enable'}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    setSetup(null)
                    setConfirmCode('')
                    resetFeedback()
                  }}
                  className="inline-flex h-9 items-center rounded-full bg-[#f2f4f2] px-4 text-[12.5px] font-bold text-[#405047] disabled:opacity-60"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setShowDisable((v) => !v)
                setShowRegen(false)
                resetFeedback()
              }}
              className="inline-flex h-9 items-center rounded-full bg-[#fff1f1] px-4 text-[12.5px] font-bold text-[#d64044] hover:bg-[#f9d9da] disabled:opacity-60"
            >
              Disable 2FA
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setShowRegen((v) => !v)
                setShowDisable(false)
                resetFeedback()
              }}
              className="inline-flex h-9 items-center rounded-full border border-[#dce2dd] bg-white px-4 text-[12.5px] font-bold text-[#17231c] hover:bg-[#f7faf8] disabled:opacity-60"
            >
              New backup codes
            </button>
          </div>

          {showDisable ? (
            <form className="grid gap-3 sm:grid-cols-2" onSubmit={disable2fa}>
              <Field
                id="disable-2fa-code"
                label="Authenticator or backup code"
                value={disableCode}
                onChange={setDisableCode}
                disabled={busy}
                autoComplete="one-time-code"
              />
              <Field
                id="disable-2fa-password"
                label="Account password"
                type="password"
                value={disablePassword}
                onChange={setDisablePassword}
                disabled={busy}
                autoComplete="current-password"
              />
              <div className="sm:col-span-2">
                <button
                  type="submit"
                  disabled={busy || !disableCode.trim() || !disablePassword}
                  className="inline-flex h-9 items-center rounded-full bg-[#d64044] px-4 text-[12.5px] font-bold text-white disabled:opacity-60"
                >
                  {busy ? 'Disabling…' : 'Confirm disable'}
                </button>
              </div>
            </form>
          ) : null}

          {showRegen ? (
            <form className="flex flex-wrap items-end gap-3" onSubmit={regenerate}>
              <div className="min-w-[180px] flex-1">
                <Field
                  id="regen-2fa-code"
                  label="Authenticator code"
                  value={regenCode}
                  onChange={setRegenCode}
                  disabled={busy}
                  autoComplete="one-time-code"
                />
              </div>
              <button
                type="submit"
                disabled={busy || regenCode.trim().length < 6}
                className="inline-flex h-10 items-center rounded-full bg-[#1aa054] px-4 text-[12.5px] font-bold text-white disabled:opacity-60"
              >
                {busy ? 'Generating…' : 'Generate'}
              </button>
            </form>
          ) : null}
        </div>
      )}
    </div>
  )
}
