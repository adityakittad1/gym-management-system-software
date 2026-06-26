/**
 * TTZ WhatsApp Service
 * 
 * Wraps whatsapp-web.js to provide:
 *  - Session management (LocalAuth persistence)
 *  - Real QR code generation
 *  - Message sending
 *  - Status reporting
 * 
 * This module emits Socket.IO events to connected clients.
 * Import this ONCE at server startup and call init(io).
 */

const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const path = require('path');
const { supabaseAdmin } = require('./supabase');

// ─── State ────────────────────────────────────────────────────────────────────
let client = null;
let io = null;  // Socket.IO instance injected from index.js

const state = {
  status: 'disconnected', // 'disconnected' | 'qr_ready' | 'connecting' | 'connected' | 'auth_failure'
  currentStage: '[0] Uninitialized',
  lastDiagnosticError: 'No error recorded.',
  qrDataURL: null,        // base64 PNG of QR for frontend
  pairingCode: null,
  phoneNumber: null,
  profileName: null,
  connectedAt: null,
  lastSync: null,
  sentToday: 0,
  failedToday: 0,
};

// Reset daily counters at midnight
function scheduleDailyReset() {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const msUntilMidnight = midnight - now;
  setTimeout(() => {
    state.sentToday = 0;
    state.failedToday = 0;
    broadcastStatus();
    scheduleDailyReset();
  }, msUntilMidnight);
}

// ─── Broadcast helpers ────────────────────────────────────────────────────────
function broadcastStatus() {
  if (!io) return;
  io.emit('wa:status', getStatus());
}

async function persistSessionStatus(extra = {}) {
  try {
    const persistedStatus = state.status === 'qr_ready'
      ? 'connecting'
      : state.status === 'auth_failure'
        ? 'error'
        : state.status;

    const row = {
      session_name: 'default',
      status: persistedStatus,
      phone_number: state.phoneNumber,
      connected_at: state.connectedAt,
      updated_at: new Date().toISOString(),
      ...extra,
    };

    const { data: existing, error: lookupError } = await supabaseAdmin
      .from('whatsapp_sessions')
      .select('id')
      .eq('session_name', 'default')
      .limit(1)
      .maybeSingle();
    if (lookupError) throw lookupError;

    if (existing?.id) {
      const { error } = await supabaseAdmin
        .from('whatsapp_sessions')
        .update(row)
        .eq('id', existing.id);
      if (error) throw error;
    } else {
      const { error } = await supabaseAdmin.from('whatsapp_sessions').insert([row]);
      if (error) throw error;
    }
  } catch (err) {
    console.error('[WhatsApp] Failed to persist session status:', err.message);
  }
}

function broadcastQR(qrDataURL) {
  if (!io) return;
  io.emit('wa:qr', { qrDataURL });
}

// ─── Status getter ────────────────────────────────────────────────────────────
function getStatus() {
  return {
    status: state.status,
    phoneNumber: state.phoneNumber,
    profileName: state.profileName,
    connectedAt: state.connectedAt,
    lastSync: state.lastSync,
    sentToday: state.sentToday,
    failedToday: state.failedToday,
    hasQR: !!state.qrDataURL,
    qrDataURL: state.qrDataURL,
    pairingCode: state.pairingCode,
  };
}

function getQR() {
  return state.qrDataURL;
}

