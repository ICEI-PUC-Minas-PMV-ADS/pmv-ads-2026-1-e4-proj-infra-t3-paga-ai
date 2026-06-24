# Paga Aí
### Considerações Finais - Renata Dimas Tomé

## 1. Avaliação dos Frameworks Utilizados

A equipe adotou Scrum como metodologia de gestão, com acompanhamento das atividades em um quadro Kanban no GitHub Projects. Esse modelo trouxe ritmo previsível às entregas e ajudou a tratar bugs e dificuldades como problemas do grupo, não de uma pessoa isolada.

Tecnicamente, o backend foi construído como um conjunto de microsserviços .NET separados por domínio — Clientes, Empréstimos, Usuários, Notificações e Reports —, todos acessados por um Gateway em Ocelot que centraliza o roteamento das requisições. Os dados ficam em MongoDB, com uma coleção por domínio. O frontend é em React e o aplicativo mobile em Expo/React Native, ambos hospedados na Azure. Essa separação por domínio facilita a manutenção independente de cada serviço.

---

## 2. Contribuições dos Membros do Grupo

**Alex Junio Alves Batista** — Idealizador do projeto e responsável pela visão geral das atividades, cobrando prazos e tarefas pendentes ao longo do semestre.

**Cristina Ludimila da Silva Santos** — Manteve comprometimento constante em todas as etapas, apoiando o grupo em reuniões e na resolução de bugs.

**Flávio Lucas Moreira** — Destacou-se na investigação e resolução de bugs complexos, compartilhando conhecimento técnico com o restante do grupo sempre que necessário.

**Luan Miranda de Sousa** — Trouxe experiência prévia em programação, o que ajudou a orientar a equipe na elaboração do backend e na organização do fluxo de trabalho.

**Thiago Andrade de Souza** — Concentrou sua atuação no Gateway, um dos pontos mais complexos do projeto, além de manter participação ativa na comunicação e coordenação do grupo.

---

## Renata Dimas Tomé — Minha Contribuição

Fui responsável pela identidade visual e pelas telas do sistema ao longo do semestre. Na etapa final, meu foco passou para testar o sistema ponta a ponta e corrigir o que os testes expuseram:

- Implementei no dashboard a separação entre juros a receber e juros pagos (web e mobile).
- Identifiquei e corrigi um erro de indentação no workflow de deploy do `Emprestimos.API` que vinha invalidando o pipeline há várias entregas.
- Alinhei versões de pacotes do .NET que quebravam a validação de JWT entre serviços.
- Montei um ambiente local com múltiplos microsserviços para validar tudo antes do deploy.

---

## Conclusão

O projeto entregou o que foi proposto. O principal aprendizado: corrigir o código não é o fim — é preciso confirmar que a correção chegou à produção, porque a cadeia entre commit e deploy pode falhar em silêncio.
