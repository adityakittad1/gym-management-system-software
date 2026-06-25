const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres:8796700769ttz@db.opgvkocbpnvutoagyfhc.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});
async function check() {
  await client.connect();
  try {
    const memberId = '24956e5b-c818-4d4c-be48-c12603eda8fc';
    const checkInTime = new Date().toISOString();
    
    // First test inserting attendance
    try {
      await client.query('INSERT INTO attendance (member_id, date, check_in_time, status) VALUES ($1, $2, $3, $4)', [memberId, '2026-06-25', checkInTime, 'present']);
      console.log('Attendance inserted.');
    } catch(err) {
      console.error('ATTENDANCE ERROR:', err.message, err.position, err.code);
    }
    
    // Then test inserting activities
    try {
      await client.query('INSERT INTO activities (type, member_id, name, action, time) VALUES ($1, $2, $3, $4, $5)', ['attendance', memberId, 'AK', 'checked in', 'Just now']);
      console.log('Activity inserted.');
    } catch(err) {
      console.error('ACTIVITY ERROR:', err.message, err.position, err.code);
    }
  } finally {
    await client.end();
  }
}
check();
