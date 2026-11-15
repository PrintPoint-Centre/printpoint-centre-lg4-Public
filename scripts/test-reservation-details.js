const { assert, startTestServer, request } = require('./test-helper');

async function run() {
  const { baseUrl, close } = await startTestServer();
  try {
    console.log('Testing Reservation Details (JOIN queries)...');

    const detailsRes = await request(baseUrl, '/reservations/details');
    assert.strictEqual(detailsRes.status, 200);
    assert(detailsRes.body.data.length >= 10, 'Expected at least 10 reservation detail rows');

    const first = detailsRes.body.data[0];
    assert(first.designer_name, 'Expected designer_name in joined result');
    assert(first.designer_email, 'Expected designer_email in joined result');
    assert(first.printer_name, 'Expected printer_name in joined result');
    assert(first.printer_material, 'Expected printer_material in joined result');

    const singleRes = await request(baseUrl, '/reservations/1');
    assert.strictEqual(singleRes.status, 200);
    assert(singleRes.body.data.designer_name, 'Expected designer_name on single reservation');
    assert(singleRes.body.data.printer_name, 'Expected printer_name on single reservation');

    console.log('PASS: Reservation details with designer & printer JOIN verified.');
  } finally {
    await close();
  }
}

run().catch((err) => {
  console.error('FAIL:', err);
  process.exit(1);
});
