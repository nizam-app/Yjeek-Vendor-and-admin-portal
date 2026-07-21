import { useEffect, useMemo, useState } from 'react'
import { LayoutGrid, List, Search } from 'lucide-react'
import { getProductImage } from '../../data/productImages'
import EditProductModal from '../../components/EditProductModal'
import { useApiResource } from '../../hooks/useApiResource'
import { vendorService } from '../../services/vendorService'

const headerCellClass =
  'flex items-center text-[11px] font-bold uppercase tracking-[0.04em] text-ink-faint'

/** Shared column widths so header + rows stay aligned */
const col = {
  price: 'w-[120px]',
  stock: 'w-[148px]',
  status: 'w-[110px]',
  actions: 'w-[78px]',
}

export default function FoodCatalog() {
  const [view, setView] = useState('list')
  const [query, setQuery] = useState('')
  const [items, setItems] = useState([])
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [modalMode, setModalMode] = useState('edit')
  const [modalOpen, setModalOpen] = useState(false)
  const { data, error, isLoading, refetch } = useApiResource(() => vendorService.getCatalogItems(), [])

  useEffect(() => {
    if (data) setItems(data)
  }, [data])

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    if (!normalizedQuery) {
      return items
    }

    return items.filter((item) =>
      [item.name, item.category, item.status]
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery),
    )
  }, [items, query])

  if (isLoading) return <div className="p-7 text-[13px] text-ink-muted">Loading products…</div>
  if (error) return <div className="p-7 text-[13px] text-danger">Unable to load products. <button onClick={refetch} className="underline">Try again</button></div>

  const handleOpenAddModal = () => {
    setModalMode('add')
    setSelectedProduct(null)
    setModalOpen(true)
  }

  const handleOpenEditModal = (product) => {
    setModalMode('edit')
    setSelectedProduct(product)
    setModalOpen(true)
  }

  const handleCloseModal = () => {
    setModalOpen(false)
    setSelectedProduct(null)
  }

  const handleSaveProduct = (savedProduct) => {
    if (modalMode === 'add') {
      setItems((currentItems) => [savedProduct, ...currentItems])
    } else {
      setItems((currentItems) =>
        currentItems.map((item) =>
          (item.id && item.id === selectedProduct?.id) || item.name === selectedProduct?.name
            ? savedProduct
            : item,
        ),
      )
    }

    setModalOpen(false)
    setSelectedProduct(null)
  }

  return (
    <>
      <div className="px-[28px] pt-[18px] pb-5">
        {/* Page header */}
        <div className="mb-4 flex items-center gap-3.5">
          <div className="flex-1">
            <h1 className="text-[20px] font-bold text-ink">
              Food catalog
            </h1>

            <p className="text-[13px] text-ink-muted">
              {filtered.length} items
              {view === 'grid' ? ' · grid view' : ''}
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenAddModal}
            className="rounded-[9px] bg-green-primary px-4 py-[10px] text-[13px] font-medium text-white transition hover:brightness-[0.96]"
          >
            + Add product
          </button>
        </div>

        {/* Filters and view buttons */}
        <div className="mb-4 flex flex-wrap items-center gap-2.5">
          <span className="whitespace-nowrap rounded-[9px] bg-green-active-bg px-3 py-[9px] text-[12.5px] font-medium text-green-active-text">
            Store type: Food &amp; drink
          </span>

          <div className="flex min-w-[180px] flex-1 items-center gap-2 rounded-[9px] border border-border bg-white px-3 py-[9px] text-[12.5px]">
            <Search
              size={14}
              className="shrink-0 text-ink-faint"
            />

            <input
              type="search"
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
            <span className="font-medium text-ink">
              Category
            </span>

            <span className="text-[10px] text-ink-muted">
              ▾
            </span>
          </button>

          {view === 'grid' && (
            <button
              type="button"
              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-[9px] border border-border bg-white px-3 py-[9px] text-[12.5px]"
            >
              <span className="font-medium text-ink">
                Type
              </span>

              <span className="text-[10px] text-ink-muted">
                ▾
              </span>
            </button>
          )}

          <div className="flex overflow-hidden rounded-[9px] border border-border">
            <button
              type="button"
              className={`inline-flex items-center gap-1.5 px-3 py-[9px] text-xs font-medium transition ${
                view === 'list'
                  ? 'bg-ink text-white'
                  : 'bg-white text-ink-muted hover:bg-[#f7faf7]'
              }`}
              onClick={() => setView('list')}
            >
              <List size={14} />
              List
            </button>

            <button
              type="button"
              className={`inline-flex items-center gap-1.5 border-l border-border px-3 py-[9px] text-xs font-medium transition ${
                view === 'grid'
                  ? 'bg-ink text-white'
                  : 'bg-white text-ink-muted hover:bg-[#f7faf7]'
              }`}
              onClick={() => setView('grid')}
            >
              <LayoutGrid size={14} />
              Grid
            </button>
          </div>
        </div>

        {/* List view */}
        {view === 'list' ? (
          <div className="overflow-hidden rounded-[14px] border border-border bg-white">
            <div className="flex h-[42px] items-center gap-3 bg-[#f7faf7] px-4">
              <div className={`min-w-0 flex-1 ${headerCellClass}`}>
                Product
              </div>
              <div className={`${col.price} ${headerCellClass}`}>Price</div>
              <div className={`${col.stock} ${headerCellClass}`}>Stock</div>
              <div className={`${col.status} ${headerCellClass}`}>Status</div>
              <div className={col.actions} />
            </div>

            {filtered.length > 0 ? (
              filtered.map((item, index) => (
                <div key={item.id || `${item.name}-${index}`}>
                  {index > 0 && <div className="h-px bg-border" />}

                  <div className="flex h-[62px] items-center gap-3 px-4">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <div
                        className="flex size-[38px] shrink-0 items-center justify-center overflow-hidden rounded-[9px]"
                        style={{ background: item.cardTone || '#f2f7f2' }}
                      >
                        <img
                          src={getProductImage(item)}
                          alt=""
                          className="size-[28px] object-contain"
                        />
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-[13px] leading-[18px] font-medium text-ink">
                          {item.name}
                        </p>
                        <p className="truncate text-[11px] leading-[15px] text-ink-faint">
                          {item.category}
                        </p>
                      </div>
                    </div>

                    <div
                      className={`${col.price} text-[13px] leading-[17px] font-bold text-green-active-text`}
                    >
                      {item.price}
                    </div>

                    <div
                      className={`${col.stock} text-[12.5px] leading-[16px] font-medium text-ink-muted`}
                    >
                      {item.stock}
                    </div>

                    <div className={col.status}>
                      <span
                        className={`inline-flex h-[24px] items-center gap-1.5 rounded-full px-[9px] text-[11px] font-medium ${
                          item.status === 'Active'
                            ? 'bg-green-active-bg text-green-active-text'
                            : 'bg-[#f2f2f2] text-ink-muted'
                        }`}
                      >
                        <span
                          className={`size-[6px] shrink-0 rounded-full ${
                            item.status === 'Active'
                              ? 'bg-green-active-text'
                              : 'bg-ink-faint'
                          }`}
                        />
                        {item.status}
                      </span>
                    </div>

                    <div
                      className={`flex ${col.actions} items-center justify-end gap-2.5`}
                    >
                      <button
                        type="button"
                        className="text-[12.5px] leading-[16px] font-medium text-green-active-text hover:underline"
                        onClick={() => handleOpenEditModal(item)}
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        aria-label={`More options for ${item.name}`}
                        className="inline-flex size-6 items-center justify-center text-[16px] font-bold leading-none text-ink-faint hover:text-ink"
                      >
                        ⋮
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState query={query} />
            )}
          </div>
        ) : (
          /* Grid view */
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.length > 0 ? (
              filtered.map((item, index) => (
                <div
                  key={item.id || `${item.name}-${index}`}
                  className="overflow-hidden rounded-[14px] border border-border bg-white"
                >
                  <div
                    className="relative flex h-[132px] items-center justify-center"
                    style={{
                      background: item.cardTone || '#f2f7f2',
                    }}
                  >
                    <span
                      className={`absolute top-3 left-3 inline-flex items-center gap-1 text-[11px] font-medium ${
                        item.status === 'Active'
                          ? 'text-green-active-text'
                          : 'text-ink-muted'
                      }`}
                    >
                      <span className="text-[9px] leading-none">●</span>
                      {item.status}
                    </span>

                    <button
                      type="button"
                      aria-label={`Edit ${item.name}`}
                      className="absolute top-2 right-2 z-10 inline-flex size-7 items-center justify-center text-[18px] font-bold leading-none text-ink-muted transition hover:text-ink"
                      onClick={() => handleOpenEditModal(item)}
                    >
                      ⋮
                    </button>

                    <img
                      src={getProductImage(item)}
                      alt={item.name}
                      className="size-11 object-contain"
                    />
                  </div>

                  <div className="border-t border-border/60 px-3.5 py-3">
                    <p className="text-[14px] font-bold text-ink">
                      {item.name}
                    </p>

                    <p className="mt-0.5 text-[12px] text-ink-muted">
                      {item.category}
                    </p>

                    <div className="mt-3 flex items-center justify-between gap-2">
                      <span className="text-[13px] font-bold text-green-active-text">
                        {item.price}
                      </span>

                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ${
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
              ))
            ) : (
              <div className="col-span-full">
                <EmptyState query={query} />
              </div>
            )}
          </div>
        )}
      </div>

      <EditProductModal
        open={modalOpen}
        product={selectedProduct}
        mode={modalMode}
        onClose={handleCloseModal}
        onSave={handleSaveProduct}
      />
    </>
  )
}

function EmptyState({ query }) {
  return (
    <div className="flex min-h-[240px] flex-col items-center justify-center px-5 py-10 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-[#f2f7f2]">
        <Search size={20} className="text-ink-faint" />
      </div>

      <h3 className="mt-3 text-[14px] font-bold text-ink">
        No products found
      </h3>

      <p className="mt-1 max-w-[300px] text-[12px] text-ink-muted">
        {query
          ? `No products match “${query}”. Try searching with another keyword.`
          : 'There are currently no products in the food catalog.'}
      </p>
    </div>
  )
}