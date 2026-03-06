import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // This tells Vite to always return index.html for unknown URLs,
    // allowing react-router to handle the page changes
    historyApiFallback: true, 
  }
})