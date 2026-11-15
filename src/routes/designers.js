const express = require('express');
const { runQuery, getQuery, allQuery } = require('../utils/dbHelpers');
const { validateIdParam, validateDesigner } = require('../middleware/validate');

const router = express.Router();

/**
 * GET /designers
 * Lists all designers, with optional ?search= or ?q= query filtering.
 */
router.get('/', async (req, res, next) => {
  try {
    const search = (req.query.search || req.query.q || '').trim();

    let rows;
    if (search) {
      const pattern = `%${search}%`;
      rows = await allQuery(
        'SELECT id, name, email FROM designers WHERE name LIKE ? OR email LIKE ? ORDER BY id ASC',
        [pattern, pattern]
      );
    } else {
      rows = await allQuery('SELECT id, name, email FROM designers ORDER BY id ASC');
    }

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
 * GET /designers/:id
 * Retrieves a single designer by ID.
 */
router.get('/:id', validateIdParam('id'), async (req, res, next) => {
  try {
    const designer = await getQuery('SELECT id, name, email FROM designers WHERE id = ?', [
      req.params.id
    ]);

    if (!designer) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `Designer with id ${req.params.id} not found`
      });
    }

    res.status(200).json({
      success: true,
      data: designer
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /designers
 * Creates a new designer.
 */
router.post('/', validateDesigner, async (req, res, next) => {
  try {
    const { name, email } = req.body;
    const result = await runQuery('INSERT INTO designers (name, email) VALUES (?, ?)', [
      name,
      email
    ]);

    const created = await getQuery('SELECT id, name, email FROM designers WHERE id = ?', [
      result.lastID
    ]);

    res.status(201).json({
      success: true,
      message: 'Designer created successfully',
      data: created
    });
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT' && err.message.includes('UNIQUE')) {
      return res.status(409).json({
        success: false,
        error: 'Conflict',
        message: `A designer with email '${req.body.email}' already exists`
      });
    }
    next(err);
  }
});

/**
 * PUT /designers/:id
 * Updates an existing designer.
 */
router.put('/:id', validateIdParam('id'), validateDesigner, async (req, res, next) => {
  try {
    const existing = await getQuery('SELECT id, name, email FROM designers WHERE id = ?', [
      req.params.id
    ]);

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `Designer with id ${req.params.id} not found`
      });
    }

    const { name, email } = req.body;
    await runQuery('UPDATE designers SET name = ?, email = ? WHERE id = ?', [
      name,
      email,
      req.params.id
    ]);

    const updated = await getQuery('SELECT id, name, email FROM designers WHERE id = ?', [
      req.params.id
    ]);

    res.status(200).json({
      success: true,
      message: 'Designer updated successfully',
      data: updated
    });
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT' && err.message.includes('UNIQUE')) {
      return res.status(409).json({
        success: false,
        error: 'Conflict',
        message: `A designer with email '${req.body.email}' already exists`
      });
    }
    next(err);
  }
});

/**
 * DELETE /designers/:id
 * Deletes a designer if they have no dependent reservations.
 */
router.delete('/:id', validateIdParam('id'), async (req, res, next) => {
  try {
    const existing = await getQuery('SELECT id, name, email FROM designers WHERE id = ?', [
      req.params.id
    ]);

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `Designer with id ${req.params.id} not found`
      });
    }

    await runQuery('DELETE FROM designers WHERE id = ?', [req.params.id]);

    res.status(200).json({
      success: true,
      message: 'Designer deleted successfully',
      data: existing
    });
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT' && err.message.includes('FOREIGN KEY')) {
      return res.status(409).json({
        success: false,
        error: 'Conflict',
        message: 'Cannot delete designer because they have existing reservations'
      });
    }
    next(err);
  }
});

module.exports = router;
