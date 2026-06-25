const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres:8796700769ttz@db.opgvkocbpnvutoagyfhc.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});
async function check() {
  await client.connect();
  try {
    const res = await client.query("SELECT tablename FROM pg_publication_tables WHERE pubname = 'supabase_realtime';");
    console.log('REALTIME TABLES:', res.rows);
  } catch(e) {
    console.error('ERROR:', e.message);
  } finally {
    await client.end();
  }
}
check();
