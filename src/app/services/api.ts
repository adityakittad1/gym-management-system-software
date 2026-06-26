/**
 * TTZ Gym Management Software — API Service Layer v3.0
 * =====================================================
 * All data operations go directly to Supabase.
 * NO localhost:5000 / Express server dependency.
 * Auth: Supabase Auth (email+password for staff, phone lookup for members)
 */

import { supabase } from './supabase';
import { TABLES, VIEWS, SELECTS } from './db-schema';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://gym-management-system-software-backend.onrender.com';

// ─── Interfaces ────────────────────────────────────────────────────────────

export interface User {
  id: string;       // UUID (Supabase Auth) or 'member_<id>' for portal
  email: string;
  name: string;
  role: string;     // 'super_admin' | 'admin' | 'manager' | 'staff' | 'trainer' | 'Member'
}

export interface Member {
  id: number;
  name: string;
  phone: string;
  email?: string;
  plan: string;
  plan_id?: number;
  joinDate: string;
  expiryDate: string;
  daysRemaining: number;
  status: 'active' | 'expiring' | 'expired';
  trainerId?: number;
  beforeImage?: string;
  afterImage?: string;
  weight?: number;
  targetWeight?: number;
  height?: number;
  bodyFat?: number;
  lastVisit?: string;
  notes?: string;
  attendancePercent?: number;
  // Extended enterprise fields
  gender?: string;
  dateOfBirth?: string;
  address?: string;
  emergencyContact?: string;
  emergencyContactName?: string;
  bloodGroup?: string;
  medicalConditions?: string;
  profilePhoto?: string;
  membershipStatus?: string;
  renewalCount?: number;
  isActive?: boolean;
}

export interface Payment {
  id: number;
  memberName: string;
  memberId: number;
  amount: number;
  plan: string;
  date: string;
  method: string;
  status: 'paid' | 'pending' | 'refunded' | 'failed';
  notes?: string;
  invoiceNumber?: string;
  receiptNumber?: string;
  discount?: number;
  tax?: number;
  subtotal?: number;
  finalAmount?: number;
  remarks?: string;
}

export interface Trainer {
  id: number;
  name: string;
  specialty: string;
  phone: string;
  email: string;
  assignedMembers: number;
  experience: string;
  availability: string;
}

export interface AttendanceRecord {
  id: string | number;
  memberName: string;
  memberId: string | number;
  memberPhone?: string;
  checkInTime: string;
  checkOutTime?: string;
  status: 'present' | 'absent' | 'late';
  date: string;
  method?: string;
  remarks?: string;
  markedBy?: string;
  plan?: string;
  coach?: string;
}

export interface NotificationRecord {
  id: number;
  title: string;
  message: string;
  time: string;
  isRead: number;
}

export interface ActivityRecord {
  id: number;
  type: 'new_member' | 'payment' | 'renewal' | 'attendance' | 'trainer' | 'system';
  name: string;
  action: string;
  time: string;
}

export interface DashboardStats {
  totalMembers: number;
  activeMembers: number;
  expiredMembers: number;
  expiringSoon: number;
  monthlyRevenue: number;
  monthlyExpenses: number;
  netProfit: number;
  pendingPayments: number;
  attendanceToday: number;
  totalTrainers: number;
}

export interface ChartData {
  revenueData: Array<{ month: string; revenue: number; expenses?: number }>;
  membershipData: Array<{ month: string; members: number }>;
  weeklyStats: Array<{ day: string; count: number }>;
  attendanceTrend: Array<{ week: string; attendance: number }>;
}

export interface Expense {
  id: number;
  category: string;
  amount: number;
  month: number;
  year: number;
  expenseDate?: string;   // YYYY-MM-DD
  vendor?: string;
  paymentMethod?: string;
  notes?: string;
  description?: string;
  createdAt: string;
}

export interface Lead {
  id: number;
  name: string;
  phone: string;
  email?: string;
  source?: string;
  stage: 'new' | 'contacted' | 'trial' | 'converted' | 'lost';
  assignedStaff?: string;
  followUpDate?: string;
  notes?: string;
  interestedPlan?: string;
  createdAt: string;
}

export interface Visitor {
  id: number;
  name: string;
  phone: string;
  purpose?: string;
  trialDate?: string;
  interestedMembership?: string;
  followUpDate?: string;
  assignedStaff?: string;
  createdAt: string;
}

export interface Measurement {
  id: number;
  memberId: number;
  date: string;
  weight?: number;
  bodyFat?: number;
  chest?: number;
  waist?: number;
  hips?: number;
  arms?: number;
  thighs?: number;
  notes?: string;
}

export interface SearchResult {
  type: 'member' | 'trainer' | 'payment' | 'lead';
  id: number;
  title: string;
  subtitle: string;
  phone?: string;
}

export interface InsightsData {
  totalMembers: number;
  activeMembers: number;
  expiredMembers: number;
  expiringMembers: number;
  retentionRate: number;
  renewalRate: number;
  inactiveMembers: number;
  topPlans: Array<{ plan: string; count: number }>;
  revenueTrend: Array<{ month: string; revenue: number }>;
  expectedMonthlyIncome: number;
}

export interface MemberProfile {
  member: Member;
  workout: any;
  diet: any;
  payments: Payment[];
  attendance: AttendanceRecord[];
  measurements: Measurement[];
  trainer: Trainer | null;
}

export interface ActionItem {
  id: number;
  type: 'expiry' | 'payment' | 'inactive' | 'renewal' | 'attendance';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  count: number;
  amount?: number;
  affectedIds?: number[];
  icon: string;
}

export interface GymSettings {
  gymName: string;
  tagline: string;
  gymType: string;
  primaryPhone: string;
  secondaryPhone: string;
  email: string;
  instagram: string;
  address: string;
  openingTime: string;
  closingTime: string;
  expiryAlerts: string;
  paymentReminders: string;
  newMemberAlerts: string;
  theme: string;
  [key: string]: string;
}

export interface ReportSummary {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  avgAttendance: number;
  monthlyRevenueData: Array<{ month: string; revenue: number; expenses: number }>;
  membershipDistribution: Array<{ name: string; value: number; color: string }>;
  attendanceTrend: Array<{ week: string; attendance: number }>;
}

