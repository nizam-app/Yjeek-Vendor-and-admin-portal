import { createServer } from 'vite'

const server = await createServer({
  configFile: new URL('../vite.config.js', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1'),
  server: { middlewareMode: true },
  appType: 'custom',
  logLevel: 'error',
})

try {
  await server.ssrLoadModule('/scripts/audit-sla-roundtrip.mjs')
} finally {
  await server.close()
}
