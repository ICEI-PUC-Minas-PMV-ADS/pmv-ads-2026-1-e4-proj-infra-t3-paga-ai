// authService.js
// Serviço de autenticação para o frontend
const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5133/api/Auth";

async function request(url, options) {
  try {
    const res = await fetch(url, options);
    if (!res.ok) {
      let errorMsg = "Erro desconhecido.";
      try {
        const errorData = await res.json();
        errorMsg = errorData.mensagem || errorData.message || errorData.error || `HTTP ${res.status}`;
      } catch (e) {
        errorMsg = `HTTP ${res.status}`;
      }
      throw new Error(errorMsg);
    }
    return res;
  } catch (err) {
    if (err instanceof TypeError && err.message.includes('Failed to fetch')) {
      throw new Error("Não foi possível conectar ao servidor. Verifique se o backend está rodando.");
    }
    throw err;
  }
}

export async function login(email, senha, rememberMe) {
  const res = await request(`${BASE_URL}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, senha }),
  });
  const data = await res.json();
  const token = data.token;
  if (!token) {
    throw new Error("Token não retornado pela API.");
  }

  if (rememberMe) {
    localStorage.setItem("auth_token", token);
    localStorage.setItem("remembered_email", email);
  } else {
    sessionStorage.setItem("auth_token", token);
    localStorage.removeItem("remembered_email");
  }

  return token;
}

export async function register(usuario) {
  const res = await request(`${BASE_URL}/registrar`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(usuario),
  });
  return res.json();
}

export async function forgotPassword(email) {
  const res = await request(`${BASE_URL}/forgot-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  });
  return res.json();
}

export async function resetPassword(email, token, newPassword) {
  const res = await request(`${BASE_URL}/reset-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, token, newPassword }),
  });
  return res.json();
}

export function logout() {
  localStorage.removeItem("auth_token");
  sessionStorage.removeItem("auth_token");
}

export function getToken() {
  return localStorage.getItem("auth_token") ?? sessionStorage.getItem("auth_token") ?? "";
}

export function rememberEmail(email) {
  localStorage.setItem("remembered_email", email);
}

export function clearRememberedEmail() {
  localStorage.removeItem("remembered_email");
}

export function getRememberedEmail() {
  return localStorage.getItem("remembered_email") ?? "";
}

export function isAuthenticated() {
  return Boolean(getToken());
}
