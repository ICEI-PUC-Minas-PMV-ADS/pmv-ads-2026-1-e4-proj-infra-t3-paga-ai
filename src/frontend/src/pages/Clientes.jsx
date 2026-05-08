import { useState, useEffect } from "react";
import { getClientes, createCliente, updateCliente, deleteCliente } from "../services/clientesService";
import { getToken } from "../services/authService";
 
const clienteVazio = {
  nome:      "",
  cpf:       "",
  telefone:  "",
  endereco:  "",
  email:     "",
  descricao: "",
};

// ─────────────────────────────────────────────────────────────────────────────
// MODAL DE CADASTRO / EDIÇÃO
// ─────────────────────────────────────────────────────────────────────────────
function Modal({ titulo, form, onChange, onSalvar, onCancelar, carregando }) {
  const campos = [
    { label: "Nome completo", key: "nome",      type: "text",  placeholder: "Ex: João Silva"              },
    { label: "CPF",           key: "cpf",       type: "text",  placeholder: "000.000.000-00"               },
    { label: "Telefone",      key: "telefone",  type: "text",  placeholder: "(00) 00000-0000"              },
    { label: "E-mail",        key: "email",     type: "email", placeholder: "email@exemplo.com"            },
    { label: "Endereço",      key: "endereco",  type: "text",  placeholder: "Rua, número, cidade..."       },
    { label: "Descrição",     key: "descricao", type: "text",  placeholder: "Observações sobre o cliente"  },
  ];

  return (
    <div style={s.modalOverlay}>
      <div style={s.modalBox}>
        <h2 style={s.modalTitulo}>{titulo}</h2>
        <div style={s.formGrid}>
          {campos.map(({ label, key, type, placeholder }) => (
            <div key={key} style={s.formGroup}>
              <label style={s.label}>{label}</label>
              <input
                style={s.input}
                type={type}
                placeholder={placeholder}
                value={form[key]}
                onChange={(e) => onChange(key, e.target.value)}
              />
            </div>
          ))}
        </div>
        <div style={s.modalFooter}>
          <button style={s.btnSecundario} onClick={onCancelar} disabled={carregando}>Cancelar</button>
          <button style={s.btnPrimary}    onClick={onSalvar}   disabled={carregando}>
            {carregando ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MODAL DE VISUALIZAÇÃO
// ─────────────────────────────────────────────────────────────────────────────
function ModalVer({ cliente, onFechar }) {
  const campos = [
    { label: "ID",        valor: cliente.id        },
    { label: "Nome",      valor: cliente.nome      },
    { label: "CPF",       valor: cliente.cpf       },
    { label: "Telefone",  valor: cliente.telefone  },
    { label: "E-mail",    valor: cliente.email     },
    { label: "Endereço",  valor: cliente.endereco  },
    { label: "Descrição", valor: cliente.descricao },
  ];
  return (
    <div style={s.modalOverlay}>
      <div style={s.modalBox}>
        <h2 style={s.modalTitulo}>Detalhes do Cliente</h2>
        <div style={s.verGrid}>
          {campos.map(({ label, valor }) => valor ? (
            <div key={label} style={s.verItem}>
              <span style={s.verLabel}>{label}</span>
              <span style={s.verValor}>{valor}</span>
            </div>
          ) : null)}
        </div>
        <div style={s.modalFooter}>
          <button style={s.btnPrimary} onClick={onFechar}>Fechar</button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────
export default function Clientes() {
  const [clientes, setClientes]     = useState([]);
  const [busca, setBusca]           = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro]             = useState(null);

  const [modalCadastro, setModalCadastro] = useState(false);
  const [modalEditar, setModalEditar]     = useState(null);
  const [modalVer, setModalVer]           = useState(null);
  const [form, setForm]                   = useState(clienteVazio);

  // ── GET /api/clientes — carrega ao montar ───────────────────────────────────
  useEffect(() => { carregarClientes(); }, []);

  async function carregarClientes() {
    setCarregando(true);
    setErro(null);
    try {
      const token = getToken();
      const dados = await getClientes(token);
      setClientes(dados);
    } catch (e) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  }

  const atualizarForm = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const clientesFiltrados = clientes.filter((c) =>
    c.nome?.toLowerCase().includes(busca.toLowerCase()) ||
    c.cpf?.includes(busca) ||
    c.telefone?.includes(busca)
  );

  // ── POST /api/clientes ──────────────────────────────────────────────────────
  async function handleCadastrar() {
    setCarregando(true);
    try {
      const token = getToken();
      await createCliente(form, token);
      await carregarClientes();
      setModalCadastro(false);
      setForm(clienteVazio);
    } catch (e) {
      alert("Erro ao cadastrar: " + e.message);
    } finally {
      setCarregando(false);
    }
  }

  // ── PUT /api/clientes/:id ───────────────────────────────────────────────────
  async function handleSalvarEdicao() {
    setCarregando(true);
    try {
      const token = getToken();
      await updateCliente(modalEditar.id, form, token);
      await carregarClientes();
      setModalEditar(null);
      setForm(clienteVazio);
    } catch (e) {
      alert("Erro ao editar: " + e.message);
    } finally {
      setCarregando(false);
    }
  }

  // ── DELETE /api/clientes/:id ────────────────────────────────────────────────
  async function handleExcluir(id) {
    if (!window.confirm("Tem certeza que deseja excluir este cliente?")) return;
    setCarregando(true);
    try {
      const token = getToken();
      await deleteCliente(id, token);
      await carregarClientes();
    } catch (e) {
      alert("Erro ao excluir: " + e.message);
    } finally {
      setCarregando(false);
    }
  }

  function abrirEdicao(cliente) {
    setForm({
      nome:      cliente.nome      ?? "",
      cpf:       cliente.cpf       ?? "",
      telefone:  cliente.telefone  ?? "",
      email:     cliente.email     ?? "",
      endereco:  cliente.endereco  ?? "",
      descricao: cliente.descricao ?? "",
    });
    setModalEditar(cliente);
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <main style={s.main}>

      {/* Cabeçalho */}
      <div style={s.pageHeader}>
        <div>
          <h1 style={s.pageTitle}>Clientes</h1>
          <p style={s.pageSubtitle}>{clientes.length} clientes cadastrados</p>
        </div>
        <button style={s.btnPrimary} onClick={() => { setForm(clienteVazio); setModalCadastro(true); }}>
          + Novo Cliente
        </button>
      </div>

      {/* Busca */}
      <div style={s.filters}>
        <input
          style={s.searchInput}
          type="text"
          placeholder="Buscar por nome, CPF ou telefone..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>

      {/* Feedback de carregamento / erro */}
      {carregando && !modalCadastro && !modalEditar && (
        <p style={s.info}>Carregando clientes...</p>
      )}
      {erro && (
        <div style={s.erroBox}>
          ⚠️ {erro}
          <button style={s.btnTentar} onClick={carregarClientes}>Tentar novamente</button>
        </div>
      )}

      {/* Tabela */}
      {!carregando && !erro && (
        <div style={s.tableWrapper}>
          <table style={s.table}>
            <thead>
              <tr style={s.theadRow}>
                {["ID", "Nome / CPF", "Telefone", "E-mail", "Endereço", "Ações"].map((col) => (
                  <th key={col} style={s.th}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {clientesFiltrados.length === 0 ? (
                <tr><td colSpan={6} style={s.emptyRow}>Nenhum cliente encontrado.</td></tr>
              ) : (
                clientesFiltrados.map((c) => (
                  <tr key={c.id} style={s.tbodyRow}>
                    <td style={{ ...s.td, color: "rgba(107,114,128,1)", fontSize: "12px" }}>#{c.id}</td>
                    <td style={s.td}>
                      <span style={s.nomeTexto}>{c.nome}</span>
                      <span style={s.cpfTexto}>CPF: {c.cpf}</span>
                    </td>
                    <td style={s.td}>{c.telefone}</td>
                    <td style={s.td}>{c.email}</td>
                    <td style={s.td}>{c.endereco}</td>
                    <td style={s.td}>
                      <div style={s.acoes}>
                        <button style={s.btnAcao}                                    onClick={() => setModalVer(c)}>Ver</button>
                        <button style={s.btnAcao}                                    onClick={() => abrirEdicao(c)}>Editar</button>
                        <button style={{ ...s.btnAcao, color: "rgba(153,27,27,1)" }} onClick={() => handleExcluir(c.id)}>Excluir</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {modalCadastro && <Modal titulo="Cadastrar Cliente"  form={form} onChange={atualizarForm} onSalvar={handleCadastrar}    onCancelar={() => setModalCadastro(false)} carregando={carregando} />}
      {modalEditar   && <Modal titulo="Editar Cliente"     form={form} onChange={atualizarForm} onSalvar={handleSalvarEdicao} onCancelar={() => setModalEditar(null)}    carregando={carregando} />}
      {modalVer      && <ModalVer cliente={modalVer} onFechar={() => setModalVer(null)} />}
    </main>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ESTILOS
// ─────────────────────────────────────────────────────────────────────────────
const s = {
  main:         { flex: 1, padding: "48px", backgroundColor: "#f9fafb", minHeight: "100vh", overflowY: "auto" },
  pageHeader:   { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "32px" },
  pageTitle:    { fontFamily: "Poppins, sans-serif", fontSize: "28px", fontWeight: 700, color: "rgba(31,41,55,1)", margin: "0 0 4px" },
  pageSubtitle: { fontFamily: "Inter, sans-serif", fontSize: "14px", color: "rgba(107,114,128,1)", margin: 0 },
  btnPrimary:   { backgroundColor: "rgba(124,58,237,1)", color: "#fff", border: "none", borderRadius: "8px", padding: "10px 20px", fontFamily: "Inter, sans-serif", fontSize: "14px", fontWeight: 700, cursor: "pointer" },
  btnSecundario:{ backgroundColor: "#fff", color: "rgba(107,114,128,1)", border: "1px solid rgba(229,231,235,1)", borderRadius: "8px", padding: "10px 20px", fontFamily: "Inter, sans-serif", fontSize: "14px", cursor: "pointer" },
  filters:      { marginBottom: "24px" },
  searchInput:  { width: "100%", height: "45px", padding: "0 16px", borderRadius: "8px", border: "1px solid rgba(229,231,235,1)", fontFamily: "Inter, sans-serif", fontSize: "14px", backgroundColor: "#fff", outline: "none", boxSizing: "border-box" },
  tableWrapper: { backgroundColor: "#fff", borderRadius: "8px", border: "1px solid rgba(229,231,235,1)", overflow: "hidden" },
  table:        { width: "100%", borderCollapse: "collapse" },
  theadRow:     { backgroundColor: "rgba(249,250,251,1)", borderBottom: "2px solid rgba(229,231,235,1)" },
  th:           { fontFamily: "Inter, sans-serif", fontSize: "12px", fontWeight: 700, color: "rgba(107,114,128,1)", textAlign: "left", padding: "14px 16px" },
  tbodyRow:     { borderBottom: "1px solid rgba(243,244,246,1)" },
  td:           { fontFamily: "Inter, sans-serif", fontSize: "14px", color: "rgba(31,41,55,1)", padding: "14px 16px", verticalAlign: "middle" },
  nomeTexto:    { display: "block", fontWeight: 700, marginBottom: "2px" },
  cpfTexto:     { display: "block", fontSize: "12px", color: "rgba(107,114,128,1)", fontWeight: 400 },
  acoes:        { display: "flex", gap: "8px" },
  btnAcao:      { padding: "5px 12px", borderRadius: "4px", border: "1px solid rgba(229,231,235,1)", backgroundColor: "#fff", fontFamily: "Inter, sans-serif", fontSize: "12px", color: "rgba(107,114,128,1)", cursor: "pointer" },
  emptyRow:     { textAlign: "center", padding: "32px", fontFamily: "Inter, sans-serif", fontSize: "14px", color: "rgba(107,114,128,1)" },
  info:         { fontFamily: "Inter, sans-serif", fontSize: "14px", color: "rgba(107,114,128,1)" },
  erroBox:      { display: "flex", alignItems: "center", gap: "16px", padding: "16px", borderRadius: "8px", backgroundColor: "rgba(254,226,226,1)", color: "rgba(153,27,27,1)", fontFamily: "Inter, sans-serif", fontSize: "14px", marginBottom: "24px" },
  btnTentar:    { padding: "6px 12px", borderRadius: "6px", border: "1px solid rgba(153,27,27,0.3)", backgroundColor: "#fff", color: "rgba(153,27,27,1)", cursor: "pointer", fontFamily: "Inter, sans-serif", fontSize: "12px" },
  modalOverlay: { position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 },
  modalBox:     { backgroundColor: "#fff", borderRadius: "12px", padding: "32px", width: "520px", maxWidth: "90vw", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" },
  modalTitulo:  { fontFamily: "Poppins, sans-serif", fontSize: "20px", fontWeight: 700, color: "rgba(31,41,55,1)", margin: "0 0 24px" },
  formGrid:     { display: "flex", flexDirection: "column", gap: "16px" },
  formGroup:    { display: "flex", flexDirection: "column", gap: "6px" },
  label:        { fontFamily: "Inter, sans-serif", fontSize: "13px", fontWeight: 600, color: "rgba(55,65,81,1)" },
  input:        { height: "42px", padding: "0 12px", borderRadius: "8px", border: "1px solid rgba(229,231,235,1)", fontFamily: "Inter, sans-serif", fontSize: "14px", outline: "none" },
  modalFooter:  { display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "28px" },
  verGrid:      { display: "flex", flexDirection: "column", gap: "16px" },
  verItem:      { display: "flex", flexDirection: "column", gap: "4px" },
  verLabel:     { fontFamily: "Inter, sans-serif", fontSize: "12px", fontWeight: 600, color: "rgba(107,114,128,1)", textTransform: "uppercase", letterSpacing: "0.05em" },
  verValor:     { fontFamily: "Inter, sans-serif", fontSize: "15px", color: "rgba(31,41,55,1)", fontWeight: 500 },
};
