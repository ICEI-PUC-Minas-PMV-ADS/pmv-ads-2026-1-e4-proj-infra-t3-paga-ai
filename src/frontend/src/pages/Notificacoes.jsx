import { useEffect, useState } from "react";
import { getUsuarioLogado } from "../services/authService";
import { getNotificacoes, marcarLida, marcarTodasLidas, deletarNotif } from "../services/NotificacoesService";


const fmt = (v) =>
  Number(v ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const fmtData = (d) =>
  d ? new Date(d).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

const TIPO_CONFIG = {
  Cobrança:   { icon: "💳", cor: "#7C3AED", bg: "#EDE9FE" },
  Pagamento:  { icon: "✅", cor: "#16A34A", bg: "#D1FAE5" },
  Vencimento: { icon: "⚠️", cor: "#D97706", bg: "#FEF3C7" },
  default:    { icon: "🔔", cor: "#2563EB", bg: "#DBEAFE" },
};

export default function Notificacoes() {
    const cobrador = getUsuarioLogado()?.nome ?? "";
    

  const [lista,   setLista]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro,  setFiltro]  = useState("todas");

  async function carregar() {
    setLoading(true);
    try {
      const data = await getNotificacoes(cobrador);
      setLista(Array.isArray(data) ? data : []);
    } catch {
      setLista([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (cobrador) carregar(); }, [cobrador]);

  async function handleLida(id) {
    try {
      await marcarLida(id);
      setLista((prev) => prev.map((n) => n.id === id ? { ...n, lida: true } : n));
    } catch { }
  }

  async function handleDeletar(id) {
    if (!confirm("Excluir esta notificação?")) return;
    try {
      await deletarNotif(id);
      setLista((prev) => prev.filter((n) => n.id !== id));
    } catch { }
  }

  async function marcarTodas() {
  try {
    await marcarTodasLidas(cobrador);
    setLista((prev) => prev.map((n) => ({ ...n, lida: true })));
  } catch { }
}

  const naoLidas = lista.filter((n) => !n.lida).length;

  const filtradas = lista.filter((n) => {
    if (filtro === "naoLidas") return !n.lida;
    if (filtro === "lidas")    return n.lida;
    return true;
  });

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <h1 style={s.titulo}>
            Notificações
            {naoLidas > 0 && <span style={s.badge}>{naoLidas}</span>}
          </h1>
          <p style={s.sub}>{lista.length} notificação(ões) no total</p>
        </div>
        {naoLidas > 0 && (
          <button style={s.btnMarcar} onClick={marcarTodas}>✔ Marcar todas como lidas</button>
        )}
      </div>

      <div style={s.filtros}>
        {[
          { key: "todas",    label: "Todas" },
          { key: "naoLidas", label: `Não lidas${naoLidas > 0 ? ` (${naoLidas})` : ""}` },
          { key: "lidas",    label: "Lidas" },
        ].map((f) => (
          <button key={f.key} style={{ ...s.filtroBtn, ...(filtro === f.key ? s.filtroBtnAtivo : {}) }} onClick={() => setFiltro(f.key)}>
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={s.vazio}>Carregando notificações...</div>
      ) : filtradas.length === 0 ? (
        <div style={s.vazioBox}>
          <span style={{ fontSize: "2.5rem" }}>🔔</span>
          <p style={s.vazioTexto}>Nenhuma notificação encontrada.</p>
        </div>
      ) : (
        <div style={s.lista}>
          {filtradas.map((n) => {
            const cfg = TIPO_CONFIG[n.tipo] ?? TIPO_CONFIG.default;
            return (
              <div key={n.id} style={{ ...s.card, opacity: n.lida ? 0.65 : 1, borderLeft: `4px solid ${cfg.cor}` }}>
                <div style={{ ...s.iconBox, background: cfg.bg, color: cfg.cor }}>{cfg.icon}</div>
                <div style={s.cardBody}>
                  <div style={s.cardTop}>
                    <span style={s.cardNome}>{n.clienteNome}</span>
                    <span style={{ ...s.tipoBadge, background: cfg.bg, color: cfg.cor }}>{n.tipo}</span>
                  </div>
                  <p style={s.cardMsg}>{n.mensagem}</p>
                  <div style={s.cardBottom}>
                    <span style={s.cardData}>{fmtData(n.dataCriacao ?? n.data)}</span>
                    {n.valor > 0 && <span style={s.cardValor}>{fmt(n.valor)}</span>}
                  </div>
                </div>
                <div style={s.acoes}>
                  {!n.lida && <button style={s.btnLer} onClick={() => handleLida(n.id)}>✔</button>}
                  <button style={s.btnDel} onClick={() => handleDeletar(n.id)}>✕</button>
                </div>
                {!n.lida && <span style={s.ponto} />}
              </div>
            );
          })}
        </div>
      )}
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
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: "1.25rem"
    },
    titulo: {
        margin: 0,
        fontSize: "1.8rem",
        fontWeight: 700,
        color: "#1F2937",
        display: "flex",
        alignItems: "center",
        gap: 10
    },
    badge: {
        background: "#7C3AED",
        color: "#fff",
        borderRadius: 20,
        padding: "2px 10px",
        fontSize: "0.85rem",
        fontWeight: 700
    },
    sub: {
        margin: "0.25rem 0 0",
        color: "#6B7280",
        fontSize: "0.9rem"
    },
    btnMarcar: {
        background: "#7C3AED",
        color: "#fff",
        border: "none",
        borderRadius: 8,
        padding: "0.5rem 1.1rem",
        cursor: "pointer",
        fontWeight: 600,
        fontSize: "0.85rem"
    },
    filtros: {
        display: "flex",
        gap: 8,
        marginBottom: "1.25rem"
    },
    filtroBtn: {
        background: "#fff",
        border: "1px solid #E5E7EB",
        borderRadius: 8,
        padding: "0.4rem 1rem",
        cursor: "pointer",
        fontSize: "0.85rem",
        color: "#6B7280"
    },
    filtroBtnAtivo: {
        background: "#7C3AED",
        color: "#fff",
        border: "1px solid #7C3AED"
    },
    lista: {
        display: "flex",
        flexDirection: "column",
        gap: 10
    },
    card: {
        background: "#fff",
        borderRadius: 12,
        padding: "1rem 1.25rem",
        display: "flex",
        alignItems: "flex-start",
        gap: "1rem",
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        position: "relative"
    },
    iconBox: {
        fontSize: "1.4rem",
        borderRadius: 10,
        width: 44,
        height: 44,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0
    },
    cardBody: {
        flex: 1,
        minWidth: 0
    },
    cardTop: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginBottom: 4
    },
    cardNome: {
        fontWeight: 700,
        fontSize: "0.95rem",
        color: "#1F2937"
    },
    tipoBadge: {
        fontSize: "0.72rem",
        fontWeight: 600,
        borderRadius: 20,
        padding: "2px 8px"
    },
    cardMsg: {
        margin: "0 0 6px",
        fontSize: "0.85rem",
        color: "#4B5563"
    },
    cardBottom: {
        display: "flex",
        gap: 12,
        alignItems: "center"
    },
    cardData: {
        fontSize: "0.75rem",
        color: "#9CA3AF"
    },
    cardValor: {
        fontSize: "0.85rem",
        fontWeight: 700,
        color: "#7C3AED"
    },
    acoes: {
        display: "flex",
        flexDirection: "column",
        gap: 6,
        flexShrink: 0
    },
    btnLer: {
        background: "#D1FAE5",
        color: "#16A34A",
        border: "none",
        borderRadius: 6,
        padding: "4px 8px",
        cursor: "pointer",
        fontSize: 13
    },
    btnDel: {
        background: "#FEE2E2",
        color: "#DC2626",
        border: "none",
        borderRadius: 6,
        padding: "4px 8px",
        cursor: "pointer",
        fontSize: 13
    },
    ponto: {
        position: "absolute",
        top: 12,
        right: 12,
        width: 8,
        height: 8,
        background: "#7C3AED",
        borderRadius: "50%"
    },
    vazio: {
        textAlign: "center",
        color: "#9CA3AF",
        padding: "3rem 0"
    },
    vazioBox: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 12,
        padding: "3rem 0"
    },
    vazioTexto: {
        color: "#9CA3AF",
        fontSize: "0.95rem"
    },
};
