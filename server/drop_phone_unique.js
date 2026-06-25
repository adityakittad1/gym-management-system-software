const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres:8796700769ttz@db.opgvkocbpnvutoagyfhc.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});
async function dropUniquePhone() {
  await client.connect();
  console.log('Connected');
  try {
    // Drop the unique constraint
    await client.query('ALTER TABLE members DROP CONSTRAINT IF EXISTS members_phone_key;');
    console.log('Dropped members_phone_key constraint.');
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}
dropUniquePhone();
