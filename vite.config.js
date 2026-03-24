import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: "/Stochastic-Gradient-Descent/",
  plugins: [react()],
  server: {
    port: 3000,
    open: true
  }
})