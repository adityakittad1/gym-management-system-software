/**
 * TTZ Gym Backend – Production Logger
 * =====================================
 * Render.com runs on a read-only filesystem — file writes are not allowed.
 * This logger outputs only to console (stdout/stderr) which Render captures
 * and displays in the dashboard log stream.
 */

const formatMessage = (level, context, message, meta) => {
  const timestamp = new Date().toISOString();
  let metaStr = '';
  if (meta !== undefined && meta !== null) {
    metaStr = typeof meta === 'object' ? JSON.stringify(meta) : String(meta);
  }
  return `[${timestamp}] [${level}] [${context}] ${message}${metaStr ? ' ' + metaStr : ''}`;
};

const logger = {
  info: (context, message, meta) => {
    console.log(`\x1b[36m${formatMessage('INFO', context, message, meta)}\x1b[0m`);
  },
  warn: (context, message, meta) => {
    console.warn(`\x1b[33m${formatMessage('WARN', context, message, meta)}\x1b[0m`);
  },
  error: (context, message, meta) => {
    console.error(`\x1b[31m${formatMessage('ERROR', context, message, meta)}\x1b[0m`);
  },
  debug: (context, message, meta) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`\x1b[90m${formatMessage('DEBUG', context, message, meta)}\x1b[0m`);
    }
  }
};

module.exports = logger;
