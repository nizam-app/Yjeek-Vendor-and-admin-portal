import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button } from '../Button'
import { ApiState } from '../ApiState'
import AdminMarkResolvedModal from '../AdminMarkResolvedModal'
import AdminRedeliverModal from '../AdminRedeliverModal'
import AdminApplyPenaltyModal from '../AdminApplyPenaltyModal'
import AdminGoodwillModal from '../AdminGoodwillModal'
import { adminIncidentService } from '../../../services/admin/incidentService'
import { mapAdminIncidentHistory } from '../../../mappers/admin/mapAdminIncidents'
import { mapAdminAvailableActions } from '../../../mappers/admin/mapAdminOrderDetail'
import { AdminIncidentDetailContent } from './AdminIncidentDetailContent'
import { isOpenIncident, buildOpenPresenceBanner } from '../../../lib/adminIncidentPresentation'
import { useAuth } from '../../../context/AuthContext'

const LOCAL_INCIDENT_ACTIONS = new Set([
  'REDELIVER_REPLACE',
  'REDELIVER',
  'REPLACE',
  'APPLY_PENALTY',
  'APPLY_VPI_PENALTY',
  'APPLY_CPI_PENALTY',
  'GOODWILL_CREDIT',
])

/**
 * Incident detail modal — loads GET /admin/incidents/:id and renders structured readiness UI.
 */
