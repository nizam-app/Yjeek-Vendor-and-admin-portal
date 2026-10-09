/**
 * Full SLA form ↔ API config round-trip audit (vendor, champ, dispatcher).
 * Run: npx vite-node scripts/audit-sla-roundtrip.mjs
 */
import assert from 'node:assert/strict'
import {
  buildSlaDefaults,
  VENDOR_SLA_SECTIONS,
  CHAMP_SLA_SECTIONS,
  DISPATCHER_SLA_SECTIONS,
} from '../src/components/admin/management/AdminVendorSlaTemplate.jsx'
import {
  mapSlaFormToConfig,
  mapSlaConfigToForm,
  secFromDuration,
} from '../src/mappers/admin/mapAdminSlaModels.js'
import { validateAdminSlaFormAndConfig } from '../src/mappers/admin/validateAdminSlaForm.js'

const TIER_GRID_TYPES = new Set(['duration', 'durationTier'])

function isScalarTierField(field) {
  return Boolean(field?.skipTierGrid) && field?.type === 'duration'
}

function tierSec(formTier) {
  if (!formTier || typeof formTier !== 'object') return null
  if (formTier.target || formTier.atRisk || formTier.critical) {
    return {
      t: secFromDuration(formTier.target),
      a: secFromDuration(formTier.atRisk),
      c: secFromDuration(formTier.critical),
    }
  }
  const single = secFromDuration(formTier)
  return single != null ? { single } : null
}

function mutateTier(tier, delta = 7) {
  if (!tier?.target) return tier
  const sec = (p) =>
    (Number.parseInt(p.h, 10) || 0) * 3600 +
    (Number.parseInt(p.m, 10) || 0) * 60 +
    (Number.parseInt(p.s, 10) || 0)
  const pad = (n) => String(n).padStart(2, '0')
  const add = (parts, d) => {
    const total = Math.max(0, sec(parts) + d)
    const h = Math.floor(total / 3600)
    const m = Math.floor((total % 3600) / 60)
    const s = total % 60
    return { ...parts, h: h > 99 ? String(h) : pad(h), m: pad(m), s: pad(s) }
  }
  return {
    ...tier,
    target: add(tier.target, delta),
    atRisk: add(tier.atRisk, delta + 11),
    critical: add(tier.critical, delta + 22),
  }
}

function mutateScalarDuration(parts, delta = 5) {
  if (!parts?.h) return parts
  const sec = (p) =>
    (Number.parseInt(p.h, 10) || 0) * 3600 +
    (Number.parseInt(p.m, 10) || 0) * 60 +
    (Number.parseInt(p.s, 10) || 0)
  const pad = (n) => String(n).padStart(2, '0')
  const total = Math.max(0, sec(parts) + delta)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  return { ...parts, h: pad(h), m: pad(m), s: pad(s), operator: parts.operator || '≤' }
}

function bumpPercent(value, delta = 1) {
  if (!value?.amount) return value
  const n = Math.min(100, Math.max(0, (Number.parseInt(value.amount, 10) || 0) + delta))
  return { ...value, amount: String(n) }
}

function walkAndMutate(sections, values) {
  const touched = []
  for (const section of sections) {
    const bucket = values[section.id]
    if (!bucket) continue

    if (section.tiers) {
      for (const tier of section.tiers) {
        const tv = bucket[tier.id] || {}
        for (const field of tier.fields || []) {
          if (field.type === 'durationTier' || (field.type === 'duration' && !field.skipTierGrid)) {
            if (tv[field.key]) {
              tv[field.key] = mutateTier(tv[field.key])
              touched.push(`${section.id}.${tier.id}.${field.key}`)
            }
          } else if (field.type === 'duration' && field.skipTierGrid && tv[field.key]) {
            tv[field.key] = mutateScalarDuration(tv[field.key])
            touched.push(`${section.id}.${tier.id}.${field.key}`)
          } else if (field.type === 'percent' && tv[field.key]) {
            tv[field.key] = bumpPercent(tv[field.key])
            touched.push(`${section.id}.${tier.id}.${field.key}`)
          }
        }
        bucket[tier.id] = tv
      }
      if (section.allTiers) {
        const av = bucket.all || {}
        for (const field of section.allTiers) {
          if (field.type === 'duration' && !field.skipTierGrid && av[field.key]) {
            av[field.key] = mutateTier(av[field.key])
            touched.push(`${section.id}.all.${field.key}`)
          } else if (field.type === 'percent' && av[field.key]) {
            av[field.key] = bumpPercent(av[field.key])
            touched.push(`${section.id}.all.${field.key}`)
          }
        }
        bucket.all = av
      }
    }

    for (const field of section.tierGridFields || []) {
      if (bucket[field.key]) {
        bucket[field.key] = mutateTier(bucket[field.key])
        touched.push(`${section.id}.${field.key}`)
      }
    }

    for (const field of section.fields || []) {
      if (isScalarTierField(field) || !TIER_GRID_TYPES.has(field.type)) {
        if (field.type === 'percent' && bucket[field.key]) {
          bucket[field.key] = bumpPercent(bucket[field.key])
          touched.push(`${section.id}.${field.key}`)
        } else if (field.type === 'duration' && field.skipTierGrid && bucket[field.key]) {
          bucket[field.key] = mutateScalarDuration(bucket[field.key])
          touched.push(`${section.id}.${field.key}`)
        } else if (field.type === 'number' && bucket[field.key]?.amount != null) {
          const n = (Number.parseInt(bucket[field.key].amount, 10) || 0) + 1
          bucket[field.key] = { ...bucket[field.key], amount: String(n) }
          touched.push(`${section.id}.${field.key}`)
        }
        continue
      }
      if (TIER_GRID_TYPES.has(field.type) && bucket[field.key]) {
        bucket[field.key] = mutateTier(bucket[field.key])
        touched.push(`${section.id}.${field.key}`)
      }
    }
  }
  return touched
}

