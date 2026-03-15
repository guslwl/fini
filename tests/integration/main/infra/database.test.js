import { describe, it, expect, afterEach } from 'vitest'
import database from 'infra/database.js'
import {
  createTempDbPath,
  cleanupTempDb,
  getTables,
  getTableSchema
} from '../../../helpers/database-utils.js'

describe('Database', () => {
  let db

  afterEach(() => {
    if (db) {
      db.close()
      db = null
    }
  })

  describe('initialize', () => {
    it('should create an in-memory database by default', () => {
      db = database.initialize()
      expect(db).toBeDefined()
      expect(typeof db.prepare).toBe('function')
    })

    it('should create a file-based database with custom path', () => {
      const dbPath = createTempDbPath()
      try {
        db = database.initialize({ dbPath })
        expect(db).toBeDefined()
        const version = database.getVersion(db)
        expect(version).toBeDefined()
      } finally {
        cleanupTempDb(dbPath)
      }
    })

    it('should apply migrations on initialization', () => {
      db = database.initialize({ dbPath: ':memory:' })

      // After initialization, schema_migrations table should exist
      const tables = getTables(db)
      expect(tables).toContain('schema_migrations')
    })

    it('should create initial tables from migrations', () => {
      db = database.initialize({ dbPath: ':memory:' })

      const tables = getTables(db)

      // Verify core tables exist from 001-initial.sql
      expect(tables).toContain('holidays')
      expect(tables).toContain('scheduled_transactions')
    })

    it('should suppress verbose logging when not specified', () => {
      const dbPath = createTempDbPath()
      try {
        db = database.initialize({ dbPath, verbose: undefined })
        expect(db).toBeDefined()
      } finally {
        cleanupTempDb(dbPath)
      }
    })

    it('should accept custom verbose function', () => {
      const logs = []
      const customVerbose = (msg) => logs.push(msg)

      db = database.initialize({
        dbPath: ':memory:',
        verbose: customVerbose
      })

      expect(db).toBeDefined()
    })
  })

  describe('getVersion', () => {
    it('should return SQLite version', () => {
      db = database.initialize()
      const version = database.getVersion(db)

      expect(typeof version).toBe('string')
      expect(/^\d+\.\d+/.test(version)).toBe(true)
    })

    it('should query database successfully', () => {
      db = database.initialize({ dbPath: ':memory:' })

      // Verify we can query the database
      const version = database.getVersion(db)
      expect(version).toBeTruthy()

      // Verify we can run additional queries
      const result = db.prepare('SELECT 1 as test').get()
      expect(result.test).toBe(1)
    })
  })

  describe('schema validation', () => {
    it('holidays table should have correct columns', () => {
      db = database.initialize({ dbPath: ':memory:' })
      const schema = getTableSchema(db, 'holidays')

      const columnNames = schema.map((col) => col.name)
      expect(columnNames).toContain('id')
      expect(columnNames).toContain('description')
      expect(columnNames).toContain('type')
      expect(columnNames).toContain('date')
      expect(columnNames).toContain('created_at')
    })

    it('schema_migrations table should track applied migrations', () => {
      db = database.initialize({ dbPath: ':memory:' })

      const migrations = db.prepare('SELECT * FROM schema_migrations').all()
      expect(Array.isArray(migrations)).toBe(true)
      expect(migrations.length).toBeGreaterThan(0)

      // Verify migration structure
      migrations.forEach((migration) => {
        expect(migration.name).toBeTruthy()
        expect(migration.executed_at).toBeTruthy()
      })
    })
  })

  describe('database operations', () => {
    it('should support insert operations', () => {
      db = database.initialize({ dbPath: ':memory:' })

      const stmt = db.prepare('INSERT INTO holidays (description, type, date) VALUES (?, ?, ?)')
      const info = stmt.run('Test Holiday', 'Test', '2024-01-01')

      expect(info.changes).toBe(1)
      expect(info.lastInsertRowid).toBeGreaterThan(0)
    })

    it('should support select operations', () => {
      db = database.initialize({ dbPath: ':memory:' })

      // Insert test data
      db.prepare('INSERT INTO holidays (description, type, date) VALUES (?, ?, ?)').run(
        'Test Holiday',
        'Test',
        '2024-01-01'
      )

      // Query it back
      const holiday = db.prepare('SELECT * FROM holidays WHERE description = ?').get('Test Holiday')
      expect(holiday).toBeDefined()
      expect(holiday.description).toBe('Test Holiday')
      expect(holiday.type).toBe('Test')
    })

    it('should maintain data integrity across operations', () => {
      db = database.initialize({ dbPath: ':memory:' })

      const insert = db.prepare('INSERT INTO holidays (description, date) VALUES (?, ?)')
      insert.run('Holiday 1', '2024-01-01')
      insert.run('Holiday 2', '2024-01-02')

      const count = db.prepare('SELECT COUNT(*) as cnt FROM holidays').get().cnt
      expect(count).toBe(2)
    })
  })
})
