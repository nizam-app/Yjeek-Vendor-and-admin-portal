import { useNavigate } from 'react-router-dom'
import {
  AutomationClockTimeField,
  AutomationDurationField,
  AutomationOperatorNumberField,
} from '../../../components/admin/automation/AutomationFields'
import {
  AutomationFieldRow,
  AutomationSectionCard,
} from '../../../components/admin/automation/AutomationSectionCard'
import { AutomationStatusPill } from '../../../components/admin/automation/AutomationStatusPill'
import { ApiErrorBanner, ApiState } from '../../../components/admin/ApiState'
import { Button } from '../../../components/admin/Button'
import { useScheduledTiersEffective } from '../../../hooks/admin/useScheduledTiersEffective'
import { isAutomationRealApi } from '../../../services/admin/dispatchAutomationFeature'
import { showInfo } from '../../../utils/toast'

function asDuration(value) {
  if (!value || typeof value !== 'object') {
    return { operator: '≤', h: '00', m: '00', s: '00' }
  }
  return {
    operator: value.operator || '≤',
    h: String(value.h ?? '00').padStart(2, '0'),
    m: String(value.m ?? '00').padStart(2, '0'),
    s: String(value.s ?? '00').padStart(2, '0'),
  }
}

function asClock(value) {
  if (!value || typeof value !== 'object') {
    return { h: '00', m: '00' }
  }
  return {
    h: String(value.h ?? '00').padStart(2, '0'),
    m: String(value.m ?? '00').padStart(2, '0'),
  }
}

function PaymentWindowDisplay({ tier }) {
  if (!tier?.paymentWindowApplicable) {
    return <AutomationStatusPill tone="off">Not applicable</AutomationStatusPill>
  }
  const sec = Number(tier.paymentWindowSec)
  const label = Number.isFinite(sec)
    ? `Active · ${Math.max(0, Math.round(sec / 60))} min (SLA)`
    : tier.paymentWindowLabel || 'Active (SLA)'
  return <AutomationStatusPill tone="on">{label}</AutomationStatusPill>
}

function TierCard({ title, tier, deliveryUpperBound, showDoubleConfirm = true }) {
  if (!tier) return null

  const cutoff = tier.cutoffTime
    ? {
        operator: '≤',
        h: tier.cutoffTime.h,
        m: tier.cutoffTime.m,
        s: tier.cutoffTime.s || '00',
      }
    : null

  return (
    <AutomationSectionCard title={title}>
      <AutomationFieldRow label="Order cutoff">
        {tier.rollingCutoff ? (
          <AutomationStatusPill tone="on">Rolling — no cutoff</AutomationStatusPill>
        ) : cutoff ? (
          <AutomationDurationField
            value={asDuration(cutoff)}
            disabled
            operatorLocked
            operators={['≤']}
            hourMax={23}
            hint={tier.cutoffHint || undefined}
            onChange={() => undefined}
          />
        ) : (
          <span className="text-[12.5px] text-[#6b7280]">Unavailable</span>
        )}
      </AutomationFieldRow>

      {tier.batchTime ? (
        <AutomationFieldRow label={tier.batchLabel || 'Engine batch fires at'}>
          <AutomationClockTimeField
            value={asClock(tier.batchTime)}
            disabled
            onChange={() => undefined}
          />
        </AutomationFieldRow>
      ) : null}

      <AutomationFieldRow label="Assignment KPI">
        {tier.assignmentKpi ? (
          <AutomationDurationField
            value={asDuration(tier.assignmentKpi)}
            disabled
            operatorLocked
            operators={['≤']}
            hourMax={99}
            hint={tier.assignmentHint || undefined}
            onChange={() => undefined}
          />
        ) : (
          <span className="text-[12.5px] text-[#6b7280]">Unavailable</span>
        )}
      </AutomationFieldRow>

      {(tier.deliveryWindowLabel || deliveryUpperBound) && (
        <AutomationFieldRow label="Delivery window">
          {tier.deliveryWindowLabel ? (
            <AutomationStatusPill tone="on">{tier.deliveryWindowLabel}</AutomationStatusPill>
          ) : (
            <AutomationClockTimeField
              value={asClock(deliveryUpperBound)}
              disabled
              onChange={() => undefined}
            />
          )}
        </AutomationFieldRow>
      )}

      <AutomationFieldRow label="5-minute payment window after vendor accept">
        <PaymentWindowDisplay tier={tier} />
      </AutomationFieldRow>

      {showDoubleConfirm ? (
        <AutomationFieldRow label="Double-confirm required when slot">
          <AutomationOperatorNumberField
            value={{ operator: '≥', amount: String(tier.doubleConfirmHours ?? 3) }}
            unit={tier.doubleConfirmUnit || 'hrs'}
            disabled
            operatorLocked
            operators={['≥']}
            onChange={() => undefined}
          />
        </AutomationFieldRow>
      ) : null}
    </AutomationSectionCard>
  )
}

