/**
 * scripts/display-tables.js
 * Prints out all records from designers, printers, and reservations tables.
 */
const db = require('../src/database/connection');

async function displayAll() {
  const getTable = (sql) =>
    new Promise((resolve, reject) => {
      db.all(sql, (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });

  try {
    console.log('\n========================================');
    console.log(' EVIDENCE 6: DESIGNERS (6 Records)');
    console.log('========================================');
    const designers = await getTable('SELECT * FROM designers');
    console.table(designers);

    console.log('\n========================================');
    console.log(' EVIDENCE 7: PRINTERS (5 Records)');
    console.log('========================================');
    const printers = await getTable('SELECT * FROM printers');
    console.table(printers);

    console.log('\n========================================');
    console.log(' EVIDENCE 8: RESERVATIONS (10 Records)');
    console.log('========================================');
    const reservations = await getTable('SELECT * FROM reservations');
    console.table(reservations);

    db.close();
  } catch (err) {
    console.error('Error fetching records:', err.message);
    db.close();
    process.exit(1);
  }
}

displayAll();
