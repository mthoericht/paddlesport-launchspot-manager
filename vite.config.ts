import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import basicSsl from '@vitejs/plugin-basic-ssl'

// https://vite.dev/config/
export default defineConfig({
  root: 'frontend',
  plugins: [vue(), basicSsl()],
  server: {
    host: true, // Listen on all network interfaces (0.0.0.0)
    port: 5173
  },
  build: {
    outDir: '../dist'
  }
})
