import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  Check,
  ChevronRight,
  Edit2,
  Filter,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Users,
  X,
} from 'lucide-react'
import { adminService } from '../../../services/adminService'
import { ApiErrorBanner, StatCardsSkeleton, TableBodySkeleton } from '../../../components/admin/ApiState'
import { Badge } from '../../../components/admin/Badge'
import { cn } from '../../../components/admin/cn'
import { MarketingViewTabs } from '../../../components/admin/MarketingViewTabs'

const PRESET_OPTIONS = [
  {
    id: 'NEW_NO_ORDER',
    label: 'New — no order',
    description: 'Registered, 0 completed orders',
    needsValue: false,
  },
  {
    id: 'FIRST_ORDER_DONE',
    label: 'First order done',
    description: 'Exactly 1 completed order',
    needsValue: false,
  },
  {
    id: 'INACTIVE_7',
    label: 'Inactive 7 days',
    description: 'No completed order in the last 7 days',
    needsValue: false,
  },
  {
    id: 'INACTIVE_14',
    label: 'Inactive 14 days',
    description: 'No completed order in the last 14 days',
    needsValue: false,
  },
  {
    id: 'INACTIVE_30',
    label: 'Inactive 30 days',
    description: 'No completed order in the last 30 days',
    needsValue: false,
  },
  {
    id: 'PREFERRED_CATEGORY',
    label: 'Preferred category',
    description: 'Most-ordered category in the last 90 days',
    needsValue: true,
    valuePlaceholder: 'e.g. Burgers, Groceries, Flowers',
    valueLabel: 'Category name or label',
  },
  {
    id: 'ZONE',
    label: 'Delivery zone',
    description: 'Default delivery address region/area',
    needsValue: true,
    valuePlaceholder: 'e.g. Manama, Riffa, Seef, Muharraq',
    valueLabel: 'Zone / area name',
  },
  {
    id: 'LANGUAGE',
    label: 'App language',
    description: 'Customer application language (AR or EN)',
    needsValue: true,
    valueType: 'select',
    options: [
      { label: 'Arabic (ar)', value: 'ar' },
      { label: 'English (en)', value: 'en' },
    ],
    valueLabel: 'Language',
  },
]

const CUSTOM_FIELD_OPTIONS = [
  { value: 'completed_orders', label: 'Completed orders (count)', type: 'number' },
  { value: 'total_spend', label: 'Total spend (BHD)', type: 'number' },
  { value: 'last_order_days', label: 'Days since last completed order', type: 'number' },
  { value: 'inactive_days', label: 'Inactive days', type: 'number' },
  { value: 'cancelled_orders', label: 'Cancelled orders (count)', type: 'number' },
  { value: 'preferred_category', label: 'Preferred category (90 days)', type: 'text' },
  { value: 'ordered_in_category', label: 'Ordered in category (any)', type: 'text' },
  { value: 'zone', label: 'Delivery zone / area', type: 'text' },
  { value: 'language', label: 'App language (ar / en)', type: 'text' },
  { value: 'wallet_balance', label: 'Wallet balance (BHD)', type: 'number' },
  { value: 'cashback_balance', label: 'Cashback balance (BHD)', type: 'number' },
  { value: 'joined_days', label: 'Days since registration', type: 'number' },
  { value: 'rating_given', label: 'Review rating given', type: 'number' },
]

const OPERATOR_OPTIONS = {
  number: [
    { value: 'eq', label: 'equals (=)' },
    { value: 'neq', label: 'not equals (≠)' },
    { value: 'gte', label: 'greater or equal (≥)' },
    { value: 'gt', label: 'greater than (>)' },
    { value: 'lte', label: 'less or equal (≤)' },
    { value: 'lt', label: 'less than (<)' },
  ],
  text: [
    { value: 'eq', label: 'equals' },
    { value: 'neq', label: 'not equals' },
    { value: 'contains', label: 'contains' },
  ],
}

