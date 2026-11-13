const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Absolute path to root-level printpoint.db
const DB_PATH = path.resolve(__dirname, '../../printpoint.db');

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error(`[Database Error] Failed to connect to SQLite database at ${DB_PATH}:`, err.message);
  } else {
    // Enforce foreign key constraints on this connection
    db.run('PRAGMA foreign_keys = ON;', (pragmaErr) => {
      if (pragmaErr) {
        console.error('[Database Error] Failed to enable foreign keys:', pragmaErr.message);
      }
    });
  }
});

module.exports = db;
module.exports.db = db;
module.exports.DB_PATH = DB_PATH;

