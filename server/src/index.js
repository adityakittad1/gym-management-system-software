
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

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
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

app.use(cors());
app.use(express.json());

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

// Auth is handled entirely by the frontend via Supabase Auth.
// No custom backend login endpoints are required.

// Auth is handled entirely by the frontend via Supabase Auth.
// No custom backend login endpoints are required.

// Use specialized routers
app.use('/api/analytics', analyticsRouter);
app.use('/api/admission', admissionRouter);

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
    // Respond immediately so UI doesn't hang — WhatsApp init is async (browser launch takes time)
    res.json({ success: true, message: 'WhatsApp initialization started. Check status or scan QR code.' });
    // Initialize in background
    whatsappService.initialize(io).catch(err => {
      console.error('[WhatsApp] Background init error:', err.message);
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
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
