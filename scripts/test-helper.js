const assert = require('assert');
const app = require('../server');
const initDB = require('../src/database/init');
const db = require('../src/database/connection');

/**
 * Starts the Express app on an ephemeral localhost port after initializing the DB.
 * Returns `{ baseUrl, close }`.
 */
async function startTestServer() {
  await initDB();
  return new Promise((resolve, reject) => {
    const server = app.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve({
        baseUrl: `http://127.0.0.1:${port}`,
        close: () =>
          new Promise((res) => {
            if (typeof server.closeAllConnections === 'function') {
              server.closeAllConnections();
            }
            server.close(() => {
              db.close(() => res());
            });
          })
      });
    });
    server.on('error', reject);
  });
}

/**
 * Sends a JSON HTTP request and returns `{ status, body }`.
 */
async function request(baseUrl, path, options = {}) {
  const res = await fetch(`${baseUrl}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  });
  const body = await res.json();
  return { status: res.status, body };
}

module.exports = {
  assert,
  startTestServer,
  request
};
