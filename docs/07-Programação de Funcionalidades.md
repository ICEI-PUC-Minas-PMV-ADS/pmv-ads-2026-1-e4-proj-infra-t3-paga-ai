# 📌 Programação de Funcionalidades

Este documento apresenta a programação das funcionalidades do sistema, com base nos requisitos levantados. Os requisitos estão organizados em funcionais e não funcionais, acompanhados das atividades produzidas e dos pontos de controle correspondentes.

## ✅ Requisitos Funcionais

|ID    | Descrição do Requisito  | Artefatos | Responsável |
|------|-----------------------------------------|----|----|
|RF-001| O sistema deve permitir cadrastar e registrar, nome, contato e adicionar  cada devedor, com sincronização em nuvem entre Web e Mobile.| Tela de Clientes, API de Clientes | Flávio |
|RF-002| O sistema deve permitir a criação (cadastro), leitura (visualização) e exclusão (remoção) de informações relevantes dos dados do usuário| Tela de Cadastro, API de Cadastro |Renata|
|RF-003| O sistema deve permitir que o usuário faça login utilizando seu e-mail e senha cadastrados | Tela de Login, API de Login | Thiago |
|RF-004| O usuário deve inserir o valor principal, a taxa de juros/acréscimo e a data, permitindo edição em ambas as plataformas.   | Tela de Emprestimos, API de Emprestimos| Luan |
|RF-005| O sistema deve calcular automaticamente o valor total (Principal + Lucro) usando a mesma lógica de cálculo no servidor.   | Tela de Emprestimos, API de Emprestimos| Luan |
|RF-006| O usuário deve definir uma data de vencimento para cada dívida cadastrada.   | Tela de Emprestimos, API de Emprestimos| Renata |
|RF-007| O sistema deve enviar Notificações Push (Mobile) e Alertas Visuais (Web) na data de vencimento   | Tela de Notificações, API de Notificações | Alex |
|RF-008| Deve ser possível marcar as dívidas como "Pendente" e "Pago"   | Tela de Emprestimos | Luan |
|RF-009| A aplicação deve gerar um resumo do total de dinheiro "na rua" e o lucro total previsto para o mês.   | Tela de Emprestimos, API de Emprestimos| Luan|
|RF-010| O sistema deve permitir que o usuário gere relatórios e os exporte no formato PDF | Tela de Reports, API de Reports | Cristina |

---

## ⚙️ Requisitos Não Funcionais

|ID     | Descrição do Requisito  |Prioridade |
|-------|-------------------------|----|
|RNF-001| Por ser focado em pequenos comerciantes, o design deve ser intuitivo e fácil de usar em dispositivos móveis. | MÉDIA | 
|RNF-002| O acesso deve ser protegido por biometria (no Mobile) e senha forte com 2FA (na Web). |  ALTA |
|RNF-003| O sistema deve permitir o registro offline no Mobile e sincronizar assim que detectar conexão com a internet. |  MÉDIA |
|RNF-004| O carregamento da lista de devedores e cálculos de juros deve ocorrer em menos de 2 segundos. |  MÉDIA |
|RNF-005| O sistema deve garantir que os dados dos devedores não sejam compartilhados com terceiros, seguindo as diretrizes da LGPD (Lei Geral de Proteção de Dados). |  ALTA |
|RNF-006| A aplicação deve ser responsiva, funcionando perfeitamente em sistemas Android e iOS. |  BAIXA |
|RNF-007| O sistema deve realizar cópias de segurança em nuvem (ex: Google Drive) para evitar perda de dados em caso de troca de aparelho. |  MÉDIA |

