const { Client, LocalAuth } = require("whatsapp-web.js");

const clients = new Map();
const QR_MAX_AGE = 40 * 1000; // 40s (WhatsApp costuma expirar ~30s)

function createClient(operator) {
  const client = new Client({
    authStrategy: new LocalAuth({
      clientId: operator,
      dataPath: ".wwebjs_auth",
    }),
    puppeteer: {
      headless: true,
    },
  });

  client._state = {
    ready: false,
    qr: null,
    qrAt: null,
  };

  client.on("qr", qr => {
    client._state.qr = qr;
    client._state.qrAt = Date.now();
    console.log(`📸 QR atualizado (${operator})`);
  });

  client.on("ready", () => {
    client._state.ready = true;
    client._state.qr = null;
    client._state.qrAt = null;
    console.log(`✅ Client pronto (${operator})`);
  });

  client.on("auth_failure", () => {
    console.log(`❌ Auth failure (${operator})`);
    client._state.ready = false;
    client._state.qr = null;
    client._state.qrAt = null;
  });

  client.on("disconnected", () => {
    console.log(`🔌 Client desconectado (${operator})`);
    client._state.ready = false;
  });

  client.initialize();
  return client;
}

function getClient(operator) {
  if (!clients.has(operator)) {
    console.log(`🤖 Criando client (${operator})`);
    clients.set(operator, createClient(operator));
  }
  return clients.get(operator);
}

function isQrValid(client) {
  if (!client._state.qr || !client._state.qrAt) return false;
  return Date.now() - client._state.qrAt < QR_MAX_AGE;
}

async function resetClient(operator) {
  const client = clients.get(operator);
  if (!client) return;

  console.log(`♻️ Resetando client (${operator})`);

  try {
    await client.destroy();
  } catch (err) {
    console.warn("Erro ao destruir client:", err.message);
  }

  clients.delete(operator);
}

function waitForReady(client, timeoutMs = 120000) {
  if (client._state.ready) return Promise.resolve(true);

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error("QR timeout"));
    }, timeoutMs);

    const onReady = () => {
      cleanup();
      resolve(true);
    };

    function cleanup() {
      clearTimeout(timeout);
      client.off("ready", onReady);
    }

    client.on("ready", onReady);
  });
}

module.exports = {
  getClient,
  waitForReady,
  isQrValid,
  resetClient,
};
