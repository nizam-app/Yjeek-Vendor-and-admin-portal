import { Badge } from '../Badge'

function statusTone(status) {
  if (status === 'Resolved') return 'green'
  if (status === 'Open') return 'yellow'
  return 'gray'
}

export function AdminCustomerSupport({ support }) {
  if (!support) return null

  return (
    <div>
      <div className="mb-4">
        <h3 className="text-[15px] font-bold text-[#17231c]">Support &amp; complaints</h3>
        <p className="mt-1 text-[12.5px] leading-[18px] text-[#7c8780]">
          {support.subtitle}
        </p>
      </div>

      <section className="overflow-hidden rounded-[14px] border border-[#eceeec] bg-white shadow-[0_1px_2px_rgba(20,40,28,.03)]">
        <div className="w-full max-w-full overflow-x-auto overscroll-x-contain touch-pan-x [-webkit-overflow-scrolling:touch]">
          <table className="w-full min-w-[980px] border-collapse text-left">
            <thead>
              <tr className="border-b border-[#edf0ee] bg-[#f6f8f6]">
                {['Ticket', 'Subject', 'Order', 'Status', 'Date', 'Time', 'Updated', 'Remark'].map((column) => (
                  <th
                    key={column}
                    className="whitespace-nowrap px-4 py-3 text-[10px] font-medium uppercase tracking-[0.05em] text-[#8a948e]"
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {support.tickets.map((row) => (
                <tr key={row.ticket} className="border-b border-[#f0f2f0] last:border-0 hover:bg-[#fafbfa]">
                  <td className="whitespace-nowrap px-4 py-3.5 text-[12.5px] font-bold text-[#17231c]">
                    {row.ticket}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-[12.5px] text-[#455249]">{row.subject}</td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-[12.5px] text-[#455249]">{row.order}</td>
                  <td className="whitespace-nowrap px-4 py-3.5">
                    <Badge tone={statusTone(row.status)}>{row.status}</Badge>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-[12.5px] text-[#455249]">{row.date}</td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-[12.5px] text-[#455249]">{row.time}</td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-[12.5px] text-[#7c8780]">{row.updated}</td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-[12.5px] text-[#455249]">{row.remark}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
