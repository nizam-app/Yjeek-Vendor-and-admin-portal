/**
 * Generate a strong password (12–16 chars): upper, lower, digit, symbol.
 * Matches invite password rule expectations used elsewhere in admin.
 */
export function generateStrongPassword(length = 14) {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const lower = 'abcdefghijkmnopqrstuvwxyz'
  const digits = '23456789'
  const symbols = '!@#$%&*-_=+'
  const all = upper + lower + digits + symbols

  const required = [
    upper[secureIndex(upper.length)],
    lower[secureIndex(lower.length)],
    digits[secureIndex(digits.length)],
    symbols[secureIndex(symbols.length)],
  ]

  const size = Math.min(Math.max(Number(length) || 14, 12), 24)
  const chars = [...required]
  while (chars.length < size) {
    chars.push(all[secureIndex(all.length)])
  }

  // Fisher–Yates shuffle
  for (let i = chars.length - 1; i > 0; i -= 1) {
    const j = secureIndex(i + 1)
    ;[chars[i], chars[j]] = [chars[j], chars[i]]
  }

  return chars.join('')
}

function secureIndex(max) {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const buf = new Uint32Array(1)
    crypto.getRandomValues(buf)
    return buf[0] % max
  }
  return Math.floor(Math.random() * max)
}

export async function copyTextToClipboard(text) {
  const value = String(text || '')
  if (!value) return false
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(value)
      return true
    }
  } catch {
    /* fall through */
  }
  try {
    const el = document.createElement('textarea')
    el.value = value
    el.setAttribute('readonly', '')
    el.style.position = 'fixed'
    el.style.left = '-9999px'
    document.body.appendChild(el)
    el.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(el)
    return ok
  } catch {
    return false
  }
}
