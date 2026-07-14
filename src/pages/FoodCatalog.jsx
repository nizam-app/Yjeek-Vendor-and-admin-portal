import { useMemo, useState } from 'react'
import { LayoutGrid, List, Search } from 'lucide-react'
import { catalogItems } from '../data/mockData'

const cellClass = 'flex items-center text-[10.5px] font-bold uppercase text-ink-faint'

export default function FoodCatalog() {
  const [view, setView] = useState('list')
  const [query, setQuery] = useState('')

  const filtered = useMemo(
    () =>
      catalogItems.filter((item) =>
        [item.name, item.category, item.status].join(' ').toLowerCase().includes(query.toLowerCase()),
      ),
    [query],
  )

  return (
    <div className="px-[28px] pt-[18px] pb-5">
      <div className="mb-4 flex items-center gap-3.5">
        <div className="flex-1">
          <h1 className="text-[26px] font-bold text-ink">Food catalog</h1>
          <p className="text-[13px] text-ink-muted">
            {filtered.length} items{view === 'grid' ? ' · grid view' : ''}
          </p>
        </div>
        <button
          type="button"
          className="rounded-[9px] bg-green-primary px-4 py-[10px] text-[13px] font-semibold text-white hover:brightness-[0.96]"
        >
          + Add product
        </button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2.5">
        <span className="whitespace-nowrap rounded-[9px] bg-green-active-bg px-3 py-[9px] text-[12.5px] font-semibold text-green-active-text">
          Store type: Food &amp; drink
        </span>
        <div className="flex min-w-[180px] flex-1 items-center gap-2 rounded-[9px] border border-border bg-white px-3 py-[9px] text-[12.5px]">
          <Search size={14} className="shrink-0 text-ink-faint" />
          <input
            className="w-full border-none bg-transparent text-[12.5px] text-ink outline-none placeholder:text-ink-faint"
            placeholder="Search food..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-[9px] border border-border bg-white px-3 py-[9px] text-[12.5px]"
        >
          <span className="font-semibold text-ink">Category</span>
          <span className="text-[10px] text-ink-muted">▾</span>
        </button>
        {view === 'grid' ? (
          <button
            type="button"
            className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-[9px] border border-border bg-white px-3 py-[9px] text-[12.5px]"
          >
            <span className="font-semibold text-ink">Type</span>
            <span className="text-[10px] text-ink-muted">▾</span>
          </button>
        ) : null}
        <div className="flex overflow-hidden rounded-[9px] border border-border">
          <button
            type="button"
            className={`inline-flex items-center gap-1.5 px-3 py-[9px] text-xs font-semibold ${
              view === 'list' ? 'bg-ink text-white' : 'bg-white text-ink-muted'
            }`}
            onClick={() => setView('list')}
          >
            <List size={14} />
            List
          </button>
          <button
            type="button"
            className={`inline-flex items-center gap-1.5 border-l border-border px-3 py-[9px] text-xs font-semibold ${
              view === 'grid' ? 'bg-ink text-white' : 'bg-white text-ink-muted'
            }`}
            onClick={() => setView('grid')}
          >
            <LayoutGrid size={14} />
            Grid
          </button>
        </div>
      </div>

      {view === 'list' ? (
        <div className="overflow-hidden rounded-[14px] border border-border bg-white">
          <div className="flex items-center gap-3 bg-[#f7faf7] px-4 py-3">
            <div className={`flex-1 ${cellClass}`}>PRODUCT</div>
            <div className={`w-[110px] ${cellClass}`}>PRICE</div>
            <div className={`w-[150px] ${cellClass}`}>STOCK</div>
            <div className={`w-[100px] ${cellClass}`}>STATUS</div>
            <div className="w-[70px]" />
          </div>
          {filtered.map((item, idx) => (
            <div key={item.name}>
              {idx > 0 ? <div className="h-px bg-border" /> : null}
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="flex size-[38px] shrink-0 items-center justify-center rounded-[9px] bg-[#f2f7f2] text-lg">
                    {item.icon}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[13.5px] font-semibold text-ink">{item.name}</p>
                    <p className="truncate text-[11.5px] text-ink-faint">{item.category}</p>
                  </div>
                </div>
                <div className="w-[110px] text-[13px] font-bold text-green-active-text">{item.price}</div>
                <div className="w-[150px] text-[12.5px] font-medium text-ink-muted">{item.stock}</div>
                <div className="w-[100px]">
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-active-bg px-[9px] py-1 text-[10.5px] font-semibold text-green-active-text">
                    ● {item.status}
                  </span>
                </div>
                <div className="flex w-[70px] items-center gap-2.5">
                  <button type="button" className="text-[12.5px] font-semibold text-green-active-text">
                    Edit
                  </button>
                  <button type="button" className="text-base font-bold text-ink-faint">
                    ⋮
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((item) => (
            <div key={item.name} className="overflow-hidden rounded-[14px] border border-border bg-white">
              <div className="relative flex h-[140px] items-center justify-center text-[48px]" style={{ background: item.cardTone }}>
                <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-[10.5px] font-semibold text-green-active-text">
                  <span className="text-[8px] leading-none">●</span>
                  {item.status}
                </span>
                <span aria-hidden="true">{item.icon}</span>
              </div>
              <div className="p-3.5">
                <p className="text-[14px] font-bold text-ink">{item.name}</p>
                <p className="mt-0.5 text-[12px] text-ink-muted">{item.category}</p>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <span className="text-[13px] font-bold text-green-active-text">{item.price}</span>
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                      item.badgeTone === 'options'
                        ? 'bg-[#ebf2ff] text-[#2978db]'
                        : 'bg-[#f2f2f2] text-ink-muted'
                    }`}
                  >
                    {item.badge}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
