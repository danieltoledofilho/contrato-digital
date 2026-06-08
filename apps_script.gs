// ================================================================
// CONTRATO DIGITAL — Google Apps Script
// Webhook permanente: salva no Sheets + envia email com PDF anexado
// PDF gerado no browser (html2pdf.js) e enviado como base64
// Nunca expira, sem tokens, sem n8n, sem dependencias externas
// ================================================================

// ================================================================
// >> CONFIGURACAO — altere somente esta secao <<
// ================================================================
var SHEET_ID          = 'COLE_O_ID_DA_SUA_PLANILHA_AQUI';
var EMAIL_INSTRUTOR   = 'seu-email@gmail.com';
var NOME_INSTRUTOR    = 'Seu Nome Completo';
var NOME_CURSO        = 'Nome do Seu Curso';
var WHATSAPP_NUM      = '5511999999999';   // somente numeros, com DDI e DDD
var WHATSAPP_DISPLAY  = '(11) 99999-9999';
var CIDADE_FORO       = 'Sao Paulo/SP';
// ================================================================

var SHEET_NAME      = 'Contratos';
var CLAUSULAS_TAB   = 'Clausulas';
var ENTREGAVEIS_TAB = 'Entregaveis';

// ---------------------------------------------------------------
// ROTEAMENTO
// ---------------------------------------------------------------

function doGet(e) {
  var action = e && e.parameter ? e.parameter.action : '';
  if (action === 'getClauses')     return getClausesFromSheet();
  if (action === 'getEntregaveis') return getEntregaveisFromSheet();
  return ContentService
    .createTextOutput(JSON.stringify({ok: true, servico: 'Contrato Digital API'}))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    salvarNoSheets(body);
    var pdfBlob = gerarPDFBlob(body);
    if (body.email) enviarEmailAluno(body, pdfBlob);
    enviarEmailInstrutor(body, pdfBlob);
    return ContentService
      .createTextOutput(JSON.stringify({ok: true, pdf: pdfBlob !== null}))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ok: false, error: err.message}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ---------------------------------------------------------------
// PDF — recebe base64 gerado pelo browser (html2pdf.js)
// Nao precisa de DocumentApp, DriveApp nem autorizacao adicional
// ---------------------------------------------------------------

function gerarPDFBlob(d) {
  if (!d.pdf_base64) return null;
  var nome = (d.nome || 'Aluno').replace(/[^a-zA-Z0-9 ]/g, '').trim();
  return Utilities.newBlob(
    Utilities.base64Decode(d.pdf_base64),
    'application/pdf',
    NOME_CURSO.replace(/\s+/g, '_') + '_' + nome.replace(/\s+/g, '_') + '.pdf'
  );
}

// ---------------------------------------------------------------
// SHEETS
// ---------------------------------------------------------------

function salvarNoSheets(d) {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sheet = ss.getSheetByName(SHEET_NAME);
  var headers = [
    'Criado em', 'Nome', 'Nome Assinatura', 'CPF', 'RG', 'Data Nasc',
    'Email', 'WhatsApp', 'Instagram', 'Estado Civil',
    'Endereco', 'Bairro', 'Cidade', 'Estado', 'CEP',
    'Curso', 'Modalidade', 'Data Curso', 'Forma Pagamento',
    'Matricula', 'Saldo', 'Valor Total', 'Observacoes', 'Data Hora Assinatura'
  ];

  if (sheet) {
    var existingHeaders = sheet.getRange(1, 1, 1, Math.min(sheet.getLastColumn(), headers.length)).getValues()[0];
    if (existingHeaders[0] !== 'Criado em' || existingHeaders[2] !== 'Nome Assinatura') {
      ss.deleteSheet(sheet);
      sheet = null;
    }
  }
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setBackground('#111111').setFontColor('#ffffff').setFontWeight('bold');
  }

  var row = [
    d.criado_em || new Date().toLocaleString('pt-BR'),
    d.nome || '', d.nome_assinatura || '', d.cpf || '', d.rg || '', d.data_nasc || '',
    d.email || '', d.whatsapp || '', d.instagram || '', d.estado_civil || '',
    d.endereco || '', d.bairro || '', d.cidade || '', d.estado || '', d.cep || '',
    d.curso || NOME_CURSO, d.modalidade || '', d.data_curso_fmt || d.data_curso || '',
    d.forma_pagamento || '', d.matricula_paga || '', d.saldo || '', d.valor_total || '',
    d.observacoes || '', d.data_hora_assinatura || ''
  ];

  sheet.getRange(sheet.getLastRow() + 1, 1, 1, row.length).setValues([row]);

  if (!ss.getSheetByName(CLAUSULAS_TAB))   initClausulasTab();
  if (!ss.getSheetByName(ENTREGAVEIS_TAB)) initEntregaveisTab();
}

