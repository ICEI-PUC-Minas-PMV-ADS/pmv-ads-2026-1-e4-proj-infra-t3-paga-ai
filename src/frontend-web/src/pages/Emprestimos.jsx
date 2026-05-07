import React, { useEffect, useState } from "react";
import { loanService } from "../services/loanService";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (v) =>
  Number(v ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("pt-BR") : "—";

/** Calcula o status com base nos campos reais da API */
function calcularStatus(emprestimo) {
  if (emprestimo.Pago) return "Pago";
  const hoje = new Date();
  const venc = new Date(emprestimo.DataVencimento);
  const diffDias = Math.ceil((venc - hoje) / (1000 * 60 * 60 * 24));
  if (diffDias < 0)  return "Em atraso";
  if (diffDias <= 5) return "Vencendo";
  return "Em aberto";
}

const STATUS_STYLE = {
  "Em atraso": { bg: "#FEE2E2", color: "#DC2626" },
  "Em aberto": { bg: "#EDE9FE", color: "#7C3AED" },
  Pago:     { bg: "#D1FAE5", color: "#059669" },
  Vencendo:    { bg: "#FEF3C7", color: "#D97706" },
};

const TABS = [
  { label: "Ativos",    key: "ativos" },
  { label: "Vencendo",  key: "vencendo" },
  { label: "Atrasados", key: "atrasados" },
  { label: "Pagos",  key: "pagos" },
];

const TAB_STATUS = {
  ativos:    ["Em aberto"],
  vencendo:  ["Vencendo"],
  atrasados: ["Em atraso"],
  pagos:     ["Pago"],
};

const NAV_ITEMS = [
  { label: "Dashboard",     icon: "📊", href: "/dashboard" },
  { label: "Devedores",     icon: "👥", href: "/devedores" },
  { label: "Empréstimos",   icon: "💳", href: "/emprestimos", active: true },
  { label: "Relatórios",    icon: "📈", href: "/relatorios" },
  { label: "Configurações", icon: "⚙️", href: "/configuracoes" },
];

const labelStyle = { fontSize: 10, fontWeight: 600, color: "#9CA3AF", letterSpacing: 1, marginBottom: 2 };
const valueStyle = { fontSize: 15, fontWeight: 600, color: "#111827" };

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const s = STATUS_STYLE[status] || { bg: "#F3F4F6", color: "#374151" };
  return (
    <span style={{
      background: s.bg, color: s.color,
      padding: "3px 10px", borderRadius: 20,
      fontSize: 12, fontWeight: 600, whiteSpace: "nowrap",
    }}>
      {status}
    </span>
  );
}

