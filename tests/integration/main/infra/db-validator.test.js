import { describe, it, expect, afterEach } from 'vitest'
import path from 'node:path'
import fs from 'node:fs'
import {
  validateDatabasePath,
  testDatabaseConnection
} from '../../../../src/main/infra/db-validator.js'
import database from '../../../../src/main/infra/database.js'
import {
  createTempDbPath,
  cleanupTempDb,
  cleanupTempDir,
  createTempDir
} from '../../../helpers/database-utils.js'

describe('Database Validator', () => {
  let tempDir

  afterEach(() => {
    if (tempDir) {
      cleanupTempDir(tempDir)
      tempDir = null
    }
  })

  describe('validateDatabasePath', () => {
    it('should return success for existing database file', async () => {
      tempDir = createTempDir()
      const dbPath = createTempDbPath(tempDir)

      // Create the database
      const db = database.initialize({ dbPath })
      db.close()

      const result = await validateDatabasePath(dbPath)
      expect(result.success).toBe(true)
      expect(result.error).toBeUndefined()

      cleanupTempDb(dbPath)
    })

    it('should return error for non-existent database file', async () => {
      const dbPath = path.join('/tmp', `non-existent-${Date.now()}.db`)

      const result = await validateDatabasePath(dbPath)
      expect(result.success).toBe(false)
      expect(result.error).toContain('not found')
    })

    it('should return error for inaccessible file path', async () => {
      // Test with a path we know we can't access
      const dbPath = '/root/no-permission-db.db'

      const result = await validateDatabasePath(dbPath)
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should work with absolute paths', async () => {
      tempDir = createTempDir()
      const dbPath = createTempDbPath(tempDir)

      const db = database.initialize({ dbPath })
      db.close()

      const absolutePath = path.resolve(dbPath)
      const result = await validateDatabasePath(absolutePath)
      expect(result.success).toBe(true)

      cleanupTempDb(dbPath)
    })
  })

  describe('testDatabaseConnection', () => {
    it('should successfully connect to valid database', async () => {
      tempDir = createTempDir()
      const dbPath = createTempDbPath(tempDir)

      const db = database.initialize({ dbPath })
      db.close()

      const result = await testDatabaseConnection(dbPath)
      expect(result.success).toBe(true)
      expect(result.version).toBeTruthy()
      expect(typeof result.version).toBe('string')

      cleanupTempDb(dbPath)
    })

    it('should return SQLite version on successful connection', async () => {
      tempDir = createTempDir()
      const dbPath = createTempDbPath(tempDir)

      const db = database.initialize({ dbPath })
      db.close()

      const result = await testDatabaseConnection(dbPath)
      expect(result.success).toBe(true)
      expect(/^\d+\.\d+/.test(result.version)).toBe(true)

      cleanupTempDb(dbPath)
    })

    it('should validate path before connection', async () => {
      const dbPath = path.join('/tmp', `non-existent-${Date.now()}.db`)

      const result = await testDatabaseConnection(dbPath)
      expect(result.success).toBe(false)
      expect(result.error).toContain('not found')
    })

    it('should handle connection errors gracefully', async () => {
      tempDir = createTempDir()
      const invalidPath = path.join(tempDir, 'dir-not-file', 'db.db')

      // Create the first directory but not the nested one
      fs.mkdirSync(path.join(tempDir, 'dir-not-file'))

      const result = await testDatabaseConnection(invalidPath)
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should close database connection after testing', async () => {
      tempDir = createTempDir()
      const dbPath = createTempDbPath(tempDir)

      const db = database.initialize({ dbPath })
      db.close()

      // Test connection
      await testDatabaseConnection(dbPath)

      // Database should still be usable (connection was closed)
      const db2 = database.initialize({ dbPath })
      expect(() => {
        db2.prepare('SELECT 1').get()
      }).not.toThrow()
      db2.close()

      cleanupTempDb(dbPath)
    })

    it('should work with in-memory database', async () => {
      const result = await testDatabaseConnection(':memory:')
      // In-memory databases don't have a file, so this should fail validation
      expect(result.success).toBe(false)
    })
  })

  describe('integration', () => {
    it('should validate and connect to database workflow', async () => {
      tempDir = createTempDir()
      const dbPath = createTempDbPath(tempDir)

      const db = database.initialize({ dbPath })
      db.close()

      // First validate path exists
      const pathValid = await validateDatabasePath(dbPath)
      expect(pathValid.success).toBe(true)

      // Then test connection
      const connectionValid = await testDatabaseConnection(dbPath)
      expect(connectionValid.success).toBe(true)
      expect(connectionValid.version).toBeTruthy()

      cleanupTempDb(dbPath)
    })

    it('should handle multiple concurrent validations', async () => {
      tempDir = createTempDir()
      const dbPath = createTempDbPath(tempDir)

      const db = database.initialize({ dbPath })
      db.close()

      const results = await Promise.all([
        validateDatabasePath(dbPath),
        validateDatabasePath(dbPath),
        testDatabaseConnection(dbPath),
        testDatabaseConnection(dbPath)
      ])

      expect(results[0].success).toBe(true)
      expect(results[1].success).toBe(true)
      expect(results[2].success).toBe(true)
      expect(results[3].success).toBe(true)

      cleanupTempDb(dbPath)
    })
  })
})
