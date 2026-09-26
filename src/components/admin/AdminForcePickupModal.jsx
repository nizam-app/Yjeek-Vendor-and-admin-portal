import { useState } from 'react'
import { Button } from './Button'
import { adminOrderService } from '../../services/admin/orderService'
import { formatApiErrorMessage } from '../../api/errors'
import { showError, showSuccess } from '../../utils/toast'

const MODES = [
  {
    id: 'COMPLETE_SAME_CHAMP',
    label: 'Complete pickup (same champ)',
    help: 'Mark picked up for the currently assigned champ.',
  },
  {
    id: 'UNLOCK_EARLY_PICKUP',
    label: 'Unlock early pickup',
    help: 'Allow the champ app to tap Pickup outside the window.',
  },
  {
    id: 'COMPLETE_OTHER_CHAMP',
    label: 'Complete pickup + other champ',
    help: 'Pickup completed and assign to a different champ id.',
  },
]

export default function AdminForcePickupModal({ open, orderId, orderNumber, onClose, onDone }) {
  const [mode, setMode] = useState('COMPLETE_SAME_CHAMP')
  const [champId, setChampId] = useState('')
  const [busy, setBusy] = useState(false)

  if (!open) return null

  async function submit() {
    setBusy(true)
    try {
      const body = { mode }
      if (mode === 'COMPLETE_OTHER_CHAMP') {
        if (!String(champId).trim()) {
          showError('Champ id is required for other-champ mode.')
          setBusy(false)
          return
        }
        body.champId = String(champId).trim()
      }
      const res = await adminOrderService.forcePickup(orderId, body)
      showSuccess(res?.data?.message || 'Force pickup applied.')
      onDone?.()
      onClose?.()
    } catch (err) {
      showError(formatApiErrorMessage(err, 'Force pickup failed.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
        <h3 className="text-[16px] font-bold text-[#111827]">Force pickup now</h3>
        <p className="mt-1 text-[12px] text-[#6b7280]">Order {orderNumber || orderId}</p>

        <div className="mt-4 space-y-2">
          {MODES.map((item) => (
            <label
              key={item.id}
              className="flex cursor-pointer gap-2 rounded-xl border border-[#e5e7eb] p-3 hover:border-[#1D6A33]"
            >
              <input
                type="radio"
                name="force-pickup-mode"
                checked={mode === item.id}
                onChange={() => setMode(item.id)}
                className="mt-1"
              />
              <span>
                <span className="block text-[13px] font-semibold text-[#111827]">{item.label}</span>
                <span className="block text-[11px] text-[#6b7280]">{item.help}</span>
              </span>
            </label>
          ))}
        </div>

        {mode === 'COMPLETE_OTHER_CHAMP' ? (
          <input
            className="mt-3 h-10 w-full rounded-lg border border-[#d1d5db] px-3 text-[13px]"
            placeholder="Other champ id"
            value={champId}
            onChange={(e) => setChampId(e.target.value)}
          />
        ) : null}

        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" onClick={onClose} disabled={busy} className="rounded-full px-4">
            Cancel
          </Button>
          <Button type="button" primary onClick={submit} disabled={busy} className="rounded-full px-5">
            Confirm
          </Button>
        </div>
      </div>
    </div>
  )
}
