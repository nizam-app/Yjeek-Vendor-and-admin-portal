import { useEffect, useRef, useState } from 'react'
import { Bell, Power } from 'lucide-react'
import { ApiError, getFirstFieldErrorMessage } from '../api/errors'
import { useAuth } from '../context/AuthContext'
import { useApiMutation } from '../hooks/useApiMutation'
import { useVendorBranches } from '../hooks/vendor/useVendorBranches'
import {
  branchService,
  notifyVendorBranchesUpdated,
} from '../services/vendor/branchService'

function shortName(name = '') {
  return String(name)
    .replace(/^Green Kitchen\s*[—–-]\s*/i, '')
    .trim()
}

function isBranchClosed(branch) {
  return branch?.status === 'Closed'
}

function isBranchSuspended(branch) {
  return branch?.status === 'Suspended' || Boolean(branch?.isSuspended)
}

function getActionErrorMessage(error) {
  if (!error) return 'Unable to update branches.'
  if (error instanceof ApiError) {
    const fieldMessage = getFirstFieldErrorMessage(error.fieldErrors)
    if (fieldMessage) return fieldMessage
    if (error.message) return error.message
  }
  if (typeof error?.message === 'string' && error.message) return error.message
  return 'Unable to update branches.'
}

export default function Topbar() {
  const { user } = useAuth()
  const { data, isLoading, refetch } = useVendorBranches()
  const [open, setOpen] = useState(false)
  const [branches, setBranches] = useState([])
  const [actionError, setActionError] = useState('')
  const [isBusy, setIsBusy] = useState(false)
  const wrapRef = useRef(null)
  const { mutate: closeAllBranches } = useApiMutation(() => branchService.closeAllBranches())
  const { mutate: openAllBranches } = useApiMutation(() => branchService.openAllBranches())
  const { mutate: setBranchStatus } = useApiMutation((branchId, status) =>
    branchService.setBranchStatus(branchId, status),
  )

  useEffect(() => {
    if (data?.branches) setBranches(data.branches)
  }, [data])

  const actionable = branches.filter((b) => !isBranchSuspended(b))
  const allClosed = actionable.length > 0 && actionable.every((b) => isBranchClosed(b))
  const vendorName = user?.vendorName || 'Green Kitchen'
  const vendorRole = user?.isGroupAdmin
    ? 'Group admin'
    : user?.staffRole
      ? String(user.staffRole)
          .replace(/_/g, ' ')
          .toLowerCase()
          .replace(/\b\w/g, (c) => c.toUpperCase())
      : 'Vendor'
  const adminName = user?.name || 'Vendor Admin'
  const adminRole = user?.staffRole
    ? String(user.staffRole).replace(/_/g, ' ').toLowerCase()
    : 'vendor_admin'

  useEffect(() => {
    if (!open) return
    function handleClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  async function toggleBranch(branch) {
    if (!branch?.id || isBranchSuspended(branch) || isBusy) return

    const nextStatus = isBranchClosed(branch) ? 'Open' : 'Closed'
    const previous = branches
    setActionError('')
    setIsBusy(true)
    setBranches((prev) =>
      prev.map((b) => (b.id === branch.id ? { ...b, status: nextStatus } : b)),
    )

    try {
      const result = await setBranchStatus(branch.id, nextStatus)
      if (result?.data) {
        setBranches((prev) => prev.map((b) => (b.id === branch.id ? { ...b, ...result.data } : b)))
      }
      notifyVendorBranchesUpdated()
    } catch (err) {
      setBranches(previous)
      setActionError(getActionErrorMessage(err))
    } finally {
      setIsBusy(false)
    }
  }

  async function toggleAllBranches() {
    if (isBusy || actionable.length === 0) return

    setActionError('')
    setIsBusy(true)
    const previous = branches

    try {
      if (allClosed) {
        setBranches((prev) =>
          prev.map((b) => (isBranchSuspended(b) ? b : { ...b, status: 'Open' })),
        )
        const result = await openAllBranches()
        if (result?.data?.branches) {
          setBranches(result.data.branches)
        } else {
          await refetch()
        }
      } else {
        setBranches((prev) =>
          prev.map((b) => (isBranchSuspended(b) ? b : { ...b, status: 'Closed' })),
        )
        const result = await closeAllBranches()
        if (result?.data?.branches) {
          setBranches(result.data.branches)
        } else {
          await refetch()
        }
      }
      notifyVendorBranchesUpdated()
      setOpen(false)
    } catch (err) {
      setBranches(previous)
      setActionError(getActionErrorMessage(err))
    } finally {
      setIsBusy(false)
    }
  }

  return (
    <header className="h-[var(--topbar-h)] bg-bg-white border-b border-border flex items-center justify-between px-6 sticky top-0 z-10">
      <div className="flex items-center gap-[14px]">
        <div className="flex items-center gap-2">
          <div
            className="grid place-items-center text-[18px] font-bold text-black"
            style={{ width: 28, height: 28, borderRadius: 8 }}
          >
            {vendorName.charAt(0)}
          </div>
          <div>
            <strong className="block text-sm leading-[1.2]">{vendorName}</strong>
            <span className="block text-xs text-ink-muted">{vendorRole}</span>
          </div>
        </div>
        <div className="relative" ref={wrapRef}>
          <button
            type="button"
            className="border border-border rounded-md py-2 px-[14px] text-[13px] font-medium bg-white text-ink hover:bg-[#f7f9f7] disabled:opacity-60"
            disabled={isBusy}
            onClick={() => setOpen((v) => !v)}
          >
            {allClosed ? 'Open branches' : 'Close branches'}
          </button>
          {open && (
            <div className="absolute top-[calc(100%+8px)] left-0 w-[220px] bg-bg-white border border-border rounded-lg shadow-[0_12px_28px_rgba(26,28,26,0.14)] p-[6px] z-20">
              <button
                type="button"
                disabled={isBusy || actionable.length === 0}
                className={`w-full flex items-center gap-2 border-none bg-transparent text-[13px] font-bold p-[10px] rounded-sm border-b border-border mb-1 disabled:opacity-60 ${
                  allClosed ? 'text-green-primary hover:bg-green-active-bg' : 'text-danger hover:bg-danger-soft'
                }`}
                onClick={toggleAllBranches}
              >
                <Power size={15} strokeWidth={2} />
                {allClosed ? 'Open all branches' : 'Close all branches'}
              </button>
              {actionError ? (
                <p className="px-[10px] pb-1 text-[11px] text-danger">{actionError}</p>
              ) : null}
              <ul className="list-none m-0 p-0 flex flex-col">
                {isLoading && branches.length === 0 ? (
                  <li className="py-2 px-[10px] text-[13px] text-ink-muted">Loading…</li>
                ) : null}
                {!isLoading && branches.length === 0 ? (
                  <li className="py-2 px-[10px] text-[13px] text-ink-muted">No branches</li>
                ) : null}
                {branches.map((b) => {
                  const isClosed = isBranchClosed(b)
                  const suspended = isBranchSuspended(b)
                  return (
                    <li
                      key={b.id || b.name}
                      className="flex items-center justify-between py-2 px-[10px] rounded-sm hover:bg-bg-page"
                    >
                      <span className="flex items-center gap-2 text-[13px] text-ink">
                        <span
                          className={`w-[7px] h-[7px] rounded-full shrink-0 ${
                            suspended || isClosed ? 'bg-danger' : 'bg-green-primary'
                          }`}
                        />
                        {shortName(b.name)}
                      </span>
                      {suspended ? (
                        <span className="text-[12px] text-ink-muted">Suspended</span>
                      ) : (
                        <button
                          type="button"
                          disabled={isBusy}
                          className={`border-none bg-transparent text-[13px] font-medium p-0 hover:underline disabled:opacity-60 ${
                            isClosed ? 'text-green-primary' : 'text-danger'
                          }`}
                          onClick={() => toggleBranch(b)}
                        >
                          {isClosed ? 'Open' : 'Close'}
                        </button>
                      )}
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
          <div className="w-[34px] h-[17px] rounded-[17px] bg-green-primary text-white grid place-items-center font-bold text-sm">
            {adminName.charAt(0).toUpperCase()}
          </div>
          <div>
            <strong className="block text-[12px] leading-[1.2] max-[900px]:hidden">{adminName}</strong>
            <span className="block text-xs text-ink-muted max-[900px]:hidden">{adminRole}</span>
          </div>
        </div>
      </div>
    </header>
  )
}
