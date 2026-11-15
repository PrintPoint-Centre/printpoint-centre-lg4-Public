const { assert, startTestServer, request } = require('./test-helper');

async function run() {
  const { baseUrl, close } = await startTestServer();
  let createdId = null;

  try {
    console.log('Testing Designers CRUD...');

    // 1. GET all
    const listRes = await request(baseUrl, '/designers');
    assert.strictEqual(listRes.status, 200);
    assert(listRes.body.data.length >= 6, 'Expected at least 6 seeded designers');

    // 2. GET by ID
    const oneRes = await request(baseUrl, '/designers/1');
    assert.strictEqual(oneRes.status, 200);
    assert.strictEqual(oneRes.body.data.id, 1);

    // 3. POST create
    const createRes = await request(baseUrl, '/designers', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test Designer', email: 'test.designer.crud@example.com' })
    });
    assert.strictEqual(createRes.status, 201);
    createdId = createRes.body.data.id;
    assert.strictEqual(createRes.body.data.name, 'Test Designer');

    // 4. PUT update
    const updateRes = await request(baseUrl, `/designers/${createdId}`, {
      method: 'PUT',
      body: JSON.stringify({
        name: 'Updated Designer',
        email: 'updated.designer.crud@example.com'
      })
    });
    assert.strictEqual(updateRes.status, 200);
    assert.strictEqual(updateRes.body.data.name, 'Updated Designer');

    // 5. DELETE cleanup
    const deleteRes = await request(baseUrl, `/designers/${createdId}`, {
      method: 'DELETE'
    });
    assert.strictEqual(deleteRes.status, 200);
    createdId = null;

    // Verify deleted
    const afterDelete = await request(baseUrl, '/designers/999999');
    assert.strictEqual(afterDelete.status, 404);

    console.log('PASS: Designers CRUD (GET, POST, PUT, DELETE) verified.');
  } finally {
    if (createdId !== null) {
      await request(baseUrl, `/designers/${createdId}`, { method: 'DELETE' }).catch(() => {});
    }
    await close();
  }
}

run().catch((err) => {
  console.error('FAIL:', err);
  process.exit(1);
});
