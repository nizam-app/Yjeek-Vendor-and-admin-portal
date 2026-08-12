import { useEffect, useState } from 'react'
import { Pencil, X } from 'lucide-react'
import { cn } from './cn'

const labelClass = 'mb-1.5 block text-[12px] font-medium text-[#7c8780]'
const inputClass =
  'box-border h-[40px] w-full rounded-[8px] border border-[rgba(0,0,0,0.1)] bg-white px-3 text-[13px] text-[#17231c] outline-none transition placeholder:text-[#9aa49d] focus:border-[#1aa054]'

function buildFormState(user) {
  return {
    firstName: String(user?.firstName ?? '').trim() || String(user?.fullName ?? '').split(/\s+/)[0] || '',
    lastName:
      String(user?.lastName ?? '').trim()
      || String(user?.fullName ?? '')
        .split(/\s+/)
        .slice(1)
        .join(' ')
      || '',
    jobTitle: String(user?.jobTitle ?? '').trim(),
    phone: String(user?.phone ?? '').trim(),
  }
}

/**
 * Edit profile — PATCH /admin/auth/me
 * Body: { firstName, lastName, jobTitle, phone }
 */
export default function AdminEditProfileModal({
  open,
  user,
  onClose,
  onSave,
  saving = false,
  error = null,
}) {
  const [form, setForm] = useState(() => buildFormState(user))
  const [localError, setLocalError] = useState(null)
  const [pending, setPending] = useState(false)

  useEffect(() => {
    if (!open) return
    setForm(buildFormState(user))
    setLocalError(null)
    setPending(false)
  }, [open, user])

  if (!open) return null

  const busy = saving || pending
  const displayError = localError || error

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setLocalError(null)
  }

  const handleSave = async () => {
    const firstName = String(form.firstName ?? '').trim()
    const lastName = String(form.lastName ?? '').trim()
    const jobTitle = String(form.jobTitle ?? '').trim()
    const phone = String(form.phone ?? '').trim()

    if (!firstName || !lastName) {
      setLocalError('First name and last name are required.')
      return
    }

    setLocalError(null)
    setPending(true)
    try {
      await onSave?.({ firstName, lastName, jobTitle, phone })
      onClose?.()
    } catch (err) {
      setLocalError(err?.message || 'Could not update profile.')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close edit profile"
        onClick={onClose}
        disabled={busy}
        className="absolute inset-0 bg-black/40"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-profile-title"
        className="relative w-full max-w-[440px] overflow-hidden rounded-[14px] bg-white shadow-[0_12px_40px_rgba(20,40,28,.18)]"
      >
        <div className="flex items-center gap-3 px-5 py-4">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#e8f7ed] text-[#147940]">
            <Pencil size={16} strokeWidth={2.2} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="edit-profile-title" className="text-[16px] font-bold text-[#17231c]">
              Edit profile
            </h2>
            <p className="mt-0.5 text-[12px] text-[#7c8780]">
              Update your name, job title, and phone
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="grid h-8 w-8 place-items-center rounded-md text-[#8a948e] hover:bg-[#f3f5f3] hover:text-[#455249]"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3.5 px-5 py-4">
          {user?.email ? (
            <div>
              <span className={labelClass}>Email</span>
              <p className="truncate text-[13px] font-semibold text-[#17231c]">{user.email}</p>
              <p className="mt-0.5 text-[11px] text-[#9aa49d]">Email cannot be changed here</p>
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-3 max-[450px]:grid-cols-1">
            <label className="block min-w-0">
              <span className={labelClass}>First name</span>
              <input
                type="text"
                value={form.firstName}
                onChange={(e) => setField('firstName', e.target.value)}
                disabled={busy}
                autoComplete="given-name"
                className={inputClass}
              />
            </label>
            <label className="block min-w-0">
              <span className={labelClass}>Last name</span>
              <input
                type="text"
                value={form.lastName}
                onChange={(e) => setField('lastName', e.target.value)}
                disabled={busy}
                autoComplete="family-name"
                className={inputClass}
              />
            </label>
          </div>

          <label className="block min-w-0">
            <span className={labelClass}>Job title</span>
            <input
              type="text"
              value={form.jobTitle}
              onChange={(e) => setField('jobTitle', e.target.value)}
              disabled={busy}
              autoComplete="organization-title"
              className={inputClass}
            />
          </label>

          <label className="block min-w-0">
            <span className={labelClass}>Phone</span>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setField('phone', e.target.value)}
              disabled={busy}
              autoComplete="tel"
              placeholder="+973…"
              className={inputClass}
            />
          </label>

          {displayError ? (
            <p className={cn('rounded-[9px] bg-[#fff1f1] px-3 py-2 text-[12px] text-[#d64044]')}>
              {typeof displayError === 'string' ? displayError : displayError?.message || 'Update failed.'}
            </p>
          ) : null}
        </div>

        <div className="flex justify-end gap-2 border-t border-[#eceeec] px-5 py-3.5">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="inline-flex h-[36px] items-center rounded-full bg-[#f3f5f3] px-4 text-[12.5px] font-bold text-[#455249] hover:bg-[#e8ebe8]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={busy}
            className="inline-flex h-[36px] items-center rounded-full bg-[#1aa054] px-4 text-[12.5px] font-bold text-white hover:bg-[#158a47] disabled:opacity-60"
          >
            {busy ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
