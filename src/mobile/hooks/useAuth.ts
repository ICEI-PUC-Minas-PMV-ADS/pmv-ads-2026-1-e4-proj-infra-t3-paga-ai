// Hook público de autenticação. Consome o AuthContext e expõe isAuthenticated
// para que telas e layouts possam verificar o estado sem depender do Context diretamente.

import { useAuthContext } from '@contexts/AuthContext';

export function useAuth() {
  const { user, token, login, logout } = useAuthContext();

  return {
    user,
    token,
    login,
    logout,
    isAuthenticated: !!token,
  };
}
