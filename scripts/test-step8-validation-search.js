const { assert, startTestServer, request } = require('./test-helper');

async function run() {
  const { baseUrl, close } = await startTestServer();
  try {
    console.log('Testing Validation & Search (Member 4)...');

    // 1. Invalid ID param
    const invalidId = await request(baseUrl, '/designers/abc');
    assert.strictEqual(invalidId.status, 400);

    // 2. Invalid designer payload
    const badDesigner = await request(baseUrl, '/designers', {
      method: 'POST',
      body: JSON.stringify({ name: '', email: 'not-an-email' })
    });
    assert.strictEqual(badDesigner.status, 400);

    // 3. Duplicate email conflict
    const dupDesigner = await request(baseUrl, '/designers', {
      method: 'POST',
      body: JSON.stringify({ name: 'Rahul Clone', email: 'rahul@example.com' })
    });
    assert.strictEqual(dupDesigner.status, 409);

    // 4. Invalid printer payload
    const badPrinter = await request(baseUrl, '/printers', {
      method: 'POST',
      body: JSON.stringify({ name: 'Ender', material: '' })
    });
    assert.strictEqual(badPrinter.status, 400);

    // 5. Invalid reservation foreign key
    const badFk = await request(baseUrl, '/reservations', {
      method: 'POST',
      body: JSON.stringify({ designer_id: 99999, printer_id: 1 })
    });
    assert.strictEqual(badFk.status, 404);

    // 6. Foreign key delete protection
    const fkDelete = await request(baseUrl, '/designers/1', { method: 'DELETE' });
    assert.strictEqual(fkDelete.status, 409);

    // 7. Search designers
    const searchDesigners = await request(baseUrl, '/designers?search=Rahul');
    assert.strictEqual(searchDesigners.status, 200);
    assert(searchDesigners.body.data.some((d) => d.name === 'Rahul'));

    // 8. Search & filter printers
    const searchPrinters = await request(baseUrl, '/printers?material=PLA');
    assert.strictEqual(searchPrinters.status, 200);
    assert(searchPrinters.body.data.length >= 2);
    assert(searchPrinters.body.data.every((p) => p.material === 'PLA'));

    // 9. Search & filter reservations
    const searchReservations = await request(baseUrl, '/reservations?designer_id=1');
    assert.strictEqual(searchReservations.status, 200);
    assert(searchReservations.body.data.every((r) => r.designer_id === 1));

    console.log('PASS: All validation and search checks verified.');
  } finally {
    await close();
  }
}

run().catch((err) => {
  console.error('FAIL:', err);
  process.exit(1);
});
