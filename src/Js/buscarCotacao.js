export async function buscarCotacao() {
  const url =
    "https://economia.awesomeapi.com.br/json/last/USD-BRL,EUR-BRL,GBP-BRL";

  try {
    const response = await fetch(url);
    const data = await response.json(); // <- faltava o await aqui

    // Verificação de segurança
    if (!data.USDBRL || !data.EURBRL || !data.GBPBRL) {
      throw new Error("Resposta da API incompleta ou inválida");
    }

    // Extração segura dos valores
    return {
      USD: parseFloat(data.USDBRL.high),
      EUR: parseFloat(data.EURBRL.high),
      GBP: parseFloat(data.GBPBRL.high),
    };
  } catch (error) {
    console.error("Erro ao buscar cotações:", error);
    return null;
  }
}
