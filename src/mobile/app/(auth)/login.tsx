// app/(auth)/login.tsx
// Responsabilidade: tela de autenticação do usuário.
// Chama a Usuarios.API via Gateway e armazena o JWT no AuthContext.
import {  BASE_URL } from '@constants/endpoints';
import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';

import { useAuth }   from '@hooks/useAuth';
import { Button }    from '@components/common/Button';
import { Input }     from '@components/common/Input';
import { colors, spacing, fontSize } from '@constants/theme';
import api           from '@services/api';
import { USUARIOS }  from '@constants/endpoints';
import type { Usuario } from '@modelos/usuario';

export default function LoginScreen() {
  const { login } = useAuth();

  const [email,    setEmail]    = useState('');
  const [senha,    setSenha]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [erros,    setErros]    = useState<Record<string, string>>({});

  const validar = (): boolean => {
    const novosErros: Record<string, string> = {};
    if (!email.trim()) novosErros.email = 'Email é obrigatório.';
    if (!senha.trim()) novosErros.senha = 'Senha é obrigatória.';
    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const handleLogin = async () => {
  if (!validar()) return;

  try {
    setLoading(true);
    console.log('Chamando:', `${BASE_URL}/backend/Usuarios/Auth/login`);
    console.log('Body:', { email, senha });
    
 const response = await api.post<{ token: string }>(
  '/backend/Usuarios/login',
  { email, senha }
);
console.log('Resposta completa:', JSON.stringify(response.data));
await login(null, response.data.token);
  } catch (err: any) {
  console.log('Erro completo:', JSON.stringify(err?.message));
  console.log('Erro status:', err?.response?.status);
  console.log('Erro data:', JSON.stringify(err?.response?.data));
  Alert.alert('Erro', 'Email ou senha incorretos.');

  } finally {
    setLoading(false);
  }
};

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>

        {/* Logo / título */}
        <View style={styles.header}>
          <Text style={styles.logo}>Paga-AI</Text>
          <Text style={styles.subtitle}>Faça login para continuar</Text>
        </View>

        {/* Formulário */}
        <View style={styles.form}>
          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            error={erros.email}
          />
          <Input
            label="Senha"
            value={senha}
            onChangeText={setSenha}
            secureTextEntry
            error={erros.senha}
          />
        </View>

        {/* Botão */}
        <Button
          title="Entrar"
          variant="primary"
          loading={loading}
          onPress={handleLogin}
        />

      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  logo: {
    fontSize: 36,
    fontWeight: '500',
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textMuted,
  },
  form: {
    gap: spacing.md,
  },
});
