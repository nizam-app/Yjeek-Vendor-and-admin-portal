import { useEffect, useRef, useState } from 'react'
import { Bell, Power } from 'lucide-react'
import { vendor, branches as initialBranches } from '../data/mockData'

function shortName(name) {
  return name.replace('Green Kitchen — ', '')
}

export default function Topbar() {
  const [open, setOpen] = useState(false)
  const [branches, setBranches] = useState(initialBranches)
  const wrapRef = useRef(null)

  const allClosed = branches.every((b) => b.status === 'Closed')

  useEffect(() => {
    if (!open) return
    function handleClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  function toggleBranch(name) {
    setBranches((prev) =>
      prev.map((b) => (b.name === name ? { ...b, status: b.status === 'Closed' ? 'Open' : 'Closed' } : b)),
    )
  }

  function toggleAllBranches() {
    setBranches((prev) => prev.map((b) => ({ ...b, status: allClosed ? 'Open' : 'Closed' })))
    setOpen(false)
  }

  return (
    <header className="h-[var(--topbar-h)] bg-bg-white border-b border-border flex items-center justify-between px-6 sticky top-0 z-10">
      <div className="flex items-center gap-[14px]">
        <div className="flex items-center gap-2">
          <div
            className="grid place-items-center text-[18px] font-bold text-black"
            style={{ width: 28, height: 28, borderRadius: 8 }}
          >
            {vendor.name.charAt(0)}
          </div>
          <div>
            <strong className="block text-sm leading-[1.2]">{vendor.name}</strong>
            <span className="block text-xs text-ink-muted">{vendor.role}</span>
          </div>
        </div>
        <div className="relative" ref={wrapRef}>
          <button
            type="button"
            className="border border-border rounded-md py-2 px-[14px] text-[13px] font-medium bg-white text-ink hover:bg-[#f7f9f7]"
            onClick={() => setOpen((v) => !v)}
          >
            {allClosed ? 'Open branches' : 'Close branches'}
          </button>
          {open && (
            <div className="absolute top-[calc(100%+8px)] left-0 w-[220px] bg-bg-white border border-border rounded-lg shadow-[0_12px_28px_rgba(26,28,26,0.14)] p-[6px] z-20">
              <button
                type="button"
                className={`w-full flex items-center gap-2 border-none bg-transparent text-[13px] font-bold p-[10px] rounded-sm border-b border-border mb-1 ${
                  allClosed ? 'text-green-primary hover:bg-green-active-bg' : 'text-danger hover:bg-danger-soft'
                }`}
                onClick={toggleAllBranches}
              >
                <Power size={15} strokeWidth={2} />
                {allClosed ? 'Open all branches' : 'Close all branches'}
              </button>
              <ul className="list-none m-0 p-0 flex flex-col">
                {branches.map((b) => {
                  const isClosed = b.status === 'Closed'
                  return (
                    <li key={b.name} className="flex items-center justify-between py-2 px-[10px] rounded-sm hover:bg-bg-page">
                      <span className="flex items-center gap-2 text-[13px] text-ink">
                        <span className={`w-[7px] h-[7px] rounded-full shrink-0 ${isClosed ? 'bg-danger' : 'bg-green-primary'}`} />
                        {shortName(b.name)}
                      </span>
                      <button
                        type="button"
                        className={`border-none bg-transparent text-[13px] font-medium p-0 hover:underline ${
                          isClosed ? 'text-green-primary' : 'text-danger'
                        }`}
                        onClick={() => toggleBranch(b.name)}
                      >
                        {isClosed ? 'Open' : 'Close'}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-[14px]">
        <button type="button" className="border border-border rounded-sm py-[7px] px-3 text-xs font-medium bg-white inline-flex items-center gap-1">
          EN ▾
        </button>
        <button
          type="button"
          className="rounded-sm p-[6px] text-xs font-medium bg-white inline-flex items-center gap-1 text-ink-muted"
          aria-label="Notifications"
        >
          <Bell size={18} />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-[34px] h-[17px] rounded-[17px] bg-green-primary text-white grid place-items-center font-bold text-sm">G</div>
          <div>
            <strong className="block text-[12px] leading-[1.2] max-[900px]:hidden">{vendor.adminName}</strong>
            <span className="block text-xs text-ink-muted max-[900px]:hidden">{vendor.adminRole}</span>
          </div>
        </div>
      </div>
    </header>
  )
}
