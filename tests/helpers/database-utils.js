import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'

/**
 * Create a temporary directory for test databases
 * @returns {string} Path to temporary directory
 */
export function createTempDir() {
  const baseDir = os.tmpdir()
  const uniqueDir = path.join(
    baseDir,
    `vite-test-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  )
  fs.mkdirSync(uniqueDir, { recursive: true })
  return uniqueDir
}

/**
 * Create a temporary database file path
 * @param {string} [tempDir] - Optional temp directory
 * @returns {string} Path to temporary database file
 */
export function createTempDbPath(tempDir) {
  const dir = tempDir || createTempDir()
  return path.join(dir, `test-${Date.now()}.db`)
}

/**
 * Clean up a temporary database file
 * @param {string} dbPath - Path to database file
 */
export function cleanupTempDb(dbPath) {
  try {
    if (fs.existsSync(dbPath)) {
      fs.unlinkSync(dbPath)
    }
  } catch (error) {
    console.warn(`Failed to cleanup temp db at ${dbPath}:`, error.message)
  }
}

/**
 * Clean up a temporary directory and all its contents
 * @param {string} dirPath - Path to directory
 */
export function cleanupTempDir(dirPath) {
  try {
    if (fs.existsSync(dirPath)) {
      fs.rmSync(dirPath, { recursive: true, force: true })
    }
  } catch (error) {
    console.warn(`Failed to cleanup temp dir at ${dirPath}:`, error.message)
  }
}

/**
 * Get all tables from a database
 * @param {Database} dbClient - better-sqlite3 database instance
 * @returns {Array<string>} Array of table names
 */
export function getTables(dbClient) {
  const rows = dbClient
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
    .all()
  return rows.map((row) => row.name)
}

/**
 * Get table schema
 * @param {Database} dbClient - better-sqlite3 database instance
 * @param {string} tableName - Name of the table
 * @returns {Array<Object>} Array of column definitions
 */
export function getTableSchema(dbClient, tableName) {
  return dbClient.prepare(`PRAGMA table_info(${tableName})`).all()
}

/**
 * Count rows in a table
 * @param {Database} dbClient - better-sqlite3 database instance
 * @param {string} tableName - Name of the table
 * @returns {number} Number of rows
 */
export function countRows(dbClient, tableName) {
  const result = dbClient.prepare(`SELECT COUNT(*) as count FROM ${tableName}`).get()
  return result.count
}
