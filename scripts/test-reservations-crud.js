const { assert, startTestServer, request } = require('./test-helper');

async function run() {
  const { baseUrl, close } = await startTestServer();
  let createdId = null;

  try {
    console.log('Testing Reservations CRUD...');

    // 1. GET all
    const listRes = await request(baseUrl, '/reservations');
    assert.strictEqual(listRes.status, 200);
    assert(listRes.body.data.length >= 10, 'Expected at least 10 seeded reservations');

    // 2. GET by ID
    const oneRes = await request(baseUrl, '/reservations/1');
    assert.strictEqual(oneRes.status, 200);
    assert.strictEqual(oneRes.body.data.id, 1);

    // 3. POST create
    const createRes = await request(baseUrl, '/reservations', {
      method: 'POST',
      body: JSON.stringify({ designer_id: 6, printer_id: 1 })
    });
    assert.strictEqual(createRes.status, 201);
    createdId = createRes.body.data.id;
    assert.strictEqual(createRes.body.data.designer_id, 6);
    assert.strictEqual(createRes.body.data.printer_id, 1);

    // 4. PUT update
    const updateRes = await request(baseUrl, `/reservations/${createdId}`, {
      method: 'PUT',
      body: JSON.stringify({ designer_id: 6, printer_id: 2 })
    });
    assert.strictEqual(updateRes.status, 200);
    assert.strictEqual(updateRes.body.data.printer_id, 2);

    // 5. DELETE cleanup
    const deleteRes = await request(baseUrl, `/reservations/${createdId}`, {
      method: 'DELETE'
    });
    assert.strictEqual(deleteRes.status, 200);
    createdId = null;

    console.log('PASS: Reservations CRUD (GET, POST, PUT, DELETE) verified.');
  } finally {
    if (createdId !== null) {
      await request(baseUrl, `/reservations/${createdId}`, { method: 'DELETE' }).catch(() => {});
    }
    await close();
  }
}

run().catch((err) => {
  console.error('FAIL:', err);
  process.exit(1);
});
