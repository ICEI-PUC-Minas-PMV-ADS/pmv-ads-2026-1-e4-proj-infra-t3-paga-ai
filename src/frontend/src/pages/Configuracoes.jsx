import { useState, useEffect } from "react";
import { getUsuarioLogado, obterPerfil, atualizarPerfil } from "../services/authService";

function maskTelefone(value) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 10)
    return digits.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{4})(\d)/, "$1-$2");
  return digits.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2");
}

function formatarCpf(cpf) {
  if (!cpf) return "—";
  const d = cpf.replace(/\D/g, "");
  return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

function formatarTelefone(tel) {
  if (!tel) return "—";
  const d = tel.replace(/\D/g, "");
  if (d.length === 11) return d.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  if (d.length === 10) return d.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  return tel;
}

export default function Configuracoes() {
  const usuario = getUsuarioLogado();
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
    diasAviso:  5,
    taxaPadrao: 30,
    moeda:      "BRL",
  });
  const [salvo, setSalvo] = useState(false);

  // dados completos do perfil
  const [perfil, setPerfil] = useState(null);
  const [carregandoPerfil, setCarregandoPerfil] = useState(true);

  // edição
  const [editandoPerfil, setEditandoPerfil] = useState(false);
  const [novoNome, setNovoNome] = useState("");
  const [novoTelefone, setNovoTelefone] = useState("");
  const [salvandoPerfil, setSalvandoPerfil] = useState(false);
  const [erroPerfil, setErroPerfil] = useState("");
  const [sucessoPerfil, setSucessoPerfil] = useState("");

  useEffect(() => {
    if (!usuario?.email) { setCarregandoPerfil(false); return; }
    obterPerfil(usuario.email)
      .then(setPerfil)
      .catch(() => {/* silencioso — exibe o que temos do JWT */})
      .finally(() => setCarregandoPerfil(false));
  }, []);

  function salvar() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ notif, sistema }));
    setSalvo(true);
    setTimeout(() => setSalvo(false), 2500);
  }

  function abrirEdicao() {
    setNovoNome(perfil?.nome ?? usuario?.nome ?? "");
    setNovoTelefone(perfil?.telefone ? formatarTelefone(perfil.telefone) : "");
    setErroPerfil("");
    setSucessoPerfil("");
    setEditandoPerfil(true);
  }

  async function salvarPerfil() {
    setErroPerfil("");
    setSucessoPerfil("");

    if (!novoNome.trim()) { setErroPerfil("Nome é obrigatório."); return; }
    if (novoTelefone && novoTelefone.replace(/\D/g, "").length < 10) {
      setErroPerfil("Telefone inválido. Informe DDD + número.");
      return;
    }

    try {
      setSalvandoPerfil(true);
      await atualizarPerfil(usuario.email, novoNome.trim(), novoTelefone || null);
      setPerfil(p => ({ ...p, nome: novoNome.trim(), ...(novoTelefone ? { telefone: novoTelefone.replace(/\D/g, "") } : {}) }));
      setSucessoPerfil("Perfil atualizado com sucesso!");
      setEditandoPerfil(false);
    } catch (e) {
      setErroPerfil(e.message || "Erro ao atualizar perfil.");
    } finally {
      setSalvandoPerfil(false);
    }
  }

  const nomeExibido  = perfil?.nome  ?? usuario?.nome  ?? "—";
  const emailExibido = perfil?.email ?? usuario?.email ?? "—";

  return (
    <div style={s.page}>
      <div style={s.header}>
        <h1 style={s.titulo}>Configurações</h1>
        <p style={s.sub}>Ajustes do sistema e preferências</p>
      </div>

      {/* Conta */}
      <section style={s.card}>
        <h2 style={s.cardTitulo}>👤 Conta</h2>

        {!editandoPerfil ? (
          <>
            <div style={s.perfilRow}>
              <div style={s.avatar}>
                {nomeExibido.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <p style={s.perfilNome}>{nomeExibido}</p>
                <p style={s.perfilEmail}>{emailExibido}</p>
              </div>
              <button style={s.btnEditar} onClick={abrirEdicao}>✏️ Editar</button>
            </div>

            {carregandoPerfil ? (
              <p style={s.carregando}>Carregando dados...</p>
            ) : (
              <div style={s.dadosGrid}>
                <DadoItem label="Data de Nascimento" valor={perfil?.dataNascimento ?? "—"} />
                <DadoItem label="CPF"      valor={formatarCpf(perfil?.cpf)} />
                <DadoItem label="Telefone" valor={formatarTelefone(perfil?.telefone)} />
                <DadoItem label="E-mail"   valor={emailExibido} />
              </div>
            )}

            {sucessoPerfil && <div style={s.sucesso}>{sucessoPerfil}</div>}
          </>
        ) : (
          <div>
            <div style={s.fieldRow}>
              <label style={s.label}>Nome</label>
              <input
                type="text"
                value={novoNome}
                onChange={e => setNovoNome(e.target.value)}
                placeholder="Seu nome completo"
                style={s.input}
                disabled={salvandoPerfil}
              />
            </div>
            <div style={s.fieldRow}>
              <label style={s.label}>Número de Telefone</label>
              <input
                type="text"
                value={novoTelefone}
                onChange={e => setNovoTelefone(maskTelefone(e.target.value))}
                placeholder="(00) 00000-0000"
                style={s.input}
                maxLength={15}
                disabled={salvandoPerfil}
              />
            </div>

            {erroPerfil  && <div style={s.erro}>{erroPerfil}</div>}

            <div style={s.botoesRow}>
              <button style={s.btnCancelar} onClick={() => setEditandoPerfil(false)} disabled={salvandoPerfil}>Cancelar</button>
              <button style={s.btnSalvarPerfil} onClick={salvarPerfil} disabled={salvandoPerfil}>
                {salvandoPerfil ? "Salvando..." : "Salvar alterações"}
              </button>
            </div>
          </div>
        )}
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
          <input type="number" min={1} max={30} value={sistema.diasAviso}
            onChange={e => setSistema(p => ({ ...p, diasAviso: e.target.value }))} style={s.input} />
        </div>
        <div style={s.fieldRow}>
          <label style={s.label}>Taxa de juros padrão (%/mês)</label>
          <input type="number" min={1} max={100} value={sistema.taxaPadrao}
            onChange={e => setSistema(p => ({ ...p, taxaPadrao: e.target.value }))} style={s.input} />
        </div>
      </section>

      <div style={s.rodape}>
        <button style={s.btnSalvar} onClick={salvar}>{salvo ? "✔ Salvo!" : "Salvar configurações"}</button>
      </div>
    </div>
  );
}

