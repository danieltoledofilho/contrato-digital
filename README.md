# Contrato Digital — WordPress + Google Apps Script

Sistema completo de contrato digital para cursos presenciais.

**Como funciona:** formulario de 4 etapas no WordPress → aluno assina digitalmente → Google Apps Script salva no Sheets + envia email com PDF anexado para o aluno e para voce. Sem n8n, sem tokens, sem expiracao.

---

## O que esta incluso

- `contrato.html` — pagina do contrato (colar no WordPress)
- `apps_script.gs` — backend do webhook (implantar no Google Apps Script)

---

## Prerequisitos

- Site WordPress (qualquer hospedagem)
- Conta Google (Gmail)
- Nenhuma outra ferramenta necessaria

---

## Setup — passo a passo

### 1. Google Sheets

1. Acesse [sheets.google.com](https://sheets.google.com) e crie uma nova planilha
2. Copie o ID da planilha na URL (o que fica entre `/d/` e `/edit`):
   ```
   https://docs.google.com/spreadsheets/d/SEU_ID_AQUI/edit
   ```
3. Guarde esse ID — voce vai usar no passo seguinte

### 2. Google Apps Script

1. Acesse [script.google.com](https://script.google.com)
2. Clique em **"Novo projeto"**
3. Apague o codigo que aparece
4. Abra o arquivo `apps_script.gs` no TextEdit (Mac) ou Bloco de Notas (Windows)
5. Selecione tudo (`Ctrl+A`) e copie (`Ctrl+C`)
6. Cole no editor do Apps Script (`Ctrl+V`)
7. **Edite a secao de configuracao no topo do arquivo:**
   ```javascript
   var SHEET_ID           = 'COLE_O_ID_DA_SUA_PLANILHA_AQUI';
   var EMAIL_RESPONSAVEL  = 'seu-email@gmail.com';
   var NOME_INSTRUTOR     = 'Seu Nome Completo';
   var NOME_CURSO         = 'Nome do Seu Curso';
   var WHATSAPP_NUM       = '5511999999999';
   var WHATSAPP_DISPLAY   = '(11) 99999-9999';
   var CIDADE             = 'Sua Cidade';
   var ESTADO_FORO        = 'Sua Cidade/UF';
   ```
8. Salve com `Ctrl+S`
9. Clique em **"Implantar"** > **"Novo deployment"**
   - Tipo: **Web app**
   - Executar como: **Eu** (sua conta Google)
   - Quem tem acesso: **Qualquer pessoa**
10. Clique em **"Implantar"**, autorize e copie a URL gerada

### 3. WordPress

1. No painel do WordPress, crie uma nova pagina
2. Mude o template para **"Canvas"** (sem cabecalho/rodape do tema)
3. Adicione um bloco de **HTML personalizado**
4. Abra o arquivo `contrato.html` no TextEdit / Bloco de Notas
5. Selecione tudo e cole no bloco HTML
6. **Localize a secao CONFIG no topo do script** e edite:
   ```javascript
   var CONFIG = {
     WEBHOOK_URL: 'COLE_A_URL_DO_APPS_SCRIPT_AQUI',
     INSTRUTOR_NOME: 'Seu Nome',
     INSTRUTOR_WHATSAPP: '5511999999999',
     // ...
   }
   ```
7. Publique a pagina

### 4. Teste

Acesse a pagina publicada, preencha um contrato com seu proprio email e assine. Verifique:
- [ ] Email chegou para voce (aluno de teste)
- [ ] Email chegou para o email do responsavel
- [ ] PDF esta anexado nos dois emails
- [ ] Linha apareceu na planilha do Google Sheets

---

## Personalizando as clausulas

Na primeira submissao de contrato, o Apps Script cria automaticamente uma aba **"Clausulas"** na sua planilha. Voce pode editar as clausulas diretamente nessa aba — sem precisar mexer no codigo. As mudancas valem para o proximo contrato gerado.

---

## Personalizando o visual

No arquivo `contrato.html`, localize a secao `CONFIG` e altere:

```javascript
COR_PRIMARIA: '#C9A84C',    // cor principal (dourado por padrao)
COR_FUNDO:    '#080808',    // cor do cabecalho (preto por padrao)
CURSOS: [
  {
    label: 'Nome do Curso — Modalidade A | 1 dia | das 10h as 17h',
    valor_total: '2.000,00'
  },
  {
    label: 'Nome do Curso — Modalidade B | 2 dias | das 10h as 17h',
    valor_total: ''  // deixe vazio para o aluno preencher
  }
]
```

---

## Arquitetura

```
Aluno preenche o formulario (WordPress)
        |
        v
Google Apps Script (webhook permanente)
        |
        +-- Salva na planilha (Google Sheets)
        |       |
        |       +-- Aba "Contratos" (dados do aluno)
        |       +-- Aba "Clausulas" (editavel pelo instrutor)
        |
        +-- Gera PDF (DocumentApp — sem API externa)
        |
        +-- Envia email para o aluno (contrato + PDF)
        +-- Envia email para o instrutor (resumo + contrato + PDF)
```

**Por que nunca expira:** o Apps Script usa `DocumentApp` e `MailApp` — servicos basicos do Google sempre ativos. Nao ha tokens OAuth, nao ha servicos de terceiros, nao ha n8n.

---

## Duvidas frequentes

**O PDF nao tem o design colorido do email. E normal?**
Sim. O PDF e gerado pelo Google Docs, que tem formatacao mais simples. O conteudo e identico — dados do aluno, clausulas e assinatura estao todos la.

**Posso usar sem WordPress?**
Sim. O `contrato.html` e HTML puro e funciona em qualquer hospedagem ou ate em uma pagina estatica (GitHub Pages, Netlify, etc.).

**O sistema funciona sem internet?**
Nao. Tanto o envio para o Apps Script quanto a busca das clausulas precisam de conexao.
