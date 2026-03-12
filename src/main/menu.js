import { Menu, dialog, app } from 'electron'
import * as settings from 'infra/settings.js'
import { selectExistingDatabase, createNewDatabase } from 'handlers/database-select.js'
import { testDatabaseConnection } from 'infra/db-validator.js'

/**
 * Create and set the application menu
 * @param {BrowserWindow} mainWindow - Main application window
 */
export function createApplicationMenu(mainWindow) {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Open Database...',
          accelerator: 'CmdOrCtrl+O',
          click: async () => {
            await handleOpenDatabase(mainWindow)
          }
        },
        {
          label: 'Create New Database...',
          accelerator: 'CmdOrCtrl+N',
          click: async () => {
            await handleCreateDatabase(mainWindow)
          }
        },
        { type: 'separator' },
        {
          label: 'Current Database',
          enabled: false
        },
        {
          label: getCurrentDatabaseLabel(),
          enabled: false,
          id: 'current-db-path'
        },
        { type: 'separator' },
        {
          label: 'Quit',
          accelerator: 'CmdOrCtrl+Q',
          click: () => {
            app.quit()
          }
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    }
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)

  return menu
}

/**
 * Get the current database path label for menu
 * @returns {string} Database path or "None" if not set
 */
function getCurrentDatabaseLabel() {
  const dbPath = settings.getLastDatabasePath()
  if (!dbPath) {
    return 'None'
  }
  // Show just the filename for cleaner menu display
  const parts = dbPath.split(/[\\/]/)
  return parts[parts.length - 1]
}

/**
 * Update the current database label in the menu
 */
export function updateDatabaseMenuLabel() {
  const menu = Menu.getApplicationMenu()
  if (menu) {
    const menuItem = menu.getMenuItemById('current-db-path')
    if (menuItem) {
      menuItem.label = getCurrentDatabaseLabel()
    }
  }
}

/**
 * Handle opening an existing database
 * @param {BrowserWindow} mainWindow - Main application window
 */
async function handleOpenDatabase(mainWindow) {
  try {
    const selectedPath = await selectExistingDatabase(mainWindow)

    if (!selectedPath) {
      return // User cancelled
    }

    // Test connection
    const testResult = await testDatabaseConnection(selectedPath)
    if (!testResult.success) {
      await dialog.showMessageBox(mainWindow, {
        type: 'error',
        title: 'Database Error',
        message: 'Failed to open database',
        detail: testResult.error
      })
      return
    }

    // Save and reload
    settings.setDatabasePath(selectedPath)
    updateDatabaseMenuLabel()

    await dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Database Changed',
      message: 'Database has been changed. The application will now reload.',
      buttons: ['OK']
    })

    // Reload the app to reinitialize with new database
    app.relaunch()
    app.exit(0)
  } catch (error) {
    await dialog.showMessageBox(mainWindow, {
      type: 'error',
      title: 'Database Error',
      message: 'An error occurred while opening the database.',
      detail: error instanceof Error ? error.message : String(error),
      buttons: ['OK']
    })
  }
}

/**
 * Handle creating a new database
 * @param {BrowserWindow} mainWindow - Main application window
 */
async function handleCreateDatabase(mainWindow) {
  try {
    const newPath = await createNewDatabase(mainWindow)

    if (!newPath) {
      return // User cancelled
    }

    // Save and reload
    settings.setDatabasePath(newPath)
    updateDatabaseMenuLabel()

    await dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Database Created',
      message: 'New database has been created. The application will now reload.',
      buttons: ['OK']
    })

    // Reload the app to reinitialize with new database
    app.relaunch()
    app.exit(0)
  } catch (error) {
    await dialog.showMessageBox(mainWindow, {
      type: 'error',
      title: 'Database Error',
      message: 'An error occurred while creating the database.',
      detail: error instanceof Error ? error.message : String(error),
      buttons: ['OK']
    })
  }
}