function ScheduledTiersContent({ effective, error, onRetry }) {
  const navigate = useNavigate()
  const tiers = effective?.tiers

  function handleOwnedAction(action) {
    showInfo(
      `${action} is owned by SLA Models and scheduled-dispatch policy. ` +
        'Automation displays effective values only — edit payment windows and cutoffs in SLA Models.',
    )
  }

  return (
    <div className="pb-20">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[17px] font-bold text-[#111827]">Scheduled Tier Configuration</h2>
          <p className="mt-1 text-[12px] text-[#6b7280]">
            SLA-owned · Policy clocks from scheduled dispatch · Read-only here
            {effective?.modelVersion != null
              ? ` · Model v${effective.modelVersion}`
              : ''}
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/admin/sla-models')}
          className="inline-flex h-[34px] items-center gap-1.5 rounded-[7px] border border-[#d1d5db] bg-white px-3.5 text-[12px] font-semibold text-[#374151] transition hover:border-[#1D6A33] hover:text-[#1D6A33]"
        >
          Open SLA Models
        </button>
      </div>

      {error ? (
        <ApiErrorBanner error={error} onRetry={onRetry} className="mb-4" />
      ) : null}

      <TierCard
        title={`⚡ ${tiers?.sameDay?.label || 'Same Day'}`}
        tier={tiers?.sameDay}
        deliveryUpperBound={effective?.deliveryWindowUpperBound}
      />
      <TierCard
        title={`📅 ${tiers?.nextDay?.label || 'Next Day'}`}
        tier={tiers?.nextDay}
        deliveryUpperBound={effective?.deliveryWindowUpperBound}
      />
      <TierCard
        title={`📦 ${tiers?.standard?.label || 'Standard'}`}
        tier={tiers?.standard}
        deliveryUpperBound={effective?.deliveryWindowUpperBound}
        showDoubleConfirm={false}
      />
      <TierCard
        title={`🗓️ ${tiers?.economy?.label || 'Economy'}`}
        tier={tiers?.economy}
        deliveryUpperBound={effective?.deliveryWindowUpperBound}
        showDoubleConfirm={false}
      />

      <div className="sticky bottom-0 z-10 -mx-5 mt-2 flex items-center justify-end gap-2.5 border-t border-[#e5e7eb] bg-white px-5 py-3 max-[700px]:-mx-3 max-[700px]:px-3">
        <Button type="button" onClick={() => onRetry?.()} className="rounded-full px-5">
          Refresh
        </Button>
        <Button
          type="button"
          primary
          onClick={() => handleOwnedAction('Save Automation')}
          className="rounded-full px-6"
        >
          Save Automation
        </Button>
      </div>
    </div>
  )
}

/**
 * Automation → Scheduled Tiers. Values come from published SLA + dispatch policy.
 * No mock/demo data.
 */
export default function AdminScheduledTiersPage() {
  if (!isAutomationRealApi()) {
    return (
      <div className="rounded-[10px] border border-[#fde68a] bg-[#fffbeb] px-4 py-3 text-[13px] text-[#92400e]">
        Enable the <code className="font-semibold">automation</code> feature flag
        (<code>VITE_ADMIN_REAL_API_FEATURES</code>) to load Scheduled Tiers from the live SLA
        engine. Mock data is not used.
      </div>
    )
  }

  return <RealScheduledTiersPage />
}

function RealScheduledTiersPage() {
  const resource = useScheduledTiersEffective()

  if (resource.isLoading && !resource.effective) {
    return <ApiState isLoading error={null} />
  }

  if (resource.error && !resource.effective) {
    return (
      <ApiState isLoading={false} error={resource.error} onRetry={() => resource.refetch()} />
    )
  }

  if (!resource.effective) {
    return (
      <div className="rounded-[10px] border border-[#e5e7eb] bg-white px-4 py-6 text-[13px] text-[#6b7280]">
        Publish an active default SLA model to populate Scheduled Tiers.
      </div>
    )
  }

  return (
    <ScheduledTiersContent
      effective={resource.effective}
      error={resource.error}
      onRetry={() => resource.refetch()}
    />
  )
}
