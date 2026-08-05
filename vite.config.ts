/// <reference types="vitest" />

import legacy from '@vitejs/plugin-legacy'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    vue(),
    legacy({
      // Capacitor WebView is modern; PrimeVue pulls @noble/ed25519 which needs BigInt.
      renderLegacyChunks: false,
      modernPolyfills: true,
    }),
  ],
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler',
      },
    },
  },
  optimizeDeps: {
    exclude: ['@capacitor-community/sqlite'],
  },
  // .lottie (dotLottie) không nằm trong danh sách asset mặc định của Vite
  assetsInclude: ['**/*.lottie'],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
  },
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 2000,
    cssCodeSplit: true,
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Ionic + Vue cùng chunk — tránh TDZ "Cannot access before initialization"
            if (
              id.includes('@ionic') ||
              id.includes('vue') ||
              id.includes('pinia') ||
              id.includes('vue-router')
            )
              return 'vendor-vue-core'
            if (
              id.includes('primevue') ||
              id.includes('primeicons') ||
              id.includes('@primeuix') ||
              id.includes('@primeui') ||
              id.includes('@noble')
            )
              return 'vendor-primevue'
            if (id.includes('@capacitor')) return 'vendor-capacitor'
            return 'vendor-others'
          }
        },
      },
    },
  },
  server: {
    host: '0.0.0.0',
    port: 8100,
    watch: {
      ignored: ['**/android/**', '**/ios/**'],
    },
    strictPort: false,
  },
})
