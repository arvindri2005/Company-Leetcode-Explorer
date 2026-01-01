import fs from 'node:fs';
import path from 'node:path';

const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';
const filePath = path.join(process.cwd(), '.env.local');

if (fs.existsSync(filePath) && !isCI) {
  console.warn('⚠️  .env.local already exists. Skipping generation to protect your secrets.');
  console.warn('   This script is intended for CI environments or fresh setups.');
  process.exit(0);
}

const content = `
NEXT_PUBLIC_APP_URL=https://ci.example.com
NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT_ID=ca-pub-dummy
NEXT_PUBLIC_FIREBASE_API_KEY=dummy-api-key-for-ci
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=ci-test.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=ci-test-project
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=ci-test.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1234567890
NEXT_PUBLIC_FIREBASE_APP_ID=1:1234567890:web:abcdef123456
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-ABCDEF1234
# Add other required vars here with dummy values
`;

console.log('✈️ Pilot: Generating .env.local for CI build validation...');
fs.writeFileSync(filePath, content.trim() + '\n');
console.log('✅ .env.local generated successfully.');
