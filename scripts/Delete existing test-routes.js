const { assert, startTestServer, request } = require('./test-helper');

async function run() {
  const { baseUrl, close } = await startTestServer();
  try {
    console.log('Testing core routes...');

    const root = await request(baseUrl, '/');
    assert.strictEqual(root.status, 200);
    assert.strictEqual(root.body.success, true);

    const health = await request(baseUrl, '/health');
    assert.strictEqual(health.status, 200);
    assert.strictEqual(health.body.status, 'UP');

    const designers = await request(baseUrl, '/designers');
    assert.strictEqual(designers.status, 200);
    assert.strictEqual(designers.body.success, true);

    const printers = await request(baseUrl, '/printers');
    assert.strictEqual(printers.status, 200);
    assert.strictEqual(printers.body.success, true);

    const reservations = await request(baseUrl, '/reservations');
    assert.strictEqual(reservations.status, 200);
    assert.strictEqual(reservations.body.success, true);

    const notFound = await request(baseUrl, '/non-existent-route');
    assert.strictEqual(notFound.status, 404);
    assert.strictEqual(notFound.body.success, false);

    console.log('PASS: All core routes and 404 handler verified.');
  } finally {
    await close();
  }
}

run().catch((err) => {
  console.error('FAIL:', err);
  process.exit(1);
});
