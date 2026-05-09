// Seed de dados realistas — execute com: node seed.js
const USUARIOS_URL = "http://localhost:5133/api/Auth";
const CLIENTES_URL = "http://localhost:5156/api/Clientes";
const EMPREST_URL  = "http://localhost:5276/api/Emprestimos";

const EMAIL = "re@gmail.com";
const SENHA = "Senha123@";

const hoje = new Date();
const dias = (n) => new Date(hoje.getTime() + n * 86400000).toISOString();

// ── Empréstimos com todos os cenários ─────────────────────────────────────────
// Busca os clientes existentes (IDs 7-16) e distribui os cenários
const cenarios = [
  // EM ABERTO (vence em > 5 dias)
  { clienteIdx: 0,  valor: 1500,  taxa: 10, venc: dias(25),  pago: false }, // Ana Paula
  { clienteIdx: 1,  valor: 3000,  taxa: 15, venc: dias(20),  pago: false }, // Carlos
  { clienteIdx: 2,  valor: 800,   taxa: 20, venc: dias(15),  pago: false }, // Fernanda
  { clienteIdx: 3,  valor: 5000,  taxa: 8,  venc: dias(28),  pago: false }, // Roberto
  { clienteIdx: 4,  valor: 2500,  taxa: 12, venc: dias(18),  pago: false }, // Juliana
  // VENCENDO (vence em <= 5 dias)
  { clienteIdx: 5,  valor: 1200,  taxa: 18, venc: dias(3),   pago: false }, // Marcos
  { clienteIdx: 6,  valor: 600,   taxa: 25, venc: dias(1),   pago: false }, // Luciana
  { clienteIdx: 7,  valor: 4000,  taxa: 10, venc: dias(5),   pago: false }, // Paulo
  // ATRASADOS (vencimento passado)
  { clienteIdx: 8,  valor: 1800,  taxa: 15, venc: dias(-5),  pago: false }, // Camila
  { clienteIdx: 9,  valor: 2200,  taxa: 12, venc: dias(-10), pago: false }, // Diego
  { clienteIdx: 0,  valor: 900,   taxa: 20, venc: dias(-15), pago: false }, // Ana Paula 2
  { clienteIdx: 3,  valor: 1500,  taxa: 8,  venc: dias(-3),  pago: false }, // Roberto 2
  // PAGOS
  { clienteIdx: 1,  valor: 2000,  taxa: 15, venc: dias(-20), pago: true  }, // Carlos
  { clienteIdx: 4,  valor: 700,   taxa: 12, venc: dias(-30), pago: true  }, // Juliana
  { clienteIdx: 2,  valor: 1100,  taxa: 20, venc: dias(-45), pago: true  }, // Fernanda
  { clienteIdx: 7,  valor: 3500,  taxa: 10, venc: dias(-12), pago: true  }, // Paulo
];

async function login() {
  const res = await fetch(`${USUARIOS_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL, senha: SENHA }),
  });
  if (!res.ok) throw new Error(`Login falhou: HTTP ${res.status}`);
  const { token } = await res.json();
  console.log("✅ Login OK");
  return token;
}

async function getClientes(token) {
  const res = await fetch(CLIENTES_URL, { headers: { Authorization: `Bearer ${token}` } });
  return res.json();
}

async function criarEmprestimo(token, payload) {
  const res = await fetch(EMPREST_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  if (!res.ok) { console.warn(`⚠️  Erro ${res.status}`); return null; }
  return res.json();
}

async function marcarPago(token, id, cobrador) {
  await fetch(`${EMPREST_URL}/${id}/pagar/${encodeURIComponent(cobrador)}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
  });
}

async function main() {
  console.log("\n🌱 Seed — todos os cenários\n");

  const token = await login();
  const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64").toString());
  const cobrador = payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] ?? "Cobrador";
  console.log(`👤 Cobrador: ${cobrador}\n`);

  const clientes = await getClientes(token);
  const sorted   = clientes.sort((a, b) => a.id - b.id);
  console.log(`📋 ${clientes.length} clientes encontrados\n`);

  const contadores = { aberto: 0, vencendo: 0, atrasado: 0, pago: 0 };

  for (const c of cenarios) {
    const cliente = sorted[c.clienteIdx];
    if (!cliente) { console.warn(`⚠️  Cliente índice ${c.clienteIdx} não encontrado`); continue; }

    const e = await criarEmprestimo(token, {
      Cliente:        cliente.nome,
      ClienteId:      cliente.id,
      Cobrador:       cobrador,
      Valor:          c.valor,
      TaxaJuros:      c.taxa,
      DataVencimento: c.venc,
    });

    if (!e) continue;

    const diffDias = Math.ceil((new Date(c.venc) - new Date()) / 86400000);
    let status = "Em aberto";
    if (c.pago)          { await marcarPago(token, e.id, cobrador); status = "Pago"; contadores.pago++; }
    else if (diffDias < 0) { status = "Atrasado"; contadores.atrasado++; }
    else if (diffDias <= 5){ status = "Vencendo"; contadores.vencendo++; }
    else                   { contadores.aberto++; }

    const receber = (c.valor * (1 + c.taxa / 100)).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    console.log(`  [${status.padEnd(9)}] ${cliente.nome.padEnd(24)} R$${String(c.valor).padStart(5)} × ${c.taxa}%  → ${receber}`);
  }

  console.log(`
✅ Seed concluído!
  Em aberto : ${contadores.aberto}
  Vencendo  : ${contadores.vencendo}
  Atrasados : ${contadores.atrasado}
  Pagos     : ${contadores.pago}
`);
}

main().catch((e) => { console.error("❌", e.message); process.exit(1); });
