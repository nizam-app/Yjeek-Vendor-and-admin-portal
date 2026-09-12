import { useMemo } from 'react'
import { AutomationCallout } from '../../../components/admin/automation/AutomationCallout'
import {
  AutomationFieldRow,
  AutomationSectionCard,
} from '../../../components/admin/automation/AutomationSectionCard'
import { AutomationStatusPill } from '../../../components/admin/automation/AutomationStatusPill'
import { VendorStatusRulesTable } from '../../../components/admin/automation/VendorStatusRulesTable'
import { Button } from '../../../components/admin/Button'
import { getVendorStatusMock } from '../../../mocks/adminAutomationVendorStatus.mock'
import { showInfo } from '../../../utils/toast'

export default function AdminVendorStatusPage() {
  const catalog = useMemo(() => getVendorStatusMock(), [])

  function handleReadOnlyAction(action) {
    showInfo(
      `Vendor Status is read-only reference UI. ${action} does not change configuration or call the backend.`,
    )
  }

  return (
    <div className="pb-20">
      <div className="mb-5">
        <h2 className="text-[17px] font-bold text-[#111827]">{catalog.header.title}</h2>
        <p className="mt-1 text-[12px] text-[#6b7280]">{catalog.header.subtitle}</p>
      </div>

      <AutomationCallout tone="green" label={catalog.searchBanner.label} className="!mx-0 mb-5">
        <p>{catalog.searchBanner.body}</p>
      </AutomationCallout>

      <AutomationSectionCard title={catalog.statusTable.title}>
        <VendorStatusRulesTable
          columns={catalog.statusTable.columns}
          statuses={catalog.statusTable.statuses}
        />
      </AutomationSectionCard>

      <AutomationSectionCard
        title={catalog.timeFields.title}
        subtitle={catalog.timeFields.subtitle}
      >
        <AutomationCallout
          tone="red"
          label={catalog.timeFields.criticalNotice.label}
        >
          <p>{catalog.timeFields.criticalNotice.body}</p>
        </AutomationCallout>

        {catalog.timeFields.fields.map((field) => (
          <AutomationFieldRow key={field.id} label={field.key} help={field.description}>
            <AutomationStatusPill tone={field.badgeTone}>{field.badge}</AutomationStatusPill>
          </AutomationFieldRow>
        ))}
      </AutomationSectionCard>

      <div className="sticky bottom-0 z-10 -mx-5 mt-2 flex items-center justify-end gap-2.5 border-t border-[#e5e7eb] bg-white px-5 py-3 max-[700px]:-mx-3 max-[700px]:px-3">
        <Button type="button" onClick={() => handleReadOnlyAction('Reset')} className="rounded-full px-5">
          Reset
        </Button>
        <Button
          type="button"
          primary
          onClick={() => handleReadOnlyAction('Save Automation')}
          className="rounded-full px-6"
        >
          Save Automation
        </Button>
      </div>
    </div>
  )
}
