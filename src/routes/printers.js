const express = require('express');
const { runQuery, getQuery, allQuery } = require('../utils/dbHelpers');
const { validateIdParam, validatePrinter } = require('../middleware/validate');

const router = express.Router();

/**
 * Shared handler for Top Three Most Reserved Printers (Member 5).
 */
async function getTopThreePrinters(_req, res, next) {
  try {
    const rows = await allQuery(`
      SELECT
        p.id,
        p.name,
        p.material,
        COUNT(r.id) AS reservation_count
      FROM printers p
      LEFT JOIN reservations r ON p.id = r.printer_id
      GROUP BY p.id
      ORDER BY reservation_count DESC, p.id ASC
      LIMIT 3
    `);

    res.status(200).json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /printers/top
 * GET /printers/top-printers
 * Returns the top 3 most reserved 3D printers.
 */
router.get('/top', getTopThreePrinters);
router.get('/top-printers', getTopThreePrinters);

/**
 * GET /printers
 * Lists all printers, with optional ?search=, ?q=, or ?material= filters.
 */
router.get('/', async (req, res, next) => {
  try {
    const search = (req.query.search || req.query.q || '').trim();
    const material = (req.query.material || '').trim();

    const conditions = [];
    const params = [];

    if (search) {
      const pattern = `%${search}%`;
      conditions.push('(name LIKE ? OR material LIKE ?)');
      params.push(pattern, pattern);
    }

    if (material) {
      conditions.push('LOWER(material) = LOWER(?)');
      params.push(material);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const rows = await allQuery(
      `SELECT id, name, material FROM printers ${whereClause} ORDER BY id ASC`,
      params
    );

    res.status(200).json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /printers/:id
 * Retrieves a single printer by ID.
 */
router.get('/:id', validateIdParam('id'), async (req, res, next) => {
  try {
    const printer = await getQuery('SELECT id, name, material FROM printers WHERE id = ?', [
      req.params.id
    ]);

    if (!printer) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `Printer with id ${req.params.id} not found`
      });
    }

    res.status(200).json({
      success: true,
      data: printer
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /printers
 * Creates a new 3D printer.
 */
router.post('/', validatePrinter, async (req, res, next) => {
  try {
    const { name, material } = req.body;
    const result = await runQuery('INSERT INTO printers (name, material) VALUES (?, ?)', [
      name,
      material
    ]);

    const created = await getQuery('SELECT id, name, material FROM printers WHERE id = ?', [
      result.lastID
    ]);

    res.status(201).json({
      success: true,
      message: 'Printer created successfully',
      data: created
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /printers/:id
 * Updates an existing 3D printer.
 */
router.put('/:id', validateIdParam('id'), validatePrinter, async (req, res, next) => {
  try {
    const existing = await getQuery('SELECT id, name, material FROM printers WHERE id = ?', [
      req.params.id
    ]);

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `Printer with id ${req.params.id} not found`
      });
    }

    const { name, material } = req.body;
    await runQuery('UPDATE printers SET name = ?, material = ? WHERE id = ?', [
      name,
      material,
      req.params.id
    ]);

    const updated = await getQuery('SELECT id, name, material FROM printers WHERE id = ?', [
      req.params.id
    ]);

    res.status(200).json({
      success: true,
      message: 'Printer updated successfully',
      data: updated
    });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /printers/:id
 * Deletes a printer if it has no dependent reservations.
 */
router.delete('/:id', validateIdParam('id'), async (req, res, next) => {
  try {
    const existing = await getQuery('SELECT id, name, material FROM printers WHERE id = ?', [
      req.params.id
    ]);

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `Printer with id ${req.params.id} not found`
      });
    }

    await runQuery('DELETE FROM printers WHERE id = ?', [req.params.id]);

    res.status(200).json({
      success: true,
      message: 'Printer deleted successfully',
      data: existing
    });
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT' && err.message.includes('FOREIGN KEY')) {
      return res.status(409).json({
        success: false,
        error: 'Conflict',
        message: 'Cannot delete printer because it has existing reservations'
      });
    }
    next(err);
  }
});

module.exports = router;
