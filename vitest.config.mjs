import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/**/*.test.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/main/infra/**/*.js', 'src/main/models/**/*.js'],
      exclude: ['src/main/infra/migrations/**']
    }
  }
})
