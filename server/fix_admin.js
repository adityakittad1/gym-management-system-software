const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres:8796700769ttz@db.opgvkocbpnvutoagyfhc.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  const { rows } = await client.query('SELECT id, email FROM auth.users WHERE email = $1', ['admin@ttz.com']);
  if (rows.length === 0) {
    console.log('User not found in auth.users');
    return;
  }
  const authId = rows[0].id;
  
  await client.query(`
    INSERT INTO public.users (auth_user_id, name, email, role)
    VALUES ($1, 'Admin', 'admin@ttz.com', 'Super Admin')
    ON CONFLICT (email) DO UPDATE SET auth_user_id = EXCLUDED.auth_user_id;
  `, [authId]);
  console.log('Inserted admin into public.users');
  await client.end();
}
run();
