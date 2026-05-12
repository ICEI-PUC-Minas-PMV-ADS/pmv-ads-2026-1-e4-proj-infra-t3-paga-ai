import { useEffect, useState } from "react";
import { getUsuarioLogado, getToken } from "../services/authService";
import { getClientes } from "../services/ClientesService";
import {
  getCarteira, getRelatorioLucro, criarEmprestimo,
  marcarComoPago, deletarEmprestimo,
} from "../services/EmprestimosService";

const fmt = (v) =>
  Number(v ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const fmtDate = (d) => d ? new Date(d).toLocaleDateString("pt-BR") : "—";

function calcularStatus(e) {
  if (e.pago) return "Pago";
  const diff = Math.ceil((new Date(e.dataVencimento) - new Date()) / 86400000);
  if (diff < 0)  return "Em atraso";
  if (diff <= 5) return "Vencendo";
  return "Em aberto";
}

const STATUS_STYLE = {
  "Em atraso": { bg: "#FEE2E2", color: "#DC2626" },
  "Em aberto": { bg: "#EDE9FE", color: "#7C3AED" },
  "Pago":      { bg: "#D1FAE5", color: "#059669" },
  "Vencendo":  { bg: "#FEF3C7", color: "#D97706" },
};

const TABS = [
  { label: "Ativos",    key: "ativos",    statuses: ["Em aberto"] },
  { label: "Vencendo",  key: "vencendo",  statuses: ["Vencendo"]  },
  { label: "Atrasados", key: "atrasados", statuses: ["Em atraso"] },
  { label: "Pagos",     key: "pagos",     statuses: ["Pago"]      },
];

const formVazio = { Cliente: "", Valor: "", TaxaJuros: "30", ClienteId: "", NumeroParcelas: "1", DataVencimento: "" };

export default function Emprestimos() {
  const usuario     = getUsuarioLogado();
  const cobrador    = usuario?.nome ?? "Usuário";

  const [emprestimos, setEmprestimos] = useState([]);
  const [resumo,      setResumo]      = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [erro,        setErro]        = useState("");
  const [activeTab,   setActiveTab]   = useState("ativos");
  const [modal,       setModal]       = useState(false);
  const [form,        setForm]        = useState(formVazio);
  const [salvando,    setSalvando]    = useState(false);
  const [clientes,    setClientes]    = useState([]);

  async function carregar() {
    setLoading(true);
    setErro("");
    try {
      const [carteira, lucro] = await Promise.all([
        getCarteira(cobrador),
        getRelatorioLucro(cobrador),
      ]);
      const listaRelatorio = lucro.listaDetalhada ?? [];
      const listaCarteira  = Array.isArray(carteira) ? carteira : [];
      const idsCarteira    = new Set(listaCarteira.map((e) => e.id));
      const quitados = listaRelatorio
        .filter((e) => e.status === "Recebido" && !idsCarteira.has(e.id))
        .map((e) => ({ ...e, pago: true }));
      setEmprestimos([...listaCarteira, ...quitados]);
      setResumo(lucro.resumoGeral);
    } catch (e) {
      setErro(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { carregar(); }, [cobrador]);

  async function abrirModal() {
    setModal(true);
    try {
      const lista = await getClientes(getToken());
      setClientes(lista);
    } catch { setClientes([]); }
  }

  function handleSelecionarCliente(e) {
    const cliente = clientes.find((c) => String(c.id) === e.target.value);
    if (cliente) {
      setForm((f) => ({ ...f, Cliente: cliente.nome, ClienteId: String(cliente.id) }));
    }
  }

  async function handleSalvar() {
    if (!form.Cliente || !form.ClienteId || !form.Valor) {
      alert("Selecione um cliente e informe o valor.");
      return;
    }
    setSalvando(true);
    try {
      await criarEmprestimo({
  Cliente:        form.Cliente,
  Valor:          parseFloat(form.Valor),
  TaxaJuros:      parseFloat(form.TaxaJuros) / 100,
  Cobrador:       cobrador,
  ClienteId:      parseInt(form.ClienteId) || Math.floor(Math.random() * 9000) + 1000,
  NumeroParcelas: parseInt(form.NumeroParcelas) || 1,
  DataVencimento: form.DataVencimento ? new Date(form.DataVencimento).toISOString() : "",
});
      setModal(false);
      setForm(formVazio);
      carregar();
    } catch (e) {
      alert(e.message);
    } finally {
      setSalvando(false);
    }
  }

  async function handlePagar(id) {
    if (!confirm("Confirmar recebimento deste empréstimo?")) return;
    try {
      await marcarComoPago(id, cobrador);
      carregar();
    } catch (e) { alert(e.message); }
  }

  async function handleDeletar(id) {
    if (!confirm("Excluir este empréstimo?")) return;
    try {
      await deletarEmprestimo(id, cobrador);
      carregar();
    } catch (e) { alert(e.message); }
  }

  const comStatus = emprestimos.map((e) => ({ ...e, _status: calcularStatus(e) }));
  const tabAtual  = TABS.find((t) => t.key === activeTab);
  const filtrados = comStatus.filter((e) => tabAtual?.statuses.includes(e._status));

  return (
    <div style={s.page}>
      {/* Cabeçalho */}
      <div style={s.header}>
        <div>
          <h1 style={s.titulo}>Empréstimos</h1>
          <p style={s.sub}>Cobrador: <strong>{cobrador}</strong></p>
        </div>
        <button style={s.btnNovo} onClick={abrirModal}>+ Novo Empréstimo</button>
      </div>

      {/* Resumo */}
      {resumo && (
        <div style={s.resumoGrid}>
          <CardResumo label="Investido"  valor={fmt(resumo.investimentoTotal)}       cor="#7C3AED" />
          <CardResumo label="A Receber"  valor={fmt(resumo.recebimentoTotalGeral)}   cor="#2563EB" />
          <CardResumo label="Lucro"      valor={fmt(resumo.lucroTotalProjetado)}     cor="#16A34A" />
        </div>
      )}

      {/* Tabs */}
      <div style={s.tabs}>
        {TABS.map((t) => {
          const count = comStatus.filter((e) => t.statuses.includes(e._status)).length;
          return (
            <button key={t.key}
              style={{ ...s.tab, ...(activeTab === t.key ? s.tabAtivo : {}) }}
              onClick={() => setActiveTab(t.key)}
            >
              {t.label} {count > 0 && <span style={s.badge}>{count}</span>}
            </button>
          );
        })}
      </div>

      {/* Lista */}
      {loading && <p style={s.info}>Carregando...</p>}
      {erro    && <p style={s.erro}>{erro}</p>}
      {!loading && !erro && filtrados.length === 0 && (
        <p style={s.info}>Nenhum empréstimo nesta categoria.</p>
      )}
      {filtrados.map((e) => (
        <CartaoEmprestimo key={e.Id ?? e._id} e={e} onPagar={handlePagar} onDeletar={handleDeletar} />
      ))}

      {/* Modal */}
      {modal && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <h2 style={s.modalTitulo}>Novo Empréstimo</h2>

            <div style={{ marginBottom: "1rem" }}>
              <label style={s.label}>Cliente</label>
              <select
                style={s.input}
                value={form.ClienteId}
                onChange={handleSelecionarCliente}
              >
                <option value="">Selecione um cliente...</option>
                {clientes.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {c.nome} {c.cpf ? `— ${c.cpf}` : ""}
                  </option>
                ))}
              </select>
            </div>

            {[
  { label: "Valor (R$)", key: "Valor",          type: "number", placeholder: "Ex: 500" },
  { label: "Juros (%)",  key: "TaxaJuros",       type: "number", placeholder: "Ex: 30"  },
  { label: "Parcelas",   key: "NumeroParcelas",  type: "number", placeholder: "Ex: 1"   },
].map(({ label, key, type, placeholder }) => (
  <div key={key} style={{ marginBottom: "1rem" }}>
    <label style={s.label}>{label}</label>
    <input
      type={type}
      value={form[key]}
      placeholder={placeholder}
      onChange={(ev) => setForm((f) => ({ ...f, [key]: ev.target.value }))}
      style={s.input}
    />
  </div>
))}

<div style={{ marginBottom: "1rem" }}>
  <label style={s.label}>Data de Vencimento</label>
  <input
    type="date"
    value={form.DataVencimento}
    onChange={(ev) => setForm((f) => ({ ...f, DataVencimento: ev.target.value }))}
    style={s.input}
  />
</div>
            <div style={s.modalBtns}>
              <button style={s.btnCancelar} onClick={() => { setModal(false); setForm(formVazio); }}>
                Cancelar
              </button>
              <button style={s.btnSalvar} onClick={handleSalvar} disabled={salvando}>
                {salvando ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CartaoEmprestimo({ e, onPagar, onDeletar }) {
  const status  = e._status ?? calcularStatus(e);
  const estilo  = STATUS_STYLE[status] ?? { bg: "#F3F4F6", color: "#374151" };
  const pago    = status === "Pago";
  const valor   = e.valor   ?? e.valorEmprestado ?? 0;
  const receber = e.valorFinal ?? e.valorComJuros ?? 0;
  const id      = String(e.id ?? 0).padStart(3, "0");

  return (
    <div style={s.card}>
      <div style={s.cardTop}>
        <span style={s.cardNome}>{e.cliente ?? e.devedor ?? "—"} <span style={s.cardId}>#{id}</span></span>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {!pago && (
            <button style={s.btnPagar} onClick={() => onPagar(e.id)}>✔ Recebido</button>
          )}
          <button style={s.btnDeletar} onClick={() => onDeletar(e.id)}>✕</button>
          <span style={{ ...s.statusBadge, background: estilo.bg, color: estilo.color }}>{status}</span>
        </div>
      </div>
      <div style={s.cardInfos}>
        <Info label="VALOR"      valor={fmt(valor)} />
        <Info label="JUROS"      valor={e.taxaJuros ? `${(e.taxaJuros * 100).toFixed(1)}%` : "—"} />
        {e.numeroParcelas > 1 && (
        <Info label="PARCELAS" valor={`${e.numeroParcelas}x de ${fmt(e.valorParcela)}`} />
)}
        <Info label="A RECEBER"  valor={pago ? "—" : fmt(receber)} destaque={!pago} />
        <Info label={pago ? "PAGO EM" : "VENCIMENTO"}
              valor={pago ? fmtDate(e.dataPagamento) : fmtDate(e.dataVencimento)} />
      </div>
    </div>
  );
}

function Info({ label, valor, destaque }) {
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 600, color: "#9CA3AF", letterSpacing: 1 }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 600, color: destaque ? "#DC2626" : "#111827" }}>{valor}</div>
    </div>
  );
}

