const express = require('express');
const { runQuery, getQuery, allQuery } = require('../utils/dbHelpers');
const { validateIdParam, validateReservation } = require('../middleware/validate');

const router = express.Router();

const RESERVATION_DETAILS_SQL = `
  SELECT
    r.id,
    r.designer_id,
    d.name AS designer_name,
    d.email AS designer_email,
    r.printer_id,
    p.name AS printer_name,
    p.material AS printer_material,
    r.created_at
  FROM reservations r
  INNER JOIN designers d ON r.designer_id = d.id
  INNER JOIN printers p ON r.printer_id = p.id
`;

/**
 * Shared handler for listing reservations with optional search/filter parameters.
 */
async function listReservationsWithDetails(req, res, next) {
  try {
    const search = (req.query.search || req.query.q || '').trim();
    const designerId = req.query.designer_id ? Number(req.query.designer_id) : null;
    const printerId = req.query.printer_id ? Number(req.query.printer_id) : null;

    const conditions = [];
    const params = [];

    if (designerId !== null) {
      if (!Number.isInteger(designerId) || designerId <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: 'designer_id filter must be a positive integer'
        });
      }
      conditions.push('r.designer_id = ?');
      params.push(designerId);
    }

    if (printerId !== null) {
      if (!Number.isInteger(printerId) || printerId <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: 'printer_id filter must be a positive integer'
        });
      }
      conditions.push('r.printer_id = ?');
      params.push(printerId);
    }

    if (search) {
      const pattern = `%${search}%`;
      conditions.push(
        '(d.name LIKE ? OR d.email LIKE ? OR p.name LIKE ? OR p.material LIKE ?)'
      );
      params.push(pattern, pattern, pattern, pattern);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const rows = await allQuery(
      `${RESERVATION_DETAILS_SQL} ${whereClause} ORDER BY r.id ASC`,
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
}

/**
 * GET /reservations/details
 * Returns all reservations joined with designer and printer information.
 */
router.get('/details', listReservationsWithDetails);

/**
 * GET /reservations
 * Lists all reservations (with joined details and optional ?designer_id=, ?printer_id=, ?search=).
 */
router.get('/', listReservationsWithDetails);

/**
 * GET /reservations/:id
 * Retrieves a single reservation with joined designer and printer details.
 */
router.get('/:id', validateIdParam('id'), async (req, res, next) => {
  try {
    const reservation = await getQuery(`${RESERVATION_DETAILS_SQL} WHERE r.id = ?`, [
      req.params.id
    ]);

    if (!reservation) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `Reservation with id ${req.params.id} not found`
      });
    }

    res.status(200).json({
      success: true,
      data: reservation
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /reservations
 * Creates a new reservation after verifying designer_id and printer_id exist.
 */
router.post('/', validateReservation, async (req, res, next) => {
  try {
    const { designer_id, printer_id } = req.body;

    const [designer, printer] = await Promise.all([
      getQuery('SELECT id FROM designers WHERE id = ?', [designer_id]),
      getQuery('SELECT id FROM printers WHERE id = ?', [printer_id])
    ]);

    if (!designer) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `Designer with id ${designer_id} not found`
      });
    }

    if (!printer) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `Printer with id ${printer_id} not found`
      });
    }

    const result = await runQuery(
      'INSERT INTO reservations (designer_id, printer_id) VALUES (?, ?)',
      [designer_id, printer_id]
    );

    const created = await getQuery(`${RESERVATION_DETAILS_SQL} WHERE r.id = ?`, [
      result.lastID
    ]);

    res.status(201).json({
      success: true,
      message: 'Reservation created successfully',
      data: created
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /reservations/:id
 * Updates an existing reservation after verifying referenced designer and printer exist.
 */
router.put('/:id', validateIdParam('id'), validateReservation, async (req, res, next) => {
  try {
    const existing = await getQuery('SELECT id FROM reservations WHERE id = ?', [req.params.id]);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `Reservation with id ${req.params.id} not found`
      });
    }

    const { designer_id, printer_id } = req.body;
    const [designer, printer] = await Promise.all([
      getQuery('SELECT id FROM designers WHERE id = ?', [designer_id]),
      getQuery('SELECT id FROM printers WHERE id = ?', [printer_id])
    ]);

    if (!designer) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `Designer with id ${designer_id} not found`
      });
    }

    if (!printer) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `Printer with id ${printer_id} not found`
      });
    }

    await runQuery('UPDATE reservations SET designer_id = ?, printer_id = ? WHERE id = ?', [
      designer_id,
      printer_id,
      req.params.id
    ]);

    const updated = await getQuery(`${RESERVATION_DETAILS_SQL} WHERE r.id = ?`, [
      req.params.id
    ]);

    res.status(200).json({
      success: true,
      message: 'Reservation updated successfully',
      data: updated
    });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /reservations/:id
 * Deletes an existing reservation.
 */
router.delete('/:id', validateIdParam('id'), async (req, res, next) => {
  try {
    const existing = await getQuery(`${RESERVATION_DETAILS_SQL} WHERE r.id = ?`, [
      req.params.id
    ]);

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `Reservation with id ${req.params.id} not found`
      });
    }

    await runQuery('DELETE FROM reservations WHERE id = ?', [req.params.id]);

    res.status(200).json({
      success: true,
      message: 'Reservation deleted successfully',
      data: existing
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
