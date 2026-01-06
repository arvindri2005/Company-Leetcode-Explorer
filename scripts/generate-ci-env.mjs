import fs from 'fs';

const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';

if (isCI) {
  const envContent = `
NEXT_PUBLIC_APP_URL=https://ci.example.com
NEXT_PUBLIC_FIREBASE_API_KEY=ci-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=ci-app.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=ci-app
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=ci-app.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1234567890
NEXT_PUBLIC_FIREBASE_APP_ID=1:1234567890:web:abcdef123456
LOGO_API=ci-token-placeholder
GEMINI_API_KEY=ci-gemini-key
GOOGLE_API_KEY=ci-google-key
  `.trim();

  fs.writeFileSync('.env', envContent);
  console.log('✅ Generated .env for CI environment');
} else {
  console.log('ℹ️ Not in CI environment, skipping .env generation');
}
