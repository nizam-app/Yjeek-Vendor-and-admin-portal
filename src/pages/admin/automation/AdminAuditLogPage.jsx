import { useMemo } from 'react'
import {
  AutomationRuleChangeLogTable,
  VendorAcceptanceLogTable,
} from '../../../components/admin/automation/AuditLogTables'
import { AutomationGapBanner } from '../../../components/admin/automation/AutomationGapBanner'
import { AutomationSectionCard } from '../../../components/admin/automation/AutomationSectionCard'
import { ApiState } from '../../../components/admin/ApiState'
import { Button } from '../../../components/admin/Button'
import { useAdminDispatchAuditLog } from '../../../hooks/admin/useAdminDispatchAuditLog'
import {
  buildAuditLogCsv,
  downloadAuditLogCsv,
  getAuditLogMock,
} from '../../../mocks/adminAutomationAuditLog.mock'
import { isAutomationRealApi } from '../../../services/admin/dispatchAutomationFeature'
import { showInfo, showSuccess } from '../../../utils/toast'

function MockAuditLogPage() {
  const catalog = useMemo(() => getAuditLogMock(), [])

  function handleExportCsv() {
    const csv = buildAuditLogCsv(catalog)
    downloadAuditLogCsv(catalog.exportFilename, csv)
    showSuccess('Audit Log CSV exported locally from mock data. No backend was contacted.')
  }

  function handleReadOnlyFooter(action) {
    showInfo(
      `Audit Log is read-only and permanent. ${action} does not change audit records or call the backend.`,
    )
  }

  return (
    <div className="pb-20">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[17px] font-bold text-[#111827]">{catalog.header.title}</h2>
          <p className="mt-1 text-[12px] text-[#6b7280]">{catalog.header.subtitle}</p>
        </div>
        <button
          type="button"
          onClick={handleExportCsv}
          className="inline-flex h-[34px] items-center gap-1.5 rounded-[7px] border border-[#d1d5db] bg-white px-3.5 text-[12px] font-medium text-[#374151] transition hover:border-[#1D6A33] hover:text-[#1D6A33]"
        >
          ↓ Export CSV
        </button>
      </div>

      <AutomationSectionCard title={catalog.vendorAcceptance.title}>
        <VendorAcceptanceLogTable
          columns={catalog.vendorAcceptance.columns}
          rows={catalog.vendorAcceptance.rows}
        />
      </AutomationSectionCard>

      <AutomationSectionCard title={catalog.ruleChanges.title}>
        <AutomationRuleChangeLogTable
          columns={catalog.ruleChanges.columns}
          rows={catalog.ruleChanges.rows}
        />
      </AutomationSectionCard>

      <div className="sticky bottom-0 z-10 -mx-5 mt-2 flex items-center justify-end gap-2.5 border-t border-[#e5e7eb] bg-white px-5 py-3 max-[700px]:-mx-3 max-[700px]:px-3">
        <Button
          type="button"
          onClick={() => handleReadOnlyFooter('Reset')}
          className="rounded-full px-5"
        >
          Reset
        </Button>
        <Button
          type="button"
          primary
          onClick={() => handleReadOnlyFooter('Save Automation')}
          className="rounded-full px-6"
        >
          Save Automation
        </Button>
      </div>
    </div>
  )
}

function RealAuditLogPage() {
  const shell = useMemo(() => getAuditLogMock(), [])
  const { catalog, isLoading, error, refetch, enabled } = useAdminDispatchAuditLog({
    section: 'all',
    limit: 100,
  })

  function handleExportCsv() {
    if (!catalog) {
      showInfo('No audit data loaded yet.')
      return
    }
    const csv = buildAuditLogCsv(catalog)
    downloadAuditLogCsv(catalog.exportFilename || shell.exportFilename, csv)
    showSuccess('Audit Log CSV exported from currently loaded real API rows.')
  }

  function handleReadOnlyFooter(action) {
    showInfo(
      `Audit Log is read-only and permanent. ${action} does not mutate logs or call write APIs.`,
    )
  }

  if (isLoading && !catalog) {
    return <ApiState isLoading error={null} />
  }

  if (error && !catalog) {
    // Real mode: never fall back to mock success data
    return <ApiState isLoading={false} error={error} onRetry={refetch} />
  }

  const data = catalog || {
    header: shell.header,
    vendorAcceptance: { ...shell.vendorAcceptance, rows: [] },
    ruleChanges: { ...shell.ruleChanges, rows: [] },
    exportFilename: shell.exportFilename,
  }

  return (
    <div className="pb-20">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[17px] font-bold text-[#111827]">{data.header.title}</h2>
          <p className="mt-1 text-[12px] text-[#6b7280]">{data.header.subtitle}</p>
        </div>
        <button
          type="button"
          onClick={handleExportCsv}
          className="inline-flex h-[34px] items-center gap-1.5 rounded-[7px] border border-[#d1d5db] bg-white px-3.5 text-[12px] font-medium text-[#374151] transition hover:border-[#1D6A33] hover:text-[#1D6A33]"
        >
          ↓ Export CSV
        </button>
      </div>

      <AutomationGapBanner tone="blue" label="Read-only · permanent">
        <p>
          Real API mode ({enabled ? 'on' : 'off'}). Vendor acceptance and rule-change rows come from{' '}
          <code>GET /admin/dispatch-automation/log</code>. Reset / Save Automation are inert on this
          route.
        </p>
      </AutomationGapBanner>

      <AutomationSectionCard title={data.vendorAcceptance.title}>
        {data.vendorAcceptance.rows.length === 0 ? (
          <div className="px-5 py-4 text-[12.5px] text-[#6b7280]">No vendor acceptance records in this period.</div>
        ) : (
          <VendorAcceptanceLogTable
            columns={data.vendorAcceptance.columns}
            rows={data.vendorAcceptance.rows}
          />
        )}
      </AutomationSectionCard>

      <AutomationSectionCard title={data.ruleChanges.title}>
        {data.ruleChanges.rows.length === 0 ? (
          <div className="px-5 py-4 text-[12.5px] text-[#6b7280]">No rule-change audit records in this period.</div>
        ) : (
          <AutomationRuleChangeLogTable
            columns={data.ruleChanges.columns}
            rows={data.ruleChanges.rows}
          />
        )}
      </AutomationSectionCard>

      <div className="sticky bottom-0 z-10 -mx-5 mt-2 flex items-center justify-end gap-2.5 border-t border-[#e5e7eb] bg-white px-5 py-3 max-[700px]:-mx-3 max-[700px]:px-3">
        <Button
          type="button"
          onClick={() => handleReadOnlyFooter('Reset')}
          className="rounded-full px-5"
        >
          Reset
        </Button>
        <Button
          type="button"
          primary
          onClick={() => handleReadOnlyFooter('Save Automation')}
          className="rounded-full px-6"
        >
          Save Automation
        </Button>
      </div>
    </div>
  )
}

export default function AdminAuditLogPage() {
  if (!isAutomationRealApi()) return <MockAuditLogPage />
  return <RealAuditLogPage />
}
