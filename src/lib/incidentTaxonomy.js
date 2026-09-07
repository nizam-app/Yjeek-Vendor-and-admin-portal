/**
 * Closed incident category + resolutionActionCode vocabularies.
 * Mirrors backend ops-incidents taxonomy — agents select codes, never free text.
 * Add entries as new types appear; never redefine an existing code's meaning.
 */

export const INCIDENT_CATEGORY_TAXONOMY = [
  {
    category: 'ACCEPTANCE_LATE',
    incidentClass: 'SLA_TIMING',
    label: 'Acceptance late',
    keywords: ['late accept', 'vendor slow accept', 'acceptance timeout', "didn't accept"],
    agentRaisable: true,
  },
  {
    category: 'PREP_LATE',
    incidentClass: 'SLA_TIMING',
    label: 'Prep late',
    keywords: ['late prep', 'kitchen delay', 'food not ready', 'prep overrun'],
    agentRaisable: true,
  },
  {
    category: 'DELIVERY_LATE',
    incidentClass: 'SLA_TIMING',
    label: 'Delivery late',
    keywords: ['late delivery', 'delayed order', 'eta miss', 'arrived late'],
    agentRaisable: true,
  },
  {
    category: 'DISPATCH_LATENCY',
    incidentClass: 'SLA_TIMING',
    label: 'Dispatch latency',
    keywords: ['slow dispatch', 'assignment delay', 'champ assign late', 'dispatch lag'],
    agentRaisable: true,
  },
  {
    category: 'ITEM_MISSING',
    incidentClass: 'FULFILMENT_ACCURACY',
    label: 'Item missing',
    keywords: ['missing item', 'incomplete order', 'item not received', 'short order'],
    agentRaisable: true,
  },
  {
    category: 'WRONG_ITEM',
    incidentClass: 'FULFILMENT_ACCURACY',
    label: 'Wrong item',
    keywords: ['wrong item', 'incorrect order', 'swapped item', 'not what i ordered'],
    agentRaisable: true,
  },
  {
    category: 'ITEM_DAMAGED',
    incidentClass: 'FULFILMENT_ACCURACY',
    label: 'Item damaged',
    keywords: ['damaged', 'crushed', 'broken item', 'spoiled packaging'],
    agentRaisable: true,
  },
  {
    category: 'ORDER_SPILLED',
    incidentClass: 'FULFILMENT_ACCURACY',
    label: 'Order spilled',
    keywords: ['spilled', 'leaked', 'sauce spilled', 'bag leaked'],
    agentRaisable: true,
  },
  {
    category: 'PACKAGING_TAMPERED',
    incidentClass: 'FULFILMENT_ACCURACY',
    label: 'Packaging tampered',
    keywords: ['opened bag', 'seal broken', 'tampered', 'resealed'],
    agentRaisable: true,
  },
  {
    category: 'FOOD_POISONING_REPORT',
    incidentClass: 'HEALTH_SAFETY',
    label: 'Food poisoning',
    keywords: ['food poisoning', 'sick after eating', 'foodborne', 'stomach illness'],
    agentRaisable: true,
  },
  {
    category: 'FOREIGN_OBJECT',
    incidentClass: 'HEALTH_SAFETY',
    label: 'Foreign object',
    keywords: ['hair in food', 'plastic in food', 'foreign object', 'insect'],
    agentRaisable: true,
  },
  {
    category: 'ALLERGEN_ERROR',
    incidentClass: 'HEALTH_SAFETY',
    label: 'Allergen error',
    keywords: ['allergen', 'allergic reaction', 'wrong allergy note', 'nuts gluten miss'],
    agentRaisable: true,
  },
  {
    category: 'EXPIRED_PRODUCT',
    incidentClass: 'HEALTH_SAFETY',
    label: 'Expired product',
    keywords: ['expired', 'past date', 'out of date', 'rotten'],
    agentRaisable: true,
  },
  {
    category: 'CHAMP_CONDUCT',
    incidentClass: 'CONDUCT',
    label: 'Champ conduct',
    keywords: ['rude champ', 'driver behavior', 'unprofessional rider'],
    agentRaisable: true,
  },
  {
    category: 'CUSTOMER_ABUSE_OF_CHAMP',
    incidentClass: 'CONDUCT',
    label: 'Customer abuse of champ',
    keywords: ['customer abuse', 'threatened rider', 'harassed champ'],
    agentRaisable: true,
  },
  {
    category: 'VENDOR_STAFF_CONDUCT',
    incidentClass: 'CONDUCT',
    label: 'Vendor staff conduct',
    keywords: ['rude staff', 'vendor behavior', 'shop mistreatment'],
    agentRaisable: true,
  },
  {
    category: 'CUSTOMER_REFUND_ABUSE',
    incidentClass: 'FRAUD_ABUSE',
    label: 'Customer refund abuse',
    keywords: ['refund abuse', 'serial refund', 'fake claim'],
    agentRaisable: true,
  },
  {
    category: 'GPS_SPOOFING',
    incidentClass: 'FRAUD_ABUSE',
    label: 'GPS spoofing',
    keywords: ['gps spoof', 'fake location', 'location fraud'],
    agentRaisable: true,
  },
  {
    category: 'FAKE_ORDER',
    incidentClass: 'FRAUD_ABUSE',
    label: 'Fake order',
    keywords: ['fake order', 'phantom order', 'fraudulent order'],
    agentRaisable: true,
  },
  {
    category: 'PROMO_ABUSE',
    incidentClass: 'FRAUD_ABUSE',
    label: 'Promo abuse',
    keywords: ['promo abuse', 'coupon abuse', 'code farming'],
    agentRaisable: true,
  },
  {
    category: 'VENDOR_GHOST',
    incidentClass: 'AVAILABILITY_NOSHOW',
    label: 'Vendor ghost',
    keywords: ['vendor no reply', 'ghosted', 'not responding'],
    agentRaisable: true,
  },
  {
    category: 'VENDOR_CLOSED_UNEXPECTEDLY',
    incidentClass: 'AVAILABILITY_NOSHOW',
    label: 'Vendor closed unexpectedly',
    keywords: ['closed early', 'shop closed', 'unexpectedly closed'],
    agentRaisable: true,
  },
  {
    category: 'CHAMP_NO_SHOW',
    incidentClass: 'AVAILABILITY_NOSHOW',
    label: 'Champ no-show',
    keywords: ['champ no-show', 'rider did not arrive', 'no pickup'],
    agentRaisable: true,
  },
  {
    category: 'REPEATED_JUSTIFIED_DECLINES',
    incidentClass: 'AVAILABILITY_NOSHOW',
    label: 'Repeated justified declines',
    keywords: ['decline pattern', 'repeated declines', 'justified decline threshold'],
    agentRaisable: false,
  },
  {
    category: 'DOUBLE_CHARGE',
    incidentClass: 'PAYMENT_WALLET',
    label: 'Double charge',
    keywords: ['charged twice', 'double payment', 'duplicate charge'],
    agentRaisable: true,
  },
  {
    category: 'WALLET_DISCREPANCY',
    incidentClass: 'PAYMENT_WALLET',
    label: 'Wallet discrepancy',
    keywords: ['wallet wrong balance', 'missing wallet credit', 'wallet mismatch'],
    agentRaisable: true,
  },
  {
    category: 'CASHBACK_NOT_CREDITED',
    incidentClass: 'PAYMENT_WALLET',
    label: 'Cashback not credited',
    keywords: ['cashback missing', 'cashback not received', 'rebate not credited'],
    agentRaisable: true,
  },
  {
    category: 'APP_TECHNICAL',
    incidentClass: 'PLATFORM_TECHNICAL',
    label: 'App technical',
    keywords: ['app bug', 'crash', 'technical error', 'checkout failed'],
    agentRaisable: true,
  },
  {
    category: 'DISPATCH_NO_CHAMP_AVAILABLE',
    incidentClass: 'PLATFORM_TECHNICAL',
    label: 'No champ available',
    keywords: ['no champ', 'no rider available', 'dispatch empty'],
    agentRaisable: true,
  },
  {
    category: 'CHAMP_ROAD_ACCIDENT',
    incidentClass: 'SAFETY_PROPERTY',
    label: 'Champ road accident',
    keywords: ['accident', 'crash', 'road collision', 'rider injured'],
    agentRaisable: true,
  },
  {
    category: 'PROPERTY_DAMAGE',
    incidentClass: 'SAFETY_PROPERTY',
    label: 'Property damage',
    keywords: ['property damage', 'vehicle damage', 'broken door', 'broken gate'],
    agentRaisable: true,
  },
  {
    category: 'OTHER',
    incidentClass: 'PLATFORM_TECHNICAL',
    label: 'Other',
    keywords: ['other', 'unclassified', 'general complaint'],
    agentRaisable: true,
  },
]

