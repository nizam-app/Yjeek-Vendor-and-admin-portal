import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  AdminVendorSlaTemplate,
  VENDOR_SLA_SECTIONS,
  CHAMP_SLA_SECTIONS,
  buildSlaDefaults,
} from '../../../components/admin/management/AdminVendorSlaTemplate'
import { cn } from '../../../components/admin/cn'

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
    subtitle: 'Assignment and response targets for dispatchers.',
  },
}

export default function AdminSlaModelsPage() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const tab = tabFromPath(pathname)
  const copy = TAB_COPY[tab]

  const vendorDefaults = useMemo(() => buildSlaDefaults(VENDOR_SLA_SECTIONS), [])
  const champDefaults = useMemo(() => buildSlaDefaults(CHAMP_SLA_SECTIONS), [])
  const [vendorValues, setVendorValues] = useState(vendorDefaults)
  const [champValues, setChampValues] = useState(champDefaults)

  function handleReset() {
    if (tab === 'vendor') setVendorValues(buildSlaDefaults(VENDOR_SLA_SECTIONS))
    if (tab === 'champ') setChampValues(buildSlaDefaults(CHAMP_SLA_SECTIONS))
  }

  return (
    <div className="px-5 py-4 pb-24 max-[700px]:px-3">
      <div className="mb-3.5">
        <h2 className="text-[20px] font-bold tracking-[-0.02em] text-[#17231c]">{copy.title}</h2>
        <p className="mt-0.5 text-[12.5px] text-[#7c8780]">{copy.subtitle}</p>
      </div>

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
        <section className="rounded-[14px] border border-[#eceeec] bg-white p-5 shadow-[0_1px_2px_rgba(20,40,28,.03)]">
          <h3 className="text-[15px] font-bold text-[#17231c]">{copy.title}</h3>
          <p className="mt-1.5 text-[12.5px] text-[#7c8780]">
            Configuration for this SLA template will appear here.
          </p>
        </section>
      ) : null}

      <div className="fixed bottom-0 left-[250px] right-0 z-20 border-t border-[#eceeec] bg-white/95 px-5 py-3 backdrop-blur max-[900px]:left-0">
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex h-[36px] items-center rounded-full border border-[#e4e8e4] bg-white px-4 text-[12.5px] font-bold text-[#455249] hover:bg-[#f8faf8]"
          >
            {tab === 'champ' ? 'Reset' : 'Cancel'}
          </button>
          <button
            type="button"
            className="inline-flex h-[36px] items-center rounded-full bg-[#1aa054] px-4 text-[12.5px] font-bold text-white shadow-[0_1px_2px_rgba(20,40,28,.15)] hover:bg-[#158a47]"
          >
            Save SLA
          </button>
        </div>
      </div>
    </div>
  )
}
