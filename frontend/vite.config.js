import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const backendPort = env.VITE_BACKEND_PORT || process.env.VITE_BACKEND_PORT || '5000'
  const target = (env.VITE_BACKEND_URL || process.env.VITE_BACKEND_URL || `http://127.0.0.1:${backendPort}`).replace(
    /\/$/,
    '',
  )

  // Skip Tailwind during Vitest: `mode === 'test'` is reliable; `process.env.VITEST`
  // is not always set and leaving Tailwind mounted can hang or slow test teardown.
  const isVitest = mode === 'test' || process.env.VITEST === 'true'

  return {
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom'],
            router: ['react-router-dom'],
            query: ['@tanstack/react-query'],
            motion: ['framer-motion'],
          },
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    plugins: [react(), ...(isVitest ? [] : [tailwindcss()])],
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target,
          changeOrigin: true,
          secure: false,
          configure(proxy) {
            let warned = false
            proxy.on('error', (err) => {
              if (err?.code === 'ECONNREFUSED' && !warned) {
                warned = true
                console.warn(
                  `\n[vite] Backend not reachable at ${target} (ECONNREFUSED). ` +
                    'The UI proxies /api to that host. Start the API first:\n' +
                    '  • From repo root: npm run dev (API + web) or npm run backend:dev (API only)\n' +
                    '  • From frontend/: npm run backend:dev (starts ../backend)\n',
                )
              }
            })
          },
        },
      },
    },
  }
})
