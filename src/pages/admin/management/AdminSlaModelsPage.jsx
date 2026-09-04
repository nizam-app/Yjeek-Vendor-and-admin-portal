import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  AdminVendorSlaTemplate,
  SLA_TIER_FOOTNOTES,
  SlaTierPageFooter,
  VENDOR_SLA_SECTIONS,
  CHAMP_SLA_SECTIONS,
  DISPATCHER_SLA_SECTIONS,
  buildSlaDefaults,
} from '../../../components/admin/management/AdminVendorSlaTemplate'
import { ApiErrorBanner } from '../../../components/admin/ApiState'
import { cn } from '../../../components/admin/cn'
import { useAdminSlaModels } from '../../../hooks/admin/useAdminSlaModels'
import { mapSlaConfigToForm } from '../../../mappers/admin/mapAdminSlaModels'
import { useApiMutation } from '../../../hooks/useApiMutation'
import { adminSlaModelsService } from '../../../services/admin/slaModelsService'
import { useAuth } from '../../../context/AuthContext'

const TABS = [
  { id: 'vendor', label: 'Vendor SLA', path: '/admin/sla-models' },
  { id: 'champ', label: 'Champ SLA', path: '/admin/sla-models/champ' },
  { id: 'dispatcher', label: 'Dispatcher SLA', path: '/admin/sla-models/dispatcher' },
]

function tabFromPath(pathname) {
  if (pathname.includes('/champ')) return 'champ'
  if (pathname.includes('/dispatcher')) return 'dispatcher'
  return 'vendor'
}

const TAB_COPY = {
  vendor: {
    title: 'Vendor SLA',
    subtitle: 'Service-level rules per fulfillment mode — target, at-risk, and critical thresholds per metric.',
  },
  champ: {
    title: 'Champ SLA',
    subtitle: 'Performance thresholds and CPI scoring for champs — now with at-risk and critical breakpoints.',
  },
  dispatcher: {
    title: 'Dispatcher SLA',
    subtitle: 'Assignment and incident-handling thresholds.',
  },
}

function cloneValues(value) {
  return structuredClone(value)
}

/** Group field-level changelog rows by actor, then by published version pair. */
function groupSlaChangeLog(entries) {
  const people = []
  const personIndex = new Map()

  for (const entry of entries) {
    const personKey = String(entry.changedById || entry.changedByName || 'admin')
    let person = personIndex.get(personKey)
    if (!person) {
      person = {
        id: personKey,
        changedByName: entry.changedByName || 'Admin',
        latestAt: entry.createdAt,
        batches: [],
        batchIndex: new Map(),
      }
      personIndex.set(personKey, person)
      people.push(person)
    }

    const batchKey = `${entry.previousVersion}::${entry.newVersion}`
    let batch = person.batchIndex.get(batchKey)
    if (!batch) {
      batch = {
        id: `${personKey}::${batchKey}`,
        previousVersion: entry.previousVersion,
        newVersion: entry.newVersion,
        createdAt: entry.createdAt,
        entries: [],
      }
      person.batchIndex.set(batchKey, batch)
      person.batches.push(batch)
    }
    batch.entries.push(entry)
  }

  return people.map((person) => ({
    id: person.id,
    changedByName: person.changedByName,
    latestAt: person.latestAt,
    batches: person.batches,
  }))
}

