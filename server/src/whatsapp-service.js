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

  state.status = 'connecting';
  state.qrDataURL = null;
  state.pairingCode = null;
  persistSessionStatus({ qr_code: null });
  broadcastStatus();

  // Resolve Chrome executable — handles pnpm strict hoisting
  let executablePath;
  try {
    // pnpm stores packages at project-root/node_modules/.pnpm/...
    // __dirname is server/src/, so go up 2 levels to reach project root
    const puppeteerPath = path.join(__dirname, '../../node_modules/.pnpm/puppeteer@24.38.0/node_modules/puppeteer');
    const pup = require(puppeteerPath);
    executablePath = pup.executablePath();
    console.log('[WhatsApp] Chrome resolved:', executablePath);
  } catch (_) {
    try {
      // Fallback: system Chrome installs on Windows
      const fs = require('fs');
      const candidates = [
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        process.env.CHROME_PATH,
      ].filter(Boolean);
      executablePath = candidates.find(p => fs.existsSync(p));
      if (executablePath) console.log('[WhatsApp] Using system Chrome:', executablePath);
    } catch (_) {}
  }

  if (!executablePath) {
    console.error('[WhatsApp] No Chrome found. Cannot start WhatsApp session.');
    state.status = 'disconnected';
    persistSessionStatus();
    broadcastStatus();
    if (throwOnError) throw new Error('No Chrome executable found. Puppeteer cannot start.');
    return;
  }

  console.log(`[WhatsApp] Puppeteer will use Chrome at: ${executablePath}`);
  const sessionDir = path.join(__dirname, '../../.wwebjs_auth');

  client = new Client({
    authStrategy: new LocalAuth({
      dataPath: sessionDir,
    }),
    puppeteer: {
      headless: true,
      executablePath: executablePath || undefined,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
      ],
    },
    webVersionCache: {
      type: 'none',
    },
  });

  // ── Events ──────────────────────────────────────────────────────────────
  
  client.on('qr', async (qr) => {
    console.log('[WhatsApp] QR code received — scan to connect.');
    state.status = 'qr_ready';
    state.pairingCode = null;
    // Convert the raw QR string to a PNG data URL
    try {
      state.qrDataURL = await qrcode.toDataURL(qr, {
        width: 300,
        margin: 2,
        color: { dark: '#000000', light: '#ffffff' },
      });
    } catch (err) {
      console.error('[WhatsApp] QR generation error:', err);
      state.qrDataURL = null;
    }
    persistSessionStatus({ qr_code: state.qrDataURL });
    broadcastStatus();
    broadcastQR(state.qrDataURL);
  });

  client.on('loading_screen', (percent, message) => {
    console.log(`[WhatsApp] Loading: ${percent}% — ${message}`);
    if (state.status !== 'connected') {
      state.status = 'connecting';
      persistSessionStatus();
      broadcastStatus();
    }
  });

  client.on('authenticated', () => {
    console.log('[WhatsApp] Authenticated successfully.');
    if (state.status !== 'connected') {
      state.status = 'connecting';
      state.qrDataURL = null;
      state.pairingCode = null;
      persistSessionStatus({ qr_code: null });
      broadcastStatus();
    }
  });

  client.on('ready', async () => {
    console.log('[WhatsApp] Client ready!');
    state.status = 'connected';
    state.qrDataURL = null;
    state.pairingCode = null;
    state.connectedAt = new Date().toISOString();
    state.lastSync = new Date().toISOString();

    // Fetch phone & profile
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

  client.on('auth_failure', (msg) => {
    console.error('[WhatsApp] Auth failure:', msg);
    state.status = 'auth_failure';
    state.phoneNumber = null;
    state.profileName = null;
    persistSessionStatus();
    broadcastStatus();
  });

  client.on('disconnected', (reason) => {
    console.log('[WhatsApp] Disconnected:', reason);
    state.status = 'disconnected';
    state.phoneNumber = null;
    state.profileName = null;
    state.qrDataURL = null;
    state.pairingCode = null;
    persistSessionStatus({ qr_code: null });
    broadcastStatus();
  });

  client.on('message_ack', (msg, ack) => {
    // ack: 1=sent, 2=delivered, 3=read
    state.lastSync = new Date().toISOString();
    broadcastStatus();
  });

  // ── Start ─────────────────────────────────────────────────────────────
  try {
    console.log('[WhatsApp] Calling client.initialize() - launching Puppeteer...');
    await client.initialize();
  } catch (err) {
    console.error('[WhatsApp] Initialization error (Stack trace):', err.stack || err);
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
};
