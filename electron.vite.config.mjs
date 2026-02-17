import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import { copyFileSync, mkdirSync, readdirSync } from 'fs'
import path from 'path'

import react from '@vitejs/plugin-react'

export default defineConfig({
  main: {
    build: {
      rollupOptions: {
        plugins: [
          {
            name: 'copy-migrations',
            writeBundle() {
              const src = path.resolve(__dirname, 'src/main/infra/migrations')
              const dest = path.resolve(__dirname, 'out/main/migrations')
              mkdirSync(dest, { recursive: true })
              readdirSync(src).forEach((file) => {
                copyFileSync(path.join(src, file), path.join(dest, file))
              })
            }
          }
        ]
      }
    }
  },
  preload: {
    plugins: [
      externalizeDepsPlugin({
        exclude: ['@electron-toolkit/preload']
      })
    ],
    build: {
      rollupOptions: {
        input: {
          index: path.resolve(__dirname, 'src/preload/index.js')
        }
      }
    }
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': path.resolve('src/renderer/src')
      }
    },
    plugins: [react()]
  }
})
