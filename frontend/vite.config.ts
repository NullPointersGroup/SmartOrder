/// <reference types="vitest/config" />
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const env = loadEnv('development', process.cwd(), '')
const backendUrl = env.VITE_API_BASE_URL
console.log(backendUrl)

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/auth': backendUrl,
      '/chat': backendUrl,
      '/conversations': backendUrl,
      '/cart': backendUrl,
      '/storico': backendUrl,
      '/recording': backendUrl,
    }
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./tests/setup.ts",
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      reportsDirectory: './coverage',
    }
  }
})