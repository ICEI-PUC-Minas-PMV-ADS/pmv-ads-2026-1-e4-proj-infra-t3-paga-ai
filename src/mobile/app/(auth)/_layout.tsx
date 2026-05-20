// Layout do grupo de autenticação — sem tabs nem header, telas em pilha simples.

import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }} />
  );
}
