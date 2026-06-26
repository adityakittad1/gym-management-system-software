
try {
  require('dotenv').config();
} catch (e) {
  console.log('[Startup] dotenv not found, assuming environment variables are injected');
}

process.on('uncaughtException', (err) => {
  if (err && err.message && err.message.includes('EBUSY')) {
    console.error('[WhatsApp Debug] Suppressed EBUSY uncaughtException on logout:', err.message);
  } else {
    console.error('Uncaught Exception:', err);
  }
});

process.on('unhandledRejection', (reason, promise) => {
  if (reason && reason.message && reason.message.includes('EBUSY')) {
    console.error('[WhatsApp Debug] Suppressed EBUSY unhandledRejection on logout:', reason.message);
  } else {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  }
});

const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server: SocketIOServer } = require('socket.io');
const { supabaseAdmin, withSupabase, validateSupabaseConnection } = require('./supabase');
const whatsappService = require('./whatsapp-service');
const analyticsRouter = require('./analytics-service');
const admissionRouter = require('./admission-service');
const templateEngine = require('./whatsapp-template-engine');
const { healthRoutes, validateDatabaseStartup } = require('./health');
const scheduler = require('./scheduler');
const logger = require('./logger');

const app = express();
const httpServer = http.createServer(app);

// Trust proxy — required for Render (behind load balancer)
app.set('trust proxy', 1);

const ALLOWED_ORIGINS = [
  'https://gym-management-system-software-serv.vercel.app',
  'https://gym-management-system-software-serv-git-main-adityakittad1.vercel.app',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
];

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

io.on('connection', (socket) => {
  console.log('[Socket.IO] Client connected:', socket.id);
  socket.emit('wa:status', whatsappService.getStatus());
  const qr = whatsappService.getQR();
  if (qr) socket.emit('wa:qr', { qrDataURL: qr });

  socket.on('disconnect', () => {
    console.log('[Socket.IO] Client disconnected:', socket.id);
  });
});

