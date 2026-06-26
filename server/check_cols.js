const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres:8796700769ttz@db.opgvkocbpnvutoagyfhc.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function checkColumns() {
  await client.connect();
  const res = await client.query(`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'payments';
  `);
  console.log('COLUMNS:', res.rows.map(r => r.column_name));
  await client.end();
}

checkColumns();
