import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUsuarioLogado, getToken } from "../services/authService";
import { getClientes } from "../services/clientesService";
import { getCarteira, getRelatorioLucro } from "../services/EmprestimosService";

const fmt = (v) =>
  Number(v ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const acoes = [
  { icon: "👥", label: "Clientes",       path: "/clientes",      desc: "Gerenciar devedores",      cor: "#7C3AED" },
  { icon: "💳", label: "Empréstimos",    path: "/emprestimos",   desc: "Controle de empréstimos",  cor: "#2563EB" },
  { icon: "📈", label: "Relatórios",     path: "/relatorios",    desc: "Visualizar relatórios",    cor: "#16A34A" },
  { icon: "⚙️", label: "Configurações", path: "/configuracoes", desc: "Ajustes do sistema",       cor: "#F59E0B" },
  { icon: "🔔", label: "Notificações", path: "/notificacoes", desc: "Notificacoes", cor: "#F59E0B" },
];

function calcularStatus(e) {
  if (e.pago) return "pago";
  const diff = Math.ceil((new Date(e.dataVencimento) - new Date()) / 86400000);
  return diff < 0 ? "atraso" : "emDia";
}

export default function Dashboard() {
  const navigate = useNavigate();
  const usuario  = getUsuarioLogado();
  const cobrador = usuario?.nome ?? "";
  const nome     = cobrador.split(" ")[0] || "Usuário";

  const [hora,       setHora]       = useState("");
  const [stats,      setStats]      = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [vencendo,   setVencendo]   = useState([]);

  useEffect(() => {
    const h = new Date().getHours();
    if (h < 12) setHora("Bom dia");
    else if (h < 18) setHora("Boa tarde");
    else setHora("Boa noite");
  }, []);

  useEffect(() => {
    if (!cobrador) return;
    async function carregar() {
      try {
        const [clientes, carteira, lucro] = await Promise.all([
          getClientes(getToken()),
          getCarteira(cobrador),
          getRelatorioLucro(cobrador),
        ]);

        const lista         = Array.isArray(carteira) ? carteira : [];
        const emDia         = lista.filter((e) => calcularStatus(e) === "emDia");
        const atrasados     = lista.filter((e) => calcularStatus(e) === "atraso");
        const proximosVenc  = lista
          .filter((e) => !e.pago)
          .sort((a, b) => new Date(a.dataVencimento) - new Date(b.dataVencimento))
          .slice(0, 4);

        setVencendo(proximosVenc);
        setStats({
          clientes:     Array.isArray(clientes) ? clientes.length : 0,
          emprestimos:  lista.length,
          emDia:        emDia.length,
          atraso:       atrasados.length,
          investido:    lucro?.resumoGeral?.investimentoTotal    ?? 0,
          aReceber:     lucro?.resumoGeral?.recebimentoTotalGeral ?? 0,
          lucro:        lucro?.resumoGeral?.lucroTotalProjetado   ?? 0,
        });
      } catch {
        setStats({ clientes: 0, emprestimos: 0, emDia: 0, atraso: 0, investido: 0, aReceber: 0, lucro: 0 });
      } finally {
        setCarregando(false);
      }
    }
    carregar();
  }, [cobrador]);

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <p style={s.saudacao}>{hora}, {nome} 👋</p>
          <h1 style={s.titulo}>Painel</h1>
        </div>
      </div>

      {/* Cards de contagem */}
      <div style={s.statsGrid}>
        <StatCard icon="👥" label="Clientes"    valor={stats?.clientes}    cor="#7C3AED" carregando={carregando} />
        <StatCard icon="💳" label="Empréstimos" valor={stats?.emprestimos} cor="#2563EB" carregando={carregando} />
        <StatCard icon="✅" label="Em dia"       valor={stats?.emDia}       cor="#16A34A" carregando={carregando} />
        <StatCard icon="⚠️" label="Em atraso"   valor={stats?.atraso}      cor="#DC2626" carregando={carregando} />
      </div>

      {/* Cards financeiros */}
      <div style={s.finGrid}>
        <FinCard label="Total Investido"  valor={fmt(stats?.investido)} cor="#7C3AED" carregando={carregando} />
        <FinCard label="Total a Receber"  valor={fmt(stats?.aReceber)}  cor="#2563EB" carregando={carregando} />
        <FinCard label="Lucro Projetado"  valor={fmt(stats?.lucro)}     cor="#16A34A" carregando={carregando} />
      </div>

      <div style={s.bottomGrid}>
        {/* Próximos vencimentos */}
        <div style={s.section}>
          <h2 style={s.secaoTitulo}>Próximos vencimentos</h2>
          {carregando ? (
            <Skeleton linhas={3} />
          ) : vencendo.length === 0 ? (
            <p style={s.vazio}>Nenhum empréstimo pendente.</p>
          ) : (
            vencendo.map((e) => {
              const diff = Math.ceil((new Date(e.dataVencimento) - new Date()) / 86400000);
              const atrasado = diff < 0;
              return (
                <div key={e.id} style={s.vencRow}>
                  <div>
                    <p style={s.vencNome}>{e.cliente}</p>
                    <p style={s.vencData}>
                      {atrasado
                        ? `${Math.abs(diff)} dia(s) em atraso`
                        : diff === 0 ? "Vence hoje"
                        : `Vence em ${diff} dia(s)`}
                    </p>
                  </div>
                  <span style={{ ...s.vencValor, color: atrasado ? "#DC2626" : "#7C3AED" }}>
                    {fmt(e.valorFinal)}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Acesso rápido */}
        <div style={s.section}>
          <h2 style={s.secaoTitulo}>Acesso rápido</h2>
          <div style={s.acoesGrid}>
            {acoes.map((a) => (
              <button key={a.path} style={s.card} onClick={() => navigate(a.path)}>
                <span style={{ ...s.cardIcone, background: `${a.cor}18`, color: a.cor }}>{a.icon}</span>
                <span style={s.cardLabel}>{a.label}</span>
                <span style={s.cardDesc}>{a.desc}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, valor, cor, carregando }) {
  return (
    <div style={{ ...s.statCard, borderTop: `4px solid ${cor}` }}>
      <span style={{ ...s.statIcon, color: cor }}>{icon}</span>
      <div>
        <p style={s.statValor}>{carregando ? <Shimmer w={40} h={24} /> : valor}</p>
        <p style={s.statLabel}>{label}</p>
      </div>
    </div>
  );
}

function FinCard({ label, valor, cor, carregando }) {
  return (
    <div style={{ ...s.finCard, borderLeft: `4px solid ${cor}` }}>
      <p style={s.finLabel}>{label}</p>
      <p style={{ ...s.finValor, color: cor }}>{carregando ? <Shimmer w={100} h={22} /> : valor}</p>
    </div>
  );
}

function Shimmer({ w = "100%", h = 16 }) {
  return (
    <span style={{
      display: "inline-block", width: w, height: h,
      borderRadius: 6, background: "linear-gradient(90deg,#e5e7eb 25%,#f3f4f6 50%,#e5e7eb 75%)",
      backgroundSize: "200% 100%",
      animation: "shimmer 1.2s infinite",
    }} />
  );
}

function Skeleton({ linhas }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {Array.from({ length: linhas }).map((_, i) => (
        <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <Shimmer w={120} h={14} />
            <Shimmer w={80} h={12} />
          </div>
          <Shimmer w={70} h={16} />
        </div>
      ))}
    </div>
  );
}

const s = {
  page:        { padding: "2rem", background: "#F5F3FF", minHeight: "100vh" },
  header:      { marginBottom: "1.5rem" },
  saudacao:    { margin: 0, fontSize: "0.95rem", color: "#6B7280" },
  titulo:      { margin: "0.25rem 0 0", fontSize: "1.8rem", fontWeight: 700, color: "#1F2937" },
  statsGrid:   { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem", marginBottom: "1rem" },
  statCard:    { background: "#fff", borderRadius: "12px", padding: "1.25rem", display: "flex", alignItems: "center", gap: "1rem", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" },
  statIcon:    { fontSize: "1.8rem" },
  statValor:   { margin: 0, fontSize: "1.4rem", fontWeight: 700, color: "#1F2937" },
  statLabel:   { margin: 0, fontSize: "0.78rem", color: "#6B7280" },
  finGrid:     { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", marginBottom: "1.5rem" },
  finCard:     { background: "#fff", borderRadius: "12px", padding: "1rem 1.25rem", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" },
  finLabel:    { margin: "0 0 0.25rem", fontSize: "0.78rem", color: "#6B7280", fontWeight: 600 },
  finValor:    { margin: 0, fontSize: "1.2rem", fontWeight: 700 },
  bottomGrid:  { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" },
  section:     { background: "#fff", borderRadius: "12px", padding: "1.25rem", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" },
  secaoTitulo: { fontSize: "1rem", fontWeight: 700, color: "#1F2937", margin: "0 0 1rem" },
  vencRow:     { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.6rem 0", borderBottom: "1px solid #F3F4F6" },
  vencNome:    { margin: 0, fontWeight: 600, fontSize: "0.9rem", color: "#1F2937" },
  vencData:    { margin: "2px 0 0", fontSize: "0.75rem", color: "#6B7280" },
  vencValor:   { fontWeight: 700, fontSize: "0.95rem" },
  vazio:       { color: "#9CA3AF", fontSize: "0.9rem", textAlign: "center", padding: "1rem 0" },
  acoesGrid:   { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" },
  card:        { background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: "10px", padding: "1rem", display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "0.3rem", cursor: "pointer", textAlign: "left", transition: "box-shadow 0.15s" },
  cardIcone:   { fontSize: "1.4rem", borderRadius: "8px", padding: "6px", marginBottom: "0.2rem" },
  cardLabel:   { fontWeight: 600, fontSize: "0.9rem", color: "#1F2937" },
  cardDesc:    { fontSize: "0.75rem", color: "#6B7280" },
};
