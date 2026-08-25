import { Check } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Badge } from '../Badge'

export function AdminVendorSla({ sla, vendorId, storeName }) {
  const navigate = useNavigate()

  if (!sla) return null

  const metrics = Array.isArray(sla.metrics) ? sla.metrics : []
  const rules = Array.isArray(sla.rules) ? sla.rules : []
  const vpiWeights = Array.isArray(sla.vpiWeights) ? sla.vpiWeights : []
  const compliance = Array.isArray(sla.compliance) ? sla.compliance : []

  const openSlaEditor = () => {
    const id = String(vendorId || '').trim()
    if (!id) return
    navigate('/admin/vendors/new', {
      state: {
        mode: 'edit',
        vendorId: id,
        storeName: storeName || sla.modelName || '',
        step: 5,
        returnTab: 'SLA',
      },
    })
  }

  return (
    <div className="space-y-4">
      <section className="rounded-[14px] border border-[#eceeec] bg-white px-5 py-5 shadow-[0_1px_2px_rgba(20,40,28,.03)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="text-[12.5px] font-medium text-[#7c8780]">SLA model</span>
              <Badge tone="green">{sla.status || 'Applied'}</Badge>
            </div>
            <h3 className="text-[20px] font-bold tracking-[-0.02em] text-[#17231c]">
              {sla.modelName}
            </h3>
            <p className="mt-1.5 text-[12px] leading-[18px] text-[#7c8780]">
              {sla.meta}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={openSlaEditor}
              className="inline-flex h-[36px] items-center rounded-sm border border-[#e4e8e4] bg-white px-4 text-[13px] font-medium text-[#455249] hover:bg-[#f6f8f6]"
            >
              Change model
            </button>
            <button
              type="button"
              onClick={openSlaEditor}
              className="inline-flex h-[36px] items-center rounded-sm bg-[#1aa054] px-4 text-[13px] font-bold text-white hover:bg-[#158a47]"
            >
              Edit SLA
            </button>
          </div>
        </div>
      </section>

      {metrics.length > 0 ? (
        <div className="grid grid-cols-4 gap-3 max-[1100px]:grid-cols-2 max-[520px]:grid-cols-1">
          {metrics.map(({ label, value, hint }) => (
            <div
              key={label}
              className="rounded-[14px] border border-[#eceeec] bg-white px-4 py-3.5 shadow-[0_1px_2px_rgba(20,40,28,.03)]"
            >
              <p className="text-[12px] text-[#7c8780]">{label}</p>
              <p className="mt-2 text-[22px] font-bold leading-none tracking-[-0.02em] text-[#17231c]">
                {value}
              </p>
              <p className="mt-2 text-[11.5px] leading-[16px] text-[#7c8780]">{hint}</p>
            </div>
          ))}
        </div>
      ) : null}

      <div className="grid grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)] items-start gap-4 max-[900px]:grid-cols-1">
        <section className="rounded-[14px] border border-[#eceeec] bg-white px-5 py-5 shadow-[0_1px_2px_rgba(20,40,28,.03)]">
          <h3 className="mb-1 text-[15px] font-bold text-[#17231c]">SLA rules</h3>
          <div className="mt-2">
            {rules.length === 0 ? (
              <p className="py-3 text-[12px] text-[#7c8780]">No SLA rules</p>
            ) : (
              rules.map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-center gap-6 border-b border-[#f0f2f0] py-3.5 last:border-0 last:pb-0"
                >
                  <span className="flex-1 text-[12.5px] text-[#7c8780]">{label}</span>
                  <span className="text-[13px] font-bold text-[#17231c]">{value}</span>
                </div>
              ))
            )}
          </div>
        </section>

        <div className="space-y-4">
          <section className="rounded-[14px] border border-[#eceeec] bg-white px-5 py-5 shadow-[0_1px_2px_rgba(20,40,28,.03)]">
            <h3 className="mb-4 text-[15px] font-bold text-[#17231c]">VPI weighting</h3>
            {vpiWeights.length === 0 ? (
              <p className="text-[12px] text-[#7c8780]">No VPI weights</p>
            ) : (
              <div className="space-y-3.5">
                {vpiWeights.map(({ label, value }) => (
                  <div key={label}>
                    <div className="mb-1.5 flex items-center justify-between gap-3">
                      <span className="text-[12.5px] text-[#7c8780]">{label}</span>
                      <span className="text-[12.5px] font-bold text-[#17231c]">{value}%</span>
                    </div>
                    <div className="h-[8px] overflow-hidden rounded-full bg-[#eef2ef]">
                      <div
                        className="h-full rounded-full bg-[#1aa054]"
                        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-[14px] border border-[#eceeec] bg-white px-5 py-5 shadow-[0_1px_2px_rgba(20,40,28,.03)]">
            <h3 className="mb-3 text-[11px] font-bold uppercase tracking-[0.06em] text-[#8a948e]">
              Compliance (30 days)
            </h3>
            {compliance.length === 0 ? (
              <p className="text-[12px] text-[#7c8780]">No compliance data</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {compliance.map(({ label, value }) => (
                  <span
                    key={label}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#e8f7ed] px-3 py-1.5 text-[12px] font-medium text-[#147940]"
                  >
                    {label} {value}%
                    <Check size={13} strokeWidth={2.6} className="text-[#1aa054]" />
                  </span>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