app.use(cors({
  origin: ALLOWED_ORIGINS,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));


// Health Endpoints
app.use('/health', healthRoutes);

// Detailed Request Logging Middleware
app.use((req, res, next) => {
  req.reqId = req.reqId || require('crypto').randomUUID();
  if (!req.url.startsWith('/health')) { // Don't spam logs with health checks
    logger.info('API', `${req.method} ${req.url}`, { reqId: req.reqId });
  }
  next();
});

// Helper for structured responses
const respond = (res, req, data, error = null, status = 200) => {
  if (error) {
    console.error(`[Error] ReqID: ${req.reqId} | Endpoint: ${req.method} ${req.url} | User: ${req.ctx?.user?.sub || 'anonymous'}`);
    console.error(error);
    const errRes = {
      success: false,
      error: error.message || 'Internal Server Error',
      reqId: req.reqId
    };
    if (process.env.NODE_ENV !== 'production') {
      errRes.stack = error.stack;
    }
    return res.status(status || 500).json(errRes);
  }
  return res.status(status).json({ success: true, data, reqId: req.reqId });
};

// Health Check
app.get('/health', withSupabase({ auth: 'none' }), (req, res) => {
  res.json({ status: 'ok' });
});

// Generic CRUD wrapper
const createCrudEndpoints = (table) => {
  app.get(`/api/${table}`, withSupabase({ auth: 'user' }), async (req, res) => {
    try {
      const { data, error } = await req.ctx.supabase.from(table).select('*');
      if (error) throw error;
      respond(res, req, data);
    } catch (err) {
      respond(res, req, null, err);
    }
  });

  app.post(`/api/${table}`, withSupabase({ auth: 'user' }), async (req, res) => {
    try {
      const { data, error } = await req.ctx.supabase.from(table).insert([req.body]).select();
      if (error) throw error;
      respond(res, req, data[0]);
    } catch (err) {
      respond(res, req, null, err);
    }
  });

  app.put(`/api/${table}/:id`, withSupabase({ auth: 'user' }), async (req, res) => {
    try {
      const { data, error } = await req.ctx.supabase.from(table).update(req.body).eq('id', req.params.id).select();
      if (error) throw error;
      respond(res, req, data[0]);
    } catch (err) {
      respond(res, req, null, err);
    }
  });

  app.delete(`/api/${table}/:id`, withSupabase({ auth: 'user' }), async (req, res) => {
    try {
      const { error } = await req.ctx.supabase.from(table).delete().eq('id', req.params.id);
      if (error) throw error;
      respond(res, req, { deleted: true });
    } catch (err) {
      respond(res, req, null, err);
    }
  });
};

['members', 'payments', 'attendance', 'trainers', 'expenses', 'leads', 'visitors', 'workouts', 'diet_plans', 'notifications', 'settings', 'activities'].forEach(createCrudEndpoints);

// Use specialized routers
app.use('/api/analytics', analyticsRouter);
app.use('/api/admission', admissionRouter);

// ── Dashboard Action Items ────────────────────────────────────────────────────
app.get('/api/dashboard/actions', withSupabase({ auth: 'none' }), async (req, res) => {
  try {
    const { data: members } = await supabaseAdmin.from('members_view').select('id, status, days_remaining');
    const { data: payments } = await supabaseAdmin.from('payments').select('id, status');
    
    const expiring7 = (members || []).filter(m => m.days_remaining >= 0 && m.days_remaining <= 7);
    const expired = (members || []).filter(m => m.status === 'expired');
    const pending = (payments || []).filter(p => p.status === 'pending');
    
    const actions = [];
    if (expiring7.length > 0) {
      actions.push({ id: 1, type: 'expiry', priority: 'high', title: 'Memberships Expiring Soon', description: `${expiring7.length} members expiring within 7 days`, count: expiring7.length, icon: '⏰', affectedIds: expiring7.map(m => m.id) });
    }
    if (expired.length > 0) {
      actions.push({ id: 2, type: 'renewal', priority: 'medium', title: 'Expired Memberships', description: `${expired.length} memberships have expired`, count: expired.length, icon: '❌', affectedIds: expired.map(m => m.id) });
    }
    if (pending.length > 0) {
      actions.push({ id: 3, type: 'payment', priority: 'medium', title: 'Pending Payments', description: `${pending.length} payments pending`, count: pending.length, icon: '💰' });
    }
    
    res.json(actions);
  } catch (err) {
    res.json([]);
  }
});

// ── Recent Activity Feed ──────────────────────────────────────────────────────
app.get('/api/dashboard/recent-activity', withSupabase({ auth: 'none' }), async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('activities')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.json([]);
  }
});

