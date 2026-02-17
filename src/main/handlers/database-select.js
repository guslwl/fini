import { dialog } from 'electron'

/**
 * Prompt user to select an existing database file
 * @param {BrowserWindow} mainWindow - Main application window
 * @returns {Promise<string|null>} Selected file path or null if cancelled
 */
export async function selectExistingDatabase(mainWindow) {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Select Database File',
    buttonLabel: 'Open',
    filters: [
      { name: 'SQLite Database', extensions: ['db', 'sqlite', 'sqlite3'] },
      { name: 'All Files', extensions: ['*'] }
    ],
    properties: ['openFile']
  })

  if (result.canceled) {
    return null
  }

  return result.filePaths[0]
}

/**
 * Prompt user to create a new database file
 * @param {BrowserWindow} mainWindow - Main application window
 * @returns {Promise<string|null>} New file path or null if cancelled
 */
export async function createNewDatabase(mainWindow) {
  const result = await dialog.showSaveDialog(mainWindow, {
    title: 'Create New Database',
    buttonLabel: 'Create',
    filters: [
      { name: 'SQLite Database', extensions: ['db'] },
      { name: 'All Files', extensions: ['*'] }
    ],
    defaultPath: 'finances.db'
  })

  if (result.canceled) {
    return null
  }

  return result.filePath
}

/**
 * Prompt user to either select existing database or create new one
 * @param {BrowserWindow} mainWindow - Main application window
 * @returns {Promise<{action: 'select'|'create', path: string}|null>} Action and path or null if cancelled
 */
export async function promptDatabaseSelection(mainWindow) {
  const choice = await dialog.showMessageBox(mainWindow, {
    type: 'question',
    title: 'Database Required',
    message: 'No database found. Would you like to create a new one or open an existing one?',
    buttons: ['Create New', 'Open Existing', 'Cancel']
  })

  if (choice.response === 2) {
    // Cancel
    return null
  }

  if (choice.response === 0) {
    // Create new
    const path = await createNewDatabase(mainWindow)
    if (path) {
      return { action: 'create', path }
    }
    return null
  }

  // Open existing
  const path = await selectExistingDatabase(mainWindow)
  if (path) {
    return { action: 'select', path }
  }
  return null
}
