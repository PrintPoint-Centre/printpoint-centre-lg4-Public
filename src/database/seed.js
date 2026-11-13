const db = require('./connection');

/**
 * Seed data definitions matching PrintPoint Centre project specifications.
 */
const seedData = {
  designers: [
    { name: 'Rahul', email: 'rahul@example.com' },
    { name: 'Priya', email: 'priya@example.com' },
    { name: 'Kiran', email: 'kiran@example.com' },
    { name: 'Arjun', email: 'arjun@example.com' },
    { name: 'Sneha', email: 'sneha@example.com' },
    { name: 'Ananya Sharma', email: 'ananya.sharma@example.com' }
  ],
  printers: [
    { name: 'Ender 3 V2', material: 'PLA' },
    { name: 'Prusa MK4', material: 'PETG' },
    { name: 'Bambu Lab P1S', material: 'ABS' },
    { name: 'Creality K1', material: 'TPU' },
    { name: 'Anycubic Kobra', material: 'PLA' }
  ],
  reservations: [
    { designer_id: 1, printer_id: 1, created_at: '2026-11-12 09:05:33' },
    { designer_id: 1, printer_id: 2, created_at: '2026-11-12 09:05:33' },
    { designer_id: 2, printer_id: 3, created_at: '2026-11-12 09:05:33' },
    { designer_id: 2, printer_id: 4, created_at: '2026-11-12 09:05:33' },
    { designer_id: 3, printer_id: 5, created_at: '2026-11-12 09:05:33' },
    { designer_id: 3, printer_id: 1, created_at: '2026-11-12 09:05:33' },
    { designer_id: 4, printer_id: 2, created_at: '2026-11-12 09:05:33' },
    { designer_id: 4, printer_id: 3, created_at: '2026-11-12 09:05:33' },
    { designer_id: 5, printer_id: 4, created_at: '2026-11-12 09:05:33' },
    { designer_id: 5, printer_id: 5, created_at: '2026-11-12 09:05:33' }
  ]
};

/**
 * Counts rows in a given table.
 */
function getRowCount(database, table) {
  return new Promise((resolve, reject) => {
    database.get(`SELECT COUNT(*) AS count FROM ${table}`, (err, row) => {
      if (err) return reject(err);
      resolve(row ? row.count : 0);
    });
  });
}

/**
 * Seeds the database only if all tables are completely empty.
 * Preserves existing data and avoids duplicate records.
 */
function seedDB(database = db) {
  return new Promise(async (resolve, reject) => {
    try {
      // Check record counts in all three tables
      const [designerCount, printerCount, reservationCount] = await Promise.all([
        getRowCount(database, 'designers'),
        getRowCount(database, 'printers'),
        getRowCount(database, 'reservations')
      ]);

      // If any table already contains records, skip seeding to protect existing data
      if (designerCount > 0 || printerCount > 0 || reservationCount > 0) {
        console.log(
          `[Seed] Database already populated (designers: ${designerCount}, printers: ${printerCount}, reservations: ${reservationCount}). Seeding skipped.`
        );
        return resolve({
          seeded: false,
          counts: { designers: designerCount, printers: printerCount, reservations: reservationCount }
        });
      }

      console.log('[Seed] Database is empty. Seeding initial records...');

      database.serialize(() => {
        // 1. Insert Designers
        const insertDesigner = database.prepare(
          'INSERT INTO designers (name, email) VALUES (?, ?)'
        );
        for (const d of seedData.designers) {
          insertDesigner.run(d.name, d.email);
        }
        insertDesigner.finalize();

        // 2. Insert Printers
        const insertPrinter = database.prepare(
          'INSERT INTO printers (name, material) VALUES (?, ?)'
        );
        for (const p of seedData.printers) {
          insertPrinter.run(p.name, p.material);
        }
        insertPrinter.finalize();

        // 3. Insert Reservations with valid foreign keys
        const insertReservation = database.prepare(
          'INSERT INTO reservations (designer_id, printer_id, created_at) VALUES (?, ?, ?)'
        );
        for (const r of seedData.reservations) {
          insertReservation.run(r.designer_id, r.printer_id, r.created_at);
        }
        insertReservation.finalize((err) => {
          if (err) {
            console.error('[Seed Error] Failed to insert reservations:', err.message);
            return reject(err);
          }
          console.log('[Seed] Successfully seeded initial data for PrintPoint Centre.');
          resolve({
            seeded: true,
            counts: {
              designers: seedData.designers.length,
              printers: seedData.printers.length,
              reservations: seedData.reservations.length
            }
          });
        });
      });
    } catch (error) {
      console.error('[Seed Error]:', error.message);
      reject(error);
    }
  });
}

// Allow running directly: node src/database/seed.js
if (require.main === module) {
  seedDB()
    .then((result) => {
      console.log('[Seed Complete]:', result);
      process.exit(0);
    })
    .catch((err) => {
      console.error('[Seed Fatal Error]:', err);
      process.exit(1);
    });
}

module.exports = seedDB;
module.exports.seedDB = seedDB;
module.exports.seedData = seedData;

