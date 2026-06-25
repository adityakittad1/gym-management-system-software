import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://opgvkocbpnvutoagyfhc.supabase.co';
const supabaseKey = 'sb_publishable_PkkkxeKIcpYtFaXYSpp-UA_yyAot93o';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDb() {
  console.log('Testing Supabase connection...');
  const { data, error } = await supabase.from('members').select('*').limit(1);
  if (error) {
    console.error('Database Error:', error);
  } else {
    console.log('Query Result:', data);
  }
}

testDb();
