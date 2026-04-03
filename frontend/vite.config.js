import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // This forces Vite to look in the right place for axios
      axios: 'axios',
    },
  },
  build: {
    // This helps Rollup (the bundler) be less strict
    commonjsOptions: {
      include: [/node_modules/],
    },
  },
})
