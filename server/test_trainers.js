const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8');
const url = env.match(/VITE_SUPABASE_URL=(.*)/)[1].trim();
const key = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1].trim();

async function test() {
  // First login to get a valid token
  const loginRes = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { 'apikey': key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@ttz.com', password: 'password123' }) // Assuming typical dev password, but wait!
  });
  
  // Alternatively, just query as anon to see if RLS blocks it
  const res = await fetch(`${url}/rest/v1/trainers?select=*&is_active=eq.true`, {
    method: 'GET',
    headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
  });
  
  console.log('Status:', res.status);
  const data = await res.text();
  console.log('Data:', data);
}
test();
