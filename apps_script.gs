// ─────────────────────────────────────────────────────────
//  Apps Script — Contrato Digital Willy San
//  Curso: Barbearia na Palma da Mão (Online)
//
//  SETUP INICIAL (rodar UMA vez):
//  1. Cole este código no editor
//  2. Implante como App da Web (acesso: Qualquer pessoa)
//  3. Clique em Executar → setupInicial
//  4. Veja os logs (Ctrl+Enter) para pegar a URL da planilha
// ─────────────────────────────────────────────────────────

var SHEET_NAME      = 'Contratos Curso'
var CLAUSULAS_TAB   = 'Clausulas'
var ENTREGAVEIS_TAB = 'Entregaveis'
var EMAIL_INSTRUTOR = 'SEU_EMAIL@gmail.com'

// ─── OBTÉM (ou cria) o ID da planilha ────────────────────
function getSheetId() {
  var props = PropertiesService.getScriptProperties()
  var id    = props.getProperty('SHEET_ID')
  if (!id) {
    var ss = SpreadsheetApp.create('Contratos — Curso Digital')
    id = ss.getId()
    props.setProperty('SHEET_ID', id)
    Logger.log('✅ Planilha criada: ' + ss.getUrl())
  }
  return id
}

// ─── ROTAS GET ────────────────────────────────────────────
function doGet(e) {
  var action = e.parameter.action || ''

  if (action === 'getClauses')     return getClausesFromSheet()
  if (action === 'getEntregaveis') return getEntregaveisFromSheet()
  if (action === 'getSheetUrl') {
    var url = 'https://docs.google.com/spreadsheets/d/' + getSheetId()
    return ContentService.createTextOutput(JSON.stringify({url: url}))
      .setMimeType(ContentService.MimeType.JSON)
  }

  return ContentService.createTextOutput(JSON.stringify({status: 'ok', service: 'contrato-willy-san'}))
    .setMimeType(ContentService.MimeType.JSON)
}

// ─── ROTA POST ────────────────────────────────────────────
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents)
    salvarNaSheet(data)
    enviarEmailAluno(data)
    enviarEmailInstrutor(data)
    return ContentService.createTextOutput(JSON.stringify({success: true}))
      .setMimeType(ContentService.MimeType.JSON)
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({success: false, error: err.message}))
      .setMimeType(ContentService.MimeType.JSON)
  }
}

// ─── SALVAR NA PLANILHA ───────────────────────────────────
function salvarNaSheet(d) {
  var ss = SpreadsheetApp.openById(getSheetId())
  var sh = ss.getSheetByName(SHEET_NAME)

  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME)
    sh.appendRow([
      'Criado em','Nome','Nome Assinatura','CPF','RG','Data Nasc',
      'Email','WhatsApp','Instagram','Estado Civil',
      'Endereco','Bairro','Cidade','Estado','CEP',
      'Curso','Modalidade','Forma Pagamento',
      'Valor Total','Observacoes','Data Hora Assinatura'
    ])
    sh.setFrozenRows(1)
  }

  sh.appendRow([
    d.criado_em         || '',
    d.nome              || '',
    d.nome_assinatura   || '',
    d.cpf               || '',
    d.rg                || '',
    d.data_nasc         || '',
    d.email             || '',
    d.whatsapp          || '',
    d.instagram         || '',
    d.estado_civil      || '',
    d.endereco          || '',
    d.bairro            || '',
    d.cidade            || '',
    d.estado            || '',
    d.cep               || '',
    d.curso             || 'NOME DO CURSO',
    d.modalidade        || 'Online · Acesso Vitalicio',
    d.forma_pagamento   || '',
    d.valor_total       || '67,00',
    d.observacoes       || '',
    d.data_hora_assinatura || ''
  ])
}

// ─── GERAR PDF BLOB ───────────────────────────────────────
function gerarPDFBlob(d) {
  if (!d.pdf_base64) return null
  try {
    var bytes    = Utilities.base64Decode(d.pdf_base64)
    var filename = 'Contrato_Barbearia_na_Palma_da_Mao_' + (d.nome || 'aluno').replace(/\s+/g, '_') + '.pdf'
    return Utilities.newBlob(bytes, 'application/pdf', filename)
  } catch (err) {
    return null
  }
}

