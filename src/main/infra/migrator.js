import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function createMigrationTable(dbClient) {
  dbClient.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `)
}

function getMigrationFiles(directory) {
  try {
    const files = fs
      .readdirSync(directory)
      .filter((file) => file.endsWith('.sql') && !file.endsWith('-down.sql'))
      .sort()
    return files
  } catch (error) {
    console.error('error while loading migration files', error)
    throw error
  }
}

function getAppliedMigration(dbClient) {
  return dbClient
    .prepare('SELECT name FROM schema_migrations')
    .all()
    .map((m) => m.name)
}

function applyPendingMigrations(dbClient) {
  createMigrationTable(dbClient)

  const pendingMigrations = getPendingMigrations(dbClient)

  const migrationSchemaStmt = dbClient.prepare('INSERT INTO schema_migrations (name) VALUES (?)')

  const appliedMigrations = []

  const migrationsTransaction = dbClient.transaction(() => {
    for (const migration of pendingMigrations) {
      dbClient.exec(migration.sql)
      migrationSchemaStmt.run(migration.fileName)
      appliedMigrations.push(migration.fileName)
      //console.log(`✔️  Applied Migration: ${migration.fileName}`)
    }
  })

  migrationsTransaction(pendingMigrations)

  return appliedMigrations
}

function getPendingMigrations(dbClient) {
  const migrationsPath = path.join(__dirname, 'migrations')
  const migrationFiles = getMigrationFiles(migrationsPath)
  if (migrationFiles.length === 0) console.error('No Migrations found.')
  const appliedMigrations = getAppliedMigration(dbClient)

  const pendingMigrations = []

  migrationFiles.forEach((file) => {
    if (!appliedMigrations.includes(file)) {
      pendingMigrations.push({
        fileName: file,
        sql: fs.readFileSync(path.join(migrationsPath, file), {
          encoding: 'utf-8'
        })
      })
    }
  })

  return pendingMigrations
}

const migrator = {
  applyPendingMigrations,
  getPendingMigrations
}
export default migrator
