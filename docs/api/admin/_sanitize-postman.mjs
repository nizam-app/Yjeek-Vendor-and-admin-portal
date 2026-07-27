/**
 * Creates a sanitized Postman collection copy suitable for Git.
 * Strips credential-like variable values and request body secrets.
 * Run: node docs/api/admin/_sanitize-postman.mjs
 */
import fs from 'fs'

const src = 'docs/postman/Yjeek Admin Panel.postman_collection.json'
const c = JSON.parse(fs.readFileSync(src, 'utf8'))

const SENSITIVE_KEYS = new Set([
  'password',
  'currentPassword',
  'newPassword',
  'otp',
  'code',
  'pin',
  'token',
  'tempToken',
  'accessToken',
  'refreshToken',
  'secret',
  'authorization',
])

function scrubString(s) {
  if (typeof s !== 'string') return s
  return s
    .replace(/Bearer\s+[A-Za-z0-9._\-]+/gi, 'Bearer {{accessToken}}')
    .replace(/eyJ[A-Za-z0-9_\-]+\.[A-Za-z0-9_\-]+\.[A-Za-z0-9_\-]+/g, '{{JWT}}')
    .replace(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g, '{{email}}')
    .replace(/\+?\d{8,15}/g, '{{phone}}')
    .replace(
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
      '{{uuid}}',
    )
}

function scrub(value, key = '') {
  if (value == null) return value
  if (typeof value === 'string') {
    if (SENSITIVE_KEYS.has(key) || /password|token|secret|otp/i.test(key)) {
      return `{{${key || 'redacted'}}}`
    }
    return scrubString(value)
  }
  if (Array.isArray(value)) return value.map((v) => scrub(v))
  if (typeof value === 'object') {
    const out = {}
    for (const [k, v] of Object.entries(value)) out[k] = scrub(v, k)
    return out
  }
  return value
}

function walkItems(items) {
  for (const it of items || []) {
    if (it.item) walkItems(it.item)
    if (!it.request) continue
    const req = it.request
    if (req.header) {
      req.header = req.header.map((h) => {
        if (/authorization/i.test(h.key)) {
          return { ...h, value: 'Bearer {{accessToken}}' }
        }
        return { ...h, value: scrubString(h.value) }
      })
    }
    if (req.auth?.bearer) {
      req.auth.bearer = req.auth.bearer.map((b) => ({
        ...b,
        value: String(b.value || '').includes('tempToken')
          ? '{{tempToken}}'
          : '{{accessToken}}',
      }))
    }
    if (req.body?.mode === 'raw' && req.body.raw) {
      try {
        req.body.raw = JSON.stringify(scrub(JSON.parse(req.body.raw)), null, 2)
      } catch {
        req.body.raw = scrubString(req.body.raw)
      }
    }
    if (req.url && typeof req.url === 'object') {
      if (req.url.raw) req.url.raw = scrubString(req.url.raw).replace(/https?:\/\/[^/]+/i, '{{baseUrl}}')
      if (Array.isArray(req.url.host)) req.url.host = ['{{baseUrl}}']
      if (req.url.query) {
        req.url.query = req.url.query.map((q) => ({ ...q, value: scrub(q.value, q.key) }))
      }
      if (req.url.variable) {
        req.url.variable = req.url.variable.map((v) => ({
          ...v,
          value: `{{${v.key}}}`,
        }))
      }
    }
    if (typeof req.description === 'string') req.description = scrubString(req.description)
  }
}

if (Array.isArray(c.variable)) {
  c.variable = c.variable.map((v) => {
    if (v.key === 'baseUrl') {
      return { ...v, value: '{{VITE_API_BASE_URL}}' }
    }
    return { ...v, value: `{{${v.key}}}` }
  })
}

walkItems(c.item)

const out = 'docs/postman/Yjeek Admin Panel.postman_collection.sanitized.json'
fs.writeFileSync(out, JSON.stringify(c, null, 2))
console.log('Wrote', out)

// Also overwrite the working copy used by docs path with sanitized content
fs.writeFileSync(src, JSON.stringify(c, null, 2))
console.log('Overwrote', src, 'with sanitized values')
