import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { getFirestore, enableNetwork, disableNetwork } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration - replace with your actual Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDSFpzXfmUNqeP1jpJsjf1hl9SnOUcfVKQ",
  authDomain: "faae-projetos-teste.firebaseapp.com",
  projectId: "faae-projetos-teste",
  storageBucket: "faae-projetos-teste.firebasestorage.app",
  messagingSenderId: "794010255592",
  appId: "1:794010255592:web:3f2a532512c14e88fbc95d"
};

// Validate Firebase configuration
if (!firebaseConfig.apiKey || !firebaseConfig.projectId || !firebaseConfig.appId) {
  console.error('Firebase configuration is missing. Please check your .env.local file.');
  console.log('Required variables:', {
    VITE_FIREBASE_API_KEY: firebaseConfig.apiKey ? 'SET' : 'MISSING',
    VITE_FIREBASE_PROJECT_ID: firebaseConfig.projectId ? 'SET' : 'MISSING', 
    VITE_FIREBASE_APP_ID: firebaseConfig.appId ? 'SET' : 'MISSING',
    VITE_FIREBASE_MESSAGING_SENDER_ID: firebaseConfig.messagingSenderId ? 'SET' : 'MISSING',
  });
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Configure Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile');

// Auth functions
export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);
export const logOut = () => signOut(auth);

// Helper function to translate auth error codes to Portuguese
const getAuthErrorMessage = (errorCode: string): string => {
  switch (errorCode) {
    case 'auth/email-already-in-use':
      return 'Este email já está em uso.';
    case 'auth/invalid-email':
      return 'Email inválido.';
    case 'auth/operation-not-allowed':
      return 'Operação não permitida.';
    case 'auth/weak-password':
      return 'Senha muito fraca. Use pelo menos 6 caracteres.';
    case 'auth/user-disabled':
      return 'Usuário desabilitado.';
    case 'auth/user-not-found':
      return 'Usuário não encontrado.';
    case 'auth/wrong-password':
      return 'Senha incorreta.';
    case 'auth/too-many-requests':
      return 'Muitas tentativas. Tente novamente mais tarde.';
    default:
      return 'Erro na autenticação. Tente novamente.';
  }
};

// Auth state observer
export const onAuthStateChange = (callback: (user: any) => void) => {
  return onAuthStateChanged(auth, callback);
};

// Firestore connection management
export const connectFirestore = () => enableNetwork(db);
export const disconnectFirestore = () => disableNetwork(db);

export default app;