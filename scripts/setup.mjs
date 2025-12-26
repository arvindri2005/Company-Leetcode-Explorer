import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const envExample = path.join(rootDir, '.env.example');
const envLocal = path.join(rootDir, '.env.local');

console.log('🤵 Butler is setting up your environment...\n');

// 1. Handle Environment Variables
if (!fs.existsSync(envLocal)) {
  if (fs.existsSync(envExample)) {
    console.log(`📄 Creating .env.local from .env.example...`);
    fs.copyFileSync(envExample, envLocal);
    console.log('✅ .env.local created.');
  } else {
    console.warn('⚠️ .env.example not found. Skipping .env.local creation.');
  }
} else {
  console.log('✅ .env.local already exists.');
}

// 2. Install Dependencies
console.log('\n📦 Installing dependencies...');
try {
  execSync('pnpm install', { stdio: 'inherit', cwd: rootDir });
  console.log('✅ Dependencies installed.');
} catch (error) {
  console.error('❌ Failed to install dependencies. Do you have pnpm installed?');
  process.exit(1);
}

// 3. Final instructions
console.log('\n🎉 Setup complete!');
console.log('👉 Run `pnpm dev` to start the development server.');
