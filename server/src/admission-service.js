const express = require('express');
const { supabaseAdmin, withSupabase } = require('./supabase');
const router = express.Router();

router.post('/new', withSupabase({ auth: 'none' }), async (req, res) => {
  try {
    const { memberData, paymentData } = req.body;
    
    if (!memberData || !paymentData) {
      return res.status(400).json({ error: 'Missing memberData or paymentData' });
    }

    // 1. Execute Atomic Transaction via RPC
    const { data: rpcResult, error: rpcError } = await supabaseAdmin.rpc('admit_member', {
      p_member_data: memberData,
      p_payment_data: paymentData
    });

    if (rpcError) {
      console.error('[Admission Service] RPC Error:', rpcError);
      throw new Error(`Database Transaction Failed: ${rpcError.message}`);
    }

    const { member_id, payment_id } = rpcResult;

    // 2. Fire-and-forget Secondary Hooks
    setImmediate(async () => {
      try {
        const promises = [];

        // Activity: Joined
        promises.push(
          supabaseAdmin.from('activities').insert([{
            type: 'member',
            member_id,
            name: memberData.name,
            action: 'joined the gym',
            time: 'Just now'
          }])
        );

        // Activity: Initial Payment (if not purely pending without amount)
        if (paymentData.status === 'paid' || Number(paymentData.amount) > 0) {
          promises.push(
            supabaseAdmin.from('activities').insert([{
              type: 'payment',
              member_id,
              name: memberData.name,
              action: `paid ₹${Number(paymentData.amount).toLocaleString('en-IN')} for ${memberData.plan} plan`,
              time: 'Just now'
            }])
          );
        }

        // Notification: New Admission
        promises.push(
          supabaseAdmin.from('notifications').insert([{
            title: 'New Member Admission',
            message: `${memberData.name} just joined the gym on a ${memberData.plan} plan.`,
            category: 'system',
            member_id
          }])
        );

        // Wait for DB hooks
        await Promise.allSettled(promises);

        // WhatsApp Hooks
        const { waTemplates, buildMemberVars } = require('./wa-templates');
        const { data: settingsRow } = await supabaseAdmin.from('settings').select('*');
        const settings = {};
        if (settingsRow) {
          settingsRow.forEach(r => { settings[r.key] = r.value; });
        }

        const vars = buildMemberVars(
          { name: memberData.name, phone: memberData.phone, plan: memberData.plan, expiryDate: memberData.expiryDate },
          settings,
          { 
            amount: Number(paymentData.amount).toLocaleString('en-IN'),
            invoice_number: paymentData.invoiceNumber,
            receipt_number: paymentData.receiptNumber
          }
        );

        // Welcome Message
        const welcomeMsg = waTemplates.render('welcome', vars);
        if (welcomeMsg) {
          fetch('http://localhost:5000/api/whatsapp/send-message', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: memberData.phone, message: welcomeMsg, memberName: memberData.name, messageType: 'welcome' }),
          }).catch(() => {});
        }

        // Payment Confirmation (only if paid)
        if (paymentData.status === 'paid') {
          const paymentMsg = waTemplates.render('payment_confirmation', vars);
          if (paymentMsg) {
            fetch('http://localhost:5000/api/whatsapp/send-message', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ phone: memberData.phone, message: paymentMsg, memberName: memberData.name, messageType: 'payment_confirmation' }),
            }).catch(() => {});
          }
        }
      } catch (err) {
        console.error('[Admission Service] Secondary Hooks Error:', err);
      }
    });

    return res.status(201).json({
      success: true,
      memberId: member_id,
      paymentId: payment_id,
      message: 'Admission completed atomically.'
    });

  } catch (error) {
    console.error('[Admission Service] Failed:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
