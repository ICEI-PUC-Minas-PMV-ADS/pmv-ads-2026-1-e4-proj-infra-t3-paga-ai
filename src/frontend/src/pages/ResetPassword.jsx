import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { resetPassword } from "../services/authService";

function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const email = searchParams.get("email");
  const token = searchParams.get("token");

  useEffect(() => {
    if (!email || !token) {
      setErro("Link inválido ou expirado.");
    }
  }, [email, token]);

  async function handleSubmit(event) {
    event.preventDefault();
    setErro("");
    setSucesso("");

    if (!newPassword || !confirmPassword) {
      setErro("Preencha todos os campos.");
      return;
    }
    if (newPassword.length < 6) {
      setErro("A senha deve ter ao menos 6 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErro("As senhas não coincidem.");
      return;
    }

    try {
      setLoading(true);
      await resetPassword(email, token, newPassword);
      setSucesso("Senha redefinida com sucesso! Redirecionando para login...");
      setTimeout(() => navigate("/login"), 2000);
    } catch (e) {
      setErro(e.message || "Falha ao redefinir senha.");
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
            <h1 style={styles.title}>Redefinir senha</h1>
            <p style={styles.subtitle}>Defina uma nova senha para sua conta.</p>
          </div>
        </div>

        <form style={styles.form} onSubmit={handleSubmit}>
          <label style={styles.label} htmlFor="newPassword">Nova senha</label>
          <div style={styles.inputWrapper}>
            <input
              id="newPassword"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
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

          <label style={styles.label} htmlFor="confirmPassword">Confirmar senha</label>
          <div style={styles.inputWrapper}>
            <input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={styles.input}
            />
            <button
              type="button"
              style={styles.toggleButton}
              onClick={() => setShowConfirmPassword((current) => !current)}
            >
              {showConfirmPassword ? "Ocultar" : "Mostrar"}
            </button>
          </div>

          {erro && <div style={styles.errorMessage}>{erro}</div>}
          {sucesso && <div style={styles.successMessage}>{sucesso}</div>}

          <button
            type="submit"
            style={styles.loginButton}
            disabled={loading || !email || !token}
          >
            {loading ? "Redefinindo..." : "Redefinir senha"}
          </button>
        </form>

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
  inputWrapper: {
    position: "relative",
    marginBottom: "20px",
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
  toggleButton: {
    position: "absolute",
    right: "10px",
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    color: "#666",
    cursor: "pointer",
    fontSize: "14px",
  },
  errorMessage: {
    borderRadius: "12px",
    padding: "12px 14px",
    backgroundColor: "#fee2e2",
    color: "#991b1b",
    fontSize: "13px",
  },
  successMessage: {
    borderRadius: "12px",
    padding: "12px 14px",
    backgroundColor: "#dcfce7",
    color: "#166534",
    fontSize: "13px",
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

export default ResetPassword;
