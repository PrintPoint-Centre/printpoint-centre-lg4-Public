const { assert, startTestServer, request } = require('./test-helper');

async function run() {
  const { baseUrl, close } = await startTestServer();
  try {
    console.log('Testing Top Three Printers (Member 5)...');

    const res = await request(baseUrl, '/printers/top');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.length, 3, 'Expected exactly 3 top printers');

    for (let i = 0; i < res.body.data.length; i++) {
      const item = res.body.data[i];
      assert(typeof item.reservation_count === 'number', 'Expected reservation_count number');
      if (i > 0) {
        assert(
          res.body.data[i - 1].reservation_count >= item.reservation_count,
          'Expected printers ordered descending by reservation_count'
        );
      }
    }

    const aliasRes = await request(baseUrl, '/printers/top-printers');
    assert.strictEqual(aliasRes.status, 200);
    assert.strictEqual(aliasRes.body.data.length, 3);

    console.log('PASS: Top Three Printers endpoint verified:', res.body.data);
  } finally {
    await close();
  }
}

run().catch((err) => {
  console.error('FAIL:', err);
  process.exit(1);
});
