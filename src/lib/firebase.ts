import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Validate Firebase configuration
const requiredEnvVars = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID'
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('Missing Firebase environment variables:', missingEnvVars);
  if (typeof window !== 'undefined') {
    console.error('Make sure to set up environment variables in Vercel dashboard or your .env.local file');
  }
}

// Initialize Firebase with proper error handling
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

try {
  if (missingEnvVars.length === 0) {
    app = getApps().length ? getApps()[0]! : initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  } else {
    // Throw an error if environment variables are missing
    throw new Error(`Missing Firebase environment variables: ${missingEnvVars.join(', ')}`);
  }
} catch (error) {
  console.error('Firebase initialization error:', error);
  // Re-throw the error to prevent the app from running with invalid Firebase config
  throw error;
}

export { auth, db };