export interface WhatsAppConfig {
  id?: number;
  apiKey: string;
  phoneNumber: string;
  provider: string;
  isConnected: number;
  reminderEnabled: number;
  expiryReminderDays: number;
  lowAttendanceDays: number;
  customMessage: string;
  sendMethod: string;
  autoSend: number;
}

export interface ReminderLog {
  id: number;
  memberName: string;
  phone: string;
  type: string;
  message: string;
  method: string;
  status: string;
  sentAt: string;
}

// ─── Helper: map members_view row to Member interface ──────────────────────
function mapMember(m: any): Member {
  return {
    id:                   m.id,
    name:                 m.name,
    phone:                m.phone,
    email:                m.email,
    plan:                 m.plan,
    plan_id:              m.plan_id,
    joinDate:             m.join_date,
    expiryDate:           m.expiry_date,
    daysRemaining:        m.days_remaining,
    status:               m.status,
    trainerId:            m.trainer_id,
    weight:               m.weight,
    targetWeight:         m.target_weight,
    height:               m.height,
    bodyFat:              m.body_fat,
    beforeImage:          m.before_image,
    afterImage:           m.after_image,
    lastVisit:            m.last_visit,
    notes:                m.notes,
    gender:               m.gender,
    dateOfBirth:          m.date_of_birth,
    address:              m.address,
    emergencyContact:     m.emergency_contact,
    emergencyContactName: m.emergency_contact_name,
    bloodGroup:           m.blood_group,
    medicalConditions:    m.medical_conditions,
    profilePhoto:         m.profile_photo,
    membershipStatus:     m.membership_status,
    renewalCount:         m.renewal_count,
    isActive:             m.is_active,
  };
}

