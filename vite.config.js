import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'https://vercel.com/018vishnuteja-7545s-projects/mentor-mentee-frontend/6mwWWJEAHsxpgdpPgFcdsf9uu3Ti',
        changeOrigin: true,
      }
    }
  }
})
