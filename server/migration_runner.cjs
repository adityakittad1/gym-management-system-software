// TTZ Gym – Full Production Migration Runner (CommonJS)
// Run from: server/ directory with: node migration_runner.cjs

const { Client } = require('pg');

const CONNECTION_STRING = 'postgresql://postgres:8796700769ttz@db.opgvkocbpnvutoagyfhc.supabase.co:5432/postgres';

const client = new Client({
  connectionString: CONNECTION_STRING,
  ssl: { rejectUnauthorized: false }
});

const log = (msg) => console.log(msg);
const err = (msg, e) => console.error(`❌ ${msg}`, e ? e.message : '');

async function query(sql, desc) {
  try {
    const result = await client.query(sql);
    log(`  ✅ ${desc}`);
    return result;
  } catch (e) {
    err(`FAILED – ${desc}`, e);
    throw e;
  }
}

async function verifyTable(name) {
  const res = await client.query(
    `SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name=$1`,
    [name]
  );
  if (res.rowCount === 0) throw new Error(`Table "${name}" does NOT exist after creation!`);
  log(`  🔎 Verified: ${name}`);
}

// ──────────────────────────────────────────────
// TABLE DEFINITIONS
// ──────────────────────────────────────────────
const tableSQL = {
  settings: `
    CREATE TABLE settings (
      key         VARCHAR(255) PRIMARY KEY,
      value       JSONB NOT NULL,
      description TEXT,
      updated_by  UUID,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );`,
  trainers: `
    CREATE TABLE trainers (
      id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name         VARCHAR(255) NOT NULL,
      specialty    VARCHAR(255),
      phone        VARCHAR(20) UNIQUE NOT NULL,
      email        VARCHAR(255) UNIQUE,
      experience   TEXT,
      availability TEXT,
      is_active    BOOLEAN NOT NULL DEFAULT true,
      deleted_at   TIMESTAMPTZ,
      created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX idx_trainers_is_active ON trainers(is_active);`,
  members: `
    CREATE TABLE members (
      id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name           VARCHAR(255) NOT NULL,
      phone          VARCHAR(20) UNIQUE NOT NULL,
      email          VARCHAR(255),
      join_date      DATE NOT NULL DEFAULT CURRENT_DATE,
      plan_type      VARCHAR(100) NOT NULL,
      expiry_date    DATE NOT NULL,
      status         VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active','expiring','expired')),
      trainer_id     UUID REFERENCES trainers(id) ON DELETE SET NULL,
      weight         NUMERIC(5,2),
      target_weight  NUMERIC(5,2),
      height         NUMERIC(5,2),
      body_fat       NUMERIC(5,2),
      notes          TEXT,
      is_active      BOOLEAN NOT NULL DEFAULT true,
      deleted_at     TIMESTAMPTZ,
      created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX idx_members_status  ON members(status);
    CREATE INDEX idx_members_phone   ON members(phone);
    CREATE INDEX idx_members_expiry  ON members(expiry_date);`,
  attendance: `
    CREATE TABLE attendance (
      id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      member_id     UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
      date          DATE NOT NULL DEFAULT CURRENT_DATE,
      check_in_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      status        VARCHAR(50) NOT NULL DEFAULT 'present' CHECK (status IN ('present','absent','late')),
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(member_id, date)
    );
    CREATE INDEX idx_attendance_date   ON attendance(date);
    CREATE INDEX idx_attendance_member ON attendance(member_id);`,
  payments: `
    CREATE TABLE payments (
      id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      member_id      UUID NOT NULL REFERENCES members(id) ON DELETE RESTRICT,
      amount         NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
      plan_type      VARCHAR(100) NOT NULL,
      method         VARCHAR(50) NOT NULL,
      status         VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','failed','refunded')),
      transaction_id VARCHAR(255),
      payment_date   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX idx_payments_member ON payments(member_id);
    CREATE INDEX idx_payments_status ON payments(status);`,
  workouts: `
    CREATE TABLE workouts (
      id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      member_id  UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
      trainer_id UUID REFERENCES trainers(id) ON DELETE SET NULL,
      title      VARCHAR(255) NOT NULL,
      schedule   JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX idx_workouts_member ON workouts(member_id);`,
  diet_plans: `
    CREATE TABLE diet_plans (
      id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      member_id  UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
      trainer_id UUID REFERENCES trainers(id) ON DELETE SET NULL,
      title      VARCHAR(255) NOT NULL,
      schedule   JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX idx_diet_plans_member ON diet_plans(member_id);`,
  expenses: `
    CREATE TABLE expenses (
      id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      category     VARCHAR(100) NOT NULL,
      amount       NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
      expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
      notes        TEXT,
      receipt_url  TEXT,
      created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX idx_expenses_date ON expenses(expense_date);`,
  leads: `
    CREATE TABLE leads (
      id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name             VARCHAR(255) NOT NULL,
      phone            VARCHAR(20) NOT NULL,
      email            VARCHAR(255),
      source           VARCHAR(100),
      stage            VARCHAR(50) NOT NULL DEFAULT 'new' CHECK (stage IN ('new','contacted','trial','converted','lost')),
      interested_plan  VARCHAR(100),
      follow_up_date   DATE,
      notes            TEXT,
      created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX idx_leads_stage ON leads(stage);`,
  visitors: `
    CREATE TABLE visitors (
      id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name           VARCHAR(255) NOT NULL,
      phone          VARCHAR(20) NOT NULL,
      purpose        VARCHAR(255) NOT NULL,
      trial_date     DATE,
      follow_up_date DATE,
      created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );`,
  notifications: `
    CREATE TABLE notifications (
      id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title      VARCHAR(255) NOT NULL,
      message    TEXT NOT NULL,
      category   VARCHAR(50) NOT NULL DEFAULT 'system',
      is_read    BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX idx_notifications_is_read ON notifications(is_read);`,
  activities: `
    CREATE TABLE activities (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      type        VARCHAR(100) NOT NULL,
      description TEXT NOT NULL,
      entity_id   UUID,
      entity_type VARCHAR(100),
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX idx_activities_type ON activities(type);`,
  audit_logs: `
    CREATE TABLE audit_logs (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      action_type VARCHAR(100) NOT NULL,
      entity_id   UUID NOT NULL,
      table_name  VARCHAR(100) NOT NULL,
      old_data    JSONB,
      new_data    JSONB,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX idx_audit_logs_action ON audit_logs(action_type);
    CREATE INDEX idx_audit_logs_table  ON audit_logs(table_name);`,
  whatsapp_sessions: `
    CREATE TABLE whatsapp_sessions (
      id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      session_name VARCHAR(100) UNIQUE NOT NULL,
      status       VARCHAR(50) NOT NULL DEFAULT 'disconnected',
      phone_number VARCHAR(20),
      profile_name VARCHAR(255),
      connected_at TIMESTAMPTZ,
      last_sync    TIMESTAMPTZ,
      created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );`,
  whatsapp_templates: `
    CREATE TABLE whatsapp_templates (
      id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name      VARCHAR(100) UNIQUE NOT NULL,
      content   TEXT NOT NULL,
      variables JSONB,
      category  VARCHAR(50) NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );`,
  whatsapp_logs: `
    CREATE TABLE whatsapp_logs (
      id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      recipient_phone VARCHAR(20) NOT NULL,
      member_id       UUID REFERENCES members(id) ON DELETE SET NULL,
      message_type    VARCHAR(50) NOT NULL,
      content         TEXT NOT NULL,
      status          VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent','delivered','read','failed')),
      error_reason    TEXT,
      sent_at         TIMESTAMPTZ,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX idx_wa_logs_status ON whatsapp_logs(status);`,
  automation_rules: `
    CREATE TABLE automation_rules (
      id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name         VARCHAR(255) NOT NULL,
      trigger_type VARCHAR(100) NOT NULL,
      conditions   JSONB,
      actions      JSONB NOT NULL,
      is_active    BOOLEAN NOT NULL DEFAULT true,
      last_run_at  TIMESTAMPTZ,
      created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );`,
  message_queue: `
    CREATE TABLE message_queue (
      id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      recipient_phone VARCHAR(20) NOT NULL,
      content        TEXT NOT NULL,
      scheduled_for  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      status         VARCHAR(50) NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','processing','completed','failed')),
      attempts       INTEGER NOT NULL DEFAULT 0,
      max_attempts   INTEGER NOT NULL DEFAULT 3,
      error_log      TEXT,
      created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX idx_msg_queue_status ON message_queue(status, scheduled_for);`,
  delivery_history: `
    CREATE TABLE delivery_history (
      id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      campaign_name         VARCHAR(255),
      total_recipients      INTEGER NOT NULL,
      successful_deliveries INTEGER NOT NULL DEFAULT 0,
      failed_deliveries     INTEGER NOT NULL DEFAULT 0,
      execution_time        NUMERIC(10,2),
      created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );`
};

