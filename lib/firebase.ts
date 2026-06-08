import { initializeApp, getApp, getApps } from "firebase/app";
import { getDatabase } from "firebase/database";

/**
 * Firebase web config. These values are safe to expose in the client bundle
 * (that's what a Firebase *web* config is for — access is governed by Realtime
 * Database security rules, not by hiding these keys). They're env-overridable
 * so you can point at a different project without a code change.
 *
 * ⚠️ databaseURL is REQUIRED for the Realtime Database and was not in the
 * console snippet — you must create an RTDB instance (Firebase console →
 * Build → Realtime Database → Create Database, pick a region) and put its URL
 * in NEXT_PUBLIC_FIREBASE_DATABASE_URL. It looks like one of:
 *   https://<project>-default-rtdb.firebaseio.com                       (US)
 *   https://<project>-default-rtdb.asia-southeast1.firebasedatabase.app (SG)
 */
const firebaseConfig = {
  apiKey:
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY ??
    "AIzaSyCEUWtmm8eNprlwT6Zt8GQFd4fIizQsS5c",
  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ??
    "paxgon-castrol-app-launch.firebaseapp.com",
  databaseURL:
    process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL ??
    "https://paxgon-castrol-app-launch-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId:
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "paxgon-castrol-app-launch",
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ??
    "paxgon-castrol-app-launch.firebasestorage.app",
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "936111147622",
  appId:
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID ??
    "1:936111147622:web:fb5801d2fbcce9e2887ba7",
};

// Reuse the app across HMR / re-imports instead of re-initialising.
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const db = getDatabase(app);
