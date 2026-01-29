module.exports = (row) => {
  const telefone = row[3]; // coluna 0

  if (!telefone) return null;

  const nome = row[1];
  const valor = row[0];
  const vencimento = row[2];

  return {
    to: `${telefone}@c.us`,
    message: `
Olá ${nome},

Consta uma fatura em aberto no valor de R$ ${valor}.
Vencimento: ${vencimento}

Atenciosamente,
Equipe
    `.trim()
  };
};
