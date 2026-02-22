import { defineConfig } from 'vitest/config'
import { allAliases } from './config/aliases.mjs'

export default defineConfig({
  resolve: {
    alias: allAliases
  },
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/**/*.test.js'],
    reporters: [['tree', { summary: true }]],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/main/infra/**/*.js', 'src/main/models/**/*.js'],
      exclude: ['src/main/infra/migrations/**']
    }
  }
})
