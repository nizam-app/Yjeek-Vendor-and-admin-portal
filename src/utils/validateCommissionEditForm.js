const GATEWAY_KEYS = [
  'fixedPct',
  'debitPct',
  'creditPct',
  'applePayPct',
  'googleWalletPct',
  'otherChargesPct',
]

function parseNum(value) {
  const trimmed = String(value ?? '').trim().replace(/%/g, '')
  if (!trimmed) return null
  const n = Number(trimmed)
  return Number.isFinite(n) ? n : NaN
}

export function validateCommissionEditForm(form) {
  const errors = {}

  if (form.model === 'Tiered') {
    const tiers = Array.isArray(form.commissionTiers) ? form.commissionTiers : []
    if (!tiers.length) {
      errors.rate = 'Add at least one commission tier for tiered pricing.'
    }
  } else {
    const n = parseNum(form.rate)
    if (n == null) {
      errors.rate =
        form.model === 'Flat per order'
          ? 'Enter the flat fee per order.'
          : 'Enter the commission rate.'
    } else if (Number.isNaN(n)) {
      errors.rate = 'Enter a valid number.'
    } else if (form.model !== 'Flat per order' && (n < 0 || n > 100)) {
      errors.rate = 'Commission rate must be between 0 and 100.'
    } else if (form.model === 'Flat per order' && n < 0) {
      errors.rate = 'Flat fee cannot be negative.'
    }
  }

  for (const key of GATEWAY_KEYS) {
    const n = parseNum(form[key])
    if (form[key] != null && String(form[key]).trim() !== '' && Number.isNaN(n)) {
      errors[key] = 'Enter a valid percentage.'
    } else if (n != null && !Number.isNaN(n) && (n < 0 || n > 100)) {
      errors[key] = 'Must be between 0 and 100.'
    }
  }

  const fixedCharge = parseNum(form.fixedCharge)
  if (form.fixedCharge != null && String(form.fixedCharge).trim() !== '' && Number.isNaN(fixedCharge)) {
    errors.fixedCharge = 'Enter a valid amount.'
  } else if (fixedCharge != null && !Number.isNaN(fixedCharge) && fixedCharge < 0) {
    errors.fixedCharge = 'Cannot be negative.'
  }

  for (const fee of form.customFees || []) {
    const n = parseNum(fee.amount)
    if (Number.isNaN(n)) {
      errors.customFees = `Custom fee "${fee.name}" needs a valid amount.`
      break
    }
  }

  return errors
}

const PATH_SUFFIX_TO_FIELD = {
  commissionrate: 'rate',
  flatfeeperorder: 'rate',
  fixedpct: 'fixedPct',
  debitpct: 'debitPct',
  creditpct: 'creditPct',
  applepaypct: 'applePayPct',
  googlewalletpct: 'googleWalletPct',
  otherchargespct: 'otherChargesPct',
  fixedcharge: 'fixedCharge',
}

export function mapCommissionApiFieldErrors(fieldErrors) {
  if (!fieldErrors || typeof fieldErrors !== 'object') return {}

  const out = {}

  const walk = (node, pathParts = []) => {
    if (Array.isArray(node)) {
      const msg = node.find((item) => typeof item === 'string' && item.trim())
      if (!msg) return
      const joined = pathParts.join('.').toLowerCase()
      const suffix = pathParts[pathParts.length - 1]?.toLowerCase() || ''
      const field = PATH_SUFFIX_TO_FIELD[suffix] || PATH_SUFFIX_TO_FIELD[joined.replace(/.*\./, '')]
      if (field) out[field] = String(msg)
      else if (pathParts[0] === 'commission' && pathParts.length === 1) {
        out._form = String(msg)
      }
      return
    }
    if (node && typeof node === 'object') {
      for (const [key, value] of Object.entries(node)) {
        walk(value, [...pathParts, key])
      }
    }
  }

  walk(fieldErrors)
  return out
}
