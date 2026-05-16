import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const config = {
  apiKey: "AIzaSyAiSWiVJQ8wOlsvQ33OxYdrnL-bLFvUVHE",
  authDomain: "system-padaria.firebaseapp.com",
  projectId: "system-padaria",
  storageBucket: "system-padaria.firebasestorage.app",
  messagingSenderId: "908203738388",
  appId: "1:908203738388:web:2dcff33ee672bf273dae01"
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
