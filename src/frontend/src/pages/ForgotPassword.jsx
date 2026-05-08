import { useState } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "../services/authService";

function validarEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setErro("");
    setSucesso("");

    if (!email) {
      setErro("Por favor, informe o e-mail de recuperação.");
      return;
    }

    if (!validarEmail(email)) {
      setErro("Informe um e-mail válido.");
      return;
    }

    try {
      setLoading(true);
      await forgotPassword(email);
      setSucesso("Se o e-mail existir, você receberá instruções em breve.");
    } catch (e) {
      setErro(e.message || "Falha ao enviar instruções.");
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
            <h1 style={styles.title}>Recuperar senha</h1>
            <p style={styles.subtitle}>Digite o e-mail cadastrado para receber instruções.</p>
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

          {erro && <div style={styles.errorMessage}>{erro}</div>}
          {sucesso && <div style={styles.successMessage}>{sucesso}</div>}

          <button type="submit" style={styles.loginButton} disabled={loading}>
            {loading ? "Enviando..." : "Enviar instruções"}
          </button>
        </form>

        <div style={styles.divider}>
          <span style={styles.dividerLine} />
          <span style={styles.dividerText}>ou</span>
          <span style={styles.dividerLine} />
        </div>

        <div style={styles.createRow}>
          <span style={styles.createText}>Lembrou sua senha?</span>
          <Link to="/login" style={styles.createLink}>Entrar</Link>
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
