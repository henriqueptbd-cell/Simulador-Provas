const express = require('express');
const fs      = require('fs');
const path    = require('path');
const router  = express.Router();

const REPORT_FILE = path.join(__dirname, '../../reports.json');
const DEST_EMAIL  = process.env.REPORT_TO || 'henriqueptbd@gmail.com';

// Configura transporter só se as variáveis de SMTP estiverem definidas
let transporter = null;
if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
  try {
    const nodemailer = require('nodemailer');
    transporter = nodemailer.createTransport({
      host:   process.env.SMTP_HOST,
      port:   parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  } catch {
    console.warn('[report] nodemailer não disponível — relatos salvos localmente.');
  }
}

// POST /api/report
router.post('/', async (req, res) => {
  const { name, email, message, questionId } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Campos obrigatórios: name, email, message' });
  }

  const report = {
    date: new Date().toISOString(),
    questionId: questionId || 'N/A',
    name,
    email,
    message
  };

  // Salva localmente como registro (funciona sem SMTP)
  saveLocally(report);

  // Envia email se SMTP estiver configurado
  if (transporter) {
    try {
      await transporter.sendMail({
        from:    `"Simulado Provas" <${process.env.SMTP_USER}>`,
        to:      DEST_EMAIL,
        subject: `[Simulado Provas] Relato — Questão ${questionId || 'N/A'}`,
        text: `De: ${name} <${email}>\nQuestão: ${questionId || 'N/A'}\n\n${message}`,
        html: `
          <h2>Relato de Questão — Simulado Provas</h2>
          <p><strong>De:</strong> ${name} &lt;${email}&gt;</p>
          <p><strong>Questão:</strong> ${questionId || 'N/A'}</p>
          <hr>
          <p>${message.replace(/\n/g, '<br>')}</p>
        `
      });
    } catch (err) {
      console.error('[report] Erro ao enviar e-mail:', err.message);
      // Não retorna erro ao cliente — relato já foi salvo localmente
    }
  }

  res.json({ success: true });
});

function saveLocally(report) {
  let list = [];
  try {
    if (fs.existsSync(REPORT_FILE)) {
      list = JSON.parse(fs.readFileSync(REPORT_FILE, 'utf8'));
    }
  } catch {}
  list.push(report);
  fs.writeFileSync(REPORT_FILE, JSON.stringify(list, null, 2));
}

module.exports = router;
