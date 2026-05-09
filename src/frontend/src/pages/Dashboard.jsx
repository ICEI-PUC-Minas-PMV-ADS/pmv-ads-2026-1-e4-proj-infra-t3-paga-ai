import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUsuarioLogado, getToken } from "../services/authService";
import { getClientes } from "../services/clientesService";
import { getCarteira } from "../services/EmprestimosService";

const acoes = [
  { icon: "👥", label: "Clientes",       path: "/clientes",      desc: "Gerenciar devedores"       },
  { icon: "💳", label: "Empréstimos",    path: "/emprestimos",   desc: "Controle de empréstimos"   },
  { icon: "📈", label: "Relatórios",     path: "/relatorios",    desc: "Visualizar relatórios"     },
  { icon: "⚙️", label: "Configurações", path: "/configuracoes", desc: "Ajustes do sistema"        },
];

function calcularStatus(e) {
  if (e.pago) return "pago";
  const diff = Math.ceil((new Date(e.dataVencimento) - new Date()) / 86400000);
  return diff < 0 ? "atraso" : "emDia";
}

export default function Dashboard() {
  const navigate  = useNavigate();
  const usuario   = getUsuarioLogado();
  const cobrador  = usuario?.nome ?? "";
  const nome      = cobrador.split(" ")[0] || "Usuário";

  const [hora,        setHora]        = useState("");
  const [stats,       setStats]       = useState({ clientes: "—", emprestimos: "—", emDia: "—", atraso: "—" });
  const [carregando,  setCarregando]  = useState(true);

  useEffect(() => {
    const h = new Date().getHours();
    if (h < 12) setHora("Bom dia");
    else if (h < 18) setHora("Boa tarde");
    else setHora("Boa noite");
  }, []);

  useEffect(() => {
    if (!cobrador) return;
    async function carregarStats() {
      try {
        const [clientes, carteira] = await Promise.all([
          getClientes(getToken()),
          getCarteira(cobrador),
        ]);

        const totalClientes    = Array.isArray(clientes) ? clientes.length : 0;
        const listaCarteira    = Array.isArray(carteira) ? carteira : [];
        const totalEmprestimos = listaCarteira.length;
        const emDia   = listaCarteira.filter((e) => calcularStatus(e) === "emDia").length;
        const atraso  = listaCarteira.filter((e) => calcularStatus(e) === "atraso").length;

        setStats({ clientes: totalClientes, emprestimos: totalEmprestimos, emDia, atraso });
      } catch {
        // mantém "—" se falhar
      } finally {
        setCarregando(false);
      }
    }
    carregarStats();
  }, [cobrador]);

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <p style={s.saudacao}>{hora}, {nome} 👋</p>
          <h1 style={s.titulo}>Painel</h1>
        </div>
      </div>

      <div style={s.statsGrid}>
        <CardResumo icon="👥" label="Clientes"    valor={carregando ? "..." : stats.clientes}    cor="#7C3AED" />
        <CardResumo icon="💳" label="Empréstimos" valor={carregando ? "..." : stats.emprestimos} cor="#2563EB" />
        <CardResumo icon="✅" label="Em dia"       valor={carregando ? "..." : stats.emDia}       cor="#16A34A" />
        <CardResumo icon="⚠️" label="Em atraso"   valor={carregando ? "..." : stats.atraso}      cor="#DC2626" />
      </div>

      <h2 style={s.secaoTitulo}>Acesso rápido</h2>
      <div style={s.acoesGrid}>
        {acoes.map((a) => (
          <button key={a.path} style={s.card} onClick={() => navigate(a.path)}>
            <span style={s.cardIcon}>{a.icon}</span>
            <span style={s.cardLabel}>{a.label}</span>
            <span style={s.cardDesc}>{a.desc}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function CardResumo({ icon, label, valor, cor }) {
  return (
    <div style={{ ...s.statCard, borderTop: `4px solid ${cor}` }}>
      <span style={{ ...s.statIcon, color: cor }}>{icon}</span>
      <div>
        <p style={s.statValor}>{valor}</p>
        <p style={s.statLabel}>{label}</p>
      </div>
    </div>
  );
}

const s = {
  page:       { padding: "2rem", background: "#F5F3FF", minHeight: "100vh" },
  header:     { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" },
  saudacao:   { margin: 0, fontSize: "0.95rem", color: "#6B7280" },
  titulo:     { margin: "0.25rem 0 0", fontSize: "1.8rem", fontWeight: 700, color: "#1F2937" },
  statsGrid:  { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", marginBottom: "2rem" },
  statCard:   { background: "#fff", borderRadius: "12px", padding: "1.25rem", display: "flex", alignItems: "center", gap: "1rem", boxShadow: "0 1px 4px rgba(0,0,0,0.07)" },
  statIcon:   { fontSize: "2rem" },
  statValor:  { margin: 0, fontSize: "1.5rem", fontWeight: 700, color: "#1F2937" },
  statLabel:  { margin: 0, fontSize: "0.8rem", color: "#6B7280" },
  secaoTitulo:{ fontSize: "1.1rem", fontWeight: 600, color: "#374151", marginBottom: "1rem" },
  acoesGrid:  { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" },
  card:       { background: "#fff", border: "none", borderRadius: "12px", padding: "1.5rem", display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "0.4rem", cursor: "pointer", boxShadow: "0 1px 4px rgba(0,0,0,0.07)", textAlign: "left" },
  cardIcon:   { fontSize: "1.8rem" },
  cardLabel:  { fontWeight: 600, fontSize: "1rem", color: "#1F2937" },
  cardDesc:   { fontSize: "0.8rem", color: "#6B7280" },
};
