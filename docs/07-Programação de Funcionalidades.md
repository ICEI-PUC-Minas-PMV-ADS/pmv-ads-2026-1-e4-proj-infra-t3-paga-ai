# Programação de Funcionalidades

<span style="color:red">Pré-requisitos: <a href="2-Especificação do Projeto.md"> Especificação do Projeto</a></span>, <a href="3-Projeto de Interface.md"> Projeto de Interface</a>, <a href="4-Metodologia.md"> Metodologia</a>, <a href="3-Projeto de Interface.md"> Projeto de Interface</a>, <a href="5-Arquitetura da Solução.md"> Arquitetura da Solução</a>

Implementação do sistema descritas por meio dos requisitos funcionais e/ou não funcionais. Deve relacionar os requisitos atendidos os artefatos criados (código fonte) além das estruturas de dados utilizadas e as instruções para acesso e verificação da implementação que deve estar funcional no ambiente de hospedagem.

Para cada requisito funcional, pode ser entregue um artefato desse tipo

|ID    | Descrição do Requisito  | Artefatos | Responsável |
|------|-----------------------------------------|----|----|
|RF-001| O sistema deve permitir cadrastar e registrar, nome, contato e adicionar  cada devedor, com sincronização em nuvem entre Web e Mobile.  | Tela de Clientes, API de Clientes | Flávio |
|RF-002| O usuário deve inserir o valor principal, a taxa de juros/acréscimo e a data, permitindo edição em ambas as plataformas.   | Tela de Emprestimos, API de Emprestimos| Luan |
|RF-003| O sistema deve calcular automaticamente o valor total (Principal + Lucro) usando a mesma lógica de cálculo no servidor.   | ALTA | Renata |
|RF-004| O usuário deve definir uma data de vencimento para cada dívida cadastrada.   | MÉDIA | Cristina |
|RF-005| O sistema deve enviar Notificações Push (Mobile) e Alertas Visuais (Web) na data de vencimento   | Tela de Notificações, API de Notificações | Alex |
|RF-006| Deve ser possível marcar as dívidas como "Pendente" e "Pago"   | Tela de Emprestimos | Luan |
|RF-007| A aplicação deve gerar um resumo do total de dinheiro "na rua" e o lucro total previsto para o mês.   | MÉDIA | Alex |

> **Links Úteis**:
>
> - [Trabalhando com HTML5 Local Storage e JSON](https://www.devmedia.com.br/trabalhando-com-html5-local-storage-e-json/29045)
> - [JSON Tutorial](https://www.w3resource.com/JSON)
> - [JSON Data Set Sample](https://opensource.adobe.com/Spry/samples/data_region/JSONDataSetSample.html)
> - [JSON - Introduction (W3Schools)](https://www.w3schools.com/js/js_json_intro.asp)
> - [JSON Tutorial (TutorialsPoint)](https://www.tutorialspoint.com/json/index.htm)
