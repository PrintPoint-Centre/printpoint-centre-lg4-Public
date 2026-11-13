const fs = require('fs');
const path = require('path');
const db = require('./connection');
const seedDB = require('./seed');

/**
 * Expected schema specification for validation and non-destructive inspection.
 */
const EXPECTED_SCHEMA = {
  designers: {
    columns: ['id', 'name', 'email'],
    requiredColumns: {
      id: { type: 'INTEGER', pk: 1 },
      name: { type: 'TEXT', notnull: 1 },
      email: { type: 'TEXT', notnull: 1 }
    }
  },
  printers: {
    columns: ['id', 'name', 'material'],
    requiredColumns: {
      id: { type: 'INTEGER', pk: 1 },
      name: { type: 'TEXT', notnull: 1 },
      material: { type: 'TEXT', notnull: 1 }
    }
  },
  reservations: {
    columns: ['id', 'designer_id', 'printer_id', 'created_at'],
    requiredColumns: {
      id: { type: 'INTEGER', pk: 1 },
      designer_id: { type: 'INTEGER', notnull: 1 },
      printer_id: { type: 'INTEGER', notnull: 1 },
      created_at: { notnull: 0 }
    },
    foreignKeys: [
      { from: 'designer_id', toTable: 'designers', toColumn: 'id' },
      { from: 'printer_id', toTable: 'printers', toColumn: 'id' }
    ]
  }
};

/**
 * Executes a SQL statement as a Promise.
 */
function runAsync(database, sql, params = []) {
  return new Promise((resolve, reject) => {
    database.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve(this);
    });
  });
}

/**
 * Queries all rows as a Promise.
 */
function allAsync(database, sql, params = []) {
  return new Promise((resolve, reject) => {
    database.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

/**
 * Inspects existing database schema and validates columns/foreign keys.
 * Reports any differences instead of performing destructive changes.
 */
async function inspectSchema(database) {
  console.log('[Database Init] Inspecting existing database schema...');
  const existingTables = await allAsync(
    database,
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
  );
  const tableNames = existingTables.map((t) => t.name);

  for (const [tableName, spec] of Object.entries(EXPECTED_SCHEMA)) {
    if (!tableNames.includes(tableName)) {
      console.warn(`[Database Warning] Table '${tableName}' does not exist yet.`);
      continue;
    }

    const columns = await allAsync(database, `PRAGMA table_info(${tableName})`);
    const actualColNames = columns.map((c) => c.name);

    // Check for missing columns
    const missingCols = spec.columns.filter((c) => !actualColNames.includes(c));
    if (missingCols.length > 0) {
      console.warn(
        `[Schema Discrepancy] Table '${tableName}' is missing expected columns: ${missingCols.join(', ')}`
      );
    }

    // Check for extra columns
    const extraCols = actualColNames.filter((c) => !spec.columns.includes(c));
    if (extraCols.length > 0) {
      console.log(
        `[Schema Notice] Table '${tableName}' has additional columns: ${extraCols.join(', ')}`
      );
    }

    // Check foreign keys if specified
    if (spec.foreignKeys) {
      const fks = await allAsync(database, `PRAGMA foreign_key_list(${tableName})`);
      for (const expectedFK of spec.foreignKeys) {
        const match = fks.find(
          (fk) => fk.from === expectedFK.from && fk.table === expectedFK.toTable
        );
        if (!match) {
          console.warn(
            `[Schema Discrepancy] Table '${tableName}' missing foreign key: ${expectedFK.from} -> ${expectedFK.toTable}(${expectedFK.toColumn})`
          );
        }
      }
    }

    console.log(`[Database Init] Table '${tableName}' verified (${columns.length} columns).`);
  }
}

/**
 * Initializes the SQLite database:
 * - Enables foreign keys.
 * - Applies schema.sql safely using CREATE TABLE IF NOT EXISTS.
 * - Inspects existing schema non-destructively.
 * - Invokes seedDB (which only seeds empty databases, preserving existing data).
 */
async function initDB(database = db) {
  return new Promise((resolve, reject) => {
    database.serialize(async () => {
      try {
        // 1. Enable PRAGMA foreign_keys = ON
        await runAsync(database, 'PRAGMA foreign_keys = ON;');
        const fkStatus = await allAsync(database, 'PRAGMA foreign_keys');
        const isFkEnabled = fkStatus && fkStatus[0] && Object.values(fkStatus[0])[0] === 1;
        console.log(`[Database Init] PRAGMA foreign_keys: ${isFkEnabled ? 'ON (1)' : 'OFF (0)'}`);

        // 2. Load and execute schema.sql using CREATE TABLE IF NOT EXISTS
        const schemaPath = path.resolve(__dirname, 'schema.sql');
        if (fs.existsSync(schemaPath)) {
          const schemaSql = fs.readFileSync(schemaPath, 'utf8');
          // Execute statements sequentially
          const statements = schemaSql
            .split(';')
            .map((s) => s.trim())
            .filter((s) => s.length > 0);

          for (const statement of statements) {
            await runAsync(database, statement);
          }
          console.log('[Database Init] Applied schema definitions non-destructively.');
        } else {
          console.warn(`[Database Warning] schema.sql not found at ${schemaPath}`);
        }

        // 3. Inspect existing schema and report differences without replacing
        await inspectSchema(database);

        // 4. Run seed check (only seeds if database is empty; preserves existing records)
        await seedDB(database);

        console.log('[Database Init] SQLite database initialization completed successfully.');
        resolve();
      } catch (err) {
        console.error('[Database Init Error] Initialization failed:', err.message);
        reject(err);
      }
    });
  });
}

// Allow running directly: node src/database/init.js
if (require.main === module) {
  initDB()
    .then(() => {
      console.log('[Database Init] Direct execution finished.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('[Database Init] Direct execution failed:', err);
      process.exit(1);
    });
}

module.exports = initDB;
module.exports.initDB = initDB;

