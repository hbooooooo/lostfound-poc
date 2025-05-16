import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    host: true,
    proxy: {
      '/api': {
        target: 'http://backend:3000',
        changeOrigin: true
      },
      '/uploads': {
        target: 'http://backend:3000',
        changeOrigin: true,
        // Don't rewrite the path!
        // rewrite: path => path.replace(/^\/uploads/, '')
      }
    }
  }
})
    