// ---------------------------------------------------------------
// CLAUSULAS (editaveis pelo instrutor diretamente no Sheets)
// ---------------------------------------------------------------

function getClausesFromSheet() {
  try {
    var ss = SpreadsheetApp.openById(SHEET_ID);
    var sheet = ss.getSheetByName(CLAUSULAS_TAB);
    if (!sheet) { initClausulasTab(); sheet = ss.getSheetByName(CLAUSULAS_TAB); }
    var data = sheet.getDataRange().getValues();
    var result = {};
    for (var i = 1; i < data.length; i++) {
      if (data[i][0]) result[data[i][0]] = data[i][1] || '';
    }
    return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({})).setMimeType(ContentService.MimeType.JSON);
  }
}

function initClausulasTab() {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sheet = ss.insertSheet(CLAUSULAS_TAB);
  sheet.getRange(1,1,1,3).setValues([['ID','Texto','Observacao']]);
  sheet.getRange(1,1,1,3).setBackground('#111111').setFontColor('#ffffff').setFontWeight('bold');
  var clausulas = [
    ['1.1', 'O curso tem duracao de 1 (um) dia, com carga horaria de 7 horas.', 'Descricao basica'],
    ['1.2', 'O curso possui carater intensivo e pratico.', 'Formato'],
    ['2.1', 'O valor total e conforme descrito neste contrato.', 'Valor'],
    ['2.2', 'A matricula paga nao sera reembolsada em caso de desistencia.', 'Matricula'],
    ['3.1', 'Cancelamento com 15+ dias: devolucao com desconto da matricula.', 'Cancelamento'],
    ['3.2', 'Cancelamento com menos de 15 dias: retencao integral dos valores.', 'Cancelamento tardio'],
    ['4.1', 'As partes elegem o foro da comarca de ' + CIDADE_FORO + '.', 'Foro']
  ];
  sheet.getRange(2, 1, clausulas.length, 3).setValues(clausulas);
  sheet.setColumnWidth(1, 80);
  sheet.setColumnWidth(2, 500);
  sheet.setColumnWidth(3, 200);
}

// ---------------------------------------------------------------
// ENTREGAVEIS (editaveis pelo instrutor diretamente no Sheets)
// ---------------------------------------------------------------

function getEntregaveisFromSheet() {
  try {
    var ss = SpreadsheetApp.openById(SHEET_ID);
    var sheet = ss.getSheetByName(ENTREGAVEIS_TAB);
    if (!sheet) { initEntregaveisTab(); sheet = ss.getSheetByName(ENTREGAVEIS_TAB); }
    var data = sheet.getDataRange().getValues();
    var itens = [];
    for (var i = 1; i < data.length; i++) {
      if (data[i][1]) itens.push(data[i][1]);
    }
    return ContentService.createTextOutput(JSON.stringify(itens)).setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify([])).setMimeType(ContentService.MimeType.JSON);
  }
}

function initEntregaveisTab() {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sheet = ss.insertSheet(ENTREGAVEIS_TAB);
  sheet.getRange(1,1,1,2).setValues([['Ordem','Entregavel']]);
  sheet.getRange(1,1,1,2).setBackground('#111111').setFontColor('#ffffff').setFontWeight('bold');
  var itens = [
    [1, 'Tecnica 1 — descreva o que o aluno vai aprender'],
    [2, 'Tecnica 2 — descreva o que o aluno vai aprender'],
    [3, 'Certificado de conclusao emitido pelo instrutor']
  ];
  sheet.getRange(2, 1, itens.length, 2).setValues(itens);
  sheet.setColumnWidth(1, 60);
  sheet.setColumnWidth(2, 500);
}

