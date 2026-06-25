const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres:8796700769ttz@db.opgvkocbpnvutoagyfhc.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function wipe() {
  await client.connect();
  try {
    const tablesToWipe = [
      'activities',
      'notifications',
      'attendance',
      'payments',
      'members',
      'expenses',
      'visitors',
      'leads',
      'whatsapp_logs',
      'trainers'
    ];
    
    // TRUNCATE with CASCADE to handle foreign key dependencies automatically
    await client.query(`TRUNCATE TABLE ${tablesToWipe.join(', ')} RESTART IDENTITY CASCADE`);
    
    console.log('Successfully wiped all transactional data (members, payments, expenses, attendance, activities, etc).');
  } catch (e) {
    console.error('Error wiping data:', e);
  } finally {
    await client.end();
  }
}

wipe();
