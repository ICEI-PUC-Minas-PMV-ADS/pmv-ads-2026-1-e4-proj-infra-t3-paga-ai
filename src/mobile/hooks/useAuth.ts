import { useAuthContext } from '@contexts/AuthContext';

export function useAuth() {
  const { user, token, isLoading, login, logout } = useAuthContext();

  return {
    user,
    token,
    isLoading,
    login,
    logout,
    isAuthenticated: !!token,
  };
}