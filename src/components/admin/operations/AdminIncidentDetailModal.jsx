import { useEffect, useState } from 'react'
import { Button } from '../Button'
import { Badge } from '../Badge'
import { ApiState } from '../ApiState'
import { adminIncidentService } from '../../../services/admin/incidentService'
import { mapAdminIncidentHistory } from '../../../mappers/admin/mapAdminIncidents'

/**
 * Incident history + resolver. Uses GET /admin/incidents/:id when available;
 * falls back to the list-row payload so the panel still opens.
 */
export function AdminIncidentDetailModal({ incident, onClose, onOpenOrder }) {
  const incidentId = incident?.id || null
  const [detail, setDetail] = useState(incident || null)
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(Boolean(incidentId))

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  useEffect(() => {
    if (!incidentId) {
      setIsLoading(false)
      setDetail(incident || null)
      return undefined
    }

    let cancelled = false
    setDetail(incident || null)
    setIsLoading(true)
    setError(null)

    adminIncidentService
      .get(incidentId)
      .then((response) => {
        if (cancelled) return
        setDetail(response?.data || incident)
        setIsLoading(false)
      })
      .catch((err) => {
        if (cancelled) return
        setDetail(incident)
        setError(err)
        setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [incidentId])

  if (!incident) return null

  const row = detail || incident
  const history = Array.isArray(row.history) && row.history.length
    ? row.history
    : mapAdminIncidentHistory(row)
  const resolver = row.resolvedByName || null
  const orderId = row.orderId || row.order?.id || null
  const orderNumber = row.orderNumber || row.order?.orderNumber || null

  return (
    <div
      className="fixed inset-0 z-[130] flex items-center justify-center bg-[rgba(20,25,22,.47)] p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-incident-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="w-full max-w-[440px] overflow-hidden rounded-lg bg-white shadow-[0_16px_44px_rgba(8,18,12,.28)]">
        <header className="relative border-b border-[#e7ebe8] px-4 py-3 pr-10">
          <div className="flex flex-wrap items-center gap-2">
            <h2 id="admin-incident-title" className="text-[13px] font-bold text-[#202722]">
              {row.title || 'Incident'}
            </h2>
            {row.priority ? <Badge tone={row.tone || 'red'}>{row.priority}</Badge> : null}
            {row.status ? (
              <Badge tone={String(row.status).toLowerCase() === 'resolved' ? 'green' : 'yellow'}>
                {row.status}
              </Badge>
            ) : null}
          </div>
          <p className="mt-1 truncate text-[11px] text-[#77827b]">{row.detail || row.note || '—'}</p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close incident"
            className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full text-[18px] font-light text-[#77817b] hover:bg-[#f1f3f1]"
          >
            ×
          </button>
        </header>

        <div className="max-h-[70vh] overflow-y-auto px-4 py-3">
          {isLoading && !row.title ? <ApiState isLoading error={null} /> : null}
          {error && !history.length ? (
            <p className="mb-2 text-[11px] text-[#a15b58]">Could not refresh incident detail. Showing list data.</p>
          ) : null}

          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-[11px]">
            <div>
              <dt className="text-[#7d8781]">Vendor</dt>
              <dd className="font-medium">{row.vendorName || '—'}</dd>
            </div>
            <div>
              <dt className="text-[#7d8781]">Champ</dt>
              <dd className="font-medium">{row.champName || '—'}</dd>
            </div>
            <div>
              <dt className="text-[#7d8781]">Cause</dt>
              <dd className="font-medium">{row.cause || '—'}</dd>
            </div>
            <div>
              <dt className="text-[#7d8781]">Stage</dt>
              <dd className="font-medium">{row.stage || '—'}</dd>
            </div>
          </dl>

          {row.note ? (
            <p className="mt-3 rounded-md bg-[#f6f7f6] px-2.5 py-2 text-[11px] text-[#515c55]">{row.note}</p>
          ) : null}

          <h3 className="mt-4 text-[11px] font-bold text-[#202722]">Incident history</h3>
          {history.length === 0 ? (
            <p className="mt-2 text-[11px] text-[#78837c]">No history events yet.</p>
          ) : (
            <ol className="mt-2 space-y-2">
              {history.map((event) => (
                <li key={event.id} className="flex gap-2">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#20a653]" />
                  <div>
                    <p className="text-[11px] font-medium text-[#202722]">{event.label}</p>
                    <p className="text-[10px] text-[#77827b]">
                      {event.actor || '—'}
                      {event.at ? ` · ${event.at}` : ''}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          )}

          <div className="mt-4 rounded-md border border-[#e7ebe8] bg-[#fafbfa] px-2.5 py-2">
            <p className="text-[10px] text-[#7d8781]">Resolved by</p>
            <p className="text-[12px] font-medium text-[#202722]">
              {resolver || (String(row.status).toLowerCase() === 'resolved' ? 'Admin' : 'Not resolved yet')}
            </p>
          </div>
        </div>

        <footer className="flex justify-end gap-2 border-t border-[#e3e7e4] px-4 py-2.5">
          {orderId && onOpenOrder ? (
            <Button
              type="button"
              onClick={() => onOpenOrder({ orderId, id: orderNumber || orderId })}
              className="h-[28px] rounded-full px-4"
            >
              View order
            </Button>
          ) : null}
          <Button type="button" onClick={onClose} className="h-[28px] rounded-full px-4">
            Close
          </Button>
        </footer>
      </div>
    </div>
  )
}
