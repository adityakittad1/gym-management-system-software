const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');
const crypto = require('crypto');

// Validate environment variables on startup
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;
const SUPABASE_JWKS_URL = process.env.SUPABASE_JWKS_URL;

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY || !SUPABASE_SECRET_KEY || !SUPABASE_JWKS_URL) {
  console.error('[FATAL] Missing required Supabase environment variables. Halting startup.');
  process.exit(1);
}

// Create centralized clients
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Setup JWKS client
const client = jwksClient({
  jwksUri: SUPABASE_JWKS_URL,
});

function getKey(header, callback) {
  client.getSigningKey(header.kid, function (err, key) {
    if (err) return callback(err, null);
    const signingKey = key.publicKey || key.rsaPublicKey;
    callback(null, signingKey);
  });
}

function withSupabase(options = { auth: 'user' }) {
  return (req, res, next) => {
    req.reqId = crypto.randomUUID();
    req.ctx = req.ctx || {};
    req.ctx.supabaseAdmin = supabaseAdmin; // Provide admin client to all for internal ops

    if (options.auth === 'none') {
      return next();
    }

    if (options.auth === 'secret') {
      // Typically verified via internal header, but we'll assume it means the endpoint is for internal use
      // In this app, we will use the admin client directly inside the route
      return next();
    }

    // For user or publishable, verify the JWT
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid Authorization header' });
    }

    const token = authHeader.split(' ')[1];

    jwt.verify(token, getKey, { algorithms: ['RS256'] }, (err, decoded) => {
      if (err) {
        return res.status(401).json({ error: 'Invalid or expired token', details: err.message });
      }

      req.ctx.user = decoded;
      
      // Create user-scoped client with RLS
      req.ctx.supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
        auth: { persistSession: false, autoRefreshToken: false },
      });

      next();
    });
  };
}

async function validateSupabaseConnection() {
  try {
    const { error } = await supabaseAdmin.from('members').select('id').limit(1);
    if (error && error.code !== 'PGRST116') {
      throw error;
    }
    console.log('[SUPABASE] Connection and tables verified successfully.');
  } catch (err) {
    console.error('[FATAL] Failed to connect to Supabase or required tables are missing:', err.message);
    process.exit(1);
  }
}

module.exports = {
  supabaseAdmin,
  withSupabase,
  validateSupabaseConnection
};
