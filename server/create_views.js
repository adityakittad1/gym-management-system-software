const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres:8796700769ttz@db.opgvkocbpnvutoagyfhc.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function createViews() {
  await client.connect();
  console.log('Connected');

  try {
    await client.query(`ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS notes TEXT;`);
    await client.query(`ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;`);
    await client.query(`ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS notes TEXT;`);
    await client.query(`ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS check_out_time TEXT;`);
    await client.query(`ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;`);
    await client.query(`ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS attendance_method TEXT DEFAULT 'manual';`);
    await client.query(`ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS marked_by UUID;`);
    await client.query(`DROP VIEW IF EXISTS public.payments_view CASCADE;`);
    await client.query(`
      CREATE OR REPLACE VIEW public.payments_view AS
      SELECT
        p.id,
        p.member_id,
        m.name          AS member_name,
        m.phone         AS member_phone,
        p.amount,
        p.plan_type     AS plan,
        p.payment_date  AS date,
        p.method,
        p.status,
        p.notes,
        p.invoice_number,
        p.receipt_number,
        p.transaction_id,
        p.payment_reference,
        p.payment_gateway,
        p.discount,
        p.tax,
        p.subtotal,
        p.final_amount,
        p.collected_by,
        p.remarks,
        p.created_at,
        p.updated_at
      FROM public.payments p
      JOIN public.members m ON m.id = p.member_id
      WHERE p.deleted_at IS NULL;
    `);
    console.log('Created payments_view');

    await client.query(`DROP VIEW IF EXISTS public.attendance_view CASCADE;`);
    await client.query(`
      CREATE OR REPLACE VIEW public.attendance_view AS
      SELECT
        a.id,
        a.member_id,
        m.name          AS member_name,
        m.phone         AS member_phone,
        a.date,
        a.check_in_time,
        a.check_out_time,
        a.status,
        a.notes,
        a.attendance_method,
        a.marked_by,
        a.created_at,
        a.updated_at
      FROM public.attendance a
      JOIN public.members m ON m.id = a.member_id
      WHERE m.deleted_at IS NULL;
    `);
    console.log('Created attendance_view');

  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}
createViews();
