import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    alias: {
      '@signals-form/': new URL('./packages/', import.meta.url).pathname,
    },
  },
})
