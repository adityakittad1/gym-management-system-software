const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');
const crypto = require('crypto');

// Validate environment variables on startup
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;
const SUPABASE_JWKS_URL = process.env.SUPABASE_JWKS_URL;

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY || !SUPABASE_SECRET_KEY) {
  console.error('[FATAL] Missing required Supabase environment variables (URL, PUBLISHABLE_KEY, SECRET_KEY). Halting startup.');
  process.exit(1);
}

// JWKS URL: default to standard Supabase JWKS endpoint if not explicitly set
const effectiveJwksUrl = SUPABASE_JWKS_URL || `${SUPABASE_URL}/auth/v1/.well-known/jwks.json`;
console.log('[SUPABASE] JWKS URL:', effectiveJwksUrl);

// Create centralized clients
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Setup JWKS client
const client = jwksClient({
  jwksUri: effectiveJwksUrl,
  cache: true,
  cacheMaxAge: 86400000, // 24h
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

    jwt.verify(token, getKey, { algorithms: ['RS256'] }, async (err, decoded) => {
      if (err) {
        return res.status(401).json({ error: 'Invalid or expired token', details: err.message });
      }

      try {
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('role, display_name')
          .eq('id', decoded.sub)
          .single();

        req.ctx.user = {
          ...decoded,
          role: profile?.role || 'user',
          name: profile?.display_name || 'Unknown'
        };
        
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
      } catch (e) {
        return res.status(500).json({ error: 'Internal Server Error validating user profile' });
      }
    });
  };
}

async function validateSupabaseConnection() {
  try {
    // Simple connectivity test — just check the members table
    const { error } = await supabaseAdmin
      .from('members')
      .select('id', { count: 'exact', head: true })
      .limit(1);

    if (error && error.code !== 'PGRST116') {
      console.warn('[SUPABASE] Connection warning on members table:', error.message);
      if (error.code === 'PGRST205') {
        console.warn('[WARNING] "members" table not found — run supabase_migration.sql first!');
      }
    } else {
      console.log('[SUPABASE] Connection verified successfully.');
    }

    // Check members_view exists (critical for analytics)
    const { error: viewError } = await supabaseAdmin
      .from('members_view')
      .select('id', { count: 'exact', head: true })
      .limit(1);

    if (viewError && viewError.code === 'PGRST205') {
      console.warn('[WARNING] "members_view" not found — run supabase_migration.sql first!');
    } else if (!viewError) {
      console.log('[SUPABASE] members_view verified.');
    }

  } catch (err) {
    // Non-fatal: log but do NOT exit. Server can still serve requests.
    console.error('[SUPABASE] Connection validation failed:', err.message);
  }
}

module.exports = {
  supabaseAdmin,
  withSupabase,
  validateSupabaseConnection
};
