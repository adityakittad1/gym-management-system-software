const { createClient } = require('@supabase/supabase-js');
const url = 'https://opgvkocbpnvutoagyfhc.supabase.co';
const key = 'sb_publishable_PkkkxeKIcpYtFaXYSpp-UA_yyAot93o';
const supabase = createClient(url, key);

async function check() {
  const { data, error } = await supabase.from('members').select('id').limit(1);
  console.log('Data:', data);
  console.log('Error:', error);
}
check();
