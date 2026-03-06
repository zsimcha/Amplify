import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    historyApiFallback: true,
  },
  build: {
    // Suppress the warning limit
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Split out large dependencies into their own optimized chunks
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('lucide-react')) {
              return 'vendor_icons';
            }
            if (id.includes('@supabase')) {
              return 'vendor_supabase';
            }
            return 'vendor'; // all other node_modules
          }
        }
      }
    }
  }
})