// ─── Initialize client ────────────────────────────────────────────────────────
async function initialize(socketIO, throwOnError = false) {
  io = socketIO;
  scheduleDailyReset();

  // If already connected, don't re-initialize
  if (client && state.status === 'connected') {
    broadcastStatus();
    return;
  }

  // Destroy old client if exists
  if (client) {
    try { await client.destroy(); } catch (_) {}
    client = null;
  }

  console.log('[Diagnostic] [2] Creating WhatsApp client');
  state.currentStage = '[2] Creating WhatsApp client';
  state.status = 'connecting';
  state.qrDataURL = null;
  state.pairingCode = null;
  persistSessionStatus({ qr_code: null });
  broadcastStatus();

  // Aggressive memory optimizations for Render 512MB RAM Limit
  let args = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    '--no-first-run',
    '--no-zygote',
    '--disable-gpu',
    '--blink-settings=imagesEnabled=false',
    '--js-flags="--max-old-space-size=120"'
  ];

  // Use standard Puppeteer bundled Chromium (executes from disk, saving ~150MB RAM compared to Sparticuz tmpfs extraction)
  const puppeteer = require('puppeteer');
  let executablePath = puppeteer.executablePath();
  
  // Inject our aggressive memory limiters
  args = args.concat([
    '--blink-settings=imagesEnabled=false',
    '--js-flags="--max-old-space-size=120"'
  ]);

  console.log('[Diagnostic] [3] Launching Puppeteer');
  state.currentStage = '[3] Launching Puppeteer';

  client = new Client({
    authStrategy: new LocalAuth({
      clientId: 'primary',
      dataPath: path.join(__dirname, '.wwebjs_auth')
    }),
    puppeteer: {
      headless: true,
      executablePath: executablePath || undefined,
      args: args
    },
    webVersionCache: {
      type: 'local',
    },
  });

  // ── Events ──────────────────────────────────────────────────────────────
  const logEvent = (evt, payload = '') => {
    const timestamp = new Date().toISOString();
    console.log(`[WhatsApp Event] ${timestamp} | ${evt} | ${payload}`);
    state.lastEvent = evt;
  };

  client.on('loading_screen', (percent, message) => {
    logEvent('loading_screen', `${percent}% - ${message}`);
    console.log(`[Diagnostic] [4] Browser launched / [5] New page created / [6] WhatsApp initialize() - ${percent}%`);
    state.currentStage = `[6] WhatsApp initialize() - ${percent}%`;
    if (state.status !== 'connected') {
      state.status = 'connecting';
      persistSessionStatus();
      broadcastStatus();
    }
  });

  client.on('qr', async (qr) => {
    logEvent('qr', 'QR code generated');
    console.log('[Diagnostic] [8] QR generated');
    state.currentStage = '[8] QR generated';
    state.status = 'qr_ready';
    state.pairingCode = null;
    try {
      state.qrDataURL = await qrcode.toDataURL(qr, {
        width: 300,
        margin: 2,
        color: { dark: '#000000', light: '#ffffff' },
      });
    } catch (err) {
      console.error('[WhatsApp] QR generation error:', err);
      state.lastDiagnosticError = 'QR generation error: ' + err.message;
      state.qrDataURL = null;
    }
    persistSessionStatus({ qr_code: state.qrDataURL });
    broadcastStatus();
    console.log('[Diagnostic] [9] Socket emit - QR Code sent to frontend');
    broadcastQR(state.qrDataURL);
  });

  client.on('authenticated', () => {
    logEvent('authenticated');
  });

  client.on('auth_failure', (msg) => {
    logEvent('auth_failure', msg);
    console.log(`[Diagnostic] Auth Failure: ${msg}`);
    state.lastDiagnosticError = `Auth Failure: ${msg}`;
    state.status = 'auth_failure';
    state.phoneNumber = null;
    state.profileName = null;
    persistSessionStatus();
    broadcastStatus();
  });

  client.on('ready', () => {
    logEvent('ready');
    console.log('[Diagnostic] [10] Client Ready');
    state.currentStage = '[10] Client Ready';
    state.status = 'connected';
    state.hasQR = false;
    state.qrDataURL = null;
    state.pairingCode = null;
    state.connectedAt = new Date().toISOString();
    state.lastSync = new Date().toISOString();

    try {
      const info = client.info;
      state.phoneNumber = info?.wid?.user ? `+${info.wid.user}` : 'Unknown';
      state.profileName = info?.pushname || 'TTZ Gym';
    } catch (_) {
      state.phoneNumber = 'Unknown';
      state.profileName = 'TTZ Gym';
    }

    persistSessionStatus({ qr_code: null });
    broadcastStatus();
  });

  client.on('disconnected', (reason) => {
    logEvent('disconnected', reason);
    state.status = 'disconnected';
    state.phoneNumber = null;
    state.profileName = null;
    state.qrDataURL = null;
    state.pairingCode = null;
    persistSessionStatus({ qr_code: null });
    broadcastStatus();
    handleClearSession(io);
  });

  client.on('message', async msg => {
    logEvent('message', `Received from ${msg.from}`);
    if (msg.body === '!ping') {
      msg.reply('pong');
    }
  });

  client.on('message_ack', (msg, ack) => {
    state.lastSync = new Date().toISOString();
    broadcastStatus();
  });

  client.on('remote_session_saved', () => {
    logEvent('remote_session_saved');
  });

  client.on('change_state', stateChange => {
    logEvent('change_state', stateChange);
  });

  try {
    console.log('[WhatsApp] Calling client.initialize() - launching Puppeteer...');
    console.log('[Diagnostic] [7] Waiting for QR (or ready)');
    state.currentStage = '[7] Waiting for QR (or ready)';
    await client.initialize();
  } catch (err) {
    global.whatsappLastError = err.stack || err.message || err.toString();
    console.error('[WhatsApp] Initialization error (Stack trace):', err.stack || err);
    state.lastDiagnosticError = err.stack || err.message || err.toString();
    state.status = 'disconnected';
    persistSessionStatus();
    broadcastStatus();
    if (throwOnError) throw err;
  }
}

