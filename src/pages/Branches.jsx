import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { branches as seed } from '../data/mockData'
import branchIcon from '../assets/icon-stadium.png'

const statusPillTones = {
  Open: 'bg-green-active-bg border-green-active-text text-green-active-text',
  Busy: 'bg-[#fff5d9] border-[#d98c1a] text-[#d98c1a]',
  Closed: 'bg-[rgba(107,114,128,0.28)] border-black text-black',
  Suspended: 'bg-danger-soft border-danger text-danger',
}

const kvLabel = 'text-[10px] font-bold text-ink-faint uppercase'
const kvValue = 'text-[13px] font-semibold text-ink'

export default function Branches() {
  const navigate = useNavigate()
  const [branches, setBranches] = useState(seed)

  function setStatus(name, status) {
    setBranches((prev) => prev.map((b) => (b.name === name ? { ...b, status } : b)))
  }

  function openEdit(branch) {
    const id = branch.id || branch.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    navigate(`/branches/${id}/edit`)
  }

  return (
    <div className="px-[28px] pt-[26px] pb-10">
      <div className="mb-[18px]">
        <h1 className="text-[26px] font-bold text-ink">Branches</h1>
        <p className="text-[13px] text-ink-muted">{branches.length} branches</p>
      </div>

      <div className="flex flex-wrap gap-4">
        {branches.map((branch) => {
          const isSuspended = branch.status === 'Suspended'
          return (
            <div
              key={branch.id || branch.name}
              className={`flex w-[360px] flex-col gap-3 rounded-[14px] border bg-white p-4 ${
                isSuspended ? 'border-danger-soft' : 'border-border'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2.5">
                  <div className="flex h-4 w-8 shrink-0 items-center justify-center overflow-hidden rounded-[10px] bg-[#E5F5EB] px-1.5">
                    <img src={branchIcon} alt="" className="size-full object-contain" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-bold text-ink">{branch.name}</p>
                    <p className="truncate text-[11px] text-ink-muted">{branch.address}</p>
                  </div>
                </div>
                <span
                  className={`inline-flex shrink-0 items-center rounded-full border px-[10px] py-[3px] text-[10px] font-semibold whitespace-nowrap ${statusPillTones[branch.status]}`}
                >
                  {branch.status}
                </span>
              </div>

              {isSuspended ? (
                <p className="text-[11px] font-medium text-danger">
                  Suspended by Yjeek Admin — cannot self-unsuspend.
                </p>
              ) : (
                <div className="flex gap-1.5">
                  {['Open', 'Busy', 'Closed'].map((s) => (
                    <button
                      key={s}
                      type="button"
                      className={`rounded-[8px] border px-3 py-[6px] text-[11px] font-semibold ${
                        branch.status === s
                          ? 'border-[#1aa64d] bg-green-active-bg text-green-active-text'
                          : 'border-border bg-white text-ink-muted'
                      }`}
                      onClick={() => setStatus(branch.name, s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex justify-between gap-4">
                <div>
                  <p className={kvLabel}>Radius</p>
                  <p className={kvValue}>{isSuspended ? '—' : branch.radius || '—'}</p>
                </div>
                {!isSuspended && branch.eta ? (
                  <div>
                    <p className={kvLabel}>Eta</p>
                    <p className={kvValue}>{branch.eta}</p>
                  </div>
                ) : null}
              </div>
              <div className="flex justify-between gap-4">
                <div>
                  <p className={kvLabel}>Phone</p>
                  <p className={kvValue}>{isSuspended ? '—' : branch.phone || '—'}</p>
                </div>
                <div>
                  <p className={kvLabel}>Min order</p>
                  <p className={kvValue}>{isSuspended ? '—' : branch.minOrder || '—'}</p>
                </div>
              </div>

              <div className="h-px bg-border" />

              <button
                type="button"
                onClick={() => openEdit(branch)}
                className="inline-flex h-[31px] w-full items-center justify-center gap-1.5 rounded-[8px] border border-border bg-white px-3 text-[12px] font-semibold text-ink hover:bg-[#f7f9f7]"
              >
                ✎ Edit
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