// ─── EMAIL ALUNO ──────────────────────────────────────────
function enviarEmailAluno(d) {
  if (!d.email) return

  var pdf   = gerarPDFBlob(d)
  var nome  = d.nome || 'Aluno(a)'
  var total = d.valor_total || '67,00'
  var dtAss = d.data_hora_assinatura || d.criado_em || ''

  var corpo =
    '<!DOCTYPE html><html><head><meta charset="UTF-8"/><style>' +
    'body{font-family:Arial,sans-serif;font-size:14px;color:#222;max-width:540px;margin:0 auto;padding:20px}' +
    '.header{background:#080808;padding:22px 28px;text-align:center;border-radius:8px 8px 0 0}' +
    '.header h1{color:#C9A84C;font-size:20px;margin:0;font-style:italic}' +
    '.header p{color:#777;font-size:12px;margin:4px 0 0}' +
    '.body{border:1px solid #e0e0e0;border-top:none;border-radius:0 0 8px 8px;padding:24px 28px}' +
    '.box{background:#f9f5ec;border-left:4px solid #C9A84C;border-radius:0 6px 6px 0;padding:12px 16px;margin:18px 0;font-size:13px}' +
    '.box strong{display:block;margin-bottom:6px;color:#333;font-size:14px}' +
    '.footer{text-align:center;font-size:11px;color:#aaa;margin-top:24px}' +
    '</style></head><body>' +
    '<div class="header"><h1>Willy San</h1><p>Barbearia na Palma da Mão · Contrato Online</p></div>' +
    '<div class="body">' +
    '<p>Olá, <strong>' + nome + '</strong>!</p>' +
    '<p>Seu contrato do curso <strong>Barbearia na Palma da Mão</strong> foi assinado com sucesso.</p>' +
    '<div class="box"><strong>Resumo do seu contrato:</strong>' +
    'Curso: Barbearia na Palma da Mão — Online<br>' +
    'Modalidade: Online · Acesso Vitalício<br>' +
    'Valor total: R$ ' + total + '<br>' +
    'Forma de pagamento: ' + (d.forma_pagamento || '—') + '<br>' +
    'Assinado em: ' + dtAss +
    '</div>' +
    '<p>Segue em anexo o seu contrato em PDF. Em breve você recebe o link de acesso ao curso.</p>' +
    '<p>Qualquer dúvida, fale diretamente com o Willy.</p>' +
    '<p style="margin-top:20px">Bons estudos!<br><strong>Willy San</strong><br>Barbearia San Sol Nascente</p>' +
    '</div>' +
    '<div class="footer">E-mail automático · Contrato digital com validade jurídica (MP 2.200-2/2001 e Lei 14.063/2020)</div>' +
    '</body></html>'

  MailApp.sendEmail({
    to:          d.email,
    subject:     '✅ Contrato Barbearia na Palma da Mão — ' + nome,
    htmlBody:    corpo,
    name:        'Willy San · Barbearia na Palma da Mão',
    attachments: pdf ? [pdf] : []
  })
}

// ─── EMAIL WILLY ──────────────────────────────────────────
function enviarEmailInstrutor(d) {
  var pdf   = gerarPDFBlob(d)
  var nome  = d.nome || '—'
  var total = d.valor_total || '67,00'

  var corpo =
    '<!DOCTYPE html><html><head><meta charset="UTF-8"/></head>' +
    '<body style="font-family:Arial,sans-serif;font-size:14px;color:#222;max-width:480px;margin:0 auto;padding:20px">' +
    '<h2 style="color:#C9A84C">Novo contrato assinado ✅</h2>' +
    '<p><strong>Nome:</strong> ' + nome + '</p>' +
    '<p><strong>CPF:</strong> ' + (d.cpf || '—') + '</p>' +
    '<p><strong>E-mail:</strong> ' + (d.email || '—') + '</p>' +
    '<p><strong>WhatsApp:</strong> ' + (d.whatsapp || '—') + '</p>' +
    '<p><strong>Curso:</strong> Barbearia na Palma da Mão — Online</p>' +
    '<p><strong>Forma de pagamento:</strong> ' + (d.forma_pagamento || '—') + '</p>' +
    '<p><strong>Valor total:</strong> R$ ' + total + '</p>' +
    '<p><strong>Cidade/Estado:</strong> ' + (d.cidade || '—') + ' / ' + (d.estado || '—') + '</p>' +
    '<p><strong>Assinado em:</strong> ' + (d.data_hora_assinatura || d.criado_em || '—') + '</p>' +
    '</body></html>'

  MailApp.sendEmail({
    to:          EMAIL_INSTRUTOR,
    subject:     '📝 Contrato assinado — ' + nome + ' · R$ ' + total,
    htmlBody:    corpo,
    name:        'Sistema de Contratos · Barbearia na Palma da Mão',
    attachments: pdf ? [pdf] : []
  })
}

// ─── CLÁUSULAS DA PLANILHA ────────────────────────────────
function getClausesFromSheet() {
  var ss = SpreadsheetApp.openById(getSheetId())
  var sh = ss.getSheetByName(CLAUSULAS_TAB)
  if (!sh) { initClausulasTab(); sh = ss.getSheetByName(CLAUSULAS_TAB) }

  var rows = sh.getDataRange().getValues()
  var result = {}
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] && rows[i][1]) result[rows[i][0]] = rows[i][1]
  }

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON)
}

// ─── ENTREGÁVEIS DA PLANILHA ──────────────────────────────
function getEntregaveisFromSheet() {
  var ss = SpreadsheetApp.openById(getSheetId())
  var sh = ss.getSheetByName(ENTREGAVEIS_TAB)
  if (!sh) { initEntregaveisTab(); sh = ss.getSheetByName(ENTREGAVEIS_TAB) }

  var rows = sh.getDataRange().getValues()
  var result = []
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0]) result.push(rows[i][0])
  }

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON)
}