function CardResumo({ label, valor, cor }) {
  return (
    <div style={{ ...s.resumoCard, borderTop: `4px solid ${cor}` }}>
      <p style={{ margin: 0, fontSize: "0.8rem", color: "#6B7280" }}>{label}</p>
      <p style={{ margin: 0, fontSize: "1.3rem", fontWeight: 700, color: "#1F2937" }}>{valor}</p>
    </div>
  );
}

const s = {
  page:       { padding: "2rem", background: "#F5F3FF", minHeight: "100vh" },
  header:     { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" },
  titulo:     { margin: 0, fontSize: "1.8rem", fontWeight: 700, color: "#1F2937" },
  sub:        { margin: "0.25rem 0 0", color: "#6B7280", fontSize: "0.9rem" },
  btnNovo:    { background: "#7C3AED", color: "#fff", border: "none", borderRadius: 8, padding: "0.6rem 1.2rem", cursor: "pointer", fontWeight: 600 },
  resumoGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem", marginBottom: "1.5rem" },
  resumoCard: { background: "#fff", borderRadius: 10, padding: "1rem 1.25rem", boxShadow: "0 1px 4px rgba(0,0,0,0.07)" },
  tabs:       { display: "flex", gap: 8, marginBottom: "1rem", flexWrap: "wrap" },
  tab:        { background: "#fff", border: "1px solid #E5E7EB", borderRadius: 8, padding: "0.4rem 1rem", cursor: "pointer", fontSize: "0.9rem", color: "#6B7280" },
  tabAtivo:   { background: "#7C3AED", color: "#fff", border: "1px solid #7C3AED" },
  badge:      { background: "#EDE9FE", color: "#7C3AED", borderRadius: 10, padding: "1px 7px", fontSize: 11, marginLeft: 4 },
  info:       { color: "#6B7280", textAlign: "center", marginTop: "2rem" },
  erro:       { color: "#DC2626", background: "#FEE2E2", padding: "0.75rem 1rem", borderRadius: 8 },
  card:       { background: "#fff", border: "1px solid #E5E7EB", borderRadius: 10, padding: "1rem 1.25rem", marginBottom: 12 },
  cardTop:    { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  cardNome:   { fontWeight: 700, fontSize: 15, color: "#111827" },
  cardId:     { fontWeight: 400, color: "#9CA3AF", fontSize: 13 },
  cardInfos:  { display: "flex", gap: 40, flexWrap: "wrap" },
  statusBadge:{ padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600 },
  btnPagar:   { padding: "4px 10px", cursor: "pointer", fontSize: 11, borderRadius: 5, border: "1px solid #7C3AED", background: "#fff", color: "#7C3AED" },
  btnDeletar: { padding: "4px 8px", cursor: "pointer", fontSize: 12, borderRadius: 5, border: "1px solid #E5E7EB", background: "#fff", color: "#9CA3AF" },
  overlay:    { position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 },
  modal:      { background: "#fff", borderRadius: 12, padding: "2rem", width: "100%", maxWidth: 420 },
  modalTitulo:{ margin: "0 0 1.5rem", fontSize: "1.2rem", fontWeight: 700, color: "#1F2937" },
  modalBtns:  { display: "flex", justifyContent: "flex-end", gap: 8, marginTop: "1rem" },
  label:      { display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#374151", marginBottom: 4 },
  input:      { width: "100%", padding: "0.5rem 0.75rem", borderRadius: 6, border: "1px solid #D1D5DB", fontSize: "0.95rem", boxSizing: "border-box" },
  btnCancelar:{ padding: "0.5rem 1.2rem", borderRadius: 8, border: "1px solid #D1D5DB", background: "#fff", cursor: "pointer" },
  btnSalvar:  { padding: "0.5rem 1.2rem", borderRadius: 8, border: "none", background: "#7C3AED", color: "#fff", cursor: "pointer", fontWeight: 600 },
};
