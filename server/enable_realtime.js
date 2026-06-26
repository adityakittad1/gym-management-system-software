const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres:8796700769ttz@db.opgvkocbpnvutoagyfhc.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function enableRealtime() {
  await client.connect();
  try {
    // Add tables to supabase_realtime publication
    await client.query(`
      begin;
      drop publication if exists supabase_realtime;
      create publication supabase_realtime;
      commit;
      alter publication supabase_realtime add table members, payments, expenses, attendance, trainers;
    `);
    console.log('Realtime enabled for tables.');
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

enableRealtime();
