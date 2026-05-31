import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Link, useRouter, useLocalSearchParams } from 'expo-router';
import { resetPassword } from '@services/authService';
 
export default function ResetPasswordScreen() {
  const router = useRouter();
  const { email, token } = useLocalSearchParams<{ email: string; token: string }>();
 
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
 
  useEffect(() => {
    if (!email || !token) {
      setErro('Link inválido ou expirado.');
    }
  }, [email, token]);
 
  const handleSubmit = async () => {
    setErro('');
    setSucesso('');
 
    if (!newPassword || !confirmPassword) {
      setErro('Preencha todos os campos.');
      return;
    }
 
    if (newPassword.length < 6) {
      setErro('A senha deve ter ao menos 6 caracteres.');
      return;
    }
 
    if (newPassword !== confirmPassword) {
      setErro('As senhas não coincidem.');
      return;
    }
 
    if (!email || !token) {
      setErro('Link inválido ou expirado.');
      return;
    }
 
    try {
      setLoading(true);
      await resetPassword(email as string, token as string, newPassword);
      setSucesso('Senha redefinida com sucesso!');
    } catch (error: any) {
      setErro(error.message || 'Falha ao redefinir senha.');
    } finally {
      setLoading(false);
    }
  };
 
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.brandContainer}>
          <View style={styles.icon}>
            <Text style={styles.iconText}>💰</Text>
          </View>
          <Text style={styles.title}>Redefinir senha</Text>
          <Text style={styles.subtitle}>
            Defina uma nova senha para sua conta.
          </Text>
        </View>
 
        <View style={styles.formContainer}>
          <Text style={styles.label}>Nova senha</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="••••••••"
              placeholderTextColor="#999"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry={!showPassword}
              editable={!loading}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.toggleButton}
            >
              <Text style={styles.toggleText}>
                {showPassword ? 'Ocultar' : 'Mostrar'}
              </Text>
            </TouchableOpacity>
          </View>
 
          <Text style={[styles.label, { marginTop: 16 }]}>Confirmar senha</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="••••••••"
              placeholderTextColor="#999"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              editable={!loading}
            />
            <TouchableOpacity
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              style={styles.toggleButton}
            >
              <Text style={styles.toggleText}>
                {showConfirmPassword ? 'Ocultar' : 'Mostrar'}
              </Text>
            </TouchableOpacity>
          </View>
 
          {erro ? <Text style={styles.errorMessage}>{erro}</Text> : null}
          {sucesso ? <Text style={styles.successMessage}>{sucesso}</Text> : null}
 
          <TouchableOpacity
            style={[
              styles.resetButton,
              (loading || !email || !token) && styles.buttonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={loading || !email || !token}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.resetButtonText}>Redefinir senha</Text>
            )}
          </TouchableOpacity>
 
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
 
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
    backgroundColor: '#fff',
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  icon: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: '#7c3aed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  iconText: {
    fontSize: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  formContainer: {
    width: '100%',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  passwordContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 20,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#f8fafc',
    fontSize: 14,
    color: '#111827',
  },
  toggleButton: {
    position: 'absolute',
    right: 12,
  },
  toggleText: {
    color: '#666',
    fontSize: 13,
    fontWeight: '500',
  },
  errorMessage: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    fontSize: 13,
    marginBottom: 16,
  },
  successMessage: {
    backgroundColor: '#dcfce7',
    color: '#166534',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    fontSize: 13,
    marginBottom: 16,
  },
  resetButton: {
    width: '100%',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: '#7c3aed',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  dividerText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#9ca3af',
    marginHorizontal: 12,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  loginText: {
    color: '#6b7280',
    fontSize: 14,
  },
  loginLink: {
    color: '#7c3aed',
    fontSize: 14,
    fontWeight: '700',
  },
});