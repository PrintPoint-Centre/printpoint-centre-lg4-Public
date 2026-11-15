const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validates that a route parameter is a positive integer.
 */
function validateIdParam(paramName = 'id') {
  return (req, res, next) => {
    const rawValue = req.params[paramName];
    if (!/^\d+$/.test(rawValue) || Number(rawValue) <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: `Invalid ${paramName}: must be a positive integer`
      });
    }
    req.params[paramName] = Number(rawValue);
    next();
  };
}

/**
 * Validates designer creation and update payloads.
 */
function validateDesigner(req, res, next) {
  const { name, email } = req.body || {};

  if (typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: 'Designer name is required and must be a non-empty string'
    });
  }

  if (typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: 'A valid designer email is required'
    });
  }

  req.body.name = name.trim();
  req.body.email = email.trim().toLowerCase();
  next();
}

/**
 * Validates printer creation and update payloads.
 */
function validatePrinter(req, res, next) {
  const { name, material } = req.body || {};

  if (typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: 'Printer name is required and must be a non-empty string'
    });
  }

  if (typeof material !== 'string' || material.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: 'Printer material is required and must be a non-empty string'
    });
  }

  req.body.name = name.trim();
  req.body.material = material.trim();
  next();
}

/**
 * Validates reservation creation and update payloads.
 */
function validateReservation(req, res, next) {
  const { designer_id, printer_id } = req.body || {};

  const designerIdNum = Number(designer_id);
  const printerIdNum = Number(printer_id);

  if (!Number.isInteger(designerIdNum) || designerIdNum <= 0) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: 'designer_id is required and must be a positive integer'
    });
  }

  if (!Number.isInteger(printerIdNum) || printerIdNum <= 0) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: 'printer_id is required and must be a positive integer'
    });
  }

  req.body.designer_id = designerIdNum;
  req.body.printer_id = printerIdNum;
  next();
}

module.exports = {
  validateIdParam,
  validateDesigner,
  validatePrinter,
  validateReservation
};
