import { useCallback, useEffect, useRef, useState } from 'react'
import { FileText, FileUp, Image as ImageIcon, Link2, Loader2, Upload, X } from 'lucide-react'
import { Badge } from '../Badge'
import { cn } from '../cn'
import AdminConfirmDialog from '../AdminConfirmDialog'
import { isAdminRealApiFeature } from '../../../api/config'
import { adminMenuImportService } from '../../../services/admin/menuImportService'
import { adminUploadService } from '../../../services/admin/uploadService'
import { showError, showSuccess } from '../../../utils/toast'
import {
  POLL_INTERVAL_MS,
  canCancelImport,
  canDeleteImport,
  canRetryImport,
  formatDateTime,
  isPollingStatus,
  messageForMenuImportError,
  statusTone,
} from '../../../mappers/admin/mapAdminMenuImport'
import { AdminMenuImportReview } from './AdminMenuImportReview'

const HISTORY_PAGE_SIZE = 5
const MENU_FILE_ACCEPT =
  'image/jpeg,image/png,image/webp,application/pdf,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,.csv,.xlsx,.xls'
const MENU_FILE_ACCEPT_SET = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  'text/csv',
  'application/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
])

function isAcceptedMenuFile(file) {
  if (MENU_FILE_ACCEPT_SET.has(file.type)) return true
  const name = String(file.name || '').toLowerCase()
  return (
    name.endsWith('.pdf') ||
    name.endsWith('.jpg') ||
    name.endsWith('.jpeg') ||
    name.endsWith('.png') ||
    name.endsWith('.webp') ||
    name.endsWith('.csv') ||
    name.endsWith('.xlsx') ||
    name.endsWith('.xls')
  )
}

function formatFileSize(bytes) {
  if (!Number.isFinite(bytes) || bytes < 0) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function isPdfFile(file) {
  return file.type === 'application/pdf' || String(file.name).toLowerCase().endsWith('.pdf')
}

function isSpreadsheetFile(file) {
  const name = String(file.name || '').toLowerCase()
  return (
    file.type === 'text/csv' ||
    file.type === 'application/csv' ||
    file.type === 'application/vnd.ms-excel' ||
    file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    name.endsWith('.csv') ||
    name.endsWith('.xlsx') ||
    name.endsWith('.xls')
  )
}

function resolveFileSourceType(files) {
  if (files.some(isSpreadsheetFile)) {
    const hasXlsx = files.some((file) => {
      const name = String(file.name || '').toLowerCase()
      return (
        name.endsWith('.xlsx') ||
        name.endsWith('.xls') ||
        file.type === 'application/vnd.ms-excel' ||
        file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      )
    })
    return hasXlsx ? 'EXCEL' : 'CSV'
  }
  return files.some(isPdfFile) ? 'PDF' : 'IMAGE'
}

function fileKind(file) {
  if (isSpreadsheetFile(file)) return 'spreadsheet'
  if (isPdfFile(file)) return 'pdf'
  return 'image'
}

function hasMixedFileKinds(files) {
  return new Set(files.map(fileKind)).size > 1
}
const STATUS_FILTER_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'REVIEW', label: 'Review' },
  { value: 'PROCESSING', label: 'Processing' },
  { value: 'FAILED', label: 'Failed' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
]
const cardClass =
  'rounded-[14px] border border-[#eceeec] bg-white p-5 shadow-[0_1px_2px_rgba(20,40,28,.03)]'
const primaryBtn =
  'inline-flex h-[34px] items-center justify-center gap-1.5 rounded-full bg-[#1aa054] px-4 text-[12px] font-bold text-white shadow-[0_1px_2px_rgba(20,40,28,.15)] hover:bg-[#158a47] disabled:opacity-50'
const outlineBtn =
  'inline-flex h-[34px] items-center justify-center gap-1.5 rounded-full border border-[#dfe4e0] bg-white px-4 text-[12px] font-medium text-[#127338] hover:bg-[#f6f8f6] disabled:opacity-50'
