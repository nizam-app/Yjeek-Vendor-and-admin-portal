import { useState } from 'react'
import { catalogItems } from '../data/mockData'

const cellClass = 'flex items-center text-[10.5px] font-bold text-ink-faint uppercase'

export default function Catalog() {
  const [view, setView] = useState('grid')

  return (
    <div className="pt-[18px] px-[28px] pb-5">
      <div className="flex items-center gap-3.5 mb-4">
        <div className="flex-1">
          <h1 className="text-[26px] font-bold text-ink">Food catalog</h1>
          <p className="text-[13px] text-ink-muted">{catalogItems.length} items</p>
        </div>
        <button type="button" className="bg-green-primary text-white rounded-[9px] py-[10px] px-4 text-[13px] font-semibold hover:brightness-[0.96]">
          + Add product
        </button>
      </div>

      <div className="flex items-center gap-2.5 mb-4">
        <span className="bg-green-active-bg text-green-active-text rounded-[9px] py-[9px] px-3 text-[12.5px] font-semibold whitespace-nowrap">
          Store type: Food &amp; drink
        </span>
        <div className="flex-1 bg-white border border-border rounded-[9px] py-[9px] px-3 flex items-center gap-2 text-[12.5px] text-ink-faint">
          <span>🔍</span>
          <span>Search groceries…</span>
        </div>
        <div className="bg-white border border-border rounded-[9px] py-[9px] px-3 flex items-center gap-1.5 text-[12.5px] whitespace-nowrap">
          <span className="font-semibold text-ink">Category</span>
          <span className="text-ink-muted text-[10px]">▾</span>
        </div>
        <div className="border border-border rounded-[9px] flex overflow-hidden">
          <button
            type="button"
            className={`py-[9px] px-3 text-xs font-semibold ${view === 'list' ? 'bg-ink text-white' : 'text-ink-muted'}`}
            onClick={() => setView('list')}
          >
            List
          </button>
          <button
            type="button"
            className={`py-[9px] px-3 text-xs font-semibold ${view === 'grid' ? 'bg-ink text-white' : 'text-ink-muted'}`}
            onClick={() => setView('grid')}
          >
            Grid
          </button>
        </div>
      </div>

      <div className="bg-white border border-border rounded-[14px] overflow-hidden">
        <div className="bg-[#f7faf7] flex items-center gap-3 px-4 py-3">
          <div className={`flex-1 ${cellClass}`}>PRODUCT</div>
          <div className={`w-[110px] ${cellClass}`}>PRICE</div>
          <div className={`w-[150px] ${cellClass}`}>STOCK</div>
          <div className={`w-[100px] ${cellClass}`}>STATUS</div>
          <div className="w-[70px]" />
        </div>
        {catalogItems.map((item, idx) => (
          <div key={item.name}>
            {idx > 0 ? <div className="h-px bg-border" /> : null}
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="flex-1 flex items-center gap-3 min-w-0">
                <div className="bg-[#f2f7f2] rounded-[9px] size-[38px] flex items-center justify-center text-lg shrink-0">
                  {item.icon}
                </div>
                <div className="min-w-0">
                  <p className="text-[13.5px] font-semibold text-ink truncate">{item.name}</p>
                  <p className="text-[11.5px] text-ink-faint truncate">{item.category}</p>
                </div>
              </div>
              <div className="w-[110px] text-[13px] font-bold text-green-active-text">{item.price}</div>
              <div className="w-[150px] text-[12.5px] font-medium text-ink-muted">{item.stock}</div>
              <div className="w-[100px]">
                <span className="inline-flex items-center gap-1 bg-green-active-bg text-green-active-text rounded-full py-1 px-[9px] text-[10.5px] font-semibold">
                  ● {item.status}
                </span>
              </div>
              <div className="w-[70px] flex items-center gap-2.5">
                <button type="button" className="text-[12.5px] font-semibold text-green-active-text">
                  Edit
                </button>
                <button type="button" className="text-ink-faint text-base font-bold">
                  ⋮
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
