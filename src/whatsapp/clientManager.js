const { Client, NoAuth } = require("whatsapp-web.js");

function createTempClient(operator, requestId) {

  console.log("");
  console.log("====================================================");
  console.log(`${requestId} - 🚀 CRIANDO CLIENT WHATSAPP`);
  console.log(`${requestId} - 👤 Operator: ${operator}`);
  console.log(`${requestId} - 🕐 ${new Date().toISOString()}`);
  console.log("====================================================");

  const client = new Client({
    authStrategy: new NoAuth(),

    puppeteer: {
      headless: true,

      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage"
      ]
    }
  });

  client._state = {
    ready: false,
    qr: null,
    qrAt: null
  };


  // ==================================================
  // LOADING SCREEN
  // ==================================================

  client.on("loading_screen", (percent, message) => {

    console.log(
      `${requestId} - ⏳ loading_screen`
    );

    console.log(
      `${requestId} -    percent: ${percent}`
    );

    console.log(
      `${requestId} -    message: ${message}`
    );

  });


  // ==================================================
  // QR
  // ==================================================

  client.on("qr", qr => {

    console.log("");
    console.log(`${requestId} - 📸 ================= QR =================`);
    console.log(`${requestId} - QR recebido`);
    console.log(`${requestId} - QR tamanho: ${qr ? qr.length : 0}`);
    console.log(`${requestId} - QR primeiros caracteres: ${qr ? qr.substring(0, 30) : "NULL"}`);
    console.log(`${requestId} - ============================================`);
    console.log("");

    client._state.qr = qr;
    client._state.qrAt = Date.now();

  });


  // ==================================================
  // AUTHENTICATED
  // ==================================================

  client.on("authenticated", () => {

    console.log("");
    console.log(`${requestId} - 🔐 ================= AUTH =================`);
    console.log(`${requestId} - WhatsApp AUTHENTICATED`);
    console.log(`${requestId} - operator: ${operator}`);
    console.log(`${requestId} - ============================================`);
    console.log("");

  });


  // ==================================================
  // AUTH FAILURE
  // ==================================================

  client.on("auth_failure", msg => {

    console.log("");
    console.log(`${requestId} - ❌ ============== AUTH FAILURE ==============`);
    console.log(`${requestId} - operator: ${operator}`);
    console.log(`${requestId} - mensagem: ${msg}`);
    console.log(`${requestId} - ============================================`);
    console.log("");

    client._state.ready = false;

  });


  // ==================================================
  // READY
  // ==================================================

  client.on("ready", () => {

    console.log("");
    console.log(`${requestId} - ✅ ================= READY =================`);
    console.log(`${requestId} - WHATSAPP ESTÁ PRONTO`);
    console.log(`${requestId} - operator: ${operator}`);
    console.log(`${requestId} - =============================================`);
    console.log("");

    client._state.ready = true;

    try {

      console.log(
        `${requestId} - client.info:`,
        client.info
      );

    } catch (e) {

      console.error(
        `${requestId} - ❌ Erro lendo client.info`
      );

      console.error(e);

    }

  });


  // ==================================================
  // DISCONNECTED
  // ==================================================

  client.on("disconnected", reason => {

    console.log("");
    console.log(`${requestId} - 🔌 ============ DISCONNECTED ============`);
    console.log(`${requestId} - reason: ${reason}`);
    console.log(`${requestId} - operator: ${operator}`);
    console.log(`${requestId} - =========================================`);
    console.log("");

    client._state.ready = false;

  });


  // ==================================================
  // CHANGE STATE
  // ==================================================

  client.on("change_state", state => {

    console.log(
      `${requestId} - 🔄 change_state: ${state}`
    );

  });


  // ==================================================
  // MESSAGE ACK
  // ==================================================

  client.on("message_ack", (message, ack) => {

    console.log(
      `${requestId} - 📩 message_ack`
    );

    console.log(
      `${requestId} -    message: ${message?.id?.id}`
    );

    console.log(
      `${requestId} -    ack: ${ack}`
    );

  });


  // ==================================================
  // ERROR
  // ==================================================

  client.on("error", error => {

    console.error("");
    console.error(`${requestId} - 💥 ================= ERROR =================`);
    console.error(`${requestId} - WhatsApp client error`);
    console.error(error);
    console.error(`${requestId} - ============================================`);
    console.error("");

  });


  // ==================================================
  // INITIALIZE
  // ==================================================

  console.log("");
  console.log(`${requestId} - ⚙️ Chamando client.initialize()...`);
  console.log(`${requestId} - NoAuth: SIM`);
  console.log(`${requestId} - headless: true`);
  console.log(`${requestId} - Puppeteer configurado`);
  console.log("");

  client.initialize()
    .then(() => {

      console.log("");
      console.log(
        `${requestId} - ✅ client.initialize() RESOLVEU`
      );
      console.log("");

    })
    .catch(error => {

      console.error("");
      console.error(
        `${requestId} - ❌ client.initialize() FALHOU`
      );

      console.error(
        `${requestId} - error.name:`,
        error?.name
      );

      console.error(
        `${requestId} - error.message:`,
        error?.message
      );

      console.error(
        `${requestId} - error.stack:`,
        error?.stack
      );

      console.error(
        `${requestId} - error completo:`,
        error
      );

      console.error("");

    });


  console.log(
    `${requestId} - 📤 createTempClient() retornando client`
  );

  return client;
}


async function waitForReady(client, timeoutMs = 120_000) {

  console.log("");
  console.log("====================================================");
  console.log("⏳ WAIT FOR READY");
  console.log("====================================================");

  console.log(
    `ready atual: ${client?._state?.ready}`
  );

  console.log(
    `qr existe: ${!!client?._state?.qr}`
  );

  console.log(
    `qrAt: ${client?._state?.qrAt}`
  );


  if (client._state.ready) {

    console.log(
      "✅ Client já estava READY"
    );

    return true;
  }


  return new Promise((resolve, reject) => {

    console.log(
      `⏰ Timeout configurado: ${timeoutMs}ms`
    );


    const timer = setTimeout(() => {

      console.error("");
      console.error("====================================================");
      console.error("⏰ TIMEOUT WAIT FOR READY");
      console.error("====================================================");

      console.error(
        `ready: ${client?._state?.ready}`
      );

      console.error(
        `qr existe: ${!!client?._state?.qr}`
      );

      console.error(
        `qrAt: ${client?._state?.qrAt}`
      );

      console.error("Destruindo client...");

      client.destroy()
        .then(() => {
          console.log("Client destruído após timeout");
        })
        .catch(err => {
          console.error(
            "Erro destruindo client:",
            err
          );
        });

      reject(
        new Error("QR não escaneado a tempo")
      );

    }, timeoutMs);


    const onReady = () => {

      console.log("");
      console.log("====================================================");
      console.log("🎉 EVENTO READY RECEBIDO");
      console.log("====================================================");

      clearTimeout(timer);

      resolve(true);

    };


    client.once("ready", onReady);

  });
}


module.exports = {
  createTempClient,
  waitForReady
};