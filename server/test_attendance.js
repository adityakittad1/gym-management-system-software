const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres:8796700769ttz@db.opgvkocbpnvutoagyfhc.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});
async function check() {
  await client.connect();
  try {
    const res = await client.query("SELECT * FROM pg_rules WHERE tablename = 'attendance';");
    console.log('RULES:', res.rows);
    
    // Check triggers properly
    const trig = await client.query("SELECT trigger_name, event_manipulation, action_statement FROM information_schema.triggers WHERE event_object_table = 'attendance';");
    console.log('TRIGGERS:', trig.rows);
  } catch(e) {
    console.error('ERROR:', e.message);
  } finally {
    await client.end();
  }
}
check();
