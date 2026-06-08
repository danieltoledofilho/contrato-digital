# Contrato Digital — WordPress + Google Apps Script

Sistema completo de contrato digital com assinatura canvas, registro no Google Sheets e envio de email com PDF anexado.

**Como funciona:** formulario 4 etapas no WordPress → aluno assina digitalmente → **PDF gerado no browser** → Google Apps Script salva no Sheets + envia email com PDF para o aluno e para voce.

Sem n8n. Sem tokens. Sem nada que expira.

---

## Arquivos

| Arquivo | O que e |
|---|---|
| `contrato.html` | Pagina do contrato — colar no WordPress |
| `apps_script.gs` | Backend do webhook — implantar no Google Apps Script |
| `README.md` | Este guia |

---

## Como configurar (passo a passo)

### 1. Google Sheets

1. Acesse [sheets.google.com](https://sheets.google.com) e crie uma planilha nova
2. Copie o **ID** da URL — e a parte entre `/d/` e `/edit`:
   ```
   https://docs.google.com/spreadsheets/d/ESTE_TRECHO_AQUI/edit
   ```
3. Guarde esse ID

---

### 2. Google Apps Script

> **IMPORTANTE:** Use o **Safari** (Mac) ou o **Firefox** para esta etapa. O Chrome tem tradutor automatico que quebra o codigo JavaScript.

1. Acesse [script.google.com](https://script.google.com)
2. Clique em **Novo projeto**
3. Apague o codigo que aparece
4. Abra o arquivo `apps_script.gs` no **TextEdit** (Mac) ou **Bloco de Notas** (Windows)
5. Selecione tudo (`Cmd+A` ou `Ctrl+A`) e copie (`Cmd+C` ou `Ctrl+C`)
6. Cole no editor do Apps Script (`Cmd+V` ou `Ctrl+V`)
7. **Edite a secao CONFIG no topo do arquivo:**
   ```javascript
   var SHEET_ID          = 'COLE_O_ID_DA_SUA_PLANILHA_AQUI';
   var EMAIL_INSTRUTOR   = 'seu-email@gmail.com';
   var NOME_INSTRUTOR    = 'Seu Nome Completo';
   var NOME_CURSO        = 'Nome do Seu Curso';
   var WHATSAPP_NUM      = '5511999999999';
   var WHATSAPP_DISPLAY  = '(11) 99999-9999';
   var CIDADE_FORO       = 'Sao Paulo/SP';
   ```
8. Salve com `Cmd+S` (ou `Ctrl+S`)
9. Clique em **Implantar** → **Novo deployment**
   - Tipo: **App da Web**
   - Executar como: **Eu** (sua conta Google)
   - Quem tem acesso: **Qualquer pessoa**
10. Clique em **Implantar** → autorize quando o Google pedir → copie a **URL gerada**

A URL vai parecer com isso:
```
https://script.google.com/macros/s/AKfycb.../exec
```

---

### 3. WordPress

> **IMPORTANTE:** Disable o tradutor do Chrome nesta pagina tambem.

1. No painel do WordPress, crie uma **pagina nova**
2. Mude o template para **Canvas** ou **Largura total** (sem cabecalho/rodape do tema)
3. Adicione um bloco de **HTML personalizado** (Custom HTML)
4. Abra o arquivo `contrato.html` no TextEdit / Bloco de Notas
5. Selecione tudo e cole no bloco HTML
6. **Localize as 2 linhas de CONFIG no topo do script** e edite:
   ```javascript
   var WEBHOOK_URL = 'COLE_AQUI_A_URL_DO_APPS_SCRIPT'
   var NOME_CURSO_JS = 'Nome do Seu Curso'
   ```
7. Ainda no HTML, procure o bloco de opcoes do curso e edite para o seu curso:
   ```html
   <label class="curso-opcao" onclick="selecionarCurso(this,'Modalidade A','2.000,00')">
     <input type="radio" .../>
     <span>Modalidade A — 1 dia | R$ 2.000,00</span>
   </label>
   ```
8. Publique a pagina

---

### 4. Teste

Acesse a pagina publicada, preencha o formulario com seu proprio email e assine. Verifique:
- [ ] Email chegou para voce (aluno de teste)
- [ ] Email chegou para o email do instrutor
- [ ] **PDF esta anexado** nos dois emails com a assinatura visivel
- [ ] Linha apareceu na planilha do Google Sheets

---

## Personalizar clausulas e entregaveis

Na primeira submissao, o Apps Script cria automaticamente duas abas na sua planilha:

| Aba | O que e |
|---|---|
| **Clausulas** | Texto de cada clausula do contrato. Edite a coluna "Texto" para alterar. |
| **Entregaveis** | O que o aluno vai aprender. Aparece no passo 2 do contrato e no PDF. |

Voce edita direto na planilha. Nao precisa mexer no codigo.

---

## Personalizar o visual

No arquivo `contrato.html`, no topo do CSS:
```css
:root{
  --gold:#C9A84C;   /* cor principal */
  --dark:#080808;   /* cor do cabecalho */
  --light:#f4f4f2;  /* cor do fundo */
}
```

---

## Como funciona o PDF (por que nunca expira)

```
Aluno preenche o formulario
        |
        v
Browser gera o PDF com html2pdf.js (100% no computador do aluno)
        |
        v
PDF vira base64 e e incluido no payload
        |
        v
Google Apps Script recebe o base64 e converte para .pdf
        |
        +-- Salva dados no Google Sheets (aba "Contratos")
        +-- Envia email para o aluno com PDF anexado
        +-- Envia email para o instrutor com PDF anexado
```

**Por que nunca expira:**
- O PDF e gerado no browser — sem servidor, sem API
- O Apps Script usa apenas `SpreadsheetApp` e `MailApp` — servicos basicos do Google, sempre ativos
- Nao ha tokens OAuth, nao ha servicos de terceiros

---

## Perguntas frequentes

**Preciso de hospedagem especial?**
Nao. Funciona em qualquer WordPress, ate na versao mais basica.

**Posso usar sem WordPress?**
Sim. O `contrato.html` e HTML puro — funciona em qualquer hospedagem, GitHub Pages, Netlify, etc.

**O Chrome quebrou o meu codigo ao colar — funcao virou outro nome**
O Chrome tem um tradutor automatico que renomeia variaveis JavaScript ao colar. Use o **Safari** ou o **Firefox** para colar o codigo no Apps Script. Nunca use o Chrome para essa etapa.

**O PDF nao tem a assinatura**
Isso acontece se o html2pdf nao conseguiu capturar o canvas. Certifique-se de que a versao do `contrato.html` que voce colou e a mais recente deste repositorio — ela usa DOM element ao inves de string HTML, o que resolve este problema.
