const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres:8796700769ttz@db.opgvkocbpnvutoagyfhc.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});
async function check() {
  await client.connect();
  try {
    const tables = ['members', 'payments', 'attendance', 'trainers', 'notifications', 'activities', 'settings', 'expenses', 'leads', 'visitors'];
    for (const table of tables) {
      try {
        await client.query(`ALTER PUBLICATION supabase_realtime ADD TABLE public.${table};`);
        console.log(`Added ${table} to realtime publication.`);
      } catch (err) {
        if (err.code === '42704') {
            console.error(`Error: publication supabase_realtime does not exist!`);
        } else if (err.code === '42704') {
            // Already added
        } else {
            console.error(`Could not add ${table}:`, err.message);
        }
      }
    }
  } finally {
    await client.end();
  }
}
check();
