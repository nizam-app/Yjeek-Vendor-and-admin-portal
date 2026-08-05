import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/**
 * Backend serves /uploads with Cross-Origin-Resource-Policy: same-origin,
 * so browser <img> tags on localhost cannot load http://api-host/uploads/...
 * Proxy /uploads through the Vite origin during local dev/preview.
 */
function uploadProxyTarget(apiBaseUrl) {
  const base = String(apiBaseUrl || '')
    .trim()
    .replace(/\/+$/, '')
  if (!base) return 'http://192.168.10.251:3000'
  return base.replace(/\/api\/v\d+$/i, '') || base
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const uploadTarget = uploadProxyTarget(env.VITE_API_BASE_URL)

  const uploadsProxy = {
    '/uploads': {
      target: uploadTarget,
      changeOrigin: true,
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
