import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db, onAuthStateChange, signInWithGoogle, signInWithEmail, logOut } from '@/lib/firebase';
import type { FirebaseUser, Section } from '@/types/auth';
import { DEFAULT_ALLOWED_SECTIONS } from '@/types/auth';

export function useFirebaseAuth() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if Firebase is properly configured
  const isDemoMode = import.meta.env.VITE_FIREBASE_PROJECT_ID === 'demo-faae-projetos';

  useEffect(() => {
    // If in demo mode, set a mock user
    if (isDemoMode) {
      const demoUser: FirebaseUser = {
        id: 'demo-user-123',
        email: 'admin@faaeprojetos.com.br',
        firstName: 'Admin',
        lastName: 'FAAE',
        profileImageUrl: '',
        role: 'admin',
        allowedSections: [...DEFAULT_ALLOWED_SECTIONS, 'users'],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setUser(demoUser);
      setIsLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChange(async (firebaseUser: User | null) => {
      try {
        setFirebaseUser(firebaseUser);
        
        if (firebaseUser) {
          // Check if user exists in Firestore
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          
          if (userDoc.exists()) {
            // User exists, get their data
            const userData = userDoc.data() as FirebaseUser;
            setUser({
              ...userData,
              id: firebaseUser.uid,
              email: firebaseUser.email || userData.email,
              profileImageUrl: firebaseUser.photoURL || userData.profileImageUrl,
              allowedSections: userData.allowedSections || [...DEFAULT_ALLOWED_SECTIONS],
            });
          } else {
            // New user, create profile
            const names = firebaseUser.displayName?.split(' ') || [];
            const newUser: FirebaseUser = {
              id: firebaseUser.uid,
              email: firebaseUser.email || '',
              firstName: names[0] || '',
              lastName: names.slice(1).join(' ') || '',
              profileImageUrl: firebaseUser.photoURL || '',
              role: 'collaborator', // Default role
              allowedSections: [...DEFAULT_ALLOWED_SECTIONS],
              createdAt: new Date(),
              updatedAt: new Date(),
            };

            await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
            setUser(newUser);
          }
        } else {
          setUser(null);
        }
        
        setError(null);
      } catch (err) {
        console.error('Auth state change error:', err);
        setError(err instanceof Error ? err.message : 'Authentication error');
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const signIn = async () => {
    if (isDemoMode) {
      console.warn('Demo mode: Firebase not configured');
      return;
    }
    
    try {
      setError(null);
      await signInWithGoogle();
    } catch (err) {
      console.error('Sign in error:', err);
      setError(err instanceof Error ? err.message : 'Failed to sign in');
    }
  };

  const signInWithEmailPassword = async (email: string, password: string) => {
    if (isDemoMode) {
      console.warn('Demo mode: Firebase not configured');
      return;
    }

    try {
      setError(null);
      await signInWithEmail(email, password);
    } catch (err) {
      console.error('Email sign in error:', err);
      setError(err instanceof Error ? err.message : 'Failed to sign in');
    }
  };

  const signOutUser = async () => {
    if (isDemoMode) {
      // In demo mode, just clear the user
      setUser(null);
      return;
    }
    
    try {
      setError(null);
      await logOut();
    } catch (err) {
      console.error('Sign out error:', err);
      setError(err instanceof Error ? err.message : 'Failed to sign out');
    }
  };

  const updateUserRole = async (userId: string, role: 'admin' | 'collaborator') => {
    const allowedSections: Section[] =
      role === 'admin'
        ? [...DEFAULT_ALLOWED_SECTIONS, 'users']
        : [...DEFAULT_ALLOWED_SECTIONS];

    if (isDemoMode) {
      console.warn('Demo mode: Role update simulated');
      if (user && user.id === userId) {
        setUser({ ...user, role, allowedSections, updatedAt: new Date() });
      }
      return true;
    }

    try {
      await updateDoc(doc(db, 'users', userId), {
        role,
        allowedSections,
        updatedAt: new Date(),
      });

      if (user && user.id === userId) {
        setUser({ ...user, role, allowedSections, updatedAt: new Date() });
      }

      return true;
    } catch (err) {
      console.error('Update role error:', err);
      throw err;
    }
  };

  return {
    user,
    firebaseUser,
    isLoading,
    error,
    isAuthenticated: !!user,
    signIn,
    signInWithEmail: signInWithEmailPassword,
    signOut: signOutUser,
    updateUserRole,
  };
}