/**
 * TTZ Gym – WhatsApp Template Engine (Server-Side)
 * =================================================
 * Manages message templates and variable substitution for all
 * automated WhatsApp messages sent from the backend.
 */

const TEMPLATES = {
  welcome: `🏋️ *Welcome to {{gym_name}}!*

Dear *{{member_name}}*,

We're thrilled to have you join our fitness family! Your membership is now active.

📋 *Membership Details:*
• Plan: {{plan_name}}
• Valid Until: {{expiry_date}}

Our team is here to help you achieve your fitness goals.

📞 *Support:* {{gym_phone}}
📍 {{gym_address}}

Let's get started on your fitness journey! 💪`,

  payment_confirmation: `✅ *Payment Received – {{gym_name}}*

Dear *{{member_name}}*,

Thank you! We have received your payment successfully.

💳 *Payment Details:*
• Amount: ₹{{amount}}
• Plan: {{plan_name}}
• Invoice No: {{invoice_number}}
• Receipt No: {{receipt_number}}

Please keep this message as your digital receipt.

📞 For any queries: {{gym_phone}}
Thank you for being a valued member! 🙏`,

  membership_renewal: `🔄 *Membership Renewed – {{gym_name}}*

Dear *{{member_name}}*,

Your membership has been successfully renewed!

📋 *Renewal Details:*
• Plan: {{plan_name}}
• Amount Paid: ₹{{amount}}
• Renewal Date: {{renewal_date}}
• New Expiry Date: {{expiry_date}}
• Invoice No: {{invoice_number}}

Keep up the great work! 💪

📞 {{gym_phone}}`,

  expiry_30: `Hello {{member_name}} 👋

Thank you for being a valued member of {{gym_name}}.

Just a quick reminder that your membership expires on {{expiry_date}}.

There are still 30 days remaining.

We look forward to helping you continue your fitness journey.

Need assistance?

📍 {{gym_address}}

📞 {{gym_phone}}`,

  expiry_15: `Hi {{member_name}}

Your membership will expire on {{expiry_date}}.

Only 15 days remain.

Renew early to continue uninterrupted access to your workouts.

Need help?

📞 {{gym_phone}}`,

  expiry_7: `Hello {{member_name}}

Only 7 days are left before your membership expires.

Renew now and continue your progress without interruption.

Visit us:

{{gym_address}}`,

  expiry_5: `Hi {{member_name}}

Just 5 days remain until your membership expires.

Renew before {{expiry_date}} to continue your workouts.

Need assistance? Call: {{gym_phone}}`,

  expiry_generic: `Hello {{member_name}} 👋

We noticed your membership with {{gym_name}} is expiring in exactly {{days_remaining}} days on {{expiry_date}}.

Staying consistent is the key to achieving your fitness goals! Renew your {{plan_name}} plan early to avoid any interruption to your workouts.

You can easily renew at the front desk.

Need assistance or have questions?
Call us: {{gym_phone}}
Visit us: {{gym_address}}

Keep up the great work! 💪
Team {{gym_name}}`,

  expiry_3: `Hello {{member_name}}

Your membership expires in just 3 days.

We'd love to keep supporting your fitness journey.

Visit TTZ today for a quick renewal.`,

  expiry_2: `Hi {{member_name}}

Only 2 days left.

Renew today to avoid interruption in your training schedule.`,

  expiry_tomorrow: `Hello {{member_name}}

Your membership expires tomorrow.

Renew today and continue your workouts without interruption.`,

  expiry_today: `Hello {{member_name}}

Today is the final day of your membership.

Renew today to keep your membership active.

We're waiting for you.

Team TTZ`,

  expired: `Hi {{member_name}} 👋

Your {{plan_name}} membership with {{gym_name}} expired on {{expiry_date}}.

We miss seeing you at the gym! Don't let your hard work go to waste.

Renew today and get right back to your fitness journey. We're here to help you reach your goals.

Drop by the front desk or contact us to renew:
📞 {{gym_phone}}
📍 {{gym_address}}

Hope to see you back soon! 💪
Team {{gym_name}}`,

  new_member: `Hello {{member_name}}

Welcome to The Transformation Zone (TTZ)

We're excited to have you.

Membership Plan: {{plan_name}}
Joining Date: {{join_date}}
Expiry Date: {{expiry_date}}
Assigned Coach: {{coach_name}}

Gym Address: {{gym_address}}
Contact: {{gym_phone}}

Thank you for choosing TTZ.
Let's achieve your goals together.`,

  payment_success: `Hello {{member_name}}

We've successfully received your payment.

Amount: ₹{{final_amount}}
Payment Method: {{payment_method}}
Receipt Number: {{receipt_number}}

Thank you for choosing TTZ.`,

  renewal_success: `Hello {{member_name}}

Your membership has been successfully renewed.

Plan: {{plan_name}}
New Expiry: {{expiry_date}}
Amount Paid: ₹{{final_amount}}
Invoice: {{invoice_number}}

Thank you for continuing your fitness journey with TTZ.`,

  check_in: `Welcome {{member_name}}

Your attendance has been marked successfully.

Have a great workout.`,

  check_out: `Great work today {{member_name}}

Thank you for training with us.

See you tomorrow.`,

  coach_assigned: `Hello {{member_name}}

Your coach has been assigned.

Coach: {{coach_name}}
Phone: {{coach_phone}}

We're excited to begin your transformation.`,

  workout_assigned: `Hello {{member_name}}

A new workout has been assigned.

Workout: {{workout_name}}
Goal: {{goal}}
Trainer: {{coach_name}}

Let's stay consistent.`,

  diet_assigned: `Hello {{member_name}}

Your personalized diet plan is now available.

Calories: {{calories}}
Coach: {{coach_name}}

Stay disciplined and stay healthy.`
};

