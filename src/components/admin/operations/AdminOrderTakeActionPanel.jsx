import { useEffect, useMemo, useState } from 'react'
import { Button } from '../Button'
import { cn } from '../cn'
import { adminOrderService } from '../../../services/admin/orderService'
import { ApiError } from '../../../api/errors'

const TITLES = {
  REDISPATCH: 'Redispatch order',
  REFUND: 'Refund — full/partial',
  REASSIGN_CHAMP: 'Reassign champ',
  FLAG_VENDOR: 'Flag vendor',
  CANCEL: 'Cancel order',
  SUSPEND_CHAMP: 'Suspend champ',
}

const fieldLabel = 'mb-1 block text-[9px] font-medium text-[#7c8780]'
const fieldInput =
  'box-border h-[30px] w-full rounded-md border border-[#dfe4e0] bg-white px-2 text-[10px] text-[#202722] outline-none focus:border-[#1aa054]'

function SelectField({ label, value, onChange, options, placeholder = 'Select…', disabled }) {
  const empty = !options?.length
  return (
    <label className="block">
      <span className={fieldLabel}>{label}</span>
      <select
        className={cn(fieldInput, 'appearance-none')}
        value={value}
        disabled={disabled || empty}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">{empty ? 'No options from API' : placeholder}</option>
        {(options || []).map((option) => {
          const id = typeof option === 'string' ? option : option.id
          const text = typeof option === 'string' ? option : option.label
          return (
            <option key={id} value={id}>
              {text}
            </option>
          )
        })}
      </select>
    </label>
  )
}

function TextField({ label, value, onChange, type = 'text', placeholder, disabled }) {
  return (
    <label className="block">
      <span className={fieldLabel}>{label}</span>
      <input
        type={type}
        className={fieldInput}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  )
}

function CheckboxField({ label, checked, onChange, disabled }) {
  return (
    <label className="flex items-center gap-2 text-[10px] text-[#2f3933]">
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="accent-[#18a653]"
      />
      {label}
    </label>
  )
}

/**
 * Take-action form panel. Options come from GET /admin/orders/action-options.
 * Reassign loads GET /admin/orders/:orderId/nearby-champs for the target picker.
 * Submits confirmed POST bodies from Postman.
 */
