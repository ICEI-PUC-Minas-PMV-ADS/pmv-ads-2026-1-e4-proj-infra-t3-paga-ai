# Testes de Sistema no Backend

## O que são Testes de Sistema?

Testes de sistema são testes automatizados que verificam o comportamento completo de um sistema, validando que ele funciona conforme esperado em um ambiente real ou próximo do real. Eles englobam a verificação de todas as funcionalidades do sistema, desde a interface do usuário até a integração com bancos de dados, APIs externas e outros serviços.

## Por que são Importantes?

Testes de sistema ajudam a:

- Garantir que o sistema como um todo atende aos requisitos especificados.
- Identificar problemas que surgem em interações complexas entre componentes.
- Validar a funcionalidade completa em um ambiente que simula o uso real.
- Garantir que as mudanças no código não causem regressões em áreas não diretamente relacionadas.

## Configuração do Ambiente

Para começar a escrever testes de sistema em um projeto backend utilizando C#, siga os passos abaixo:

1. **Instale o .NET SDK**: Certifique-se de ter o [.NET SDK](https://dotnet.microsoft.com/download) instalado.

2. **Crie um projeto de testes de sistema**: No terminal, navegue até o diretório do seu projeto e execute o seguinte comando para criar um projeto de testes:

    ```bash
    dotnet new xunit -o tests
    ```

3. **Adicione uma referência ao seu projeto principal**: No diretório do projeto de testes, adicione uma referência ao seu projeto principal:

    ```bash
    dotnet add reference ../src/MyProject.csproj
    ```

4. **Configure o ambiente de teste**: Isso pode incluir a configuração de servidores, bancos de dados, e outros serviços necessários para que o sistema funcione como um todo.

5. **Organize sua estrutura de diretórios**: Uma estrutura comum de projeto é a seguinte:

    ```
    MyProject/
    ├── src/
    │   └── MyProject.cs
    └── tests/
        └── MyProject.SystemTests.cs
    ```

## Exemplo de Teste de Sistema

Vamos supor que temos um serviço web que gerencia usuários e oferece uma API REST para adicionar e consultar usuários. Vamos criar um teste de sistema para garantir que a API funciona corretamente.

### Código de Exemplo

Aqui está uma implementação simplificada do serviço:

```csharp
// src/MyProject.cs

using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;

namespace MyProject
{
    [ApiController]
    [Route("api/[controller]")]
    public class EmprestimosController : ControllerBase
    {
        private static List<Emprestimo> Emprestimos = new List<Emprestimo>();

        [HttpPost]
        public IActionResult CriarEmprestimo(Emprestimo emprestimo)
        {
            Emprestimos.Add(emprestimo);
            return Ok(new { mensagem = "Empréstimo realizado com sucesso!" });
        }

        [HttpGet]
        public IActionResult ObterEmprestimos()
        {
            return Ok(Emprestimos);
        }
    }

    public class Emprestimo
    {
        public int Id { get; set; }
        public string Item { get; set; }
        public string Usuario { get; set; }
        public string DataDevolucao { get; set; }
    }
}


    public class User
    {
        public string Name { get; set; }
        public string Email { get; set; }
    }
}
```
## Demonstração dos Requisitos Implementados (Web & Mobile)

Para validar o funcionamento completo do sistema (ponta a ponta), realizamos os testes integrando o back-end em C# com as interfaces de usuário.

### 1. Fluxo de Empréstimos - Plataforma Web

* **Descrição:** O usuário acessa o sistema pelo navegador, preenche os dados do empréstimo e envia a requisição para a API em C#.
* **Resultado:** A API processa os dados com sucesso e a tela atualiza mostrando o novo empréstimo na lista.
* **Evidência do Teste:**
  ![Tela de Empréstimo  Web](img/web_emprestimo.png)

---

### 2. Fluxo de Empréstimos - Aplicativo Mobile

* **Descrição:** O usuário abre o aplicativo no celular e visualiza a lista de empréstimos ativos cadastrados no banco de dados através da API.
* **Resultado:** Os dados são carregados rapidamente e exibidos em formato de cartões (cards) na tela do celular.
* **Evidência do Teste:**
  ![Tela Empréstimo Mobile](img/docs/img/mobile_emprestimo.png)

---

### 3. Fluxo de Notificações - Plataforma Web

* **Descrição** Após o preenchimento do empréstimo, automaticamente irá criar um push da notificação de "Criação de Empréstimo"
* **Resultado** A API processa os dados, a tela atualiza listando a criação do emprestimo, ou quando for marcado como pago, ou quando estiver em atraso.
* **Evidência do Teste:**
<img width="1919" height="914" alt="Captura de tela 2026-06-11 143506" src="https://github.com/user-attachments/assets/f7de9f9c-0336-442e-a6b9-c13f03465774" />

<img width="1904" height="911" alt="Captura de tela 2026-06-11 141324" src="https://github.com/user-attachments/assets/a4c575e0-af9a-4386-9fa9-52ce8d47fe3f" />

---

### 4. Fluxo de Notificações - Aplicativo Mobile

* **Descrição:** O usuário abre o aplicativo no celular vai até a pagina de notificções onde lista todas as notificaçoes sober os empréstimos.
* **Resultado:** Os dados são carregados rapidamente e exibidos em formato de cartões (cards) na tela do celular.
* **Evidência do Teste:**

<img width="433" height="936" alt="image" src="https://github.com/user-attachments/assets/10cf6d01-fd41-43a5-a241-71db35d6d15f" />
<img width="437" height="937" alt="image" src="https://github.com/user-attachments/assets/182f32ae-6bf8-4119-941c-e79bdceece50" />
<img width="432" height="936" alt="image" src="https://github.com/user-attachments/assets/a8a71a6a-f035-42f6-ab75-1e493aac25c1" />
<img width="434" height="933" alt="image" src="https://github.com/user-attachments/assets/4207d8da-fd99-4679-8ebf-07d2a6f6d31d" />

---

### 5. Fluxo de Autenticação e Gateway - Plataforma Web

* **Descrição:** O usuário acessa a interface Web, realiza cadastro e login, e as requisições são encaminhadas pelo gateway para a API de autenticação e usuários.
* **Resultado:** O fluxo de autenticação é concluído com sucesso e o usuário consegue acessar a aplicação pela plataforma Web.
* **Evidência do Teste:**
  ![Cadastro Web](img/cadastro_web.png)
  ![Login Web](img/login_web.png)
  ![Sucesso Login/Cadastro Web](img/sucesso_login-cadastro_web.png)

---

### 6. Fluxo de Autenticação e Gateway - Aplicativo Mobile

* **Descrição:** O usuário realiza cadastro e login no aplicativo Mobile, e o gateway repassa as requisições até a API de autenticação.
* **Resultado:** O aplicativo autentica o usuário com sucesso e permite o acesso ao sistema pelo Mobile.
* **Evidência do Teste:**
  ![Cadastro Mobile](img/cadastro_mobile.png)
  ![Login Mobile](img/login_mobile.png)
  ![Sucesso Login/Cadastro Mobile](img/sucesso_login-cadastro_mobile.png)
  
---

### Fluxo de Relatório - Plataforma Web
**Cenário 01 - Acessar tela de Relatórios**

**Dado** que o usuário esteja autenticado no sistema.<br>
**Quando** acessar o menu "Relatórios".<br>
**Então** o sistema deverá exibir a tela de Relatórios.

<img width="1919" height="1142" alt="image" src="https://github.com/user-attachments/assets/4d7e7cb6-7f3c-44ac-957c-073da020b75d" />

---

**Cenário 02 - Filtrar relatório por período**

**Dado** que o usuário esteja na tela de Relatórios.<br>
**Quando** informar a Data Inicial e a Data Final.<br>
**E** clicar no botão "Filtrar".<br>
**Então** o sistema deverá apresentar os dados financeiros correspondentes ao período informado.

<img width="1920" height="1175" alt="image" src="https://github.com/user-attachments/assets/3b7e7cee-f8f7-46e3-9bcc-0123b0eac68d" />

---
**Cenário 03 - Visualizar indicadores financeiros**

**Dado** que exista movimentação para o período consultado<br>
**Quando** o filtro for executado<br>
**Então** o sistema deverá exibir os indicadores:<br>
- Total Emprestado
- Total Recebido
- Total Pendente
- Lucro Total

<img width="1920" height="1152" alt="image" src="https://github.com/user-attachments/assets/e4e621b8-8076-49ce-b2fe-3f60576e9eca" />

---

**Cenário 04 - Visualizar Empréstimos por Devedor**

**Dado** que existam empréstimos para o período consultado<br>
**Quando** o filtro for executado<br>
**Então** o sistema deverá exibir a relação de empréstimos agrupados por devedor.

<img width="1920" height="1121" alt="image" src="https://github.com/user-attachments/assets/f1e4d91e-d0fc-4dd7-8967-5a2fb3583f85" />

---
**Cenário 05 - Visualizar Pagamentos Recentes**

**Dado** que existam pagamentos para o período consultado<br>
**Quando** o filtro for executado<br>
**Então** o sistema deverá exibir a relação de pagamentos recentes.

<img width="1920" height="1119" alt="image" src="https://github.com/user-attachments/assets/659e8940-affa-47b5-9a64-19644a7fea74" />

---

**Cenário 06 - Exportar relatório em PDF**

**Dado** que o usuário esteja na tela de Relatórios<br>
**Quando** clicar no botão "Exportar PDF"<br>
**Então** o sistema deverá gerar e realizar o download do arquivo PDF contendo os dados do relatório.

<img width="1920" height="1130" alt="image" src="https://github.com/user-attachments/assets/863e791c-09ae-4354-942d-f745dd470d9e" />

---

### Fluxo de Relatório - Aplicativo Mobile

**Cenário 01 - Acessar tela de Relatórios**

**Dado** que o usuário esteja autenticado no aplicativo<br>
**Quando** acessar a aba "Relatórios"<br>
**Então** o sistema deverá exibir a tela de Relatórios.

<img width="738" height="1600" alt="WhatsApp Image 2026-06-15 at 21 30 30" src="https://github.com/user-attachments/assets/11c8503a-1022-44b2-b155-a536898154f3" />

---

**Cenário 02 - Filtrar relatório por período**

**Dado** que o usuário esteja na tela de Relatórios<br>
**Quando** selecionar a Data Inicial e a Data Final<br>
**E** clicar em "Filtrar"<br>
**Então** o sistema deverá apresentar os dados financeiros correspondentes ao período informado.

<img width="738" height="1600" alt="WhatsApp Image 2026-06-15 at 21 30 30 (1)" src="https://github.com/user-attachments/assets/d3a0570e-ff06-4453-a64f-08f5a6b7cc0a" />

---

**Cenário 03 - Visualizar indicadores financeiros**

**Dado** que existam registros para o período informado<br>
**Quando** o filtro for executado<br>
**Então** o sistema deverá exibir os indicadores financeiros do relatório.

<img width="738" height="1600" alt="WhatsApp Image 2026-06-15 at 21 30 30 (3)" src="https://github.com/user-attachments/assets/5058fd09-1c19-4f56-8222-85a7d89d2e50" />

---

**Cenário 04 - Exportar e compartilhar PDF**

**Dado** que o usuário esteja na tela de Relatórios<br>
**Quando** clicar no botão "Exportar PDF"<br>
**Então** o sistema deverá gerar o arquivo PDF<br>
**E** disponibilizar as opções de compartilhamento do dispositivo.

<img width="738" height="1600" alt="WhatsApp Image 2026-06-15 at 21 30 29" src="https://github.com/user-attachments/assets/6554a255-7016-4e46-b05e-9b98c8015e43" />
<img width="738" height="1600" alt="WhatsApp Image 2026-06-15 at 21 30 30 (2)" src="https://github.com/user-attachments/assets/cc3f44f6-fd5c-4d3f-8d1b-c3282863a435" />

