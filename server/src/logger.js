const fs = require('fs');
const path = require('path');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Get current date string for log rotation
const getLogDate = () => new Date().toISOString().split('T')[0];

const formatMessage = (level, context, message, meta = '') => {
  const timestamp = new Date().toISOString();
  let metaStr = '';
  if (meta) {
    metaStr = typeof meta === 'object' ? JSON.stringify(meta) : String(meta);
  }
  return `[${timestamp}] [${level}] [${context}] ${message} ${metaStr}`.trim();
};

const writeLog = (level, context, message, meta) => {
  const logStr = formatMessage(level, context, message, meta) + '\n';
  
  // Console output with simple coloring
  if (level === 'ERROR') {
    console.error(`\x1b[31m${logStr.trim()}\x1b[0m`);
  } else if (level === 'WARN') {
    console.warn(`\x1b[33m${logStr.trim()}\x1b[0m`);
  } else if (level === 'INFO') {
    console.log(`\x1b[36m${logStr.trim()}\x1b[0m`);
  } else {
    console.log(logStr.trim());
  }

  // File output - separate by context to keep things organized
  try {
    const safeContext = context.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const dateStr = getLogDate();
    
    // General combined log
    fs.appendFileSync(path.join(logsDir, `combined-${dateStr}.log`), logStr);
    
    // Context-specific log
    fs.appendFileSync(path.join(logsDir, `${safeContext}-${dateStr}.log`), logStr);
  } catch (err) {
    console.error('Failed to write to log file:', err);
  }
};

const logger = {
  info: (context, message, meta) => writeLog('INFO', context, message, meta),
  warn: (context, message, meta) => writeLog('WARN', context, message, meta),
  error: (context, message, meta) => writeLog('ERROR', context, message, meta),
  debug: (context, message, meta) => writeLog('DEBUG', context, message, meta)
};

module.exports = logger;
