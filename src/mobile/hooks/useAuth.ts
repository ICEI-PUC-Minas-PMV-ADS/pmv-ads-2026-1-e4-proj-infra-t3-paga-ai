import { useAuthContext } from '@contexts/AuthContext';

export function useAuth() {
  const { user, token, isLoading, login, logout, updateUser } = useAuthContext();

  return {
    user,
    token,
    isLoading,
    login,
    logout,
    updateUser,
    isAuthenticated: !!token,
  };
}