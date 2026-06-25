async function testBackend() {
  try {
    console.log('Testing GET /health...');
    const health = await fetch('http://localhost:5000/health');
    console.log('Health:', health.status, await health.text());
  } catch (e) {
    console.error('GET /health failed:', e.message);
  }

  try {
    console.log('Testing GET /api/whatsapp/status...');
    const status = await fetch('http://localhost:5000/api/whatsapp/status');
    console.log('Status:', status.status, await status.text());
  } catch (e) {
    console.error('GET /api/whatsapp/status failed:', e.message);
  }

  try {
    console.log('Testing POST /api/whatsapp/connect...');
    const connect = await fetch('http://localhost:5000/api/whatsapp/connect', { method: 'POST' });
    console.log('Connect:', connect.status, await connect.text());
  } catch (e) {
    console.error('POST /api/whatsapp/connect failed:', e.message);
  }
}

testBackend();
