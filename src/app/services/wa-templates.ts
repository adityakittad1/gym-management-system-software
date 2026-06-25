/**
 * TTZ Gym – Professional WhatsApp Message Templates
 * ==================================================
 * Centralised template engine for all automated WhatsApp messages.
 * 
 * Supported variables:
 *   {{member_name}}       {{gym_name}}          {{plan_name}}
 *   {{amount}}            {{expiry_date}}        {{renewal_date}}
 *   {{join_date}}         {{days_remaining}}     {{coach_name}}
 *   {{attendance_date}}   {{invoice_number}}     {{receipt_number}}
 *   {{gym_phone}}         {{gym_address}}        {{support_email}}
 *   {{month}}             {{year}}
 */

export interface WATemplate {
  key: string;
  name: string;
  category: string;
  message: string;
  variables: string[];
  isEditable: boolean;
}

export interface WATemplateVars {
  member_name?: string;
  gym_name?: string;
  plan_name?: string;
  amount?: string | number;
  expiry_date?: string;
  renewal_date?: string;
  join_date?: string;
  days_remaining?: string | number;
  coach_name?: string;
  attendance_date?: string;
  invoice_number?: string;
  receipt_number?: string;
  gym_phone?: string;
  gym_address?: string;
  support_email?: string;
  month?: string;
  year?: string | number;
  [key: string]: string | number | undefined;
}

// ─── Default professional templates ──────────────────────────────────────────

