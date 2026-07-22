export function AdminChampEarnings({ earnings }) {
  if (!earnings) return null

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3 max-[800px]:grid-cols-1">
        {earnings.summary.map(({ label, value }) => (
          <div
            key={label}
            className="rounded-[14px] border border-[#eceeec] bg-white px-4 py-3.5 shadow-[0_1px_2px_rgba(20,40,28,.03)]"
          >
            <p className="text-[12px] text-[#7c8780]">{label}</p>
            <p className="mt-1.5 text-[22px] font-bold leading-none tracking-[-0.02em] text-[#17231c]">
              {value}
            </p>
          </div>
        ))}
      </div>

      <section className="rounded-[14px] border border-[#eceeec] bg-white p-5 shadow-[0_1px_2px_rgba(20,40,28,.03)] max-[700px]:p-4">
        <h3 className="mb-4 text-[15px] font-bold text-[#17231c]">Earnings breakdown</h3>

        <div className="overflow-hidden rounded-[12px] border border-[#eceeec]">
          <div className="w-full max-w-full overflow-x-auto overscroll-x-contain touch-pan-x [-webkit-overflow-scrolling:touch]">
            <table className="w-full min-w-[640px] border-collapse text-left">
              <thead>
                <tr className="border-b border-[#edf0ee] bg-[#f6f8f6]">
                  {['Date', 'Deliveries', 'Earnings', 'Tips', 'Incentive'].map((column) => (
                    <th
                      key={column}
                      className="whitespace-nowrap px-4 py-2.5 text-[10px] font-medium uppercase tracking-[0.05em] text-[#8a948e]"
                    >
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {earnings.rows.map((row) => (
                  <tr key={row.date} className="border-b border-[#edf0ee] last:border-0 bg-white">
                    <td className="whitespace-nowrap px-4 py-3.5 text-[13px] font-medium text-[#17231c]">
                      {row.date}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-[13px] text-[#455249]">
                      {row.deliveries}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-[13px] font-medium text-[#17231c]">
                      {row.earnings}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-[13px] text-[#455249]">
                      {row.tips}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-[13px] text-[#455249]">
                      {row.incentive}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  )
}