function compareTierFields(sections, before, after, tab, failures) {
  for (const section of sections) {
    const bSec = before[section.id]
    const aSec = after[section.id]
    if (section.tiers) {
      for (const tier of section.tiers) {
        for (const field of tier.fields || []) {
          const key = field.key
          const bv = bSec?.[tier.id]?.[key]
          const av = aSec?.[tier.id]?.[key]
          if (field.type === 'durationTier' || (field.type === 'duration' && !field.skipTierGrid)) {
            const bs = tierSec(bv)
            const as = tierSec(av)
            if (JSON.stringify(bs) !== JSON.stringify(as)) {
              failures.push({ tab, path: `${section.id}.${tier.id}.${key}`, before: bs, after: as })
            }
          } else if (field.type === 'duration' && field.skipTierGrid) {
            if (JSON.stringify(bv) !== JSON.stringify(av)) {
              failures.push({ tab, path: `${section.id}.${tier.id}.${key}`, before: bv, after: av })
            }
          }
        }
      }
      if (section.allTiers) {
        for (const field of section.allTiers) {
          const key = field.key
          const bv = bSec?.all?.[key]
          const av = aSec?.all?.[key]
          if (field.type === 'duration' && !field.skipTierGrid) {
            const bs = tierSec(bv)
            const as = tierSec(av)
            if (JSON.stringify(bs) !== JSON.stringify(as)) {
              failures.push({ tab, path: `${section.id}.all.${key}`, before: bs, after: as })
            }
          }
        }
      }
    }
    for (const field of section.tierGridFields || []) {
      const bs = tierSec(bSec?.[field.key])
      const as = tierSec(aSec?.[field.key])
      if (bs && as && JSON.stringify(bs) !== JSON.stringify(as)) {
        failures.push({ tab, path: `${section.id}.${field.key}`, before: bs, after: as })
      }
    }
    for (const field of section.fields || []) {
      if (field.type === 'reference' || field.type === 'readonly') continue
      if (TIER_GRID_TYPES.has(field.type) && !field.skipTierGrid) {
        const bs = tierSec(bSec?.[field.key])
        const as = tierSec(aSec?.[field.key])
        if (bs && as && JSON.stringify(bs) !== JSON.stringify(as)) {
          failures.push({ tab, path: `${section.id}.${field.key}`, before: bs, after: as })
        }
      }
    }
  }
}

const vendorValues = structuredClone(buildSlaDefaults(VENDOR_SLA_SECTIONS))
const champValues = structuredClone(buildSlaDefaults(CHAMP_SLA_SECTIONS))
const dispatcherValues = structuredClone(buildSlaDefaults(DISPATCHER_SLA_SECTIONS))

const touched = [
  ...walkAndMutate(VENDOR_SLA_SECTIONS, vendorValues),
  ...walkAndMutate(CHAMP_SLA_SECTIONS, champValues),
  ...walkAndMutate(DISPATCHER_SLA_SECTIONS, dispatcherValues),
]

// VPI reliability explicit bump (must round-trip)
vendorValues['hot-food'].vpiReliability = bumpPercent(vendorValues['hot-food'].vpiReliability, 2)

const validationErrors = validateAdminSlaFormAndConfig({
  vendorValues,
  champValues,
  dispatcherValues,
  baseConfig: {},
})

const cfg = mapSlaFormToConfig(vendorValues, champValues, dispatcherValues, {})
const round = mapSlaConfigToForm(cfg)
const failures = []

compareTierFields(VENDOR_SLA_SECTIONS, vendorValues, round.vendorValues, 'vendor', failures)
compareTierFields(CHAMP_SLA_SECTIONS, champValues, round.champValues, 'champ', failures)
compareTierFields(DISPATCHER_SLA_SECTIONS, dispatcherValues, round.dispatcherValues, 'dispatcher', failures)

// API shape checks
assert.ok(cfg.vendor?.hotFoodOnDemand?.handoverToChampSec, 'handoverToChampSec missing in API patch')
assert.equal(
  cfg.vendor.hotFoodOnDemand.handoverToChampSec.target,
  secFromDuration(vendorValues['hot-food'].maxChampWait.target),
  'handover tier target mismatch',
)
assert.ok(cfg.dispatcher?.opsLifecycle?.performanceReviewCycle, 'opsLifecycle missing')
assert.ok(cfg.dispatcher?.vendorCallIntervalMode, 'vendorCallIntervalMode missing')
assert.ok(cfg.champ?.performance?.peakHoursOnTimeTargetPct != null, 'peakHoursOnTimeTargetPct missing')

const handoverRound = tierSec(round.vendorValues['hot-food'].maxChampWait)
const handoverBefore = tierSec(vendorValues['hot-food'].maxChampWait)
if (JSON.stringify(handoverRound) !== JSON.stringify(handoverBefore)) {
  failures.push({
    tab: 'vendor',
    path: 'hot-food.maxChampWait (handover)',
    before: handoverBefore,
    after: handoverRound,
  })
}

console.log('Touched form fields:', touched.length)
console.log('Validation errors:', validationErrors.length)
if (validationErrors.length) {
  console.log('Sample validation:', validationErrors.slice(0, 5))
}
console.log('Round-trip failures:', failures.length)
if (failures.length) {
  for (const f of failures.slice(0, 30)) {
    console.log(JSON.stringify(f))
  }
  process.exitCode = 1
} else {
  console.log('PASS — all tier/scalar mutations round-trip through mapSlaFormToConfig → mapSlaConfigToForm')
}
