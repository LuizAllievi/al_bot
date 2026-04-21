const { createMediaFromUrl } = require("./enviar_arquivo"); // função para baixar arquivos e criar Media
const API_HOST = process.env.API_HOST || "https://localhost:8443"; // pega do .env


module.exports = async (row) => {
  const telefoneRaw = row[3];
  if (!telefoneRaw) return [];

  const telefones = telefoneRaw
    .split(",")
    .map(t => t.trim())
    .filter(t => t);

  const billetId = row[0];
  const companyName = row[1];
  const dueDate = row[2];
  let consultingIds = [];
  if (row[5] && typeof row[5] === "string") {
    consultingIds = row[5]
      .split(",")           // separa por vírgula
      .map(id => id.trim()) // remove espaços
      .filter(id => id);    // remove strings vazias
  }
  const managerName = row[6];
  const qrCodePix = row[8];
  var consultingInvoicesText = "";

  console.log(`consult id ${consultingIds}`)

  if (consultingIds != null && consultingIds.length > 0) {
    var e = " e";
    var d = ",";
    var nfMText = "m";
    var pluralFaturas = "";
    if (consultingIds.length > 1) {
      pluralFaturas = "s";
    }

    consultingInvoicesText =
      e +
      " " +
      consultingIds.length +
      " fatura" +
      pluralFaturas +
      " Vivo, em aberto na operadora" +
      d;
  }

  const messages = [];


  for (const telefone of telefones) {
    const to = `55${telefone}@c.us`;

    // Mensagem de texto principal
    messages.push({
      type: "text",
      to,
      body: `Prezado(a),  ${managerName}! Tudo bem?

Estou entrando em contato para sinalizar que, conforme o sistema, há boleto em aberto que está em atraso, e que pode ocasionar o bloqueio de suas linhas em até 24 horas.

Para evitarmos qualquer interrupção nos serviços, poderia, por gentileza, encaminhar o comprovante de pagamento referente ao boleto em aberto?`.trim()
    });

    var media = await createMediaFromUrl(`${API_HOST}/downloadBillet/${billetId}`, `Boleto A1 Gestão de Telefonia - ${dueDate}.pdf`);
    if (media) {
      messages.push({
        type: "media",
        to,
        media
      });
    }

    for (id in consultingIds) {

      var media = await createMediaFromUrl(`${API_HOST}/latestInvoiceDownload/clientAccountBilling/${consultingIds[id]}`, `Fatura Vivo  - ${(parseInt(id) + 1)}.pdf`);
      if (media) {
        messages.push({
          type: "media",
          to,
          media
        });
      }
    }

    if (typeof qrCodePix === "string" && qrCodePix.trim() !== "") {

      messages.push({
        type: "text",
        to,
        body: `Para facilitar o seu pagamento segue abaixo código pix.`.trim()
      });

     messages.push({
        type: "text",
        to,
        body: `https://crm.a1gestao.com.br/getBilletPixCode/${billetId}`.trim()
      });
    } else {
      
      messages.push({
        type: "text",
        to,
        body: `Seu boleto também está disponível para download no link abaixo:`.trim()
      });

      messages.push({
        type: "text",
        to,
        body: `https://crm.a1gestao.com.br/getBilletPixCode/${billetId}`.trim()
      });
    }

  }
  return messages; // retorna lista de mensagens + arquivos, cada um com o número
};
