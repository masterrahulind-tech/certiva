import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCifYVhVvMyPFYXzT_dGHs9mbzec_V66sw",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "careercue-84f65.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "careercue-84f65",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "careercue-84f65.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "7214275727",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:7214275727:web:f94b6c24493133e9c6a4fa",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-525TK6YNP3"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result;
  } catch (error) {
    console.error("Error signing in with Google", error);
    throw error;
  }
};
