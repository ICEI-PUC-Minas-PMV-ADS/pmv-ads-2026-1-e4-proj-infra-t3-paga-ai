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

|ID    | Descrição do Requisito  | Prioridade | Responsável |
|------|-----------------------------------------|----|----|
|RF-001| O sistema deve permitir cadrastar e registrar, nome, contato e adicionar  cada devedor, com sincronização em nuvem entre Web e Mobile.  | ALTA | Flávio |
|RF-002| O sistema deve permitir a criação (cadastro), leitura (visualização) e exclusão (remoção) de informações relevantes dos dados do usuário| ALTA |Renata|
|RF-003| O sistema deve permitir que o usuário faça login utilizando seu e-mail e senha cadastrados | ALTA | Thiago |
|RF-004| O usuário deve inserir o valor principal, a taxa de juros/acréscimo e a data, permitindo edição em ambas as plataformas.   | ALTA | Luan |
|RF-005| O sistema deve calcular automaticamente o valor total (Principal + Lucro) usando a mesma lógica de cálculo no servidor.   | ALTA | Luan |
|RF-006| O usuário deve definir uma data de vencimento para cada dívida cadastrada.   | MÉDIA | Renata |
|RF-007| O sistema deve enviar Notificações Push (Mobile) e Alertas Visuais (Web) na data de vencimento   | MÉDIA | Alex |
|RF-008| Deve ser possível marcar as dívidas como "Pendente" e "Pago"   | MÉDIA | Luan |
|RF-009| A aplicação deve gerar um resumo do total de dinheiro "na rua" e o lucro total previsto para o mês.   | MÉDIA | Luan |
|RF-010| O sistema deve permitir que o usuário gere relatórios e os exporte no formato PDF | BAIXA | Cristina |
> **Links Úteis**:
>
> - [Trabalhando com HTML5 Local Storage e JSON](https://www.devmedia.com.br/trabalhando-com-html5-local-storage-e-json/29045)
> - [JSON Tutorial](https://www.w3resource.com/JSON)
> - [JSON Data Set Sample](https://opensource.adobe.com/Spry/samples/data_region/JSONDataSetSample.html)
> - [JSON - Introduction (W3Schools)](https://www.w3schools.com/js/js_json_intro.asp)
> - [JSON Tutorial (TutorialsPoint)](https://www.tutorialspoint.com/json/index.htm)