export const DEFAULT_TEMPLATES: WATemplate[] = [
  {
    key: 'welcome',
    name: '🎉 New Member Welcome',
    category: 'Members',
    isEditable: true,
    variables: ['member_name', 'gym_name', 'plan_name', 'expiry_date', 'gym_phone'],
    message: `🏋️ *Welcome to {{gym_name}}!*

Dear *{{member_name}}*,

We're thrilled to have you join our fitness family! Your membership is now active.

📋 *Membership Details:*
• Plan: {{plan_name}}
• Valid Until: {{expiry_date}}

Our team is here to help you achieve your fitness goals. Please don't hesitate to reach out.

📞 *Support:* {{gym_phone}}

Let's get started on your fitness journey! 💪`,
  },
  {
    key: 'payment_confirmation',
    name: '✅ Payment Confirmation',
    category: 'Payments',
    isEditable: true,
    variables: ['member_name', 'gym_name', 'amount', 'plan_name', 'invoice_number', 'receipt_number', 'gym_phone'],
    message: `✅ *Payment Received – {{gym_name}}*

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
  },
  {
    key: 'membership_renewal',
    name: '🔄 Membership Renewal Confirmation',
    category: 'Members',
    isEditable: true,
    variables: ['member_name', 'gym_name', 'plan_name', 'amount', 'renewal_date', 'expiry_date', 'invoice_number'],
    message: `🔄 *Membership Renewed – {{gym_name}}*

Dear *{{member_name}}*,

Your membership has been successfully renewed!

📋 *Renewal Details:*
• Plan: {{plan_name}}
• Amount Paid: ₹{{amount}}
• Renewal Date: {{renewal_date}}
• New Expiry Date: {{expiry_date}}
• Invoice No: {{invoice_number}}

Keep up the great work! We look forward to seeing you at the gym. 💪

📞 {{gym_phone}}`,
  },
  {
    key: 'expiry_reminder_7',
    name: '⏰ Expiry Reminder – 7 Days',
    category: 'Reminders',
    isEditable: true,
    variables: ['member_name', 'gym_name', 'plan_name', 'expiry_date', 'gym_phone'],
    message: `⏰ *Membership Expiry Reminder – {{gym_name}}*

Dear *{{member_name}}*,

Your *{{plan_name}}* membership expires in *7 days* on {{expiry_date}}.

Don't let your fitness journey pause! Renew now to continue enjoying:
✅ Unlimited gym access
✅ Personal trainer sessions
✅ All premium facilities

Contact us today to renew:
📞 {{gym_phone}}

We value your commitment to fitness! 🏃`,
  },
  {
    key: 'expiry_reminder_5',
    name: '⚠️ Expiry Reminder – 5 Days',
    category: 'Reminders',
    isEditable: true,
    variables: ['member_name', 'gym_name', 'plan_name', 'expiry_date', 'gym_phone'],
    message: `⚠️ *Action Required – {{gym_name}}*

Dear *{{member_name}}*,

Your *{{plan_name}}* membership expires in just *5 days* on {{expiry_date}}.

⚡ *Renew now* to avoid any interruption to your workout routine!

📞 Call us: {{gym_phone}}
📍 Visit us at the gym reception

Don't wait — your fitness goals need you! 💪`,
  },
  {
    key: 'expiry_reminder_3',
    name: '🔴 Expiry Reminder – 3 Days',
    category: 'Reminders',
    isEditable: true,
    variables: ['member_name', 'gym_name', 'plan_name', 'expiry_date', 'gym_phone'],
    message: `🔴 *Urgent: Membership Expiring Soon – {{gym_name}}*

Dear *{{member_name}}*,

This is an urgent reminder that your *{{plan_name}}* membership expires in *3 days* on {{expiry_date}}.

To avoid losing access, please renew immediately:
📞 {{gym_phone}}

Walk in to the reception desk or call us to complete your renewal in minutes. ⏱️`,
  },
  {
    key: 'expiry_reminder_1',
    name: '🚨 Expiry Reminder – Tomorrow',
    category: 'Reminders',
    isEditable: true,
    variables: ['member_name', 'gym_name', 'plan_name', 'expiry_date', 'gym_phone'],
    message: `🚨 *Last Day Alert – {{gym_name}}*

Dear *{{member_name}}*,

Your *{{plan_name}}* membership expires *TOMORROW* on {{expiry_date}}.

Please renew TODAY to continue your fitness journey without interruption!

📞 {{gym_phone}}

We're here for you! 🏋️`,
  },
  {
    key: 'membership_expired',
    name: '❌ Membership Expired',
    category: 'Reminders',
    isEditable: true,
    variables: ['member_name', 'gym_name', 'plan_name', 'expiry_date', 'gym_phone'],
    message: `❌ *Membership Expired – {{gym_name}}*

Dear *{{member_name}}*,

Your *{{plan_name}}* membership expired on {{expiry_date}}.

We miss you at the gym! Renew now and get back to your fitness routine. 💪

📞 {{gym_phone}}

Special renewal offers available — call us today!`,
  },
  {
    key: 'attendance_checkin',
    name: '✅ Attendance Check-In',
    category: 'Attendance',
    isEditable: true,
    variables: ['member_name', 'gym_name', 'attendance_date'],
    message: `✅ *Check-In Confirmed – {{gym_name}}*

Hi *{{member_name}}*! 

You've checked in successfully on {{attendance_date}}. 

Great to see you! Have an amazing workout session! 💪🔥`,
  },
  {
    key: 'payment_due',
    name: '💰 Payment Due Reminder',
    category: 'Payments',
    isEditable: true,
    variables: ['member_name', 'gym_name', 'amount', 'plan_name', 'gym_phone'],
    message: `💰 *Payment Due – {{gym_name}}*

Dear *{{member_name}}*,

You have a pending payment of *₹{{amount}}* for your *{{plan_name}}* plan.

Please clear your dues to continue enjoying uninterrupted access to all gym facilities.

📞 Contact us: {{gym_phone}}

Thank you for your prompt attention! 🙏`,
  },
  {
    key: 'workout_assigned',
    name: '💪 Workout Plan Assigned',
    category: 'Workouts',
    isEditable: true,
    variables: ['member_name', 'gym_name', 'coach_name', 'gym_phone'],
    message: `💪 *New Workout Plan – {{gym_name}}*

Hi *{{member_name}}*!

Your personalised workout plan has been assigned by *{{coach_name}}*.

Log in to your member portal to view your complete workout schedule and track your progress.

🏋️ Train hard. Stay consistent. Achieve great results!

📞 {{gym_phone}}`,
  },
  {
    key: 'diet_assigned',
    name: '🥗 Diet Plan Assigned',
    category: 'Workouts',
    isEditable: true,
    variables: ['member_name', 'gym_name', 'coach_name', 'gym_phone'],
    message: `🥗 *New Diet Plan – {{gym_name}}*

Hi *{{member_name}}*!

Your personalised nutrition plan has been created by *{{coach_name}}*.

A proper diet is 70% of your fitness journey. Follow your plan consistently for the best results!

📱 Check your member portal for details.
📞 {{gym_phone}}`,
  },
  {
    key: 'coach_assigned',
    name: '🏅 Coach Assigned',
    category: 'Members',
    isEditable: true,
    variables: ['member_name', 'gym_name', 'coach_name', 'gym_phone'],
    message: `🏅 *Personal Trainer Assigned – {{gym_name}}*

Hi *{{member_name}}*!

We are pleased to inform you that *{{coach_name}}* has been assigned as your personal trainer.

Your trainer will guide you through personalised workout sessions and help you achieve your fitness goals faster! 🎯

📞 For any queries: {{gym_phone}}`,
  },
  {
    key: 'birthday',
    name: '🎂 Birthday Wishes',
    category: 'Engagement',
    isEditable: true,
    variables: ['member_name', 'gym_name', 'gym_phone'],
    message: `🎂 *Happy Birthday from {{gym_name}}!*

Dear *{{member_name}}*,

Wishing you a very Happy Birthday! 🎉🎊

May this year bring you great health, strength, and all your fitness goals!

As a birthday treat, visit us today for a special surprise at the reception! 🎁

Stay fit, stay healthy! 💪

Your family at {{gym_name}} 🏋️`,
  },
  {
    key: 'bulk_campaign',
    name: '📢 Bulk Campaign / Announcement',
    category: 'Marketing',
    isEditable: true,
    variables: ['member_name', 'gym_name', 'gym_phone'],
    message: `📢 *Important Announcement – {{gym_name}}*

Dear *{{member_name}}*,

We have an exciting update for all our valued members!

[Your announcement here]

📞 {{gym_phone}}

Thank you for being part of the {{gym_name}} family! 💪`,
  },
];

