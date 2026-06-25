const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;

if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
  console.error("Missing Supabase credentials in server/.env");
  process.exit(1);
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY);

async function verifySchema() {
  const expectedTables = [
    'members', 'attendance', 'payments', 'trainers', 'workouts', 
    'diet_plans', 'expenses', 'leads', 'visitors', 'notifications', 
    'settings', 'audit_logs', 'whatsapp_sessions', 'whatsapp_templates', 
    'whatsapp_logs', 'automation_rules', 'message_queue', 'delivery_history'
  ];

  console.log("Verifying tables in Supabase...");
  let allExist = true;

  for (const table of expectedTables) {
    const { error } = await supabaseAdmin.from(table).select('id').limit(1);
    
    // PGRST205 means table not found
    if (error && error.code === 'PGRST205') {
      console.log(`❌ Table missing: ${table}`);
      allExist = false;
    } else if (error && error.code !== 'PGRST116') {
      // PGRST116 means no rows found (which is fine, the table exists)
      console.log(`⚠️ Error checking ${table}: ${error.message}`);
      allExist = false;
    } else {
      console.log(`✅ Table exists: ${table}`);
    }
  }

  if (allExist) {
    console.log("\n✅ Audit Passed 100%: All required tables exist.");
  } else {
    console.log("\n❌ Audit Failed: Some tables are missing. Please execute migration.sql.");
  }
}

verifySchema();