// ─── Disconnect ────────────────────────────────────────────────────────────────
async function disconnect() {
  if (client) {
    try {
      // client.logout() causes EBUSY file lock errors on Windows with LocalAuth.
      // Destroying the client directly safely releases resources.
      await client.destroy();
    } catch (err) {
      console.error('[WhatsApp Debug] Disconnect error:', err.message);
    }
    client = null;
  }
  state.status = 'disconnected';
  state.phoneNumber = null;
  state.profileName = null;
  state.qrDataURL = null;
  state.pairingCode = null;
  state.connectedAt = null;
  persistSessionStatus({ qr_code: null });
  broadcastStatus();
}

// ─── Request Pairing Code ─────────────────────────────────────────────────────
async function requestPairingCode(phone) {
  if (!client) {
    throw new Error('WhatsApp client is not initialized.');
  }
  // Remove non-digits
  const cleaned = phone.replace(/\D/g, '');
  let normalizedPhone = cleaned;
  if (/^\d{10}$/.test(cleaned)) {
    normalizedPhone = `91${cleaned}`;
  }

  console.log(`[WhatsApp Debug] Requesting pairing code for: ${normalizedPhone}`);
  try {
    const code = await client.requestPairingCode(normalizedPhone);
    console.log(`[WhatsApp Debug] Pairing code received: ${code}`);
    state.pairingCode = code;
    persistSessionStatus();
    broadcastStatus();
    return { success: true, code, normalizedPhone };
  } catch (err) {
    console.error(`[WhatsApp Debug] Failed to request pairing code:`, err.message);
    throw new Error(err.message);
  }
}

// ─── Send Message ─────────────────────────────────────────────────────────────
async function sendMessage(phone, message, logContext = {}, pdfBase64 = null) {
  if (!client || state.status !== 'connected') {
    throw new Error('WhatsApp is not connected. Please scan the QR code first.');
  }

  console.log(`\n[WhatsApp Debug] ──────────────────────────────────────────`);
  console.log(`[WhatsApp Debug] Request to send to: "${phone}"`);
  if (logContext.member) console.log(`[WhatsApp Debug] Member: ${logContext.member}`);
  console.log(`[WhatsApp Debug] Message length: ${message.length} chars`);

  // Normalize phone: remove +, spaces, dashes.
  const cleaned = phone.replace(/[\s\-\+\(\)]/g, '');
  let normalizedPhone = cleaned;
  
  // Auto-add India country code for 10 digit numbers
  if (/^\d{10}$/.test(cleaned)) {
    normalizedPhone = `91${cleaned}`;
  }

  if (!/^\d{10,}$/.test(normalizedPhone)) {
    console.error(`[WhatsApp Debug] ❌ Validation failed: Invalid phone format (${phone})`);
    throw new Error(`Invalid phone number format. Received: ${phone}`);
  }

  const chatId = `${normalizedPhone}@c.us`;
  console.log(`[WhatsApp Debug] Normalized Number: ${normalizedPhone}`);
  console.log(`[WhatsApp Debug] Generated JID: ${chatId}`);

  try {
    console.log(`[WhatsApp Debug] Checking network registration...`);
    const isRegistered = await client.isRegisteredUser(chatId);
    
    if (!isRegistered) {
      console.error(`[WhatsApp Debug] ❌ Aborted: Number not registered on WhatsApp`);
      throw new Error('Recipient is not registered on WhatsApp.');
    }
    
    console.log(`[WhatsApp Debug] ✅ User is registered. Sending message...`);
    state.lastSync = new Date().toISOString();
    
    let result;
    if (pdfBase64) {
      const media = new MessageMedia('application/pdf', pdfBase64, 'Invoice.pdf');
      result = await client.sendMessage(chatId, message, { media });
    } else {
      result = await client.sendMessage(chatId, message);
    }
    
    console.log(`[WhatsApp Debug] ✅ Delivery Promise resolved! Message ID: ${result.id._serialized}`);
    console.log(`[WhatsApp Debug] ──────────────────────────────────────────\n`);
    
    state.sentToday++;
    broadcastStatus();
    return { success: true, messageId: result.id._serialized, normalizedPhone };
  } catch (err) {
    console.error(`[WhatsApp Debug] ❌ Exception caught during send:`);
    console.error(err.stack);
    console.log(`[WhatsApp Debug] ──────────────────────────────────────────\n`);
    
    state.failedToday++;
    broadcastStatus();
    throw new Error(err.message);
  }
}

// ─── Re-initialize (reconnect) ─────────────────────────────────────────────────
async function reconnect(throwOnError = false) {
  await disconnect();
  await new Promise(r => setTimeout(r, 1000));
  await initialize(io, throwOnError);
}

async function connect(socketIO = io, throwOnError = false) {
  return initialize(socketIO, throwOnError);
}

module.exports = {
  initialize,
  connect,
  disconnect,
  reconnect,
  requestPairingCode,
  sendMessage,
  getStatus,
  getQR,
  getDiagnosticState: () => state
};
