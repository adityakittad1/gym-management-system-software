// Canonical Supabase contract for TTZ.
// Generated from supabase_migration.sql + supabase_migration_v3.sql.

export const TABLES = {
  members: 'members',
  payments: 'payments',
  attendance: 'attendance',
  trainers: 'trainers',
  expenses: 'expenses',
  leads: 'leads',
  visitors: 'visitors',
  workouts: 'workouts',
  dietPlans: 'diet_plans',
  measurements: 'measurements',
  settings: 'settings',
  notifications: 'notifications',
  activities: 'activities',
  profiles: 'profiles',
  whatsappSessions: 'whatsapp_sessions',
  whatsappTemplates: 'whatsapp_templates',
  whatsappLogs: 'whatsapp_logs',
  automationRules: 'automation_rules',
} as const;

export const VIEWS = {
  members: 'members_view',
  payments: 'payments_view',
  attendance: 'attendance_view',
} as const;

export const SELECTS = {
  membersView: '*',
  paymentsView: '*',
  attendanceView: '*',
  memberLogin: 'id, name, phone, email, plan, status, expiry_date',
  memberLookup: 'name',
  attendanceExisting: 'id, check_in_time, status, date',
  reportsPayments: 'date, amount, status',
  reportsAttendance: 'date, status',
  reportsMembers: 'plan, status',
  reportsExpenses: 'amount, expense_date',
  whatsappSession: 'id, session_name, status, phone_number, connected_at, updated_at',
  whatsappLogs: 'id, recipient_phone, member_id, message_type, content, status, error_reason, message_id, sent_at, created_at',
} as const;
