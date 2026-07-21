import { useNavigate } from 'react-router-dom'
import { MoreVertical } from 'lucide-react'
import { Badge } from '../Badge'
import { cn } from '../cn'

const branchStatusTone = (status) => {
  if (status === 'Open') return 'green'
  if (status === 'Force-closed') return 'yellow'
  if (status === 'Closed') return 'gray'
  return 'gray'
}

export function AdminVendorBranches({ branches, vendorId, storeName }) {
  const navigate = useNavigate()

  const openBranch = (branch) => {
    if (!vendorId) return
    navigate(`/admin/vendors/${encodeURIComponent(vendorId)}/branches/${encodeURIComponent(branch.id)}`, {
      state: { branch, storeName, vendorId, mode: 'edit' },
    })
  }

  return (
    <section className="overflow-hidden rounded-[14px] border border-[#eceeec] bg-white shadow-[0_1px_2px_rgba(20,40,28,.03)]">
      <div className="w-full max-w-full overflow-x-auto overscroll-x-contain touch-pan-x [-webkit-overflow-scrolling:touch]">
        <table className="w-full min-w-[980px] border-collapse text-left">
          <thead>
            <tr className="border-b border-[#edf0ee] bg-[#fafbfa]">
              {['Branch', 'Area', 'Radius', 'ETA', 'Min order', 'Hours', 'Status', 'Actions'].map((column) => (
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
            {branches.map((branch) => (
              <tr key={branch.id} className="border-b border-[#f0f2f0] last:border-0 even:bg-[#fafbfa] hover:bg-[#f6f8f6]">
                <td className="whitespace-nowrap px-4 py-3.5">
                  <p className="text-[13px] font-bold text-[#17231c]">{branch.name}</p>
                  <p className="mt-0.5 text-[11px] text-[#7c8780]">{branch.block}</p>
                </td>
                <td className="whitespace-nowrap px-4 py-3.5 text-[12px] text-[#455249]">{branch.area}</td>
                <td className="whitespace-nowrap px-4 py-3.5 text-[12px] text-[#455249]">{branch.radius}</td>
                <td className="whitespace-nowrap px-4 py-3.5 text-[12px] text-[#455249]">{branch.eta}</td>
                <td className="whitespace-nowrap px-4 py-3.5 text-[12px] text-[#455249]">{branch.minOrder}</td>
                <td className={cn(
                  'whitespace-nowrap px-4 py-3.5 text-[12px]',
                  branch.hours === 'Closed today' ? 'text-[#9aa49d]' : 'text-[#455249]',
                )}
                >
                  {branch.hours}
                </td>
                <td className="whitespace-nowrap px-4 py-3.5">
                  <Badge tone={branchStatusTone(branch.status)}>{branch.status}</Badge>
                </td>
                <td className="whitespace-nowrap px-4 py-3.5">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openBranch(branch)}
                      className="text-[12px] font-medium text-[#1aa054] hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="grid h-8 w-8 place-items-center rounded-md text-[#8a948e] hover:bg-[#f3f5f3] hover:text-[#455249]"
                      aria-label={`More actions for ${branch.name}`}
                    >
                      <MoreVertical size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
