import { useState } from 'react'
import { Map } from 'lucide-react'
import { cn } from '../cn'

function ZoneField({ label, aside, children, className = '' }) {
  return (
    <label className={cn('block', className)}>
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <span className="text-[12px] font-medium text-[#7c8780]">{label}</span>
        {aside}
      </div>
      {children}
    </label>
  )
}

function ZoneInput({ className = '', ...props }) {
  return (
    <input
      className={cn(
        'h-[40px] w-full rounded-[8px] border border-[rgba(0,0,0,0.1)] bg-white px-3 text-[13px] text-[#17231c] outline-none transition placeholder:text-[#9aa49d] focus:border-[#1aa054]',
        className,
      )}
      {...props}
    />
  )
}

function ZoneToggle({ enabled, onChange }) {
  return (
    <div className="flex shrink-0 items-center gap-2">
      <span className="text-[12px] font-medium" style={{ color: enabled ? '#1aa054' : '#9aa49d' }}>
        {enabled ? 'Enabled' : 'Disabled'}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={onChange}
        className={cn(
          'relative h-[28px] w-[48px] rounded-full transition',
          enabled ? 'bg-[#1aa054]' : 'bg-[#d5dbd7]',
        )}
      >
        <span
          className={cn(
            'absolute top-[3px] h-[22px] w-[22px] rounded-full bg-white shadow transition',
            enabled ? 'left-[23px]' : 'left-[3px]',
          )}
        />
      </button>
    </div>
  )
}

export function AdminVendorDeliveryZones({ deliveryZones }) {
  const [defaults, setDefaults] = useState(deliveryZones.defaults)
  const { overrides } = deliveryZones

  const updateDefault = (key) => (event) => {
    setDefaults((prev) => ({ ...prev, [key]: event.target.value }))
  }

  return (
    <div className="space-y-4">
      <section className="rounded-[14px] border border-[#eceeec] bg-white px-5 py-5 shadow-[0_1px_2px_rgba(20,40,28,.03)]">
        <h3 className="mb-4 text-[15px] font-bold text-[#17231c]">Delivery</h3>

        <div className="grid grid-cols-3 gap-x-4 gap-y-4 max-[900px]:grid-cols-2 max-[560px]:grid-cols-1">
          <ZoneField label="Delivery radius (km)">
            <ZoneInput value={defaults.radiusKm} onChange={updateDefault('radiusKm')} />
          </ZoneField>
          <ZoneField label="Delivery ETA (min)">
            <ZoneInput value={defaults.etaMin} onChange={updateDefault('etaMin')} />
          </ZoneField>
          <ZoneField label="Min order for delivery (BHD)">
            <ZoneInput value={defaults.minOrder} onChange={updateDefault('minOrder')} />
          </ZoneField>
          <ZoneField label="Delivery contribution (BHD) / per order">
            <ZoneInput value={defaults.deliveryContribution} onChange={updateDefault('deliveryContribution')} />
          </ZoneField>
          <ZoneField
            label="Free delivery over (BHD)"
            aside={(
              <ZoneToggle
                enabled={defaults.freeDeliveryEnabled}
                onChange={() => setDefaults((prev) => ({ ...prev, freeDeliveryEnabled: !prev.freeDeliveryEnabled }))}
              />
            )}
          >
            <ZoneInput value={defaults.freeDeliveryOver} onChange={updateDefault('freeDeliveryOver')} />
          </ZoneField>
          <ZoneField label="Max distance (km)">
            <ZoneInput value={defaults.maxDistanceKm} onChange={updateDefault('maxDistanceKm')} />
          </ZoneField>
          <ZoneField label="Extra contribution per km (BHD)">
            <ZoneInput value={defaults.extraContributionPerKm} onChange={updateDefault('extraContributionPerKm')} />
          </ZoneField>
          <ZoneField label="Max contribution (BHD)">
            <ZoneInput value={defaults.maxContribution} onChange={updateDefault('maxContribution')} />
          </ZoneField>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-[#f0f2f0] pt-4">
          <p className="text-[12px] text-[#7c8780]">
            These apply as defaults. Use &lsquo;Apply to all&rsquo; to overwrite every branch now.
          </p>
          <button
            type="button"
            className="inline-flex h-[36px] shrink-0 items-center rounded-full bg-[#1aa054] px-4 text-[12px] font-bold text-white shadow-[0_1px_2px_rgba(20,40,28,.15)] hover:bg-[#158a47]"
          >
            Apply to all branches
          </button>
        </div>
      </section>

      <section className="overflow-hidden rounded-[14px] border border-[#eceeec] bg-white shadow-[0_1px_2px_rgba(20,40,28,.03)]">
        <div className="  px-5 py-4">
          <h3 className="text-[15px] font-bold text-[#17231c]">Per-branch overrides</h3>
          <p className="mt-1 text-[12px] leading-[18px] text-[#7c8780]">
            Custom radius, ETA and minimum order for individual branches.
          </p>
        </div>

        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[640px] table-fixed border-collapse bg-white">
            <colgroup>
              <col />
              <col style={{ width: '92px' }} />
              <col style={{ width: '92px' }} />
              <col style={{ width: '116px' }} />
              <col style={{ width: '116px' }} />
            </colgroup>
            <thead>
              <tr className="border-b border-[#edf0ee]">
                <th className="px-5 py-3 text-left text-[10px] font-medium uppercase tracking-[0.05em] text-[#8a948e]">
                  Branch
                </th>
                <th className="px-4 py-3 text-right text-[10px] font-medium uppercase tracking-[0.05em] text-[#8a948e]">
                  Radius
                </th>
                <th className="px-4 py-3 text-right text-[10px] font-medium uppercase tracking-[0.05em] text-[#8a948e]">
                  ETA
                </th>
                <th className="px-4 py-3 text-right text-[10px] font-medium uppercase tracking-[0.05em] text-[#8a948e]">
                  Min order
                </th>
                <th className="px-5 py-3 text-right text-[10px] font-medium uppercase tracking-[0.05em] text-[#8a948e]">
                  Del. fee
                </th>
              </tr>
            </thead>
            <tbody>
              {overrides.map((row) => (
                <tr key={row.id} className="border-b border-[#f0f2f0] last:border-0">
                  <td className="px-5 py-3.5 text-[13px] font-medium text-[#17231c]">{row.name}</td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-right text-[13px] text-[#17231c]">{row.radius}</td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-right text-[13px] text-[#17231c]">{row.eta}</td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-right text-[13px] text-[#17231c]">{row.minOrder}</td>
                  <td className="whitespace-nowrap px-5 py-3.5 text-right text-[13px] text-[#17231c]">{row.deliveryFee}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-[14px] border border-[#eceeec] bg-white px-5 py-5 shadow-[0_1px_2px_rgba(20,40,28,.03)]">
        <h3 className="mb-4 text-[15px] font-bold text-[#17231c]">Coverage map</h3>
        <div className="flex min-h-[180px] flex-col items-center justify-center rounded-[12px] border border-dashed border-[#dfe4e0] bg-[#fafbfa] px-6 py-10 text-center">
          <Map size={28} className="mb-2 text-[#b0b8b2]" strokeWidth={1.6} />
          <p className="text-[13px] font-medium text-[#7c8780]">Delivery radius &amp; zones map</p>
        </div>
      </section>
    </div>
  )
}