export function AdminIncidentDetailModal({
  incident,
  onClose,
  onOpenOrder,
  onOpenChat,
  onAction,
  onPresenceChange,
}) {
  const { user } = useAuth()
  const incidentId = incident?.id || null
  const [detail, setDetail] = useState(incident || null)
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(Boolean(incidentId))
  const [markResolvedOpen, setMarkResolvedOpen] = useState(false)
  const [localAction, setLocalAction] = useState(null)
  const [presenceViewers, setPresenceViewers] = useState([])

  const refresh = useCallback(async () => {
    if (!incidentId) return
    const response = await adminIncidentService.get(incidentId)
    setDetail(response?.data || incident)
  }, [incidentId, incident])

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
        setDetail({
          ...(incident || {}),
          history: mapAdminIncidentHistory(incident),
        })
        setError(err)
        setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [incidentId, incident])

  // Soft presence heartbeat while modal is open
  useEffect(() => {
    if (!incidentId) return undefined
    let cancelled = false

    async function beat() {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return
      try {
        const response = await adminIncidentService.heartbeatPresence(incidentId)
        if (cancelled) return
        const viewers = Array.isArray(response?.data?.activeViewers)
          ? response.data.activeViewers
          : []
        const openedBy = response?.data?.openedBy ?? viewers[0] ?? null
        onPresenceChange?.({
          incidentId,
          openedBy,
          activeViewers: viewers,
          acknowledgedAt: response?.data?.acknowledgedAt ?? null,
          acknowledgedById: response?.data?.acknowledgedById ?? null,
          acknowledgedByName: response?.data?.acknowledgedByName ?? null,
          firstResponseAt: response?.data?.firstResponseAt ?? null,
        })
        setPresenceViewers(Array.isArray(viewers) ? viewers : [])
      } catch {
        // Presence is best-effort — never block the modal.
      }
    }

    void beat()
    const timer = window.setInterval(beat, 15000)
    const onVisibility = () => {
      if (document.visibilityState === 'visible') void beat()
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      cancelled = true
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisibility)
      void adminIncidentService
        .leavePresence(incidentId)
        .then((response) => {
          const viewers = Array.isArray(response?.data?.activeViewers)
            ? response.data.activeViewers
            : []
          onPresenceChange?.({
            incidentId,
            openedBy: response?.data?.openedBy ?? viewers[0] ?? null,
            activeViewers: viewers,
            acknowledgedAt: response?.data?.acknowledgedAt ?? null,
            acknowledgedById: response?.data?.acknowledgedById ?? null,
            acknowledgedByName: response?.data?.acknowledgedByName ?? null,
            firstResponseAt: response?.data?.firstResponseAt ?? null,
          })
        })
        .catch(() => undefined)
    }
  }, [incidentId, user?.id, user?.userId, onPresenceChange])

  if (!incident) return null

  const row = detail || incident
  const orderId = row.orderId || row.order?.id || null
  const orderNumber = row.orderNumber || row.order?.orderNumber || null
  const presenceBannerViewers = buildOpenPresenceBanner({
    activeViewers: presenceViewers,
    incidents: [row],
    currentUserId: user?.id || user?.userId || null,
  })
  const actionGroups = useMemo(() => {
    const groups = mapAdminAvailableActions(row.availableActions || [], {
      hasChamp: Boolean(row.champName || row.champId || row.order?.champ),
    })
    if (!row.readinessManaged || !isOpenIncident(row)) return groups
    return groups
      .map((group) => ({
        ...group,
        actions: group.actions.filter((action) => action.code !== 'MARK_RESOLVED'),
      }))
      .filter((group) => group.actions.length > 0)
  }, [row])

  function handleAction(code, id) {
    if (code === 'MARK_RESOLVED' && row.readinessManaged) {
      setMarkResolvedOpen(true)
      return
    }
    if (LOCAL_INCIDENT_ACTIONS.has(code)) {
      setLocalAction({ code, incidentId: id || incidentId })
      return
    }
    onAction?.(code, id)
  }

  const showTypedResolve =
    row.readinessManaged && isOpenIncident(row) && (row.availableActions || []).includes('MARK_RESOLVED')

  return (
    <div
      className="fixed inset-0 z-[130] flex items-center justify-center overflow-y-auto bg-[rgba(20,25,22,.47)] p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-incident-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="flex max-h-[calc(100vh-32px)] w-full max-w-[532px] flex-col overflow-hidden rounded-[14px] bg-white shadow-[0_18px_55px_rgba(8,18,12,.28)]">
        <header className="relative shrink-0 border-b border-[#e7ebe8] px-4 py-3 pr-10">
          <h2 id="admin-incident-title" className="text-[13px] font-bold text-[#202722]">
            Incident detail
          </h2>
          {orderNumber ? (
            <p className="mt-0.5 text-[10px] text-[#77827b]">Order #{orderNumber}</p>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close incident"
            className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full text-[18px] font-light text-[#77817b] hover:bg-[#f1f3f1]"
          >
            ×
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
          {isLoading && !row.title ? <ApiState isLoading error={null} /> : null}
          {error ? (
            <p className="mb-2 text-[11px] text-[#a15b58]">Could not refresh incident detail. Showing available data.</p>
          ) : null}
          <AdminIncidentDetailContent
            incident={{
              ...row,
              history: row.history?.length ? row.history : mapAdminIncidentHistory(row),
            }}
            actionGroups={actionGroups}
            onAction={handleAction}
            onOpenChat={onOpenChat}
            onRefresh={refresh}
            presenceViewers={presenceBannerViewers}
          />
        </div>

        <footer className="flex shrink-0 justify-end gap-2 border-t border-[#e3e7e4] px-4 py-2.5">
          {showTypedResolve ? (
            <Button
              type="button"
              primary
              onClick={() => setMarkResolvedOpen(true)}
              className="h-[28px] rounded-full px-4"
            >
              Mark resolved
            </Button>
          ) : null}
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
      {markResolvedOpen ? (
        <AdminMarkResolvedModal
          open
          incidentId={incidentId}
          onClose={() => setMarkResolvedOpen(false)}
          onSuccess={async () => {
            setMarkResolvedOpen(false)
            await refresh()
          }}
        />
      ) : null}
      {localAction?.code === 'REDELIVER_REPLACE' ||
      localAction?.code === 'REDELIVER' ||
      localAction?.code === 'REPLACE' ? (
        <AdminRedeliverModal
          open
          incidentId={localAction.incidentId || incidentId}
          mode={localAction.code === 'REPLACE' ? 'REPLACE' : 'REDELIVER'}
          allowModeSwitch={localAction.code === 'REDELIVER_REPLACE'}
          onClose={() => setLocalAction(null)}
          onSuccess={async () => {
            setLocalAction(null)
            await refresh()
          }}
        />
      ) : null}
      {localAction?.code === 'APPLY_PENALTY' ||
      localAction?.code === 'APPLY_VPI_PENALTY' ||
      localAction?.code === 'APPLY_CPI_PENALTY' ? (
        <AdminApplyPenaltyModal
          open
          incidentId={localAction.incidentId || incidentId}
          onClose={() => setLocalAction(null)}
          onSuccess={async () => {
            setLocalAction(null)
            await refresh()
          }}
        />
      ) : null}
      {localAction?.code === 'GOODWILL_CREDIT' ? (
        <AdminGoodwillModal
          open
          orderId={orderId}
          incidentId={localAction.incidentId || incidentId}
          onClose={() => setLocalAction(null)}
          onSuccess={async () => {
            setLocalAction(null)
            await refresh()
          }}
        />
      ) : null}
    </div>
  )
}
