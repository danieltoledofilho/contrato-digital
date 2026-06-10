# Contrato Digital — Template

Sistema completo de contrato digital com assinatura canvas, PDF gerado no browser, registro automático no Google Sheets e email com PDF para aluno e instrutor.

**Sem n8n. Sem tokens que expiram. Zero manutenção.**

---

## Como criar um contrato para um novo cliente

### Passo 1 — Substituir os placeholders no HTML

Abra `contrato.html` e troque todos os `%%PLACEHOLDER%%`:

| Placeholder | O que é | Exemplo |
|---|---|---|
| `%%NOME_INSTRUTOR%%` | Nome do instrutor | `Willy San` |
| `%%NOME_EMPRESA%%` | Nome da empresa | `Barbearia San Sol Nascente` |
| `%%ESPECIALIDADE%%` | Especialidade | `Barbearia Profissional` |
| `%%NOME_CURSO%%` | Nome do curso (com acento) | `Barbearia na Palma da Mão` |
| `%%NOME_CURSO_SIMPLES%%` | Nome do curso (sem acento) | `Barbearia na Palma da Mao` |
| `%%COR_PRINCIPAL%%` | Cor principal hex | `#C9A84C` |
| `%%COR_CLARA%%` | Variação clara da cor | `#E8D5A3` |
| `%%CARGA_HORARIA%%` | Carga horária total | `12 aulas — 12h` |
| `%%FORO%%` | Cidade do contrato | `São Paulo/SP` |
| `%%FORO_SIMPLES%%` | Cidade sem acento | `Sao Paulo/SP` |
| `%%VALOR_PADRAO%%` | Valor padrão exibido | `67,00` |

Também edite:
- As `<option>` do select de modalidade (linhas com `f-modalidade`)
- O texto das cláusulas específicas do curso (linhas `<p data-cl=...>`)
- O WEBHOOK_URL: cole a URL do Apps Script implantado

### Passo 2 — Configurar o Apps Script

1. Acesse [script.google.com](https://script.google.com) → Novo projeto
2. Cole o conteúdo de `apps_script.gs`
3. Substitua os `%%PLACEHOLDER%%` (mesma tabela acima, mais `%%EMAIL_INSTRUTOR%%`)
4. Clique em **Implantar → Novo deployment**
   - Tipo: **App da Web**
   - Executar como: **Eu**
   - Acesso: **Qualquer pessoa**
5. Copie a URL gerada e cole no `contrato.html` onde está `COLE_AQUI_A_URL_DO_APPS_SCRIPT`
6. Execute `setupInicial` uma vez para criar a planilha automaticamente

### Passo 3 — Deploy no WordPress

1. Abra `deploy.py` e configure `HOST`, `WP_USER`, `WP_PASS`
2. Execute: `python3 deploy.py`
3. Acesse `https://dominio.com.br/contrato` e teste

---

## Arquivos

| Arquivo | O que é |
|---|---|
| `contrato.html` | Interface 4 etapas + geração de PDF |
| `apps_script.gs` | Backend: salva no Sheets + envia email |
| `deploy.py` | Publica no WordPress via API |

---

## Regras técnicas (não mudar)

- **PDF**: sempre jsPDF direto — **nunca html2canvas** (gera PDF em branco)
- **CORS**: fetch com `Content-Type: text/plain;charset=utf-8`
- **Sheets**: auto-criado pelo Apps Script — não precisa criar manualmente
- **Regex**: usar `[^\u0000-\u007f]` (nunca null byte literal `\x00` — quebra o browser)
- **Deploy**: `http.client` com SSL desabilitado — não usar `requests`
- **n8n**: ÚNICO ativo é `auto.danieltoledo.com.br`

---

## Clientes que usam este sistema

| Cliente | Site | Cor | Status |
|---|---|---|---|
| Willy San | willysan.com.br/contrato | #C9A84C | ✅ Ativo |
| Laércio Cortes | laercioprotese.com.br/contrato-curso | #1976D2 | ✅ Ativo |

---

*Mantido por Daniel Toledo — [danieltoledo.com.br](https://danieltoledo.com.br)*
