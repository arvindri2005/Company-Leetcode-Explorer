/**
 * @file firebase.ts
 * @description This file initializes the Firebase app and exports the Firestore database and Auth instances.
 * It includes checks for necessary environment variables and ensures that Firebase is only initialized once.
 */

import {
  initializeApp,
  getApps,
  getApp,
  type FirebaseOptions,
} from "firebase/app";
import { getFirestore, enableMultiTabIndexedDbPersistence } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { env } from "@/env";
import { Logger } from "@/lib/logger";

const firebaseConfig: FirebaseOptions = {
  apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID, // Optional
};

// Initialize Firebase
let app;
if (!getApps().length) {
  // Basic check to prevent initialization with undefined values, especially on client-side if vars are missing.
  if (firebaseConfig.apiKey && firebaseConfig.projectId) {
    app = initializeApp(firebaseConfig);
  } else {
    throw new Error("Firebase configuration is incomplete. App cannot be initialized.");
  }
} else {
  app = getApp();
}

const db = getFirestore(app);

if (typeof window !== "undefined") {
  enableMultiTabIndexedDbPersistence(db).catch((err) => {
    if (err.code === "failed-precondition") {
      // Multiple tabs open, persistence can only be enabled in one tab at a a time.
      Logger.warn(
        "Firestore persistence failed-precondition: Multiple tabs open",
        {},
        err,
      );
    } else if (err.code === "unimplemented") {
      // The current browser does not support all of the features required to enable persistence
      Logger.warn(
        "Firestore persistence unimplemented: Browser not supported",
        {},
        err,
      );
    } else {
      Logger.warn("Firestore persistence failed", {}, err);
    }
  });
}

const auth = getAuth(app);

export { db, auth, app };
