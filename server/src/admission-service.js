const express = require('express');
const { supabaseAdmin, withSupabase } = require('./supabase');
const router = express.Router();

/**
 * POST /api/admission/new
 * Admits a new gym member atomically:
 *   1. Insert into members table
 *   2. Insert into payments table (using 'date' not 'payment_date')
 *   3. Fire secondary hooks (activities, notifications, WhatsApp)
 */
router.post('/new', withSupabase({ auth: 'none' }), async (req, res) => {
  try {
    const { memberData, paymentData } = req.body;
    
    if (!memberData || !paymentData) {
      return res.status(400).json({ error: 'Missing memberData or paymentData' });
    }

    // Validate required fields
    if (!memberData.name || !memberData.phone || !memberData.plan || !memberData.expiryDate) {
      return res.status(400).json({ error: 'Missing required member fields: name, phone, plan, expiryDate' });
    }

    // ── STEP 1: Insert Member ──────────────────────────────────────────────────
    const memberInsert = {
      name:           memberData.name.trim(),
      phone:          String(memberData.phone).trim(),
      email:          memberData.email || null,
      plan:           memberData.plan,
      plan_id:        memberData.planId || null,
      join_date:      memberData.joinDate || new Date().toISOString().split('T')[0],
      expiry_date:    memberData.expiryDate,
      trainer_id:     memberData.trainerId || null,
      weight:         memberData.weight || null,
      target_weight:  memberData.targetWeight || null,
      height:         memberData.height || null,
      body_fat:       memberData.bodyFat || null,
      notes:          memberData.notes || null,
      // v3 extended fields
      gender:         memberData.gender || null,
      date_of_birth:  memberData.dateOfBirth || null,
      address:        memberData.address || null,
      emergency_contact:       memberData.emergencyContact || null,
      emergency_contact_name:  memberData.emergencyContactName || null,
      blood_group:    memberData.bloodGroup || null,
      medical_conditions: memberData.medicalConditions || null,
    };

    const { data: member, error: memberError } = await supabaseAdmin
      .from('members')
      .insert([memberInsert])
      .select()
      .single();

    if (memberError) {
      console.error('[Admission] Member insert error:', memberError);
      // Return a friendly error for duplicate phone
      if (memberError.code === '23505') {
        return res.status(409).json({ error: 'A member with this phone number already exists.' });
      }
      throw memberError;
    }

    const memberId = member.id;

    // ── STEP 2: Insert Payment ─────────────────────────────────────────────────
    // IMPORTANT: payments table uses 'date' NOT 'payment_date' (supabase_migration.sql v2)
    const paymentInsert = {
      member_id:    memberId,
      amount:       Number(paymentData.amount) || 0,
      plan:         paymentData.plan || memberData.plan,
      date:         paymentData.date || new Date().toISOString().split('T')[0],
      method:       paymentData.method || paymentData.paymentMethod || 'Cash',
      status:       paymentData.status || 'paid',
      notes:        paymentData.notes || null,
      // v3 extended fields
      invoice_number:   paymentData.invoiceNumber || null,
      receipt_number:   paymentData.receiptNumber || null,
      transaction_id:   paymentData.transactionId || null,
      discount:         Number(paymentData.discount) || 0,
      tax:              Number(paymentData.tax) || 0,
      subtotal:         Number(paymentData.amount) || 0,
      final_amount:     Number(paymentData.finalAmount || paymentData.amount) || 0,
    };

    const { data: payment, error: paymentError } = await supabaseAdmin
      .from('payments')
      .insert([paymentInsert])
      .select()
      .single();

    if (paymentError) {
      console.error('[Admission] Payment insert error:', paymentError);
      // Member was created but payment failed — soft delete the member
      await supabaseAdmin
        .from('members')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', memberId);
      throw new Error(`Payment recording failed: ${paymentError.message}`);
    }

    // ── STEP 3: Fire-and-forget Secondary Hooks ────────────────────────────────
    setImmediate(async () => {
      try {
        const promises = [];

        // Activity: Joined
        promises.push(
          supabaseAdmin.from('activities').insert([{
            type: 'new_member',
            member_id: memberId,
            name: memberData.name,
            action: `joined the gym on a ${memberData.plan} plan`,
            time: 'Just now'
          }]).catch(e => console.error('[Admission] Activity insert error:', e))
        );

        // Activity: Initial Payment
        if (Number(paymentData.amount) > 0) {
          promises.push(
            supabaseAdmin.from('activities').insert([{
              type: 'payment',
              member_id: memberId,
              name: memberData.name,
              action: `paid ₹${Number(paymentData.amount).toLocaleString('en-IN')} for ${memberData.plan} plan`,
              time: 'Just now'
            }]).catch(e => console.error('[Admission] Payment activity error:', e))
          );
        }

        // Notification: New Admission
        promises.push(
          supabaseAdmin.from('notifications').insert([{
            title: 'New Member Admission',
            message: `${memberData.name} just joined the gym on a ${memberData.plan} plan.`,
            category: 'member',
            member_id: memberId
          }]).catch(e => console.error('[Admission] Notification insert error:', e))
        );

        await Promise.allSettled(promises);

        // WhatsApp welcome messages (non-critical — failures are silently logged)
        try {
          const { waTemplates, buildMemberVars } = require('./whatsapp-template-engine');
          const whatsappService = require('./whatsapp-service');
          
          const { data: settingsRows } = await supabaseAdmin.from('settings').select('*');
          const settings = {};
          if (settingsRows) {
            settingsRows.forEach(r => { settings[r.key] = r.value; });
          }

          const vars = buildMemberVars(
            {
              name: memberData.name,
              phone: memberData.phone,
              plan: memberData.plan,
              expiryDate: memberData.expiryDate,
              joinDate: memberData.joinDate
            },
            settings,
            {
              amount: Number(paymentData.amount).toLocaleString('en-IN'),
              invoice_number: paymentData.invoiceNumber || `INV-${Date.now()}`,
              receipt_number: paymentData.receiptNumber || `REC-${Date.now()}`,
              final_amount:   Number(paymentData.finalAmount || paymentData.amount).toLocaleString('en-IN'),
              payment_method: paymentData.method || 'Cash',
              coach_name:     memberData.coachName || 'Your Trainer',
            }
          );

          // Send welcome message
          const welcomeMsg = waTemplates.render('new_member', vars);
          if (welcomeMsg && memberData.phone) {
            whatsappService.sendMessage(memberData.phone, welcomeMsg, { member: memberData.name }).catch(() => {});
          }

          // Payment confirmation (if paid)
          if (paymentData.status === 'paid' && Number(paymentData.amount) > 0) {
            const paymentMsg = waTemplates.render('payment_success', vars);
            if (paymentMsg && memberData.phone) {
              whatsappService.sendMessage(memberData.phone, paymentMsg, { member: memberData.name }).catch(() => {});
            }
          }
        } catch (waErr) {
          console.warn('[Admission] WhatsApp hook error (non-critical):', waErr.message);
        }

      } catch (err) {
        console.error('[Admission] Secondary Hooks Error:', err);
      }
    });

    return res.status(201).json({
      success: true,
      memberId: memberId,
      paymentId: payment.id,
      member: {
        id: memberId,
        name: member.name,
        phone: member.phone,
        plan: member.plan,
        expiryDate: member.expiry_date,
      },
      message: 'Member admitted successfully.'
    });

  } catch (error) {
    console.error('[Admission] Failed:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
