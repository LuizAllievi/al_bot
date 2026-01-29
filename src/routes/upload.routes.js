const { Router } = require("express");
const {
  getClient,
  waitForReady,
  isQrValid,
  resetClient,
} = require("../whatsapp/clientManager");
const { parseCSV } = require("../services/csv.service");
const { getTemplate } = require("../templates");

const router = Router();
const crypto = require("crypto");
const { log, error } = require("../utils/logger");

router.post("/", async (req, res) => {
  const requestId = crypto.randomUUID().slice(0, 8);
  const start = Date.now();

  log(requestId, "📥 Nova requisição");

  const { operator, message } = req.body;

  if (!operator || !message) {
    error(requestId, "❌ operator ou message ausente");
    return res.status(400).json({ error: "operator e message obrigatórios" });
  }

  if (!req.files?.file) {
    error(requestId, "❌ CSV não enviado");
    return res.status(400).json({ error: "CSV não enviado" });
  }

  const templateFn = getTemplate(message);
  if (!templateFn) {
    error(requestId, `❌ Template '${message}' não encontrado`);
    return res.status(400).json({
      error: `Template '${message}' não encontrado`,
    });
  }

  log(requestId, "📄 Template carregado:", message);

  /* =====================================================
     🔹 O ponto crítico: getClient agora é async
  ===================================================== */
  let client = await getClient(operator);
  log(requestId, "🤖 Client obtido:", operator);

  // ========================================
  // 🔐 Sessão não autenticada
  // ========================================
  if (!client._state.ready) {
    log(requestId, "🔐 Sessão não autenticada");

    // QR expirado → resetar client
    if (!isQrValid(client)) {
      log(requestId, "♻️ QR expirado, resetando sessão");

      await resetClient(operator);
      client = await getClient(operator); // 🔹 await de novo

      return res.status(202).json({
        status: "qr_expired",
        message: "QR expirado, gere novamente",
        requestId,
      });
    }

    log(requestId, "📤 Retornando QR válido");
    return res.status(202).json({
      status: "qr_required",
      operator,
      qr: client._state.qr,
      expiresIn: 40,
      requestId,
    });
  }

  // ========================================
  // ✅ Sessão autenticada → processa CSV
  // ========================================
  let rows;
  try {
    rows = parseCSV(req.files.file.data);
    log(requestId, `📊 CSV carregado (${rows.length} linhas)`);
  } catch (err) {
    error(requestId, "❌ Erro ao parsear CSV", err.message);
    return res.status(400).json({ error: "CSV inválido" });
  }

  let enviados = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    let payload;

    try {
      payload = templateFn(row);
    } catch (err) {
      error(requestId, `❌ Template erro linha ${i}`, err.message);
      continue;
    }

    if (!payload?.to || !payload?.message) {
      log(requestId, `⚠️ Linha ${i} ignorada`);
      continue;
    }

    try {
      log(requestId, `📨 Enviando para ${payload.to}`);
      await client.sendMessage(payload.to, payload.message);
      enviados++;
      await new Promise(r => setTimeout(r, 2000)); // pausa entre mensagens
    } catch (err) {
      error(requestId, `❌ Erro envio linha ${i}`, err.message);
    }
  }

  log(
    requestId,
    `✅ Disparo finalizado: ${enviados}/${rows.length} em ${Date.now() - start}ms`
  );

  return res.json({
    status: "ok",
    operator,
    template: message,
    enviados,
    total: rows.length,
    duration_ms: Date.now() - start,
    requestId,
  });
});

module.exports = router;
