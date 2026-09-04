import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, X } from 'lucide-react'
import { cn } from './cn'
import { adminIncidentService } from '../../services/admin/incidentService'
import { ApiError, formatApiErrorMessage } from '../../api/errors'
import { formatAdminMoney } from '../../mappers/admin/mapAdminOrderDetail'
import {
  formatCostBearerLabel,
  formatCustomerRemedyLabel,
  formatEnforcementLabel,
  RESOLUTION_ACTION_LABELS,
} from '../../lib/adminIncidentPresentation'
import { useAuth } from '../../context/AuthContext'

const labelClass = 'mb-1.5 block text-[12px] font-medium text-[#7c8780]'
const inputClass =
  'box-border h-[40px] w-full appearance-none rounded-[8px] border border-[rgba(0,0,0,0.1)] bg-white px-3 pr-9 text-[13px] text-[#17231c] outline-none transition focus:border-[#1aa054]'

function resolutionLabel(code) {
  if (!code) return '—'
  return RESOLUTION_ACTION_LABELS[code] || String(code).replace(/_/g, ' ')
}

function canSeniorSignOff(user) {
  const actions = user?.permissions?.LIVE_DASHBOARD
  return Array.isArray(actions) && actions.includes('APPROVE')
}

function ReadOnlyField({ label, value }) {
  if (!value) return null
  return (
    <div>
      <p className={labelClass}>{label}</p>
      <p className="rounded-[8px] border border-[#e8ebe9] bg-[#fafbfa] px-3 py-2.5 text-[13px] text-[#17231c]">
        {value}
      </p>
    </div>
  )
}

/**
 * Typed Mark Resolved for readiness-managed incidents.
 */
