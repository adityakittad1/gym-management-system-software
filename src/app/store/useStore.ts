import { create } from 'zustand';
import { supabase } from '../services/supabase';
import { Member, Payment, AttendanceRecord, Trainer, NotificationRecord, ActivityRecord, GymSettings, DashboardStats, ActionItem, ChartData, Lead, Visitor, Expense } from '../services/api';
import { TABLES, VIEWS, SELECTS } from '../services/db-schema';

let realtimeSubscribed = false;

interface AppState {
  members: Member[];
  payments: Payment[];
  attendance: AttendanceRecord[];
  trainers: Trainer[];
  notifications: NotificationRecord[];
  activities: ActivityRecord[];
  settings: GymSettings | null;
  leads: Lead[];
  visitors: Visitor[];
  expenses: Expense[];
  loading: boolean;
  error: string | null;

  fetchInitialData: () => Promise<void>;
  subscribeToRealtime: () => void;
  
  // Removed analytical helpers -> now using backend api.analytics
}

export const useStore = create<AppState>((set, get) => ({
  members: [],
  payments: [],
  attendance: [],
  trainers: [],
  notifications: [],
  activities: [],
  settings: null,
  leads: [],
  visitors: [],
  expenses: [],
  loading: true,
  error: null,

  fetchInitialData: async () => {
    try {
      set({ loading: true, error: null });

      const [
        { data: membersData,    error: membersErr },
        { data: paymentsData,   error: paymentsErr },
        { data: attendanceData, error: attendanceErr },
        { data: trainersData,   error: trainersErr },
        { data: notifData,      error: notifErr },
        { data: actData,        error: actErr },
        { data: settingsData,   error: settingsErr },
        { data: leadsData,      error: leadsErr },
        { data: visitorsData,   error: visitorsErr },
        { data: expensesData,   error: expensesErr }
      ] = await Promise.all([
        // Use views for SELECT — they compute days_remaining, status, member_name via JOINs
        supabase.from(VIEWS.members).select(SELECTS.membersView).order('id', { ascending: false }),
        supabase.from(VIEWS.payments).select(SELECTS.paymentsView).order('id', { ascending: false }),
        supabase.from(VIEWS.attendance).select(SELECTS.attendanceView).order('date', { ascending: false }).limit(200),
        supabase.from(TABLES.trainers).select('*').eq('is_active', true).is('deleted_at', null).order('id', { ascending: true }),
        supabase.from(TABLES.notifications).select('*').order('created_at', { ascending: false }).limit(20),
        supabase.from(TABLES.activities).select('*').order('created_at', { ascending: false }).limit(20),
        supabase.from(TABLES.settings).select('*'),
        supabase.from(TABLES.leads).select('*').is('deleted_at', null).order('created_at', { ascending: false }),
        supabase.from(TABLES.visitors).select('*').is('deleted_at', null).order('created_at', { ascending: false }),
        supabase.from(TABLES.expenses).select('*').is('deleted_at', null).order('created_at', { ascending: false })
      ]);

      if (membersErr)    throw membersErr;
      if (paymentsErr)   throw paymentsErr;
      if (attendanceErr) throw attendanceErr;
      if (trainersErr)   throw trainersErr;
      if (leadsErr)      throw leadsErr;
      if (visitorsErr)   throw visitorsErr;
      if (expensesErr)   throw expensesErr;

      // Map members_view snake_case → camelCase Member interface (complete mapping)
      const members: Member[] = (membersData || []).map((m: any) => ({
        id:                   m.id,
        name:                 m.name,
        phone:                m.phone,
        email:                m.email,
        plan:                 m.plan,
        plan_id:              m.plan_id,
        joinDate:             m.join_date,
        expiryDate:           m.expiry_date,
        daysRemaining:        m.days_remaining,  // computed by members_view
        status:               m.status,           // computed by members_view
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
      }));

      // Map payments_view snake_case → camelCase Payment interface
      const payments: Payment[] = (paymentsData || []).map((p: any) => ({
        id:         p.id,
        memberId:   p.member_id,
        memberName: p.member_name,  // from payments_view JOIN
        amount:     p.amount,
        plan:       p.plan,
        date:       p.date,
        method:     p.method,
        status:     p.status,
        notes:      p.notes,
      }));

      // Map attendance_view snake_case → camelCase AttendanceRecord interface
      const attendance: AttendanceRecord[] = (attendanceData || []).map((a: any) => ({
        id:          a.id,
        memberId:    a.member_id,
        memberName:  a.member_name,  // from attendance_view JOIN
        checkInTime: a.check_in_time,
        status:      a.status,
        date:        a.date,
      }));

      // Map trainers (no view needed, no redundant fields)
      const trainers: Trainer[] = (trainersData || []).map((t: any) => ({
        id:              t.id,
        name:            t.name,
        specialty:       t.specialty,
        phone:           t.phone || '',
        email:           t.email || '',
        assignedMembers: members.filter(m => m.trainerId === t.id).length, // computed
        experience:      t.experience || '',
        availability:    t.availability || '',
      }));

      // Map notifications
      const notifications: NotificationRecord[] = (notifData || []).map((n: any) => ({
        id:      n.id,
        title:   n.title,
        message: n.message,
        time:    new Date(n.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        isRead:  n.is_read ? 1 : 0,
      }));

      // Map activities
      const activities: ActivityRecord[] = (actData || []).map((a: any) => ({
        id:     a.id,
        type:   a.type,
        name:   a.name,
        action: a.action,
        time:   a.time || 'Just now',
      }));

      // Parse settings key-value pairs
      const parsedSettings: Record<string, string> = {};
      if (settingsData) {
        settingsData.forEach((s: any) => { parsedSettings[s.key] = s.value ?? ''; });
      }

      const leads: Lead[] = (leadsData || []).map((l: any) => ({
        id: l.id, name: l.name, phone: l.phone, email: l.email,
        source: l.source, stage: l.stage,
        assignedStaff: l.assigned_to, followUpDate: l.follow_up_date,
        notes: l.notes, interestedPlan: l.interested_plan,
        createdAt: l.created_at,
      }));

      const visitors: Visitor[] = (visitorsData || []).map((v: any) => ({
        id: v.id, name: v.name, phone: v.phone,
        purpose: v.purpose, trialDate: v.trial_date,
        interestedMembership: v.interested_plan,
        followUpDate: v.follow_up_date,
        assignedStaff: v.assigned_to,
        createdAt: v.created_at,
      }));

      const expenses: Expense[] = (expensesData || []).map((e: any) => ({
        id:            e.id,
        category:      e.category,
        amount:        Number(e.amount),
        month:         new Date(e.expense_date + 'T00:00:00').getMonth() + 1,
        year:          new Date(e.expense_date + 'T00:00:00').getFullYear(),
        expenseDate:   e.expense_date,
        vendor:        e.vendor || null,
        paymentMethod: e.payment_method || null,
        notes:         e.notes || e.description,
        createdAt:     e.created_at,
      }));

      set({
        members,
        payments,
        attendance,
        trainers,
        notifications,
        activities,
        settings: parsedSettings as unknown as GymSettings,
        leads,
        visitors,
        expenses,
        loading: false,
      });

      // Start Realtime subscriptions after initial load
      get().subscribeToRealtime();
    } catch (err: any) {
      console.error('[useStore] fetchInitialData failed:', err);
      set({ error: err.message, loading: false });
    }
  },

  subscribeToRealtime: () => {
    if (realtimeSubscribed) return;
    realtimeSubscribed = true;

    const refetch = () => get().fetchInitialData();
    const realtimeTables = [
      TABLES.members,
      TABLES.payments,
      TABLES.attendance,
      TABLES.trainers,
      TABLES.notifications,
      TABLES.activities,
      TABLES.settings,
      TABLES.expenses,
      TABLES.leads,
      TABLES.visitors,
      TABLES.workouts,
      TABLES.dietPlans,
      TABLES.whatsappLogs,
    ];

    realtimeTables.forEach((table) => {
      supabase
        .channel(`public:${table}`)
        .on('postgres_changes', { event: '*', schema: 'public', table }, refetch)
        .subscribe();
    });
  }
}));
