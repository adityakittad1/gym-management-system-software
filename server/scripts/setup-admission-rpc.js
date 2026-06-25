const { Client } = require('pg');
const fs = require('fs');

async function setup() {
  const client = new Client({
    connectionString: 'postgresql://postgres:8796700769ttz@db.opgvkocbpnvutoagyfhc.supabase.co:5432/postgres',
    ssl: { rejectUnauthorized: false }
  });

  const sql = `
CREATE OR REPLACE FUNCTION admit_member(
  p_member_data jsonb,
  p_payment_data jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_member_id uuid;
  v_payment_id uuid;
  v_result jsonb;
BEGIN
  -- 1. Insert Member
  INSERT INTO members (
    name, phone, plan, join_date, expiry_date, trainer_id, 
    weight, target_weight, height, body_fat, before_image, after_image, status
  )
  VALUES (
    p_member_data->>'name',
    p_member_data->>'phone',
    p_member_data->>'plan',
    (p_member_data->>'joinDate')::date,
    (p_member_data->>'expiryDate')::date,
    NULLIF((p_member_data->>'trainerId'), '')::uuid,
    NULLIF((p_member_data->>'weight'), '')::numeric,
    NULLIF((p_member_data->>'targetWeight'), '')::numeric,
    NULLIF((p_member_data->>'height'), '')::numeric,
    NULLIF((p_member_data->>'bodyFat'), '')::numeric,
    p_member_data->>'beforeImage',
    p_member_data->>'afterImage',
    'active'
  )
  RETURNING id INTO v_member_id;

  -- 2. Insert Payment
  INSERT INTO payments (
    member_id, amount, plan_type, payment_date, method, status, 
    invoice_number, receipt_number, discount, tax, subtotal, final_amount, remarks
  )
  VALUES (
    v_member_id,
    (p_payment_data->>'amount')::numeric,
    p_payment_data->>'plan',
    (p_payment_data->>'date')::date,
    p_payment_data->>'method',
    p_payment_data->>'status',
    p_payment_data->>'invoiceNumber',
    p_payment_data->>'receiptNumber',
    COALESCE(NULLIF(p_payment_data->>'discount', ''), '0')::numeric,
    COALESCE(NULLIF(p_payment_data->>'tax', ''), '0')::numeric,
    COALESCE(NULLIF(p_payment_data->>'subtotal', ''), (p_payment_data->>'amount'))::numeric,
    COALESCE(NULLIF(p_payment_data->>'finalAmount', ''), (p_payment_data->>'amount'))::numeric,
    p_payment_data->>'remarks'
  )
  RETURNING id INTO v_payment_id;

  v_result := jsonb_build_object(
    'member_id', v_member_id,
    'payment_id', v_payment_id
  );

  RETURN v_result;
END;
$$;
`;

  try {
    await client.connect();
    await client.query(sql);
    console.log('Successfully injected admit_member RPC!');
  } catch(e) {
    console.error('Error injecting RPC:', e);
  } finally {
    await client.end();
  }
}

setup();
