import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/',
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 3000,
    strictPort: false,
    // Proxy all API calls to the Python backend — eliminates CORS issues in dev
    proxy: {
      '/predict':        { target: 'http://localhost:8000', changeOrigin: true },
      '/chat':           { target: 'http://localhost:8000', changeOrigin: true },
      '/auth':           { target: 'http://localhost:8000', changeOrigin: true },
      '/dashboard':      { target: 'http://localhost:8000', changeOrigin: true },
      '/detect-disease': { target: 'http://localhost:8000', changeOrigin: true },
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    chunkSizeWarningLimit: 1000,
  },
})
