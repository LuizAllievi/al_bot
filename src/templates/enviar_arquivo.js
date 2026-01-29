const axios = require("axios");
const https = require("https");
const { MessageMedia } = require("whatsapp-web.js");

/**
 * Baixa um arquivo remoto e cria um MessageMedia do WhatsApp.
 * @param {string} url - URL do arquivo
 * @param {string} [fileNameOverride] - Nome que você quer que o arquivo tenha no WhatsApp
 * @returns {Promise<MessageMedia|null>} - MessageMedia ou null se falhar
 */

async function createMediaFromUrl(url, fileNameOverride) {
  if (!url) return null;

  try {
    const agent = new https.Agent({ rejectUnauthorized: false }); // ignora certificado
    const response = await axios.get(url, { 
      responseType: "arraybuffer",
      httpsAgent: agent
    });

    const buffer = Buffer.from(response.data, "binary");

    // Se passar fileNameOverride usa ele, senão pega da URL
    const fileName = fileNameOverride || url.split("/").pop();
    const mimeType = getMimeType(fileName);

    return new MessageMedia(mimeType, buffer.toString("base64"), fileName);
  } catch (err) {
    console.error("Erro ao baixar arquivo:", url, err.message);
    return null;
  }
}

/**
 * Detecta MIME type básico pelo nome do arquivo
 * @param {string} fileName
 */
function getMimeType(fileName) {
  const ext = (fileName.split(".").pop() || "").toLowerCase();
  switch (ext) {
    case "pdf": return "application/pdf";
    case "jpg":
    case "jpeg": return "image/jpeg";
    case "png": return "image/png";
    case "xls": return "application/vnd.ms-excel";
    case "xlsx": return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    case "txt": return "text/plain";
    default: return "application/octet-stream";
  }
}

module.exports = {
  createMediaFromUrl,
};
