import { useCallback, useEffect, useState } from 'react'
import { GripVertical, Package, Plus, Trash2 } from 'lucide-react'
import { formatApiErrorMessage } from '../../../api/errors'
import { adminUiEditorService } from '../../../services/admin/uiEditorService'
import AdminMediaImage from '../AdminMediaImage'
import { formatTopPickBhd } from './TopPicksPhonePreview'
import { cn } from '../cn'

/** Per-branch Top Picks form (used inside modal from Banners & ads). */
export default function TopPicksEditor({ onMessage, onPreviewChange }) {
  const [branches, setBranches] = useState([])
  const [selectedBranchId, setSelectedBranchId] = useState('')
  const [config, setConfig] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [products, setProducts] = useState([])
  const [selectedProductIds, setSelectedProductIds] = useState([])
  const [error, setError] = useState(null)
  const [dragIndex, setDragIndex] = useState(null)

  const loadBranches = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await adminUiEditorService.listTopPicksBranches()
      const list = result?.data?.branches || []
      setBranches(list)
      if (!selectedBranchId && list[0]?.branchId) {
        setSelectedBranchId(list[0].branchId)
      }
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [selectedBranchId])

  const loadBranchConfig = useCallback(async (branchId) => {
    if (!branchId) return
    setBusy(true)
    setError(null)
    try {
      const result = await adminUiEditorService.getBranchTopPicks(branchId)
      setConfig(result?.data || null)
    } catch (err) {
      setError(err)
      setConfig(null)
    } finally {
      setBusy(false)
    }
  }, [])

  useEffect(() => {
    loadBranches()
  }, [loadBranches])

  useEffect(() => {
    if (selectedBranchId) loadBranchConfig(selectedBranchId)
  }, [selectedBranchId, loadBranchConfig])

  useEffect(() => {
    if (!config || !onPreviewChange) return
    onPreviewChange({
      items: config.items || [],
      isActive: config.isActive !== false,
      branchName: config.branchName || '',
    })
  }, [config, onPreviewChange])

  const saveConfig = async (patch) => {
    if (!selectedBranchId) return
    setBusy(true)
    setError(null)
    try {
      const result = await adminUiEditorService.updateBranchTopPicks(selectedBranchId, patch)
      setConfig(result?.data || null)
      onMessage?.('Top picks settings saved.')
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  const openPicker = async () => {
    if (!selectedBranchId) return
    setPickerOpen(true)
    try {
      const result = await adminUiEditorService.listBranchTopPickProducts(selectedBranchId, {
        limit: 50,
      })
      setProducts(result?.data?.products || [])
      setSelectedProductIds([])
    } catch (err) {
      setError(err)
    }
  }

  const addProducts = async () => {
    if (!selectedProductIds.length) return
    setBusy(true)
    try {
      const result = await adminUiEditorService.addBranchTopPickItems(selectedBranchId, {
        productIds: selectedProductIds,
      })
      setConfig(result?.data || null)
      setPickerOpen(false)
      onMessage?.('Products added to Top picks.')
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  const toggleItem = async (item) => {
    setBusy(true)
    try {
      const result = await adminUiEditorService.updateBranchTopPickItem(
        selectedBranchId,
        item.id,
        { isActive: !item.isActive },
      )
      setConfig(result?.data || null)
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  const removeItem = async (item) => {
    if (!window.confirm(`Remove “${item.name}” from Top picks?`)) return
    setBusy(true)
    try {
      const result = await adminUiEditorService.deleteBranchTopPickItem(selectedBranchId, item.id)
      setConfig(result?.data || null)
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  const onDrop = async (index) => {
    if (dragIndex == null || dragIndex === index || !config?.items) return
    const nextItems = [...config.items]
    const [moved] = nextItems.splice(dragIndex, 1)
    nextItems.splice(index, 0, moved)
    const payload = nextItems.map((row, sortOrder) => ({ id: row.id, sortOrder }))
    setBusy(true)
    try {
      const result = await adminUiEditorService.reorderBranchTopPickItems(selectedBranchId, {
        items: payload,
      })
      setConfig(result?.data || null)
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
      setDragIndex(null)
    }
  }

  const items = config?.items || []

  return (
    <>
      <div className="space-y-4">
        <div className="rounded-[10px] border border-[#f3e0a8] bg-[#fff8e1] px-3.5 py-2.5 text-[12.5px] text-[#9a6510]">
          Top Picks are per branch (not whole vendor). Pick items from that branch&apos;s menu;
          customers only see them within the radius you set.
        </div>

        {error ? (
          <p className="text-[13px] text-[#c91a24]">
            {formatApiErrorMessage(error, 'Unable to load Top picks.')}
          </p>
        ) : null}

        <div className="flex flex-wrap items-end gap-3">
          <label className="flex min-w-[220px] flex-col gap-1">
            <span className="text-[12px] font-semibold text-[#6B736E]">Branch</span>
            <select
              value={selectedBranchId}
              disabled={loading || busy}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="h-[38px] rounded-[10px] border border-[#E3E6E3] px-3 text-[13px]"
            >
              {branches.map((b) => (
                <option key={b.branchId} value={b.branchId}>
                  {b.vendorName} · {b.branchName}
                </option>
              ))}
            </select>
          </label>
          <label className="flex w-[120px] flex-col gap-1">
            <span className="text-[12px] font-semibold text-[#6B736E]">Radius (km)</span>
            <input
              type="number"
              min={0}
              step={0.5}
              value={config?.radiusKm ?? 5}
              disabled={busy || !config}
              onChange={(e) =>
                setConfig((prev) => ({ ...prev, radiusKm: Number(e.target.value) }))
              }
              className="h-[38px] rounded-[10px] border border-[#E3E6E3] px-3 text-[13px]"
            />
          </label>
          <button
            type="button"
            disabled={busy || !config}
            onClick={() => saveConfig({ radiusKm: config?.radiusKm, isActive: config?.isActive })}
            className="h-[38px] rounded-full bg-[#1aa054] px-4 text-[12.5px] font-bold text-white"
          >
            Save branch settings
          </button>
          <label className="ml-auto flex items-center gap-2 text-[13px] font-semibold">
            <input
              type="checkbox"
              checked={config?.isActive !== false}
              disabled={busy || !config}
              onChange={(e) => {
                const isActive = e.target.checked
                setConfig((prev) => ({ ...prev, isActive }))
                saveConfig({ isActive, radiusKm: config?.radiusKm })
              }}
            />
            Branch Top picks active
          </label>
        </div>

        <div className="flex items-center justify-between">
          <h3 className="text-[14px] font-bold text-[#17231c]">Menu items (order)</h3>
          <button
            type="button"
            disabled={busy || !selectedBranchId}
            onClick={openPicker}
            className="inline-flex h-[34px] items-center gap-1 rounded-full border border-[#E3E6E3] bg-white px-3 text-[12px] font-semibold"
          >
            <Plus size={14} /> Add from menu
          </button>
        </div>

        <div className="max-h-[min(50vh,420px)] space-y-2 overflow-y-auto pr-1">
          {items.map((item, index) => (
            <div
              key={item.id}
              className={cn(
                'flex items-center gap-2 rounded-[10px] border border-[#E3E6E3] bg-white px-3 py-2',
                !item.isActive && 'opacity-60',
              )}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDrop(index)}
            >
              <button
                type="button"
                draggable={!busy}
                onDragStart={() => setDragIndex(index)}
                className="text-[#6B736E]"
                aria-label="Drag to reorder"
              >
                <GripVertical size={16} />
              </button>
              {item.imageUrl ? (
                <AdminMediaImage
                  src={item.imageUrl}
                  className="h-10 w-10 shrink-0 rounded-[8px] object-cover"
                  fallbackClassName="h-10 w-10 shrink-0 rounded-[8px] bg-[#eceeec]"
                  iconSize={14}
                />
              ) : (
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-[8px] bg-[#eceeec] text-[#8a948e]">
                  <Package size={14} />
                </div>
              )}
              <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-[#17231c]">
                {item.name}
              </span>
              <span className="shrink-0 text-[12px] font-bold text-[#137333]">
                BHD {formatTopPickBhd(item.price)}
              </span>
              <label className="flex items-center gap-1 text-[12px]">
                <input
                  type="checkbox"
                  checked={item.isActive !== false}
                  disabled={busy}
                  onChange={() => toggleItem(item)}
                />
                Active
              </label>
              <button
                type="button"
                disabled={busy}
                onClick={() => removeItem(item)}
                className="text-[#c91a24]"
                aria-label="Remove"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
          {!items.length && !loading ? (
            <p className="text-[13px] text-[#8a948e]">No Top pick items yet for this branch.</p>
          ) : null}
        </div>
      </div>

      {pickerOpen ? (
        <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[80vh] w-full max-w-[480px] overflow-hidden rounded-[12px] bg-white shadow-xl">
            <div className="border-b px-4 py-3 text-[14px] font-bold">Add from branch menu</div>
            <div className="max-h-[50vh] space-y-1 overflow-y-auto p-3">
              {products.map((p) => (
                <label
                  key={p.productId}
                  className="flex items-center gap-2.5 rounded-[10px] border border-transparent px-2 py-2 hover:border-[#e3ebe4] hover:bg-[#f7faf7]"
                >
                  <input
                    type="checkbox"
                    checked={selectedProductIds.includes(p.productId)}
                    onChange={(e) => {
                      setSelectedProductIds((prev) =>
                        e.target.checked
                          ? [...prev, p.productId]
                          : prev.filter((id) => id !== p.productId),
                      )
                    }}
                  />
                  {p.imageUrl ? (
                    <AdminMediaImage
                      src={p.imageUrl}
                      className="h-11 w-11 shrink-0 rounded-[8px] object-cover"
                      fallbackClassName="h-11 w-11 shrink-0 rounded-[8px] bg-[#eceeec]"
                      iconSize={14}
                    />
                  ) : (
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-[8px] bg-[#eceeec] text-[#8a948e]">
                      <Package size={14} />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-[#17231c]">{p.name}</p>
                    <p className="text-[12px] font-bold text-[#137333]">
                      BHD {formatTopPickBhd(p.price)}
                    </p>
                  </div>
                </label>
              ))}
              {!products.length ? (
                <p className="px-2 py-4 text-center text-[13px] text-[#8a948e]">
                  No menu items available for this branch. Add products in the vendor catalog and
                  ensure they are visible on the branch menu.
                </p>
              ) : null}
            </div>
            <div className="flex justify-end gap-2 border-t px-4 py-3">
              <button
                type="button"
                className="px-3 py-1.5 text-[13px]"
                onClick={() => setPickerOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busy || !selectedProductIds.length}
                onClick={addProducts}
                className="rounded-full bg-[#1aa054] px-4 py-1.5 text-[13px] font-bold text-white"
              >
                Add selected
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
