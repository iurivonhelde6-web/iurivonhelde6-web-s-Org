import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Use environment variables if provided (e.g., in Vercel or Custom deploy)
// Otherwise fallback to the AI Studio auto-generated config
const config = {
  apiKey: "AIzaSyAiSWiVJQ8wO1svQ33OxYdrnL-bLFvUVHE",
  authDomain: "system-padaria.firebaseapp.com",
  projectId: "system-padaria",
  storageBucket: "system-padaria.firebasestorage.app",
  messagingSenderId: "908203738388",
  appId: "1:908203738388:web:2dcff33ee672bf273dae01",
};

const app = initializeApp(config);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const loginWithGoogle = async () => {
  try {
    await signInWithPopup(auth, googleProvider);
  } catch (error) {
    console.error("Error signing in with Google:", error);
    throw error;
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
};
