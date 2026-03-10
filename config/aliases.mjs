import path from 'node:path'

export const mainAliases = {
  main: path.resolve(process.cwd(), 'src/main'),
  infra: path.resolve(process.cwd(), 'src/main/infra'),
  models: path.resolve(process.cwd(), 'src/main/models'),
  validators: path.resolve(process.cwd(), 'src/main/validators'),
  services: path.resolve(process.cwd(), 'src/main/services'),
  handlers: path.resolve(process.cwd(), 'src/main/handlers')
}

export const rendererAliases = {
  renderer: path.resolve(process.cwd(), 'src/renderer/src'),
  '@': path.resolve(process.cwd(), 'src/renderer/src')
}

export const allAliases = {
  ...mainAliases,
  ...rendererAliases
}