function formatRelativeTime(dateInput) {
  if (!dateInput) return 'Never'
  const date = new Date(dateInput)
  if (Number.isNaN(date.getTime())) return 'Never'
  const diffSec = Math.floor((Date.now() - date.getTime()) / 1000)
  if (diffSec < 60) return 'Just now'
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function summarizeSegmentRule(segment) {
  const filter = segment.filter_json || segment.filterJson || segment.rules
  if (!filter) return 'All customers'
  if (typeof filter === 'object' && !Array.isArray(filter)) {
    if (filter.allCustomers) return 'All customers (unfiltered)'
    if (filter.preset) {
      const p = PRESET_OPTIONS.find((opt) => opt.id === filter.preset)
      const val = filter.presetValue ? ` (${filter.presetValue})` : ''
      return p ? `${p.label}${val}` : `${filter.preset}${val}`
    }
    const conds = filter.conditions || filter.rules || []
    if (Array.isArray(conds) && conds.length) {
      return `${conds.length} condition${conds.length > 1 ? 's' : ''} (${filter.matchLogic || 'ALL'})`
    }
    return 'All customers'
  }
  if (Array.isArray(filter) && filter.length) {
    return `${filter.length} rule${filter.length > 1 ? 's' : ''}`
  }
  return 'All customers'
}

export default function AdminSegmentsPage() {
  const navigate = useNavigate()
  const [segments, setSegments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [recalculatingId, setRecalculatingId] = useState(null)
  const [deleteError, setDeleteError] = useState(null)

  // Builder Modal State
  const [modalOpen, setModalOpen] = useState(false)
  const [editingSegment, setEditingSegment] = useState(null)
  const [modalMode, setModalMode] = useState('preset') // 'preset' | 'custom' | 'all'
  const [formName, setFormName] = useState('')
  const [formPreset, setFormPreset] = useState('NEW_NO_ORDER')
  const [formPresetValue, setFormPresetValue] = useState('')
  const [formMatchLogic, setFormMatchLogic] = useState('ALL')
  const [formConditions, setFormConditions] = useState([
    { field: 'completed_orders', operator: 'gte', value: 1 },
  ])
  const [formChannels, setFormChannels] = useState(['PUSH'])
  const [saving, setSaving] = useState(false)
  const [previewCount, setPreviewCount] = useState(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [modalError, setModalError] = useState(null)

  const fetchSegments = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await adminService.getAdminSegments({ limit: 100 })
      const list = res.data?.segments || res.data?.items || (Array.isArray(res.data) ? res.data : [])
      setSegments(list)
    } catch (err) {
      setError(err?.message || 'Failed to load customer segments.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSegments()
  }, [])

  const filteredSegments = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return segments
    return segments.filter((s) => s.name?.toLowerCase().includes(q))
  }, [segments, search])

  const stats = useMemo(() => {
    const total = segments.length
    const totalReach = segments.reduce((sum, s) => sum + (Number(s.size) || 0), 0)
    const presetsCount = segments.filter((s) => {
      const f = s.filter_json || s.filterJson
      return f?.preset
    }).length
    const customCount = total - presetsCount
    return [
      { label: 'Total Segments', value: total, tone: 'ink' },
      { label: 'Audience Reach', value: totalReach.toLocaleString(), tone: 'green' },
      { label: 'Preset Cohorts', value: presetsCount, tone: 'ink' },
      { label: 'Custom Builders', value: customCount, tone: 'ink' },
    ]
  }, [segments])

  const openCreateModal = () => {
    setEditingSegment(null)
    setFormName('')
    setModalMode('preset')
    setFormPreset('NEW_NO_ORDER')
    setFormPresetValue('')
    setFormMatchLogic('ALL')
    setFormConditions([{ field: 'completed_orders', operator: 'gte', value: 1 }])
    setFormChannels(['PUSH'])
    setPreviewCount(null)
    setModalError(null)
    setModalOpen(true)
  }

  const openEditModal = (segment) => {
    setEditingSegment(segment)
    setFormName(segment.name || '')
    const filter = segment.filter_json || segment.filterJson || segment.rules
    if (filter?.allCustomers) {
      setModalMode('all')
    } else if (filter?.preset) {
      setModalMode('preset')
      setFormPreset(filter.preset)
      setFormPresetValue(filter.presetValue || '')
    } else if (Array.isArray(filter?.conditions) && filter.conditions.length) {
      setModalMode('custom')
      setFormMatchLogic(filter.matchLogic || segment.matchLogic || 'ALL')
      setFormConditions(filter.conditions)
    } else if (Array.isArray(segment.rules) && segment.rules.length) {
      setModalMode('custom')
      setFormMatchLogic(segment.matchLogic || 'ALL')
      setFormConditions(segment.rules)
    } else {
      setModalMode('preset')
      setFormPreset('NEW_NO_ORDER')
    }
    setFormChannels(segment.channels?.length ? segment.channels : ['PUSH'])
    setPreviewCount(segment.size ?? null)
    setModalError(null)
    setModalOpen(true)
  }

  const handlePreview = async () => {
    try {
      setPreviewLoading(true)
      setModalError(null)
      const payload = {
        matchLogic: formMatchLogic,
        allCustomers: modalMode === 'all',
        preset: modalMode === 'preset' ? formPreset : undefined,
        presetValue: modalMode === 'preset' ? formPresetValue : undefined,
        rules: modalMode === 'custom' ? formConditions : [],
      }
      const res = await adminService.previewAdminSegment(payload)
      setPreviewCount(res.data?.estimatedSize ?? res.data?.count ?? 0)
    } catch (err) {
      setModalError(err?.message || 'Failed to calculate segment preview.')
    } finally {
      setPreviewLoading(false)
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!formName.trim()) {
      setModalError('Segment name is required.')
      return
    }

    try {
      setSaving(true)
      setModalError(null)
      const payload = {
        name: formName.trim(),
        channels: formChannels,
        matchLogic: formMatchLogic,
        allCustomers: modalMode === 'all',
        preset: modalMode === 'preset' ? formPreset : undefined,
        presetValue: modalMode === 'preset' ? formPresetValue : undefined,
        rules: modalMode === 'custom' ? formConditions : [],
      }

      if (editingSegment) {
        await adminService.updateAdminSegment(editingSegment.id, payload)
      } else {
        await adminService.createAdminSegment(payload)
      }

      setModalOpen(false)
      await fetchSegments()
    } catch (err) {
      setModalError(err?.message || 'Failed to save segment.')
    } finally {
      setSaving(false)
    }
  }

  const handleRecalculate = async (segmentId) => {
    try {
      setRecalculatingId(segmentId)
      setDeleteError(null)
      await adminService.recalculateAdminSegment(segmentId)
      await fetchSegments()
    } catch (err) {
      setDeleteError(err?.message || 'Failed to recalculate segment.')
    } finally {
      setRecalculatingId(null)
    }
  }

  const handleDelete = async (segment) => {
    if (!window.confirm(`Are you sure you want to delete segment "${segment.name}"?`)) {
      return
    }
    try {
      setDeleteError(null)
      await adminService.deleteAdminSegment(segment.id)
      await fetchSegments()
    } catch (err) {
      setDeleteError(err?.message || `Cannot delete segment "${segment.name}".`)
    }
  }

  const addCondition = () => {
    setFormConditions([...formConditions, { field: 'completed_orders', operator: 'gte', value: 1 }])
  }

  const removeCondition = (index) => {
    setFormConditions(formConditions.filter((_, i) => i !== index))
  }

  const updateCondition = (index, patch) => {
    const next = [...formConditions]
    next[index] = { ...next[index], ...patch }
    setFormConditions(next)
  }

  return (
    <div className="px-5 py-4 pb-8 max-[700px]:px-3">
      {/* Marketing Hub navigation tabs */}
      <MarketingViewTabs active="segments" />

      {/* Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[20px] font-bold tracking-[-0.02em] text-[#17231c]">Customer Segments</h2>
          <p className="mt-1 text-[12.5px] text-[#7c8780]">
            OG §09 — Predefined cohorts and custom builder. One audience definition across vouchers, campaigns &amp; push.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex h-[36px] items-center gap-1.5 rounded-full bg-[#1aa054] px-4 text-[13px] font-bold text-white shadow-sm hover:bg-[#158a47]"
        >
          <Plus size={15} strokeWidth={2.4} />
          Create segment
        </button>
      </div>

      <ApiErrorBanner error={error} onRetry={fetchSegments} />
      {deleteError && (
        <div className="mb-4 flex items-center gap-2 rounded-[10px] border border-[#f5c6cb] bg-[#f8d7da] p-3 text-[13px] text-[#721c24]">
          <AlertTriangle size={16} className="shrink-0" />
          <span className="flex-1 font-medium">{deleteError}</span>
          <button type="button" onClick={() => setDeleteError(null)} className="text-[#721c24] hover:opacity-75">
            <X size={15} />
          </button>
        </div>
      )}

      {/* Stat Cards */}
      {loading && segments.length === 0 ? (
        <StatCardsSkeleton count={4} />
      ) : (
        <div className="mb-4 grid grid-cols-4 gap-3 max-[900px]:grid-cols-2 max-[480px]:grid-cols-1">
          {stats.map(({ label, value, tone }) => (
            <div
              key={label}
              className="rounded-[14px] border border-[#eceeec] bg-white px-4 py-3.5 shadow-[0_1px_2px_rgba(20,40,28,.03)]"
            >
              <p className="text-[12px] text-[#7c8780]">{label}</p>
              <p className={cn('mt-1.5 text-[22px] font-bold leading-none tracking-[-0.02em]', tone === 'green' ? 'text-[#1aa054]' : 'text-[#17231c]')}>
                {value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Segments Table Container */}
      <div className="rounded-[14px] border border-[#eceeec] bg-white shadow-[0_1px_2px_rgba(20,40,28,.03)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#f0f2f0] p-4">
          <div className="relative w-full max-w-[320px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9aa49d]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search segments..."
              className="h-[34px] w-full rounded-full border border-[#dfe4e0] bg-[#fcfdfc] pl-8 pr-3 text-[12.5px] outline-none transition focus:border-[#1aa054]"
            />
          </div>
          <div className="text-[12px] text-[#7c8780]">
            Hourly automatic refresh active &bull; Clock aligns with M12
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-[#f0f2f0] bg-[#f9faf9] text-[11.5px] font-bold uppercase tracking-wider text-[#69756d]">
                <th className="py-3 pl-5 pr-3">Segment Name</th>
                <th className="px-3 py-3">Definition / Cohort</th>
                <th className="px-3 py-3">Audience Size</th>
                <th className="px-3 py-3">Last Refreshed</th>
                <th className="px-3 py-3">Channels</th>
                <th className="py-3 pl-3 pr-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f2f0]">
              {loading && segments.length === 0 ? (
                <TableBodySkeleton rows={4} cols={6} />
              ) : filteredSegments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-[#7c8780]">
                    No customer segments found. Create your first predefined cohort or custom builder segment!
                  </td>
                </tr>
              ) : (
                filteredSegments.map((segment) => (
                  <tr key={segment.id} className="transition hover:bg-[#fbfcfb]">
                    <td className="py-3.5 pl-5 pr-3 font-semibold text-[#17231c]">
                      {segment.name}
                      <span className="ml-2 inline-block rounded bg-[#edf4ef] px-1.5 py-0.5 text-[10.5px] font-medium text-[#147940]">
                        {segment.type || 'DYNAMIC'}
                      </span>
                    </td>
                    <td className="px-3 py-3.5 text-[#5c6b63]">
                      {summarizeSegmentRule(segment)}
                    </td>
                    <td className="px-3 py-3.5 font-bold text-[#1aa054]">
                      <span className="rounded-full bg-[#e8f7ed] px-2.5 py-1 text-[12px]">
                        {Number(segment.size || 0).toLocaleString()} customers
                      </span>
                    </td>
                    <td className="px-3 py-3.5 text-[#7c8780]">
                      {formatRelativeTime(segment.refreshed_at || segment.refreshedAt || segment.sizeCachedAt)}
                    </td>
                    <td className="px-3 py-3.5">
                      <div className="flex gap-1">
                        {(segment.channels?.length ? segment.channels : ['PUSH']).map((ch) => (
                          <span
                            key={ch}
                            className="rounded border border-[#e2e7e4] bg-[#fafbfa] px-1.5 py-0.5 text-[10px] font-bold text-[#627068]"
                          >
                            {ch}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 pl-3 pr-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleRecalculate(segment.id)}
                          disabled={recalculatingId === segment.id}
                          title="Recalculate segment membership"
                          className="inline-flex h-[28px] w-[28px] items-center justify-center rounded-full border border-[#dfe4e0] text-[#5c6b63] hover:bg-[#f0f4f1] disabled:opacity-50"
                        >
                          <RefreshCw
                            size={12}
                            className={cn(recalculatingId === segment.id && 'animate-spin text-[#1aa054]')}
                          />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditModal(segment)}
                          title="Edit segment"
                          className="inline-flex h-[28px] w-[28px] items-center justify-center rounded-full border border-[#dfe4e0] text-[#5c6b63] hover:bg-[#f0f4f1]"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(segment)}
                          title="Delete segment"
                          className="inline-flex h-[28px] w-[28px] items-center justify-center rounded-full border border-[#fed7d7] text-[#c53030] hover:bg-[#fff5f5]"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal / Builder */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[1px]">
          <div className="flex max-h-[90vh] w-full max-w-[640px] flex-col rounded-[16px] bg-white shadow-xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#eceeec] px-5 py-4">
              <div>
                <h3 className="text-[17px] font-bold text-[#17231c]">
                  {editingSegment ? 'Edit Customer Segment' : 'Create Customer Segment'}
                </h3>
                <p className="text-[12px] text-[#7c8780]">
                  OG §09 — Saved filter refreshing hourly across vouchers, campaigns &amp; push
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-full p-1 text-[#7c8780] hover:bg-[#f0f2f0]"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5">
              {modalError && (
                <div className="mb-4 rounded-[10px] border border-[#f5c6cb] bg-[#f8d7da] p-3 text-[12.5px] text-[#721c24]">
                  {modalError}
                </div>
              )}

              {/* Segment Name */}
              <div className="mb-4">
                <label className="mb-1 block text-[12px] font-semibold text-[#455249]">
                  Segment Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Inactive 14 Days, Manama High Spenders, Welcome New"
                  className="h-[38px] w-full rounded-[8px] border border-[#d6dad7] px-3 text-[13px] outline-none focus:border-[#1aa054]"
                />
              </div>

              {/* Mode Selection */}
              <div className="mb-4">
                <label className="mb-1 block text-[12px] font-semibold text-[#455249]">
                  Cohort Definition
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setModalMode('preset')}
                    className={cn(
                      'rounded-[8px] border px-3 py-2 text-center text-[12px] font-bold transition',
                      modalMode === 'preset'
                        ? 'border-[#1aa054] bg-[#e8f7ed] text-[#147940]'
                        : 'border-[#d6dad7] bg-white text-[#5c6b63] hover:bg-[#f6f8f6]',
                    )}
                  >
                    OG Predefined Cohort
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalMode('custom')}
                    className={cn(
                      'rounded-[8px] border px-3 py-2 text-center text-[12px] font-bold transition',
                      modalMode === 'custom'
                        ? 'border-[#1aa054] bg-[#e8f7ed] text-[#147940]'
                        : 'border-[#d6dad7] bg-white text-[#5c6b63] hover:bg-[#f6f8f6]',
                    )}
                  >
                    Custom Rule Builder
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalMode('all')}
                    className={cn(
                      'rounded-[8px] border px-3 py-2 text-center text-[12px] font-bold transition',
                      modalMode === 'all'
                        ? 'border-[#1aa054] bg-[#e8f7ed] text-[#147940]'
                        : 'border-[#d6dad7] bg-white text-[#5c6b63] hover:bg-[#f6f8f6]',
                    )}
                  >
                    All Customers
                  </button>
                </div>
              </div>

              {/* Mode: Preset */}
              {modalMode === 'preset' && (
                <div className="mb-4 rounded-[10px] border border-[#e2e7e4] bg-[#f9faf9] p-4">
                  <label className="mb-2 block text-[12px] font-semibold text-[#455249]">
                    Select OG Preset
                  </label>
                  <div className="space-y-2">
                    {PRESET_OPTIONS.map((opt) => (
                      <label
                        key={opt.id}
                        className={cn(
                          'flex cursor-pointer items-start gap-3 rounded-[8px] border p-2.5 transition',
                          formPreset === opt.id
                            ? 'border-[#1aa054] bg-white shadow-sm'
                            : 'border-transparent bg-transparent hover:bg-white/60',
                        )}
                      >
                        <input
                          type="radio"
                          name="presetOption"
                          checked={formPreset === opt.id}
                          onChange={() => {
                            setFormPreset(opt.id)
                            if (opt.id === 'LANGUAGE' && !formPresetValue) setFormPresetValue('ar')
                          }}
                          className="mt-0.5 text-[#1aa054]"
                        />
                        <div className="flex-1">
                          <p className="text-[12.5px] font-bold text-[#17231c]">{opt.label}</p>
                          <p className="text-[11.5px] text-[#7c8780]">{opt.description}</p>
                          {formPreset === opt.id && opt.needsValue && (
                            <div className="mt-2">
                              {opt.valueType === 'select' ? (
                                <select
                                  value={formPresetValue || 'ar'}
                                  onChange={(e) => setFormPresetValue(e.target.value)}
                                  className="h-[34px] w-full rounded border border-[#d6dad7] bg-white px-2.5 text-[12px] outline-none focus:border-[#1aa054]"
                                >
                                  {opt.options.map((o) => (
                                    <option key={o.value} value={o.value}>
                                      {o.label}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <input
                                  type="text"
                                  value={formPresetValue}
                                  onChange={(e) => setFormPresetValue(e.target.value)}
                                  placeholder={opt.valuePlaceholder}
                                  className="h-[34px] w-full rounded border border-[#d6dad7] bg-white px-2.5 text-[12px] outline-none focus:border-[#1aa054]"
                                />
                              )}
                            </div>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Mode: Custom */}
              {modalMode === 'custom' && (
                <div className="mb-4 rounded-[10px] border border-[#e2e7e4] bg-[#f9faf9] p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] font-semibold text-[#455249]">Match logic:</span>
                      <select
                        value={formMatchLogic}
                        onChange={(e) => setFormMatchLogic(e.target.value)}
                        className="h-[30px] rounded border border-[#d6dad7] bg-white px-2 text-[12px] font-bold outline-none"
                      >
                        <option value="ALL">ALL conditions (AND - Intersection)</option>
                        <option value="ANY">ANY condition (OR - Union)</option>
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={addCondition}
                      className="inline-flex h-[28px] items-center gap-1 rounded bg-[#e8f7ed] px-2.5 text-[11.5px] font-bold text-[#147940] hover:bg-[#d5eedd]"
                    >
                      <Plus size={13} />
                      Add condition
                    </button>
                  </div>

                  <div className="space-y-2">
                    {formConditions.map((cond, idx) => {
                      const selectedField = CUSTOM_FIELD_OPTIONS.find((f) => f.value === cond.field) || CUSTOM_FIELD_OPTIONS[0]
                      const isNumeric = selectedField.type === 'number'
                      const operators = OPERATOR_OPTIONS[selectedField.type] || OPERATOR_OPTIONS.number

                      return (
                        <div key={idx} className="flex items-center gap-2 rounded-[8px] border border-[#eceeec] bg-white p-2">
                          <select
                            value={cond.field}
                            onChange={(e) => {
                              const newField = CUSTOM_FIELD_OPTIONS.find((f) => f.value === e.target.value)
                              updateCondition(idx, {
                                field: e.target.value,
                                operator: newField?.type === 'text' ? 'contains' : 'gte',
                                value: newField?.type === 'number' ? 0 : '',
                              })
                            }}
                            className="h-[32px] w-[200px] rounded border border-[#dfe4e0] bg-[#fafbfa] px-2 text-[11.5px] font-medium"
                          >
                            {CUSTOM_FIELD_OPTIONS.map((f) => (
                              <option key={f.value} value={f.value}>
                                {f.label}
                              </option>
                            ))}
                          </select>

                          <select
                            value={cond.operator}
                            onChange={(e) => updateCondition(idx, { operator: e.target.value })}
                            className="h-[32px] w-[130px] rounded border border-[#dfe4e0] bg-[#fafbfa] px-2 text-[11.5px]"
                          >
                            {operators.map((op) => (
                              <option key={op.value} value={op.value}>
                                {op.label}
                              </option>
                            ))}
                          </select>

                          <input
                            type={isNumeric ? 'number' : 'text'}
                            value={cond.value}
                            onChange={(e) =>
                              updateCondition(idx, {
                                value: isNumeric ? Number(e.target.value) : e.target.value,
                              })
                            }
                            placeholder="Value"
                            className="h-[32px] flex-1 rounded border border-[#dfe4e0] px-2 text-[12px] outline-none focus:border-[#1aa054]"
                          />

                          {formConditions.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeCondition(idx)}
                              className="p-1 text-[#a0aba4] hover:text-[#c53030]"
                            >
                              <X size={15} />
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  <p className="mt-3 text-[11px] text-[#7c8780]">
                    Note: Gender, age band, account type, and online status are listed under OG examples but are not stored on customer profiles.
                  </p>
                </div>
              )}

              {/* Mode: All Customers */}
              {modalMode === 'all' && (
                <div className="mb-4 rounded-[10px] border border-[#c3e6cb] bg-[#d4edda] p-3 text-[12.5px] text-[#155724]">
                  This segment will include <strong>all active registered customers</strong> without any filtering.
                </div>
              )}

              {/* Preview & Channels */}
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-[#eceeec] p-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePreview}
                    disabled={previewLoading}
                    className="inline-flex h-[32px] items-center gap-1.5 rounded-full border border-[#1aa054] px-3 text-[12px] font-bold text-[#1aa054] hover:bg-[#e8f7ed] disabled:opacity-50"
                  >
                    <RefreshCw size={12} className={cn(previewLoading && 'animate-spin')} />
                    Preview Count
                  </button>
                  {previewCount !== null && (
                    <span className="text-[12px] font-bold text-[#17231c]">
                      Estimated audience: <span className="text-[#1aa054]">{previewCount.toLocaleString()}</span> customers
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11.5px] font-semibold text-[#5c6b63]">Channels:</span>
                  {['PUSH', 'EMAIL', 'SMS'].map((ch) => (
                    <label key={ch} className="inline-flex cursor-pointer items-center gap-1 text-[11.5px] text-[#455249]">
                      <input
                        type="checkbox"
                        checked={formChannels.includes(ch)}
                        onChange={(e) => {
                          if (e.target.checked) setFormChannels([...formChannels, ch])
                          else if (formChannels.length > 1) setFormChannels(formChannels.filter((c) => c !== ch))
                        }}
                      />
                      {ch}
                    </label>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 border-t border-[#eceeec] pt-4">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="h-[36px] rounded-full border border-[#dfe4e0] px-4 text-[13px] font-semibold text-[#5c6b63] hover:bg-[#f6f8f6]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="h-[36px] rounded-full bg-[#1aa054] px-5 text-[13px] font-bold text-white shadow-sm hover:bg-[#158a47] disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingSegment ? 'Save changes' : 'Save segment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
