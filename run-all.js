#!/usr/bin/env node
/**
 * run-all.js - One-click launcher for all 6 microservices
 * Zero external dependencies (pure Node.js)
 */

const { spawn } = require('child_process');
const path = require('path');

const SERVICES = [
  {
    name: 'SHOP-API',
    color: '\x1b[36m', // Cyan
    dir: 'shop-services/backend',
    cmd: 'npm',
    args: ['start'],
    portInfo: 'http://localhost:4000'
  },
  {
    name: 'INS-API ',
    color: '\x1b[35m', // Magenta
    dir: 'ins-serviceb/backend',
    cmd: 'npm',
    args: ['start'],
    portInfo: 'http://localhost:3001'
  },
  {
    name: 'SHOP-UI ',
    color: '\x1b[33m', // Yellow
    dir: 'shop-service/frontend',
    cmd: 'npm',
    args: ['run', 'dev'],
    portInfo: 'http://localhost:3000'
  },
  {
    name: 'INS-UI  ',
    color: '\x1b[32m', // Green
    dir: 'ins-service/frontend',
    cmd: 'npm',
    args: ['run', 'dev'],
    portInfo: 'http://localhost:5173'
  },
  {
    name: 'REPAIR  ',
    color: '\x1b[34m', // Blue
    dir: 'repair-center/frontend',
    cmd: 'npm',
    args: ['run', 'dev'],
    portInfo: 'http://localhost:5174'
  },
  {
    name: 'CUSTOMER',
    color: '\x1b[96m', // Bright Cyan
    dir: 'customer-portal',
    cmd: 'npm',
    args: ['run', 'dev'],
    portInfo: 'http://localhost:5176'
  }
];

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';

console.log(`\n${BOLD}====================================================${RESET}`);
console.log(`${BOLD} 🚀 CareShield & PhoneShop All-in-One Launcher${RESET}`);
console.log(`${BOLD}====================================================${RESET}`);
SERVICES.forEach(s => {
  console.log(`  ${s.color}● ${s.name}${RESET}  ➔  ${DIM}${s.portInfo}${RESET} (${s.dir})`);
});
console.log(`${BOLD}====================================================${RESET}`);
console.log(`${DIM}Press Ctrl + C to stop all services simultaneously\n${RESET}`);

const children = [];

SERVICES.forEach(service => {
  const cwd = path.join(__dirname, service.dir);
  
  // Use shell: true on Windows for npm execution
  const child = spawn(service.cmd, service.args, {
    cwd,
    shell: true,
    env: { ...process.env, FORCE_COLOR: '1' }
  });

  children.push({ ...service, process: child });

  const prefix = `${service.color}[${service.name}]${RESET} `;

  child.stdout.on('data', data => {
    const lines = data.toString().split('\n');
    lines.forEach(line => {
      if (line.trim()) console.log(`${prefix}${line}`);
    });
  });

  child.stderr.on('data', data => {
    const lines = data.toString().split('\n');
    lines.forEach(line => {
      if (line.trim()) console.error(`${prefix}\x1b[31m${line}${RESET}`);
    });
  });

  child.on('error', err => {
    console.error(`${prefix}\x1b[31mFailed to start: ${err.message}${RESET}`);
  });

  child.on('exit', code => {
    if (code !== 0 && code !== null) {
      console.log(`${prefix}\x1b[33mExited with code ${code}${RESET}`);
    }
  });
});

// Clean shutdown handler
function shutdown() {
  console.log(`\n${BOLD}🛑 Shutting down all 6 services...${RESET}`);
  children.forEach(({ process: child, name }) => {
    try {
      if (process.platform === 'win32') {
        spawn('taskkill', ['/pid', child.pid, '/f', '/t']);
      } else {
        child.kill('SIGTERM');
      }
    } catch (e) {
      // Ignore cleanup error
    }
  });
  setTimeout(() => process.exit(0), 500);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

