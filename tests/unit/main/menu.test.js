import { describe, expect, it, vi, beforeEach } from 'vitest'

const showMessageBox = vi.fn().mockResolvedValue({ response: 0 })

vi.mock('electron', () => ({
  Menu: {
    buildFromTemplate: vi.fn((template) => ({ template })),
    setApplicationMenu: vi.fn(),
    getApplicationMenu: vi.fn()
  },
  dialog: {
    showMessageBox
  },
  app: {
    quit: vi.fn(),
    relaunch: vi.fn(),
    exit: vi.fn()
  }
}))

vi.mock('infra/settings.js', () => ({
  getLastDatabasePath: vi.fn(() => null),
  setDatabasePath: vi.fn()
}))

vi.mock('handlers/database-select.js', () => ({
  selectExistingDatabase: vi.fn(),
  createNewDatabase: vi.fn()
}))

vi.mock('infra/db-validator.js', () => ({
  testDatabaseConnection: vi.fn()
}))

describe('createSafeMenuHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('executes successful async handlers', async () => {
    const { createSafeMenuHandler } = await import('main/menu.js')
    const handler = vi.fn().mockResolvedValue(undefined)

    createSafeMenuHandler(handler)()
    await Promise.resolve()

    expect(handler).toHaveBeenCalledTimes(1)
    expect(showMessageBox).not.toHaveBeenCalled()
  })

  it('shows an error dialog when the async handler rejects', async () => {
    const { createSafeMenuHandler } = await import('main/menu.js')
    const handler = vi.fn().mockRejectedValue(new Error('boom'))

    createSafeMenuHandler(handler)()
    await Promise.resolve()
    await Promise.resolve()

    expect(handler).toHaveBeenCalledTimes(1)
    expect(showMessageBox).toHaveBeenCalledWith({
      type: 'error',
      title: 'Action Failed',
      message: 'The requested action could not be completed.',
      detail: 'boom',
      buttons: ['OK']
    })
  })
})
