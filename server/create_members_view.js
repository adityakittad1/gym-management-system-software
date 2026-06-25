const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres:8796700769ttz@db.opgvkocbpnvutoagyfhc.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});
async function createView() {
  await client.connect();
  console.log('Connected');
  try {
    const query = `
      CREATE OR REPLACE VIEW public.members_view AS
      SELECT
        m.id,
        m.name,
        m.phone,
        m.email,
        m.plan,
        m.plan_id,
        m.join_date,
        m.expiry_date,
        GREATEST(0, (m.expiry_date - CURRENT_DATE)::INTEGER) AS days_remaining,
        CASE
          WHEN m.expiry_date < CURRENT_DATE               THEN 'expired'
          WHEN m.expiry_date <= (CURRENT_DATE + 5)        THEN 'expiring'
          ELSE                                                 'active'
        END AS status,
        m.trainer_id,
        m.weight,
        m.target_weight,
        m.height,
        m.body_fat,
        m.before_image,
        m.after_image,
        m.notes,
        m.gender,
        m.date_of_birth,
        m.address,
        m.emergency_contact,
        m.emergency_contact_name,
        m.blood_group,
        m.medical_conditions,
        m.profile_photo,
        m.is_active,
        m.created_at,
        m.updated_at
      FROM public.members m
      WHERE m.deleted_at IS NULL;
    `;
    await client.query(query);
    console.log('Created members_view');
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}
createView();
