const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres:8796700769ttz@db.opgvkocbpnvutoagyfhc.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});
async function fixMembersSchema() {
  await client.connect();
  console.log('Connected');
  try {
    try {
      await client.query('ALTER TABLE members RENAME COLUMN plan_type TO plan;');
      console.log('Renamed plan_type to plan');
    } catch(e) { console.log('Column plan_type might not exist or already renamed'); }

    const cols = [
      'plan_id VARCHAR(100)',
      'before_image TEXT',
      'after_image TEXT',
      'gender VARCHAR(50)',
      'date_of_birth DATE',
      'emergency_contact VARCHAR(20)',
      'emergency_contact_name VARCHAR(255)',
      'blood_group VARCHAR(10)',
      'medical_conditions TEXT',
      'profile_photo TEXT'
    ];
    for(const col of cols) {
      try {
        await client.query(`ALTER TABLE members ADD COLUMN ${col};`);
        console.log('Added ' + col);
      } catch(e) {
        if(!e.message.includes('already exists')) console.error(e.message);
      }
    }
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}
fixMembersSchema();