function buscarEntregaveis() {
  try {
    var ss = SpreadsheetApp.openById(SHEET_ID);
    var sheet = ss.getSheetByName(ENTREGAVEIS_TAB);
    if (!sheet) return [];
    var data = sheet.getDataRange().getValues();
    var itens = [];
    for (var i = 1; i < data.length; i++) {
      if (data[i][1]) itens.push(data[i][1]);
    }
    return itens;
  } catch(e) { return []; }
}

// ---------------------------------------------------------------
// HTML DO CONTRATO (usado no corpo dos emails)
// ---------------------------------------------------------------

function gerarContratoHTML(d) {
  var entregaveis = buscarEntregaveis();
  var blocoEntregaveis = '';
  if (entregaveis.length) {
    blocoEntregaveis = '<div style="background:#f0f8f0;border:1px solid #c3e6c3;border-radius:6px;padding:14px 18px;margin:16px 0">'
      + '<p style="font-size:10pt;font-weight:700;text-transform:uppercase;color:#2d6a2d;margin:0 0 8px">O que voce vai aprender</p>'
      + '<ul style="margin:0;padding-left:20px;font-size:11pt;line-height:1.8">';
    for (var i = 0; i < entregaveis.length; i++) {
      blocoEntregaveis += '<li>' + entregaveis[i] + '</li>';
    }
    blocoEntregaveis += '</ul></div>';
  }

  var assinaturaBloco = d.assinatura
    ? '<img src="' + d.assinatura + '" style="max-width:220px;border:1px solid #eee;border-radius:4px;padding:6px;display:block;margin:0 auto"/>'
    : '<p style="color:#555;font-size:11pt">Assinatura digital registrada em ' + (d.data_hora_assinatura || '') + '</p>';

  return '<div style="font-family:Georgia,serif;max-width:680px;margin:0 auto;color:#222;font-size:13pt;line-height:1.7">'
    + '<div style="text-align:center;border-bottom:2px solid #333;padding-bottom:16px;margin-bottom:20px">'
    + '<h2 style="margin:0;font-size:15pt;text-transform:uppercase">' + NOME_INSTRUTOR + '</h2>'
    + '<p style="font-size:10pt;color:#666;margin:4px 0 0">Contrato de Prestacao de Servicos Educacionais — ' + NOME_CURSO + '</p>'
    + '</div>'
    + '<p><strong>CONTRATANTE:</strong> ' + (d.nome||'') + ', CPF ' + (d.cpf||'') + '. E-mail: ' + (d.email||'') + '. WhatsApp: ' + (d.whatsapp||'') + '.</p>'
    + '<div style="background:#f9f7f2;border:1px solid #e8d9b5;border-radius:6px;padding:14px 18px;margin:16px 0;font-size:12pt">'
    + '<p style="font-size:9pt;font-weight:700;text-transform:uppercase;color:#888;margin:0 0 8px">Dados do Curso</p>'
    + '<table style="width:100%;font-size:11pt;border-collapse:collapse">'
    + '<tr><td style="color:#888;width:150px;padding:3px 0">Curso</td><td style="font-weight:700">' + (d.curso||NOME_CURSO) + '</td></tr>'
    + (d.modalidade ? '<tr><td style="color:#888;padding:3px 0">Modalidade</td><td>' + d.modalidade + '</td></tr>' : '')
    + '<tr><td style="color:#888;padding:3px 0">Data</td><td>' + (d.data_curso_fmt||d.data_curso||'') + '</td></tr>'
    + '<tr><td style="color:#888;padding:3px 0">Forma de pag.</td><td>' + (d.forma_pagamento||'') + '</td></tr>'
    + (d.matricula_paga ? '<tr><td style="color:#888;padding:3px 0">Matricula paga</td><td>R$ ' + d.matricula_paga + '</td></tr>' : '')
    + (d.saldo ? '<tr><td style="color:#888;padding:3px 0">Saldo restante</td><td>R$ ' + d.saldo + '</td></tr>' : '')
    + '<tr style="border-top:2px solid #ccc"><td style="font-weight:700;padding:5px 0">Valor total</td><td style="font-weight:700;font-size:13pt">R$ ' + (d.valor_total||'') + '</td></tr>'
    + '</table></div>'
    + blocoEntregaveis
    + '<div style="margin-top:36px;text-align:center">'
    + '<p style="color:#555;font-size:11pt">Sao Paulo, ' + (d.data_hora_assinatura||d.criado_em||'') + '</p>'
    + assinaturaBloco
    + '<div style="border-top:1px solid #333;margin:14px auto;width:260px"></div>'
    + '<p style="margin:4px 0;font-size:12pt"><strong>' + (d.nome_assinatura||d.nome||'') + '</strong></p>'
    + '<p style="color:#888;font-size:10pt">CPF: ' + (d.cpf||'') + '</p>'
    + '</div></div>';
}

