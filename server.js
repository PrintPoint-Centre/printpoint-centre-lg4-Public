const express = require('express');
const initDB = require('./src/database/init');

// Import route modules
const designersRouter = require('./src/routes/designers');
const printersRouter = require('./src/routes/printers');
const reservationsRouter = require('./src/routes/reservations');

// Import error handling middleware
const { notFoundHandler, errorHandler } = require('./src/middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse incoming JSON payloads
app.use(express.json());

// 1. Root route - Welcome message for PrintPoint Centre
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to PrintPoint Centre – 3D Printer Reservation Management System API',
    status: 'Server is running smoothly',
    timestamp: new Date().toISOString()
  });
});

// 2. Health check route
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'UP',
    database: 'Connected',
    uptime: `${process.uptime().toFixed(2)}s`,
    timestamp: new Date().toISOString()
  });
});

// 3. Mount modular routers
app.use('/designers', designersRouter);
app.use('/printers', printersRouter);
app.use('/reservations', reservationsRouter);

// 4. Handle 404 for undefined routes
app.use(notFoundHandler);

// 5. Centralized error handling middleware
app.use(errorHandler);

// Initialize database before starting the Express server when executed directly
if (require.main === module) {
  initDB()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`PrintPoint Centre server is running on http://localhost:${PORT}`);
      });
    })
    .catch((err) => {
      console.error('Fatal: Failed to initialize SQLite database:', err);
      process.exit(1);
    });
}

module.exports = app;
