import AdminDeliveryCoverageMap from '../AdminDeliveryCoverageMap'

export function AdminVendorDeliveryZones({ deliveryZones }) {
  const safeZones =
    deliveryZones && typeof deliveryZones === 'object' && !Array.isArray(deliveryZones)
      ? deliveryZones
      : { defaults: {}, overrides: [], coverage: null }

  const overrides = Array.isArray(safeZones.overrides) ? safeZones.overrides : []
  const coverage = safeZones.coverage || null

  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-[14px] border border-[#eceeec] bg-white shadow-[0_1px_2px_rgba(20,40,28,.03)]">
        <div className="px-5 py-4">
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
              {overrides.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-[13px] text-[#7c8780]">
                    No branch delivery overrides yet.
                  </td>
                </tr>
              ) : (
                overrides.map((row) => (
                  <tr key={row.id} className="border-b border-[#f0f2f0] last:border-0">
                    <td className="px-5 py-3.5 text-[13px] font-medium text-[#17231c]">{row.name}</td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-right text-[13px] text-[#17231c]">
                      {row.radius}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-right text-[13px] text-[#17231c]">
                      {row.eta}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-right text-[13px] text-[#17231c]">
                      {row.minOrder}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-right text-[13px] text-[#17231c]">
                      {row.deliveryFee}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-[14px] border border-[#eceeec] bg-white px-5 py-5 shadow-[0_1px_2px_rgba(20,40,28,.03)]">
        <h3 className="mb-4 text-[15px] font-bold text-[#17231c]">Coverage map</h3>
        <AdminDeliveryCoverageMap coverage={coverage} />
      </section>
    </div>
  )
}
