import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { GoogleAuthProvider, getAuth, signInWithPopup, signOut } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Logout Error:", error);
  }
};

const signInwithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      console.log(result);
    } catch (error) {
      console.error("Google Sign-In Error:", error);
      alert(error.message);
    }
  };
  
  export { app, auth, db, signInwithGoogle, logout };
  