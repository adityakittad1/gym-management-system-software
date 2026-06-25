const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('./supabase');
const whatsappService = require('./whatsapp-service');
const scheduler = require('./scheduler');
const logger = require('./logger');

// 1. Overall System Health
router.get('/', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// 2. Database Health & Validation
router.get('/database', async (req, res) => {
  try {
    const start = Date.now();
    const { data, error } = await supabaseAdmin.from('settings').select('key').limit(1);
    
    if (error) throw error;

    res.json({
      status: 'connected',
      latency_ms: Date.now() - start,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    logger.error('Health', 'Database health check failed', err.message);
    res.status(500).json({ status: 'error', error: err.message });
  }
});

// 3. WhatsApp Status
router.get('/whatsapp', (req, res) => {
  try {
    const waStatus = whatsappService.getStatus();
    res.json(waStatus);
  } catch (err) {
    res.status(500).json({ status: 'error', error: err.message });
  }
});

// 4. Automation & Scheduler
router.get('/automation', (req, res) => {
  res.json(scheduler.getStatus());
});

// 5. Database Startup Validation (Internal Routine)
const validateDatabaseStartup = async () => {
  logger.info('Startup', 'Validating database schema and connections...');
  
  const requiredTables = [
    'members', 'payments', 'attendance', 'profiles', 'settings', 'whatsapp_logs'
  ];
  
  try {
    for (const table of requiredTables) {
      const { error } = await supabaseAdmin.from(table).select('*').limit(1);
      if (error && error.code !== 'PGRST116') { // PGRST116 means 0 rows, which is fine. 42P01 means table doesn't exist.
        if (error.code === '42P01') {
          logger.warn('Startup', `Missing required table: ${table}`);
        } else {
          logger.warn('Startup', `Database warning on ${table}: ${error.message}`);
        }
      }
    }
    
    // Check members_view specifically
    const { error: viewError } = await supabaseAdmin.from('members_view').select('id').limit(1);
    if (viewError && viewError.code === '42P01') {
      logger.warn('Startup', 'Missing required view: members_view');
    }

    logger.info('Startup', 'Database validation completed.');
  } catch (err) {
    logger.error('Startup', 'Failed to validate database', err.message);
  }
};

module.exports = {
  healthRoutes: router,
  validateDatabaseStartup
};
