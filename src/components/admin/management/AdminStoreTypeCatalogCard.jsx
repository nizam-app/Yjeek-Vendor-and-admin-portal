import { useEffect, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { adminService } from '../../../services/adminService'
import { formatApiErrorMessage } from '../../../api/errors'
import { cn } from '../cn'

const labelClass = 'mb-1.5 block text-[12px] font-medium text-[#7c8780]'
const inputClass =
  'box-border h-[40px] w-full rounded-[8px] border border-[rgba(0,0,0,0.1)] bg-white px-3 text-[13px] text-[#17231c] outline-none transition placeholder:text-[#9aa49d] focus:border-[#1aa054]'

function emptyAxis() {
  return {
    id: `new-${Date.now()}`,
    key: '',
    name: '',
    uiHint: 'PILL',
    isRequired: true,
    sortOrder: 0,
    values: [{ id: `v-${Date.now()}`, key: '', label: '', colorHex: null, sortOrder: 0, isActive: true }],
  }
}

/**
 * Fashion v1 — catalogMode, low-stock threshold, and attribute axes editor.
 */
export default function AdminStoreTypeCatalogCard({
  storeTypeId,
  catalogMode,
  lowStockThreshold,
  onCatalogModeChange,
  onLowStockChange,
  canPersistAttributes = false,
}) {
  const [axes, setAxes] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [savedNote, setSavedNote] = useState('')

  useEffect(() => {
    if (!storeTypeId || !canPersistAttributes) {
      setAxes([])
      return
    }
    let cancelled = false
    setLoading(true)
    setError('')
    adminService
      .getAdminStoreTypeAttributes(storeTypeId)
      .then((res) => {
        if (cancelled) return
        setAxes(Array.isArray(res?.data?.axes) ? res.data.axes : [])
      })
      .catch((err) => {
        if (cancelled) return
        setError(formatApiErrorMessage(err) || 'Failed to load attributes')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [storeTypeId, canPersistAttributes])

  const updateAxis = (axisId, patch) => {
    setAxes((prev) => prev.map((a) => (a.id === axisId ? { ...a, ...patch } : a)))
  }

  const updateValue = (axisId, valueId, patch) => {
    setAxes((prev) =>
      prev.map((a) =>
        a.id !== axisId
          ? a
          : {
              ...a,
              values: a.values.map((v) => (v.id === valueId ? { ...v, ...patch } : v)),
            },
      ),
    )
  }

  const handleSaveAttributes = async () => {
    if (!storeTypeId || !canPersistAttributes) return
    setSaving(true)
    setError('')
    setSavedNote('')
    try {
      await adminService.putAdminStoreTypeAttributes(storeTypeId, axes)
      setSavedNote('Attribute axes saved.')
    } catch (err) {
      setError(formatApiErrorMessage(err) || 'Failed to save attributes')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-[14px] border border-[#e6ebe7] bg-white p-4 shadow-[0_1px_2px_rgba(23,35,28,0.04)]">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-[14px] font-semibold text-[#17231c]">Catalog mode</h3>
      </div>

      <div className="grid grid-cols-2 gap-3 max-[700px]:grid-cols-1">
        <label className="block min-w-0">
          <span className={labelClass}>Mode</span>
          <select
            className={inputClass}
            value={catalogMode === 'HYBRID' ? 'VARIANTS' : catalogMode || 'MODIFIERS'}
            onChange={(e) => onCatalogModeChange?.(e.target.value)}
          >
            <option value="MODIFIERS">MODIFIERS (Food — option groups)</option>
            <option value="VARIANTS">VARIANTS (Fashion / retail SKUs)</option>
          </select>
        </label>
        <label className="block min-w-0">
          <span className={labelClass}>Low-stock threshold</span>
          <input
            className={inputClass}
            type="number"
            min={0}
            value={lowStockThreshold ?? 5}
            onChange={(e) => onLowStockChange?.(e.target.value)}
          />
        </label>
      </div>

      {catalogMode === 'VARIANTS' && (
        <div className="mt-4 border-t border-[#eef2ef] pt-4">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div>
              <p className="text-[13px] font-semibold text-[#17231c]">Attribute axes</p>
              <p className="text-[12px] text-[#7c8780]">
                Size / Colour (etc.). Saved separately from Publish.
              </p>
            </div>
            {canPersistAttributes ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={saving || loading}
                  onClick={() => setAxes((prev) => [...prev, emptyAxis()])}
                  className="inline-flex h-[32px] items-center gap-1 rounded-full border border-[#dfe4e0] bg-white px-3 text-[12px] font-medium text-[#455249] hover:bg-[#f6f8f6]"
                >
                  <Plus size={14} /> Axis
                </button>
                <button
                  type="button"
                  disabled={saving || loading || !storeTypeId}
                  onClick={handleSaveAttributes}
                  className="inline-flex h-[32px] items-center rounded-full bg-[#2E9E4D] px-3 text-[12px] font-bold text-white hover:bg-[#158a47] disabled:opacity-60"
                >
                  {saving ? 'Saving…' : 'Save axes'}
                </button>
              </div>
            ) : (
              <p className="text-[12px] text-[#9aa49d]">Publish the store type first to edit axes.</p>
            )}
          </div>

          {error ? (
            <p className="mb-2 rounded-[8px] border border-[#f5d0d0] bg-[#fdebec] px-3 py-2 text-[12px] text-[#d64044]">
              {error}
            </p>
          ) : null}
          {savedNote ? (
            <p className="mb-2 text-[12px] text-[#147940]">{savedNote}</p>
          ) : null}
          {loading ? <p className="text-[12px] text-[#7c8780]">Loading axes…</p> : null}

          <div className="space-y-3">
            {axes.map((axis) => (
              <div
                key={axis.id}
                className="rounded-[10px] border border-[#e6ebe7] bg-[#fafbfa] p-3"
              >
                <div className="mb-2 grid grid-cols-[1fr_1fr_120px_auto] gap-2 max-[800px]:grid-cols-1">
                  <input
                    className={inputClass}
                    placeholder="Key (size)"
                    value={axis.key}
                    onChange={(e) => updateAxis(axis.id, { key: e.target.value })}
                  />
                  <input
                    className={inputClass}
                    placeholder="Name (Size)"
                    value={axis.name}
                    onChange={(e) => updateAxis(axis.id, { name: e.target.value })}
                  />
                  <select
                    className={inputClass}
                    value={axis.uiHint}
                    onChange={(e) => updateAxis(axis.id, { uiHint: e.target.value })}
                  >
                    <option value="PILL">PILL</option>
                    <option value="SWATCH">SWATCH</option>
                  </select>
                  <button
                    type="button"
                    className="inline-flex h-[40px] items-center justify-center rounded-[8px] border border-[#f5d0d0] text-[#d64044]"
                    onClick={() => setAxes((prev) => prev.filter((a) => a.id !== axis.id))}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="space-y-1.5">
                  {axis.values.map((value) => (
                    <div
                      key={value.id}
                      className={cn(
                        'grid gap-2 max-[800px]:grid-cols-1',
                        axis.uiHint === 'SWATCH'
                          ? 'grid-cols-[1fr_1fr_100px_auto]'
                          : 'grid-cols-[1fr_1fr_auto]',
                      )}
                    >
                      <input
                        className={inputClass}
                        placeholder="Value key"
                        value={value.key}
                        onChange={(e) => updateValue(axis.id, value.id, { key: e.target.value })}
                      />
                      <input
                        className={inputClass}
                        placeholder="Label"
                        value={value.label}
                        onChange={(e) => updateValue(axis.id, value.id, { label: e.target.value })}
                      />
                      {axis.uiHint === 'SWATCH' ? (
                        <input
                          className={inputClass}
                          placeholder="#001F3F"
                          value={value.colorHex || ''}
                          onChange={(e) =>
                            updateValue(axis.id, value.id, { colorHex: e.target.value || null })
                          }
                        />
                      ) : null}
                      <button
                        type="button"
                        className="inline-flex h-[40px] items-center justify-center rounded-[8px] border border-[#dfe4e0] text-[#7c8780]"
                        onClick={() =>
                          updateAxis(axis.id, {
                            values: axis.values.filter((v) => v.id !== value.id),
                          })
                        }
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="text-[12px] font-medium text-[#2E9E4D]"
                    onClick={() =>
                      updateAxis(axis.id, {
                        values: [
                          ...axis.values,
                          {
                            id: `v-${Date.now()}`,
                            key: '',
                            label: '',
                            colorHex: null,
                            sortOrder: axis.values.length,
                            isActive: true,
                          },
                        ],
                      })
                    }
                  >
                    + Add value
                  </button>
                </div>
              </div>
            ))}
            {!loading && axes.length === 0 ? (
              <p className="text-[12px] text-[#9aa49d]">No axes yet — add Size and Colour for Fashion.</p>
            ) : null}
          </div>
        </div>
      )}
    </div>
  )
}
