const fs = require('fs');

async function check() {
  console.log('--- STARTING CERTIFICATION AUDIT ---');
  let successCount = 0;
  let failCount = 0;
  
  const assert = (condition, msg) => {
    if (condition) {
      console.log('✅ PASS: ' + msg);
      successCount++;
    } else {
      console.error('❌ FAIL: ' + msg);
      failCount++;
    }
  };

  try {
    // 1. Dashboard Stats (Empty)
    let res = await fetch('http://localhost:5000/api/analytics/dashboard');
    let data = await res.json();
    assert(res.status === 200, 'Analytics endpoint is up');
    assert(data.totalMembers === 0, 'Database is clean (0 members)');
    assert(data.monthlyRevenue === 0, 'Revenue is 0');
    assert(data.netProfit === 0, 'Profit is 0');

    console.log('Note: Frontend mostly uses Supabase directly. Express only handles WhatsApp and Admission/Analytics.');
    
    // 2. Admission RPC Test
    const admissionPayload = {
      memberData: {
        name: "Test Member Certification",
        phone: "9999999999",
        plan: "Monthly",
        weight: 75,
        targetWeight: 70,
        height: 180,
        bodyFat: 15,
        joinDate: new Date().toISOString().split('T')[0],
        expiryDate: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
        trainerId: null
      },
      paymentData: {
        amount: 1000,
        plan: "Monthly",
        date: new Date().toISOString().split('T')[0],
        method: "UPI",
        status: "partial",
        invoiceNumber: "INV-123",
        receiptNumber: "REC-123"
      }
    };

    res = await fetch('http://localhost:5000/api/admission/new', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(admissionPayload)
    });
    
    const admissionRes = await res.json();
    assert(res.status === 201, 'Admission RPC executed successfully: ' + JSON.stringify(admissionRes));
    assert(admissionRes.memberId > 0, 'Member ID returned');
    
    // 3. Analytics Synchronization
    res = await fetch('http://localhost:5000/api/analytics/dashboard');
    data = await res.json();
    assert(data.totalMembers === 1, 'Total members increased to 1');
    assert(data.activeMembers === 1, 'Active members increased to 1');
    assert(data.monthlyRevenue === 1000, 'Revenue reflects partial payment correctly');
    assert(data.netProfit === 1000, 'Net profit calculated accurately');
    
    console.log('\n--- AUDIT COMPLETE ---');
    console.log(`Passed: ${successCount}, Failed: ${failCount}`);
  } catch (e) {
    console.error('Fatal error during certification:', e.message);
  }
}
check();
