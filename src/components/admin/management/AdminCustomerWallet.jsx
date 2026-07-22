import { Badge } from '../Badge'
import { cn } from '../cn'

function typeTone(type) {
  if (type === 'Refund' || type === 'Cashback') return 'green'
  if (type === 'Spend') return 'blue'
  if (type === 'Withdraw') return 'red'
  return 'gray'
}

function WalletTable({ rows }) {
  return (
    <div className="w-full max-w-full overflow-hidden rounded-[12px] border border-[#eceeec] bg-white overscroll-x-contain touch-pan-x [-webkit-overflow-scrolling:touch]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-left">
          <thead>
            <tr className="border-b border-[#edf0ee] bg-[#f6f8f6]">
              {['Type', 'Description', 'Amount', 'Balance', 'Date'].map((column) => (
                <th
                  key={column}
                  className={cn(
                    'whitespace-nowrap px-4 py-2.5 text-[10px] font-medium uppercase tracking-[0.05em] text-[#8a948e]',
                    ['Amount', 'Balance', 'Date'].includes(column) && 'text-right',
                  )}
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr
                key={`${row.type}-${row.description}-${row.date}`}
                className={cn(
                  'border-b border-[#edf0ee] last:border-0',
                  index % 2 === 0 ? 'bg-white' : 'bg-[#f6f8f6]',
                )}
              >
                <td className="whitespace-nowrap px-4 py-3">
                  <Badge tone={typeTone(row.type)}>{row.type}</Badge>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-[12.5px] text-[#455249]">{row.description}</td>
                <td
                  className={cn(
                    'whitespace-nowrap px-4 py-3 text-right text-[12.5px] font-bold',
                    row.amount.startsWith('+') ? 'text-[#1aa054]' : 'text-[#17231c]',
                  )}
                >
                  {row.amount}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-[12.5px] font-medium text-[#17231c]">
                  {row.balance}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-[12.5px] text-[#7c8780]">{row.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function AdminCustomerWallet({ wallet }) {
  if (!wallet) return null

  return (
    <div className="space-y-4">
      <section className="rounded-[14px] border border-[#eceeec] bg-white p-5 shadow-[0_1px_2px_rgba(20,40,28,.03)] max-[700px]:p-4">
        <div className="mb-4 inline-flex min-w-[300px] flex-col rounded-[12px] bg-[#eaf2fc] px-4 py-3">
          <span className="text-[12px] text-[#2b66a5] font-semibold">Refund balance</span>
          <span className="mt-1 text-[26px] font-bold leading-none tracking-[-0.02em] text-[#2b66a5]">
            {wallet.refundBalance}
          </span>
        </div>
        <WalletTable rows={wallet.refundTransactions} />
      </section>

      <section className="rounded-[14px] border border-[#eceeec] bg-white p-5 shadow-[0_1px_2px_rgba(20,40,28,.03)] max-[700px]:p-4">
        <div className="mb-4 grid grid-cols-4 gap-3 max-[900px]:grid-cols-2 max-[520px]:grid-cols-1">
          <div className="rounded-[12px] bg-[#e8f7ed] px-4 py-3">
            <p className="text-[12px] text-[#1aa054] font-semibold">Cashback balance</p>
            <p className="mt-1 text-[26px] font-bold leading-none tracking-[-0.02em] text-[#1aa054]">
              {wallet.cashbackBalance}
            </p>
          </div>
          {[
            ['Earned (lifetime)', wallet.earnedLifetime],
            ['Pending', wallet.pending],
            ['Withdrawn', wallet.withdrawn],
          ].map(([label, value]) => (
            <div key={label} className="rounded-[12px] bg-[#f6f8f6] px-4 py-3">
              <p className="text-[12px] text-[#7c8780]">{label}</p>
              <p className="mt-1 text-[20px] font-bold leading-none tracking-[-0.02em] text-[#17231c]">{value}</p>
            </div>
          ))}
        </div>
        <WalletTable rows={wallet.cashbackTransactions} />
      </section>
    </div>
  )
}
