#!/usr/bin/env python3
"""
Deploy contrato.html -> WordPress via Code Snippets REST API
Adaptar as variáveis abaixo para cada cliente.
"""
import http.client, base64, json, ssl, os, sys

# ══ CONFIGURAR AQUI ══════════════════════════════════════
HOST        = 'DOMINIO_DO_CLIENTE.com.br'   # ex: willysan.com.br
WP_USER     = 'turbowp'                      # usuário WP
WP_PASS     = 'XXXX XXXX XXXX XXXX XXXX'   # WP App Password
URI_CONTRATO = '/contrato'                   # caminho no site
# ═════════════════════════════════════════════════════════

HERE     = os.path.dirname(os.path.abspath(__file__))
HTML_FILE = os.path.join(HERE, 'contrato.html')

def req(method, path, body=None):
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode    = ssl.CERT_NONE
    conn = http.client.HTTPSConnection(HOST, context=ctx, timeout=30)
    auth = base64.b64encode(f'{WP_USER}:{WP_PASS}'.encode()).decode()
    hdrs = {
        'Authorization': f'Basic {auth}',
        'Content-Type':  'application/json',
        'User-Agent':    'Mozilla/5.0',
    }
    payload = json.dumps(body).encode() if body else None
    conn.request(method, path, payload, hdrs)
    r = conn.getresponse()
    data = r.read()
    conn.close()
    return r.status, data

# ── Ler HTML ──────────────────────────────────────────────
with open(HTML_FILE, 'r', encoding='utf-8') as f:
    html_content = f.read()
print(f'HTML: {len(html_content):,} chars')

# Verificar se ainda tem placeholders não substituídos
import re
placeholders = re.findall(r'%%[A-Z_]+%%', html_content)
if placeholders:
    print(f'\n⚠️  ATENÇÃO: Placeholders não substituídos: {set(placeholders)}')
    resp = input('Continuar mesmo assim? (s/N) ').strip().lower()
    if resp != 's':
        sys.exit(1)

# ── Listar snippets ───────────────────────────────────────
print('\nBuscando snippets...')
status, data = req('GET', '/wp-json/code-snippets/v1/snippets')
if status != 200:
    print(f'ERRO ao listar snippets: {status}')
    sys.exit(1)

raw = json.loads(data)
snippets = raw if isinstance(raw, list) else raw.get('snippets', [])
snippet_id = None
for s in snippets:
    uri_check = URI_CONTRATO.strip('/')
    if uri_check in s.get('name','').lower() or uri_check in s.get('description','').lower():
        snippet_id = s['id']
        print(f'Snippet encontrado: ID {snippet_id} — {s["name"]}')
        break

# ── Montar PHP ────────────────────────────────────────────
php_code = r"""add_action('init', function(){
    if (isset($_SERVER['REQUEST_URI'])) {
        $uri = strtok($_SERVER['REQUEST_URI'], '?');
        if ($uri === '""" + URI_CONTRATO + r"""' || $uri === '""" + URI_CONTRATO + r"""/') {
            status_header(200);
            header('Content-Type: text/html; charset=UTF-8');
            header('Cache-Control: no-cache, no-store, must-revalidate');
            header('Pragma: no-cache');
            header('Expires: 0');
            header('X-LiteSpeed-Cache-Control: no-cache');
            @header_remove('X-Powered-By');
            echo '""" + html_content.replace("\\", "\\\\").replace("'", "\\\'") + r"""';
            exit;
        }
    }
});"""

nome_snippet = f'Contrato Digital — {HOST}'
snippet_body = {
    'name':        nome_snippet,
    'code':        php_code,
    'description': f'Serve contrato.html em {URI_CONTRATO}',
    'scope':       'global',
    'active':      True,
}

# ── Criar ou atualizar ────────────────────────────────────
if snippet_id:
    print(f'\nAtualizando snippet ID {snippet_id}...')
    status, data = req('PUT', f'/wp-json/code-snippets/v1/snippets/{snippet_id}', snippet_body)
else:
    print('\nCriando novo snippet...')
    status, data = req('POST', '/wp-json/code-snippets/v1/snippets', snippet_body)

print(f'Status: {status}')
if status in (200, 201):
    result = json.loads(data)
    sid = result.get('id') or result.get('snippet', {}).get('id', '?')
    print(f'✅ Snippet ID {sid} salvo!')
    print(f'🌐 https://{HOST}{URI_CONTRATO}')
else:
    print(f'ERRO: {data[:400]}')
    sys.exit(1)
