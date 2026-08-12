import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/**
 * Backend serves /uploads with Cross-Origin-Resource-Policy: same-origin,
 * so browser <img> tags on localhost cannot load http://api-host/uploads/...
 * Proxy /uploads (and /__admin_media) through the Vite origin during local
 * dev/preview, and strip CORP/COEP so the admin SPA can render thumbnails.
 */
function uploadProxyTarget(apiBaseUrl) {
  const base = String(apiBaseUrl || '')
    .trim()
    .replace(/\/+$/, '')
  if (!base) return 'http://192.168.10.251:3000'
  return base.replace(/\/api\/v\d+$/i, '') || base
}

function stripCrossOriginMediaHeaders(proxyRes) {
  delete proxyRes.headers['cross-origin-resource-policy']
  delete proxyRes.headers['cross-origin-embedder-policy']
  delete proxyRes.headers['cross-origin-opener-policy']
}

function mediaProxy(target) {
  return {
    target,
    changeOrigin: true,
    secure: false,
    configure: (proxy) => {
      proxy.on('proxyRes', stripCrossOriginMediaHeaders)
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const uploadTarget = uploadProxyTarget(env.VITE_API_BASE_URL)

  const uploadsProxy = {
    '/uploads': mediaProxy(uploadTarget),
    // Bridge for absolute API-host media URLs that are not under /uploads/
    '/__admin_media': {
      ...mediaProxy(uploadTarget),
      rewrite: (path) => path.replace(/^\/__admin_media/, '') || '/',
    },
  }

  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: uploadsProxy,
    },
    preview: {
      proxy: uploadsProxy,
    },
  }
})
