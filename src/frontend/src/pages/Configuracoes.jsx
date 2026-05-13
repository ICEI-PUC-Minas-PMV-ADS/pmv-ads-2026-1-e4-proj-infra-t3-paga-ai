import { useState } from "react";
import { getUsuarioLogado } from "../services/authService";
import { useNavigate } from "react-router-dom";


export default function Configuracoes() {
    const usuario = getUsuarioLogado();
    const navigate = useNavigate();

  const STORAGE_KEY = `pagai_config_${usuario?.email ?? "default"}`;

  const carregarConfig = () => {
    try {
      const salvo = localStorage.getItem(STORAGE_KEY);
      return salvo ? JSON.parse(salvo) : null;
    } catch { return null; }
  };

  const configSalva = carregarConfig();

  const [notif, setNotif] = useState(configSalva?.notif ?? {
    emailVencimento: true,
    emailPagamento:  true,
    pushNovos:       false,
  });

  const [sistema, setSistema] = useState(configSalva?.sistema ?? {
    diasAviso:   5,
    taxaPadrao:  30,
    moeda:       "BRL",
  });

  const [salvo, setSalvo] = useState(false);

  function salvar() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ notif, sistema }));
    setSalvo(true);
    setTimeout(() => setSalvo(false), 2500);
  }

  return (
    <div style={s.page}>
      <div style={s.header}>
        <h1 style={s.titulo}>Configurações</h1>
        <p style={s.sub}>Ajustes do sistema e preferências</p>
      </div>

      {/* Perfil resumido */}
      <section style={s.card}>
        <h2 style={s.cardTitulo}>👤 Conta</h2>
        <div style={s.perfilRow}>
          <div style={s.avatar}>{usuario?.nome?.split(" ").map(n => n[0]).join("").slice(0,2).toUpperCase() ?? "??"}</div>
          <div>
            <p style={s.perfilNome}>{usuario?.nome ?? "—"}</p>
            <p style={s.perfilEmail}>{usuario?.email ?? "—"}</p>
          </div>
        </div>
      </section>

      {/* Notificações */}
      <section style={s.card}>
        <h2 style={s.cardTitulo}>🔔 Notificações</h2>
        {[
          { key: "emailVencimento", label: "E-mail ao vencer empréstimo" },
          { key: "emailPagamento",  label: "E-mail ao receber pagamento" },
          { key: "pushNovos",       label: "Alertas de novos empréstimos" },
        ].map(({ key, label }) => (
          <div key={key} style={s.toggleRow}>
            <span style={s.toggleLabel}>{label}</span>
            <button
              style={{ ...s.toggle, background: notif[key] ? "#7C3AED" : "#D1D5DB" }}
              onClick={() => setNotif(p => ({ ...p, [key]: !p[key] }))}
            >
              <span style={{ ...s.toggleDot, transform: notif[key] ? "translateX(20px)" : "translateX(2px)" }} />
            </button>
          </div>
        ))}
      </section>

      {/* Sistema */}
      <section style={s.card}>
        <h2 style={s.cardTitulo}>⚙️ Sistema</h2>

        <div style={s.fieldRow}>
          <label style={s.label}>Dias de aviso antes do vencimento</label>
          <input
            type="number" min={1} max={30}
            value={sistema.diasAviso}
            onChange={e => setSistema(p => ({ ...p, diasAviso: e.target.value }))}
            style={s.input}
          />
        </div>

        <div style={s.fieldRow}>
          <label style={s.label}>Taxa de juros padrão (%/mês)</label>
          <input
            type="number" min={1} max={100}
            value={sistema.taxaPadrao}
            onChange={e => setSistema(p => ({ ...p, taxaPadrao: e.target.value }))}
            style={s.input}
          />
        </div>
      </section>

      <div style={s.rodape}>
        <button style={s.btnSalvar} onClick={salvar}>
          {salvo ? "✔ Salvo!" : "Salvar configurações"}
        </button>
      </div>
    </div>
  );
}

const s = {
    page: {
        padding: "2rem",
        background: "#F5F3FF",
        minHeight: "100vh"
    },
    header: {
        marginBottom: "1.5rem"
    },
    titulo: {
        margin: 0,
        fontSize: "1.8rem",
        fontWeight: 700,
        color: "#1F2937"
    },
    sub: {
        margin: "0.25rem 0 0",
        color: "#6B7280",
        fontSize: "0.9rem"
    },
    card: {
        background: "#fff",
        borderRadius: 12,
        padding: "1.5rem",
        marginBottom: "1rem",
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)"
    },
    cardTitulo: {
        margin: "0 0 1.25rem",
        fontSize: "1rem",
        fontWeight: 700,
        color: "#1F2937"
    },
    perfilRow: {
        display: "flex",
        alignItems: "center",
        gap: "1rem"
    },
    avatar: {
        width: 52,
        height: 52,
        borderRadius: "50%",
        background: "linear-gradient(143deg,#7C3AED,#6D28D9)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        fontWeight: 700,
        fontSize: "1.1rem",
        flexShrink: 0
    },
    perfilNome: {
        margin: 0,
        fontWeight: 700,
        fontSize: "1rem",
        color: "#1F2937"
    },
    perfilEmail: {
        margin: "2px 0 0",
        fontSize: "0.85rem",
        color: "#6B7280"
    },
    toggleRow: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "0.6rem 0",
        borderBottom: "1px solid #F3F4F6"
    },
    toggleLabel: {
        fontSize: "0.9rem",
        color: "#374151"
    },
    toggle: {
        width: 44,
        height: 24,
        borderRadius: 12,
        border: "none",
        cursor: "pointer",
        position: "relative",
        transition: "background 0.2s",
        flexShrink: 0
    },
    toggleDot: {
        position: "absolute",
        top: 3,
        width: 18,
        height: 18,
        background: "#fff",
        borderRadius: "50%",
        transition: "transform 0.2s"
    },
    fieldRow: {
        marginBottom: "1rem"
    },
    label: {
        display: "block",
        fontSize: "0.85rem",
        fontWeight: 600,
        color: "#374151",
        marginBottom: 6
    },
    input: {
        width: "100%",
        padding: "0.5rem 0.75rem",
        borderRadius: 8,
        border: "1px solid #D1D5DB",
        fontSize: "0.95rem",
        boxSizing: "border-box"
    },
    rodape: {
        display: "flex",
        justifyContent: "flex-end"
    },
    btnSalvar: {
        background: "#7C3AED",
        color: "#fff",
        border: "none",
        borderRadius: 8,
        padding: "0.65rem 1.5rem",
        cursor: "pointer",
        fontWeight: 600,
        fontSize: "0.95rem"
    },
};
