const cobrancaVencida = require("./cobranca_vencida");
const cobrancaEmAberto = require("./cobranca_em_aberto");
const cobranca_em_aberto = require("./cobranca_em_aberto");



const templates = {
  cobranca_vencida: cobrancaVencida,
  cobranca_em_aberto: cobrancaEmAberto,

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