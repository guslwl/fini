import Database from 'better-sqlite3'
import { promises as fs } from 'fs'
import path from 'path'

/**
 * Validates if a database file exists and is accessible
 * @param {string} dbPath - Absolute path to database file
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function validateDatabasePath(dbPath) {
  try {
    // Check if file exists
    await fs.access(dbPath)
    return { success: true }
  } catch (error) {
    if (error.code === 'ENOENT') {
      return { success: false, error: 'Database file not found' }
    }
    return { success: false, error: `Access denied: ${error.message}` }
  }
}

/**
 * Test connection to a database file by attempting to open it and run a query
 * @param {string} dbPath - Absolute path to database file
 * @returns {Promise<{success: boolean, error?: string, version?: string}>}
 */
export async function testDatabaseConnection(dbPath) {
  try {
    // First validate file exists
    const pathCheck = await validateDatabasePath(dbPath)
    if (!pathCheck.success) {
      return pathCheck
    }

    // Try to open database and run a test query
    const db = new Database(dbPath)
    try {
      const result = db.prepare('SELECT sqlite_version() as version').get()
      const version = result?.version || 'unknown'
      return { success: true, version }
    } finally {
      db.close()
    }
  } catch (error) {
    return {
      success: false,
      error: `Failed to connect: ${error.message}`
    }
  }
}

/**
 * Check if a path could be used to create a new database
 * (parent directory exists and is writable)
 * @param {string} dbPath - Absolute path to database file
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function validateNewDatabasePath(dbPath) {
  try {
    const dirname = path.dirname(dbPath)

    // Check if parent directory exists and is writable
    await fs.access(dirname, fs.constants.W_OK)
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: `Cannot create database: ${error.message}`
    }
  }
}
