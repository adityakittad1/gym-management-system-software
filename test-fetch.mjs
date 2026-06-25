const url = 'https://opgvkocbpnvutoagyfhc.supabase.co/rest/v1/members?select=*&limit=1';
const key = 'sb_publishable_PkkkxeKIcpYtFaXYSpp-UA_yyAot93o';

fetch(url, {
  headers: {
    'apikey': key,
    'Authorization': `Bearer ${key}`
  }
}).then(async res => {
  if (!res.ok) {
    console.error('HTTP Error:', res.status, res.statusText);
    const text = await res.text();
    console.error('Body:', text);
    return;
  }
  const data = await res.json();
  console.log('Query Result:', data);
}).catch(console.error);