export function AdminOrderTakeActionPanel({
  actionCode,
  orderId,
  champId = null,
  options,
  optionsLoading = false,
  optionsError = null,
  onCancel,
  onSuccess,
}) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const [reason, setReason] = useState('')
  const [notifyCustomer, setNotifyCustomer] = useState(true)
  const [notifyVendor, setNotifyVendor] = useState(true)
  const [refundType, setRefundType] = useState('FULL')
  const [refundAmount, setRefundAmount] = useState('')
  const [destination, setDestination] = useState('')
  const [driverId, setDriverId] = useState('')
  const [metric, setMetric] = useState('')
  const [severity, setSeverity] = useState('')
  const [flagAction, setFlagAction] = useState('')
  const [cancelCause, setCancelCause] = useState('')
  const [itemDisposition, setItemDisposition] = useState('CHAMP_KEEPS')
  const [cancelRefund, setCancelRefund] = useState('FULL')
  const [suspendType, setSuspendType] = useState('')
  const [durationHours, setDurationHours] = useState('')

  const [nearbyLoading, setNearbyLoading] = useState(false)
  const [nearbyError, setNearbyError] = useState(null)
  const [nearbyData, setNearbyData] = useState(null)

  const isReassign = actionCode === 'REASSIGN_CHAMP'
  const isSuspend = actionCode === 'SUSPEND_CHAMP'

  useEffect(() => {
    setError(null)
    setReason('')
    setNotifyCustomer(true)
    setNotifyVendor(true)
    setRefundType('FULL')
    setRefundAmount('')
    setDestination(options?.refundDestinations?.[0]?.id || '')
    // Reassign needs a *new* champ — do not prefill the current assigned champ.
    // Suspend targets the current champ — prefill when known.
    setDriverId(isSuspend ? champId || '' : '')
    setMetric(options?.flagMetrics?.[0]?.id || '')
    setSeverity(options?.flagSeverities?.[0] || '')
    setFlagAction(options?.flagActions?.[0]?.id || '')
    setCancelCause(options?.cancelCauses?.[0] || '')
    setItemDisposition('CHAMP_KEEPS')
    setCancelRefund('FULL')
    setSuspendType(options?.suspendTypes?.[0]?.id || '')
    setDurationHours(
      options?.suspendDurations?.[0]?.hours != null
        ? String(options.suspendDurations[0].hours)
        : '',
    )
    setNearbyData(null)
    setNearbyError(null)
  }, [actionCode, options, champId, isSuspend])

  useEffect(() => {
    if (!isReassign || !orderId) return undefined

    let cancelled = false

    async function loadNearby() {
      setNearbyLoading(true)
      setNearbyError(null)
      try {
        const response = await adminOrderService.getNearbyChamps(orderId)
        if (cancelled) return
        setNearbyData(response?.data || null)
      } catch (err) {
        if (cancelled) return
        setNearbyError(err)
        setNearbyData(null)
      } finally {
        if (!cancelled) setNearbyLoading(false)
      }
    }

    loadNearby()
    return () => {
      cancelled = true
    }
  }, [isReassign, orderId])

  const nearbyOptions = useMemo(() => {
    const list = nearbyData?.nearby || []
    return list.map((champ) => ({
      id: champ.id,
      label: champ.label || champ.id,
    }))
  }, [nearbyData])

  const cancelReasons = useMemo(() => {
    if (!cancelCause || !options?.cancelReasonsByCause) return []
    return options.cancelReasonsByCause[cancelCause] || []
  }, [cancelCause, options])

  const title = TITLES[actionCode] || actionCode

  async function handleSubmit(event) {
    event.preventDefault()
    if (!orderId || !actionCode) return

    setSubmitting(true)
    setError(null)

    try {
      if (actionCode === 'REDISPATCH') {
        if (!reason) throw new ApiError({ message: 'Select a redispatch reason.' })
        await adminOrderService.redispatch(orderId, {
          scope: 'FULL',
          itemIds: [],
          reason,
          notifyCustomer,
        })
      } else if (actionCode === 'REFUND') {
        if (!reason) throw new ApiError({ message: 'Select a refund reason.' })
        if (!destination) throw new ApiError({ message: 'Select a refund destination.' })
        const body = {
          type: refundType,
          destination,
          reason,
          idempotencyKey: `admin-refund-${orderId}-${Date.now()}`,
        }
        if (refundType === 'PARTIAL') {
          const amount = Number(refundAmount)
          if (!refundAmount || Number.isNaN(amount) || amount <= 0) {
            throw new ApiError({ message: 'Enter a valid partial refund amount.' })
          }
          body.amount = amount
        }
        await adminOrderService.refund(orderId, body)
      } else if (actionCode === 'REASSIGN_CHAMP') {
        if (!reason) throw new ApiError({ message: 'Select a reassign reason.' })
        if (!String(driverId || '').trim()) {
          throw new ApiError({ message: 'Select or enter the new champ driver id.' })
        }
        if (champId && String(driverId).trim() === String(champId)) {
          throw new ApiError({
            message: 'Choose a different champ — cannot reassign to the current champ.',
          })
        }
        await adminOrderService.reassignChamp(orderId, {
          driverId: String(driverId).trim(),
          reason,
          notifyCustomer,
        })
      } else if (actionCode === 'FLAG_VENDOR') {
        if (!metric || !severity || !flagAction || !reason) {
          throw new ApiError({ message: 'Complete all flag vendor fields.' })
        }
        await adminOrderService.flagVendor(orderId, {
          metric,
          severity,
          action: flagAction,
          reason,
          notifyVendor,
        })
      } else if (actionCode === 'CANCEL') {
        if (!cancelCause || !reason) {
          throw new ApiError({ message: 'Select cancel cause and reason.' })
        }
        if (!itemDisposition || !cancelRefund) {
          throw new ApiError({ message: 'Item disposition and refund are required.' })
        }
        await adminOrderService.cancel(orderId, {
          itemDisposition,
          refund: cancelRefund,
          cause: cancelCause,
          reason,
        })
      } else if (actionCode === 'SUSPEND_CHAMP') {
        if (!suspendType || !reason) {
          throw new ApiError({ message: 'Select suspend type and reason.' })
        }
        if (!String(driverId || '').trim()) {
          throw new ApiError({ message: 'Driver id is required.' })
        }
        const hours = Number(durationHours)
        const body = {
          type: suspendType,
          reason,
          driverId: String(driverId).trim(),
        }
        if (suspendType === 'TEMPORARY') {
          if (!durationHours || Number.isNaN(hours)) {
            throw new ApiError({ message: 'Select a suspension duration.' })
          }
          body.durationHours = hours
        }
        await adminOrderService.suspendChamp(orderId, body)
      } else {
        throw new ApiError({ message: `Action ${actionCode} is not supported yet.` })
      }

      onSuccess?.()
    } catch (err) {
      setError(err?.message || 'Action failed.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="absolute inset-0 z-40 flex flex-col bg-white/96 backdrop-blur-[1px]">
      <div className="flex items-center justify-between border-b border-[#e3e7e4] px-[14px] py-2.5">
        <h3 className="text-[11px] font-bold text-[#202722]">{title}</h3>
        <button
          type="button"
          onClick={onCancel}
          className="grid h-6 w-6 place-items-center rounded-full text-[16px] text-[#77817b] hover:bg-[#f1f3f1]"
          aria-label="Close action form"
        >
          ×
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
        <div className="flex-1 space-y-2.5 overflow-y-auto px-[14px] py-3">
          {optionsLoading ? (
            <p className="text-[10px] text-[#78827c]">Loading action options…</p>
          ) : null}
          {optionsError ? (
            <p className="text-[10px] text-[#d92f35]">{optionsError.message || 'Failed to load action options.'}</p>
          ) : null}

          {actionCode === 'REDISPATCH' ? (
            <>
              <SelectField
                label="Reason"
                value={reason}
                onChange={setReason}
                options={options?.redispatchReasons}
              />
              <CheckboxField
                label="Notify customer"
                checked={notifyCustomer}
                onChange={setNotifyCustomer}
              />
            </>
          ) : null}

          {actionCode === 'REFUND' ? (
            <>
              <SelectField
                label="Type"
                value={refundType}
                onChange={setRefundType}
                options={[
                  { id: 'FULL', label: 'Full' },
                  { id: 'PARTIAL', label: 'Partial' },
                ]}
                placeholder=""
              />
              {refundType === 'PARTIAL' ? (
                <TextField
                  label="Amount"
                  type="number"
                  value={refundAmount}
                  onChange={setRefundAmount}
                  placeholder="0.000"
                />
              ) : null}
              <SelectField
                label="Destination"
                value={destination}
                onChange={setDestination}
                options={options?.refundDestinations}
              />
              <SelectField
                label="Reason"
                value={reason}
                onChange={setReason}
                options={options?.refundReasons}
              />
            </>
          ) : null}

          {actionCode === 'REASSIGN_CHAMP' ? (
            <>
              {nearbyData?.currentChamp ? (
                <p className="text-[9px] text-[#78827c]">
                  Current champ: <span className="font-medium text-[#2f3933]">{nearbyData.currentChamp.label}</span>
                </p>
              ) : champId ? (
                <p className="text-[9px] text-[#78827c]">
                  Current champ id: <span className="font-medium text-[#2f3933]">{champId}</span>
                </p>
              ) : (
                <p className="text-[9px] text-[#78827c]">No current champ on this order.</p>
              )}

              {nearbyLoading ? (
                <p className="text-[9px] text-[#78827c]">Loading nearby champs…</p>
              ) : null}
              {nearbyError ? (
                <p className="text-[9px] text-[#d92f35]">
                  {nearbyError.message || 'Failed to load nearby champs.'}
                </p>
              ) : null}

              {nearbyOptions.length > 0 ? (
                <SelectField
                  label="New champ"
                  value={driverId}
                  onChange={setDriverId}
                  options={nearbyOptions}
                  placeholder="Select nearby champ…"
                />
              ) : !nearbyLoading ? (
                <p className="text-[8px] text-[#929a95]">No nearby champs available for this order.</p>
              ) : null}

              <TextField
                label={nearbyOptions.length > 0 ? 'Or enter driver id' : 'New champ driver id'}
                value={driverId}
                onChange={setDriverId}
                placeholder="Target champ / driver id"
              />
              <SelectField
                label="Reason"
                value={reason}
                onChange={setReason}
                options={options?.reassignReasons}
              />
              <CheckboxField
                label="Notify customer"
                checked={notifyCustomer}
                onChange={setNotifyCustomer}
              />
            </>
          ) : null}

          {actionCode === 'FLAG_VENDOR' ? (
            <>
              <SelectField label="Metric" value={metric} onChange={setMetric} options={options?.flagMetrics} />
              <SelectField
                label="Severity"
                value={severity}
                onChange={setSeverity}
                options={options?.flagSeverities}
              />
              <SelectField
                label="Action"
                value={flagAction}
                onChange={setFlagAction}
                options={options?.flagActions}
              />
              <SelectField
                label="Reason"
                value={reason}
                onChange={setReason}
                options={options?.flagReasons}
              />
              <CheckboxField
                label="Notify vendor"
                checked={notifyVendor}
                onChange={setNotifyVendor}
              />
            </>
          ) : null}

          {actionCode === 'CANCEL' ? (
            <>
              <SelectField
                label="Cause"
                value={cancelCause}
                onChange={(value) => {
                  setCancelCause(value)
                  setReason('')
                }}
                options={options?.cancelCauses}
              />
              <SelectField
                label="Reason"
                value={reason}
                onChange={setReason}
                options={cancelReasons}
              />
              <TextField
                label="Item disposition"
                value={itemDisposition}
                onChange={setItemDisposition}
                placeholder="e.g. CHAMP_KEEPS"
              />
              <TextField
                label="Refund"
                value={cancelRefund}
                onChange={setCancelRefund}
                placeholder="e.g. FULL"
              />
              <p className="text-[8px] text-[#929a95]">
                Disposition / refund catalogs are not in action-options — Postman sample defaults prefilled.
              </p>
            </>
          ) : null}

          {actionCode === 'SUSPEND_CHAMP' ? (
            <>
              <TextField
                label="Driver id"
                value={driverId}
                onChange={setDriverId}
                placeholder="Champ / driver id"
              />
              <SelectField
                label="Type"
                value={suspendType}
                onChange={setSuspendType}
                options={options?.suspendTypes}
              />
              {suspendType === 'TEMPORARY' ? (
                <SelectField
                  label="Duration"
                  value={durationHours}
                  onChange={setDurationHours}
                  options={(options?.suspendDurations || []).map((item) => ({
                    id: String(item.hours),
                    label: item.label,
                  }))}
                />
              ) : null}
              <SelectField
                label="Reason"
                value={reason}
                onChange={setReason}
                options={options?.suspendReasons}
              />
            </>
          ) : null}

          {error ? <p className="text-[10px] text-[#d92f35]">{error}</p> : null}
        </div>

        <div className="flex shrink-0 justify-end gap-2 border-t border-[#e3e7e4] px-[14px] py-2.5">
          <Button type="button" onClick={onCancel} className="h-[28px] rounded-full px-3" disabled={submitting}>
            Back
          </Button>
          <Button
            type="submit"
            primary
            className="h-[28px] rounded-full px-3"
            disabled={submitting || optionsLoading}
          >
            {submitting ? 'Submitting…' : 'Confirm'}
          </Button>
        </div>
      </form>
    </div>
  )
}
