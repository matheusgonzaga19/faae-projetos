import { useFirebaseAuth } from './useFirebaseAuth';

export function useAuth() {
  const {
    user,
    isLoading,
    isAuthenticated,
    signInWithEmail,
    signOut,
    updateUserRole,
    error
  } = useFirebaseAuth();

  return {
    user,
    isLoading,
    isAuthenticated,
    signInWithEmail,
    signOut,
    updateUserRole,
    error,
  };
}
