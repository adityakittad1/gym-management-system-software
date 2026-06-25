const express = require('express');
const { supabaseAdmin, withSupabase } = require('./supabase');

const router = express.Router();

router.get('/dashboard', withSupabase({ auth: 'none' }), async (req, res) => {
  try {
    const currentMonthStr = new Date().toISOString().slice(0, 7); // 'YYYY-MM'
    
    // 1. Members stats
    const { data: members, error: mErr } = await supabaseAdmin.from('members_view').select('status, days_remaining');
    if (mErr) throw mErr;
    
    let totalMembers = 0, activeMembers = 0, expiredMembers = 0, expiringSoon = 0;
    (members || []).forEach(m => {
      totalMembers++;
      if (m.status === 'active') activeMembers++;
      else if (m.status === 'expired') expiredMembers++;
      else if (m.status === 'expiring') expiringSoon++;
    });

    // 2. Payments (Monthly Revenue & Pending)
    const { data: payments, error: pErr } = await supabaseAdmin.from('payments').select('status, amount, payment_date');
    if (pErr) throw pErr;

    let monthlyRevenue = 0, pendingPayments = 0;
    (payments || []).forEach(p => {
      const status = (p.status || '').toLowerCase();
      if ((status === 'paid' || status === 'partial') && p.payment_date?.startsWith(currentMonthStr)) {
        monthlyRevenue += Number(p.amount);
      }
      if (status === 'pending' || status === 'partial') {
        pendingPayments++;
      }
    });

    // 3. Expenses (Monthly Expenses)
    const { data: expenses, error: eErr } = await supabaseAdmin.from('expenses').select('amount, expense_date').is('deleted_at', null);
    if (eErr) throw eErr;

    let monthlyExpenses = 0;
    (expenses || []).forEach(e => {
      if (e.expense_date?.startsWith(currentMonthStr)) {
        monthlyExpenses += Number(e.amount);
      }
    });

    // 4. Net Profit
    const netProfit = monthlyRevenue - monthlyExpenses;

    // 5. Attendance Today
    const todayStr = new Date().toISOString().split('T')[0];
    const { count: attendanceToday, error: aErr } = await supabaseAdmin
      .from('attendance')
      .select('id', { count: 'exact', head: true })
      .eq('date', todayStr)
      .eq('status', 'present');
    if (aErr) throw aErr;

    // 6. Total Trainers
    const { count: totalTrainers, error: tErr } = await supabaseAdmin
      .from('trainers')
      .select('id', { count: 'exact', head: true })
      .is('deleted_at', null)
      .eq('is_active', true);
    if (tErr && tErr.code !== 'PGRST116') throw tErr;

    res.json({
      totalMembers,
      activeMembers,
      expiredMembers,
      expiringSoon,
      monthlyRevenue,
      monthlyExpenses,
      netProfit,
      pendingPayments,
      attendanceToday: attendanceToday || 0,
      totalTrainers: totalTrainers || 0
    });
  } catch (error) {
    console.error('Analytics Dashboard Error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/insights', withSupabase({ auth: 'none' }), async (req, res) => {
  try {
    const { data: members } = await supabaseAdmin.from('members_view').select('status, plan');
    const { data: payments } = await supabaseAdmin.from('payments').select('amount, payment_date, status');

    const totalMembers = (members || []).length;
    let activeMembers = 0, expiredMembers = 0, expiringMembers = 0;
    const planCounts = {};

    (members || []).forEach(m => {
      if (m.status === 'active') activeMembers++;
      else if (m.status === 'expired') expiredMembers++;
      else if (m.status === 'expiring') expiringMembers++;

      planCounts[m.plan] = (planCounts[m.plan] || 0) + 1;
    });

    const retentionRate = totalMembers > 0 ? Math.round((activeMembers / totalMembers) * 100) : 0;
    const renewalRate = totalMembers > 0 ? Math.round(((totalMembers - expiredMembers) / totalMembers) * 100) : 0;

    const topPlans = Object.entries(planCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([plan, count]) => ({ plan, count }));

    const revByMonth = {};
    (payments || []).forEach(p => {
      if (p.status === 'paid') {
        const m = p.payment_date?.slice(0, 7);
        if (m) revByMonth[m] = (revByMonth[m] || 0) + Number(p.amount);
      }
    });

    const revenueTrend = Object.entries(revByMonth)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-6)
      .map(([m, revenue]) => ({
        month: new Date(m + '-01').toLocaleString('en-IN', { month: 'short' }),
        revenue,
      }));

    const currentMonth = new Date().toISOString().slice(0, 7);
    const expectedMonthlyIncome = (payments || [])
      .filter(p => p.status === 'paid' && p.payment_date?.startsWith(currentMonth))
      .reduce((s, p) => s + Number(p.amount), 0);

    res.json({
      totalMembers, activeMembers, expiredMembers, expiringMembers,
      retentionRate, renewalRate, inactiveMembers: expiredMembers,
      topPlans, revenueTrend, expectedMonthlyIncome
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/reports', withSupabase({ auth: 'none' }), async (req, res) => {
  try {
    const [paymentsRes, attendanceRes, membersRes, expensesRes] = await Promise.all([
      supabaseAdmin.from('payments').select('payment_date, amount, status'),
      supabaseAdmin.from('attendance').select('date, status'),
      supabaseAdmin.from('members_view').select('plan, status'),
      supabaseAdmin.from('expenses').select('amount, expense_date').is('deleted_at', null),
    ]);

    const payments = paymentsRes.data || [];
    const attendance = attendanceRes.data || [];
    const members = membersRes.data || [];
    const expenses = expensesRes.data || [];

    const totalRevenue = payments.filter(p => p.status === 'paid').reduce((s, p) => s + Number(p.amount), 0);
    const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0);
    const netProfit = totalRevenue - totalExpenses;

    const revByMonth = {};
    const expByMonth = {};
    
    payments.filter(p => p.status === 'paid').forEach(p => {
      const m = p.payment_date?.slice(0, 7);
      if (m) revByMonth[m] = (revByMonth[m] || 0) + Number(p.amount);
    });
    
    expenses.forEach(e => {
      const m = e.expense_date?.slice(0, 7);
      if (m) expByMonth[m] = (expByMonth[m] || 0) + Number(e.amount);
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

    const planCounts = {};
    members.forEach(m => { planCounts[m.plan] = (planCounts[m.plan] || 0) + 1; });
    const colors = ['#fbbf24', '#4ade80', '#60a5fa', '#f87171', '#a78bfa'];
    const membershipDistribution = Object.entries(planCounts).map(([name, value], i) => ({
      name, value, color: colors[i % colors.length],
    }));

    const attByWeek = {};
    attendance.filter(a => a.status === 'present').forEach(a => {
      const d = new Date(a.date);
      const weekNum = Math.ceil(d.getDate() / 7);
      const key = `W${weekNum} ${d.toLocaleString('en-IN', { month: 'short' })}`;
      attByWeek[key] = (attByWeek[key] || 0) + 1;
    });
    const attendanceTrend = Object.entries(attByWeek).slice(-4).map(([week, attendance]) => ({ week, attendance }));

    const presentCount = attendance.filter(a => a.status === 'present').length;
    const avgAttendance = attendanceTrend.length > 0 ? Math.round(presentCount / attendanceTrend.length) : 0;

    res.json({
      totalRevenue, totalExpenses, netProfit, avgAttendance,
      monthlyRevenueData, membershipDistribution, attendanceTrend
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/expenses', withSupabase({ auth: 'none' }), async (req, res) => {
  try {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const [expensesRes, paymentsRes] = await Promise.all([
      supabaseAdmin.from('expenses').select('amount, expense_date, category').is('deleted_at', null),
      supabaseAdmin.from('payments').select('amount, payment_date, status').is('deleted_at', null),
    ]);

    const expenses = expensesRes.data || [];
    const payments = paymentsRes.data || [];

    const totalExpenses = expenses.filter(e => e.expense_date?.startsWith(currentMonth)).reduce((s, e) => s + Number(e.amount), 0);
    const totalRevenue = payments.filter(p => p.status === 'paid' && p.payment_date?.startsWith(currentMonth)).reduce((s, p) => s + Number(p.amount), 0);
    const netProfit = totalRevenue - totalExpenses;

    const catTotals = {};
    expenses.filter(e => e.expense_date?.startsWith(currentMonth)).forEach(e => {
      catTotals[e.category] = (catTotals[e.category] || 0) + Number(e.amount);
    });
    const monthlyExpenses = Object.entries(catTotals).map(([category, total]) => ({ category, total }));

    const monthlyComp = Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const m = d.toISOString().slice(0, 7);
      return {
        month: d.toLocaleString('en-IN', { month: 'short' }),
        expenses: expenses.filter(e => e.expense_date?.startsWith(m)).reduce((s, e) => s + Number(e.amount), 0),
      };
    }).reverse();

    res.json({ totalExpenses, totalRevenue, netProfit, monthlyExpenses, monthlyComparison: monthlyComp });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
