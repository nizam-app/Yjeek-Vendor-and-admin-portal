import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, LayoutGrid, List, Search } from 'lucide-react'
import { ApiError, getFirstFieldErrorMessage } from '../../api/errors'
import { getProductImage } from '../../data/productImages'
import EditProductModal from '../../components/EditProductModal'
import { useApiMutation } from '../../hooks/useApiMutation'
import {
  useVendorCatalogCategories,
  useVendorCatalogProducts,
} from '../../hooks/vendor/useVendorCatalog'
import { productService } from '../../services/vendor/productService'

const headerCellClass =
  'flex items-center text-[11px] font-bold uppercase tracking-[0.04em] text-ink-faint'

const col = {
  price: 'w-[120px]',
  stock: 'w-[148px]',
  status: 'w-[110px]',
  actions: 'w-[78px]',
}

function getSaveErrorMessage(error) {
  if (!error) return 'Unable to save product.'
  if (error instanceof ApiError) {
    const fieldMessage = getFirstFieldErrorMessage(error.fieldErrors)
    if (fieldMessage) return fieldMessage
    if (error.message) return error.message
  }
  if (typeof error?.message === 'string' && error.message) return error.message
  return 'Unable to save product.'
}

export default function FoodCatalog() {
  const navigate = useNavigate()
  const [view, setView] = useState('list')
  const [query, setQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [categoryOpen, setCategoryOpen] = useState(false)
  const [items, setItems] = useState([])
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [modalMode, setModalMode] = useState('edit')
  const [modalOpen, setModalOpen] = useState(false)
  const [saveError, setSaveError] = useState('')
  const categoryRef = useRef(null)

  const {
    data: products,
    error,
    isLoading,
    refetch,
  } = useVendorCatalogProducts()

  const { data: categoriesData } = useVendorCatalogCategories()
  const categoryOptions = Array.isArray(categoriesData?.options) ? categoriesData.options : []
  const { mutate: createProduct, isLoading: isCreating } = useApiMutation((form) =>
    productService.createProduct(form, { catalogCategoryId: form.catalogCategoryId }),
  )
  const { mutate: fetchProduct, isLoading: isLoadingProduct } = useApiMutation((productId) =>
    productService.getProduct(productId),
  )
  const [detailError, setDetailError] = useState('')

  useEffect(() => {
    if (Array.isArray(products)) setItems(products)
  }, [products])

  useEffect(() => {
    if (!categoryOpen) return undefined
    function onPointerDown(event) {
      if (categoryRef.current && !categoryRef.current.contains(event.target)) {
        setCategoryOpen(false)
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [categoryOpen])

  const selectedCategory = useMemo(
    () => categoryOptions.find((option) => option.id === categoryFilter) || null,
    [categoryOptions, categoryFilter],
  )

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return items.filter((item) => {
      const matchesCategory =
        categoryFilter === 'all' ||
        item.catalogCategoryId === categoryFilter ||
        item.catalogCategoryName === selectedCategory?.name ||
        String(item.category || '').includes(selectedCategory?.name || '')

      if (!matchesCategory) return false
      if (!normalizedQuery) return true

      return [item.name, item.category, item.status, item.stock]
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery)
    })
  }, [items, query, categoryFilter, selectedCategory])

  const categoryButtonLabel = selectedCategory?.name || 'Category'

  if (isLoading && items.length === 0) {
    return <div className="p-7 text-[13px] text-ink-muted">Loading products…</div>
  }
  if (error && items.length === 0) {
    return (
      <div className="p-7 text-[13px] text-danger">
        Unable to load products.{' '}
        <button type="button" onClick={refetch} className="underline">
          Try again
        </button>
      </div>
    )
  }

  function handleOpenAddModal() {
    setModalMode('add')
    setSelectedProduct(null)
    setSaveError('')
    setDetailError('')
    setModalOpen(true)
  }

  async function handleOpenEditModal(product) {
    setModalMode('edit')
    setSelectedProduct(product)
    setSaveError('')
    setDetailError('')
    setModalOpen(true)

    if (!product?.id) return

    try {
      const result = await fetchProduct(product.id)
      if (result?.data) {
        setSelectedProduct({
          ...product,
          ...result.data,
          // Keep list-row helpers if detail omits them
          cardTone: result.data.cardTone || product.cardTone,
          badge: result.data.badge || product.badge,
          badgeTone: result.data.badgeTone || product.badgeTone,
        })
      }
    } catch (err) {
      setDetailError(getSaveErrorMessage(err).replace('save product', 'load product'))
    }
  }

  function handleCloseModal() {
    if (isCreating || isLoadingProduct) return
    setModalOpen(false)
    setSelectedProduct(null)
    setSaveError('')
    setDetailError('')
  }

  async function handleSaveProduct(savedProduct) {
    setSaveError('')

    if (modalMode === 'add') {
      try {
        const result = await createProduct(savedProduct)
        const created = result?.data
        if (created) {
          setItems((currentItems) => [created, ...currentItems])
        } else {
          setItems((currentItems) => [savedProduct, ...currentItems])
        }
        setModalOpen(false)
        setSelectedProduct(null)
        refetch()
      } catch (err) {
        setSaveError(getSaveErrorMessage(err))
      }
      return
    }

    setItems((currentItems) =>
      currentItems.map((item) =>
        (item.id && item.id === selectedProduct?.id) || item.name === selectedProduct?.name
          ? savedProduct
          : item,
      ),
    )
    setModalOpen(false)
    setSelectedProduct(null)
  }

  return (
    <>
      <div className="px-[28px] pt-[18px] pb-8">
        <div className="mb-4 flex items-start gap-3.5">
          <div className="min-w-0 flex-1">
            <h1 className="text-[20px] font-bold tracking-[-0.02em] text-ink">Food catalog</h1>
            <p className="mt-0.5 text-[13px] text-ink-muted">
              {filtered.length} {filtered.length === 1 ? 'item' : 'items'}
              {view === 'grid' ? ' · grid view' : ''}
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenAddModal}
            className="shrink-0 rounded-[9px] bg-green-primary px-4 py-[10px] text-[13px] font-medium text-white transition hover:brightness-[0.96]"
          >
            + Add product
          </button>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => navigate('/catalog')}
            className="whitespace-nowrap rounded-[9px] bg-green-active-bg px-3 py-[9px] text-[12.5px] font-medium text-green-active-text hover:brightness-[0.98]"
            title="Change store type"
          >
            Store type: Food &amp; drink
          </button>

          <div className="flex min-w-[200px] flex-1 items-center gap-2 rounded-[9px] border border-border bg-white px-3 py-[9px] text-[12.5px]">
            <Search size={14} className="shrink-0 text-ink-faint" />
            <input
              type="search"
              className="w-full border-none bg-transparent text-[12.5px] text-ink outline-none placeholder:text-ink-faint"
              placeholder="Search food…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>

          <div className="relative" ref={categoryRef}>
            <button
              type="button"
              onClick={() => setCategoryOpen((open) => !open)}
              className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-[9px] border bg-white px-3 py-[9px] text-[12.5px] ${
                categoryFilter !== 'all'
                  ? 'border-green-active-text text-green-active-text'
                  : 'border-border text-ink'
              }`}
            >
              <span className="font-medium">{categoryButtonLabel}</span>
              <span className="text-[10px] text-ink-muted">▾</span>
            </button>

            {categoryOpen ? (
              <div className="absolute top-[calc(100%+6px)] right-0 z-20 max-h-[280px] min-w-[220px] overflow-auto rounded-[10px] border border-border bg-white py-1 shadow-[0_12px_28px_rgba(26,28,26,0.12)]">
                <button
                  type="button"
                  onClick={() => {
                    setCategoryFilter('all')
                    setCategoryOpen(false)
                  }}
                  className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-[12.5px] hover:bg-[#f7faf7] ${
                    categoryFilter === 'all' ? 'font-medium text-green-active-text' : 'text-ink'
                  }`}
                >
                  <span>All categories</span>
                  {categoryFilter === 'all' ? <Check size={14} strokeWidth={2.5} /> : null}
                </button>

                {categoryOptions.length === 0 ? (
                  <p className="px-3 py-2 text-[12px] text-ink-muted">No categories yet</p>
                ) : (
                  categoryOptions.map((option) => {
                    const selected = categoryFilter === option.id
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => {
                          setCategoryFilter(option.id)
                          setCategoryOpen(false)
                        }}
                        className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-[12.5px] hover:bg-[#f7faf7] ${
                          selected ? 'font-medium text-green-active-text' : 'text-ink'
                        }`}
                        style={{ paddingLeft: `${12 + (option.depth || 0) * 12}px` }}
                      >
                        <span className="min-w-0 truncate">
                          {option.name}
                          {option.productCount != null ? (
                            <span className="ml-1 text-ink-faint">({option.productCount})</span>
                          ) : null}
                        </span>
                        {selected ? <Check size={14} strokeWidth={2.5} /> : null}
                      </button>
                    )
                  })
                )}
              </div>
            ) : null}
          </div>

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

        {view === 'list' ? (
          <div className="overflow-hidden rounded-[14px] border border-border bg-white shadow-card">
            <div className="flex h-[42px] items-center gap-3 bg-[#f7faf7] px-4">
              <div className={`min-w-0 flex-1 ${headerCellClass}`}>Product</div>
              <div className={`${col.price} ${headerCellClass}`}>Price</div>
              <div className={`${col.stock} ${headerCellClass}`}>Stock</div>
              <div className={`${col.status} ${headerCellClass}`}>Status</div>
              <div className={col.actions} />
            </div>

            {filtered.length > 0 ? (
              filtered.map((item, index) => (
                <div key={item.id || `${item.name}-${index}`}>
                  {index > 0 ? <div className="h-px bg-border" /> : null}
                  <div className="flex h-[62px] items-center gap-3 px-4 hover:bg-[#fafcfa]">
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

                    <div className={`${col.price} text-[13px] leading-[17px] font-bold text-green-active-text`}>
                      {item.price}
                    </div>
                    <div className={`${col.stock} text-[12.5px] leading-[16px] font-medium text-ink-muted`}>
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
                            item.status === 'Active' ? 'bg-green-active-text' : 'bg-ink-faint'
                          }`}
                        />
                        {item.status}
                      </span>
                    </div>
                    <div className={`flex ${col.actions} items-center justify-end gap-2.5`}>
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
                        onClick={() => handleOpenEditModal(item)}
                      >
                        ⋮
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState query={query} categoryLabel={selectedCategory?.name} />
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.length > 0 ? (
              filtered.map((item, index) => (
                <div
                  key={item.id || `${item.name}-${index}`}
                  className="overflow-hidden rounded-[14px] border border-border bg-white shadow-card"
                >
                  <div
                    className="relative flex h-[132px] items-center justify-center"
                    style={{ background: item.cardTone || '#f2f7f2' }}
                  >
                    <span
                      className={`absolute top-3 left-3 inline-flex items-center gap-1 text-[11px] font-medium ${
                        item.status === 'Active' ? 'text-green-active-text' : 'text-ink-muted'
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
                    <p className="text-[14px] font-bold text-ink">{item.name}</p>
                    <p className="mt-0.5 text-[12px] text-ink-muted">{item.category}</p>
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <span className="text-[13px] font-bold text-green-active-text">{item.price}</span>
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
                <EmptyState query={query} categoryLabel={selectedCategory?.name} />
              </div>
            )}
          </div>
        )}
      </div>

      <EditProductModal
        open={modalOpen}
        product={selectedProduct}
        mode={modalMode}
        categories={categoryOptions}
        isSaving={isCreating}
        isLoadingDetail={modalMode === 'edit' && isLoadingProduct}
        saveError={saveError || detailError}
        onClose={handleCloseModal}
        onSave={handleSaveProduct}
      />
    </>
  )
}

function EmptyState({ query, categoryLabel }) {
  return (
    <div className="flex min-h-[240px] flex-col items-center justify-center px-5 py-10 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-[#f2f7f2]">
        <Search size={20} className="text-ink-faint" />
      </div>
      <h3 className="mt-3 text-[14px] font-bold text-ink">No products found</h3>
      <p className="mt-1 max-w-[300px] text-[12px] text-ink-muted">
        {query
          ? `No products match “${query}”. Try another keyword.`
          : categoryLabel
            ? `No products in “${categoryLabel}”.`
            : 'There are currently no products in the food catalog.'}
      </p>
    </div>
  )
}