export default function AdminSlaModelsPage() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { user } = useAuth()
  const tab = tabFromPath(pathname)
  const copy = TAB_COPY[tab]
  const canViewSlaChangelog = useMemo(() => {
    const actions = user?.permissions?.SLA_MODELS
    if (Array.isArray(actions) && actions.includes('APPROVE')) return true
    const role = String(user?.role || user?.roleName || user?.roleFull || '').toLowerCase()
    return role.includes('super')
  }, [user])

  const vendorDefaults = useMemo(() => buildSlaDefaults(VENDOR_SLA_SECTIONS), [])
  const champDefaults = useMemo(() => buildSlaDefaults(CHAMP_SLA_SECTIONS), [])
  const dispatcherDefaults = useMemo(() => buildSlaDefaults(DISPATCHER_SLA_SECTIONS), [])

  const { pageData, error, isLoading, enabled, refetch } = useAdminSlaModels()
  const { mutate: saveForm, isLoading: isSaving, error: saveError, reset: resetSave } = useApiMutation(
    (payload) => adminSlaModelsService.saveForm(payload),
  )
  const { mutate: resetDraft, isLoading: isResetting, error: resetError, reset: resetResetMutation } = useApiMutation(
    (modelId) => adminSlaModelsService.reset(modelId),
  )
  const {
    mutate: applyVersion,
    isLoading: isApplying,
    error: applyError,
    reset: resetApplyMutation,
  } = useApiMutation(({ modelId, version }) =>
    adminSlaModelsService.rollback(modelId, {
      version,
      note: `Applied historical SLA v${version} from Admin preview`,
      updateActiveAssignments: true,
    }),
  )

  const [vendorValues, setVendorValues] = useState(vendorDefaults)
  const [champValues, setChampValues] = useState(champDefaults)
  const [dispatcherValues, setDispatcherValues] = useState(dispatcherDefaults)
  const [snapshot, setSnapshot] = useState({
    vendor: vendorDefaults,
    champ: champDefaults,
    dispatcher: dispatcherDefaults,
  })
  const [model, setModel] = useState(null)
  const [template, setTemplate] = useState(null)
  const [config, setConfig] = useState({})
  const [saveMessage, setSaveMessage] = useState(null)
  const [changeLog, setChangeLog] = useState([])
  const [expandedChangeBatches, setExpandedChangeBatches] = useState(() => new Set())
  const [versionUsage, setVersionUsage] = useState(null)
  const [versions, setVersions] = useState([])
  const [preview, setPreview] = useState(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [versionMenuOpen, setVersionMenuOpen] = useState(false)
  const versionMenuRef = useRef(null)
  const changeLogPeople = useMemo(() => groupSlaChangeLog(changeLog), [changeLog])

  function formatThresholdSec(seconds) {
    const total = Math.max(0, Math.round(Number(seconds) || 0))
    if (total > 0 && total % 60 === 0) {
      const minutes = total / 60
      if (minutes >= 60 && minutes % 60 === 0) return `${minutes / 60}h`
      return `${minutes}m`
    }
    return `${total}s`
  }

  function formatRelativeTime(iso) {
    if (!iso) return ''
    const then = new Date(iso).getTime()
    if (!Number.isFinite(then)) return ''
    const diffSec = Math.max(0, Math.floor((Date.now() - then) / 1000))
    if (diffSec < 60) return 'just now'
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)} min ago`
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} hours ago`
    const days = Math.floor(diffSec / 86400)
    return days === 1 ? '1 day ago' : `${days} days ago`
  }

  async function loadSlaMeta(modelId) {
    if (!modelId || !enabled) {
      setChangeLog([])
      setVersionUsage(null)
      setVersions([])
      return
    }
    try {
      const requests = [
        canViewSlaChangelog
          ? adminSlaModelsService.getChangelog(modelId, { limit: 100 })
          : Promise.resolve({ data: { changes: [] } }),
        adminSlaModelsService.getVersionUsage(modelId),
        adminSlaModelsService.getVersions(modelId),
      ]
      const [logResult, usageResult, versionsResult] = await Promise.all(requests)
      setChangeLog(canViewSlaChangelog ? (logResult?.data?.changes || []) : [])
      setVersionUsage(usageResult?.data || null)
      setVersions(versionsResult?.data?.versions || [])
    } catch {
      // Meta panels are additive — keep editor usable if endpoints fail.
      if (!canViewSlaChangelog) setChangeLog([])
    }
  }

  useEffect(() => {
    if (!pageData?.form) return
    const nextVendor = pageData.form.vendorValues || vendorDefaults
    const nextChamp = pageData.form.champValues || champDefaults
    const nextDispatcher = pageData.form.dispatcherValues || dispatcherDefaults
    setVendorValues(cloneValues(nextVendor))
    setChampValues(cloneValues(nextChamp))
    setDispatcherValues(cloneValues(nextDispatcher))
    setSnapshot({
      vendor: cloneValues(nextVendor),
      champ: cloneValues(nextChamp),
      dispatcher: cloneValues(nextDispatcher),
    })
    setModel(pageData.model || null)
    setTemplate(pageData.template || null)
    setConfig(pageData.config || {})
    setPreview(null)
    setVersionMenuOpen(false)
    if (pageData.model?.id) {
      void loadSlaMeta(pageData.model.id)
    }
  }, [pageData, vendorDefaults, champDefaults, dispatcherDefaults])

  useEffect(() => {
    if (!versionMenuOpen) return undefined
    function onPointerDown(event) {
      if (!versionMenuRef.current?.contains(event.target)) {
        setVersionMenuOpen(false)
      }
    }
    function onKeyDown(event) {
      if (event.key === 'Escape') setVersionMenuOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [versionMenuOpen])

  function openVersionPreview(row) {
    const form = mapSlaConfigToForm(row?.config || {})
    setPreview({
      version: Number(row.version) || 0,
      publishedAt: row.publishedAt || null,
      isActive: Boolean(row.isActive),
      incidentCount: row.incidentCount ?? 0,
      orderCount: row.orderCount ?? row.orderSnapshotCount ?? 0,
      vendorValues: cloneValues(form.vendorValues || vendorDefaults),
      champValues: cloneValues(form.champValues || champDefaults),
      dispatcherValues: cloneValues(form.dispatcherValues || dispatcherDefaults),
    })
    setSaveMessage(null)
    setVersionMenuOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function exitPreview() {
    setPreview(null)
    setVersionMenuOpen(false)
  }

  async function ensureVersionsLoaded() {
    if (!model?.id) return versions
    if (versions.some((row) => row?.config)) return versions
    const result = await adminSlaModelsService.getVersions(model.id)
    const list = result?.data?.versions || []
    setVersions(list)
    return list
  }

  async function handleSelectVersion(versionNumber) {
    const target = Number(versionNumber) || 0
    if (!target || !model?.id) return
    setPreviewLoading(true)
    try {
      const list = await ensureVersionsLoaded()
      const row = list.find((item) => Number(item.version) === target)
      if (row?.config) {
        openVersionPreview(row)
        return
      }
      if (target === Number(model.currentVersion)) {
        const fallbackConfig = model.publishedConfig || model.config || config
        if (fallbackConfig && typeof fallbackConfig === 'object') {
          openVersionPreview({
            version: target,
            publishedAt: model.publishedAt,
            isActive: true,
            config: fallbackConfig,
            incidentCount: versionUsage?.incidentCount ?? 0,
            orderCount: versionUsage?.orderCount ?? 0,
          })
        }
      }
    } catch {
      // Keep editor usable if versions endpoint fails.
    } finally {
      setPreviewLoading(false)
    }
  }

  async function toggleVersionMenu() {
    if (!model?.currentVersion) return
    if (versionMenuOpen) {
      setVersionMenuOpen(false)
      return
    }
    setPreviewLoading(true)
    try {
      await ensureVersionsLoaded()
      setVersionMenuOpen(true)
    } catch {
      setVersionMenuOpen(true)
    } finally {
      setPreviewLoading(false)
    }
  }

  function formatThresholdField(field) {
    const raw = String(field || '')
    if (raw === 'atRisk') return 'at-risk'
    if (raw === 'critical') return 'critical'
    if (raw === 'target') return 'target'
    return raw
  }

  function formatMetricKey(entry) {
    if (entry?.metricKey) {
      const parts = String(entry.metricKey).split('.')
      return parts[parts.length - 1] || entry.metricKey
    }
    return entry?.metricLabel || 'metric'
  }

  function toggleChangeBatch(batchId) {
    setExpandedChangeBatches((prev) => {
      const next = new Set(prev)
      if (next.has(batchId)) next.delete(batchId)
      else next.add(batchId)
      return next
    })
  }

  async function handleApplyPreviewVersion() {
    if (!model?.id || !preview?.version) return
    if (preview.isActive || Number(preview.version) === Number(model.currentVersion)) {
      exitPreview()
      return
    }
    setSaveMessage(null)
    resetApplyMutation()
    try {
      const result = await applyVersion({ modelId: model.id, version: preview.version })
      const next = result?.data
      if (next) {
        const nextConfig = next.config && typeof next.config === 'object' ? next.config : next.publishedConfig
        const nextForm = mapSlaConfigToForm(nextConfig || {})
        setModel(next)
        setConfig(nextConfig || {})
        setVendorValues(cloneValues(nextForm.vendorValues || vendorDefaults))
        setChampValues(cloneValues(nextForm.champValues || champDefaults))
        setDispatcherValues(cloneValues(nextForm.dispatcherValues || dispatcherDefaults))
        setSnapshot({
          vendor: cloneValues(nextForm.vendorValues || vendorDefaults),
          champ: cloneValues(nextForm.champValues || champDefaults),
          dispatcher: cloneValues(nextForm.dispatcherValues || dispatcherDefaults),
        })
        setSaveMessage(
          `Applied v${preview.version} as new v${next.currentVersion}. Earlier incidents keep their original snapshots.`,
        )
      }
      setPreview(null)
      const modelId = next?.id || model.id
      if (modelId) await loadSlaMeta(modelId)
      await refetch?.()
    } catch {
      // applyError banner handles display
    }
  }

  const isPreviewing = Boolean(preview)
  const displayVendorValues = preview?.vendorValues ?? vendorValues
  const displayChampValues = preview?.champValues ?? champValues
  const displayDispatcherValues = preview?.dispatcherValues ?? dispatcherValues
  const noopChange = () => {}
  const badgeVersion = isPreviewing ? preview.version : model?.currentVersion
  const badgeChangedAt = isPreviewing ? preview.publishedAt : model?.publishedAt
  const versionOptions = versions.length
    ? versions
    : model?.currentVersion
      ? [
          {
            version: model.currentVersion,
            publishedAt: model.publishedAt,
            isActive: true,
            incidentCount: versionUsage?.incidentCount ?? 0,
            orderCount: versionUsage?.orderCount ?? 0,
          },
        ]
      : []
  const canApplyPreview =
    isPreviewing &&
    Boolean(preview?.version) &&
    !preview.isActive &&
    Number(preview.version) !== Number(model?.currentVersion)

  async function handleReset() {
    setSaveMessage(null)
    resetSave()
    resetResetMutation()

    if (model?.id && enabled) {
      try {
        const result = await resetDraft(model.id)
        const next = result?.data
        const nextConfig = next?.config && typeof next.config === 'object' ? next.config : config
        const nextForm = mapSlaConfigToForm(nextConfig)
        setVendorValues(cloneValues(nextForm.vendorValues))
        setChampValues(cloneValues(nextForm.champValues))
        setDispatcherValues(cloneValues(nextForm.dispatcherValues))
        setSnapshot({
          vendor: cloneValues(nextForm.vendorValues),
          champ: cloneValues(nextForm.champValues),
          dispatcher: cloneValues(nextForm.dispatcherValues),
        })
        if (next) setModel(next)
        setConfig(nextConfig)
        setSaveMessage('SLA reset to platform defaults.')
        return
      } catch {
        // Fall back to reverting unsaved tab edits below.
      }
    }

    if (tab === 'vendor') setVendorValues(cloneValues(snapshot.vendor))
    if (tab === 'champ') setChampValues(cloneValues(snapshot.champ))
    if (tab === 'dispatcher') setDispatcherValues(cloneValues(snapshot.dispatcher))
  }

  async function handleSave() {
    setSaveMessage(null)
    resetSave()
    try {
      const result = await saveForm({
        model,
        template,
        vendorValues,
        champValues,
        dispatcherValues,
        config,
      })
      const next = result?.data
      if (next?.form) {
        setVendorValues(cloneValues(next.form.vendorValues))
        setChampValues(cloneValues(next.form.champValues))
        setDispatcherValues(cloneValues(next.form.dispatcherValues))
        setSnapshot({
          vendor: cloneValues(next.form.vendorValues),
          champ: cloneValues(next.form.champValues),
          dispatcher: cloneValues(next.form.dispatcherValues),
        })
      }
      if (next?.model) setModel(next.model)
      if (next?.config) setConfig(next.config)
      const publishedVersion = Number(next?.model?.currentVersion || 0)
      if (publishedVersion > 0) {
        setSaveMessage(
          `SLA saved as v${publishedVersion}. Earlier incidents keep their original SLA snapshot.`,
        )
      } else {
        setSaveMessage(next?.model?.status === 'PUBLISHED' ? 'SLA saved and published.' : 'SLA saved.')
      }
      if (next?.model?.id) await loadSlaMeta(next.model.id)
    } catch (error) {
      if (error?.savedModel) {
        setModel(error.savedModel)
        if (error.savedModel.config) setConfig(error.savedModel.config)
      }
    }
  }

  const saveErrorMessage = saveError
    ? saveError.draftSaved
      ? `Draft saved, but publish failed${saveError.message ? `: ${saveError.message}` : '.'}`
      : saveError.message || 'Unable to save SLA.'
    : resetError?.message || null

  return (
    <div className="px-5 py-4 pb-24 max-[700px]:px-3">
      <div className="mb-3.5 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[20px] font-bold tracking-[-0.02em] text-[#17231c]">{copy.title}</h2>
          <p className="mt-0.5 text-[12.5px] text-[#7c8780]">{copy.subtitle}</p>
          {model?.name ? (
            <p className="mt-1 text-[12px] text-[#69756d]">
              {model.name}
              {model.status ? ` · ${model.status}` : ''}
              {model.isDefault ? ' · Default' : ''}
              {isLoading ? ' · Loading…' : ''}
            </p>
          ) : isLoading ? (
            <p className="mt-1 text-[12px] text-[#69756d]">Loading SLA model…</p>
          ) : enabled && !model ? (
            <p className="mt-1 text-[12px] text-[#69756d]">No saved model yet — Save will create one.</p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {model?.currentVersion ? (
            <div className="relative" ref={versionMenuRef}>
              <button
                type="button"
                onClick={() => void toggleVersionMenu()}
                disabled={previewLoading || isSaving || isResetting}
                aria-haspopup="listbox"
                aria-expanded={versionMenuOpen}
                title="Preview a published SLA version"
                className={cn(
                  'inline-flex h-[32px] items-center gap-1.5 rounded-full px-3 text-[12px] font-semibold transition',
                  isPreviewing
                    ? 'bg-[#1aa054] text-white'
                    : 'bg-[#eef2ef] text-[#455249] hover:bg-[#e2ebe5] hover:text-[#17231c]',
                  'disabled:opacity-60',
                )}
              >
                <span>
                  {previewLoading
                    ? 'Loading…'
                    : `v${badgeVersion}${
                        badgeChangedAt ? ` · changed ${formatRelativeTime(badgeChangedAt)}` : ''
                      }`}
                </span>
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                  aria-hidden="true"
                  className={cn('opacity-80 transition', versionMenuOpen && 'rotate-180')}
                >
                  <path
                    d="M2.5 4.5L6 8l3.5-3.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              {versionMenuOpen ? (
                <div
                  role="listbox"
                  aria-label="Preview SLA version"
                  className="absolute right-0 z-30 mt-1.5 w-[280px] overflow-hidden rounded-[12px] border border-[#e4e8e4] bg-white shadow-[0_8px_24px_rgba(20,40,28,.12)]"
                >
                  <div className="border-b border-[#eef1ee] px-3 py-2">
                    <p className="text-[11px] font-bold uppercase tracking-[0.04em] text-[#8a948d]">
                      Preview SLA version
                    </p>
                    <p className="mt-0.5 text-[11px] text-[#7c8780]">
                      Read-only. Editing stays on the live draft.
                    </p>
                  </div>
                  <ul className="max-h-[280px] overflow-y-auto py-1">
                    {versionOptions.map((row) => {
                      const selected =
                        isPreviewing && Number(preview?.version) === Number(row.version)
                      return (
                        <li key={row.id || row.version}>
                          <button
                            type="button"
                            role="option"
                            aria-selected={selected}
                            onClick={() => void handleSelectVersion(row.version)}
                            className={cn(
                              'flex w-full flex-col gap-0.5 px-3 py-2.5 text-left transition hover:bg-[#f4f8f5]',
                              selected ? 'bg-[#e8f7ed]' : '',
                            )}
                          >
                            <span className="text-[12.5px] font-semibold text-[#17231c]">
                              v{row.version}
                              {row.isActive ? ' · Active' : ''}
                              {selected ? ' · Viewing' : ''}
                            </span>
                            <span className="text-[11px] text-[#8a948d]">
                              {(row.incidentCount ?? 0) === 1
                                ? '1 incident'
                                : `${row.incidentCount ?? 0} incidents`}
                              {' · '}
                              {row.orderCount ?? row.orderSnapshotCount ?? 0} orders
                              {row.publishedAt
                                ? ` · ${formatRelativeTime(row.publishedAt)}`
                                : ''}
                            </span>
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                  {isPreviewing ? (
                    <div className="space-y-2 border-t border-[#eef1ee] p-2">
                      {canApplyPreview ? (
                        <button
                          type="button"
                          onClick={() => void handleApplyPreviewVersion()}
                          disabled={isApplying}
                          className="inline-flex h-[30px] w-full items-center justify-center rounded-full bg-[#1aa054] text-[12px] font-bold text-white hover:bg-[#158a47] disabled:opacity-60"
                        >
                          {isApplying ? 'Applying…' : `Apply v${preview.version}`}
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={exitPreview}
                        disabled={isApplying}
                        className="inline-flex h-[30px] w-full items-center justify-center rounded-full border border-[#e4e8e4] bg-white text-[12px] font-bold text-[#455249] hover:bg-[#f8faf8] disabled:opacity-60"
                      >
                        Exit preview · edit live draft
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}
          <button
            type="button"
            onClick={handleReset}
            disabled={isSaving || isResetting || isPreviewing || isApplying}
            className="inline-flex h-[32px] items-center rounded-full border border-[#e4e8e4] bg-white px-3.5 text-[12px] font-bold text-[#455249] hover:bg-[#f8faf8] disabled:opacity-60"
          >
            {isResetting ? 'Resetting…' : 'Reset'}
          </button>
          {canApplyPreview ? (
            <button
              type="button"
              onClick={() => void handleApplyPreviewVersion()}
              disabled={isApplying || isSaving || isResetting}
              className="inline-flex h-[32px] items-center rounded-full bg-[#1aa054] px-3.5 text-[12px] font-bold text-white hover:bg-[#158a47] disabled:opacity-60"
            >
              {isApplying ? 'Applying…' : `Apply v${preview.version}`}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || isLoading || isResetting || isPreviewing || isApplying}
              className="inline-flex h-[32px] items-center rounded-full bg-[#1aa054] px-3.5 text-[12px] font-bold text-white hover:bg-[#158a47] disabled:opacity-60"
            >
              {isSaving ? 'Saving…' : 'Save SLA'}
            </button>
          )}
        </div>
      </div>

      {isPreviewing ? (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-[10px] border border-[#d6e4ff] bg-[#f3f7ff] px-3 py-2.5 text-[12.5px] text-[#1e3a6e]">
          <p>
            Previewing <strong>v{preview.version}</strong>
            {preview.publishedAt ? ` · published ${formatRelativeTime(preview.publishedAt)}` : ''}
            {preview.isActive ? ' · currently active' : ' · historical (read-only)'}
            {'. '}
            {(preview.incidentCount ?? 0) === 1
              ? '1 incident'
              : `${preview.incidentCount ?? 0} incidents`}
            {' · '}
            {preview.orderCount ?? 0} orders on this version.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {canApplyPreview ? (
              <button
                type="button"
                onClick={() => void handleApplyPreviewVersion()}
                disabled={isApplying}
                className="inline-flex h-[30px] shrink-0 items-center rounded-full bg-[#1aa054] px-3 text-[12px] font-bold text-white hover:bg-[#158a47] disabled:opacity-60"
              >
                {isApplying ? 'Applying…' : `Apply v${preview.version}`}
              </button>
            ) : null}
            <button
              type="button"
              onClick={exitPreview}
              disabled={isApplying}
              className="inline-flex h-[30px] shrink-0 items-center rounded-full border border-[#c5d4f0] bg-white px-3 text-[12px] font-bold text-[#1e3a6e] hover:bg-[#eaf0fc] disabled:opacity-60"
            >
              Exit preview
            </button>
          </div>
        </div>
      ) : versionUsage?.version > 0 && versionUsage?.message ? (
        <div className="mb-3 flex items-start gap-2 rounded-[10px] border border-[#d8efdf] bg-[#f3fbf6] px-3 py-2.5 text-[12.5px] leading-snug text-[#1f5c38]">
          <span aria-hidden="true" className="mt-0.5 shrink-0">
            ⚠
          </span>
          <p>
            {versionUsage.message} Saving creates v{(Number(versionUsage.version) || 0) + 1} — earlier
            incidents keep their v{versionUsage.version} snapshot.
          </p>
        </div>
      ) : (
        <p className="mb-3 text-[12px] text-[#8a948d]">
          Saving creates a new version. Earlier incidents keep their original SLA snapshot.
        </p>
      )}

      <ApiErrorBanner error={error} onRetry={refetch} />
      {saveErrorMessage ? (
        <div className="mb-3 rounded-[10px] border border-[#f2cccc] bg-[#fff5f5] px-3 py-2 text-[12.5px] text-[#a93e42]">
          {saveErrorMessage}
        </div>
      ) : null}
      {applyError?.message ? (
        <div className="mb-3 rounded-[10px] border border-[#f2cccc] bg-[#fff5f5] px-3 py-2 text-[12.5px] text-[#a93e42]">
          {applyError.message || 'Unable to apply this SLA version.'}
        </div>
      ) : null}
      {saveMessage ? <p className="mb-3 text-[13px] text-[#147940]">{saveMessage}</p> : null}

      <div className="mb-4 inline-flex flex-wrap items-center gap-1">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => navigate(item.path)}
            className={cn(
              'h-[34px] rounded-full px-4 text-[12.5px] font-bold transition',
              tab === item.id
                ? 'bg-[#e8f7ed] text-[#1aa054]'
                : 'bg-white text-[#69756d] ring-1 ring-[#e4e8e4] hover:text-[#455249]',
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'vendor' ? (
        <div className={cn(isPreviewing && 'pointer-events-none select-none opacity-[0.92]')}>
          <AdminVendorSlaTemplate
            sections={VENDOR_SLA_SECTIONS}
            values={displayVendorValues}
            onChange={isPreviewing ? noopChange : setVendorValues}
          />
        </div>
      ) : null}

      {tab === 'champ' ? (
        <div className={cn(isPreviewing && 'pointer-events-none select-none opacity-[0.92]')}>
          <AdminVendorSlaTemplate
            sections={CHAMP_SLA_SECTIONS}
            values={displayChampValues}
            onChange={isPreviewing ? noopChange : setChampValues}
          />
        </div>
      ) : null}

      {tab === 'dispatcher' ? (
        <div className={cn(isPreviewing && 'pointer-events-none select-none opacity-[0.92]')}>
          <AdminVendorSlaTemplate
            sections={DISPATCHER_SLA_SECTIONS}
            values={displayDispatcherValues}
            onChange={isPreviewing ? noopChange : setDispatcherValues}
          />
        </div>
      ) : null}

      <section className="mt-5 mb-4 rounded-[14px] border border-[#e4e8e4] bg-white p-4 shadow-[0_1px_2px_rgba(20,40,28,.04)]">
        <div className="mb-2 flex items-baseline justify-between gap-2">
          <h3 className="text-[14px] font-bold text-[#17231c]">Previous versions</h3>
          <span className="text-[11px] text-[#8a948d]">Immutable published snapshots</span>
        </div>
        {versions.length === 0 ? (
          <p className="text-[12.5px] text-[#7c8780]">No published versions yet.</p>
        ) : (
          <ul className="divide-y divide-[#eef1ee]">
            {versions.slice(0, 8).map((row) => (
              <li key={row.id || row.version} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                <button
                  type="button"
                  onClick={() => openVersionPreview(row)}
                  className={cn(
                    'min-w-0 rounded-[8px] px-1 py-0.5 text-left transition hover:bg-[#f4f8f5]',
                    isPreviewing && Number(preview?.version) === Number(row.version)
                      ? 'bg-[#e8f7ed] ring-1 ring-[#bfe8cd]'
                      : '',
                  )}
                >
                  <p className="text-[12.5px] font-semibold text-[#17231c]">
                    v{row.version}
                    {row.isActive ? ' · Active' : ''}
                    <span className="ml-1.5 text-[11px] font-medium text-[#1aa054]">Preview</span>
                  </p>
                  <p className="text-[11px] text-[#8a948d]">
                    {(row.incidentCount ?? 0) === 1
                      ? '1 incident'
                      : `${row.incidentCount ?? 0} incidents`}
                    {' · '}
                    {row.orderCount ?? row.orderSnapshotCount ?? 0} orders
                    {row.publishedAt ? ` · ${formatRelativeTime(row.publishedAt)}` : ''}
                  </p>
                </button>
                {row.note ? (
                  <p className="max-w-[220px] truncate text-[11px] text-[#69756d]">{row.note}</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      {canViewSlaChangelog ? (
      <section className="mt-0 mb-6 rounded-[14px] border border-[#e4e8e4] bg-white p-4 shadow-[0_1px_2px_rgba(20,40,28,.04)]">
        <div className="mb-2 flex items-baseline justify-between gap-2">
          <h3 className="text-[14px] font-bold text-[#17231c]">Change log</h3>
          <span className="text-[11px] text-[#8a948d]">From published SLA versions · read-only</span>
        </div>
        {changeLogPeople.length === 0 ? (
          <p className="text-[12.5px] text-[#7c8780]">No threshold changes recorded yet.</p>
        ) : (
          <ul className="divide-y divide-[#eef1ee]">
            {changeLogPeople.slice(0, 8).map((person) => {
              const totalChanges = person.batches.reduce((sum, batch) => sum + batch.entries.length, 0)
              return (
                <li key={person.id} className="py-3">
                  <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-2">
                    <p className="text-[12.5px] font-semibold text-[#17231c]">{person.changedByName}</p>
                    <time className="text-[11px] text-[#8a948d]" title={person.latestAt || undefined}>
                      {formatRelativeTime(person.latestAt)}
                    </time>
                  </div>
                  <ul className="space-y-1.5">
                    {person.batches.map((batch) => {
                      const open = expandedChangeBatches.has(batch.id)
                      const count = batch.entries.length
                      const previewKeys = [
                        ...new Set(batch.entries.slice(0, 3).map((entry) => formatMetricKey(entry))),
                      ]
                      return (
                        <li key={batch.id} className="rounded-[10px] bg-[#f7f9f7] px-3 py-2">
                          <div className="flex w-full items-start gap-2">
                            <button
                              type="button"
                              onClick={() => toggleChangeBatch(batch.id)}
                              aria-expanded={open}
                              className="min-w-0 flex-1 text-left"
                            >
                              <p className="text-[12.5px] leading-snug text-[#455249]">
                                Updated {count} {count === 1 ? 'threshold' : 'thresholds'}
                              </p>
                              {!open ? (
                                <p className="mt-0.5 truncate font-mono text-[11px] text-[#8a948d]">
                                  {previewKeys.join(', ')}
                                  {count > previewKeys.length ? ` +${count - previewKeys.length} more` : ''}
                                </p>
                              ) : null}
                            </button>
                            <p className="shrink-0 pt-0.5 text-[12.5px] text-[#69756d]">
                              <button
                                type="button"
                                onClick={() => void handleSelectVersion(batch.previousVersion)}
                                className="font-semibold text-[#1aa054] hover:underline"
                                title={`Preview v${batch.previousVersion}`}
                              >
                                v{batch.previousVersion}
                              </button>
                              {' → '}
                              <button
                                type="button"
                                onClick={() => void handleSelectVersion(batch.newVersion)}
                                className="font-semibold text-[#1aa054] hover:underline"
                                title={`Preview v${batch.newVersion}`}
                              >
                                v{batch.newVersion}
                              </button>
                            </p>
                            {person.batches.length > 1 ? (
                              <span className="mt-0.5 shrink-0 text-[11px] text-[#8a948d]">
                                {formatRelativeTime(batch.createdAt)}
                              </span>
                            ) : null}
                            <button
                              type="button"
                              onClick={() => toggleChangeBatch(batch.id)}
                              aria-expanded={open}
                              aria-label={open ? 'Hide threshold changes' : 'Show threshold changes'}
                              className="mt-0.5 shrink-0 text-[#7c8780]"
                            >
                              <ChevronDown
                                size={14}
                                className={cn('transition-transform', open && 'rotate-180')}
                                aria-hidden
                              />
                            </button>
                          </div>
                          {open ? (
                            <ul className="mt-2 max-h-56 space-y-1 overflow-y-auto border-t border-[#e4e8e4] pt-2">
                              {batch.entries.map((entry) => (
                                <li
                                  key={entry.id}
                                  className="font-mono text-[12px] leading-relaxed text-[#69756d]"
                                >
                                  <span className="text-[#455249]">{formatMetricKey(entry)}</span>
                                  {' · '}
                                  {formatThresholdField(entry.thresholdField)}{' '}
                                  {formatThresholdSec(entry.previousValue)} →{' '}
                                  {formatThresholdSec(entry.newValue)}
                                </li>
                              ))}
                            </ul>
                          ) : null}
                        </li>
                      )
                    })}
                  </ul>
                  {person.batches.length > 1 ? (
                    <p className="mt-1.5 text-[11px] text-[#8a948d]">
                      {person.batches.length} publishes · {totalChanges} threshold changes
                    </p>
                  ) : null}
                </li>
              )
            })}
          </ul>
        )}
        <p className="mt-3 text-[11.5px] leading-relaxed text-[#8a948d]">
          Every incident snapshots the version in force at evaluation. A threshold changed today never
          re-judges yesterday&apos;s breach — which is what makes a deduction defensible inside the
          3-working-day dispute window.
        </p>
      </section>
      ) : null}

      <SlaTierPageFooter footnote={SLA_TIER_FOOTNOTES[tab]} />

      <div className="fixed bottom-0 left-[250px] right-0 z-20 border-t border-[#eceeec] bg-white/95 px-5 py-3 backdrop-blur max-[900px]:left-0">
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={handleReset}
            disabled={isSaving || isResetting || isPreviewing || isApplying}
            className="inline-flex h-[36px] items-center rounded-full border border-[#e4e8e4] bg-white px-4 text-[12.5px] font-bold text-[#455249] hover:bg-[#f8faf8] disabled:opacity-60"
          >
            {isResetting ? 'Resetting…' : 'Reset'}
          </button>
          {canApplyPreview ? (
            <button
              type="button"
              onClick={() => void handleApplyPreviewVersion()}
              disabled={isApplying || isSaving || isResetting}
              className="inline-flex h-[36px] items-center rounded-full bg-[#1aa054] px-4 text-[12.5px] font-bold text-white shadow-[0_1px_2px_rgba(20,40,28,.15)] hover:bg-[#158a47] disabled:opacity-60"
            >
              {isApplying ? 'Applying…' : `Apply v${preview.version}`}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || isLoading || isResetting || isPreviewing || isApplying}
              className="inline-flex h-[36px] items-center rounded-full bg-[#1aa054] px-4 text-[12.5px] font-bold text-white shadow-[0_1px_2px_rgba(20,40,28,.15)] hover:bg-[#158a47] disabled:opacity-60"
            >
              {isSaving ? 'Saving…' : 'Save SLA'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
