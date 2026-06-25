const fs = require('fs');
const env = fs.readFileSync('../.env', 'utf8');
const url = env.match(/VITE_SUPABASE_URL=(.*)/)[1].trim();
const key = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1].trim();

const headers = {
  'apikey': key,
  'Authorization': `Bearer ${key}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation'
};

async function runE2E() {
  console.log('--- Starting TTZ Gym E2E Production Test ---');
  let memberId;

  // 1. Create Member
  try {
    const res = await fetch(`${url}/rest/v1/members`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: 'E2E Test Member',
        phone: '9999999999',
        plan: 'Monthly',
        status: 'active',
        join_date: new Date().toISOString().split('T')[0],
        expiry_date: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0]
      })
    });
    const data = await res.json();
    memberId = data[0].id;
    console.log('✅ Created Member. ID:', memberId);
  } catch (e) {
    console.error('❌ Failed to create member:', e.message);
  }

  // 2. Add Attendance
  try {
    const res = await fetch(`${url}/rest/v1/attendance`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        member_id: memberId,
        date: new Date().toISOString().split('T')[0],
        status: 'present'
      })
    });
    if (res.ok) console.log('✅ Marked Attendance.');
    else console.log('❌ Failed Attendance:', await res.text());
  } catch (e) {
    console.error('❌ Failed to mark attendance:', e.message);
  }

  // 3. Add Payment
  try {
    const res = await fetch(`${url}/rest/v1/payments`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        member_id: memberId,
        amount: 3000,
        plan: 'Monthly',
        date: new Date().toISOString().split('T')[0],
        status: 'paid',
        method: 'cash'
      })
    });
    if (res.ok) console.log('✅ Added Payment.');
    else console.log('❌ Failed Payment:', await res.text());
  } catch (e) {
    console.error('❌ Failed to add payment:', e.message);
  }

  // 4. Soft Delete Member
  try {
    const res = await fetch(`${url}/rest/v1/members?id=eq.${memberId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        deleted_at: new Date().toISOString()
      })
    });
    if (res.ok) console.log('✅ Soft Deleted Member (Cleanup successful).');
    else console.log('❌ Failed Delete:', await res.text());
  } catch (e) {
    console.error('❌ Failed to delete member:', e.message);
  }

  console.log('--- E2E Production Test Completed ---');
}

runE2E();
