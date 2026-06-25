const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres:8796700769ttz@db.opgvkocbpnvutoagyfhc.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});
async function fix() {
  await client.connect();
  try {
    // 1. Fix payments status check
    await client.query("ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_status_check");
    await client.query("ALTER TABLE payments ADD CONSTRAINT payments_status_check CHECK (LOWER(status) IN ('paid', 'pending', 'partial', 'refunded', 'failed'))");
    console.log('Constraint payments_status_check updated.');

    // 2. Clear all expenses
    await client.query("TRUNCATE TABLE expenses RESTART IDENTITY");
    console.log('Expenses table cleared completely.');
  } catch (e) {
    console.error(e);
  } finally {
    await client.end();
  }
}
fix();
