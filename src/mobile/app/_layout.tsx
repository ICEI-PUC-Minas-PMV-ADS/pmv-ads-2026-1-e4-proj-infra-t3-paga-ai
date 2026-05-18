import { useEffect, useState } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { AuthProvider } from '@contexts/AuthContext';
import { useAuth } from '@hooks/useAuth';

function RootRedirect() {
  const { isAuthenticated } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, segments, mounted]);

  return <Slot />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootRedirect />
    </AuthProvider>
  );
}