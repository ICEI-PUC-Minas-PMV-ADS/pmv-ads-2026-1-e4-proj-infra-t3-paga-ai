import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login, getRememberedEmail } from "../services/authService";

function validarEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    const savedEmail = getRememberedEmail();
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setErro("");

    if (!email || !senha) {
      setErro("Por favor, preencha e-mail e senha.");
      return;
    }
    if (!validarEmail(email)) {
      setErro("Informe um e-mail válido.");
      return;
    }

    try {
      setLoading(true);
      await login(email, senha, rememberMe);
      navigate("/dashboard");
    } catch (e) {
      setErro(e.message || "Falha ao realizar login.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.brand}>
          <div style={styles.icon}>💰</div>
          <div>
            <h1 style={styles.title}>Paga Aí</h1>
            <p style={styles.subtitle}>Gestão de Empréstimos Pessoais</p>
          </div>
        </div>

        <form style={styles.form} onSubmit={handleSubmit}>
          <label style={styles.label} htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
          />

          <label style={styles.label} htmlFor="senha">Senha</label>
          <div style={styles.inputWrapper}>
            <input
              id="senha"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              style={styles.input}
            />
            <button
              type="button"
              style={styles.toggleButton}
              onClick={() => setShowPassword((current) => !current)}
            >
              {showPassword ? "Ocultar" : "Mostrar"}
            </button>
          </div>

          <div style={styles.optionsRow}>
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={styles.checkbox}
              />
              Lembrar-me
            </label>
            <Link to="/forgot-password" style={styles.forgotLink}>Esqueci a senha</Link>
          </div>

          {erro && <div style={styles.errorMessage}>{erro}</div>}

          <button type="submit" style={styles.loginButton} disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <div style={styles.divider}>
          <span style={styles.dividerLine} />
          <span style={styles.dividerText}>ou</span>
          <span style={styles.dividerLine} />
        </div>

        <div style={styles.createRow}>
          <span style={styles.createText}>Não tem conta?</span>
          <Link to="/register" style={styles.createLink}>Criar conta</Link>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    background: "radial-gradient(circle at top, rgba(255,255,255,0.14), transparent 30%), linear-gradient(135deg, #6d28d9 0%, #7c3aed 55%, #9333ea 100%)",
  },
  card: {
    width: "100%",
    maxWidth: "420px",
    background: "#ffffff",
    borderRadius: "32px",
    boxShadow: "0 32px 80px rgba(15, 23, 42, 0.18)",
    padding: "40px 32px",
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },
  brand: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    gap: "16px",
  },
  icon: {
    width: "72px",
    height: "72px",
    borderRadius: "20px",
    background: "linear-gradient(143deg, rgba(124,58,237,1) 0%, rgba(109,40,217,1) 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "28px",
    color: "#ffffff",
    boxShadow: "0 18px 50px rgba(124, 58, 237, 0.2)",
  },
  title: {
    fontSize: "28px",
    fontWeight: 700,
    color: "#111827",
    margin: 0,
  },
  subtitle: {
    fontSize: "14px",
    color: "#6b7280",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "18px",
  },
  label: {
    fontSize: "13px",
    fontWeight: 600,
    color: "#374151",
    marginBottom: "8px",
  },
  input: {
    width: "100%",
    padding: "14px 16px",
    borderRadius: "14px",
    border: "1px solid #e5e7eb",
    backgroundColor: "#f8fafc",
    fontSize: "14px",
    color: "#111827",
    outline: "none",
  },
  optionsRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    fontSize: "14px",
    color: "#6b7280",
  },
  checkbox: {
    width: "16px",
    height: "16px",
    accentColor: "#7c3aed",
  },
  forgotLink: {
    color: "#7c3aed",
    fontSize: "14px",
    textDecoration: "none",
  },
  errorMessage: {
    borderRadius: "12px",
    padding: "12px 14px",
    backgroundColor: "#fee2e2",
    color: "#991b1b",
    fontSize: "13px",
  },
  inputWrapper: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },
  toggleButton: {
    position: "absolute",
    right: "14px",
    top: "50%",
    transform: "translateY(-50%)",
    background: "transparent",
    border: "none",
    color: "#7c3aed",
    fontWeight: 700,
    cursor: "pointer",
    fontSize: "12px",
    padding: 0,
  },
  loginButton: {
    width: "100%",
    padding: "14px 16px",
    borderRadius: "14px",
    border: "none",
    backgroundColor: "#7c3aed",
    color: "#ffffff",
    fontWeight: 700,
    fontSize: "15px",
    cursor: "pointer",
    transition: "background-color 0.2s ease",
  },
  divider: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  dividerLine: {
    flex: 1,
    height: "1px",
    backgroundColor: "#e5e7eb",
  },
  dividerText: {
    fontSize: "13px",
    fontWeight: 700,
    color: "#9ca3af",
    textTransform: "uppercase",
  },
  createRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    color: "#6b7280",
    fontSize: "14px",
  },
  createText: {
    color: "#6b7280",
  },
  createLink: {
    color: "#7c3aed",
    textDecoration: "none",
    fontWeight: 700,
  },
};
