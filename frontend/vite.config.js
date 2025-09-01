import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    https: false, // Vue dev server speaks plain HTTP
    proxy: {
      '/api': {
        target: 'http://backend:3000',
        changeOrigin: true
      },
      '/uploads': {
        target: 'http://backend:3000',
        changeOrigin: true
      },
      '/samples': {
        target: 'http://backend:3000',
        changeOrigin: true
      }
    },
    allowedHosts: ['lost.bouard.com']
  }
})
    
