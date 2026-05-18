// Serviço de autenticação para o mobile
// Espelha a implementação do web, mas usa axios em vez de fetch
import api from './api';
import { DEV_BASE_URL } from '@constants/endpoints';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = '@pagaai:token';
const REMEMBERED_EMAIL_KEY = '@pagaai:remembered_email';

// URL base da API de usuários — ajusta entre dev e produção
const USUARIOS_BASE_URL = DEV_BASE_URL + '/backend/Usuarios';

function validarEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Realiza login com email e senha
 */
export async function login(
  email: string,
  senha: string,
  rememberMe: boolean = false
): Promise<{ token: string; user?: { nome: string; email: string } }> {
  try {
    const response = await api.post(`${USUARIOS_BASE_URL}/login`, {
      email,
      senha,
    });

    const { token } = response.data;

    if (!token) {
      throw new Error('Token não retornado pela API.');
    }

    // Armazenar token e email se "Lembrar-me" foi selecionado
    await AsyncStorage.setItem(TOKEN_KEY, token);
    if (rememberMe) {
      await AsyncStorage.setItem(REMEMBERED_EMAIL_KEY, email);
    } else {
      await AsyncStorage.removeItem(REMEMBERED_EMAIL_KEY);
    }

    // Decodificar JWT para extrair dados do usuário
    const user = decodeToken(token);

    return { token, user };
  } catch (error: any) {
    const message =
      error.response?.data?.mensagem ||
      error.message ||
      'Falha ao realizar login.';
    throw new Error(message);
  }
}

/**
 * Registra um novo usuário
 */
export async function register(userData: {
  nome: string;
  email: string;
  senha: string;
}): Promise<{ mensagem: string; id: string }> {
  try {
    // Validações básicas
    if (!userData.nome || !userData.email || !userData.senha) {
      throw new Error('Preencha todos os campos.');
    }
    if (!validarEmail(userData.email)) {
      throw new Error('Informe um e-mail válido.');
    }
    if (userData.senha.length < 6) {
      throw new Error('A senha deve ter ao menos 6 caracteres.');
    }

    const response = await api.post(`${USUARIOS_BASE_URL}/registrar`, userData);
    return response.data;
  } catch (error: any) {
    const message =
      error.response?.data?.mensagem ||
      error.message ||
      'Falha ao criar conta.';
    throw new Error(message);
  }
}

/**
 * Solicita recuperação de senha (envia email com link de reset)
 */
export async function forgotPassword(email: string): Promise<{
  mensagem: string;
}> {
  try {
    if (!email) {
      throw new Error('Por favor, informe o e-mail de recuperação.');
    }
    if (!validarEmail(email)) {
      throw new Error('Informe um e-mail válido.');
    }

    const response = await api.post(`${USUARIOS_BASE_URL}/forgot-password`, {
      email,
    });
    return response.data;
  } catch (error: any) {
    const message =
      error.response?.data?.mensagem ||
      error.message ||
      'Falha ao enviar instruções.';
    throw new Error(message);
  }
}

/**
 * Redefinir a senha com o token recebido no email
 */
export async function resetPassword(
  email: string,
  token: string,
  newPassword: string
): Promise<{ mensagem: string }> {
  try {
    if (!email || !token || !newPassword) {
      throw new Error('Todos os campos são obrigatórios.');
    }
    if (newPassword.length < 6) {
      throw new Error('A senha deve ter ao menos 6 caracteres.');
    }

    const response = await api.post(`${USUARIOS_BASE_URL}/reset-password`, {
      email,
      token,
      newPassword,
    });
    return response.data;
  } catch (error: any) {
    const message =
      error.response?.data?.mensagem ||
      error.message ||
      'Falha ao redefinir senha.';
    throw new Error(message);
  }
}

/**
 * Fazer logout e limpar o token
 */
export async function logout(): Promise<void> {
  await AsyncStorage.removeItem(TOKEN_KEY);
  await AsyncStorage.removeItem(REMEMBERED_EMAIL_KEY);
}

/**
 * Obter o token armazenado
 */
export async function getToken(): Promise<string | null> {
  return await AsyncStorage.getItem(TOKEN_KEY);
}

/**
 * Obter o email lembrado
 */
export async function getRememberedEmail(): Promise<string | null> {
  return await AsyncStorage.getItem(REMEMBERED_EMAIL_KEY);
}

/**
 * Verificar se o usuário está autenticado
 */
export async function isAuthenticated(): Promise<boolean> {
  const token = await getToken();
  return !!token;
}

/**
 * Decodificar JWT para obter dados do usuário
 * O token JWT tem 3 partes separadas por "."
 * A parte do meio (índice 1) é o payload em Base64
 */
function decodeToken(
  token: string
): { nome: string; email: string } | null {
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(Buffer.from(payload, 'base64').toString());

    return {
      nome:
        decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] ??
        'Usuário',
      email:
        decoded[
          'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'
        ] ?? '',
    };
  } catch {
    return null;
  }
}
