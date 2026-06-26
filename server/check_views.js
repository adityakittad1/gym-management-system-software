const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://opgvkocbpnvutoagyfhc.supabase.co';
// I will just use the postgres connection string from run_v3.js!
const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres:8796700769ttz@db.opgvkocbpnvutoagyfhc.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function checkViews() {
  await client.connect();
  const res = await client.query(`
    SELECT table_name 
    FROM information_schema.views 
    WHERE table_schema = 'public';
  `);
  console.log('VIEWS:', res.rows);
  await client.end();
}

checkViews();
