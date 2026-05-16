// Layout raiz da aplicação. Envolve toda a árvore com AuthProvider e redireciona
// o usuário para login ou para as abas conforme o estado de autenticação.

import { useEffect } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { AuthProvider } from '@contexts/AuthContext';
import { useAuth } from '@hooks/useAuth';

function RootRedirect() {
  const { isAuthenticated } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, segments]);

  return <Slot />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootRedirect />
    </AuthProvider>
  );
}
