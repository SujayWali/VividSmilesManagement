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

// Debug environment variables in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  console.log('Firebase config check:', {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? '✓ Set' : '✗ Missing',
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? '✓ Set' : '✗ Missing',
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? '✓ Set' : '✗ Missing',
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ? '✓ Set' : '✗ Missing',
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ? '✓ Set' : '✗ Missing',
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ? '✓ Set' : '✗ Missing',
  });
}

// Validate required environment variables
const requiredFields = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
const missingFields = requiredFields.filter(field => !firebaseConfig[field as keyof typeof firebaseConfig]);

if (missingFields.length > 0) {
  console.error('❌ Missing Firebase configuration:', missingFields);
  console.error('🔧 Please check your environment variables in Vercel dashboard');
}

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

try {
  // Only initialize Firebase if all required fields are present
  if (missingFields.length === 0) {
    app = getApps().length ? getApps()[0]! : initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      console.log('✅ Firebase initialized successfully');
    }
  } else {
    throw new Error(`Missing Firebase configuration: ${missingFields.join(', ')}`);
  }
} catch (error) {
  console.error('❌ Firebase initialization failed:', error);
  
  // Create fallback objects to prevent app crashes
  if (typeof window !== 'undefined') {
    console.error('🚨 App may not function properly without Firebase configuration');
    alert('Firebase configuration error. Please check the console for details.');
  }
  
  throw error;
}

export { auth, db };
