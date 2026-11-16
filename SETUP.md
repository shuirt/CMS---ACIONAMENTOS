# Guia de Configuração — Central de Acionamentos (CMS)

Este guia descreve como configurar e operar a **Central de Acionamentos — CMS** utilizando o **Google Sheets** como banco oficial compartilhado e o **Google Sign-In (OAuth)** com controle de operadores autorizados no servidor.

---

## 1. Como configurar a planilha

Você possui duas opções para criar a planilha compartilhada do CMS:

1. **Automática (recomendada):** após entrar com sua conta Google autorizada no aplicativo, clique em **Planilha → Criar nova planilha CMS**. O backend criará automaticamente a planilha no Google Drive com as três abas, cabeçalhos exatos e opções iniciais da aba `Config`.
2. **Manual:** crie uma nova planilha no [Google Sheets](https://sheets.google.com), copie o ID da URL (`https://docs.google.com/spreadsheets/d/<ID_DA_PLANILHA>/edit`) e utilize o botão **Validar e conectar** no aplicativo para criar automaticamente as abas e cabeçalhos ausentes.

> **Importante:** mantenha a planilha **privada** (restrita apenas aos operadores autorizados do CMS). Nunca configure a planilha como "Qualquer pessoa com o link".

---

## 2. Como configurar as três abas

Se optar por montar ou revisar manualmente a planilha, as três abas devem possuir exatamente os seguintes nomes e colunas na linha 1:

### Aba 1 — `Acionamentos`
| Coluna | Cabeçalho |
| :--- | :--- |
| A | `ID` (UUID único gerado pelo sistema) |
| B | `Número REPORT` |
| C | `Data do registro` (ISO `AAAA-MM-DD`) |
| D | `Horário do acionamento` (`HH:mm`) |
| E | `Horário do acionamento da equipe` (`HH:mm`) |
| F | `Horário da chegada em campo` (`HH:mm`) |
| G | `Horário da normalização` (`HH:mm`) |
| H | `Quem acionou` |
| I | `Tipo de localidade` |
| J | `KM ferroviário` |
| K | `Housing / RH` |
| L | `Município` |
| M | `Analista responsável` |
| N | `Descrição e cronologia` |
| O | `Tecnologia empregada` (`SIM` ou `NÃO`) |
| P | `Tecnologia utilizada` |
| Q | `Ações envolvidas` |
| R | `Equipe de campo` |
| S | `Material / Ativos envolvidos` |
| T | `Tipificação` |
| U | `INC` |
| V | `Status operacional` |
| W | `Data de criação` (ISO UTC) |
| X | `Operador que criou` |
| Y | `E-mail de quem criou` |
| Z | `Data da última atualização` (ISO UTC) |
| AA | `Operador que atualizou` |
| AB | `E-mail de quem atualizou` |

### Aba 2 — `Config`
| Coluna | Cabeçalho | Descrição |
| :--- | :--- | :--- |
| A | `Chave` | Identificador da opção |
| B | `Grupo` | `quem_acionou`, `tipo_localidade`, `housing_rh`, `municipio`, `analista`, `tecnologia`, `acoes_envolvidas`, `material_ativos`, `tipificacao` |
| C | `Valor` | Texto exibido no formulário |
| D | `Ativo` | `SIM` ou `NÃO` |
| E | `Ordem de exibição` | Número inteiro crescente |

### Aba 3 — `Auditoria`
| Coluna | Cabeçalho |
| :--- | :--- |
| A | `ID da auditoria` |
| B | `Data e hora` |
| C | `ID do acionamento` |
| D | `Tipo de operação` (`criação` ou `edição`) |
| E | `Usuário responsável` |
| F | `E-mail do usuário` |
| G | `Campos alterados` |

---

## 3. Como habilitar a Google Sheets API

1. Acesse o [Google Cloud Console](https://console.cloud.google.com/) no projeto vinculado ao aplicativo (`gen-lang-client-0126606450` ou o projeto escolhido na implantação).
2. No menu lateral, vá em **APIs e serviços → Biblioteca**.
3. Pesquise por **Google Sheets API** e clique em **Ativar**.

---

## 4. Como autorizar a integração OAuth

1. No Google Cloud Console, acesse **APIs e serviços → Tela de permissão OAuth**.
2. Caso o aplicativo esteja em modo **Teste (Testing)**, adicione os e-mails dos operadores autorizados em **Usuários de teste**.
3. Verifique se o escopo `https://www.googleapis.com/auth/spreadsheets` está habilitado.
4. No login do aplicativo, cada operador clicará em **Sign in with Google** e concederá permissão à sua conta para leitura e gravação na planilha compartilhada do CMS.
   - *Observação sobre arquitetura:* os tokens de acesso OAuth são mantidos apenas em memória no navegador e enviados ao backend via cabeçalho `Authorization: Bearer`. Nenhuma credencial ou senha fica gravada no código do frontend nem em `localStorage`.

---

## 5. Como configurar os usuários permitidos

O controle de acesso é validado **exclusivamente no servidor** a cada chamada da API (`/api/*`).

Defina a variável de ambiente `ALLOWED_OPERATOR_EMAILS` no servidor com os e-mails Google autorizados separados por vírgula:

```env
ALLOWED_OPERATOR_EMAILS="operador1@empresa.com,operador2@empresa.com,supervisor@empresa.com"
```

- Se `ALLOWED_OPERATOR_EMAILS` estiver vazia ou não configurada, o backend bloqueará todas as leituras e gravações (`403 Forbidden`).
- Usuários autenticados no Google cujo e-mail não conste nessa lista receberão erro `403` e não terão acesso aos registros nem às rotas da API.

---

## 6. Como configurar as variáveis e secrets

Configure as seguintes variáveis de ambiente (no painel **Secrets** do Google AI Studio ou nas variáveis de ambiente do Cloud Run):

- `ALLOWED_OPERATOR_EMAILS` *(obrigatória em produção)*: e-mails Google autorizados separados por vírgula.
- `GOOGLE_SHEETS_SPREADSHEET_ID` *(recomendada em produção)*: ID fixo da planilha oficial do CMS compartilhada entre todos os operadores.

Consulte `.env.example` para referência de formato.

---

## 7. Como testar a gravação e leitura

1. Configure `ALLOWED_OPERATOR_EMAILS` com o seu e-mail Google e reinicie o servidor.
2. Abra o aplicativo e clique em **Sign in with Google**.
3. Conecte uma planilha existente (ou clique em **Criar nova planilha CMS**).
4. Clique em **+ Novo acionamento**, preencha os campos obrigatórios, selecione o status **Report** e salve.
5. Confirme a gravação no diálogo e verifique:
   - O registro aparece na listagem inicial **Hoje**.
   - Na planilha Google Sheets, a linha foi inserida na aba `Acionamentos` com UUID, `Número REPORT` sequencial e carimbo de data/hora.
   - A aba `Auditoria` recebeu um registro de `criação`.
6. Clique no registro, escolha **Editar**, altere um campo e salve. Confirme que não houve duplicação de linha na planilha e que a aba `Auditoria` registrou `edição` com os campos alterados.
7. Teste o acesso negativo com um e-mail não listado em `ALLOWED_OPERATOR_EMAILS` (ou sem token via `curl /api/workspace`) para confirmar respostas `401` / `403`.

---

## 8. Como publicar o aplicativo (Google Cloud Run)

1. Gere o build de produção do frontend:
   ```bash
   npm run build
   ```
2. Configure o serviço no **Google Cloud Run** apontando para a porta `3000` (ou `PORT` definida pelo Cloud Run) executando `npm start` (`node server.ts`).
3. Adicione as variáveis de ambiente `ALLOWED_OPERATOR_EMAILS` e `GOOGLE_SHEETS_SPREADSHEET_ID` nas configurações do serviço Cloud Run.
4. No Firebase Authentication / Google Cloud Console, adicione o domínio final do Cloud Run (`*.run.app`) aos **Domínios autorizados** de autenticação e às origens JavaScript autorizadas do cliente OAuth.

---

## 9. Como compartilhar o acesso com os demais usuários

1. Abra a planilha oficial do CMS no Google Sheets e clique em **Compartilhar**.
2. Adicione os e-mails Google dos demais operadores do CMS com permissão de **Editor**.
3. Inclua exatamente os mesmos e-mails na variável `ALLOWED_OPERATOR_EMAILS` do servidor.
4. Envie o link do aplicativo publicado e o ID da planilha (caso `GOOGLE_SHEETS_SPREADSHEET_ID` não esteja fixado no ambiente do servidor).
