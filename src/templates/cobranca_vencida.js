const { createMediaFromUrl } = require("../templates/enviar_arquivo"); // função para baixar arquivos e criar Media
const API_HOST = process.env.API_HOST ||  "https://localhost:8443"; // pega do .env


module.exports = async (row) => {
  const telefone = row[3];
  if (!telefone) return [];

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

  const to = `55${telefone}@c.us`;
  const messages = [];

  // Mensagem de texto principal
  messages.push({
    type: "text",
    to,
    body: `
Olá, ${managerName}!🙋🏻‍♂️
       
Informamos que não identificamos o pagamento do boleto do plano de Gestão de Telefonia da empresa ${companyName}, com vencimento em ${dueDate}.
    
Caso o pagamento tenha sido efetuado, seria possível no encaminhar o comprovante?
     
Estamos enviando novamente o boleto em anexo. ${consultingInvoicesText}

Caso surgir alguma dúvida ou dificuldade para efetuar o pagamento, nossa equipe de suporte está à disposição.
    `.trim()
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
      body: `${qrCodePix}`.trim()
    });


  }
  return messages; // retorna lista de mensagens + arquivos, cada um com o número
};
