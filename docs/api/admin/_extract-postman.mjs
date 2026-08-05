import fs from 'fs'

const collectionPath = 'docs/postman/Yjeek Admin Panel.postman_collection.json'
const outPath = 'docs/api/admin/_postman-extracted.json'
const c = JSON.parse(fs.readFileSync(collectionPath, 'utf8'))

function sanitize(v) {
  if (v == null) return v
  if (typeof v === 'string') {
    return v
      .replace(/Bearer\s+[A-Za-z0-9._\-]+/gi, 'Bearer {{accessToken}}')
      .replace(/eyJ[A-Za-z0-9_\-]+\.[A-Za-z0-9_\-]+\.[A-Za-z0-9_\-]+/g, '{{JWT}}')
      .replace(/\+?\d{8,15}/g, '{{phone}}')
      .replace(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g, '{{email}}')
      .replace(
        /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
        '{{uuid}}',
      )
      .replace(/"password"\s*:\s*"[^"]+"/gi, '"password":"{{password}}"')
      .replace(/"otp"\s*:\s*"[^"]+"/gi, '"otp":"{{otp}}"')
      .replace(/"code"\s*:\s*"[^"]+"/gi, '"code":"{{code}}"')
      .replace(/"pin"\s*:\s*"[^"]+"/gi, '"pin":"{{pin}}"')
      .replace(/"token"\s*:\s*"[^"]+"/gi, '"token":"{{token}}"')
  }
  if (Array.isArray(v)) return v.map(sanitize)
  if (typeof v === 'object') {
    const o = {}
    for (const k of Object.keys(v)) o[k] = sanitize(v[k])
    return o
  }
  return v
}

function getAuth(req, folderAuth, collAuth) {
  const a = req.auth || folderAuth || collAuth
  if (!a) return 'Inherit / unspecified'
  if (a.type === 'noauth') return 'Public (noauth)'
  if (a.type === 'bearer') {
    const token =
      (a.bearer || []).find((b) => b.key === 'token')?.value || ''
    if (String(token).includes('tempToken')) return 'Bearer {{tempToken}}'
    if (String(token).includes('accessToken')) return 'Bearer {{accessToken}}'
    return 'Bearer token'
  }
  return a.type
}

function getUrl(req) {
  const u = req.url
  if (!u) return { path: '', query: [], pathParams: [] }
  if (typeof u === 'string') {
    const path = u.replace(/\{\{baseUrl\}\}/g, '').replace(/^https?:\/\/[^/]+/, '')
    return { path, query: [], pathParams: [] }
  }
  let path = '/' + (u.path || []).join('/')
  path = path.replace(/\{\{baseUrl\}\}/g, '')
  // Collapse accidental double slashes from empty segments
  path = path.replace(/\/+/g, '/')
  const query = (u.query || [])
    .filter((q) => !q.disabled)
    .map((q) => ({
      key: q.key,
      value: sanitize(String(q.value ?? '')),
      description: q.description || '',
    }))
  const pathParams = (u.variable || []).map((v) => ({
    key: v.key,
    value: sanitize(String(v.value ?? '')),
  }))
  return { path, query, pathParams }
}

function getBody(req) {
  if (!req.body || req.body.mode === 'none') return null
  const mode = req.body.mode
  if (mode === 'raw') {
    try {
      return sanitize(JSON.parse(req.body.raw))
    } catch {
      return sanitize(req.body.raw)
    }
  }
  if (mode === 'urlencoded') {
    return (req.body.urlencoded || [])
      .filter((f) => !f.disabled)
      .map((f) => ({ key: f.key, value: sanitize(String(f.value ?? '')) }))
  }
  if (mode === 'formdata') {
    return (req.body.formdata || [])
      .filter((f) => !f.disabled)
      .map((f) => ({
        key: f.key,
        type: f.type,
        value: f.type === 'file' ? '{{file}}' : sanitize(String(f.value ?? '')),
      }))
  }
  return sanitize(req.body)
}

function extractSaves(events) {
  const saves = []
  for (const t of (events || []).filter((e) => e.listen === 'test')) {
    const code = (t.script?.exec || []).join('\n')
    for (const m of code.matchAll(
      /pm\.collectionVariables\.set\(\s*['"]([^'"]+)['"]/g,
    )) {
      saves.push(m[1])
    }
  }
  return [...new Set(saves)]
}

function walk(items, folderPath, folderAuth, collAuth, out) {
  for (const it of items || []) {
    if (it.item) {
      walk(it.item, folderPath.concat(it.name), it.auth || folderAuth, collAuth, out)
    } else if (it.request) {
      const url = getUrl(it.request)
      const desc =
        typeof it.request.description === 'string'
          ? it.request.description
          : it.request.description?.content || it.description || ''
      out.push({
        module: folderPath[0] || '(root)',
        folder: folderPath.join(' / '),
        name: it.name,
        method: (it.request.method || 'GET').toUpperCase(),
        path: url.path,
        query: url.query,
        pathParams: url.pathParams,
        auth: getAuth(it.request, folderAuth, collAuth),
        body: getBody(it.request),
        description: String(desc).slice(0, 800),
        saves: extractSaves(it.event),
      })
    }
  }
}

const out = []
walk(c.item, [], null, c.auth, out)

const byMod = {}
for (const r of out) {
  ;(byMod[r.module] = byMod[r.module] || []).push(r)
}

const payload = {
  collectionName: c.info?.name,
  total: out.length,
  moduleCount: Object.keys(byMod).length,
  moduleCounts: Object.fromEntries(
    Object.keys(byMod).map((m) => [m, byMod[m].length]),
  ),
  variables: (c.variable || []).map((v) => ({
    key: v.key,
    placeholder: v.key === 'baseUrl' ? '{{VITE_API_BASE_URL}}' : `{{${v.key}}}`,
  })),
  modules: byMod,
}

fs.mkdirSync('docs/api/admin', { recursive: true })
fs.writeFileSync(outPath, JSON.stringify(payload, null, 2))
console.log('TOTAL', out.length)
console.log('MODULES', Object.keys(byMod).length)
for (const m of Object.keys(byMod)) console.log(`${m}: ${byMod[m].length}`)
console.log('Wrote', outPath)
