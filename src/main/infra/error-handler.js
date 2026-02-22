import { app, dialog } from 'electron'
import { FatalError } from 'infra/errors.js'

export const normalizeError = (error) => {
  const baseError = error instanceof Error ? error : new Error(String(error))
  let normalized = {
    name: baseError.name || 'Error',
    message: baseError.message || 'An unexpected error occurred',
    code: 'UNHANDLED_ERROR'
  }

  if (typeof baseError.toJSON === 'function') {
    normalized = {
      ...normalized,
      ...baseError.toJSON()
    }
  }

  if (baseError.cause && normalized.details === undefined) {
    normalized.details = baseError.cause
  }

  if (baseError.stack) {
    normalized.stack = baseError.stack
  }

  return normalized
}

export const toIpcError = (normalized) => {
  const ipcError = new Error(normalized.message || 'An unexpected error occurred')
  ipcError.name = normalized.name || 'Error'
  Object.assign(ipcError, normalized)
  return ipcError
}

export const logError = (context, normalized) => {
  console.error(`[${context}]`, normalized)
}

const showErrorDialog = (normalized) => {
  if (!app.isReady()) return

  const detailParts = []
  if (normalized.action) detailParts.push(`Action: ${normalized.action}`)
  if (normalized.code) detailParts.push(`Code: ${normalized.code}`)

  void dialog.showMessageBox({
    type: 'error',
    title: 'Unexpected Error',
    message: normalized.message || 'An unexpected error occurred',
    detail: detailParts.join('\n'),
    buttons: ['OK']
  })
}

const handleProcessError = (error, context, { fatal } = {}) => {
  const normalized = normalizeError(error)
  logError(context, normalized)

  if (fatal) {
    if (app.isReady()) {
      dialog
        .showMessageBox({
          type: 'error',
          title: 'Unexpected Error',
          message: normalized.message || 'An unexpected error occurred',
          detail: normalized.action ? `Action: ${normalized.action}` : undefined,
          buttons: ['OK']
        })
        .finally(() => app.exit(1))
    } else {
      app.exit(1)
    }
    return
  }

  showErrorDialog(normalized)
}

export const registerGlobalErrorHandlers = () => {
  process.on('uncaughtException', (error) => {
    handleProcessError(error, 'uncaughtException', { fatal: true })
  })

  process.on('unhandledRejection', (reason) => {
    handleProcessError(reason, 'unhandledRejection', { fatal: false })
  })

  app.on('render-process-gone', (event, webContents, details) => {
    const error = new FatalError({
      message: `Renderer process gone: ${details.reason}`,
      details
    })
    handleProcessError(error, 'render-process-gone', { fatal: true })
  })

  app.on('child-process-gone', (event, details) => {
    const error = new FatalError({
      message: `Child process gone: ${details.type}`,
      details
    })
    handleProcessError(error, 'child-process-gone', { fatal: true })
  })

  app.on('gpu-process-crashed', (event, killed) => {
    const error = new FatalError({
      message: 'GPU process crashed',
      details: { killed }
    })
    handleProcessError(error, 'gpu-process-crashed', { fatal: true })
  })
}
