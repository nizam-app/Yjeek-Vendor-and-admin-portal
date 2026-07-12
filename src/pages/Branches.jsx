import { useState } from 'react'
import { branches as seed } from '../data/mockData'

const statusPillTones = {
  Open: 'bg-green-active-bg border-green-active-text text-green-active-text',
  Busy: 'bg-[#fff5d9] border-[#d98c1a] text-[#d98c1a]',
  Closed: 'bg-[rgba(107,114,128,0.28)] border-black text-black',
  Suspended: 'bg-danger-soft border-danger text-danger',
}

const kvLabel = 'text-[10px] font-bold text-ink-faint uppercase'
const kvValue = 'text-[13px] font-semibold text-ink'

export default function Branches() {
  const [branches, setBranches] = useState(seed)

  function setStatus(name, status) {
    setBranches((prev) => prev.map((b) => (b.name === name ? { ...b, status } : b)))
  }

  return (
    <div className="pt-[26px] px-[28px] pb-10">
      <div className="mb-[18px]">
        <h1 className="text-[26px] font-bold text-ink">Branches</h1>
        <p className="text-[13px] text-ink-muted">{branches.length} branches</p>
      </div>

      <div className="flex flex-wrap gap-4">
        {branches.map((branch) => {
          const isSuspended = branch.status === 'Suspended'
          return (
            <div
              key={branch.name}
              className={`bg-white border rounded-[14px] p-4 flex flex-col gap-3 w-[360px] ${
                isSuspended ? 'border-danger-soft' : 'border-border'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-[38px] h-[38px] rounded-[10px] bg-green-active-bg grid place-items-center text-green-active-text text-base">
                    🏬
                  </div>
                  <div>
                    <p className="text-[15px] font-bold text-ink">{branch.name}</p>
                    <p className="text-[11px] text-ink-muted">{branch.address}</p>
                  </div>
                </div>
                <span
                  className={`inline-flex items-center rounded-full border py-[3px] px-[10px] text-[10px] font-semibold whitespace-nowrap ${statusPillTones[branch.status]}`}
                >
                  {branch.status}
                </span>
              </div>

              {isSuspended ? (
                <p className="text-[11px] font-medium text-danger">Suspended by Yjeek Admin — cannot self-unsuspend.</p>
              ) : (
                <div className="flex gap-1.5">
                  {['Open', 'Busy', 'Closed'].map((s) => (
                    <button
                      key={s}
                      type="button"
                      className={`py-[6px] px-3 rounded-[8px] text-[11px] font-semibold border ${
                        branch.status === s
                          ? 'bg-green-active-bg border-[#1aa64d] text-green-active-text'
                          : 'bg-white border-border text-ink-muted'
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
                  <p className={kvValue}>{branch.radius || '—'}</p>
                </div>
                {branch.eta ? (
                  <div>
                    <p className={kvLabel}>Eta</p>
                    <p className={kvValue}>{branch.eta}</p>
                  </div>
                ) : null}
              </div>
              <div className="flex justify-between gap-4">
                <div>
                  <p className={kvLabel}>Phone</p>
                  <p className={kvValue}>{branch.phone || '—'}</p>
                </div>
                <div>
                  <p className={kvLabel}>Min order</p>
                  <p className={kvValue}>{branch.minOrder || '—'}</p>
                </div>
              </div>
              <div className="h-px bg-border" />
              <button type="button" className="w-full border border-border rounded-[8px] py-2 px-3 text-[12px] font-semibold bg-white text-ink hover:bg-[#f7f9f7]">
                ✎ Edit
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
