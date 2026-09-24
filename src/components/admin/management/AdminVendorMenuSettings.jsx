import { useEffect, useState } from 'react'
import { cn } from '../../../components/admin/cn'
import { AdminVendorLiveMenu } from './AdminVendorLiveMenu'
import { AdminVendorMenuImport } from './AdminVendorMenuImport'

const SUB_TABS = [
  { id: 'menu', label: 'Menu' },
  { id: 'import', label: 'Import' },
]

/**
 * Vendor detail → Menu Settings: live Menu control + existing Import flow.
 */
export function AdminVendorMenuSettings({
  vendorId,
  storeName,
  initialSubTab = 'menu',
}) {
  const [subTab, setSubTab] = useState(
    initialSubTab === 'import' ? 'import' : 'menu',
  )

  useEffect(() => {
    setSubTab(initialSubTab === 'import' ? 'import' : 'menu')
  }, [initialSubTab, vendorId])

  return (
    <div className="space-y-4">
      <div className="inline-flex items-center rounded-[10px] bg-[#ebeceb] p-[4px]">
        {SUB_TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setSubTab(item.id)}
            className={cn(
              'h-[32px] min-w-[96px] rounded-[8px] px-4 text-[12.5px] transition',
              subTab === item.id
                ? 'bg-white font-bold text-[#1aa054] shadow-[0_1px_3px_rgba(20,40,28,.12)]'
                : 'font-medium text-[#69756d] hover:text-[#455249]',
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {subTab === 'menu' ? (
        <AdminVendorLiveMenu vendorId={vendorId} storeName={storeName} />
      ) : (
        <AdminVendorMenuImport vendorId={vendorId} storeName={storeName} />
      )}
    </div>
  )
}
