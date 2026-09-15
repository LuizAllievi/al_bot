const { Router } = require("express");
const { createTempClient } = require("../whatsapp/clientManager");
const { parseCSV } = require("../services/csv.service");
const { getTemplate } = require("../templates");
const crypto = require("crypto");
const { log, error } = require("../utils/logger");
const WAIT_BETWEEN_MESSAGES =  360000; // pega do .env

const router = Router();

router.post("/", async (req, res) => {
  const requestId = crypto.randomUUID().slice(0, 8);
  const start = Date.now();

  const { operator, message } = req.body;
  if (!operator || !message || !req.files?.file) {
    return res.status(400).json({ error: "operator, message e CSV obrigatórios" });
  }

  const templateFn = getTemplate(message);
  if (!templateFn) {
    return res.status(400).json({ error: `Template '${message}' não encontrado ` });
  }

  // 🔹 cria client temporário (NoAuth)
  const client = createTempClient(operator, requestId);

  // 🔹 espera o primeiro QR ser gerado
  const qr = await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("QR não gerado a tempo")), 60000);

    client.once("qr", qr => {
      clearTimeout(timeout);
      resolve(qr);
    });
  });

  // 🔹 envia o QR pro front
  res.status(202).json({
    status: "qr_required",
    operator,
    qr,
    expiresIn: 40,
    requestId,
  });

  // 🔹 aguarda leitura do QR (ready) e dispara mensagens
  client.once("ready", async () => {
    log(`${requestId}✅ QR escaneado, iniciando disparo`);
    const rows = parseCSV(req.files.file.data);
    let enviados = 0;

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      let payloads;
      try {
        payloads = await templateFn(row); // retorna array
      } catch (err) {
        error(requestId, `Erro template linha ${i}`, err.message);
        continue;
      }

      if (!payloads || !payloads.length) continue;

      for (let j = 0; j < payloads.length; j++) {
        const p = payloads[j];
        try {
          if (p.type === "text") {
            await client.sendMessage(p.to, p.body);
          } else if (p.type === "media") {
            await client.sendMessage(p.to, p.media);
          }
          enviados++;
          console.log(
  			`${requestId} - [${getTime()}] Linha ${i}/${rows.length - 1} | item ${j + 1}/${payloads.length}`
			);
          await new Promise(r => setTimeout(r, 2000));
        } catch (err) {
          error(requestId, `Erro envio linha ${i} item ${j}`, err.message);
        }
      }
        await new Promise(r => setTimeout(r, WAIT_BETWEEN_MESSAGES));
    }


    log(`${requestId} - ✅ Disparo finalizado: ${rows.length - 1}/${rows.length - 1} mensagens`);
    client.destroy().catch(() => { });
  });
});

function getTime() {
  return new Date().toLocaleTimeString("pt-BR", { hour12: false });
}
module.exports = router;
