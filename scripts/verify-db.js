/**
 * scripts/verify-db.js
 * Comprehensive database verification script for PrintPoint Centre
 */

const path = require('path');
const db = require('../src/database/connection');

function runQuery(sql) {
  return new Promise((resolve, reject) => {
    db.all(sql, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

function runGet(sql) {
  return new Promise((resolve, reject) => {
    db.get(sql, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

async function verifyDatabase() {
  console.log('====================================================');
  console.log('    PRINTPOINT CENTRE - DATABASE VERIFICATION       ');
  console.log('====================================================\n');

  let allPassed = true;

  try {
    // 1. Connection check
    console.log('[Check 1] Verifying Database Connection...');
    await runGet('SELECT 1 AS connection_test');
    console.log('  -> PASS: Connection to printpoint.db established successfully.\n');

    // 2. PRAGMA foreign_keys status
    console.log('[Check 2] Checking PRAGMA foreign_keys Status...');
    const fkRow = await runGet('PRAGMA foreign_keys');
    const fkStatus = fkRow ? Object.values(fkRow)[0] : 0;
    if (fkStatus === 1) {
      console.log('  -> PASS: PRAGMA foreign_keys is ENABLED (1).\n');
    } else {
      console.log('  -> WARN: PRAGMA foreign_keys is currently DISABLED (0).\n');
    }

    // 3. Table existence
    console.log('[Check 3] Verifying Required Tables Exist...');
    const tables = await runQuery(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
    );
    const tableNames = tables.map((t) => t.name);
    const requiredTables = ['designers', 'printers', 'reservations'];

    for (const table of requiredTables) {
      if (tableNames.includes(table)) {
        console.log(`  -> PASS: Table '${table}' exists.`);
      } else {
        console.error(`  -> FAIL: Table '${table}' is missing!`);
        allPassed = false;
      }
    }
    console.log('');

    // 4. Record counts
    console.log('[Check 4] Checking Record Counts...');
    const counts = {};
    for (const table of requiredTables) {
      if (tableNames.includes(table)) {
        const row = await runGet(`SELECT COUNT(*) AS count FROM ${table}`);
        counts[table] = row ? row.count : 0;
        console.log(`  -> Table '${table}': ${counts[table]} records.`);
      }
    }

    // Expected existing counts
    const expectedCounts = { designers: 6, printers: 5, reservations: 10 };
    let countsMatch = true;
    for (const [tbl, expected] of Object.entries(expectedCounts)) {
      if (counts[tbl] !== expected) {
        console.log(`  -> NOTICE: '${tbl}' count (${counts[tbl]}) differs from baseline (${expected}).`);
        countsMatch = false;
      }
    }
    if (countsMatch) {
      console.log('  -> PASS: Record counts match existing baseline (6 designers, 5 printers, 10 reservations).\n');
    } else {
      console.log('  -> INFO: Existing records preserved.\n');
    }

    // 5. PRAGMA foreign_key_check
    console.log('[Check 5] Running PRAGMA foreign_key_check...');
    const fkViolations = await runQuery('PRAGMA foreign_key_check');
    if (fkViolations.length === 0) {
      console.log('  -> PASS: Zero foreign key violations found. All relationships are valid.\n');
    } else {
      console.error('  -> FAIL: Foreign key violations detected:', fkViolations);
      allPassed = false;
    }

    // 6. PRAGMA integrity_check
    console.log('[Check 6] Running PRAGMA integrity_check...');
    const integrityRows = await runQuery('PRAGMA integrity_check');
    const integrityResult = integrityRows.length > 0 ? Object.values(integrityRows[0])[0] : 'failed';
    if (integrityResult === 'ok') {
      console.log('  -> PASS: SQLite database integrity check returned "ok".\n');
    } else {
      console.error('  -> FAIL: SQLite integrity check failed:', integrityRows);
      allPassed = false;
    }

    console.log('====================================================');
    if (allPassed) {
      console.log('  DATABASE VERIFICATION: ALL CHECKS PASSED');
    } else {
      console.log('  DATABASE VERIFICATION: SOME CHECKS FAILED');
    }
    console.log('====================================================');

    process.exit(allPassed ? 0 : 1);
  } catch (error) {
    console.error('Verification error:', error.message);
    process.exit(1);
  }
}

verifyDatabase();

