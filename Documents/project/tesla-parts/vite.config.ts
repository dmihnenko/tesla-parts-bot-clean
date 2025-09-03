import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          firebase: ['firebase/app', 'firebase/firestore', 'firebase/auth'],
          ui: ['bootstrap', 'react-icons', '@fortawesome/react-fontawesome']
        }
      }
    },
    chunkSizeWarningLimit: 1000,
    minify: 'terser'
  },
  server: {
    host: true,
    port: 3000
  }
})
