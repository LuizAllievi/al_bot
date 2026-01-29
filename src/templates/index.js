const cobrancaVencida = require("./cobranca_vencida");

const templates = {
  cobranca_vencida: cobrancaVencida,
};

function getTemplate(name) {
  return templates[name];
}
function listTemplateNames() {
  return Object.keys(templates);
}

module.exports = {
  getTemplate,
  listTemplateNames,
};