import { useEffect, useMemo, useState } from 'react'
import { X } from 'lucide-react'
import { adminIncidentService } from '../../services/admin/incidentService'
import { formatApiErrorMessage } from '../../api/errors'
import { isCanonicalResolutionCode, resolveCanonicalResolutionCode } from '../../lib/incidentTaxonomy.js'
import { useAuth } from '../../context/AuthContext'

const fieldLabelClass =
  'mb-1.5 block text-[10px] font-bold uppercase tracking-[0.08em] text-[#a07d5a]'
const inputClass =
  'box-border h-[42px] w-full appearance-none rounded-[8px] border border-[#e4e7e5] bg-white px-3 pr-9 text-[13px] font-medium text-[#101a14] outline-none transition focus:border-[#c4a574]'
const readonlyClass =
  'box-border flex min-h-[42px] w-full items-center rounded-[8px] border border-[#e4e7e5] bg-[#fafbfa] px-3 text-[13px] font-medium text-[#101a14]'

function canSeniorSignOff(user) {
  const actions = user?.permissions?.LIVE_DASHBOARD
  return Array.isArray(actions) && actions.includes('APPROVE')
}

/**
 * Mark Resolved — closed resolution vocabulary + auto SLA “Recorded” bond.
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
  const [compensationType, setCompensationType] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [signingOff, setSigningOff] = useState(false)
  const [error, setError] = useState(null)

  const requirements = context?.closeRequirements ?? {}
  const canSignOff = canSeniorSignOff(user)

  const codeOptions = useMemo(() => {
    const fromApi = Array.isArray(context?.resolutionOptions)
      ? context.resolutionOptions
      : []
    if (fromApi.length) return fromApi
    const vocab = Array.isArray(context?.resolutionVocabulary)
      ? context.resolutionVocabulary
      : []
    return vocab.map((row) => ({
      code: row.code,
      displayCode: row.code,
      label: row.label,
    }))
  }, [context])

  useEffect(() => {
    if (!open || !incidentId) return undefined
    let cancelled = false
    setLoading(true)
    setError(null)
    setContext(null)
    adminIncidentService
      .getResolveContext(incidentId)
      .then((res) => {
        if (cancelled) return
        const ctx = res?.data ?? null
        setContext(ctx)
        const initial =
          ctx?.suggestedResolutionCode && !ctx?.ambiguousResolution
            ? ctx.suggestedResolutionCode
            : ctx?.isSlaIncident
              ? 'WALLET_CREDIT_SLA_BREACH'
              : ''
        setResolutionCode(initial || '')
        const persistedType = ctx?.persisted?.compensationType
        setCompensationType(persistedType || '')
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

  const subtitleParts = [
    context?.incidentDisplayId ? `Incident #${context.incidentDisplayId}` : null,
    context?.categoryLabel || context?.title || null,
  ].filter(Boolean)

  const recordedLabel = context?.recorded?.label || '—'
  const resolvedByLabel = [
    user?.name || user?.fullName || 'You',
    'Ops',
    'now',
  ]
    .filter(Boolean)
    .join(' · ')

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
    if (!isCanonicalResolutionCode(resolutionCode)) {
      setError('Resolution must be a closed vocabulary code — free text is not allowed.')
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      const canonical = resolveCanonicalResolutionCode(resolutionCode) || resolutionCode
      await adminIncidentService.resolveTyped(incidentId, {
        resolutionActionCode: String(canonical).trim(),
        ...(compensationType ? { compensationType } : {}),
      })
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
        className="relative flex max-h-[calc(100vh-32px)] w-full max-w-[440px] flex-col overflow-hidden rounded-[11px] bg-white shadow-[0_18px_55px_rgba(0,0,0,.32)]"
      >
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-[22px] pb-2 pt-[18px]">
            <div className="relative pr-8">
              <h2 id="mark-resolved-title" className="text-[16px] font-bold text-[#101a14]">
                Mark resolved
              </h2>
              {subtitleParts.length ? (
                <p className="mt-1 text-[11.5px] text-[#6b7a71]">{subtitleParts.join(' · ')}</p>
              ) : (
                <p className="mt-1 text-[11.5px] text-[#6b7a71]">
                  Closed resolution vocabulary — no free text.
                </p>
              )}
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="absolute -right-1 -top-1 grid h-7 w-7 place-items-center rounded-md text-[#6b7a71] hover:bg-[#f1f3f1]"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {loading ? (
              <p className="text-[12px] text-[#7c8780]">Loading resolve context…</p>
            ) : null}

            {context?.ambiguousResolution ? (
              <div className="rounded-[8px] bg-[#fff8e8] px-3 py-2 text-[12px] text-[#9a7618]">
                Multiple prior actions map to different resolutions — select the correct code.
              </div>
            ) : null}

            {blockerMessages.map((msg) => (
              <div
                key={msg}
                className="rounded-[8px] bg-[#fdebec] px-3 py-2 text-[12px] text-[#d64044]"
              >
                {msg}
              </div>
            ))}

            {requirements.requiresSeniorSignOff && !requirements.seniorSignOffUserId ? (
              <div className="rounded-[8px] border border-[#e8ebe9] bg-[#fafbfa] px-3 py-2.5">
                <p className="text-[12px] font-medium text-[#101a14]">Senior sign-off required</p>
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
                    Requires LIVE_DASHBOARD.APPROVE permission.
                  </p>
                )}
              </div>
            ) : null}

            <label className="block">
              <span className={fieldLabelClass}>
                Resolution <span className="text-[#8C401D]">Required</span>
              </span>
              <div className="relative">
                <select
                  className={inputClass}
                  value={resolutionCode}
                  onChange={(e) => setResolutionCode(e.target.value)}
                  disabled={submitting || loading || blockerMessages.length > 0}
                  required
                >
                  <option value="">Select resolution…</option>
                  {codeOptions.map((row) => (
                    <option key={row.code} value={row.code}>
                      {row.displayCode || row.code}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[10px] text-[#69756d]">
                  ▾
                </span>
              </div>
              <p className="mt-1.5 text-[11px] leading-4 text-[#8a948e]">
                Closed list. Auto-selected when an action was taken this session; manual when
                closing without one.
              </p>
            </label>

            {(Array.isArray(context?.compensationTypeVocabulary)
              ? context.compensationTypeVocabulary
              : []
            ).length ? (
              <label className="block">
                <span className={fieldLabelClass}>Compensation type</span>
                <div className="relative">
                  <select
                    className={inputClass}
                    value={compensationType}
                    onChange={(e) => setCompensationType(e.target.value)}
                    disabled={submitting || loading || blockerMessages.length > 0}
                  >
                    <option value="">Auto (from resolution)</option>
                    {context.compensationTypeVocabulary.map((row) => (
                      <option key={row.code} value={row.code}>
                        {row.label || row.code}
                      </option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[10px] text-[#69756d]">
                    ▾
                  </span>
                </div>
              </label>
            ) : null}

            <div>
              <p className={fieldLabelClass}>Recorded</p>
              <div className={readonlyClass} title="Derived from SLA / prior compensation">
                {loading ? '…' : recordedLabel}
              </div>
            </div>

            <div>
              <p className={fieldLabelClass}>Resolved by</p>
              <div className={readonlyClass}>{resolvedByLabel}</div>
            </div>

            {error ? (
              <div className="rounded-[8px] bg-[#fdebec] px-3 py-2 text-[12px] text-[#d64044]">
                {error}
              </div>
            ) : null}
          </div>

          <div className="flex shrink-0 items-center justify-end gap-2.5 border-t border-[#e4e7e5] px-[22px] py-3.5">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="inline-flex h-[34px] items-center justify-center rounded-full border border-[#e4e8e4] bg-white px-4 text-[12px] font-semibold text-[#101a14] hover:bg-[#f6f8f6] disabled:opacity-60"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={
                submitting || loading || blockerMessages.length > 0 || !resolutionCode
              }
              className="inline-flex h-[34px] items-center justify-center rounded-full bg-[#1aa054] px-4 text-[12px] font-semibold text-white hover:bg-[#158a47] disabled:opacity-60"
            >
              {submitting ? 'Confirming…' : 'Confirm resolved'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