// ─── INICIALIZAR ABA DE CLÁUSULAS ────────────────────────
function initClausulasTab() {
  var ss = SpreadsheetApp.openById(getSheetId())
  var sh = ss.getSheetByName(CLAUSULAS_TAB) || ss.insertSheet(CLAUSULAS_TAB)

  sh.clearContents()
  sh.appendRow(['ID Clausula', 'Texto'])

  var clausulas = [
    ['1.1', 'O curso Barbearia na Palma da Mão é ministrado integralmente na modalidade online, com acesso vitalício à plataforma de ensino.'],
    ['1.2', 'O curso é composto por 6 (seis) módulos práticos em vídeo, incluindo: técnicas de máquina, tesoura, navalha, degradê, higiene e biossegurança, e negócio/atendimento.'],
    ['1.3', 'O(A) aluno(a) terá acesso ao material imediatamente após a confirmação do pagamento.'],
    ['1.4', 'Novas aulas e atualizações de conteúdo, quando disponibilizadas, serão incluídas sem custo adicional.'],
    ['2.1', 'O valor total do curso é de R$ 67,00 (pagamento único).'],
    ['2.2', 'O pagamento dá direito ao acesso vitalício ao curso e a todos os materiais complementares disponibilizados pelo instrutor.'],
    ['3.1', 'O(A) aluno(a) tem direito a reembolso integral de 100% do valor pago no prazo de até 7 (sete) dias corridos após a data de compra, sem necessidade de justificativa (garantia incondicional).'],
    ['3.2', 'O pedido de reembolso deve ser realizado pelo mesmo canal de atendimento pelo qual foi feita a compra, dentro do prazo estabelecido na cláusula 3.1.'],
    ['4.1', 'Todo o conteúdo do curso (vídeos, materiais, apostilas) é de propriedade exclusiva de Willy San e protegido por direitos autorais (Lei 9.610/1998).'],
    ['4.2', 'É expressamente proibido reproduzir, distribuir, vender, copiar ou disponibilizar o conteúdo do curso para terceiros, sob qualquer forma.'],
    ['5.1', 'O certificado de conclusão do curso Barbearia na Palma da Mão será emitido ao(à) aluno(a) que concluir integralmente todos os 6 (seis) módulos.'],
    ['6.1', 'Fica eleito o foro da Comarca de São Paulo/SP para dirimir quaisquer controvérsias oriundas deste contrato.'],
    ['6.3', 'As partes declaram ter lido, entendido e concordado livremente com todos os termos deste instrumento, assinando-o de forma eletrônica com plena validade jurídica, conforme MP 2.200-2/2001 e Lei 14.063/2020.']
  ]

  clausulas.forEach(function(row) { sh.appendRow(row) })
}

// ─── INICIALIZAR ABA DE ENTREGÁVEIS ──────────────────────
function initEntregaveisTab() {
  var ss = SpreadsheetApp.openById(getSheetId())
  var sh = ss.getSheetByName(ENTREGAVEIS_TAB) || ss.insertSheet(ENTREGAVEIS_TAB)

  sh.clearContents()
  sh.appendRow(['Item'])

  var entregaveis = [
    ['Módulo 1 — Máquina: tipos, regulagem e técnicas de corte'],
    ['Módulo 2 — Tesoura: técnicas de corte e finalização'],
    ['Módulo 3 — Degradê e navalhados: do clássico ao moderno'],
    ['Módulo 4 — Barba: design, navalha e acabamento profissional'],
    ['Módulo 5 — Higiene e biossegurança na barbearia'],
    ['Módulo 6 — Negócio e atendimento: precificação, fidelização e gestão básica'],
    ['Apostila oficial em PDF com técnicas e referências visuais'],
    ['Certificado de conclusão após finalizar todos os módulos'],
    ['Acesso vitalício — aulas disponíveis 24h, assista quando quiser'],
    ['Suporte via WhatsApp com o Willy San']
  ]

  entregaveis.forEach(function(row) { sh.appendRow(row) })
}

// ─── SETUP INICIAL (rodar UMA vez) ───────────────────────
function setupInicial() {
  var id  = getSheetId()
  var ss  = SpreadsheetApp.openById(id)
  var url = ss.getUrl()

  initClausulasTab()
  initEntregaveisTab()

  var sh = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME)
  if (sh.getLastRow() === 0) {
    sh.appendRow([
      'Criado em','Nome','Nome Assinatura','CPF','RG','Data Nasc',
      'Email','WhatsApp','Instagram','Estado Civil',
      'Endereco','Bairro','Cidade','Estado','CEP',
      'Curso','Modalidade','Forma Pagamento',
      'Valor Total','Observacoes','Data Hora Assinatura'
    ])
    sh.setFrozenRows(1)
  }

  Logger.log('===========================================')
  Logger.log('✅ Setup concluído!')
  Logger.log('📊 Planilha: ' + url)
  Logger.log('===========================================')

  return 'Setup OK — planilha: ' + url
}
