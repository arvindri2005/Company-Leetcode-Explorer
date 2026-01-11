import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ESM dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CWD = process.cwd();
const ENV_EXAMPLE = path.join(CWD, '.env.example');
const ENV_LOCAL = path.join(CWD, '.env.local');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

const log = {
  info: (msg) => console.log(`${colors.cyan}ℹ ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✔ ${msg}${colors.reset}`),
  warn: (msg) => console.log(`${colors.yellow}⚠ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}✖ ${msg}${colors.reset}`),
  header: (msg) => console.log(`\n${colors.bold}${msg}${colors.reset}\n`)
};

function getEnvKeys(content) {
  const keys = new Set();
  const lines = content.split('\n');
  for (const line of lines) {
    // Match KEY=, ignore comments (#) and empty lines
    const match = line.match(/^\s*([\w_]+)=/);
    if (match) {
      keys.add(match[1]);
    }
  }
  return keys;
}

console.log(`${colors.bold}✈️  Pilot: Starting project setup sequence...${colors.reset}`);

// 1. Environment Variables
log.header('1. Configuring Environment');

if (!fs.existsSync(ENV_EXAMPLE)) {
  log.error('.env.example not found! Cannot configure environment.');
} else {
  if (!fs.existsSync(ENV_LOCAL)) {
    // Scenario 1: .env.local missing - Copy completely
    log.info('Creating .env.local from .env.example...');
    try {
      fs.copyFileSync(ENV_EXAMPLE, ENV_LOCAL);
      log.success('.env.local created successfully.');
      log.warn('ACTION REQUIRED: Please open .env.local and update the values with your real API keys!');
    } catch (err) {
      log.error(`Failed to create .env.local: ${err.message}`);
    }
  } else {
    // Scenario 2: .env.local exists - Sync missing keys
    log.info('.env.local exists. Checking for missing keys...');
    
    try {
      const exampleContent = fs.readFileSync(ENV_EXAMPLE, 'utf8');
      const localContent = fs.readFileSync(ENV_LOCAL, 'utf8');

      const exampleKeys = getEnvKeys(exampleContent);
      const localKeys = getEnvKeys(localContent);

      const missingKeys = [...exampleKeys].filter(key => !localKeys.has(key));

      if (missingKeys.length > 0) {
        log.warn(`Found ${missingKeys.length} missing keys in .env.local:`);
        
        let newContent = localContent;
        if (!newContent.endsWith('\n')) {newContent += '\n';}
        
        newContent += '\n# --- Added by Setup Script ---\n';
        
        missingKeys.forEach(key => {
            log.info(`  + ${key}`);
            newContent += `${key}=\n`;
        });

        fs.writeFileSync(ENV_LOCAL, newContent);
        log.success('Added missing keys to .env.local.');
        log.warn('ACTION REQUIRED: Update values for the new keys!');
      } else {
        log.success('.env.local is up to date with .env.example.');
      }
    } catch (err) {
      log.error(`Failed to sync .env.local: ${err.message}`);
    }
  }
}

// 2. Install Dependencies
log.header('2. Installing Dependencies');
try {
  log.info('Running pnpm install...');
  execSync('pnpm install', { stdio: 'inherit' });
  log.success('Dependencies installed.');
} catch (error) {
  log.error('Failed to install dependencies.');
  log.info('Ensure you have pnpm installed: npm install -g pnpm');
  process.exit(1);
}

// 3. Git Hooks
log.header('3. Setting up Git Hooks');
try {
  log.info('Running pnpm prepare...');
  execSync('pnpm prepare', { stdio: 'inherit' });
  log.success('Git hooks configured.');
} catch (error) {
  log.warn('Failed to setup Git hooks automatically.');
  log.info('You might need to run "pnpm prepare" manually later.');
}

// 4. Verify Node Version
const nodeVersion = process.version;
if (nodeVersion.startsWith('v2') || nodeVersion.startsWith('v18') || nodeVersion.startsWith('v19')) {
    // Looks good
} else {
    log.warn(`You are running Node ${nodeVersion}. This project recommends Node 18 or 20.`);
}

console.log(`\n${colors.green}${colors.bold}🎉 Setup complete!${colors.reset}`);
console.log(`\nNext steps:`);
console.log(`  1. Update ${colors.bold}.env.local${colors.reset} with your keys.`);
console.log(`  2. Run ${colors.bold}pnpm dev${colors.reset} to start the development server.\n`);