export const RESOLUTION_ACTION_TAXONOMY = [
  {
    code: 'REDELIVERED_SAME_ORDER',
    label: 'Redelivered (same order)',
    keywords: ['redeliver', 'redelivery', 'sent again'],
    noActionAllowed: false,
  },
  {
    code: 'REFUND_FULL',
    label: 'Full refund',
    keywords: ['full refund', 'refund all', '100% refund'],
    noActionAllowed: false,
  },
  {
    code: 'REFUND_PARTIAL',
    label: 'Partial refund',
    keywords: ['partial refund', 'part refund', 'item refund'],
    noActionAllowed: false,
  },
  {
    code: 'WALLET_CREDIT_GOODWILL',
    label: 'Wallet credit (goodwill)',
    keywords: ['goodwill', 'goodwill credit', 'courtesy credit'],
    noActionAllowed: false,
  },
  {
    code: 'WALLET_CREDIT_SLA_BREACH',
    label: 'Wallet credit (SLA breach)',
    keywords: ['sla credit', 'breach credit', 'sla wallet'],
    noActionAllowed: false,
  },
  {
    code: 'VOUCHER_ISSUED',
    label: 'Voucher issued',
    keywords: ['voucher', 'promo voucher', 'coupon issued'],
    noActionAllowed: false,
  },
  {
    code: 'ITEM_REPLACED_BY_VENDOR',
    label: 'Item replaced by vendor',
    keywords: ['replaced', 'replacement', 'vendor replace'],
    noActionAllowed: false,
  },
  {
    code: 'ORDER_CANCELLED_NO_CHARGE',
    label: 'Order cancelled (no charge)',
    keywords: ['cancelled', 'cancel no charge', 'void order'],
    noActionAllowed: false,
  },
  {
    code: 'REASSIGNED_TO_NEW_CHAMP',
    label: 'Reassigned to new champ',
    keywords: ['reassign champ', 'new rider', 'reassigned'],
    noActionAllowed: false,
  },
  {
    code: 'DISPATCH_MANUAL_OVERRIDE',
    label: 'Dispatch manual override',
    keywords: ['redispatch', 'manual dispatch', 'override dispatch'],
    noActionAllowed: false,
  },
  {
    code: 'VENDOR_WARNED',
    label: 'Vendor warned',
    keywords: ['vendor warned', 'flag vendor', 'vendor warning'],
    noActionAllowed: false,
  },
  {
    code: 'VENDOR_SUSPENDED_TEMP',
    label: 'Vendor suspended (temporary)',
    keywords: ['vendor suspended', 'temp suspension vendor'],
    noActionAllowed: false,
  },
  {
    code: 'ITEM_SUSPENDED_PENDING_REVIEW',
    label: 'Item suspended (pending review)',
    keywords: ['item suspended', 'menu item hold', 'item review'],
    noActionAllowed: false,
  },
  {
    code: 'PENALTY_APPLIED_VPI',
    label: 'VPI penalty applied',
    keywords: ['vpi', 'vendor penalty', 'vpi penalty'],
    noActionAllowed: false,
  },
  {
    code: 'PENALTY_APPLIED_CPI',
    label: 'CPI penalty applied',
    keywords: ['cpi', 'champ penalty', 'cpi penalty'],
    noActionAllowed: false,
  },
  {
    code: 'CHAMP_WARNED',
    label: 'Champ warned',
    keywords: ['champ warned', 'rider warning', 'driver warned'],
    noActionAllowed: false,
  },
  {
    code: 'CHAMP_SUSPENDED_TEMP',
    label: 'Champ suspended (temporary)',
    keywords: ['champ suspended', 'rider suspended', 'temp suspension champ'],
    noActionAllowed: false,
  },
  {
    code: 'ESCALATED_TO_AGENCY',
    label: 'Escalated to agency',
    keywords: ['agency escalate', 'escalated agency'],
    noActionAllowed: false,
  },
  {
    code: 'ESCALATED_TO_INVESTIGATION',
    label: 'Escalated to investigation',
    keywords: ['investigation', 'escalate investigation'],
    noActionAllowed: false,
  },
  {
    code: 'CUSTOMER_EDUCATED_NO_ACTION',
    label: 'Customer educated (no action)',
    keywords: ['customer educated', 'explained', 'no remedy needed'],
    noActionAllowed: true,
  },
  {
    code: 'NO_ACTION_UNFOUNDED',
    label: 'No action — unfounded',
    keywords: ['unfounded', 'no action', 'claim rejected'],
    noActionAllowed: true,
  },
  {
    code: 'PENDING_EXTERNAL',
    label: 'Pending external',
    keywords: ['pending external', 'awaiting external', 'third party'],
    noActionAllowed: true,
  },
]