function replacePlaceholders(templateStr, member, gymSettings, extraData) {
  member = member || {};
  gymSettings = gymSettings || {};
  extraData = extraData || {};

  const data = {
    gym_name: gymSettings.gym_name || gymSettings.gymName || 'The Transformation Zone (TTZ)',
    gym_address: gymSettings.address || '',
    gym_phone: gymSettings.primary_phone || gymSettings.primaryPhone || '',
    gym_phone_secondary: gymSettings.secondary_phone || gymSettings.secondaryPhone || '',
    gym_city: gymSettings.city || '',
    gym_state: gymSettings.state || '',
    support_email: gymSettings.email || '',
    gym_website: gymSettings.website || '',
    owner_name: gymSettings.owner_name || gymSettings.ownerName || '',

    member_name: member.name || '',
    plan_name: member.plan || extraData.plan_name || 'N/A',
    join_date: member.join_date ? new Date(member.join_date).toLocaleDateString('en-IN') : (member.joinDate || ''),
    expiry_date: member.expiry_date
      ? new Date(member.expiry_date).toLocaleDateString('en-IN')
      : (member.expiryDate ? new Date(member.expiryDate).toLocaleDateString('en-IN') : ''),
    days_remaining: member.days_remaining !== undefined ? member.days_remaining : (member.daysRemaining !== undefined ? member.daysRemaining : ''),

    coach_name: extraData.coach_name || 'Not Assigned',
    coach_phone: extraData.coach_phone || 'N/A',

    amount: extraData.amount || '0',
    discount: extraData.discount || '0',
    tax: extraData.tax || '0',
    final_amount: extraData.final_amount || extraData.amount || '0',
    payment_method: extraData.payment_method || 'Cash',
    payment_status: extraData.payment_status || 'Paid',

    invoice_number: extraData.invoice_number || `INV-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`,
    receipt_number: extraData.receipt_number || `REC-${Math.floor(Math.random() * 10000)}`,
    transaction_id: extraData.transaction_id || `TXN-${Math.floor(Math.random() * 1000000)}`,
    renewal_date: extraData.renewal_date || new Date().toLocaleDateString('en-IN'),

    attendance_date: extraData.attendance_date || new Date().toLocaleDateString('en-IN'),
    attendance_time: extraData.attendance_time || new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),

    workout_name: extraData.workout_name || 'Workout',
    goal: extraData.goal || 'Fitness',
    calories: extraData.calories || '2000 kcal',

    today_date: new Date().toLocaleDateString('en-IN')
  };

  let template = templateStr;

  // Replace placeholders dynamically
  Object.keys(data).forEach(key => {
    const placeholder = new RegExp(`{{(?:\\s+)?${key}(?:\\s+)?}}`, 'g');
    template = template.replace(placeholder, data[key]);
  });

  // Remove any remaining placeholders that weren't matched
  template = template.replace(/{{.*?}}/g, 'N/A');

  return template;
}

function generateMessage(type, member, gymSettings, extraData) {
  member = member || {};
  gymSettings = gymSettings || {};
  extraData = extraData || {};

  let templateStr = TEMPLATES[type];
  if (!templateStr) {
    throw new Error(`Template not found for type: ${type}`);
  }
  return replacePlaceholders(templateStr, member, gymSettings, extraData);
}

// ── waTemplates object – mirrors the frontend API for use in admission-service.js ──

const waTemplates = {
  render(key, vars) {
    const templateStr = TEMPLATES[key];
    if (!templateStr) return '';
    return renderWithVars(templateStr, vars);
  }
};

function renderWithVars(templateStr, vars) {
  vars = vars || {};
  return templateStr.replace(/\{\{([^}]+)\}\}/g, (_, key) => {
    const trimmed = key.trim();
    const value = vars[trimmed];
    if (value === undefined || value === null) return '';
    return String(value);
  });
}

/**
 * Build a variables object from member data + gym settings
 * Mirrors the frontend buildMemberVars for use in admission-service.js
 */
function buildMemberVars(member, settings, extra) {
  member = member || {};
  settings = settings || {};
  extra = extra || {};
  const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
  return {
    member_name:      member.name || '',
    gym_name:         settings.gym_name || settings.gymName || 'TTZ Fitness',
    plan_name:        member.plan || '',
    expiry_date:      member.expiryDate
      ? new Date(member.expiryDate).toLocaleDateString('en-IN')
      : (member.expiry_date ? new Date(member.expiry_date).toLocaleDateString('en-IN') : ''),
    join_date:        member.joinDate
      ? new Date(member.joinDate).toLocaleDateString('en-IN')
      : (member.join_date ? new Date(member.join_date).toLocaleDateString('en-IN') : ''),
    days_remaining:   member.daysRemaining !== undefined ? member.daysRemaining : (member.days_remaining !== undefined ? member.days_remaining : ''),
    gym_phone:        settings.primary_phone || settings.primaryPhone || '',
    gym_address:      settings.address || '',
    support_email:    settings.email || '',
    attendance_date:  today,
    month:            new Date().toLocaleString('en-IN', { month: 'long' }),
    year:             new Date().getFullYear(),
    renewal_date:     today,
    ...extra,
  };
}

module.exports = {
  TEMPLATES,
  waTemplates,
  generateMessage,
  replacePlaceholders,
  buildMemberVars,
};
