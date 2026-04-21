const { Router } = require("express");
const { createTempClient } = require("../whatsapp/clientManager");
const { parseCSV } = require("../services/csv.service");
const { getTemplate } = require("../templates");
const crypto = require("crypto");
const { log, error } = require("../utils/logger");

const WAIT_BETWEEN_MESSAGES = 360000;

const router = Router();

router.post("/", async (req, res) => {
  const requestId = crypto.randomUUID().slice(0, 8);

  const { operator, message } = req.body;
  if (!operator || !message || !req.files?.file) {
    return res.status(400).json({ error: "operator, message e CSV obrigatórios" });
  }

  const templateFn = getTemplate(message);
  if (!templateFn) {
    return res.status(400).json({ error: `Template '${message}' não encontrado` });
  }

  const client = createTempClient(operator, requestId);

  let destroyed = false;

  const safeDestroy = async () => {
    if (destroyed) return;
    destroyed = true;

    try {
      await client.destroy().catch(() => {});
      if (client.pupBrowser) {
        await client.pupBrowser.close().catch(() => {});
      }
      log(`${requestId} 🔴 Client destruído`);
    } catch (err) {
      error(requestId, "Erro ao destruir client", err.message);
    }
  };

  // 🔹 eventos de falha
  client.once("auth_failure", async () => {
    error(requestId, "Falha de autenticação");
    await safeDestroy();
  });

  client.once("disconnected", async (reason) => {
    error(requestId, `Desconectado: ${reason}`);
    await safeDestroy();
  });

  // 🔹 espera QR com timeout
  let qr;

  try {
    qr = await new Promise((resolve, reject) => {
      const timeout = setTimeout(async () => {
        error(requestId, "QR não gerado a tempo, destruindo request");

        await safeDestroy();

        reject(new Error("QR não gerado a tempo, request destruída, tente novamente."));
      }, 15000);

      client.once("qr", qr => {
        clearTimeout(timeout);
        resolve(qr);
      });
    });
  } catch (err) {
    return res.status(408).json({
      error: err.message,
      requestId
    });
  }

  // 🔹 responde com QR
  res.status(202).json({
    status: "qr_required",
    operator,
    qr,
    expiresIn: 40,
    requestId,
  });

  // 🔹 quando conectar
  client.once("ready", async () => {
    log(`${requestId} ✅ QR escaneado, iniciando disparo`);

    const rows = parseCSV(req.files.file.data);
    let enviados = 0;

    for (let i = 1; i < rows.length; i++) {
      if (destroyed) break;

      const row = rows[i];
      let payloads;

      try {
        payloads = await templateFn(row);
      } catch (err) {
        error(requestId, `Erro template linha ${i}`, err.message);
        continue;
      }

      if (!payloads || !payloads.length) continue;

      for (let j = 0; j < payloads.length; j++) {
        if (destroyed) break;

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

          await delay(2000);
        } catch (err) {
          error(requestId, `Erro envio linha ${i} item ${j}`, err.message);
        }
      }

      await delay(WAIT_BETWEEN_MESSAGES);
    }

    log(`${requestId} ✅ Disparo finalizado: ${enviados}`);
    await safeDestroy();
  });
});

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getTime() {
  return new Date().toLocaleTimeString("pt-BR", { hour12: false });
}

module.exports = router;