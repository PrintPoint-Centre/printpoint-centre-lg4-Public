const { assert, startTestServer, request } = require('./test-helper');

async function run() {
  const { baseUrl, close } = await startTestServer();
  let createdId = null;

  try {
    console.log('Testing Printers CRUD...');

    // 1. GET all
    const listRes = await request(baseUrl, '/printers');
    assert.strictEqual(listRes.status, 200);
    assert(listRes.body.data.length >= 5, 'Expected at least 5 seeded printers');

    // 2. GET by ID
    const oneRes = await request(baseUrl, '/printers/1');
    assert.strictEqual(oneRes.status, 200);
    assert.strictEqual(oneRes.body.data.id, 1);

    // 3. POST create
    const createRes = await request(baseUrl, '/printers', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test Voron 2.4', material: 'ABS' })
    });
    assert.strictEqual(createRes.status, 201);
    createdId = createRes.body.data.id;
    assert.strictEqual(createRes.body.data.name, 'Test Voron 2.4');

    // 4. PUT update
    const updateRes = await request(baseUrl, `/printers/${createdId}`, {
      method: 'PUT',
      body: JSON.stringify({ name: 'Updated Voron 2.4', material: 'ASA' })
    });
    assert.strictEqual(updateRes.status, 200);
    assert.strictEqual(updateRes.body.data.material, 'ASA');

    // 5. DELETE cleanup
    const deleteRes = await request(baseUrl, `/printers/${createdId}`, {
      method: 'DELETE'
    });
    assert.strictEqual(deleteRes.status, 200);
    createdId = null;

    console.log('PASS: Printers CRUD (GET, POST, PUT, DELETE) verified.');
  } finally {
    if (createdId !== null) {
      await request(baseUrl, `/printers/${createdId}`, { method: 'DELETE' }).catch(() => {});
    }
    await close();
  }
}

run().catch((err) => {
  console.error('FAIL:', err);
  process.exit(1);
});
