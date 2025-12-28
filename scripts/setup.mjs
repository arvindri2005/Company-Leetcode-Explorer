import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const CYAN = '\x1b[36m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

console.log(`${CYAN}🤵 Butler: Setting up your environment...${RESET}`);

const rootDir = process.cwd();
const envExample = path.join(rootDir, '.env.example');
const envLocal = path.join(rootDir, '.env.local');

// 1. .env.local creation
if (!fs.existsSync(envLocal)) {
  if (fs.existsSync(envExample)) {
    try {
      fs.copyFileSync(envExample, envLocal);
      console.log(`${GREEN}✔ Created .env.local from .env.example${RESET}`);
      console.log(`${YELLOW}⚠ Please update .env.local with your actual API keys!${RESET}`);
    } catch (err) {
      console.error(`${YELLOW}⚠ Failed to copy .env.example: ${err.message}${RESET}`);
    }
  } else {
    console.warn(`${YELLOW}⚠ .env.example not found, skipping .env.local creation${RESET}`);
  }
} else {
  console.log(`${GREEN}✔ .env.local already exists${RESET}`);
}

// 2. Install dependencies
try {
  console.log(`${CYAN}📦 Installing dependencies...${RESET}`);
  // Use stdio: 'inherit' to show pnpm output
  execSync('pnpm install', { stdio: 'inherit' });
  console.log(`${GREEN}✔ Dependencies installed${RESET}`);
} catch (error) {
  console.error(`${YELLOW}⚠ Failed to install dependencies. Do you have pnpm installed?${RESET}`);
  // We exit with 1 because this is critical
  process.exit(1);
}

// 3. Prepare Husky
try {
  console.log(`${CYAN}🐶 Preparing Git hooks...${RESET}`);
  execSync('pnpm prepare', { stdio: 'inherit' });
  console.log(`${GREEN}✔ Git hooks ready${RESET}`);
} catch (error) {
  console.error(`${YELLOW}⚠ Failed to setup Husky${RESET}`);
  // Don't fail the whole setup for this
}

console.log(`${GREEN}✨ Setup complete! You are ready to code.${RESET}`);
