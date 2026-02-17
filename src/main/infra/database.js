import Database from 'better-sqlite3'
import migrator from './migrator.js'

const defaultInitializeOptions = {
  dbPath: ':memory:',
  verbose: () => {}
}

function initialize(options = {}) {
  const config = { ...defaultInitializeOptions, ...options }
  const dbClient = new Database(config.dbPath, { verbose: config.verbose })

  const migratedMigrations = migrator.applyPendingMigrations(dbClient)
  console.log(`-- Migrated Migrations: ${migratedMigrations}`)

  return dbClient
}

function getVersion(db) {
  const row = db.prepare('SELECT sqlite_version() AS version').get()
  return row.version
}

const database = { initialize, getVersion }
export default database
