const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres:8796700769ttz@db.opgvkocbpnvutoagyfhc.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});
async function fix() {
  await client.connect();
  try {
    await client.query("ALTER TABLE expenses DROP CONSTRAINT IF EXISTS expenses_category_check");
    console.log('Constraint expenses_category_check dropped completely.');
  } catch (e) {
    console.error(e);
  } finally {
    await client.end();
  }
}
fix();
