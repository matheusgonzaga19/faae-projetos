import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { onAuthStateChange } from '@/lib/firebase';
import { firebaseService } from '@/services/firebaseService';

interface UserData {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: 'admin' | 'colaborador';
  isActive: boolean;
  profileImageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface AuthContextType {
  currentUser: User | null;
  userData: UserData | null;
  loading: boolean;
  isAdmin: boolean;
  hasProjectAccess: (projectId: string) => boolean;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  userData: null,
  loading: true,
  isAdmin: false,
  hasProjectAccess: () => false,
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (user: User | null) => {
      setCurrentUser(user);
      
      if (user) {
        try {
          // Get additional user data from Firestore
          const userDoc = await firebaseService.getUser(user.uid);
          if (userDoc) {
            setUserData(userDoc);
          } else {
            // Create user document if it doesn't exist (for Google auth users)
            const newUserData = {
              id: user.uid,
              email: user.email || '',
              firstName: user.displayName?.split(' ')[0] || '',
              lastName: user.displayName?.split(' ').slice(1).join(' ') || '',
              role: 'colaborador' as const,
              isActive: true,
              profileImageUrl: user.photoURL || undefined,
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            
            await firebaseService.createUser(newUserData);
            setUserData(newUserData);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setUserData(null);
        }
      } else {
        setUserData(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const isAdmin = userData?.role === 'admin';

  const hasProjectAccess = (projectId: string): boolean => {
    if (!userData) return false;
    if (isAdmin) return true;
    
    // For now, colaboradores have access to all projects
    // This can be enhanced later with project-specific permissions
    return userData.isActive;
  };

  const value = {
    currentUser,
    userData,
    loading,
    isAdmin,
    hasProjectAccess,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};