import { useNavigate } from 'react-router-dom'
import { MoreVertical } from 'lucide-react'
import { Badge } from '../Badge'
import { cn } from '../cn'

const roleTone = (role) => {
  if (role === 'Vendor admin') return 'blue'
  if (role === 'Branch manager') return 'green'
  return 'gray'
}

export function AdminVendorUsers({ users, vendorId, storeName, branches }) {
  const navigate = useNavigate()

  const openUser = (user) => {
    if (!vendorId) return
    navigate(`/admin/vendors/${encodeURIComponent(vendorId)}/users/${encodeURIComponent(user.id)}`, {
      state: { user, storeName, vendorId, branches, mode: 'edit' },
    })
  }

  return (
    <section className="overflow-hidden rounded-[14px] border border-[#eceeec] bg-white shadow-[0_1px_2px_rgba(20,40,28,.03)]">
      <div className="w-full max-w-full overflow-x-auto overscroll-x-contain touch-pan-x [-webkit-overflow-scrolling:touch]">
        <table className="w-full min-w-[900px] border-collapse text-left">
          <thead>
            <tr className="border-b border-[#edf0ee] bg-[#fafbfa]">
              {['User', 'Role', 'Branch', 'Last active', 'Status', 'Actions'].map((column) => (
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
            {users.map((user) => (
              <tr key={user.id} className="border-b border-[#f0f2f0] last:border-0 even:bg-[#fafbfa] hover:bg-[#f6f8f6]">
                <td className="whitespace-nowrap px-4 py-3.5">
                  <p className="text-[13px] font-bold text-[#17231c]">{user.name}</p>
                  <p className="mt-0.5 text-[11px] text-[#7c8780]">{user.email}</p>
                </td>
                <td className="whitespace-nowrap px-4 py-3.5">
                  <Badge tone={roleTone(user.role)}>{user.role}</Badge>
                </td>
                <td className="whitespace-nowrap px-4 py-3.5 text-[12px] text-[#455249]">{user.branch}</td>
                <td className={cn(
                  'whitespace-nowrap px-4 py-3.5 text-[12px]',
                  user.lastActive === '—' ? 'text-[#9aa49d]' : 'text-[#455249]',
                )}
                >
                  {user.lastActive}
                </td>
                <td className="whitespace-nowrap px-4 py-3.5">
                  <Badge tone="green">{user.status}</Badge>
                </td>
                <td className="whitespace-nowrap px-4 py-3.5">
                  <button
                    type="button"
                    onClick={() => openUser(user)}
                    className="grid h-8 w-8 place-items-center rounded-md text-[#8a948e] hover:bg-[#f3f5f3] hover:text-[#455249]"
                    aria-label={`Edit ${user.name}`}
                  >
                    <MoreVertical size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
