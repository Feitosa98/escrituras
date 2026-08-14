const nodemailer = require('nodemailer');

let transporter;

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function getEmailConfig() {
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  if (!process.env.SMTP_HOST || !from) return null;

  return {
    from,
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE).toLowerCase() === 'true',
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  };
}

function getTransporter(config) {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.user ? { user: config.user, pass: config.pass } : undefined,
    });
  }
  return transporter;
}

async function sendEscrituraStatusEmail(escritura, { includeCredentials = false } = {}) {
  if (!escritura?.email_cliente) {
    return { sent: false, reason: 'CLIENT_EMAIL_MISSING' };
  }
  if (!escritura?.acompanhamento_codigo || !escritura?.senha_cliente) {
    return { sent: false, reason: 'TRACKING_NOT_AVAILABLE' };
  }

  const config = getEmailConfig();
  if (!config) {
    console.warn('E-mail não enviado: configure SMTP_HOST e SMTP_FROM (ou SMTP_USER).');
    return { sent: false, reason: 'SMTP_NOT_CONFIGURED' };
  }

  const consultaUrl = process.env.APP_PUBLIC_URL || 'http://localhost:3001/#/consulta';
  const credentialsHtml = includeCredentials
    ? `
      <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:16px;margin:20px 0">
        <p style="margin:0 0 8px"><strong>Código de acompanhamento:</strong> ${escapeHtml(escritura.acompanhamento_codigo)}</p>
        <p style="margin:0"><strong>Senha de acesso:</strong> ${escapeHtml(escritura.senha_cliente)}</p>
      </div>`
    : '';

  try {
    const info = await getTransporter(config).sendMail({
      from: config.from,
      to: escritura.email_cliente,
      replyTo: process.env.SMTP_REPLY_TO || undefined,
      subject: `Atualização do acompanhamento ${escritura.acompanhamento_codigo}`,
      text: [
        'Cartório Santiago',
        `Código de acompanhamento: ${escritura.acompanhamento_codigo}`,
        includeCredentials ? `Senha de acesso: ${escritura.senha_cliente}` : null,
        `Status atual: ${escritura.status}`,
        `Consulte o andamento em: ${consultaUrl}`,
        '',
        'Este e-mail é destinado exclusivamente às mensagens automáticas dos Sistemas do Cartório Santiago.',
        'Para informações, entre em contato:',
        'E-mail: contato@tabelionatomanacapuru.com.br',
        'Geral: (92) 9187-2923',
        'Setor de Escrituras: (92) 9405-9578',
        'Setor de Protesto: (92) 9506-2413',
      ].filter(Boolean).join('\n'),
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#0f172a">
          <h2 style="color:#1e3a5f">Cartório Santiago</h2>
          <p>Olá,</p>
          <p>O andamento do seu ato notarial foi atualizado.</p>
          <p><strong>Status atual:</strong> ${escapeHtml(escritura.status)}</p>
          ${credentialsHtml}
          <p><a href="${escapeHtml(consultaUrl)}" style="color:#2563eb">Consultar acompanhamento do ato</a></p>
          <div style="margin-top:24px;padding-top:16px;border-top:1px solid #e2e8f0;font-size:12px;line-height:1.7;color:#64748b">
            <strong>Mensagem automática dos Sistemas do Cartório Santiago</strong><br>
            Este endereço é destinado exclusivamente às mensagens automáticas dos sistemas.<br>
            Para informações, entre em contato:<br>
            E-mail: <a href="mailto:contato@tabelionatomanacapuru.com.br" style="color:#2563eb">contato@tabelionatomanacapuru.com.br</a><br>
            Geral: <a href="tel:+559291872923" style="color:#2563eb">(92) 9187-2923</a><br>
            Setor de Escrituras: <a href="tel:+559294059578" style="color:#2563eb">(92) 9405-9578</a><br>
            Setor de Protesto: <a href="tel:+559295062413" style="color:#2563eb">(92) 9506-2413</a>
          </div>
        </div>`,
    });

    return { sent: true, messageId: info.messageId };
  } catch (error) {
    console.error('Erro ao enviar atualização por e-mail:', error.message);
    return { sent: false, reason: 'SEND_FAILED' };
  }
}

module.exports = { sendEscrituraStatusEmail };
