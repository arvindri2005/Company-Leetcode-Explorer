
import { initializeApp, getApps, getApp, type FirebaseOptions } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Check if all required environment variables are set
const requiredEnvVarsClient = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
];

// Log missing client-side vars during server-side build/dev start, or if window is undefined
if (typeof window === 'undefined') {
  const missingClientVars = requiredEnvVarsClient.filter(varName => !process.env[varName]);
  if (missingClientVars.length > 0) {
    console.warn(`Firebase configuration incomplete. Missing NEXT_PUBLIC_ environment variables: ${missingClientVars.join(', ')}. These are needed for client-side Firebase SDK initialization. Please check your .env.local file.`);
  }
}


const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID, // Optional
};

// Initialize Firebase
let app;
if (!getApps().length) {
  // Basic check to prevent initialization with undefined values, especially on client-side if vars are missing.
  if (firebaseConfig.apiKey && firebaseConfig.projectId) {
    app = initializeApp(firebaseConfig);
  } else {
    // Handle the case where essential config is missing.
    // This might happen client-side if env vars aren't exposed correctly or are missing.
    console.error("Firebase configuration is incomplete (NEXT_PUBLIC_ variables). App cannot be initialized.");
    // You might want to throw an error or set app to a mock/null object
    // to prevent further errors, depending on how your app handles this.
  }
} else {
  app = getApp();
}

// Ensure app is defined before trying to use it
const db = app ? getFirestore(app) : null;
const auth = app ? getAuth(app) : null;

if (!db || !auth) {
  // This warning will appear if the app couldn't be initialized,
  // typically due to missing NEXT_PUBLIC_ Firebase config vars.
  console.warn("Firebase services (Firestore/Auth) could not be initialized. This usually means Firebase config environment variables (NEXT_PUBLIC_...) are missing or incorrect.");
}

export { db, auth, app };
