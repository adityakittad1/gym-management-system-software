import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Central orchestration state
const state = {
  backend: null,
  frontend: null,
  isDev: process.argv.includes('dev'),
};

const LOG_PREFIX = '\x1b[35m[LAUNCHER]\x1b[0m';

const log = (msg) => console.log(`${LOG_PREFIX} ${msg}`);
const logError = (msg) => console.error(`${LOG_PREFIX} \x1b[31m${msg}\x1b[0m`);
const logSuccess = (msg) => console.log(`${LOG_PREFIX} \x1b[32m${msg}\x1b[0m`);

// Check backend health before starting frontend
const waitForBackend = async (port = 5000, maxRetries = 30) => {
  log(`Waiting for Backend Health Check (http://localhost:${port}/health) ...`);
  for (let i = 0; i < maxRetries; i++) {
    try {
      await new Promise((resolve, reject) => {
        const req = http.get(`http://localhost:${port}/health`, (res) => {
          if (res.statusCode === 200) resolve();
          else reject(new Error(`Status ${res.statusCode}`));
        });
        req.on('error', reject);
        req.end();
      });
      logSuccess('Backend is healthy and responding.');
      return true;
    } catch (err) {
      await new Promise(r => setTimeout(r, 1000)); // wait 1s and retry
    }
  }
  return false;
};

// Spawn a monitored process
const spawnMonitoredProcess = (name, command, args, cwd) => {
  log(`Starting ${name}...`);
  const proc = spawn(command, args, { cwd, shell: true, stdio: 'inherit' });

  proc.on('close', (code) => {
    if (code !== 0 && code !== null) {
      logError(`${name} crashed with code ${code}. Restarting in 3 seconds...`);
      setTimeout(() => {
        if (name === 'Backend') {
          state.backend = spawnMonitoredProcess(name, command, args, cwd);
        } else if (name === 'Frontend') {
          state.frontend = spawnMonitoredProcess(name, command, args, cwd);
        }
      }, 3000);
    } else {
      log(`${name} exited cleanly.`);
    }
  });

  return proc;
};

// Main execution
const start = async () => {
  log(`Initializing One-Click Startup Sequence (${state.isDev ? 'Development' : 'Production'})...`);

  // 1. Start Backend
  const backendCmd = state.isDev ? 'npx' : 'node';
  const backendArgs = state.isDev ? ['nodemon', 'src/index.js'] : ['src/index.js'];
  
  state.backend = spawnMonitoredProcess('Backend', backendCmd, backendArgs, path.join(__dirname, 'server'));

  // 2. Wait for Backend to be Healthy
  const isHealthy = await waitForBackend(5000);
  if (!isHealthy) {
    logError('Backend failed to become healthy. Check backend logs. Aborting frontend startup.');
    process.exit(1);
  }

  // 3. Start Frontend
  if (state.isDev) {
    // Start Vite dev server and open browser
    state.frontend = spawnMonitoredProcess('Frontend', 'npx', ['vite', '--open'], __dirname);
  } else {
    // Build and serve
    log('Building frontend for production...');
    const buildProc = spawn('npx', ['vite', 'build'], { cwd: __dirname, shell: true, stdio: 'inherit' });
    
    buildProc.on('close', (code) => {
      if (code === 0) {
        logSuccess('Build complete. Starting static server...');
        state.frontend = spawnMonitoredProcess('Frontend', 'npx', ['serve', '-s', 'dist', '-p', '5174'], __dirname);
        // Automatically open browser for production preview
        import('open').then(open => {
          setTimeout(() => open.default('http://localhost:5174'), 2000);
        }).catch(() => {});
      } else {
        logError('Frontend build failed.');
      }
    });
  }

  logSuccess('🎉 All Services Booted Successfully.');
};

start();

// Handle termination gracefully
process.on('SIGINT', () => {
  log('Shutting down services...');
  if (state.backend) state.backend.kill('SIGINT');
  if (state.frontend) state.frontend.kill('SIGINT');
  process.exit();
});
