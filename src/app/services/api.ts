/**
 * TTZ Gym Management Software — API Service Layer v3.0
 * =====================================================
 * All data operations go directly to Supabase.
 * NO localhost:5000 / Express server dependency.
 * Auth: Supabase Auth (email+password for staff, phone lookup for members)
 */

import { supabase } from './supabase';

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
  id: number;
  memberName: string;
  memberId: number;
  checkInTime: string;
  checkOutTime?: string;
  status: 'present' | 'absent' | 'late';
  date: string;
  attendanceMethod?: string;
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
  notes?: string;
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
    /**
     * Staff/Admin login via Supabase Auth email+password.
     * Returns a User loaded from the profiles table.
     */
    login: async (credentials: { email: string; password?: string }) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password || '',
      });
      if (error) throw new Error(error.message);

      // Load profile
      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileErr || !profile) {
        // Profile not found — create a default one
        await supabase.from('profiles').insert([{
          id: data.user.id,
          display_name: data.user.email?.split('@')[0] || 'Admin',
          role: 'admin',
        }]);
        return {
          success: true,
          user: {
            id: data.user.id,
            email: data.user.email || '',
            name: data.user.email?.split('@')[0] || 'Admin',
            role: 'admin',
          } as User,
        };
      }

      return {
        success: true,
        user: {
          id: data.user.id,
          email: data.user.email || '',
          name: profile.display_name,
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
     * Sign out from Supabase Auth.
     */
    logout: async () => {
      await supabase.auth.signOut();
      return { success: true };
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
      if (error) throw error;

      await supabase.from('activities').insert([{
        type: 'new_member',
        member_id: data.id,
        name: member.name,
        action: `joined the gym on a ${member.plan} plan`,
        time: 'Just now',
      }]);

      await supabase.from('notifications').insert([{
        title: 'New Member Registered',
        message: `${member.name} joined TTZ on a ${member.plan} plan.`,
        category: 'member',
        member_id: data.id,
      }]);

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
      if (error) throw error;
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
      const planDays: Record<string, number> = {
        'Monthly': 30, 'Quarterly': 90, 'Annual': 365, 'Drop-in': 1,
      };
      const days = planDays[renewal.plan] || 30;
      const newExpiry = new Date();
      newExpiry.setDate(newExpiry.getDate() + days);
      const expiryStr = newExpiry.toISOString().split('T')[0];

      // Update member plan + expiry, increment renewal_count
      const { error } = await supabase
        .from('members')
        .update({
          plan: renewal.plan,
          expiry_date: expiryStr,
          renewal_count: supabase.rpc as any, // incremented below
        })
        .eq('id', id);

      // Increment renewal_count separately via RPC or select+update
      const { data: current } = await supabase
        .from('members').select('renewal_count').eq('id', id).single();
      await supabase
        .from('members')
        .update({
          plan: renewal.plan,
          expiry_date: expiryStr,
          renewal_count: (current?.renewal_count || 0) + 1,
        })
        .eq('id', id);

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

      await supabase.from('activities').insert([{
        type: 'renewal',
        member_id: id,
        name: member.name,
        action: `renewed ${renewal.plan} plan for ₹${renewal.amount.toLocaleString('en-IN')}`,
        time: 'Just now',
      }]);

      await supabase.from('notifications').insert([{
        title: 'Membership Renewed',
        message: `${member.name} renewed ${renewal.plan} plan. ₹${renewal.amount.toLocaleString('en-IN')} collected.`,
        category: 'payment',
        member_id: id,
      }]);

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
        plan:              payment.plan,
        date:              payment.date,
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
      }

      return {
        ...payment, id: data.id,
        invoiceNumber: invoiceNum,
        receiptNumber: receiptNum,
      };
    },
  },

  // ── Attendance ────────────────────────────────────────────────────────────
  attendance: {
    getToday: async (): Promise<AttendanceRecord[]> => {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('attendance_view').select('*').eq('date', today);
      if (error) throw error;
      return (data || []).map((a: any) => ({
        id: a.id, memberId: a.member_id, memberName: a.member_name,
        checkInTime: a.check_in_time, status: a.status, date: a.date,
      })) as AttendanceRecord[];
    },

    checkIn: async (id: number) => api.attendance.markPresent(id),

    markPresent: async (memberId: number) => {
      const { data: member, error: memberError } = await supabase
        .from('members_view').select('name').eq('id', memberId).single();
      if (memberError || !member) throw new Error('Member not found');

      const today = new Date().toISOString().split('T')[0];
      const { data: existing } = await supabase
        .from('attendance').select('id, check_in_time, status, date')
        .eq('member_id', memberId).eq('date', today).maybeSingle();

      if (existing) {
        return { id: existing.id, memberId, memberName: member.name, checkInTime: existing.check_in_time, status: existing.status, date: existing.date, alreadyMarked: true };
      }

      const checkInTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
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
      const { data, error } = await supabase.from('trainers').insert([trainer]).select().single();
      if (error) throw error;
      return data as Trainer;
    },

    update: async (id: number, trainer: Omit<Trainer, 'id'>): Promise<Trainer> => {
      const { data, error } = await supabase.from('trainers').update(trainer).eq('id', id).select().single();
      if (error) throw error;
      return data as Trainer;
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
  reports: {
    getSummary: async (): Promise<ReportSummary> => {
      const [paymentsRes, attendanceRes, membersRes, expensesRes] = await Promise.all([
        supabase.from('payments_view').select('date, amount, status'),
        supabase.from('attendance').select('date, status'),
        supabase.from('members_view').select('plan, status'),
        supabase.from('expenses').select('amount, expense_date').is('deleted_at', null),
      ]);

      const payments = paymentsRes.data || [];
      const attendance = attendanceRes.data || [];
      const members = membersRes.data || [];
      const expenses = expensesRes.data || [];

      const totalRevenue = payments.filter(p => p.status === 'paid').reduce((s, p) => s + Number(p.amount), 0);
      const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0);
      const netProfit = totalRevenue - totalExpenses;

      // Monthly revenue last 6 months
      const revByMonth: Record<string, number> = {};
      const expByMonth: Record<string, number> = {};
      payments.filter(p => p.status === 'paid').forEach(p => {
        const m = p.date.slice(0, 7);
        revByMonth[m] = (revByMonth[m] || 0) + Number(p.amount);
      });
      expenses.forEach(e => {
        const m = (e.expense_date || '').slice(0, 7);
        expByMonth[m] = (expByMonth[m] || 0) + Number(e.amount);
      });

      const allMonths = Array.from({ length: 6 }, (_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - (5 - i));
        return d.toISOString().slice(0, 7);
      });

      const monthlyRevenueData = allMonths.map(m => ({
        month: new Date(m + '-01').toLocaleString('en-IN', { month: 'short' }),
        revenue: revByMonth[m] || 0,
        expenses: expByMonth[m] || 0,
      }));

      // Membership distribution
      const planCounts: Record<string, number> = {};
      members.forEach(m => { planCounts[m.plan] = (planCounts[m.plan] || 0) + 1; });
      const colors = ['#fbbf24', '#4ade80', '#60a5fa', '#f87171', '#a78bfa'];
      const membershipDistribution = Object.entries(planCounts).map(([name, value], i) => ({
        name, value, color: colors[i % colors.length],
      }));

      // Attendance trend (last 4 weeks)
      const attByWeek: Record<string, number> = {};
      attendance.filter(a => a.status === 'present').forEach(a => {
        const d = new Date(a.date);
        const weekNum = Math.ceil(d.getDate() / 7);
        const key = `W${weekNum} ${d.toLocaleString('en-IN', { month: 'short' })}`;
        attByWeek[key] = (attByWeek[key] || 0) + 1;
      });
      const attendanceTrend = Object.entries(attByWeek).slice(-4).map(([week, attendance]) => ({ week, attendance }));

      const presentCount = attendance.filter(a => a.status === 'present').length;
      const avgAttendance = Math.round(presentCount / Math.max(1, 30));

      return { totalRevenue, totalExpenses, netProfit, avgAttendance, monthlyRevenueData, membershipDistribution, attendanceTrend };
    },
  },

  // ── WhatsApp ──────────────────────────────────────────────────────────────
  whatsapp: {
    getConfig: async (): Promise<WhatsAppConfig> => {
      const { data, error } = await supabase.from('whatsapp_config').select('*').limit(1).maybeSingle();
      if (error && error.code !== 'PGRST116') throw error;
      return data ? {
        apiKey: data.api_key || '', phoneNumber: data.phone_number || '',
        provider: data.provider || 'twilio', isConnected: data.is_connected ? 1 : 0,
        reminderEnabled: data.reminder_enabled ? 1 : 0,
        expiryReminderDays: data.expiry_reminder_days || 7,
        lowAttendanceDays: data.low_attendance_days || 5,
        customMessage: data.custom_message || 'Hi {name}, your TTZ membership expires on {expiry_date}.',
        sendMethod: data.send_method || 'whatsapp',
        autoSend: data.auto_send ? 1 : 0,
      } : {
        apiKey: '', phoneNumber: '', provider: 'twilio', isConnected: 0,
        reminderEnabled: 1, expiryReminderDays: 7, lowAttendanceDays: 5,
        customMessage: 'Hi {name}, your TTZ membership expires on {expiry_date}. Renew now!',
        sendMethod: 'whatsapp', autoSend: 0,
      };
    },

    saveConfig: async (config: Partial<WhatsAppConfig>) => {
      const { data: existing } = await supabase.from('whatsapp_config').select('id').limit(1).maybeSingle();
      const row = {
        api_key: config.apiKey, phone_number: config.phoneNumber,
        provider: config.provider, is_connected: Boolean(config.isConnected),
        reminder_enabled: Boolean(config.reminderEnabled),
        expiry_reminder_days: config.expiryReminderDays,
        low_attendance_days: config.lowAttendanceDays,
        custom_message: config.customMessage,
        send_method: config.sendMethod, auto_send: Boolean(config.autoSend),
      };
      let error;
      if (existing) {
        ({ error } = await supabase.from('whatsapp_config').update(row).eq('id', existing.id));
      } else {
        ({ error } = await supabase.from('whatsapp_config').insert([{ id: 1, ...row }]));
      }
      if (error) throw error;
      return { success: true, message: 'Config saved' };
    },

    getLogs: async (): Promise<ReminderLog[]> => {
      const { data, error } = await supabase
        .from('reminder_logs_view').select('*').order('sent_at', { ascending: false }).limit(50);
      if (error) {
        // Fallback to base table if view doesn't exist
        const { data: base } = await supabase.from('reminder_logs').select('*').order('sent_at', { ascending: false }).limit(50);
        return (base || []).map((r: any) => ({
          id: r.id, memberName: r.member_name || 'System', phone: r.phone || '',
          type: r.type, message: r.message, method: r.method,
          status: r.status, sentAt: r.sent_at || r.created_at,
        }));
      }
      return (data || []).map((r: any) => ({
        id: r.id, memberName: r.member_name || 'System', phone: r.member_phone || '',
        type: r.type, message: r.message, method: r.method,
        status: r.status, sentAt: r.sent_at,
      }));
    },

    sendTest: async (phone: string, method: string) => {
      await supabase.from('reminder_logs').insert([{
        member_id: null,
        type: 'test',
        message: 'Test message from TTZ Gym Management Software',
        method: method || 'whatsapp',
        status: 'delivered',
      }]);
      return { success: true, message: 'Test message logged' };
    },

    sendReminders: async (_type: 'expiry' | 'payment' | 'attendance' | 'promo') => {
      return { success: true, message: 'Bulk reminders queued', count: 0 };
    },

    clearLogs: async () => {
      const { error } = await supabase.from('reminder_logs').delete().neq('id', 0);
      if (error) throw error;
      return { success: true };
    },

    getTemplates: async () => {
      const { data, error } = await supabase.from('whatsapp_templates').select('*').eq('is_active', true).order('id');
      if (error) throw error;
      return data || [];
    },

    getAutomationRules: async () => {
      const { data, error } = await supabase.from('automation_rules').select('*, whatsapp_templates(name, message)').order('id');
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
        id: e.id, category: e.category, amount: Number(e.amount),
        month: new Date(e.expense_date).getMonth() + 1,
        year: new Date(e.expense_date).getFullYear(),
        notes: e.description || e.notes,
        createdAt: e.created_at,
      }));
    },

    create: async (expense: Omit<Expense, 'id' | 'createdAt'>): Promise<Expense> => {
      const expenseDate = expense.month && expense.year
        ? `${expense.year}-${String(expense.month).padStart(2, '0')}-01`
        : new Date().toISOString().split('T')[0];

      const { data, error } = await supabase.from('expenses')
        .insert([{ category: expense.category.toLowerCase(), amount: expense.amount, expense_date: expenseDate, description: expense.notes }])
        .select().single();
      if (error) throw error;
      return {
        id: data.id, category: expense.category, amount: Number(data.amount),
        month: expense.month, year: expense.year, notes: expense.notes,
        createdAt: data.created_at,
      };
    },

    update: async (id: number, expense: Omit<Expense, 'id' | 'createdAt'>): Promise<Expense> => {
      const expenseDate = `${expense.year}-${String(expense.month).padStart(2, '0')}-01`;
      const { data, error } = await supabase.from('expenses')
        .update({ category: expense.category.toLowerCase(), amount: expense.amount, expense_date: expenseDate, description: expense.notes })
        .eq('id', id).select().single();
      if (error) throw error;
      return { id, ...expense, createdAt: data.created_at };
    },

    delete: async (id: number) => {
      const { error } = await supabase.from('expenses')
        .update({ deleted_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
      return { success: true };
    },

    getSummary: async () => {
      const currentMonth = new Date().toISOString().slice(0, 7);
      const [expensesRes, paymentsRes] = await Promise.all([
        supabase.from('expenses').select('amount, expense_date, category').is('deleted_at', null),
        supabase.from('payments').select('amount, date, status').is('deleted_at', null),
      ]);

      const expenses = expensesRes.data || [];
      const payments = paymentsRes.data || [];

      const totalExpenses = expenses.filter(e => e.expense_date?.startsWith(currentMonth)).reduce((s, e) => s + Number(e.amount), 0);
      const totalRevenue = payments.filter(p => p.status === 'paid' && p.date?.startsWith(currentMonth)).reduce((s, p) => s + Number(p.amount), 0);
      const netProfit = totalRevenue - totalExpenses;

      // By category
      const catTotals: Record<string, number> = {};
      expenses.filter(e => e.expense_date?.startsWith(currentMonth)).forEach(e => {
        catTotals[e.category] = (catTotals[e.category] || 0) + Number(e.amount);
      });
      const monthlyExpenses = Object.entries(catTotals).map(([category, total]) => ({ category, total }));

      // Monthly comparison (last 6 months)
      const monthlyComp = Array.from({ length: 6 }, (_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const m = d.toISOString().slice(0, 7);
        return {
          month: d.toLocaleString('en-IN', { month: 'short' }),
          expenses: expenses.filter(e => e.expense_date?.startsWith(m)).reduce((s, e) => s + Number(e.amount), 0),
        };
      }).reverse();

      return { totalExpenses, totalRevenue, netProfit, monthlyExpenses, monthlyComparison: monthlyComp };
    },
  },

  // ── Insights ───────────────────────────────────────────────────────────────
  insights: {
    get: async (): Promise<InsightsData> => {
      const [membersRes, paymentsRes] = await Promise.all([
        supabase.from('members_view').select('status, plan'),
        supabase.from('payments_view').select('date, amount, status'),
      ]);

      const members = membersRes.data || [];
      const payments = paymentsRes.data || [];

      const totalMembers = members.length;
      const activeMembers = members.filter(m => m.status === 'active').length;
      const expiredMembers = members.filter(m => m.status === 'expired').length;
      const expiringMembers = members.filter(m => m.status === 'expiring').length;
      const retentionRate = totalMembers > 0 ? Math.round((activeMembers / totalMembers) * 100) : 0;
      const renewalRate = totalMembers > 0 ? Math.round(((totalMembers - expiredMembers) / totalMembers) * 100) : 0;

      const planCounts: Record<string, number> = {};
      members.forEach(m => { planCounts[m.plan] = (planCounts[m.plan] || 0) + 1; });
      const topPlans = Object.entries(planCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([plan, count]) => ({ plan, count }));

      const revByMonth: Record<string, number> = {};
      payments.filter(p => p.status === 'paid').forEach(p => {
        const m = p.date?.slice(0, 7) || '';
        revByMonth[m] = (revByMonth[m] || 0) + Number(p.amount);
      });
      const revenueTrend = Object.entries(revByMonth)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .slice(-6)
        .map(([m, revenue]) => ({
          month: new Date(m + '-01').toLocaleString('en-IN', { month: 'short' }),
          revenue,
        }));

      const currentMonth = new Date().toISOString().slice(0, 7);
      const expectedMonthlyIncome = payments
        .filter(p => p.status === 'paid' && p.date?.startsWith(currentMonth))
        .reduce((s, p) => s + Number(p.amount), 0);

      return {
        totalMembers, activeMembers, expiredMembers, expiringMembers,
        retentionRate, renewalRate, inactiveMembers: expiredMembers,
        topPlans, revenueTrend, expectedMonthlyIncome,
      };
    },
  },

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
        interested_plan: visitor.interestedMembership || null,
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
