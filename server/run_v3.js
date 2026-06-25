const { Client } = require('pg');
const fs = require('fs');
const client = new Client({
  connectionString: 'postgresql://postgres:8796700769ttz@db.opgvkocbpnvutoagyfhc.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function runV3Migration() {
  await client.connect();
  console.log('Connected');
  try {
    const sql = fs.readFileSync('../supabase_migration_v3.sql', 'utf8');
    await client.query(sql);
    console.log('Successfully ran supabase_migration_v3.sql');
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}
runV3Migration();
