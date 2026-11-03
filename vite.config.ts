import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
export default defineConfig({
  plugins: [react(), VitePWA({
    registerType: 'autoUpdate',
    includeAssets: ['mark.svg', 'apple-touch-icon.png'],
    manifest: { name: 'Brasswick', short_name: 'Brasswick', description: 'The local scene, your release plan and a manager in your pocket.', theme_color: '#1b1916', background_color: '#1b1916', display: 'standalone', orientation: 'portrait', start_url: '/',
      icons: [{ src: 'pwa-192.png', sizes: '192x192', type: 'image/png' }, { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' }, { src: 'pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }] },
    workbox: { globPatterns: ['**/*.{js,css,html,svg,png,woff2}'], navigateFallbackDenylist: [/^\/api\//], maximumFileSizeToCacheInBytes: 3_000_000 },
  })],
})
