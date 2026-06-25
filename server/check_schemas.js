const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres:8796700769ttz@db.opgvkocbpnvutoagyfhc.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});
async function checkSchemas() {
  await client.connect();
  const tables = ['payments', 'attendance', 'workouts', 'diet_plans', 'expenses', 'leads', 'visitors'];
  for(const table of tables) {
    const res = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = $1", [table]);
    console.log(`=== ${table} ===`);
    console.log(res.rows.map(r => r.column_name).join(', '));
  }
  await client.end();
}
checkSchemas();
