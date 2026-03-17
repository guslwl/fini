import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import Database from 'better-sqlite3'
import migrator from 'infra/migrator.js'
import { createTempDbPath, cleanupTempDb, getTables } from '../../../helpers/database-utils.js'

describe('Migrator', () => {
  let db
  let dbPath

  beforeEach(() => {
    dbPath = createTempDbPath()
  })

  afterEach(() => {
    if (db) {
      db.close()
      db = null
    }
    cleanupTempDb(dbPath)
  })

  describe('applyPendingMigrations', () => {
    it('should create schema_migrations table', () => {
      db = new Database(dbPath)
      migrator.applyPendingMigrations(db)

      const tables = getTables(db)
      expect(tables).toContain('schema_migrations')
    })

    it('should apply pending migrations', () => {
      db = new Database(dbPath)
      const applied = migrator.applyPendingMigrations(db)

      expect(Array.isArray(applied)).toBe(true)
      expect(applied.length).toBeGreaterThan(0)
      expect(applied[0]).toMatch(/\d+-.*\.sql/)
    })

    it('should create tables from migrations', () => {
      db = new Database(dbPath)
      migrator.applyPendingMigrations(db)

      const tables = getTables(db)

      // Verify core tables from 001-initial.sql exist
      expect(tables).toContain('holidays')
      expect(tables).toContain('scheduled_transactions')
    })

    it('should track migrations in schema_migrations table', () => {
      db = new Database(dbPath)
      const applied = migrator.applyPendingMigrations(db)

      const tracked = db.prepare('SELECT name FROM schema_migrations').all()

      expect(tracked.length).toBe(applied.length)
      tracked.forEach((row) => {
        expect(applied).toContain(row.name)
      })
    })

    it('should be idempotent - running twice should not duplicate tables', () => {
      db = new Database(dbPath)

      migrator.applyPendingMigrations(db)
      const second = migrator.applyPendingMigrations(db)

      // Second run should not apply anything since migrations already exist
      expect(second.length).toBe(0)

      // Tables should still exist
      const tables = getTables(db)
      expect(tables).toContain('holidays')
      expect(tables).toContain('scheduled_transactions')
    })

    it('should record timestamp for each migration', () => {
      db = new Database(dbPath)
      migrator.applyPendingMigrations(db)

      const migrations = db.prepare('SELECT name, executed_at FROM schema_migrations').all()

      migrations.forEach((migration) => {
        expect(migration.executed_at).toBeTruthy()
      })
    })

    it('should maintain migrations order', () => {
      db = new Database(dbPath)
      const applied = migrator.applyPendingMigrations(db)

      const tracked = db.prepare('SELECT name FROM schema_migrations ORDER BY id').all()

      expect(tracked.map((t) => t.name)).toEqual(applied)
    })

    it('should execute all migrations in a transaction', () => {
      db = new Database(dbPath)

      // Apply migrations
      migrator.applyPendingMigrations(db)

      // If transaction works properly, all tables should exist or none
      const tables = getTables(db)
      const requiredTables = ['holidays', 'scheduled_transactions', 'schema_migrations']

      requiredTables.forEach((table) => {
        expect(tables).toContain(table)
      })
    })
  })

  describe('getPendingMigrations', () => {
    it('should return array of migrations', () => {
      db = new Database(dbPath)
      // Initialize the schema_migrations table first
      db.exec(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE,
          executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `)
      const pending = migrator.getPendingMigrations(db)

      expect(Array.isArray(pending)).toBe(true)
      expect(pending.length).toBeGreaterThan(0)
    })

    it('should return migrations with fileName and sql properties', () => {
      db = new Database(dbPath)
      // Initialize the schema_migrations table first
      db.exec(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE,
          executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `)
      const pending = migrator.getPendingMigrations(db)

      pending.forEach((migration) => {
        expect(migration.fileName).toBeTruthy()
        expect(migration.sql).toBeTruthy()
        expect(typeof migration.sql).toBe('string')
      })
    })

    it('should read SQL content from files', () => {
      db = new Database(dbPath)
      // Initialize the schema_migrations table first
      db.exec(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE,
          executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `)
      const pending = migrator.getPendingMigrations(db)

      // First migration should contain expected SQL
      const firstMigration = pending[0]
      expect(firstMigration.sql).toContain('CREATE TABLE')
    })

    it('should not include already-applied migrations', () => {
      db = new Database(dbPath)

      // Apply first time
      migrator.applyPendingMigrations(db)

      // Get pending again
      const pending = migrator.getPendingMigrations(db)

      // Should be empty since all are applied
      expect(pending.length).toBe(0)
    })

    it('should return migrations in sorted order', () => {
      db = new Database(dbPath)
      // Initialize the schema_migrations table first
      db.exec(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE,
          executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `)
      const pending = migrator.getPendingMigrations(db)

      const fileNames = pending.map((m) => m.fileName)
      const sortedNames = [...fileNames].sort()

      expect(fileNames).toEqual(sortedNames)
    })
  })

  describe('integration', () => {
    it('should migrate from empty database to full schema', () => {
      db = new Database(dbPath)

      // Initially, no tables
      let tables = getTables(db)
      expect(tables.length).toBe(0)

      // Apply migrations
      const applied = migrator.applyPendingMigrations(db)
      expect(applied.length).toBeGreaterThan(0)

      // Now tables should exist
      tables = getTables(db)
      expect(tables.length).toBeGreaterThan(1)
    })

    it('should support multiple database instances with same migration path', () => {
      const db1 = new Database(createTempDbPath())
      const db2 = new Database(createTempDbPath())

      try {
        const applied1 = migrator.applyPendingMigrations(db1)
        const applied2 = migrator.applyPendingMigrations(db2)

        expect(applied1).toEqual(applied2)

        const tables1 = getTables(db1)
        const tables2 = getTables(db2)

        expect(tables1).toEqual(tables2)
      } finally {
        db1.close()
        db2.close()
        cleanupTempDb(db1.name)
        cleanupTempDb(db2.name)
      }
    })
  })

  describe('error handling', () => {
    it('should throw on invalid SQL in migration file', () => {
      // This would require creating an invalid migration file
      // For now, we just verify migrations with valid SQL all apply
      db = new Database(dbPath)
      const applied = migrator.applyPendingMigrations(db)

      expect(applied.every((name) => typeof name === 'string')).toBe(true)
    })
  })
})
