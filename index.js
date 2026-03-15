const express = require('express');
const app = express();
const PORT = 3000;

// Middleware para interpretar o JSON enviado pelo GitHub
app.use(express.json());

// Rota de teste para ver no navegador
app.get('/', (req, res) => {
  res.send('O servidor do Webhook está online! 🚀');
});

// A rota que receberá as notificações do GitHub
app.post('/webhook', (req, res) => {
  const evento = req.headers['x-github-event'];
  const payload = req.body;

  console.log(`\n--- Novo Evento: ${evento} ---`);

  if (evento === 'push') {
    const repo = payload.repository.full_name;
    const branch = payload.ref.replace('refs/heads/', '');
    const mensagem = payload.commits[0]?.message || 'Sem mensagem';

    console.log(`📂 Repositório: ${repo}`);
    console.log(`🌿 Branch: ${branch}`);
    console.log(`💬 Mensagem: ${mensagem}`);
  }

  // Responde ao GitHub que a mensagem foi recebida
  res.status(200).send('Webhook processado!');
});

app.listen(PORT, () => {
  console.log(`✅ Servidor rodando em http://localhost:${PORT}`);
  console.log(`👉 Aguardando eventos do GitHub...`);
});