export default function AdminMarkResolvedModal({
  open,
  onClose,
  incidentId,
  onSuccess,
}) {
  const { user } = useAuth()
  const [context, setContext] = useState(null)
  const [loading, setLoading] = useState(false)
  const [resolutionCode, setResolutionCode] = useState('')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [signingOff, setSigningOff] = useState(false)
  const [error, setError] = useState(null)

  const persisted = context?.persisted ?? {}
  const requirements = context?.closeRequirements ?? {}
  const canSignOff = canSeniorSignOff(user)

  const codeOptions = useMemo(() => {
    const all = Array.isArray(context?.canonicalResolutionCodes)
      ? context.canonicalResolutionCodes
      : []
    const candidates = new Set(context?.resolutionCandidates || [])
    const noAction = new Set(context?.noActionResolutionCodes || [])
    const suggested = context?.suggestedResolutionCode
    const ordered = []
    if (suggested && !ordered.includes(suggested)) ordered.push(suggested)
    for (const code of candidates) {
      if (!ordered.includes(code)) ordered.push(code)
    }
    for (const code of noAction) {
      if (!ordered.includes(code)) ordered.push(code)
    }
    for (const code of all) {
      if (!ordered.includes(code)) ordered.push(code)
    }
    return ordered
  }, [context])

  useEffect(() => {
    if (!open || !incidentId) return undefined
    let cancelled = false
    setLoading(true)
    setError(null)
    setContext(null)
    setNote('')
    adminIncidentService
      .getResolveContext(incidentId)
      .then((res) => {
        if (cancelled) return
        const ctx = res?.data ?? null
        setContext(ctx)
        const initial =
          ctx?.suggestedResolutionCode && !ctx?.ambiguousResolution
            ? ctx.suggestedResolutionCode
            : ''
        setResolutionCode(initial || '')
      })
      .catch((err) => {
        if (!cancelled) {
          setError(formatApiErrorMessage(err, 'Failed to load resolve context.'))
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [open, incidentId])

  useEffect(() => {
    if (!open) return undefined
    function onKeyDown(e) {
      if (e.key === 'Escape' && !submitting) onClose?.()
    }
    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [open, submitting, onClose])

  if (!open) return null

  const blockerMessages = []
  if (requirements.requiresAssignment && !requirements.assignedToUserId) {
    blockerMessages.push('P1 incident must be assigned before resolve.')
  }
  if (requirements.requiresSeniorSignOff && !requirements.seniorSignOffUserId) {
    blockerMessages.push('P1 incident requires senior sign-off before resolve.')
  }
  if (requirements.requiresEvidenceHold && !requirements.evidenceHoldAt) {
    blockerMessages.push('Class C/I requires evidence hold before resolve.')
  }
  if (
    requirements.requiresInvestigation &&
    !requirements.hasInvestigationAction &&
    !requirements.lifecycleWasInvestigation
  ) {
    blockerMessages.push('Class C/I requires investigation before resolve.')
  }

  const compensationLabel =
    persisted.compensationAmountBhd != null
      ? formatAdminMoney(persisted.compensationAmountBhd)
      : null

  const bearerParts = []
  if (persisted.costBearer) {
    bearerParts.push(formatCostBearerLabel(persisted.costBearer))
  }
  if (persisted.bearerWasOverridden && persisted.bearerOverrideReason) {
    bearerParts.push(`Override: ${persisted.bearerOverrideReason}`)
  }

  async function handleSeniorSignOff() {
    if (!incidentId || signingOff) return
    setError(null)
    setSigningOff(true)
    try {
      const res = await adminIncidentService.seniorSignOff(incidentId)
      setContext((prev) => ({
        ...(prev || {}),
        closeRequirements: {
          ...(prev?.closeRequirements || {}),
          seniorSignOffUserId: res?.data?.seniorSignOffUserId || user?.id,
        },
      }))
    } catch (err) {
      setError(formatApiErrorMessage(err, 'Failed to record senior sign-off.'))
    } finally {
      setSigningOff(false)
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!incidentId || submitting || blockerMessages.length) return
    if (!String(resolutionCode || '').trim()) {
      setError('Select a resolution code.')
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      const body = {
        resolutionActionCode: String(resolutionCode).trim(),
      }
      if (note.trim()) body.freeTextNote = note.trim()
      await adminIncidentService.resolveTyped(incidentId, body)
      onSuccess?.()
      onClose?.()
    } catch (err) {
      setError(formatApiErrorMessage(err, 'Failed to mark resolved.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[145] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close mark resolved modal"
        onClick={submitting ? undefined : onClose}
        className="absolute inset-0 bg-black/40"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="mark-resolved-title"
        className="relative flex max-h-[calc(100vh-32px)] w-full max-w-[520px] flex-col overflow-hidden rounded-[16px] bg-white shadow-[0_12px_40px_rgba(20,40,28,.18)]"
      >
        <div className="flex shrink-0 items-start gap-3 px-5 pt-5 pb-3">
          <div className="min-w-0 flex-1">
            <h2 id="mark-resolved-title" className="text-[16px] font-bold text-[#17231c]">
              Mark resolved
            </h2>
            <p className="mt-0.5 text-[12px] text-[#7c8780]">
              Typed resolution required for readiness-managed incidents.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-[#8a948e] hover:bg-[#f3f5f3]"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 pb-2">
            {loading ? (
              <p className="text-[12px] text-[#7c8780]">Loading resolve context…</p>
            ) : null}

            {context?.ambiguousResolution ? (
              <div className="rounded-[10px] bg-[#fff8e8] px-3.5 py-2.5 text-[12px] text-[#9a7618]">
                Multiple prior actions map to different resolutions — select the correct code.
              </div>
            ) : null}

            {blockerMessages.map((msg) => (
              <div
                key={msg}
                className="rounded-[10px] bg-[#fdebec] px-3.5 py-2.5 text-[12px] text-[#d64044]"
              >
                {msg}
              </div>
            ))}

            {requirements.requiresSeniorSignOff && !requirements.seniorSignOffUserId ? (
              <div className="rounded-[10px] border border-[#e8ebe9] bg-[#fafbfa] px-3.5 py-2.5">
                <p className="text-[12px] font-medium text-[#17231c]">Senior sign-off required</p>
                <p className="mt-1 text-[11px] text-[#7c8780]">
                  Requires LIVE_DASHBOARD.APPROVE permission.
                </p>
                {canSignOff ? (
                  <button
                    type="button"
                    disabled={signingOff}
                    onClick={handleSeniorSignOff}
                    className="mt-2 inline-flex h-8 items-center rounded-full bg-[#1aa054] px-3 text-[12px] font-medium text-white disabled:opacity-60"
                  >
                    {signingOff ? 'Recording…' : 'Record senior sign-off'}
                  </button>
                ) : (
                  <p className="mt-2 text-[11px] text-[#9a7618]">
                    Your account lacks APPROVE permission — ask a senior approver.
                  </p>
                )}
              </div>
            ) : null}

            <label className="block">
              <span className={labelClass}>Resolution code (required)</span>
              <div className="relative">
                <select
                  className={inputClass}
                  value={resolutionCode}
                  onChange={(e) => setResolutionCode(e.target.value)}
                  disabled={submitting || loading || blockerMessages.length > 0}
                  required
                >
                  <option value="">Select resolution…</option>
                  {codeOptions.map((code) => (
                    <option key={code} value={code}>
                      {resolutionLabel(code)}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[10px] text-[#69756d]">
                  ▾
                </span>
              </div>
            </label>

            <ReadOnlyField
              label="Customer remedy"
              value={formatCustomerRemedyLabel(persisted.customerRemedy)}
            />
            <ReadOnlyField label="Compensation" value={compensationLabel} />
            <ReadOnlyField
              label="Cost bearer"
              value={bearerParts.length ? bearerParts.join(' · ') : null}
            />
            <ReadOnlyField
              label="Enforcement"
              value={formatEnforcementLabel(persisted.enforcement)}
            />
            <ReadOnlyField
              label="Resolved by"
              value={user?.name || user?.fullName || user?.email || 'Current admin (on submit)'}
            />

            <label className="block">
              <span className={labelClass}>Note (optional)</span>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                disabled={submitting}
                rows={2}
                placeholder="Supplementary note for the audit log…"
                className="box-border w-full resize-none rounded-[8px] border border-[rgba(0,0,0,0.1)] bg-white px-3 py-2.5 text-[13px] text-[#17231c] outline-none transition placeholder:text-[#9aa49d] focus:border-[#1aa054]"
              />
            </label>

            {error ? (
              <div className="rounded-[10px] bg-[#fdebec] px-3.5 py-2.5 text-[12px] text-[#d64044]">
                {error}
              </div>
            ) : null}
          </div>

          <div className="flex shrink-0 items-center justify-end gap-2.5 border-t border-[#edf0ee] px-5 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="inline-flex h-[36px] items-center justify-center rounded-full border border-[#e4e8e4] bg-white px-4 text-[13px] font-medium text-[#455249] hover:bg-[#f6f8f6] disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                submitting || loading || blockerMessages.length > 0 || !resolutionCode
              }
              className="inline-flex h-[36px] items-center justify-center gap-1.5 rounded-full bg-[#1aa054] px-4 text-[13px] font-medium text-white hover:bg-[#158a47] disabled:opacity-60"
            >
              <CheckCircle2 size={14} strokeWidth={2.2} />
              {submitting ? 'Resolving…' : 'Mark resolved'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
