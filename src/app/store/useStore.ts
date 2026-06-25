import { create } from 'zustand';
import { supabase } from '../services/supabase';
import { Member, Payment, AttendanceRecord, Trainer, NotificationRecord, ActivityRecord, GymSettings, DashboardStats, ActionItem, ChartData, Lead, Visitor, Expense } from '../services/api';

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
  
  // Helpers
  getDashboardStats: () => DashboardStats;
  getDashboardActions: () => ActionItem[];
  getDashboardCharts: () => any;
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
        supabase.from('members_view').select('*').order('id', { ascending: false }),
        supabase.from('payments_view').select('*').order('id', { ascending: false }),
        supabase.from('attendance_view').select('*').order('date', { ascending: false }).limit(200),
        supabase.from('trainers').select('*').eq('is_active', true).order('id', { ascending: true }),
        supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(20),
        supabase.from('activities').select('*').order('created_at', { ascending: false }).limit(20),
        supabase.from('settings').select('*'),
        supabase.from('leads').select('*').is('deleted_at', null).order('created_at', { ascending: false }),
        supabase.from('visitors').select('*').is('deleted_at', null).order('created_at', { ascending: false }),
        supabase.from('expenses').select('*').is('deleted_at', null).order('created_at', { ascending: false })
      ]);

      if (membersErr)    throw membersErr;
      if (paymentsErr)   throw paymentsErr;
      if (attendanceErr) throw attendanceErr;
      if (trainersErr)   throw trainersErr;
      if (leadsErr)      throw leadsErr;
      if (visitorsErr)   throw visitorsErr;
      if (expensesErr)   throw expensesErr;

      // Map members_view snake_case → camelCase Member interface
      const members: Member[] = (membersData || []).map((m: any) => ({
        id:            m.id,
        name:          m.name,
        phone:         m.phone,
        email:         m.email,
        plan:          m.plan,
        plan_id:       m.plan_id,
        joinDate:      m.join_date,
        expiryDate:    m.expiry_date,
        daysRemaining: m.days_remaining,  // computed by members_view
        status:        m.status,           // computed by members_view
        trainerId:     m.trainer_id,
        weight:        m.weight,
        targetWeight:  m.target_weight,
        height:        m.height,
        bodyFat:       m.body_fat,
        beforeImage:   m.before_image,
        afterImage:    m.after_image,
        lastVisit:     m.last_visit,
        notes:         m.notes,
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
        id: e.id, category: e.category, amount: Number(e.amount),
        month: new Date(e.expense_date).getMonth() + 1,
        year: new Date(e.expense_date).getFullYear(),
        notes: e.description || e.notes,
        createdAt: e.created_at,
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
    supabase.channel('public:members')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'members' }, payload => {
        get().fetchInitialData(); // Simplest approach: refetch all to guarantee consistency across relations, or patch store
      })
      .subscribe();

    supabase.channel('public:payments')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, payload => {
        get().fetchInitialData();
      })
      .subscribe();

    supabase.channel('public:attendance')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance' }, payload => {
        get().fetchInitialData();
      })
      .subscribe();

    supabase.channel('public:notifications')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, payload => {
        get().fetchInitialData();
      })
      .subscribe();
      
    supabase.channel('public:activities')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'activities' }, payload => {
        get().fetchInitialData();
      })
      .subscribe();
  },

  getDashboardStats: () => {
    const { members, payments, attendance, trainers } = get();
    const activeMembers = members.filter(m => m.status === 'active').length;
    const expiredMembers = members.filter(m => m.status === 'expired').length;
    const expiringSoon = members.filter(m => m.status === 'expiring').length;
    
    const monthlyRevenue = payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);
    const pendingPayments = payments.filter(p => p.status === 'pending').length;
    
    const today = new Date().toISOString().split('T')[0];
    const attendanceToday = attendance.filter(a => a.date === today && a.status === 'present').length;
    
    return {
      totalMembers: members.length,
      activeMembers,
      expiredMembers,
      expiringSoon,
      monthlyRevenue,
      pendingPayments,
      attendanceToday,
      totalTrainers: trainers.length
    };
  },

  getDashboardActions: () => {
    const { members, payments, attendance } = get();
    const actions: ActionItem[] = [];
    let actionId = 1;

    // 1. Memberships expiring within 5 days
    const expiringMembers = members.filter(m => m.status === 'expiring' && m.daysRemaining <= 5 && m.daysRemaining >= 0);
    if (expiringMembers.length > 0) {
      actions.push({
        id: actionId++,
        type: 'expiry',
        priority: 'high',
        title: `${expiringMembers.length} membership${expiringMembers.length > 1 ? 's' : ''} expire${expiringMembers.length === 1 ? 's' : ''} in 5 days`,
        description: expiringMembers.map(m => m.name).slice(0, 3).join(', ') + (expiringMembers.length > 3 ? ` +${expiringMembers.length - 3} more` : ''),
        count: expiringMembers.length,
        affectedIds: expiringMembers.map(m => m.id),
        icon: 'calendar'
      });
    }

    // 2. Pending collections
    const pendingList = payments.filter(p => p.status === 'pending');
    if (pendingList.length > 0) {
      const totalPending = pendingList.reduce((sum, p) => sum + p.amount, 0);
      actions.push({
        id: actionId++,
        type: 'payment',
        priority: 'high',
        title: `₹${totalPending.toLocaleString('en-IN')} pending collection`,
        description: `${pendingList.length} invoice${pendingList.length > 1 ? 's' : ''} require payment`,
        count: pendingList.length,
        amount: totalPending,
        affectedIds: pendingList.map(p => p.memberId || 0),
        icon: 'credit-card'
      });
    }

    // 3. Expired memberships needing renewal
    const expiredMembers = members.filter(m => m.status === 'expired');
    if (expiredMembers.length > 0) {
      actions.push({
        id: actionId++,
        type: 'renewal',
        priority: 'medium',
        title: `${expiredMembers.length} expired membership${expiredMembers.length > 1 ? 's' : ''} need renewal`,
        description: expiredMembers.map(m => m.name).slice(0, 3).join(', ') + (expiredMembers.length > 3 ? ` +${expiredMembers.length - 3} more` : ''),
        count: expiredMembers.length,
        affectedIds: expiredMembers.map(m => m.id),
        icon: 'refresh-cw'
      });
    }

    // Sort by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    actions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    return actions;
  },

  getDashboardCharts: () => {
    const { payments, attendance } = get();
    
    // Revenue by month
    const revByMonth: Record<string, number> = {};
    payments.filter(p => p.status === 'paid').forEach(p => {
      const m = p.date.slice(0, 7); // YYYY-MM
      revByMonth[m] = (revByMonth[m] || 0) + p.amount;
    });
    
    const revenue = Object.entries(revByMonth)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-6)
      .map(([m, val]) => {
        const d = new Date(m + '-01');
        return { month: d.toLocaleString('en-IN', { month: 'short' }), Revenue: val };
      });
      
    // Attendance by day
    const attByDay: Record<string, number> = {};
    attendance.forEach(a => {
      if (a.status === 'present') {
        const d = a.date;
        attByDay[d] = (attByDay[d] || 0) + 1;
      }
    });
    
    const attendanceChart = Object.entries(attByDay)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-7)
      .map(([d, val]) => {
        const dateObj = new Date(d);
        return { date: dateObj.toLocaleString('en-IN', { weekday: 'short' }), Count: val };
      });
      
    // Fallbacks if not enough data
    const finalRevenue = revenue.length > 0 ? revenue : [
      { month: 'Jan', Revenue: 45000 }, { month: 'Feb', Revenue: 52000 },
      { month: 'Mar', Revenue: 48000 }, { month: 'Apr', Revenue: 61000 },
      { month: 'May', Revenue: 59000 }, { month: 'Jun', Revenue: 72000 }
    ];
    
    const finalAttendance = attendanceChart.length > 0 ? attendanceChart : [
      { date: 'Mon', Count: 145 }, { date: 'Tue', Count: 132 },
      { date: 'Wed', Count: 156 }, { date: 'Thu', Count: 128 },
      { date: 'Fri', Count: 165 }, { date: 'Sat', Count: 182 }, { date: 'Sun', Count: 95 }
    ];

    return { revenue: finalRevenue, attendance: finalAttendance };
  }
}));
