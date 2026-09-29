import { useState } from 'react'
import { adminService } from '../../services/adminService'
import { formatApiErrorMessage } from '../../api/errors'
import { useApiResource } from '../../hooks/useApiResource'
import { cn } from './cn'

function TriggerSwitch({ checked, disabled, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative h-[28px] w-[48px] shrink-0 rounded-full transition disabled:opacity-60',
        checked ? 'bg-[#1aa054]' : 'bg-[#d5dbd7]',
      )}
    >
      <span
        className={cn(
          'absolute top-[3px] h-[22px] w-[22px] rounded-full bg-white shadow transition',
          checked ? 'left-[23px]' : 'left-[3px]',
        )}
      />
    </button>
  )
}

function capInputValue(maxPerWeek) {
  return maxPerWeek == null ? '' : String(maxPerWeek)
}

export default function AdminPushTriggerSettings() {
  const { data, error, isLoading, refetch } = useApiResource(
    () => adminService.listAdminMarketingPushTriggers(),
    [],
  )
  const [draftCaps, setDraftCaps] = useState({})
  const [rowError, setRowError] = useState(null)
  const [saving, setSaving] = useState(null)

  const triggers = Array.isArray(data?.triggers) ? data.triggers : []
  const weekStarts = data?.weekStarts || 'Monday 00:00 Asia/Bahrain'

  async function save(trigger, body) {
    setSaving(trigger)
    setRowError(null)
    try {
      await adminService.updateAdminMarketingPushTrigger(trigger, body)
      setDraftCaps((current) => {
        const next = { ...current }
        delete next[trigger]
        return next
      })
      await refetch()
    } catch (err) {
      setRowError(formatApiErrorMessage(err, 'Could not save this trigger.'))
    } finally {
      setSaving(null)
    }
  }

  function capDraft(trigger, stored) {
    return Object.prototype.hasOwnProperty.call(draftCaps, trigger)
      ? draftCaps[trigger]
      : capInputValue(stored)
  }

  return (
    <section className="mb-4 rounded-[14px] border border-[#eceeec] bg-white p-5 shadow-[0_1px_2px_rgba(20,40,28,.03)] max-[700px]:p-4">
      <h3 className="text-[15px] font-bold text-[#17231c]">Automated triggers</h3>
      <p className="mt-1.5 text-[12.5px] leading-[18px] text-[#7c8780]">
        Each trigger can be turned off. The weekly cap is the most one customer can receive in a
        week that starts {weekStarts}. Leave the cap empty for no weekly limit. Cart abandoned,
        expiry, win-back, and birthday start at 1. Cashback credited and referral rewarded start
        with no cap.
      </p>
      {error ? (
        <p className="mt-3 text-[12.5px] text-[#b42318]">
          {formatApiErrorMessage(error, 'Could not load trigger settings.')}
        </p>
      ) : null}
      {rowError ? <p className="mt-3 text-[12.5px] text-[#b42318]">{rowError}</p> : null}
      {isLoading && triggers.length === 0 ? (
        <p className="mt-4 text-[12.5px] text-[#7c8780]">Loading triggers…</p>
      ) : null}
      {triggers.length > 0 ? (
        <div className="mt-4 overflow-hidden rounded-[12px] border border-[#eceeec]">
          <div className="w-full max-w-full overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-left">
              <thead>
                <tr className="border-b border-[#edf0ee] bg-[#f6f8f6]">
                  {['Trigger', 'On', 'Max per week', ''].map((column) => (
                    <th
                      key={column || 'save'}
                      className="whitespace-nowrap px-4 py-2.5 text-[10px] font-medium uppercase tracking-[0.05em] text-[#8a948e]"
                    >
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {triggers.map((row) => {
                  const busy = saving === row.trigger
                  const draft = capDraft(row.trigger, row.maxPerWeek)
                  return (
                    <tr key={row.trigger} className="border-b border-[#edf0ee] bg-white last:border-0">
                      <td className="px-4 py-3.5 align-top">
                        <p className="text-[13px] font-semibold text-[#17231c]">{row.label}</p>
                        {row.note ? (
                          <p className="mt-1 max-w-[360px] text-[12px] leading-[16px] text-[#7c8780]">
                            {row.note}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3.5 align-top">
                        <TriggerSwitch
                          label={`${row.label} on`}
                          checked={Boolean(row.enabled)}
                          disabled={busy}
                          onChange={(enabled) => save(row.trigger, { enabled })}
                        />
                      </td>
                      <td className="px-4 py-3.5 align-top">
                        <input
                          type="number"
                          min={1}
                          inputMode="numeric"
                          placeholder="No cap"
                          disabled={busy}
                          value={draft}
                          onChange={(event) =>
                            setDraftCaps((current) => ({
                              ...current,
                              [row.trigger]: event.target.value,
                            }))
                          }
                          className="h-[34px] w-[96px] rounded-[10px] border border-[#e4e8e4] px-3 text-[13px] text-[#17231c] outline-none focus:border-[#1aa054]"
                        />
                      </td>
                      <td className="px-4 py-3.5 align-top text-right">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => {
                            const text = draft.trim()
                            if (text === '') {
                              save(row.trigger, { maxPerWeek: null })
                              return
                            }
                            const maxPerWeek = Number(text)
                            if (!Number.isInteger(maxPerWeek) || maxPerWeek < 1) {
                              setRowError('Weekly cap must be a whole number of at least 1, or empty.')
                              return
                            }
                            save(row.trigger, { maxPerWeek })
                          }}
                          className="inline-flex h-[32px] items-center rounded-full border border-[#e4e8e4] bg-white px-3 text-[12px] font-bold text-[#17231c] hover:bg-[#f6f8f6] disabled:opacity-60"
                        >
                          {busy ? 'Saving…' : 'Save cap'}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </section>
  )
}