// ── Coaches (alias for trainers with stats) ───────────────────────────────────
app.get('/api/coaches', withSupabase({ auth: 'none' }), async (req, res) => {
  try {
    const { data: trainers, error } = await supabaseAdmin
      .from('trainers')
      .select('*')
      .is('deleted_at', null)
      .order('id', { ascending: true });
    if (error) throw error;
    
    // Enrich with member counts
    const enriched = await Promise.all((trainers || []).map(async (t) => {
      const { count } = await supabaseAdmin
        .from('members')
        .select('id', { count: 'exact', head: true })
        .eq('trainer_id', t.id)
        .is('deleted_at', null);
      return { ...t, assignedMembers: count || 0 };
    }));
    
    res.json({ success: true, data: enriched });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Business Insights ─────────────────────────────────────────────────────────
app.get('/api/business-insights', withSupabase({ auth: 'none' }), async (req, res) => {
  try {
    const { data: members } = await supabaseAdmin.from('members_view').select('status, plan');
    const { data: payments } = await supabaseAdmin.from('payments').select('amount, payment_date, status');

    const totalMembers = (members || []).length;
    let activeMembers = 0, expiredMembers = 0, expiringMembers = 0;
    const planCounts = {};

    (members || []).forEach(m => {
      if (m.status === 'active') activeMembers++;
      else if (m.status === 'expired') expiredMembers++;
      else if (m.status === 'expiring') { activeMembers++; expiringMembers++; }
      planCounts[m.plan] = (planCounts[m.plan] || 0) + 1;
    });

    const retentionRate = totalMembers > 0 ? Math.round((activeMembers / totalMembers) * 100) : 0;
    const renewalRate = totalMembers > 0 ? Math.round(((totalMembers - expiredMembers) / totalMembers) * 100) : 0;
    const topPlans = Object.entries(planCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([plan, count]) => ({ plan, count }));

    const revByMonth = {};
    (payments || []).forEach(p => {
      if (p.status === 'paid') {
        const m = (p.payment_date || '').toString().slice(0, 7);
        if (m) revByMonth[m] = (revByMonth[m] || 0) + Number(p.amount);
      }
    });
    const revenueTrend = Object.entries(revByMonth).sort((a, b) => a[0].localeCompare(b[0])).slice(-6)
      .map(([m, revenue]) => ({ month: new Date(m + '-01').toLocaleString('en-IN', { month: 'short' }), revenue }));

    const currentMonth = new Date().toISOString().slice(0, 7);
    const expectedMonthlyIncome = (payments || [])
      .filter(p => p.status === 'paid' && (p.payment_date || '').toString().startsWith(currentMonth))
      .reduce((s, p) => s + Number(p.amount), 0);

    res.json({ totalMembers, activeMembers, expiredMembers, expiringMembers, retentionRate, renewalRate, inactiveMembers: expiredMembers, topPlans, revenueTrend, expectedMonthlyIncome });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ── Reports (alias for analytics/reports) ────────────────────────────────────
// Forward to the analytics router handler directly
app.get('/api/reports', withSupabase({ auth: 'none' }), async (req, res) => {
  // Reuse the analytics router by calling Supabase directly
  try {
    const [paymentsRes, attendanceRes, membersRes, expensesRes] = await Promise.all([
      supabaseAdmin.from('payments').select('payment_date, amount, status'),
      supabaseAdmin.from('attendance').select('date, status'),
      supabaseAdmin.from('members_view').select('plan, status'),
      supabaseAdmin.from('expenses').select('amount, expense_date'),
    ]);
    const payments = paymentsRes.data || [];
    const attendance = attendanceRes.data || [];
    const members = membersRes.data || [];
    const expenses = expensesRes.data || [];

    const totalRevenue = payments.filter(p => p.status === 'paid').reduce((s, p) => s + Number(p.amount), 0);
    const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0);
    const netProfit = totalRevenue - totalExpenses;

    const revByMonth = {};
    payments.filter(p => p.status === 'paid').forEach(p => {
      const m = (p.payment_date || '').toString().slice(0, 7);
      if (m) revByMonth[m] = (revByMonth[m] || 0) + Number(p.amount);
    });

    const allMonths = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(); d.setMonth(d.getMonth() - (5 - i));
      return d.toISOString().slice(0, 7);
    });
    const expByMonth = {};
    expenses.forEach(e => {
      const m = (e.expense_date || '').toString().slice(0, 7);
      if (m) expByMonth[m] = (expByMonth[m] || 0) + Number(e.amount);
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
      const key = `W${Math.ceil(d.getDate() / 7)} ${d.toLocaleString('en-IN', { month: 'short' })}`;
      attByWeek[key] = (attByWeek[key] || 0) + 1;
    });
    const attendanceTrend = Object.entries(attByWeek).slice(-4).map(([week, at]) => ({ week, attendance: at }));
    const avgAttendance = attendanceTrend.length > 0
      ? Math.round(attendance.filter(a => a.status === 'present').length / attendanceTrend.length)
      : 0;

    res.json({ totalRevenue, totalExpenses, netProfit, avgAttendance, monthlyRevenueData, membershipDistribution, attendanceTrend });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// WhatsApp API Routes
app.get('/api/whatsapp/config', withSupabase({ auth: 'none' }), async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('whatsapp_sessions')
      .select('*')
      .eq('session_name', 'default')
      .limit(1)
      .maybeSingle();
    if (error && error.code !== 'PGRST116') throw error;
    respond(res, req, data || {});
  } catch (error) {
    respond(res, req, null, error);
  }
});

app.post('/api/whatsapp/config', withSupabase({ auth: 'none' }), async (req, res) => {
  try {
    const row = { session_name: 'default', ...req.body, updated_at: new Date().toISOString() };
    const { data: existing, error: lookupError } = await supabaseAdmin
      .from('whatsapp_sessions')
      .select('id')
      .eq('session_name', 'default')
      .limit(1)
      .maybeSingle();
    if (lookupError) throw lookupError;

    let data;
    let error;
    if (existing?.id) {
      ({ data, error } = await supabaseAdmin
        .from('whatsapp_sessions')
        .update(row)
        .eq('id', existing.id)
        .select());
    } else {
      ({ data, error } = await supabaseAdmin.from('whatsapp_sessions').insert([row]).select());
    }
    if (error) throw error;
    respond(res, req, data);
  } catch (error) {
    respond(res, req, null, error);
  }
});

app.get('/api/whatsapp/logs', withSupabase({ auth: 'none' }), async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin.from('whatsapp_logs').select('*').order('created_at', { ascending: false }).limit(50);
    if (error) throw error;
    respond(res, req, data);
  } catch (error) {
    respond(res, req, null, error);
  }
});

app.delete('/api/whatsapp/logs', withSupabase({ auth: 'none' }), async (req, res) => {
  try {
    const { error } = await supabaseAdmin.from('whatsapp_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (error) throw error;
    respond(res, req, { deleted: true });
  } catch (error) {
    respond(res, req, null, error);
  }
});

app.get('/api/whatsapp/real-status', withSupabase({ auth: 'none' }), (req, res) => {
  res.json(whatsappService.getStatus());
});

app.post('/api/whatsapp/connect', withSupabase({ auth: 'none' }), async (req, res) => {
  try {
    // Respond immediately so UI doesn't hang
    res.json({ success: true, message: 'WhatsApp initialization started. Check status or scan QR code.' });
    
    // Initialize in background with a delay to ensure HTTP response flushes before Chromium hogs memory
    setTimeout(() => {
      whatsappService.initialize(io).catch(err => {
        global.whatsappLastError = err.stack || err.message || err.toString();
        console.error('[WhatsApp] Background init error:', err.message);
      });
    }, 1000);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/whatsapp/last-error', (req, res) => {
  res.json({ lastError: global.whatsappLastError || 'No error recorded.' });
});

app.get('/api/whatsapp/diagnostic', async (req, res) => {
  const fs = require('fs');
  const path = require('path');
  const { execSync } = require('child_process');
  
  const report = {
    browserExists: false,
    browserPath: null,
    browserVersion: null,
    puppeteerVersion: null,
    whatsappVersion: null,
    nodeVersion: process.version,
    launchTest: 'skipped',
    sessionExists: false,
    sessionPath: null,
    currentState: 'unknown',
    lastEvent: 'none',
    lastError: null,
    stack: null
  };
  
  try {
    try {
      report.puppeteerVersion = require('puppeteer/package.json').version;
    } catch(e) { report.puppeteerVersion = e.message; }
    
    try {
      report.whatsappVersion = require('whatsapp-web.js/package.json').version;
    } catch(e) { report.whatsappVersion = e.message; }
    
    // Advanced Diagnostic
    try {
      report.serverDirList = execSync('ls -la /opt/render/project/src/server', { stdio: 'pipe' }).toString().trim();
      report.cacheDirList = execSync('ls -la /opt/render/project/src/server/puppeteer-browsers 2>/dev/null || echo "MISSING"', { stdio: 'pipe' }).toString().trim();
    } catch(e) {
      report.serverDirList = e.message;
    }

    // Find Chrome using native find command to eliminate all guessing
    let foundChrome = null;
    try {
      // Search in project root and .cache
      const findCmd = `find /opt/render/project -type f -name "chrome" -executable 2>/dev/null | head -n 1`;
      const out = execSync(findCmd, { stdio: 'pipe' }).toString().trim();
      if (out) {
        foundChrome = out;
        report.browserExists = true;
        report.browserPath = foundChrome;
      }
    } catch(e) {
      // Find command failed
    }

    if (!foundChrome) {
      // Fallback manual check
      const candidates = [
        process.env.PUPPETEER_EXECUTABLE_PATH,
        '/opt/render/project/src/server/puppeteer-browsers/chrome/linux-148.0.7778.97/chrome-linux64/chrome',
        '/usr/bin/google-chrome-stable',
        '/usr/bin/google-chrome',
        '/usr/bin/chromium-browser'
      ];
      for (const p of candidates) {
        if (p && fs.existsSync(p)) {
          foundChrome = p;
          report.browserExists = true;
          report.browserPath = foundChrome;
          break;
        }
      }
    }

    if (foundChrome) {
      try {
        const v = execSync(`"${foundChrome}" --version`, { stdio: 'pipe' }).toString().trim();
        report.browserVersion = v;
      } catch(e) {
        report.browserVersion = `Failed to get version: ${e.message}`;
        report.lastError = e.message;
        report.stack = e.stderr ? e.stderr.toString() : e.stack;
      }
    }

    // Phase 2 - Launch Test
    if (report.browserExists) {
      try {
        const pup = require('puppeteer');
        const browser = await pup.launch({
          headless: true,
          executablePath: foundChrome,
          args: ['--no-sandbox', '--disable-setuid-sandbox', '--single-process', '--disable-gpu']
        });
        const page = await browser.newPage();
        await page.goto('https://example.com');
        await page.close();
        await browser.close();
        report.launchTest = 'passed';
      } catch(e) {
        report.launchTest = 'failed';
        report.lastError = e.message;
        report.stack = e.stack;
      }
    } else {
      report.lastError = 'Browser executable not found anywhere in /opt/render/project';
    }

    // Phase 5 - Session Verification
    const sessionDir = path.join(__dirname, '.wwebjs_auth');
    if (fs.existsSync(sessionDir)) {
      report.sessionExists = true;
      report.sessionPath = sessionDir;
    }
    
    // Import state from whatsapp service
    const { state } = require('./whatsapp-service');
    if (state) {
      report.currentState = state.status;
      report.lastEvent = state.lastEvent || 'none';
      if (!report.lastError && global.whatsappLastError) {
        report.lastError = global.whatsappLastError;
      }
    }

    res.json(report);
  } catch (err) {
    report.lastError = err.message;
    report.stack = err.stack;
    res.status(500).json(report);
  }
});

app.post('/api/whatsapp/pairing-code', withSupabase({ auth: 'none' }), async (req, res) => {
  try {
    const { phone } = req.body;
    const code = await whatsappService.requestPairingCode(phone);
    res.json({ success: true, pairingCode: code });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/whatsapp/disconnect', withSupabase({ auth: 'none' }), async (req, res) => {
  try {
    await whatsappService.disconnect();
    res.json({ success: true, status: whatsappService.getStatus() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/whatsapp/clear-session', withSupabase({ auth: 'none' }), async (req, res) => {
  try {
    const path = require('path');
    const fs = require('fs');
    // Destroy the client first
    await whatsappService.disconnect().catch(() => {});
    // Delete the session folder
    const sessionDir = path.join(__dirname, '../../.wwebjs_auth');
    if (fs.existsSync(sessionDir)) {
      fs.rmSync(sessionDir, { recursive: true, force: true });
    }
    console.log('[WhatsApp] Session cleared — will generate fresh QR on next connect.');
    res.json({ success: true, message: 'Session cleared. Click Connect to get a new QR code.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/whatsapp/reconnect', withSupabase({ auth: 'none' }), async (req, res) => {
  try {
    await whatsappService.reconnect();
    res.json({ success: true, status: whatsappService.getStatus() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/whatsapp/send-message', withSupabase({ auth: 'none' }), async (req, res) => {
  try {
    const { phone, message, memberName, member_id, memberId, pdfBase64 } = req.body;
    const result = await whatsappService.sendMessage(phone, message, { member: memberName }, pdfBase64);
    
    // Log message using admin client into the new whatsapp_logs table
    await supabaseAdmin.from('whatsapp_logs').insert([{
      recipient_phone: phone,
      member_id: member_id || memberId || null,
      message_type: 'manual',
      content: message,
      status: 'sent',
      sent_at: new Date().toISOString()
    }]);

    res.json({ success: true, result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reminder Generator & Dispatch
app.post('/api/whatsapp/send-reminders', withSupabase({ auth: 'none' }), async (req, res) => {
  try {
    const { type, memberId } = req.body;
    // type can be 'expiry' for now
    
    // Fetch settings
    const { data: settingsData } = await supabaseAdmin.from('settings').select('*');
    const gymSettings = {};
    (settingsData || []).forEach(s => { gymSettings[s.key] = s.value; });

    // Fetch members
    let query = supabaseAdmin.from('members_view').select('*').in('status', ['active', 'expiring', 'expired']);
    if (memberId) {
      query = query.eq('id', memberId);
    }
    const { data: members } = await query;
    
    let sent = 0, failed = 0, errors = [];

    for (const member of (members || [])) {
      if (!member.phone || member.phone.length < 10) continue;

      let templateType = null;
      let days = member.days_remaining;

      if (type === 'expiry') {
        if (days === 30) templateType = 'expiry_30';
        else if (days === 15) templateType = 'expiry_15';
        else if (days === 7) templateType = 'expiry_7';
        else if (days <= 5 && days > 0) templateType = 'expiry_generic';
        else if (days === 0) templateType = 'expiry_today';
        else if (days < 0 && days >= -5) templateType = 'expired';
      }

      if (templateType) {
        try {
          const message = templateEngine.generateMessage(templateType, member, gymSettings);
          await whatsappService.sendMessage(member.phone, message, { member: member.name });
          
          await supabaseAdmin.from('whatsapp_logs').insert([{
            recipient_phone: member.phone,
            member_id: member.id,
            message_type: templateType,
            content: message,
            status: 'sent',
            sent_at: new Date().toISOString()
          }]);
          sent++;
        } catch (e) {
          failed++;
          errors.push({ phone: member.phone, error: e.message });
          
          await supabaseAdmin.from('whatsapp_logs').insert([{
            recipient_phone: member.phone,
            member_id: member.id,
            message_type: templateType,
            content: 'Failed to generate or send message',
            status: 'failed',
            error_reason: e.message
          }]);
        }
      }
    }
    
    res.json({ success: true, sent, failed, errors });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/whatsapp/send-bulk', withSupabase({ auth: 'none' }), async (req, res) => {
  try {
    const { members: memberList, template } = req.body;
    if (!memberList || !Array.isArray(memberList)) {
      return res.status(400).json({ error: 'members array is required' });
    }

    const { data: settingsData } = await supabaseAdmin.from('settings').select('*');
    const gymSettings = {};
    (settingsData || []).forEach(s => { gymSettings[s.key] = s.value; });

    let sent = 0, failed = 0, errors = [];
    for (const member of memberList) {
      try {
        const message = templateEngine.replacePlaceholders(template, member, gymSettings);
        await whatsappService.sendMessage(member.phone, message, { member: member.name });
        await supabaseAdmin.from('whatsapp_logs').insert([{
          recipient_phone: member.phone,
          member_id: member.id || null,
          message_type: 'bulk',
          content: message,
          status: 'sent',
          sent_at: new Date().toISOString()
        }]);
        sent++;
      } catch (e) {
        failed++;
        errors.push({ phone: member.phone, error: e.message });
        await supabaseAdmin.from('whatsapp_logs').insert([{
          recipient_phone: member.phone,
          member_id: member.id || null,
          message_type: 'bulk',
          content: template,
          status: 'failed',
          error_reason: e.message
        }]);
      }
    }
    res.json({ success: true, total: memberList.length, sent, failed, errors });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Final error handler
app.use((err, req, res, next) => {
  console.error('[Unhandled Error]', err);
  res.status(500).json({ error: err.message });
});

// --- Start Server ---
const PORT = process.env.PORT || 5001;

async function bootstrap() {
  logger.info('Startup', 'Booting TTZ Gym Management Backend...');
  
  // 1. Verify DB
  await validateDatabaseStartup();

  // 2. Start Scheduler
  scheduler.initScheduler();

  httpServer.listen(PORT, () => {
    logger.info('Startup', `Backend server running on http://localhost:${PORT}`);
    
    // 3. Auto-Initialize WhatsApp in the background
    // If a session exists, it will seamlessly reconnect. If not, it will await connection.
    setTimeout(() => {
      logger.info('Startup', 'Auto-initializing WhatsApp service...');
      whatsappService.initialize(io).catch(err => {
        logger.error('Startup', 'WhatsApp initialization failed', err.message);
      });
    }, 2000);
  });
}

bootstrap();