// ─── API Object ─────────────────────────────────────────────────────────────
export const api = {

  // ── Auth ─────────────────────────────────────────────────────────────────
  auth: {
    login: async (credentials: { email: string; password?: string }) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password || '',
      });
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('Invalid email or password');
        }
        throw new Error(error.message);
      }

      const { data: profile, error: profileErr } = await supabase
        .from('users')
        .select('id, name, role')
        .eq('auth_user_id', data.user.id)
        .single();

      if (profileErr || !profile) {
        console.error('Login Profile Error:', profileErr);
        throw new Error(`User profile not found in Supabase users table. Contact administrator.`);
      }

      return {
        success: true,
        user: {
          id: data.user.id,
          email: data.user.email || '',
          name: profile.name,
          role: profile.role,
        } as User,
      };
    },
    
    logout: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw new Error(error.message);
      return { success: true };
    },

    getSession: async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      if (!session) return { success: false, user: null };

      const { data: profile, error: profileErr } = await supabase
        .from('users')
        .select('id, name, role')
        .eq('auth_user_id', session.user.id)
        .single();

      if (profileErr || !profile) return { success: false, user: null };

      return {
        success: true,
        user: {
          id: session.user.id,
          email: session.user.email || '',
          name: profile.name,
          role: profile.role,
        } as User,
      };
    },

    /**
     * Member portal login: look up by phone number in the members table.
     * OTP is simulated for now (any 4-digit code works in dev).
     */
    memberLogin: async (credentials: { phone: string; otp: string }) => {
      // Validate OTP (simulated: accept "1234" for dev, or implement real SMS OTP)
      if (credentials.otp !== '1234') {
        return { success: false, user: null as any };
      }

      const { data, error } = await supabase
        .from('members_view')
        .select('id, name, phone, email, plan, status, expiry_date')
        .eq('phone', credentials.phone)
        .single();

      if (error || !data) {
        throw new Error('Member not found. Please check your phone number.');
      }

      return {
        success: true,
        user: {
          id: `member_${data.id}`,
          email: data.email || '',
          name: data.name,
          role: 'Member',
          memberId: data.id,
        } as User & { memberId: number },
      };
    },

    /**
     * Send password reset email via Supabase Auth.
     */
    resetPassword: async (email: string) => {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw new Error(error.message);
      return { success: true, message: 'Password reset email sent' };
    },
  },

  // ── Members ──────────────────────────────────────────────────────────────
  members: {
    list: async (): Promise<Member[]> => {
      const { data, error } = await supabase
        .from('members_view')
        .select('*')
        .order('id', { ascending: false });
      if (error) throw error;
      return (data || []).map(mapMember);
    },

    admit: async (payload: { memberData: any, paymentData: any }) => {
      const res = await fetch(`${API_BASE_URL}/api/admission/new`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Admission failed. Please try again.');
      }
      return await res.json();
    },

    create: async (member: Omit<Member, 'id' | 'daysRemaining' | 'status'>): Promise<Member> => {
      const row = {
        name:                  member.name,
        phone:                 member.phone,
        email:                 member.email || null,
        plan:                  member.plan,
        plan_id:               member.plan_id || null,
        join_date:             member.joinDate,
        expiry_date:           member.expiryDate,
        trainer_id:            member.trainerId || null,
        weight:                member.weight || null,
        target_weight:         member.targetWeight || null,
        height:                member.height || null,
        body_fat:              member.bodyFat || null,
        before_image:          member.beforeImage || null,
        after_image:           member.afterImage || null,
        notes:                 member.notes || null,
        gender:                member.gender || null,
        date_of_birth:         member.dateOfBirth || null,
        address:               member.address || null,
        emergency_contact:     member.emergencyContact || null,
        emergency_contact_name:member.emergencyContactName || null,
        blood_group:           member.bloodGroup || null,
        medical_conditions:    member.medicalConditions || null,
        profile_photo:         member.profilePhoto || null,
      };

      const { data, error } = await supabase
        .from('members')
        .insert([row])
        .select()
        .single();
      if (error) {
        if (error.message.includes('members_phone_key')) {
          throw new Error('A member with this phone number already exists.');
        }
        throw error;
      }

      try {
        await supabase.from('activity_logs').insert([{
          module: 'Members',
          action: `Created member: ${member.name}`,
          entity_type: 'member',
          entity_id: data.id.toString(),
        }]);
      } catch (e) { /* ignore */ }

      await supabase.from('notifications').insert([{
        title: 'New Member Registered',
        message: `${member.name} joined TTZ on a ${member.plan} plan.`,
        category: 'member',
        member_id: data.id,
      }]);

      // Auto-send WhatsApp Welcome message (fire-and-forget)
      try {
        const { waTemplates, buildMemberVars } = await import('./wa-templates');
        const settings = await api.settings.get().catch(() => ({} as any));
        const vars = buildMemberVars(
          { name: member.name, phone: member.phone, plan: member.plan, expiryDate: member.expiryDate, joinDate: member.joinDate },
          settings
        );
        const message = waTemplates.render('welcome', vars);
        if (message && member.phone) {
          fetch(`${API_BASE_URL}/api/whatsapp/send-message`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: member.phone, message, memberName: member.name, messageType: 'welcome' }),
          }).catch(() => { /* WA not connected — silent */ });
        }
      } catch (_) { /* non-critical */ }

      return api.members.getById(data.id);
    },

    getById: async (id: number): Promise<Member> => {
      const { data, error } = await supabase
        .from('members_view')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return mapMember(data);
    },

    update: async (id: number, member: Omit<Member, 'id' | 'daysRemaining' | 'status'>): Promise<Member> => {
      const row = {
        name:                  member.name,
        phone:                 member.phone,
        email:                 member.email || null,
        plan:                  member.plan,
        plan_id:               member.plan_id || null,
        join_date:             member.joinDate,
        expiry_date:           member.expiryDate,
        trainer_id:            member.trainerId || null,
        weight:                member.weight || null,
        target_weight:         member.targetWeight || null,
        height:                member.height || null,
        body_fat:              member.bodyFat || null,
        before_image:          member.beforeImage || null,
        after_image:           member.afterImage || null,
        notes:                 member.notes || null,
        gender:                member.gender || null,
        date_of_birth:         member.dateOfBirth || null,
        address:               member.address || null,
        emergency_contact:     member.emergencyContact || null,
        emergency_contact_name:member.emergencyContactName || null,
        blood_group:           member.bloodGroup || null,
        medical_conditions:    member.medicalConditions || null,
        profile_photo:         member.profilePhoto || null,
      };
      const { error } = await supabase.from('members').update(row).eq('id', id);
      if (error) {
        if (error.message.includes('members_phone_key')) {
          throw new Error('Another member with this phone number already exists.');
        }
        throw error;
      }
      return api.members.getById(id);
    },

    delete: async (id: number) => {
      const { error } = await supabase
        .from('members')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
      return { success: true, message: 'Member archived successfully' };
    },

    renew: async (id: number, renewal: { plan: string; amount: number; method: string }) => {
      // Fetch current member to get current expiry date
      const { data: currentMember } = await supabase
        .from('members_view')
        .select('expiry_date')
        .eq('id', id)
        .single();

      // Start from current expiry if still valid (future), otherwise start from today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const currentExpiry = currentMember?.expiry_date
        ? new Date(currentMember.expiry_date + 'T00:00:00') // Parse as local date
        : today;
      const baseDate = currentExpiry > today ? new Date(currentExpiry) : new Date(today);

      // Use calendar months for Monthly/Quarterly/Annual (proper date math, avoids 30d flat)
      if (renewal.plan === 'Monthly') {
        baseDate.setMonth(baseDate.getMonth() + 1);
      } else if (renewal.plan === 'Quarterly') {
        baseDate.setMonth(baseDate.getMonth() + 3);
      } else if (renewal.plan === 'Annual') {
        baseDate.setFullYear(baseDate.getFullYear() + 1);
      } else {
        baseDate.setDate(baseDate.getDate() + 1); // Drop-in
      }

      // Format as YYYY-MM-DD local date (no UTC shift)
      const y = baseDate.getFullYear();
      const mo = String(baseDate.getMonth() + 1).padStart(2, '0');
      const d = String(baseDate.getDate()).padStart(2, '0');
      const expiryStr = `${y}-${mo}-${d}`;

      const { data: current, error: currentErr } = await supabase
        .from('members')
        .select('renewal_count')
        .eq('id', id)
        .single();
      if (currentErr) throw currentErr;

      const { error } = await supabase
        .from('members')
        .update({
          plan: renewal.plan,
          expiry_date: expiryStr,
          renewal_count: (current?.renewal_count || 0) + 1,
        })
        .eq('id', id);
      if (error) throw error;

      // Record payment
      const member = await api.members.getById(id);
      const invoiceNumber = `TTZ-${new Date().getFullYear()}-${String(id).padStart(4, '0')}`;
      await api.payments.create({
        memberId: id,
        memberName: member.name,
        amount: renewal.amount,
        plan: renewal.plan,
        date: new Date().toISOString().split('T')[0],
        method: renewal.method,
        status: 'paid',
        invoiceNumber,
        subtotal: renewal.amount,
        finalAmount: renewal.amount,
      });

      try {
        await supabase.from('activity_logs').insert([{
          module: 'Members',
          action: `Renewed ${renewal.plan} plan for ₹${renewal.amount.toLocaleString('en-IN')}`,
          entity_type: 'member',
          entity_id: id.toString(),
        }]);
      } catch (e) { /* ignore */ }

      await supabase.from('notifications').insert([{
        title: 'Membership Renewed',
        message: `${member.name} renewed ${renewal.plan} plan. ₹${renewal.amount.toLocaleString('en-IN')} collected.`,
        category: 'payment',
        member_id: id,
      }]);

      // Auto-send WhatsApp Renewal Confirmation (fire-and-forget)
      try {
        const { waTemplates, buildMemberVars } = await import('./wa-templates');
        const settings = await api.settings.get().catch(() => ({} as any));
        const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
        const vars = buildMemberVars(
          { name: member.name, phone: member.phone, plan: renewal.plan, expiryDate: expiryStr },
          settings,
          {
            amount: renewal.amount.toLocaleString('en-IN'),
            invoice_number: invoiceNumber,
            renewal_date: today,
          }
        );
        const message = waTemplates.render('membership_renewal', vars);
        if (message && member.phone) {
          fetch(`${API_BASE_URL}/api/whatsapp/send-message`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: member.phone, message, memberName: member.name, messageType: 'membership_renewal' }),
          }).catch(() => { /* WA not connected — silent */ });
        }
      } catch (_) { /* non-critical */ }

      return { success: true, message: 'Membership renewed successfully' };
    },

    getProfile: async (id: number): Promise<MemberProfile> => {
      const [member, workoutRes, dietRes, paymentsRes, attendanceRes, measurementsRes] = await Promise.all([
        api.members.getById(id),
        supabase.from('workouts').select('*').eq('member_id', id).eq('is_active', true).order('created_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('diet_plans').select('*').eq('member_id', id).eq('is_active', true).order('created_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('payments_view').select('*').eq('member_id', id).order('date', { ascending: false }).limit(20),
        supabase.from('attendance_view').select('*').eq('member_id', id).order('date', { ascending: false }).limit(30),
        supabase.from('measurements').select('*').eq('member_id', id).order('date', { ascending: false }).limit(20),
      ]);

      let trainer: Trainer | null = null;
      if (member.trainerId) {
        const { data: t } = await supabase.from('trainers').select('*').eq('id', member.trainerId).single();
        if (t) trainer = { id: t.id, name: t.name, specialty: t.specialty, phone: t.phone || '', email: t.email || '', assignedMembers: 0, experience: t.experience || '', availability: t.availability || '' };
      }

      const payments: Payment[] = (paymentsRes.data || []).map((p: any) => ({
        id: p.id, memberId: p.member_id, memberName: p.member_name, amount: p.amount,
        plan: p.plan, date: p.date, method: p.method, status: p.status, notes: p.notes,
      }));

      const attendance: AttendanceRecord[] = (attendanceRes.data || []).map((a: any) => ({
        id: a.id, memberId: a.member_id, memberName: a.member_name,
        checkInTime: a.check_in_time, status: a.status, date: a.date,
      }));

      const measurements: Measurement[] = (measurementsRes.data || []).map((m: any) => ({
        id: m.id, memberId: m.member_id, date: m.date,
        weight: m.weight, bodyFat: m.body_fat, chest: m.chest, waist: m.waist,
        hips: m.hips, arms: m.arms, thighs: m.thighs, notes: m.notes,
      }));

      return {
        member,
        workout: workoutRes.data || null,
        diet: dietRes.data || null,
        payments,
        attendance,
        measurements,
        trainer,
      };
    },

    getMeasurements: async (id: number): Promise<Measurement[]> => {
      const { data, error } = await supabase
        .from('measurements')
        .select('*')
        .eq('member_id', id)
        .order('date', { ascending: false });
      if (error) throw error;
      return (data || []).map((m: any) => ({
        id: m.id, memberId: m.member_id, date: m.date,
        weight: m.weight, bodyFat: m.body_fat, chest: m.chest, waist: m.waist,
        hips: m.hips, arms: m.arms, thighs: m.thighs, notes: m.notes,
      }));
    },

    saveMeasurement: async (id: number, measurementData: Omit<Measurement, 'id' | 'memberId'>): Promise<Measurement> => {
      const row = {
        member_id: id,
        date: measurementData.date,
        weight: measurementData.weight || null,
        body_fat: measurementData.bodyFat || null,
        chest: measurementData.chest || null,
        waist: measurementData.waist || null,
        hips: measurementData.hips || null,
        arms: measurementData.arms || null,
        thighs: measurementData.thighs || null,
        notes: measurementData.notes || null,
      };
      const { data, error } = await supabase
        .from('measurements')
        .upsert([row], { onConflict: 'member_id,date' })
        .select()
        .single();
      if (error) throw error;
      return { id: data.id, memberId: id, ...measurementData };
    },

    getAttendanceHistory: async (id: number): Promise<AttendanceRecord[]> => {
      const { data, error } = await supabase
        .from('attendance_view')
        .select('*')
        .eq('member_id', id)
        .order('date', { ascending: false });
      if (error) throw error;
      return (data || []).map((a: any) => ({
        id: a.id, memberName: a.member_name, memberId: a.member_id,
        checkInTime: a.check_in_time, status: a.status, date: a.date,
      })) as AttendanceRecord[];
    },

    getWorkout: async (id: number) => {
      const { data } = await supabase
        .from('workouts').select('*').eq('member_id', id).eq('is_active', true)
        .order('created_at', { ascending: false }).limit(1).maybeSingle();
      return data || null;
    },

    saveWorkout: async (id: number, title: string, schedule: any) => {
      const { error } = await supabase.from('workouts')
        .upsert([{ member_id: id, title, schedule, is_active: true }]);
      if (error) throw error;
      return { success: true, message: 'Workout saved' };
    },

    getDiet: async (id: number) => {
      const { data } = await supabase
        .from('diet_plans').select('*').eq('member_id', id).eq('is_active', true)
        .order('created_at', { ascending: false }).limit(1).maybeSingle();
      return data || null;
    },

    saveDiet: async (id: number, title: string, schedule: any) => {
      const { error } = await supabase.from('diet_plans')
        .upsert([{ member_id: id, title, schedule, is_active: true }]);
      if (error) throw error;
      return { success: true, message: 'Diet plan saved' };
    },

    getPortalData: async (phone: string) => {
      const { data: member, error } = await supabase
        .from('members_view').select('*').eq('phone', phone).single();
      if (error || !member) throw new Error('Member not found');

      const [paymentsRes, attendanceRes, workoutRes, dietRes] = await Promise.all([
        supabase.from('payments_view').select('*').eq('member_id', member.id).order('date', { ascending: false }).limit(10),
        supabase.from('attendance_view').select('*').eq('member_id', member.id).order('date', { ascending: false }).limit(30),
        supabase.from('workouts').select('*').eq('member_id', member.id).eq('is_active', true).limit(1).maybeSingle(),
        supabase.from('diet_plans').select('*').eq('member_id', member.id).eq('is_active', true).limit(1).maybeSingle(),
      ]);

      return {
        member: mapMember(member),
        payments: (paymentsRes.data || []).map((p: any) => ({
          id: p.id, amount: p.amount, plan: p.plan, date: p.date, method: p.method, status: p.status,
        })),
        attendance: attendanceRes.data || [],
        workout: workoutRes.data || null,
        diet: dietRes.data || null,
      };
    },
  },

  // ── Payments ─────────────────────────────────────────────────────────────
  payments: {
    list: async (): Promise<Payment[]> => {
      const { data, error } = await supabase
        .from('payments_view')
        .select('*')
        .order('id', { ascending: false });
      if (error) throw error;
      return (data || []).map((p: any) => ({
        id: p.id, memberId: p.member_id, memberName: p.member_name,
        amount: p.amount, plan: p.plan, date: p.date, method: p.method,
        status: p.status, notes: p.notes, invoiceNumber: p.invoice_number,
        receiptNumber: p.receipt_number, discount: p.discount || 0,
        tax: p.tax || 0, subtotal: p.subtotal || p.amount,
        finalAmount: p.final_amount || p.amount, remarks: p.remarks,
      })) as Payment[];
    },

    create: async (payment: Omit<Payment, 'id'>): Promise<Payment> => {
      const invoiceNum = payment.invoiceNumber || `TTZ-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
      const receiptNum = payment.receiptNumber || `RCP-${Date.now().toString().slice(-8)}`;

      const row = {
        member_id:         payment.memberId,
        amount:            payment.amount,
        plan_type:         payment.plan,
        payment_date:      payment.date,
        method:            payment.method,
        status:            payment.status,
        notes:             payment.notes || null,
        invoice_number:    invoiceNum,
        receipt_number:    receiptNum,
        discount:          payment.discount || 0,
        tax:               payment.tax || 0,
        subtotal:          payment.subtotal || payment.amount,
        final_amount:      payment.finalAmount || payment.amount,
        remarks:           payment.remarks || null,
      };
      const { data, error } = await supabase
        .from('payments').insert([row]).select().single();
      if (error) throw error;

      if (payment.status === 'paid') {
        await supabase.from('activities').insert([{
          type: 'payment',
          member_id: payment.memberId,
          name: payment.memberName,
          action: `paid ₹${payment.amount.toLocaleString('en-IN')} for ${payment.plan} plan`,
          time: 'Just now',
        }]);
        await supabase.from('notifications').insert([{
          title: 'Payment Received',
          message: `${payment.memberName} paid ₹${payment.amount.toLocaleString('en-IN')} for ${payment.plan} plan.`,
          category: 'payment',
          member_id: payment.memberId,
        }]);

        // Auto-send WhatsApp Payment Confirmation (fire-and-forget)
        try {
          const { data: memberRow } = await supabase.from('members').select('phone').eq('id', payment.memberId).single();
          if (memberRow?.phone) {
            const { waTemplates, buildMemberVars } = await import('./wa-templates');
            const settings = await api.settings.get().catch(() => ({} as any));
            const vars = buildMemberVars(
              { name: payment.memberName, phone: memberRow.phone, plan: payment.plan },
              settings,
              {
                amount: payment.amount.toLocaleString('en-IN'),
                invoice_number: invoiceNum,
                receipt_number: receiptNum,
              }
            );
            const message = waTemplates.render('payment_confirmation', vars);
            if (message) {
              fetch(`${API_BASE_URL}/api/whatsapp/send-message`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: memberRow.phone, message, memberName: payment.memberName, messageType: 'payment_confirmation' }),
              }).catch(() => { /* WA not connected — silent */ });
            }
          }
        } catch (_) { /* non-critical */ }
      }

      return {
        ...payment, id: data.id,
        invoiceNumber: invoiceNum,
        receiptNumber: receiptNum,
      };
    },

    updateStatus: async (id: number | string, status: 'paid' | 'pending'): Promise<void> => {
      const { data, error } = await supabase
        .from('payments').update({ status }).eq('id', id).select().single();
      if (error) throw error;

      if (status === 'paid') {
        const payment = {
          id: data.id,
          memberId: data.member_id,
          amount: data.amount,
          plan: data.plan_type,
          invoiceNumber: data.invoice_number,
          receiptNumber: data.receipt_number,
        };

        const { data: memberRow } = await supabase.from('members').select('name, phone').eq('id', payment.memberId).single();
        if (memberRow) {
          await supabase.from('activities').insert([{
            type: 'payment',
            member_id: payment.memberId,
            name: memberRow.name,
            action: `paid ₹${payment.amount.toLocaleString('en-IN')} for ${payment.plan} plan`,
            time: 'Just now',
          }]);
          await supabase.from('notifications').insert([{
            title: 'Payment Received',
            message: `${memberRow.name} paid ₹${payment.amount.toLocaleString('en-IN')} for ${payment.plan} plan.`,
            category: 'payment',
            member_id: payment.memberId,
          }]);

          try {
            if (memberRow.phone) {
              const { waTemplates, buildMemberVars } = await import('./wa-templates');
              const settings = await api.settings.get().catch(() => ({} as any));
              const vars = buildMemberVars(
                { name: memberRow.name, phone: memberRow.phone, plan: payment.plan },
                settings,
                {
                  amount: payment.amount.toLocaleString('en-IN'),
                  invoice_number: payment.invoiceNumber,
                  receipt_number: payment.receiptNumber,
                }
              );
              const message = waTemplates.render('payment_confirmation', vars);
              if (message) {
                fetch(`${API_BASE_URL}/api/whatsapp/send-message`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ phone: memberRow.phone, message, memberName: memberRow.name, messageType: 'payment_confirmation' }),
                }).catch(() => {});
              }
            }
          } catch (_) {}
        }
      }
    },

    resendReceipt: async (id: number | string): Promise<void> => {
      const { data, error } = await supabase
        .from('payments').select('*').eq('id', id).single();
      if (error) throw error;

      const { data: memberRow } = await supabase.from('members').select('name, phone').eq('id', data.member_id).single();
      if (!memberRow?.phone) throw new Error('Member has no phone number');

      const { waTemplates, buildMemberVars } = await import('./wa-templates');
      const settings = await api.settings.get().catch(() => ({} as any));
      const vars = buildMemberVars(
        { name: memberRow.name, phone: memberRow.phone, plan: data.plan_type },
        settings,
        {
          amount: data.amount.toLocaleString('en-IN'),
          invoice_number: data.invoice_number,
          receipt_number: data.receipt_number,
        }
      );
      const message = waTemplates.render('payment_confirmation', vars);
      
      if (message) {
        // Generate PDF
        const jsPDF = (await import('jspdf')).default;
        const autoTable = (await import('jspdf-autotable')).default;
        const doc = new jsPDF();
        
        doc.setFontSize(22);
        doc.text(settings?.gymName || 'TTZ Gym', 14, 20);
        doc.setFontSize(10);
        doc.text('Payment Invoice', 14, 28);
        doc.text(`Receipt #: ${data.receipt_number}`, 14, 34);
        doc.text(`Date: ${data.payment_date}`, 14, 40);
        doc.text(`Member: ${memberRow.name}`, 14, 46);
        
        autoTable(doc, {
          startY: 55,
          head: [['Item', 'Amount']],
          body: [
            [`Membership Plan - ${data.plan_type}`, `Rs. ${data.amount}`]
          ],
        });
        
        const pdfBase64 = doc.output('datauristring').split(',')[1];

        // Send Request without awaiting so UI doesn't block for long
        fetch(`${API_BASE_URL}/api/whatsapp/send-message`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: memberRow.phone, message, memberName: memberRow.name, messageType: 'payment_confirmation', pdfBase64 }),
        }).catch(err => console.error('Failed to send WA message:', err));
      }
    },
  },

  // ── Attendance ────────────────────────────────────────────────────────────
  attendance: {
    getToday: async (): Promise<AttendanceRecord[]> => {
      const d = new Date();
      const today = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('attendance_view').select('*').eq('date', today);
      if (error) throw error;
      return (data || []).map((a: any) => ({
        id: a.id, memberId: a.member_id, memberName: a.member_name, memberPhone: a.member_phone,
        checkInTime: a.check_in_time, checkOutTime: a.check_out_time, status: a.status, date: a.date,
        method: a.attendance_method, remarks: a.notes, markedBy: a.marked_by
      })) as AttendanceRecord[];
    },

    list: async (filters?: { startDate?: string; endDate?: string; memberId?: string | number }): Promise<AttendanceRecord[]> => {
      let query = supabase.from('attendance_view').select('*');
      if (filters?.startDate) query = query.gte('date', filters.startDate);
      if (filters?.endDate) query = query.lte('date', filters.endDate);
      if (filters?.memberId) query = query.eq('member_id', filters.memberId);
      
      const { data, error } = await query.order('date', { ascending: false }).order('check_in_time', { ascending: false });
      if (error) throw error;

      return (data || []).map((a: any) => ({
        id: a.id, memberId: a.member_id, memberName: a.member_name, memberPhone: a.member_phone,
        checkInTime: a.check_in_time, checkOutTime: a.check_out_time, status: a.status, date: a.date,
        method: a.attendance_method, remarks: a.notes, markedBy: a.marked_by
      })) as AttendanceRecord[];
    },

    checkIn: async (id: number) => api.attendance.markPresent(id),

    markPresent: async (memberId: number) => {
      const { data: member, error: memberError } = await supabase
        .from('members_view').select('name').eq('id', memberId).single();
      if (memberError || !member) throw new Error('Member not found');

      const d = new Date();
      const today = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split('T')[0];
      const { data: existing } = await supabase
        .from('attendance').select('id, check_in_time, status, date')
        .eq('member_id', memberId).eq('date', today).maybeSingle();

      if (existing) {
        return { id: existing.id, memberId, memberName: member.name, checkInTime: existing.check_in_time, status: existing.status, date: existing.date, alreadyMarked: true };
      }

      const checkInTime = new Date().toISOString();
      const { data, error } = await supabase.from('attendance')
        .insert([{ member_id: memberId, date: today, check_in_time: checkInTime, status: 'present' }])
        .select().single();
      if (error) throw error;

      await supabase.from('activities').insert([{
        type: 'attendance', member_id: memberId, name: member.name,
        action: 'checked in', time: 'Just now',
      }]);

      return { id: data.id, memberId, memberName: member.name, checkInTime: data.check_in_time, status: data.status, date: data.date, alreadyMarked: false };
    },

    checkOut: async (id: number | string): Promise<void> => {
      const checkOutTime = new Date().toISOString();
      const { error } = await supabase.from('attendance')
        .update({ check_out_time: checkOutTime })
        .eq('id', id);
      if (error) throw error;
    },
  },

  // ── Trainers ─────────────────────────────────────────────────────────────
  trainers: {
    list: async (): Promise<Trainer[]> => {
      const { data, error } = await supabase.from('trainers').select('*')
        .is('deleted_at', null).order('id', { ascending: true });
      if (error) throw error;
      return (data || []) as Trainer[];
    },

    create: async (trainer: Omit<Trainer, 'id'>): Promise<Trainer> => {
      const { assignedMembers, ...payload } = trainer as any;
      const { data, error } = await supabase.from('trainers').insert([payload]).select().single();
      if (error) throw error;
      return { ...data, assignedMembers: 0 } as Trainer;
    },

    update: async (id: number, trainer: Omit<Trainer, 'id'>): Promise<Trainer> => {
      const { assignedMembers, ...payload } = trainer as any;
      const { data, error } = await supabase.from('trainers').update(payload).eq('id', id).select().single();
      if (error) throw error;
      return { ...data, assignedMembers: assignedMembers || 0 } as Trainer;
    },

    delete: async (id: number) => {
      const { error } = await supabase.from('trainers').update({ deleted_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
      return { success: true };
    },
  },

  // ── Settings ──────────────────────────────────────────────────────────────
  settings: {
    get: async (): Promise<GymSettings> => {
      const { data, error } = await supabase.from('settings').select('*');
      if (error) throw error;
      const settings: any = {};
      (data || []).forEach((row: any) => { settings[row.key] = row.value; });
      return settings as GymSettings;
    },

    save: async (settings: GymSettings) => {
      const upserts = Object.entries(settings).map(([key, value]) => ({ key, value: String(value) }));
      const { error } = await supabase.from('settings').upsert(upserts, { onConflict: 'key' });
      if (error) throw error;
      return { success: true, message: 'Settings saved successfully' };
    },
  },

  // ── Notifications ──────────────────────────────────────────────────────────
  notifications: {
    list: async (): Promise<NotificationRecord[]> => {
      const { data, error } = await supabase.from('notifications').select('*')
        .order('created_at', { ascending: false }).limit(20);
      if (error) throw error;
      return (data || []).map((n: any) => ({
        id: n.id, title: n.title, message: n.message,
        time: new Date(n.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        isRead: n.is_read ? 1 : 0,
      }));
    },

    markRead: async (id: number) => {
      const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id);
      if (error) throw error;
      return { success: true };
    },

    clearAll: async () => {
      const { error } = await supabase.from('notifications').delete().neq('id', 0);
      if (error) throw error;
      return { success: true };
    },
  },

  // ── Reports ───────────────────────────────────────────────────────────────
  reports: {},

  // ── Central Analytics ──────────────────────────────────────────────────────
  analytics: {
    getDashboardStats: async () => {
      const res = await fetch(`${API_BASE_URL}/api/analytics/dashboard`);
      if (!res.ok) throw new Error('Failed to fetch dashboard stats');
      return res.json();
    },
    getInsights: async () => {
      const res = await fetch(`${API_BASE_URL}/api/analytics/insights`);
      if (!res.ok) throw new Error('Failed to fetch insights');
      return res.json();
    },
    getReports: async () => {
      const res = await fetch(`${API_BASE_URL}/api/analytics/reports`);
      if (!res.ok) throw new Error('Failed to fetch reports');
      return res.json();
    },
    getExpenses: async () => {
      const res = await fetch(`${API_BASE_URL}/api/analytics/expenses`);
      if (!res.ok) throw new Error('Failed to fetch expense summary');
      return res.json();
    },
    getDashboardActions: async () => {
      const res = await fetch(`${API_BASE_URL}/api/dashboard/actions`);
      if (!res.ok) return []; // Fallback inside components if needed
      return res.json();
    },
    getRecentActivity: async () => {
      const res = await fetch(`${API_BASE_URL}/api/dashboard/recent-activity`);
      if (!res.ok) return [];
      return res.json();
    }
  },

  // ── WhatsApp ──────────────────────────────────────────────────────────────
  whatsapp: {
    getConfig: async (): Promise<WhatsAppConfig> => {
      const { data, error } = await supabase
        .from(TABLES.whatsappSessions)
        .select(SELECTS.whatsappSession)
        .eq('session_name', 'default')
        .maybeSingle();
      if (error && error.code !== 'PGRST116') throw error;
      return data ? {
        apiKey: data.api_key || '', phoneNumber: data.phone_number || '',
        provider: 'whatsapp-web.js', isConnected: data.status === 'connected' ? 1 : 0,
        reminderEnabled: 1,
        expiryReminderDays: 7,
        lowAttendanceDays: 5,
        customMessage: data.custom_message || 'Hi {name}, your TTZ membership expires on {expiry_date}.',
        sendMethod: data.send_method || 'whatsapp',
        autoSend: 0,
      } : {
        apiKey: '', phoneNumber: '', provider: 'whatsapp-web.js', isConnected: 0,
        reminderEnabled: 1, expiryReminderDays: 7, lowAttendanceDays: 5,
        customMessage: 'Hi {name}, your TTZ membership expires on {expiry_date}. Renew now!',
        sendMethod: 'whatsapp', autoSend: 0,
      };
    },

    saveConfig: async (config: Partial<WhatsAppConfig>) => {
      const row = {
        session_name: 'default',
        phone_number: config.phoneNumber || null,
        status: config.isConnected ? 'connected' : 'disconnected',
        updated_at: new Date().toISOString(),
      };
      const { data: existing, error: lookupError } = await supabase
        .from(TABLES.whatsappSessions)
        .select('id')
        .eq('session_name', 'default')
        .limit(1)
        .maybeSingle();
      if (lookupError) throw lookupError;

      if (existing?.id) {
        const { error } = await supabase
          .from(TABLES.whatsappSessions)
          .update(row)
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from(TABLES.whatsappSessions).insert([row]);
        if (error) throw error;
      }
      return { success: true, message: 'Config saved' };
    },

    getLogs: async (): Promise<ReminderLog[]> => {
      const { data, error } = await supabase
        .from(TABLES.whatsappLogs)
        .select(SELECTS.whatsappLogs)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data || []).map((r: any) => ({
        id: r.id,
        memberName: r.member_id ? `Member #${r.member_id}` : 'System',
        phone: r.recipient_phone || '',
        type: r.message_type || 'manual',
        message: r.content || '',
        method: 'whatsapp',
        status: r.status,
        sentAt: r.sent_at || r.created_at,
      }));
    },

    sendTest: async (phone: string, method: string) => {
      if (method && method !== 'whatsapp') {
        throw new Error('Only real WhatsApp delivery is enabled. SMS simulation has been removed.');
      }
      const gymName = 'TTZ Fitness';
      const res = await fetch(`${API_BASE_URL}/api/whatsapp/send-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          message: `Hello! This is an automated system verification ping from *${gymName}*. If you received this message, your WhatsApp integration is active and verified. 🏋️`,
          memberName: 'Test',
          messageType: 'test',
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'WhatsApp system ping failed');
      return { success: true, message: 'System ping sent successfully' };
    },

    sendReminders: async (type: 'expiry' | 'payment' | 'attendance' | 'promo', memberId?: string | number) => {
      const res = await fetch(`${API_BASE_URL}/api/whatsapp/send-reminders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, memberId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to send reminders');
      return { success: true, ...data };
    },

    clearLogs: async () => {
      const { error } = await supabase.from(TABLES.whatsappLogs).delete().neq('id', -1);
      if (error) throw error;
      return { success: true };
    },

    getTemplates: async () => {
      const { data, error } = await supabase.from(TABLES.whatsappTemplates).select('*').eq('is_active', true).order('id');
      if (error) throw error;
      return data || [];
    },

    getAutomationRules: async () => {
      const { data, error } = await supabase.from(TABLES.automationRules).select('*, whatsapp_templates(name, message)').order('id');
      if (error) throw error;
      return data || [];
    },
  },

  // ── Expenses ──────────────────────────────────────────────────────────────
  expenses: {
    list: async (): Promise<Expense[]> => {
      const { data, error } = await supabase
        .from('expenses').select('*').is('deleted_at', null)
        .order('expense_date', { ascending: false });
      if (error) throw error;
      return (data || []).map((e: any) => ({
        id:            e.id,
        category:      e.category,
        amount:        Number(e.amount),
        month:         new Date(e.expense_date + 'T00:00:00').getMonth() + 1,
        year:          new Date(e.expense_date + 'T00:00:00').getFullYear(),
        expenseDate:   e.expense_date,
        vendor:        e.vendor || null,
        paymentMethod: e.payment_method || null,
        notes:         e.notes || e.description,
        description:   e.description,
        createdAt:     e.created_at,
      }));
    },

    create: async (expense: Omit<Expense, 'id' | 'createdAt'>): Promise<Expense> => {
      const expenseDate = expense.expenseDate
        || (expense.month && expense.year
          ? `${expense.year}-${String(expense.month).padStart(2, '0')}-01`
          : new Date().toISOString().split('T')[0]);

      const { data, error } = await supabase.from('expenses')
        .insert([{
          category:       expense.category,
          amount:         expense.amount,
          expense_date:   expenseDate,
          notes:          expense.notes || expense.description || null,
        }])
        .select().single();
      if (error) throw error;

      // Log activity so dashboard/recent-activity refreshes
      try {
        await supabase.from('activities').insert([{
          type: 'system',
          name: expense.category,
          action: `Expense logged: ₹${expense.amount.toLocaleString('en-IN')} — ${expense.category}`,
          time: 'Just now',
        }]);
      } catch (_) { /* non-critical */ }

      const d = new Date(expenseDate + 'T00:00:00');
      return {
        id:            data.id,
        category:      expense.category,
        amount:        Number(data.amount),
        month:         d.getMonth() + 1,
        year:          d.getFullYear(),
        expenseDate:   expenseDate,
        vendor:        expense.vendor,
        paymentMethod: expense.paymentMethod,
        notes:         expense.notes,
        createdAt:     data.created_at,
      };
    },

    update: async (id: number, expense: Omit<Expense, 'id' | 'createdAt'>): Promise<Expense> => {
      const expenseDate = expense.expenseDate
        || `${expense.year}-${String(expense.month).padStart(2, '0')}-01`;
      const { data, error } = await supabase.from('expenses')
        .update({
          category:       expense.category,
          amount:         expense.amount,
          expense_date:   expenseDate,
          vendor:         expense.vendor || null,
          payment_method: expense.paymentMethod || null,
          notes:          expense.notes || null,
          description:    expense.notes || null,
        })
        .eq('id', id).select().single();
      if (error) throw error;

      try {
        await supabase.from('activities').insert([{
          type: 'system',
          name: expense.category,
          action: `Expense updated: ₹${expense.amount.toLocaleString('en-IN')} — ${expense.category}`,
          time: 'Just now',
        }]);
      } catch (_) { /* non-critical */ }

      return { id, ...expense, expenseDate, createdAt: data.created_at };
    },

    delete: async (id: number) => {
      const { error } = await supabase.from('expenses')
        .update({ deleted_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
      return { success: true };
    },

  },

  // ── Insights ───────────────────────────────────────────────────────────────
  insights: {},

  // ── Leads ─────────────────────────────────────────────────────────────────
  leads: {
    list: async (): Promise<Lead[]> => {
      const { data, error } = await supabase
        .from('leads').select('*').is('deleted_at', null)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map((l: any) => ({
        id: l.id, name: l.name, phone: l.phone, email: l.email,
        source: l.source, stage: l.stage,
        assignedStaff: l.assigned_to, followUpDate: l.follow_up_date,
        notes: l.notes, interestedPlan: l.interested_plan,
        createdAt: l.created_at,
      })) as Lead[];
    },

    create: async (lead: Omit<Lead, 'id' | 'createdAt'>): Promise<Lead> => {
      const { data, error } = await supabase.from('leads').insert([{
        name: lead.name, phone: lead.phone, email: lead.email || null,
        source: lead.source || 'walk_in', stage: lead.stage || 'new',
        interested_plan: lead.interestedPlan || null,
        follow_up_date: lead.followUpDate || null,
        notes: lead.notes || null,
      }]).select().single();
      if (error) throw error;
      return { ...lead, id: data.id, createdAt: data.created_at };
    },

    update: async (id: number, lead: Omit<Lead, 'id' | 'createdAt'>): Promise<Lead> => {
      const { data, error } = await supabase.from('leads').update({
        name: lead.name, phone: lead.phone, email: lead.email || null,
        source: lead.source, stage: lead.stage,
        interested_plan: lead.interestedPlan || null,
        follow_up_date: lead.followUpDate || null,
        notes: lead.notes || null,
        converted_at: lead.stage === 'converted' ? new Date().toISOString() : null,
      }).eq('id', id).select().single();
      if (error) throw error;
      return { ...lead, id, createdAt: data.created_at };
    },

    delete: async (id: number) => {
      const { error } = await supabase.from('leads')
        .update({ deleted_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
      return { success: true };
    },
  },

  // ── Visitors ───────────────────────────────────────────────────────────────
  visitors: {
    list: async (): Promise<Visitor[]> => {
      const { data, error } = await supabase
        .from('visitors').select('*').is('deleted_at', null)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map((v: any) => ({
        id: v.id, name: v.name, phone: v.phone,
        purpose: v.purpose, trialDate: v.trial_date,
        interestedMembership: v.interested_plan,
        followUpDate: v.follow_up_date,
        assignedStaff: v.assigned_to,
        createdAt: v.created_at,
      })) as Visitor[];
    },

    create: async (visitor: Omit<Visitor, 'id' | 'createdAt'>): Promise<Visitor> => {
      const { data, error } = await supabase.from('visitors').insert([{
        name: visitor.name, phone: visitor.phone,
        purpose: visitor.purpose || 'enquiry',
        trial_date: visitor.trialDate || null,
        follow_up_date: visitor.followUpDate || null,
      }]).select().single();
      if (error) throw error;
      return { ...visitor, id: data.id, createdAt: data.created_at };
    },

    delete: async (id: number) => {
      const { error } = await supabase.from('visitors')
        .update({ deleted_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
      return { success: true };
    },
  },
};
