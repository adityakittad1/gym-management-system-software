const fs = require('fs');
const path = require('path');

const code = `
require('dotenv').config();

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
const { withSupabase, validateSupabaseConnection, supabaseAdmin } = require('./supabase');
const whatsappService = require('./whatsapp-service');

const app = express();
const httpServer = http.createServer(app);

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174'],
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

// Detailed Request Logging Middleware
app.use((req, res, next) => {
  req.reqId = req.reqId || require('crypto').randomUUID();
  console.log(\`\\n[API REQ] \${new Date().toISOString()} | ReqID: \${req.reqId} | \${req.method} \${req.url}\`);
  next();
});

// Helper for structured responses
const respond = (res, req, data, error = null, status = 200) => {
  if (error) {
    console.error(\`[Error] ReqID: \${req.reqId} | Endpoint: \${req.method} \${req.url} | User: \${req.ctx?.user?.sub || 'anonymous'}\`);
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
  app.get(\`/api/\${table}\`, withSupabase({ auth: 'user' }), async (req, res) => {
    try {
      const { data, error } = await req.ctx.supabase.from(table).select('*');
      if (error) throw error;
      respond(res, req, data);
    } catch (err) {
      respond(res, req, null, err);
    }
  });

  app.post(\`/api/\${table}\`, withSupabase({ auth: 'user' }), async (req, res) => {
    try {
      const { data, error } = await req.ctx.supabase.from(table).insert([req.body]).select();
      if (error) throw error;
      respond(res, req, data[0]);
    } catch (err) {
      respond(res, req, null, err);
    }
  });

  app.put(\`/api/\${table}/:id\`, withSupabase({ auth: 'user' }), async (req, res) => {
    try {
      const { data, error } = await req.ctx.supabase.from(table).update(req.body).eq('id', req.params.id).select();
      if (error) throw error;
      respond(res, req, data[0]);
    } catch (err) {
      respond(res, req, null, err);
    }
  });

  app.delete(\`/api/\${table}/:id\`, withSupabase({ auth: 'user' }), async (req, res) => {
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

// Auth login (using Supabase Auth instead of manual db queries)
app.post('/api/auth/login', withSupabase({ auth: 'none' }), async (req, res) => {
  const { email, password } = req.body;
  try {
    const { data, error } = await supabaseAdmin.auth.signInWithPassword({ email, password });
    if (error) throw error;
    res.json({ success: true, user: data.user, session: data.session });
  } catch (error) {
    res.status(401).json({ success: false, message: error.message });
  }
});

app.post('/api/auth/member-login', withSupabase({ auth: 'none' }), async (req, res) => {
  const { phone } = req.body;
  try {
    const { data, error } = await supabaseAdmin.from('members').select('*').eq('phone', phone).single();
    if (error) throw error;
    res.json({ success: true, user: data });
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid phone number' });
  }
});

// Dashboard Overview Routes
app.get('/api/dashboard/stats', withSupabase({ auth: 'user' }), async (req, res) => {
  try {
    const [{ count: totalMembers }, { count: activeMembers }, { count: pendingPayments }] = await Promise.all([
      req.ctx.supabase.from('members').select('*', { count: 'exact', head: true }),
      req.ctx.supabase.from('members').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      req.ctx.supabase.from('payments').select('*', { count: 'exact', head: true }).eq('status', 'pending')
    ]);
    respond(res, req, { totalMembers, activeMembers, pendingPayments });
  } catch (err) {
    respond(res, req, null, err);
  }
});

app.get('/api/dashboard/charts', withSupabase({ auth: 'user' }), async (req, res) => {
  try {
    respond(res, req, { revenueData: [], membershipData: [], weeklyStats: [], attendanceTrend: [] });
  } catch (error) {
    respond(res, req, null, error);
  }
});

app.get('/api/dashboard/recent-activity', withSupabase({ auth: 'user' }), async (req, res) => {
  try {
    const { data, error } = await req.ctx.supabase.from('activities').select('*').order('id', { ascending: false }).limit(10);
    if (error) throw error;
    respond(res, req, data);
  } catch (error) {
    respond(res, req, null, error);
  }
});

// WhatsApp API Routes
app.get('/api/whatsapp/config', withSupabase({ auth: 'secret' }), async (req, res) => {
  try {
    const { data, error } = await req.ctx.supabaseAdmin.from('whatsapp_config').select('*').limit(1).single();
    if (error && error.code !== 'PGRST116') throw error;
    respond(res, req, data || {});
  } catch (error) {
    respond(res, req, null, error);
  }
});

app.post('/api/whatsapp/config', withSupabase({ auth: 'secret' }), async (req, res) => {
  try {
    const { data, error } = await req.ctx.supabaseAdmin.from('whatsapp_config').upsert({ id: 1, ...req.body }).select();
    if (error) throw error;
    respond(res, req, data);
  } catch (error) {
    respond(res, req, null, error);
  }
});

app.get('/api/whatsapp/logs', withSupabase({ auth: 'secret' }), async (req, res) => {
  try {
    const { data, error } = await req.ctx.supabaseAdmin.from('reminder_logs').select('*').order('id', { ascending: false }).limit(50);
    if (error) throw error;
    respond(res, req, data);
  } catch (error) {
    respond(res, req, null, error);
  }
});

app.delete('/api/whatsapp/logs', withSupabase({ auth: 'secret' }), async (req, res) => {
  try {
    const { error } = await req.ctx.supabaseAdmin.from('reminder_logs').delete().neq('id', 0);
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
    await whatsappService.connect();
    res.json({ success: true, status: whatsappService.getStatus() });
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
    const { phone, message, memberName } = req.body;
    const result = await whatsappService.sendMessage(phone, message);
    
    // Log message using admin client
    await supabaseAdmin.from('reminder_logs').insert([{
      memberName: memberName || 'Unknown',
      phone,
      type: 'manual',
      message,
      method: 'whatsapp',
      status: 'delivered'
    }]);

    res.json({ success: true, result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/whatsapp/send-bulk', withSupabase({ auth: 'none' }), async (req, res) => {
  try {
    const { members, template } = req.body;
    const result = await whatsappService.sendBulkMessages(members, template);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Final error handler
app.use((err, req, res, next) => {
  console.error('[Unhandled Error]', err);
  res.status(500).json({ error: err.message });
});

const PORT = process.env.PORT || 5000;

// Start Server with Validation
async function startServer() {
  console.log('[System] Starting TTZ API Server...');
  await validateSupabaseConnection();
  
  httpServer.listen(PORT, () => {
    console.log(\`[Server] Running on http://localhost:\${PORT}\`);
    console.log(\`[Server] Production Supabase Integration Active.\`);
  });
}

startServer();
`;

fs.writeFileSync(path.join(__dirname, 'src', 'index.js'), code);
console.log('Successfully rewrote src/index.js');
