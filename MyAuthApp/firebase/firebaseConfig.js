// MyAuthApp/firebase/firebaseConfig.js
import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDhdJ5Q-7y1-srrJ3xjbL3R0cp4gPRYCbI",
  authDomain: "nurseprac-australia.firebaseapp.com",
  projectId: "nurseprac-australia",
  storageBucket: "nurseprac-australia.firebasestorage.app",
  messagingSenderId: "642287766415",
  appId: "1:642287766415:web:dcefd1af465b26071759fa",
  measurementId: "G-FP7W3N1LK3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth
let auth;
try {
  // First try to initialize with persistence
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
} catch (error) {
  // If already initialized, just get the existing auth instance
  console.log("Using existing auth instance");
  auth = getAuth(app);
}

// Initialize Firestore
const db = getFirestore(app);

export { auth, db };