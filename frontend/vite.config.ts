import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',  // Tüm IP'lere izin ver
    port: 5173,
    allowedHosts: [
      'zama-fheguess.coinsspor.com',
      'localhost',
      '127.0.0.1'
    ]
  },
  optimizeDeps: {
    exclude: ['@fhevm/hardhat-plugin', 'fhevmjs'], // Şimdilik bu paketleri exclude et
    include: ['ethers'] // ethers'ı açıkça include et
  },
  define: {
    global: 'globalThis', // ethers için global tanımlaması
  },
  resolve: {
    alias: {
      // Buffer polyfill for browser
      buffer: 'buffer',
      process: 'process/browser',
      util: 'util'
    }
  }
})
