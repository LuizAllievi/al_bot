const { Client, NoAuth } = require("whatsapp-web.js");

function createTempClient(operator, requestId) {
  const client = new Client({
    authStrategy: new NoAuth(), // 🔹 nunca salva sessão
    puppeteer: { headless: true },
  });

  client._state = { ready: false, qr: null, qrAt: null };

  client.on("qr", qr => {
    client._state.qr = qr;
    client._state.qrAt = Date.now();
    console.log(`${requestId} -  📸 QR atualizado (${operator})`);
  });

  client.on("ready", () => {
    client._state.ready = true;
    console.log(`${requestId} - ✅ Client pronto (${operator})`);
  });

  client.on("auth_failure", () => {
    console.log(`${requestId} - ❌ Auth failure (${operator})`);
    client._state.ready = false;
  });

  client.on("disconnected", () => {
    console.log(`${requestId} - 🔌 Client desconectado (${operator})`);
    client._state.ready = false;
  });

  client.initialize();
  return client;
}

async function waitForReady(client, timeoutMs = 120_000) {
  if (client._state.ready) return true;

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      client.destroy().catch(() => {});
      reject(new Error("QR não escaneado a tempo"));
    }, timeoutMs);

    const onReady = () => {
      clearTimeout(timer);
      resolve(true);
    };

    client.once("ready", onReady);
  });
}

module.exports = { createTempClient, waitForReady };