// ─── Template storage (in-memory, overridable from DB) ───────────────────────

let customTemplates: Record<string, WATemplate> = {};

export const waTemplates = {
  /**
   * Get all templates (custom overrides merged with defaults)
   */
  getAll(): WATemplate[] {
    return DEFAULT_TEMPLATES.map(t => ({
      ...t,
      ...customTemplates[t.key],
    }));
  },

  /**
   * Get a single template by key
   */
  get(key: string): WATemplate | undefined {
    const defaults = DEFAULT_TEMPLATES.find(t => t.key === key);
    if (!defaults) return undefined;
    return { ...defaults, ...customTemplates[key] };
  },

  /**
   * Override a template (stored in memory until page reload or saved to DB)
   */
  save(key: string, template: Partial<WATemplate>) {
    const existing = DEFAULT_TEMPLATES.find(t => t.key === key);
    if (existing) {
      customTemplates[key] = { ...existing, ...template };
    }
  },

  /**
   * Reset a template to its default
   */
  reset(key: string) {
    delete customTemplates[key];
  },

  /**
   * Reset all templates to defaults
   */
  resetAll() {
    customTemplates = {};
  },

  /**
   * Render a template — replace all {{variable}} placeholders with real values.
   * Falls back gracefully: missing variables are replaced with empty string.
   */
  render(key: string, variables: WATemplateVars): string {
    const template = waTemplates.get(key);
    if (!template) return '';
    return renderMessage(template.message, variables);
  },

  /**
   * Render a raw message string with variables
   */
  renderRaw(message: string, variables: WATemplateVars): string {
    return renderMessage(message, variables);
  },
};

function renderMessage(message: string, vars: WATemplateVars): string {
  return message.replace(/\{\{([^}]+)\}\}/g, (_, key) => {
    const trimmed = key.trim();
    const value = vars[trimmed];
    if (value === undefined || value === null) return '';
    return String(value);
  });
}

/**
 * Build a variables object from a Member + Settings for template rendering
 */
export function buildMemberVars(
  member: { name: string; phone: string; plan?: string; expiryDate?: string; joinDate?: string; daysRemaining?: number },
  settings: { gymName?: string; primaryPhone?: string; address?: string; email?: string } = {},
  extra: WATemplateVars = {}
): WATemplateVars {
  const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
  return {
    member_name:      member.name,
    gym_name:         settings.gymName || 'TTZ Fitness',
    plan_name:        member.plan || '',
    expiry_date:      member.expiryDate || '',
    join_date:        member.joinDate || '',
    days_remaining:   member.daysRemaining ?? '',
    gym_phone:        settings.primaryPhone || '',
    gym_address:      settings.address || '',
    support_email:    settings.email || '',
    attendance_date:  today,
    month:            new Date().toLocaleString('en-IN', { month: 'long' }),
    year:             new Date().getFullYear(),
    ...extra,
  };
}