// Tables to DROP (in reverse FK order), then CREATE in forward order
const tablesToDrop = [
  'delivery_history','message_queue','automation_rules','whatsapp_logs',
  'whatsapp_templates','whatsapp_sessions','audit_logs','activities',
  'notifications','visitors','leads','expenses','diet_plans','workouts',
  'payments','attendance','members','trainers','settings'
];

const tablesToCreate = [
  'settings','trainers','members','attendance','payments',
  'workouts','diet_plans','expenses','leads','visitors',
  'notifications','activities','audit_logs','whatsapp_sessions',
  'whatsapp_templates','whatsapp_logs','automation_rules',
  'message_queue','delivery_history'
];

const realtimeTables = ['members','attendance','notifications','whatsapp_logs','message_queue'];

async function main() {
  log('\n═══════════════════════════════════════════════');
  log(' TTZ Gym – Production Database Migration');
  log('═══════════════════════════════════════════════\n');

  await client.connect();
  log('🔗 Connected to Supabase PostgreSQL\n');

  // ── Verify connection
  const ping = await client.query('SELECT NOW() AS ts');
  log(`⏱  Server time: ${ping.rows[0].ts}\n`);

  // ── Step 1: Drop old TTZ tables
  log('━━━ STEP 1: Drop existing TTZ tables ━━━');
  for (const t of tablesToDrop) {
    await query(`DROP TABLE IF EXISTS ${t} CASCADE;`, `DROP ${t}`);
  }

  // ── Step 2: Create updated_at trigger function
  log('\n━━━ STEP 2: Create updated_at trigger function ━━━');
  await query(`
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
    $$ LANGUAGE plpgsql;
  `, 'Function update_updated_at_column');

  // ── Step 3: Create each table and verify
  log('\n━━━ STEP 3: Create tables (one-by-one) ━━━');
  for (const t of tablesToCreate) {
    log(`\n  → Creating: ${t}`);
    await query(tableSQL[t], `CREATE TABLE ${t}`);
    await verifyTable(t);
  }

  // ── Step 4: Enable Realtime (REPLICA IDENTITY FULL)
  log('\n━━━ STEP 4: Enable Realtime ━━━');
  for (const t of realtimeTables) {
    await query(`ALTER TABLE ${t} REPLICA IDENTITY FULL;`, `REPLICA IDENTITY FULL on ${t}`);
  }

  // ── Step 5: Enable RLS
  log('\n━━━ STEP 5: Enable Row Level Security ━━━');
  for (const t of tablesToCreate) {
    await query(`ALTER TABLE ${t} ENABLE ROW LEVEL SECURITY;`, `RLS enabled on ${t}`);
    await query(
      `CREATE POLICY "auth_users_all_${t}" ON ${t} FOR ALL TO authenticated USING (true) WITH CHECK (true);`,
      `Policy on ${t}`
    );
  }

  // ── Step 6: Final audit
  log('\n━━━ STEP 6: Final table audit ━━━');
  const audit = await client.query(
    `SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name;`
  );
  const found = audit.rows.map(r => r.table_name);
  log('\n📋 Tables in public schema:');
  found.forEach(t => log(`   ✅ ${t}`));

  const missing = tablesToCreate.filter(t => !found.includes(t));
  if (missing.length > 0) {
    log('\n❌ MISSING TABLES:');
    missing.forEach(t => log(`   ❌ ${t}`));
  } else {
    log('\n✅ ALL 19 REQUIRED TABLES EXIST – Audit passed 100%');
  }

  await client.end();
  log('\n🏁 Migration complete.\n');
}

main().catch(e => {
  err('Migration failed', e);
  process.exit(1);
});
