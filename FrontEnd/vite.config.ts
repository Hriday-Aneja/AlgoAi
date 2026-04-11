import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id: string) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        return new URL(`src/assets/${filename}`, import.meta.url).pathname
      }
    },
  }
}

export default defineConfig(({ mode }: { mode: string }) => {
  // Load environment variables from .env file
  const envPath = path.resolve('.env')
  let jdoodleClientId = process.env.JDOODLE_CLIENT_ID
  let jdoodleClientSecret = process.env.JDOODLE_CLIENT_SECRET

  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8')
    const envLines = envContent.split('\n')
    for (const line of envLines) {
      const trimmed = line.trim()
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=')
        const value = valueParts.join('=').trim()
        if (key === 'JDOODLE_CLIENT_ID') jdoodleClientId = value
        if (key === 'JDOODLE_CLIENT_SECRET') jdoodleClientSecret = value
      }
    }
  }

  console.log('Environment variables loaded:')
  console.log('JDOODLE_CLIENT_ID:', jdoodleClientId ? '***' + jdoodleClientId.slice(-4) : 'undefined')
  console.log('JDOODLE_CLIENT_SECRET:', jdoodleClientSecret ? '***' + jdoodleClientSecret.slice(-4) : 'undefined')

  return {
    plugins: [
      figmaAssetResolver(),
      react(),
      tailwindcss(),
    ],
    resolve: {
      alias: {
        '@': new URL('./src', import.meta.url).pathname,
      },
    },
    assetsInclude: ['**/*.svg', '**/*.csv'],

    server: {
      port: 5173,
      proxy: {
        '/api/jdoodle': {
          target: 'https://api.jdoodle.com',
          changeOrigin: true,
          selfHandleResponse: true,
          buffer: true,

          // ✅ FIX: Strip /api/jdoodle prefix and prepend /v1
          // /api/jdoodle/execute  →  https://api.jdoodle.com/v1/execute
          rewrite: (path) => path.replace(/^\/api\/jdoodle/, '/v1'),

          configure: (proxy, options) => {
            proxy.on('proxyReq', (proxyReq, req, res) => {
              console.log('Setting up JDoodle proxy request')

              let bodyString = ''
              if (req.body) {
                bodyString = req.body.toString('utf8')
                processBody(bodyString)
              } else {
                let bodyChunks: Buffer[] = []
                req.on('data', (chunk) => {
                  bodyChunks.push(chunk)
                })
                req.on('end', () => {
                  const bodyBuffer = Buffer.concat(bodyChunks)
                  bodyString = bodyBuffer.toString('utf8')
                  processBody(bodyString)
                })
                return
              }

              function processBody(bodyString: string) {
                try {
                  const originalBody = JSON.parse(bodyString || '{}')
                  const enhancedBody = {
                    clientId: jdoodleClientId,
                    clientSecret: jdoodleClientSecret,
                    ...originalBody,
                  }

                  console.log(
                    'Enhanced request body:',
                    JSON.stringify(enhancedBody, (key, value) => {
                      if (key === 'clientSecret') return '***' + value.slice(-4)
                      return value
                    }, 2)
                  )

                  const enhancedBodyString = JSON.stringify(enhancedBody)
                  if (!proxyReq.headersSent) {
                    proxyReq.setHeader('Content-Type', 'application/json')
                    proxyReq.setHeader('Content-Length', Buffer.byteLength(enhancedBodyString))
                    proxyReq.write(enhancedBodyString)
                    proxyReq.end()
                  } else {
                    console.error('Headers already sent, cannot modify body')
                  }
                } catch (error) {
                  console.error('Error enhancing proxy request:', error)
                  if (!proxyReq.headersSent) {
                    proxyReq.end()
                  }
                }
              }
            })

            proxy.on('proxyRes', (proxyRes, req, res) => {
              console.log('JDoodle proxy response status:', proxyRes.statusCode)

              let responseData = ''
              proxyRes.on('data', (chunk) => {
                responseData += chunk
              })

              proxyRes.on('end', () => {
                res.setHeader('Content-Type', 'application/json')
                res.statusCode = proxyRes.statusCode || 200
                res.end(responseData)
              })
            })

            // ✅ Log proxy errors for easier debugging
            proxy.on('error', (err, req, res) => {
              console.error('JDoodle proxy error:', err.message)
            })
          },
        },
      },
    },
  }
})