function LoanCard({ emprestimo, onPay}) {
  const status = calcularStatus(emprestimo);
  const isQuitado = status === "Pago";
  const nomeExibicao = emprestimo.Cliente || emprestimo.Devedor || "Não informado";
  
  // 2. Valor: Tenta Valor (Carteira) ou ValorEmprestado (Relatório)
  const valorPrincipal = emprestimo.Valor || emprestimo.ValorEmprestado || 0;
  
  // 3. Juros: Se for a taxa (0.3), converte. Se for o valor em R$ (Lucro), mostra formatado.
  const taxaOuLucro = emprestimo.TaxaJuros 
    ? `${(emprestimo.TaxaJuros * 100).toFixed(0)}%` 
    : fmt(emprestimo.LucroDesteEmprestimo);

  // 4. Saldo: Tenta ValorFinal (Carteira) ou ValorComJuros (Relatório)
  const saldoFinal = emprestimo.ValorFinal || emprestimo.ValorComJuros || 0;

  // 5. ID: Tenta Id (C#) ou _id (Mongo)
  const idFormatado = String(emprestimo.Id || emprestimo._id || 0).padStart(3, "0");

  return (
    <div style={{
      background: "#fff", border: "1px solid #E5E7EB",
      borderRadius: 10, padding: "16px 20px", marginBottom: 12,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <span style={{ fontWeight: 700, fontSize: 15, color: "#111827" }}>
          {nomeExibicao} – #{idFormatado}
        </span>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {!isQuitado && (
            <button 
              onClick={() => onPay(emprestimo.Id)}
              style={{ padding: "5px 10px", cursor: "pointer", fontSize: 11, borderRadius: 5, border: "1px solid #7C3AED", background: "#fff", color: "#7C3AED" }}
            >
              Confirmar Recebimento
            </button>
          )}
          <StatusBadge status={status} />
        </div>
      </div>

      <div style={{ display: "flex", gap: 48, flexWrap: "wrap" }}>
        <div>
          <div style={labelStyle}>VALOR</div>
          <div style={valueStyle}>{fmt(valorPrincipal)}</div>
        </div>
          <div>
          <div style={labelStyle}>JUROS</div>
          <div style={valueStyle}>
            {/* Se TaxaJuros for 0.3, multiplica por 100 para exibir 30% */}
            {emprestimo.TaxaJuros 
            ? `${(emprestimo.TaxaJuros * 100).toFixed(0)}%` 
            : (emprestimo.LucroDesteEmprestimo ? fmt(emprestimo.LucroDesteEmprestimo) : "0%")}
        </div>
        </div>
        <div>
          <div style={labelStyle}>RECEBER</div>
          <div style={{ ...valueStyle, color: isQuitado ? "#059669" : "#DC2626" }}>
            {isQuitado ? fmt(0) : fmt(saldoFinal)}
          </div>
        </div>
        <div>
          <div style={labelStyle}>{isQuitado ? "PAGO EM" : "VENCIMENTO"}</div>
          <div style={valueStyle}>
            {isQuitado ? fmtDate(emprestimo.DataPagamento) : fmtDate(emprestimo.DataVencimento)}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────


const LoansPage = () => {
    const [nomeCobrador, setnomeCobrador] = useState(
    localStorage.getItem("nomeCobrador") || "Usuário Desconhecido"
  );
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ Cliente: "", Valor: 0, TaxaJuros: 30 });
  const [emprestimos, setEmprestimos] = useState([]); 
  const [resumo, setResumo]           = useState(null);
  const [loading, setLoading]         = useState(true);
  const [activeTab, setActiveTab]     = useState("ativos");

    const fetchData = async () => {
      if  (!nomeCobrador) return;
      try {
      const resLucro = await loanService.getRelatorioLucro(nomeCobrador);
      setEmprestimos(resLucro.data.ListaDetalhada || resLucro.data.listaDetalhada || []);
      setResumo(resLucro.data.ResumoGeral || resLucro.data.resumoGeral);
    } catch (err) {
      console.error("Erro:", err);
    } finally {
      setLoading(false);
    }
  };
    useEffect(() => { fetchData(); }, [nomeCobrador]);

  
  const handleSave = async () => {
  try {
    const payload = {
        Cliente: formData.Cliente,
        Valor: parseFloat(formData.Valor),
        TaxaJuros: parseFloat(formData.TaxaJuros),
        Cobrador: nomeCobrador,
        ClienteId: Math.floor(Math.random() * 1000) 
      };

      await loanService.solicitar(payload);
      
      setIsModalOpen(false);
      window.location.reload(); 
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar empréstimo!");
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!nomeCobrador) return;
      try {
        const [resCarteira, resLucro] = await Promise.all([
          loanService.getCarteira(nomeCobrador),
          loanService.getRelatorioLucro(nomeCobrador),
        ]);

        // getCarteira → só retorna Pago=false; getRelatorioLucro tem todos
        // Usamos a ListaDetalhada do relatório para ter os quitados também
        const listaRelatorio = resLucro.data.ListaDetalhada ?? resLucro.data.listaDetalhada ?? [];
        const listaCarteira  = Array.isArray(resCarteira.data) ? resCarteira.data : [resCarteira.data];

        // Merge: carteira tem os dados completos; complementa com os quitados do relatório
        const idsCarteira = new Set(listaCarteira.map((e) => e.Id));
        const quitados = listaRelatorio
          .filter((e) => e.Status === "Recebido" && !idsCarteira.has(e.Id))
          .map((e) => ({ ...e, Pago: true }));

        setEmprestimos([...listaCarteira, ...quitados]);
        setResumo(resLucro.data.ResumoGeral ?? resLucro.data.resumoGeral);
      } catch (err) {
        console.error("Erro ao carregar dados do cobrador:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [nomeCobrador]);
  const handlePay = async (id) => {
    if (window.confirm("Confirmar recebimento?")) {
      try {
        await loanService.marcarComoPago(id, nomeCobrador);
        fetchData();
      } catch (err) {
        alert("Erro ao processar.");
      }
    }
  };

  const comStatus = emprestimos.map((e) => ({ ...e, _status: calcularStatus(e) }));
  const filtered  = comStatus.filter((e) => TAB_STATUS[activeTab]?.includes(e._status));
  const counts    = Object.fromEntries(
    Object.entries(TAB_STATUS).map(([key, statuses]) => [
      key,
      comStatus.filter((e) => statuses.includes(e._status)).length,
    ])
  );

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "'Segoe UI', sans-serif", background: "#F9FAFB" }}>

      {/* ── Sidebar ── */}
      <aside style={{
        width: 220, background: "#fff", borderRight: "1px solid #E5E7EB",
        display: "flex", flexDirection: "column", padding: "24px 0", flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 20px", marginBottom: 32 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: "linear-gradient(135deg, #7C3AED, #6D28D9)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
          }}>💰</div>
          <span style={{ fontWeight: 700, fontSize: 16, color: "#111827" }}>Paga Aí</span>
        </div>

        <nav style={{ flex: 1 }}>
          {NAV_ITEMS.map((item) => (
            <a key={item.label} href={item.href} style={{ textDecoration: "none" }}>
              <div style={{
                display: "flex", alignItems: "center", gap: 10, padding: "10px 20px",
                background: item.active ? "#F5F3FF" : "transparent",
                borderLeft: item.active ? "3px solid #7C3AED" : "3px solid transparent",
                color: item.active ? "#7C3AED" : "#6B7280",
                fontWeight: item.active ? 600 : 400, fontSize: 14,
              }}>
                <span>{item.icon}</span><span>{item.label}</span>
              </div>
            </a>
          ))}
        </nav>

        <div style={{ padding: "0 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <div style={{
              width: 34, height: 34, borderRadius: "50%", background: "#7C3AED", color: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13,
            }}>
              {nomeCobrador[0]}
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{nomeCobrador}</div>
          </div>
          <button style={{
            width: "100%", padding: "8px 0", border: "1px solid #E5E7EB",
            borderRadius: 8, background: "#fff", cursor: "pointer", fontSize: 13, color: "#6B7280",
          }}>
            Sair
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main style={{ flex: 1, minWidth: 0, padding: "32px 48px", overflowY: "auto" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: "#111827", margin: 0 }}>Empréstimos</h1>
          <button style={{
            background: "#7C3AED", color: "#fff", border: "none",
            borderRadius: 8, padding: "10px 20px", fontWeight: 600, fontSize: 14, cursor: "pointer",
          }} onClick={() => setIsModalOpen(true)}
          >
            + Novo Empréstimo
          </button>
        </div>

        {/* Cards de resumo — vêm do /relatorio-lucro */}
        {resumo && (
          <div style={{ display: "flex", gap: 16, marginBottom: 28, flexWrap: "wrap" }}>
            {[
              { label: "INVESTIMENTO TOTAL", value: fmt(resumo.InvestimentoTotal      ?? resumo.investimentoTotal) },
              { label: "A RECEBER (TOTAL)",  value: fmt(resumo.RecebimentoTotalGeral  ?? resumo.recebimentoTotalGeral), color: "#7C3AED" },
              { label: "LUCRO PROJETADO",    value: fmt(resumo.LucroTotalProjetado    ?? resumo.lucroTotalProjetado), color: "#059669" },
            ].map(({ label, value, color }) => (
              <div key={label} style={{
                background: "#fff", border: "1px solid #E5E7EB",
                borderRadius: 10, padding: "16px 24px",
              }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: "#9CA3AF", letterSpacing: 1, marginBottom: 6 }}>{label}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: color ?? "#111827" }}>{value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "2px solid #E5E7EB", marginBottom: 24 }}>
          {TABS.map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
              background: "none", border: "none",
              borderBottom: activeTab === tab.key ? "2px solid #7C3AED" : "2px solid transparent",
              marginBottom: -2, padding: "10px 20px", cursor: "pointer", fontSize: 14,
              fontWeight: activeTab === tab.key ? 600 : 400,
              color: activeTab === tab.key ? "#7C3AED" : "#6B7280",
            }}>
              {tab.label} ({counts[tab.key] ?? 0})
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: "center", padding: 48, color: "#9CA3AF" }}>
            Carregando empréstimos...
          </div>
        )}

        {/* Cards filtrados pela aba */}
        {!loading && filtered.length === 0 && (
          <div style={{
            textAlign: "center", padding: 48, color: "#9CA3AF",
            background: "#fff", borderRadius: 10, border: "1px solid #E5E7EB",
          }}>
            Nenhum empréstimo nesta categoria.
          </div>
        )}
        {!loading && filtered.map((e) => <LoanCard key={e.Id} emprestimo={e} />)}

        {/* Tabela completa */}
        {!loading && comStatus.length > 0 && (
          <div style={{
            background: "#fff", border: "1px solid #E5E7EB",
            borderRadius: 10, overflow: "hidden", marginTop: 8,
          }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#F9FAFB" }}>
                  {["DEVEDOR","VALOR","JUROS","DATA","VENCIMENTO","VALOR FINAL","STATUS","AÇÕES"].map((h) => (
                    <th key={h} style={{
                      padding: "12px 16px", textAlign: "left",
                      fontSize: 11, fontWeight: 600, color: "#9CA3AF",
                      letterSpacing: 0.8, borderBottom: "1px solid #E5E7EB",
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comStatus.map((e, i) => (
                  <tr key={e.Id} style={{ borderBottom: i < comStatus.length - 1 ? "1px solid #F3F4F6" : "none" }}>
                    <td style={{ padding: "14px 16px", fontSize: 14, color: "#111827" }}>{e.Cliente}</td>
                    <td style={{ padding: "14px 16px", fontSize: 14, color: "#374151" }}>{fmt(e.Valor)}</td>
                    <td style={{ padding: "14px 16px", fontSize: 14, color: "#374151" }}>
                      {e.TaxaJuros <= 1 ? `${(e.TaxaJuros * 100).toFixed(0)}%` : `${e.TaxaJuros}%`}
                    </td>
                    <td style={{ padding: "14px 16px", fontSize: 14, color: "#374151" }}>{fmtDate(e.DataEmprestimo)}</td>
                    <td style={{ padding: "14px 16px", fontSize: 14, color: "#374151" }}>{fmtDate(e.DataVencimento)}</td>
                    <td style={{ padding: "14px 16px", fontSize: 14, color: "#374151" }}>{fmt(e.ValorFinal)}</td>
                    <td style={{ padding: "14px 16px" }}><StatusBadge status={e._status} /></td>
                    <td style={{ padding: "14px 16px" }}>
                      <button style={{
                        background: "none", border: "none",
                        color: "#7C3AED", fontWeight: 600, fontSize: 13, cursor: "pointer", padding: 0,
                      }}>Ver</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {isModalOpen && (
  <div style={{
    position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
    background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
  }}>
    <div style={{ background: "#fff", padding: 32, borderRadius: 12, width: 400 }}>
      <h2 style={{ marginTop: 0 }}>Novo Empréstimo</h2>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        
        <div>
          <label style={labelStyle}>NOME DO CLIENTE</label>
          <input type="text" required style={{ width: "100%", padding: 8 }} 
            onChange={e => setFormData({...formData, cliente: e.target.value})} />
        </div>

        <div>
          <label style={labelStyle}>VALOR (R$)</label>
          <input type="number" required style={{ width: "100%", padding: 8 }} 
            onChange={e => setFormData({...formData, valor: Number(e.target.value)})} />
        </div>

        <div>
          <label style={labelStyle}>TAXA DE JUROS (%)</label>
          <input type="number" defaultValue={30} style={{ width: "100%", padding: 8 }} 
            onChange={e => setFormData({...formData, taxaJuros: Number(e.target.value)})} />
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
          <button type="submit" style={{ flex: 1, background: "#7C3AED", color: "#fff", border: "none", padding: 10, borderRadius: 8, cursor: "pointer" }}>
            Salvar no Banco
          </button>
          <button type="button" onClick={() => setIsModalOpen(false)} style={{ flex: 1, background: "#E5E7EB", border: "none", padding: 10, borderRadius: 8, cursor: "pointer" }}>
            Cancelar
          </button>
        </div>
      </form>
    </div>
  </div>
)}
          </div>
        )}
      </main>
    </div>
  );
};

export default LoansPage;