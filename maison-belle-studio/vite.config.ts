import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// base './' permite publicar a pasta dist em qualquer subcaminho (GitHub Pages, Netlify, etc.)
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
})
