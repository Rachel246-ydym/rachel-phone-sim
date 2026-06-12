import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages 部署在 /rachel-phone-sim/ 子路径下
export default defineConfig({
  base: '/rachel-phone-sim/',
  plugins: [react()],
})
