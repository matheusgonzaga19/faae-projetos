import { useFirebaseAuth } from './useFirebaseAuth';

export function useAuth() {
  const {
    user,
    isLoading,
    isAuthenticated,
    signIn,
    signInWithEmail,
    signOut,
    updateUserRole,
    error
  } = useFirebaseAuth();

  return {
    user,
    isLoading,
    isAuthenticated,
    signIn,
    signInWithEmail,
    signOut,
    updateUserRole,
    error,
  };
}
