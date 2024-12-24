import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    alias: {
      '@rxform/': new URL('./packages/', import.meta.url).pathname,
    },
  },
})
