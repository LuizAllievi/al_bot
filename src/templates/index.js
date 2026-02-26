const cobrancaVencida = require("./cobranca_vencida");
const cobrancaEmAberto = require("./cobranca_em_aberto");
const bloqueioPagamento = require("./bloqueio_pagamento");



const templates = {
  cobranca_vencida: cobrancaVencida,
  cobranca_em_aberto: cobrancaEmAberto,
  bloqueio_pagamento : bloqueioPagamento,

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