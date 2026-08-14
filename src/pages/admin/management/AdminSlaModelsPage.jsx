import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  AdminVendorSlaTemplate,
  VENDOR_SLA_SECTIONS,
  CHAMP_SLA_SECTIONS,
  DISPATCHER_SLA_SECTIONS,
  buildSlaDefaults,
} from '../../../components/admin/management/AdminVendorSlaTemplate'
import { ApiErrorBanner } from '../../../components/admin/ApiState'
import { cn } from '../../../components/admin/cn'
import { useAdminSlaModels } from '../../../hooks/admin/useAdminSlaModels'
import { useApiMutation } from '../../../hooks/useApiMutation'
import { adminSlaModelsService } from '../../../services/admin/slaModelsService'

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
    subtitle: 'Service-level rules per fulfillment mode — choose operator and time/limit',
  },
  champ: {
    title: 'Champ SLA',
    subtitle: 'Performance thresholds and CPI scoring for champs',
  },
  dispatcher: {
    title: 'Dispatcher SLA',
    subtitle: 'Assignment and incident-handling thresholds.',
  },
}

function cloneValues(value) {
  return structuredClone(value)
}

export default function AdminSlaModelsPage() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const tab = tabFromPath(pathname)
  const copy = TAB_COPY[tab]

  const vendorDefaults = useMemo(() => buildSlaDefaults(VENDOR_SLA_SECTIONS), [])
  const champDefaults = useMemo(() => buildSlaDefaults(CHAMP_SLA_SECTIONS), [])
  const dispatcherDefaults = useMemo(() => buildSlaDefaults(DISPATCHER_SLA_SECTIONS), [])

  const { pageData, error, isLoading, enabled, refetch } = useAdminSlaModels()
  const { mutate: saveForm, isLoading: isSaving, error: saveError, reset: resetSave } = useApiMutation(
    (payload) => adminSlaModelsService.saveForm(payload),
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
  }, [pageData, vendorDefaults, champDefaults, dispatcherDefaults])

  function handleReset() {
    setSaveMessage(null)
    resetSave()
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
      setSaveMessage(next?.model?.status === 'PUBLISHED' ? 'SLA saved and published.' : 'SLA saved.')
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
    : null

  return (
    <div className="px-5 py-4 pb-24 max-[700px]:px-3">
      <div className="mb-3.5">
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

      <ApiErrorBanner error={error} onRetry={refetch} />
      {saveErrorMessage ? (
        <div className="mb-3 rounded-[10px] border border-[#f2cccc] bg-[#fff5f5] px-3 py-2 text-[12.5px] text-[#a93e42]">
          {saveErrorMessage}
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
        <AdminVendorSlaTemplate
          sections={VENDOR_SLA_SECTIONS}
          values={vendorValues}
          onChange={setVendorValues}
        />
      ) : null}

      {tab === 'champ' ? (
        <AdminVendorSlaTemplate
          sections={CHAMP_SLA_SECTIONS}
          values={champValues}
          onChange={setChampValues}
        />
      ) : null}

      {tab === 'dispatcher' ? (
        <AdminVendorSlaTemplate
          sections={DISPATCHER_SLA_SECTIONS}
          values={dispatcherValues}
          onChange={setDispatcherValues}
        />
      ) : null}

      <div className="fixed bottom-0 left-[250px] right-0 z-20 border-t border-[#eceeec] bg-white/95 px-5 py-3 backdrop-blur max-[900px]:left-0">
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={handleReset}
            disabled={isSaving}
            className="inline-flex h-[36px] items-center rounded-full border border-[#e4e8e4] bg-white px-4 text-[12.5px] font-bold text-[#455249] hover:bg-[#f8faf8] disabled:opacity-60"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || isLoading}
            className="inline-flex h-[36px] items-center rounded-full bg-[#1aa054] px-4 text-[12.5px] font-bold text-white shadow-[0_1px_2px_rgba(20,40,28,.15)] hover:bg-[#158a47] disabled:opacity-60"
          >
            {isSaving ? 'Saving…' : 'Save SLA'}
          </button>
        </div>
      </div>
    </div>
  )
}
