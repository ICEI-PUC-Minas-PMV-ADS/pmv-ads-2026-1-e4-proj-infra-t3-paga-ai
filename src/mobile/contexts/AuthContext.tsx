import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TOKEN_KEY } from '@services/api';
import type { Usuario } from '@typings/usuario';


interface AuthContextData {
  user: Usuario | null;
  token: string | null;
  isLoading: boolean;
  login: (user: Usuario, token: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: Usuario) => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  

  useEffect(() => {
    async function loadStoredAuth() {
      const storedToken = await AsyncStorage.getItem(TOKEN_KEY);
      const storedUser = await AsyncStorage.getItem('@pagaai:user');
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
      setIsLoading(false);
    }
    loadStoredAuth();
  }, []);

  async function login(userData: Usuario, userToken: string) {
    await AsyncStorage.setItem(TOKEN_KEY, userToken);
    await AsyncStorage.setItem('@pagaai:user', JSON.stringify(userData));
    setUser(userData);
    setToken(userToken);
  }

  async function logout() {
    await AsyncStorage.removeItem(TOKEN_KEY);
    await AsyncStorage.removeItem('@pagaai:user');
    setUser(null);
    setToken(null);
  }

  async function updateUser(updatedUser: Usuario) {
    await AsyncStorage.setItem('@pagaai:user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  }

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  return useContext(AuthContext);
}