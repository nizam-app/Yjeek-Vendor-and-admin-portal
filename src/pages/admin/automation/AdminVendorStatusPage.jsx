import { useNavigate } from 'react-router-dom'
import { AutomationCallout } from '../../../components/admin/automation/AutomationCallout'
import {
  AutomationFieldRow,
  AutomationSectionCard,
} from '../../../components/admin/automation/AutomationSectionCard'
import { AutomationStatusPill } from '../../../components/admin/automation/AutomationStatusPill'
import { VendorStatusRulesTable } from '../../../components/admin/automation/VendorStatusRulesTable'
import { VENDOR_STATUS_UI } from '../../../components/admin/automation/vendorStatusUiCatalog'
import { Button } from '../../../components/admin/Button'
import { showInfo } from '../../../utils/toast'

/**
 * Automation → Vendor Status. Informational reference only.
 * Live BranchOperationalStatus + openingHours are owned by Vendor Admin / Vendor app.
 * No mock/demo data · nothing is configurable here.
 */
export default function AdminVendorStatusPage() {
  const navigate = useNavigate()
  const catalog = VENDOR_STATUS_UI

  function handleOwnedAction(action) {
    showInfo(
      `${action} is owned by Vendor Admin. Vendor Status is reference-only here — ` +
        'operational status and openingHours (open / lastOrder / close) are managed per vendor on the Vendors page, not DispatchRuleSet.',
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
          onClick={() => navigate('/admin/vendors')}
          className="inline-flex h-[34px] items-center gap-1.5 rounded-[7px] border border-[#d1d5db] bg-white px-3.5 text-[12px] font-semibold text-[#374151] transition hover:border-[#1D6A33] hover:text-[#1D6A33]"
        >
          Open Vendors
        </button>
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
        {catalog.timeFields.fields.map((field) => (
          <AutomationFieldRow key={field.id} label={field.key} help={field.description}>
            <AutomationStatusPill tone={field.badgeTone}>{field.badge}</AutomationStatusPill>
          </AutomationFieldRow>
        ))}
      </AutomationSectionCard>

      <div className="sticky bottom-0 z-10 -mx-5 mt-2 flex items-center justify-end gap-2.5 border-t border-[#e5e7eb] bg-white px-5 py-3 max-[700px]:-mx-3 max-[700px]:px-3">
        <Button
          type="button"
          disabled
          title="Vendor Status is not configurable in Automation"
          onClick={() => handleOwnedAction('Reset')}
          className="rounded-full px-5"
        >
          Reset
        </Button>
        <Button
          type="button"
          primary
          disabled
          title="Vendor Status is not configurable in Automation"
          onClick={() => handleOwnedAction('Save Automation')}
          className="rounded-full px-6"
        >
          Save Automation
        </Button>
      </div>
    </div>
  )
}
