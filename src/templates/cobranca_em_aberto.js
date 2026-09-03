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
  const nfLink = row[4];
  const managerName = row[6];
  const qrCodePix = row[7];
  const notaDebito = row[8];

  let consultingIds = [];

  if (row[5] && typeof row[5] === "string") {
    consultingIds = row[5]
      .split(",")
      .map(id => id.trim())
      .filter(id => id);
  }

  const messages = [];

  for (const telefone of telefones) {

    let body = `Olá, ${managerName}!🙋🏻‍♂️

A fatura da Gestão de Telefonia da empresa ${companyName}, foi enviada para o seu e-mail, com vencimento para ${dueDate}.`;

    // Faturas Vivo em aberto
    if (consultingIds.length > 0) {
      const plural = consultingIds.length > 1 ? "s" : "";

      body += `

Identificamos também ${consultingIds.length} fatura${plural} Vivo em aberto na operadora,`;
    }

    // Nota fiscal
    if (typeof nfLink === "string" && nfLink.trim() !== "") {
      body += `

E a nota fiscal está disponível para download no link: ${nfLink}.`;
    }

    // Link do boleto / PIX
    if (typeof qrCodePix === "string" && qrCodePix.trim() !== "") {

      const messagesText = [
        `Para facilitar o seu pagamento, acesse o link abaixo para copiar o código Pix e realizar o download do boleto.`,
        `Para facilitar o seu pagamento, acesse o link abaixo. Nele, você poderá copiar o código Pix e fazer o download do boleto.`
      ];

      body += `

${messagesText[Math.floor(Math.random() * messagesText.length)]}

https://crm.a1gestao.com.br/getBilletPixCode/${billetId}`;

    } else {

      const messagesText = [
        `Para facilitar o seu pagamento, acesse o link abaixo para realizar o download do boleto.`,
        `Para facilitar o seu pagamento, acesse o link abaixo. Nele, você poderá fazer o download do boleto.`
      ];

      body += `

${messagesText[Math.floor(Math.random() * messagesText.length)]}

https://crm.a1gestao.com.br/getBilletPixCode/${billetId}`;
    }

    // UM ÚNICO PUSH
    messages.push({
      type: "text",
      to: `55${telefone}@c.us`,
      body: body.trim()
    });
  }

  return messages;
};