const dangerBtn =
  'inline-flex h-[34px] items-center justify-center gap-1.5 rounded-full border border-[#f2cccc] bg-[#fff5f5] px-4 text-[12px] font-medium text-[#d64044] hover:bg-[#fdebea] disabled:opacity-50'

function useImportPoller(vendorId, importId, status, onUpdate, enabled) {
  const statusRef = useRef(status)
  statusRef.current = status

  useEffect(() => {
    if (!enabled || !vendorId || !importId) return
    if (!status || !isPollingStatus(status)) return

    let cancelled = false
    const tick = async () => {
      if (cancelled) return
      try {
        const next = await adminMenuImportService.get(vendorId, importId)
        if (!cancelled) onUpdate(next)
      } catch {
        /* keep polling */
      }
    }

    void tick()
    const id = window.setInterval(() => {
      if (statusRef.current && isPollingStatus(statusRef.current)) void tick()
    }, POLL_INTERVAL_MS)

    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [vendorId, importId, status, onUpdate, enabled])
}

export function AdminVendorMenuImport({ vendorId, storeName }) {
  const featureOn = isAdminRealApiFeature('menu-import')
  const [imports, setImports] = useState([])
  const [listMeta, setListMeta] = useState({ total: 0, page: 1, limit: HISTORY_PAGE_SIZE, totalPages: 1 })
  const [statusFilter, setStatusFilter] = useState('')
  const [historyPage, setHistoryPage] = useState(1)
  const [selected, setSelected] = useState(null)
  const [listLoading, setListLoading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [showStart, setShowStart] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const loadImports = useCallback(async (options = {}) => {
    if (!vendorId || !featureOn) return { items: [], total: 0, page: 1, limit: HISTORY_PAGE_SIZE, totalPages: 1 }
    const page = options.page ?? historyPage
    const status = options.status ?? statusFilter
    setListLoading(true)
    setError(null)
    try {
      const result = await adminMenuImportService.list(vendorId, {
        page,
        limit: HISTORY_PAGE_SIZE,
        ...(status ? { status } : {}),
      })
      setImports(result.items)
      setListMeta({
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      })
      return result
    } catch (err) {
      setError(messageForMenuImportError(err, 'Failed to load imports.'))
      return { items: [], total: 0, page: 1, limit: HISTORY_PAGE_SIZE, totalPages: 1 }
    } finally {
      setListLoading(false)
    }
  }, [vendorId, featureOn, historyPage, statusFilter])

  useEffect(() => {
    if (!featureOn) return
    void loadImports({ page: historyPage, status: statusFilter }).then((result) => {
      const rows = result.items
      if (!rows.length) {
        setSelected(null)
        setShowStart(true)
        return
      }
      const active = rows.find((row) =>
        ['QUEUED', 'PROCESSING', 'REVIEW', 'PUBLISHING'].includes(row.status),
      )
      setSelected((current) => current && rows.find((row) => row.id === current.id) ? current : active ?? rows[0])
      setShowStart(!active)
    })
  }, [featureOn, loadImports, historyPage, statusFilter])

  const handleImportUpdate = useCallback((imp) => {
    setSelected(imp)
    setImports((prev) => {
      const idx = prev.findIndex((row) => row.id === imp.id)
      if (idx === -1) return [imp, ...prev]
      const next = [...prev]
      next[idx] = { ...next[idx], ...imp }
      return next
    })
  }, [])

  useImportPoller(vendorId, selected?.id ?? null, selected?.status ?? null, handleImportUpdate, featureOn)

  const handleStart = async (input) => {
    setBusy(true)
    setError(null)
    try {
      const created = await adminMenuImportService.create(vendorId, input)
      const result = await loadImports({ page: 1, status: statusFilter })
      setSelected(created)
      setHistoryPage(1)
      setImports((prev) => {
        if (result.items.find((row) => row.id === created.id)) return result.items
        return [created, ...prev]
      })
      setShowStart(false)
    } catch (err) {
      const message = messageForMenuImportError(err, 'Failed to start import.')
      setError(message)
      throw err
    } finally {
      setBusy(false)
    }
  }

  const handleCancel = async () => {
    if (!selected) return
    setBusy(true)
    setError(null)
    try {
      const updated = await adminMenuImportService.cancel(vendorId, selected.id)
      handleImportUpdate(updated)
      setShowStart(true)
    } catch (err) {
      setError(messageForMenuImportError(err, 'Failed to cancel import.'))
    } finally {
      setBusy(false)
    }
  }

  const handleRetry = async (importId) => {
    const id = importId || selected?.id
    if (!id) return
    setBusy(true)
    setError(null)
    try {
      const updated = await adminMenuImportService.retry(vendorId, id)
      handleImportUpdate(updated)
      setSelected(updated)
      setShowStart(false)
    } catch (err) {
      setError(messageForMenuImportError(err, 'Failed to retry import.'))
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async (importId) => {
    if (!importId) return
    setBusy(true)
    setError(null)
    try {
      await adminMenuImportService.remove(vendorId, importId)
      showSuccess('Import removed from history.')
      const result = await loadImports({ page: historyPage, status: statusFilter })
      const rows = result.items
      if (selected?.id === importId) {
        setSelected(rows[0] ?? null)
        setShowStart(!rows.length || !rows.find((r) => ['QUEUED', 'PROCESSING', 'REVIEW', 'PUBLISHING'].includes(r.status)))
      }
      setConfirmDelete(null)
    } catch (err) {
      const message = messageForMenuImportError(err, 'Failed to delete import.')
      setError(message)
      showError(message)
    } finally {
      setBusy(false)
    }
  }

  if (!featureOn) {
    return (
      <div className={cardClass}>
        <h3 className="text-[15px] font-bold text-[#17231c]">Menu import</h3>
        <p className="mt-1 text-[12px] leading-[18px] text-[#7c8780]">
          Enable the <code className="text-[11px]">menu-import</code> feature flag
          (<code className="text-[11px]">VITE_ADMIN_REAL_API_FEATURES</code>) to connect this tab
          to the Admin Backend.
        </p>
      </div>
    )
  }

  const showProgress =
    selected &&
    ['QUEUED', 'PROCESSING', 'PUBLISHING', 'FAILED', 'CANCELLED'].includes(selected.status)
  const showReview = selected && (selected.status === 'REVIEW' || selected.status === 'COMPLETED')

  return (
    <div className="space-y-4">
      <div className={cardClass}>
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-[15px] font-bold text-[#17231c]">Menu import</h3>
            <p className="mt-1 max-w-[560px] text-[12px] leading-[18px] text-[#7c8780]">
              Extract a menu from the vendor website, PDF, or photos. Review prices, then publish
              to the vendor catalog.
              {storeName ? ` · ${storeName}` : ''}
            </p>
          </div>
          <button
            type="button"
            className={outlineBtn}
            disabled={busy || listLoading}
            onClick={() => {
              setShowStart(true)
              setSelected(null)
            }}
          >
            New import
          </button>
        </div>

        {error ? (
          <p className="mb-3 text-[12px] font-medium text-[#d64044]" role="alert">
            {error}
          </p>
        ) : null}

        {listLoading && !imports.length ? (
          <p className="text-[12px] text-[#7c8780]">Loading imports…</p>
        ) : (
          <HistoryTable
            imports={imports}
            busy={busy}
            listMeta={listMeta}
            statusFilter={statusFilter}
            onStatusFilterChange={(value) => {
              setStatusFilter(value)
              setHistoryPage(1)
            }}
            onPageChange={setHistoryPage}
            onSelect={(row) => {
              setSelected(row)
              setShowStart(false)
            }}
            onDelete={(row) =>
              setConfirmDelete({
                id: row.id,
                title: 'Delete import?',
                message: 'Remove this import from history? This cannot be undone.',
              })
            }
          />
        )}
      </div>

      <AdminConfirmDialog
        open={Boolean(confirmDelete)}
        title={confirmDelete?.title || 'Confirm'}
        message={confirmDelete?.message || ''}
        confirmLabel="Delete"
        busy={busy}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => void handleDelete(confirmDelete?.id)}
      />

      {showStart ? (
        <StartImportModal busy={busy} onClose={() => setShowStart(false)}>
          <StartPanel
            vendorId={vendorId}
            busy={busy}
            onStart={handleStart}
            onClose={() => setShowStart(false)}
          />
        </StartImportModal>
      ) : null}

      {showProgress && selected ? (
        <ProgressPanel
          imp={selected}
          busy={busy}
          onCancel={() => void handleCancel()}
          onRetry={() => void handleRetry(selected.id)}
          onNewImport={() => {
            setShowStart(true)
            setSelected(null)
          }}
        />
      ) : null}

      {showReview && selected ? (
        <AdminMenuImportReview
          vendorId={vendorId}
          imp={selected}
          onImportUpdate={handleImportUpdate}
          onCancel={() => void handleCancel()}
        />
      ) : null}
    </div>
  )
}

function HistoryTable({
  imports,
  onSelect,
  onDelete,
  busy,
  listMeta,
  statusFilter,
  onStatusFilterChange,
  onPageChange,
}) {
  if (!imports.length && !statusFilter) {
    return <p className="text-[12px] text-[#7c8780]">No prior imports for this vendor.</p>
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-[12px] text-[#7c8780]">
          <span>Filter</span>
          <select
            className="h-[32px] rounded-[8px] border border-[rgba(0,0,0,0.1)] bg-white px-2 text-[12px] text-[#17231c]"
            value={statusFilter}
            onChange={(event) => onStatusFilterChange(event.target.value)}
          >
            {STATUS_FILTER_OPTIONS.map((option) => (
              <option key={option.value || 'all'} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <p className="text-[12px] text-[#7c8780]">
          {listMeta.total} total · page {listMeta.page} of {listMeta.totalPages}
        </p>
      </div>

      {!imports.length ? (
        <p className="text-[12px] text-[#7c8780]">No imports match this filter.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left">
            <thead>
              <tr className="border-b border-[#edf0ee] bg-[#fafbfa]">
                {['Started', 'Source', 'Status', 'Pages', ''].map((col) => (
                  <th
                    key={col || 'actions'}
                    className="whitespace-nowrap px-3 py-2 text-[10px] font-medium uppercase tracking-[0.05em] text-[#8a948e]"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {imports.map((row) => (
                <tr
                  key={row.id}
                  className="cursor-pointer border-b border-[#f3f5f3] hover:bg-[#f7faf8]"
                  onClick={() => onSelect(row)}
                >
                  <td className="whitespace-nowrap px-3 py-2.5 text-[12px] text-[#17231c]">
                    {formatDateTime(row.createdAt)}
                  </td>
                  <td className="px-3 py-2.5 text-[12px] text-[#455249]">{row.sourceType}</td>
                  <td className="px-3 py-2.5">
                    <Badge tone={statusTone(row.status)}>{row.status}</Badge>
                  </td>
                  <td className="px-3 py-2.5 text-[12px] text-[#455249]">
                    {row.totalPages > 0 ? `${row.processedPages} / ${row.totalPages}` : '—'}
                  </td>
                  <td className="px-3 py-2.5">
                    {canDeleteImport(row.status) ? (
                      <button
                        type="button"
                        className="text-[11px] font-medium text-[#d64044] hover:underline disabled:opacity-50"
                        disabled={busy}
                        onClick={(e) => {
                          e.stopPropagation()
                          onDelete?.(row)
                        }}
                      >
                        Delete
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {listMeta.totalPages > 1 ? (
        <div className="mt-3 flex items-center justify-end gap-2">
          <button
            type="button"
            className={outlineBtn}
            disabled={busy || listMeta.page <= 1}
            onClick={() => onPageChange(listMeta.page - 1)}
          >
            Previous
          </button>
          <button
            type="button"
            className={outlineBtn}
            disabled={busy || listMeta.page >= listMeta.totalPages}
            onClick={() => onPageChange(listMeta.page + 1)}
          >
            Next
          </button>
        </div>
      ) : null}
    </div>
  )
}

const SPREADSHEET_TEMPLATE_CSV = [
  'category,category_ar,name,name_ar,description,description_ar,price',
  'Foods,أطعمة,Margherita Pizza,بيتزا مارغريتا,Classic tomato and mozzarella,طماطم وجبنة موزاريلا كلاسيكية,12.500',
  'Drinks,مشروبات,Cola,كولا,Chilled soda,مشروب غازي بارد,2.500',
].join('\n')

const COLUMN_MAP_FIELDS = [
  { key: 'name', label: 'Item name (EN)', required: true },
  { key: 'price', label: 'Price', required: true },
  { key: 'category', label: 'Category (EN)', required: false },
  { key: 'categoryAr', label: 'Category (AR)', required: false },
  { key: 'nameAr', label: 'Item name (AR)', required: false },
  { key: 'description', label: 'Description (EN)', required: false },
  { key: 'descriptionAr', label: 'Description (AR)', required: false },
]

function downloadSpreadsheetTemplate(csvText = SPREADSHEET_TEMPLATE_CSV) {
  const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = 'yjeek-menu-import-template.csv'
  anchor.click()
  URL.revokeObjectURL(url)
}

function StartImportModal({ busy, onClose, children }) {
  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === 'Escape' && !busy) onClose?.()
    }
    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [busy, onClose])

  return (
    <div
      className="fixed inset-0 z-[160] flex items-center justify-center bg-black/35 p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget && !busy) onClose?.()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Start menu import"
        className="max-h-[min(90vh,820px)] w-full max-w-[640px] overflow-y-auto"
      >
        {children}
      </div>
    </div>
  )
}

function StartPanel({ vendorId, busy, onStart, onClose }) {
  const [mode, setMode] = useState('url')
  const [url, setUrl] = useState('')
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState(null)
  const [sheetPreview, setSheetPreview] = useState(null)
  const [columnMapping, setColumnMapping] = useState({})
  const [uploadedUrls, setUploadedUrls] = useState([])
  const fileRef = useRef(null)
  const disabled = busy || uploading
  const hasSpreadsheet = files.some(isSpreadsheetFile)
  const mappingReady = Boolean(columnMapping.name && columnMapping.price)

  const addFiles = (incoming) => {
    const accepted = Array.from(incoming || []).filter(isAcceptedMenuFile)
    if (!accepted.length) {
      setError('Only PDF, image, or spreadsheet files (CSV/Excel) are allowed.')
      return
    }

    const next = [...files]
    for (const file of accepted) {
      const key = `${file.name}:${file.size}:${file.lastModified}`
      if (next.some((f) => `${f.name}:${f.size}:${f.lastModified}` === key)) continue
      next.push(file)
    }

    if (hasMixedFileKinds(next)) {
      setError('Use one file type per import (all PDFs, all images, or all spreadsheets).')
      return
    }

    setError(null)
    setSheetPreview(null)
    setColumnMapping({})
    setUploadedUrls([])
    setFiles(next)
  }

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
    setSheetPreview(null)
    setColumnMapping({})
    setUploadedUrls([])
    if (fileRef.current) fileRef.current.value = ''
  }

  const clearFiles = () => {
    setFiles([])
    setSheetPreview(null)
    setColumnMapping({})
    setUploadedUrls([])
    if (fileRef.current) fileRef.current.value = ''
  }

  const handleSubmit = async () => {
    if (disabled) return
    setError(null)
    try {
      if (mode === 'url') {
        const trimmed = url.trim()
        if (!trimmed) {
          setError('Enter a vendor-owned menu URL.')
          return
        }
        await onStart({ sourceType: 'VENDOR_URL', sourceUrl: trimmed })
        setUrl('')
        return
      }

      if (!files.length) {
        setError('Choose at least one PDF, image, or spreadsheet file.')
        return
      }

      setUploading(true)

      if (hasSpreadsheet) {
        let urls = uploadedUrls
        if (!urls.length) {
          urls = []
          for (const file of files) {
            const result = await adminUploadService.uploadMenuSource(file)
            urls.push(result.data.url)
          }
          setUploadedUrls(urls)
        }

        let mapping = columnMapping
        if (!sheetPreview) {
          const preview = await adminMenuImportService.previewSpreadsheet(vendorId, {
            sourceFiles: urls,
          })
          const suggested = preview?.suggestedMapping || {}
          mapping = {
            name: suggested.name || '',
            price: suggested.price || '',
            category: suggested.category || '',
            categoryAr: suggested.categoryAr || '',
            nameAr: suggested.nameAr || '',
            description: suggested.description || '',
            descriptionAr: suggested.descriptionAr || '',
          }
          setSheetPreview(preview)
          setColumnMapping(mapping)
          if (!mapping.name || !mapping.price) {
            setError('Map Item name and Price columns, then click Start import again.')
            return
          }
        }

        if (!mapping.name || !mapping.price) {
          setError('Map Item name and Price columns before starting.')
          return
        }

        const mappingPayload = Object.fromEntries(
          Object.entries(mapping).filter(([, value]) => String(value || '').trim()),
        )
        await onStart({
          sourceType: resolveFileSourceType(files),
          sourceFiles: urls,
          columnMapping: mappingPayload,
        })
        clearFiles()
        return
      }

      const urls = []
      for (const file of files) {
        const result = await adminUploadService.uploadMenuSource(file)
        urls.push(result.data.url)
      }
      await onStart({ sourceType: resolveFileSourceType(files), sourceFiles: urls })
      clearFiles()
    } catch (err) {
      setError(messageForMenuImportError(err, 'Failed to start import. Please try again.'))
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className={cn(cardClass, 'shadow-[0_16px_48px_rgba(20,40,28,.18)]')}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="text-[15px] font-bold text-[#17231c]">Start menu import</h3>
          <p className="mt-1 text-[12px] leading-[18px] text-[#7c8780]">
            Paste a vendor-owned web menu, or upload PDF / image / spreadsheet files. Files go
            through Admin Backend storage first.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            className={outlineBtn}
            onClick={() =>
              downloadSpreadsheetTemplate(sheetPreview?.templateCsv || SPREADSHEET_TEMPLATE_CSV)
            }
          >
            Download CSV template
          </button>
          {onClose ? (
            <button
              type="button"
              className="inline-flex size-8 items-center justify-center rounded-full text-[#637068] hover:bg-[#f3f5f3] disabled:opacity-50"
              disabled={disabled}
              onClick={onClose}
              aria-label="Close"
            >
              <X size={16} />
            </button>
          ) : null}
        </div>
      </div>

      <div className="mb-4 flex gap-2">
        <button
          type="button"
          className={mode === 'url' ? primaryBtn : outlineBtn}
          onClick={() => setMode('url')}
        >
          <Link2 size={14} />
          Vendor URL
        </button>
        <button
          type="button"
          className={mode === 'file' ? primaryBtn : outlineBtn}
          onClick={() => setMode('file')}
        >
          <FileUp size={14} />
          PDF / Spreadsheet
        </button>
      </div>

      {mode === 'url' ? (
        <label className="block">
          <span className="mb-1.5 block text-[12px] font-medium text-[#7c8780]">Menu URL</span>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://vendor.example.com/menu"
            disabled={disabled}
            className="box-border h-[40px] w-full rounded-[8px] border border-[rgba(0,0,0,0.1)] bg-white px-3 text-[13px] text-[#17231c] outline-none focus:border-[#1aa054]"
          />
        </label>
      ) : (
        <div>
          <span className="mb-1.5 block text-[12px] font-medium text-[#7c8780]">Files</span>
          <input
            ref={fileRef}
            type="file"
            accept={MENU_FILE_ACCEPT}
            multiple
            disabled={disabled}
            className="sr-only"
            onChange={(e) => {
              addFiles(e.target.files)
              e.target.value = ''
            }}
          />
          <button
            type="button"
            disabled={disabled}
            onClick={() => fileRef.current?.click()}
            onDragEnter={(e) => {
              e.preventDefault()
              e.stopPropagation()
              if (!disabled) setDragOver(true)
            }}
            onDragOver={(e) => {
              e.preventDefault()
              e.stopPropagation()
              if (!disabled) setDragOver(true)
            }}
            onDragLeave={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setDragOver(false)
            }}
            onDrop={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setDragOver(false)
              if (disabled) return
              addFiles(e.dataTransfer.files)
            }}
            className={cn(
              'flex w-full flex-col items-center justify-center rounded-[12px] border border-dashed px-4 py-7 text-center transition-colors',
              disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
              dragOver
                ? 'border-[#1aa054] bg-[#eef8f1]'
                : 'border-[#c9d4cd] bg-[#f7faf8] hover:border-[#1aa054] hover:bg-[#f0f7f2]',
            )}
          >
            <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-[0_1px_2px_rgba(20,40,28,.08)] ring-1 ring-[#e4ebe6]">
              <Upload size={18} className="text-[#1aa054]" />
            </span>
            <span className="text-[13px] font-semibold text-[#17231c]">
              {dragOver ? 'Drop files to add' : 'Drag & drop menu files here'}
            </span>
            <span className="mt-1 text-[12px] text-[#7c8780]">
              or{' '}
              <span className="font-semibold text-[#127338]">browse</span>
              {' '}· PDF, JPG, PNG, WebP, CSV, Excel
            </span>
          </button>

          {files.length ? (
            <ul className="mt-3 space-y-2">
              {files.map((file, index) => {
                const pdf = isPdfFile(file)
                const sheet = isSpreadsheetFile(file)
                return (
                  <li
                    key={`${file.name}:${file.size}:${file.lastModified}:${index}`}
                    className="flex items-center gap-3 rounded-[10px] border border-[#e7ece8] bg-white px-3 py-2.5"
                  >
                    <span
                      className={cn(
                        'flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px]',
                        pdf
                          ? 'bg-[#fff5f5] text-[#d64044]'
                          : sheet
                            ? 'bg-[#ebf2ff] text-[#2978db]'
                            : 'bg-[#eef8f1] text-[#1aa054]',
                      )}
                    >
                      {pdf || sheet ? <FileText size={16} /> : <ImageIcon size={16} />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12.5px] font-medium text-[#17231c]">{file.name}</p>
                      <p className="text-[11px] text-[#7c8780]">
                        {pdf ? 'PDF' : sheet ? 'Spreadsheet' : 'Image'}
                        {formatFileSize(file.size) ? ` · ${formatFileSize(file.size)}` : ''}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={disabled}
                      aria-label={`Remove ${file.name}`}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-full text-[#7c8780] hover:bg-[#f3f5f3] hover:text-[#455249] disabled:opacity-50"
                      onClick={() => removeFile(index)}
                    >
                      <X size={14} />
                    </button>
                  </li>
                )
              })}
            </ul>
          ) : null}

          {sheetPreview ? (
            <div className="mt-4 rounded-[10px] border border-[#e7ece8] bg-[#f7faf8] p-3">
              <p className="text-[12px] font-semibold text-[#17231c]">Column mapping</p>
              <p className="mt-1 text-[11px] leading-[16px] text-[#7c8780]">
                Match spreadsheet headers to Yjeek fields. Arabic columns are optional — missing
                Arabic is translated after import.
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {COLUMN_MAP_FIELDS.map((field) => (
                  <label key={field.key} className="block">
                    <span className="mb-1 block text-[11px] font-medium text-[#7c8780]">
                      {field.label}
                      {field.required ? ' *' : ''}
                    </span>
                    <select
                      value={columnMapping[field.key] || ''}
                      disabled={disabled}
                      onChange={(e) => {
                        setError(null)
                        setColumnMapping((prev) => ({ ...prev, [field.key]: e.target.value }))
                      }}
                      className="box-border h-[34px] w-full rounded-[8px] border border-[rgba(0,0,0,0.1)] bg-white px-2 text-[12px] text-[#17231c] outline-none focus:border-[#1aa054]"
                    >
                      <option value="">{field.required ? 'Select column' : '— Skip —'}</option>
                      {(sheetPreview.headers || []).map((header) => (
                        <option key={`${field.key}:${header}`} value={header}>
                          {header}
                        </option>
                      ))}
                    </select>
                  </label>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      )}

      {error ? (
        <p className="mt-3 text-[12px] font-medium text-[#d64044]" role="alert">
          {error}
        </p>
      ) : null}

      <button
        type="button"
        className={cn(primaryBtn, 'mt-4')}
        disabled={disabled || (hasSpreadsheet && sheetPreview && !mappingReady)}
        onClick={() => void handleSubmit()}
      >
        {uploading
          ? sheetPreview
            ? 'Starting…'
            : hasSpreadsheet
              ? 'Reading spreadsheet…'
              : 'Uploading…'
          : busy
            ? 'Starting…'
            : hasSpreadsheet && !sheetPreview
              ? 'Detect columns & start'
              : 'Start import'}
      </button>
    </div>
  )
}

function ProgressPanel({ imp, busy, onCancel, onRetry, onNewImport }) {
  const progressPct =
    imp.totalPages > 0
      ? Math.min(100, Math.round((imp.processedPages / imp.totalPages) * 100))
      : null
  const spinning = ['QUEUED', 'PROCESSING', 'PUBLISHING'].includes(imp.status)

  return (
    <div className={cardClass}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-[15px] font-bold text-[#17231c]">Import progress</h3>
          <p className="text-[12px] text-[#7c8780]">
            {imp.sourceType} · {imp.id.slice(0, 8)}…
          </p>
        </div>
        <Badge tone={statusTone(imp.status)}>{imp.status}</Badge>
      </div>

      {imp.currentStep ? (
        <p className="mb-3 flex items-center gap-2 text-[13px] text-[#17231c]">
          {spinning ? <Loader2 size={16} className="animate-spin text-[#1aa054]" /> : null}
          {imp.currentStep}
        </p>
      ) : null}

      {progressPct !== null ? (
        <div className="mb-4">
          <div className="mb-1 flex justify-between text-[12px] text-[#7c8780]">
            <span>Pages</span>
            <span>
              {imp.processedPages} / {imp.totalPages}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[#eff2f0]">
            <div
              className="h-full rounded-full bg-[#1aa054] transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      ) : null}

      {imp.lastErrorMessage ? (
        <p
          className={cn(
            'mb-4 rounded-[10px] px-3 py-2 text-[12.5px]',
            imp.status === 'FAILED'
              ? 'border border-[#f2cccc] bg-[#fff5f5] text-[#a93e42]'
              : 'border border-[#f3e6c0] bg-[#fff8e8] text-[#9a6510]',
          )}
        >
          {imp.lastErrorMessage}
        </p>
      ) : null}

      {imp.status === 'CANCELLED' ? (
        <p className="mb-4 text-[12px] text-[#7c8780]">
          This import was cancelled. Start a new import when ready.
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {canCancelImport(imp.status) ? (
          <button type="button" className={dangerBtn} disabled={busy} onClick={onCancel}>
            Cancel import
          </button>
        ) : null}
        {canRetryImport(imp.status) ? (
          <button type="button" className={primaryBtn} disabled={busy} onClick={onRetry}>
            Retry extraction
          </button>
        ) : null}
        {imp.status === 'FAILED' || imp.status === 'CANCELLED' ? (
          <button type="button" className={outlineBtn} onClick={onNewImport}>
            New import
          </button>
        ) : null}
      </div>
    </div>
  )
}
