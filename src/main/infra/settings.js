import { Conf } from 'electron-conf/main'

/**
 * Application settings store using electron-store
 * Persists user preferences like database path, theme, etc.
 */
const conf = new Conf()

/**
 * Get the last used database path from settings
 * @returns {string|null} Absolute path to database or null if not set
 */
export function getLastDatabasePath() {
  return conf.get('lastDatabasePath') || null
}

/**
 * Save database path to settings
 * @param {string} path - Absolute path to database file
 */
export function setDatabasePath(path) {
  if (!path) {
    throw new Error('Database path cannot be empty')
  }
  conf.set('lastDatabasePath', path)
}

/**
 * Clear the stored database path
 */
export function clearDatabasePath() {
  conf.delete('lastDatabasePath')
}

/**
 * Get the stored UI language
 * @returns {string|null} Locale code (e.g. 'pt-BR') or null if not set
 */
export function getLanguage() {
  return conf.get('language') || null
}

/**
 * Persist the UI language
 * @param {string} locale - Locale code (e.g. 'pt-BR', 'en-US')
 */
export function setLanguage(locale) {
  conf.set('language', locale)
}

/**
 * Get all stored settings (for debugging/testing)
 * @returns {Object} All stored settings
 */
export function getAllSettings() {
  return conf.store
}

export default conf