const CATEGORY_BY_CODE = new Map(INCIDENT_CATEGORY_TAXONOMY.map((row) => [row.category, row]))
const RESOLUTION_BY_CODE = new Map(RESOLUTION_ACTION_TAXONOMY.map((row) => [row.code, row]))

/** @deprecated Prefer RESOLUTION_ACTION_TAXONOMY — kept for existing imports. */
export const RESOLUTION_ACTION_LABELS = Object.fromEntries(
  RESOLUTION_ACTION_TAXONOMY.map((row) => [row.code, row.label]),
)

export const INCIDENT_CATEGORY_LABELS = Object.fromEntries(
  INCIDENT_CATEGORY_TAXONOMY.map((row) => [row.category, row.label]),
)

export function incidentCategoryLabel(category) {
  if (!category) return null
  return CATEGORY_BY_CODE.get(String(category))?.label || null
}

export function resolutionActionLabel(code) {
  if (!code) return null
  return RESOLUTION_BY_CODE.get(String(code))?.label || null
}

export function listAgentRaisableCategories() {
  return INCIDENT_CATEGORY_TAXONOMY.filter((row) => row.agentRaisable)
}

export function listCanonicalResolutionCodes() {
  return RESOLUTION_ACTION_TAXONOMY.map((row) => row.code)
}

/** Sketch UI aliases accepted by Mark Resolved (normalized server-side). */
export const RESOLUTION_CODE_UI_ALIASES = {
  REFUND_PARTIAL_SLA_BREACH: 'REFUND_PARTIAL',
  REDELIVERY_ISSUED: 'REDELIVERED_SAME_ORDER',
  GOODWILL_NO_FAULT: 'WALLET_CREDIT_GOODWILL',
}

export function isCanonicalResolutionCode(code) {
  const value = String(code || '')
  if (RESOLUTION_BY_CODE.has(value)) return true
  return Boolean(RESOLUTION_CODE_UI_ALIASES[value])
}

export function resolveCanonicalResolutionCode(code) {
  const value = String(code || '')
  if (RESOLUTION_BY_CODE.has(value)) return value
  return RESOLUTION_CODE_UI_ALIASES[value] || null
}