// ---------------------------------------------------------------
// EMAILS
// ---------------------------------------------------------------

function enviarEmailAluno(d, pdfBlob) {
  var contratoHTML = gerarContratoHTML(d);
  var html = '<div style="font-family:Arial,sans-serif;max-width:660px;margin:0 auto">'
    + '<div style="background:#111;padding:18px 24px"><h2 style="color:#fff;margin:0;font-size:1rem">Contrato assinado com sucesso!</h2></div>'
    + '<div style="padding:22px 24px;background:#fff;border:1px solid #e0e0e0">'
    + '<p style="color:#555">Ola, <strong>' + (d.nome||'') + '</strong>! Seu contrato esta anexado em PDF a este e-mail.</p>'
    + '<div style="border:1px solid #e8d9b5;border-radius:8px;padding:18px;background:#fffdfb;margin-top:18px">' + contratoHTML + '</div>'
    + '<p style="color:#555;font-size:13px;margin-top:18px">Duvidas? Fale pelo WhatsApp: <strong>' + WHATSAPP_DISPLAY + '</strong></p>'
    + '</div></div>';

  var params = {to: d.email, subject: 'Contrato assinado — ' + NOME_CURSO, htmlBody: html};
  if (pdfBlob) params.attachments = [pdfBlob];
  MailApp.sendEmail(params);
}

function enviarEmailInstrutor(d, pdfBlob) {
  var contratoHTML = gerarContratoHTML(d);
  var html = '<div style="font-family:Arial,sans-serif;max-width:660px;margin:0 auto">'
    + '<div style="background:#111;padding:16px 22px"><h2 style="color:#fff;margin:0;font-size:1rem">Novo contrato assinado</h2></div>'
    + '<div style="padding:20px 22px;background:#fff;border:1px solid #e0e0e0">'
    + '<table style="width:100%;font-size:13px;border-collapse:collapse;margin-bottom:18px">'
    + '<tr style="background:#f5f5f5"><td style="padding:7px;font-weight:700;width:120px">Nome</td><td style="padding:7px">' + (d.nome||'') + '</td></tr>'
    + '<tr><td style="padding:7px;font-weight:700">CPF</td><td style="padding:7px">' + (d.cpf||'') + '</td></tr>'
    + '<tr style="background:#f5f5f5"><td style="padding:7px;font-weight:700">WhatsApp</td><td style="padding:7px">' + (d.whatsapp||'') + '</td></tr>'
    + '<tr><td style="padding:7px;font-weight:700">Email</td><td style="padding:7px">' + (d.email||'') + '</td></tr>'
    + '<tr style="background:#f5f5f5"><td style="padding:7px;font-weight:700">Data curso</td><td style="padding:7px">' + (d.data_curso_fmt||d.data_curso||'') + '</td></tr>'
    + '<tr><td style="padding:9px;font-weight:700;font-size:14px">TOTAL</td><td style="padding:9px;font-weight:700;font-size:16px">R$ ' + (d.valor_total||'') + '</td></tr>'
    + '</table>'
    + '<div style="border:1px solid #e8d9b5;border-radius:8px;padding:18px;background:#fffdfb">' + contratoHTML + '</div>'
    + '</div></div>';

  var params = {to: EMAIL_INSTRUTOR, subject: 'NOVO CONTRATO — ' + (d.nome||'') + ' | ' + (d.data_curso_fmt||d.data_curso||''), htmlBody: html};
  if (pdfBlob) params.attachments = [pdfBlob];
  MailApp.sendEmail(params);
}
