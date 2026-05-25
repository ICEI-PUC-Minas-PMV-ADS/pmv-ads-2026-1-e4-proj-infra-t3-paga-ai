import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Slot, useRouter, useSegments } from 'expo-router';
import { AuthProvider } from '@contexts/AuthContext';
import { useAuth } from '@hooks/useAuth';
import { registrarPushToken, configurarListeners } from '@services/pushNotificationService';
import { salvarPushToken } from '@services/authService';

function RootRedirect() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading, segments]);

    useEffect(() => {
        if (!isAuthenticated || !user?.email) return;

        registrarPushToken().then((token) => {
            if (token) salvarPushToken(user.email, token);
        });

        const removerListeners = configurarListeners(
            (notificacao) => console.log('[Push] Recebida:', notificacao),
            (response) => console.log('[Push] Clicada:', response)
        );

        return removerListeners;
    }, [isAuthenticated, user?.email]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    );
  }

  return <Slot />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootRedirect />
    </AuthProvider>
  );
}