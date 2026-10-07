import {
  VENDOR_SLA_SECTIONS,
  CHAMP_SLA_SECTIONS,
  DISPATCHER_SLA_SECTIONS,
} from '../../components/admin/management/AdminVendorSlaTemplate'
import {
  groupSlaValidationErrors,
  slaFieldErrorId,
  validateDurationTierForm,
} from './validateAdminSlaTier'
import { validateAdminSlaBeforeSave as validateMergedConfigTiers } from './validateAdminSlaConfig'

export { groupSlaValidationErrors, slaFieldErrorId, validateDurationTierForm } from './validateAdminSlaTier'

const TIER_GRID_FIELD_TYPES = new Set(['duration', 'durationTier'])

function isHigherIsBetter(formTier, field) {
  const fromForm =
    formTier?.target?.operator ?? formTier?.atRisk?.operator ?? formTier?.critical?.operator ?? formTier?.operator
  const fromDefault =
    field?.default?.target?.operator ?? field?.default?.operator ?? field?.default?.atRisk?.operator
  return (fromForm || fromDefault) === '≥'
}

function fieldToGridField(field) {
  return {
    key: field.key,
    label: field.label,
    hint: field.hint,
    default: field.default,
  }
}

function resolveTierGridFields(section) {
  const explicit = section.tierGridFields ?? []
  const usedKeys = new Set(explicit.map((field) => field.key))
  const auto = (section.fields ?? [])
    .filter(
      (field) =>
        TIER_GRID_FIELD_TYPES.has(field.type) && !usedKeys.has(field.key) && !field.skipTierGrid,
    )
    .map(fieldToGridField)
  return [...explicit, ...auto]
}

function walkSection(tab, section, sectionValues, sectionId, tierId, out) {
  const tierGridFields = resolveTierGridFields(section)
  for (const field of tierGridFields) {
    const formTier = sectionValues?.[field.key]
    if (!formTier) continue
    const higher = isHigherIsBetter(formTier, field)
    const issues = validateDurationTierForm(formTier, higher)
    for (const issue of issues) {
      out.push({
        id: slaFieldErrorId(tab, sectionId, tierId, field.key),
        tab,
        sectionId,
        tierId,
        fieldKey: field.key,
        fieldLabel: field.label,
        tierPart: issue.tierPart,
        message: issue.message,
      })
    }
  }

  if (section.tiers) {
    for (const childTier of section.tiers) {
      walkSection(
        tab,
        { fields: childTier.fields },
        sectionValues?.[childTier.id],
        sectionId,
        childTier.id,
        out,
      )
    }
  }

  if (section.allTiers?.length) {
    walkSection(tab, { fields: section.allTiers }, sectionValues?.all, sectionId, 'all', out)
  }
}

function collectTabErrors(tab, sections, values) {
  const errors = []
  for (const section of sections) {
    walkSection(tab, section, values?.[section.id], section.id, null, errors)
  }
  return errors
}

export function validateAdminSlaForm({ vendorValues, champValues, dispatcherValues }) {
  return [
    ...collectTabErrors('vendor', VENDOR_SLA_SECTIONS, vendorValues),
    ...collectTabErrors('champ', CHAMP_SLA_SECTIONS, champValues),
    ...collectTabErrors('dispatcher', DISPATCHER_SLA_SECTIONS, dispatcherValues),
  ]
}

export function validateAdminSlaFormAndConfig({
  vendorValues,
  champValues,
  dispatcherValues,
  baseConfig = {},
}) {
  const formErrors = validateAdminSlaForm({ vendorValues, champValues, dispatcherValues })
  const configErrors = validateMergedConfigTiers({
    vendorValues,
    champValues,
    dispatcherValues,
    baseConfig,
  })
  const seen = new Set()
  const merged = []
  for (const entry of [...formErrors, ...configErrors]) {
    const key = `${entry.id}::${entry.tierPart}`
    if (seen.has(key)) continue
    seen.add(key)
    merged.push(entry)
  }
  return merged
}

export { mapApiFieldErrorsToSlaValidation } from './validateAdminSlaConfig'