function DadoItem({ label, valor }) {
  return (
    <div style={{ marginBottom: "0.75rem" }}>
      <span style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#9CA3AF", marginBottom: 2 }}>{label}</span>
      <span style={{ fontSize: "0.95rem", color: "#1F2937", fontWeight: 500 }}>{valor}</span>
    </div>
  );
}

const s = {
  page:           { padding: "2rem", background: "#F5F3FF", minHeight: "100vh" },
  header:         { marginBottom: "1.5rem" },
  titulo:         { margin: 0, fontSize: "1.8rem", fontWeight: 700, color: "#1F2937" },
  sub:            { margin: "0.25rem 0 0", color: "#6B7280", fontSize: "0.9rem" },
  card:           { background: "#fff", borderRadius: 12, padding: "1.5rem", marginBottom: "1rem", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" },
  cardTitulo:     { margin: "0 0 1.25rem", fontSize: "1rem", fontWeight: 700, color: "#1F2937" },
  perfilRow:      { display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.25rem" },
  avatar:         { width: 52, height: 52, borderRadius: "50%", background: "linear-gradient(143deg,#7C3AED,#6D28D9)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: "1.1rem", flexShrink: 0 },
  perfilNome:     { margin: 0, fontWeight: 700, fontSize: "1rem", color: "#1F2937" },
  perfilEmail:    { margin: "2px 0 0", fontSize: "0.85rem", color: "#6B7280" },
  btnEditar:      { background: "transparent", border: "1px solid #7C3AED", color: "#7C3AED", borderRadius: 8, padding: "0.4rem 1rem", cursor: "pointer", fontWeight: 600, fontSize: "0.85rem", flexShrink: 0 },
  dadosGrid:      { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem 1.5rem", marginTop: "0.5rem" },
  carregando:     { color: "#9CA3AF", fontSize: "0.85rem", margin: "0.5rem 0" },
  toggleRow:      { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.6rem 0", borderBottom: "1px solid #F3F4F6" },
  toggleLabel:    { fontSize: "0.9rem", color: "#374151" },
  toggle:         { width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer", position: "relative", transition: "background 0.2s", flexShrink: 0 },
  toggleDot:      { position: "absolute", top: 3, width: 18, height: 18, background: "#fff", borderRadius: "50%", transition: "transform 0.2s" },
  fieldRow:       { marginBottom: "1rem" },
  label:          { display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#374151", marginBottom: 6 },
  input:          { width: "100%", padding: "0.5rem 0.75rem", borderRadius: 8, border: "1px solid #D1D5DB", fontSize: "0.95rem", boxSizing: "border-box" },
  erro:           { borderRadius: 8, padding: "0.6rem 0.75rem", backgroundColor: "#fee2e2", color: "#991b1b", fontSize: "0.85rem", marginBottom: "0.75rem" },
  sucesso:        { borderRadius: 8, padding: "0.6rem 0.75rem", backgroundColor: "#dcfce7", color: "#166534", fontSize: "0.85rem", marginTop: "0.75rem" },
  botoesRow:      { display: "flex", gap: "0.75rem", justifyContent: "flex-end" },
  btnCancelar:    { background: "transparent", border: "1px solid #D1D5DB", color: "#6B7280", borderRadius: 8, padding: "0.5rem 1.25rem", cursor: "pointer", fontWeight: 600, fontSize: "0.9rem" },
  btnSalvarPerfil:{ background: "#7C3AED", color: "#fff", border: "none", borderRadius: 8, padding: "0.5rem 1.25rem", cursor: "pointer", fontWeight: 600, fontSize: "0.9rem" },
  rodape:         { display: "flex", justifyContent: "flex-end" },
  btnSalvar:      { background: "#7C3AED", color: "#fff", border: "none", borderRadius: 8, padding: "0.65rem 1.5rem", cursor: "pointer", fontWeight: 600, fontSize: "0.95rem" },
};
