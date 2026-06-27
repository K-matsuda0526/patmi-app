/*
 * Copyright (c) 2026 KAZUYA MATSDA. All rights reserved.
 * Created at: 2026-06-27 11:27:28+09:00
 * Unauthorized copying of this file, via any medium is strictly prohibited.
 */

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Patmi - スケジュール管理',
        short_name: 'Patmi (パトミ)',
        start_url: '/?v=2',
        description: 'チームのスケジュールや出退勤ステータスを管理するアプリです',
        theme_color: '#1a1f2e',
        background_color: '#1a1f2e',
        display: 'standalone',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192 512x512 1024x1024 any',
            type: 'image/png'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '192x192 512x512 1024x1024 any',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      devOptions: {
        enabled: true,
        type: 'module'
      }
    })
  ],
})
