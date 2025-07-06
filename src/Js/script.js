import { buscarCotacao } from "./buscarCotacao.js";

// Obtendo os elementos do formulário.
const form = document.querySelector("form");
const input = document.getElementById("value-input");
const currency = document.getElementById("currency-type");
const footer = document.querySelector("main footer");
const descriptionValues = document.getElementById("exchange-rate");
const result = document.getElementById("converted-value");

// Manipulando o input amount para receber somente números.
input.addEventListener("input", () => {
  const hasCharactersRegex = /\D+/g;
  input.value = input.value.replace(hasCharactersRegex, "");
});

// Captando o evento de submit (enviar) do formulário.
form.onsubmit = async (e) => {
  e.preventDefault();

  const cotacoes = await buscarCotacao();
  if (!cotacoes) return;

  const valor = input.value;
  const moeda = currency.value;
  const simbolos = { USD: "US$", EUR: "€", GBP: "£" };

  convertCurrencies(valor, cotacoes[moeda], simbolos[moeda]);
};
// Função para converter a moeda.
function convertCurrencies(amount, price, symbol) {
  try {
    descriptionValues.textContent = `${symbol} 1 = ${currencyFormatBRL(price)}`;
    // Formatar o valor total.
    let total = amount * price;
    // Exibe o resultado total.
    total = currencyFormatBRL(total);

    result.textContent = `${total} Reais`;
    // Aplica a classe que exibe o footer para mostrar o resultado.
    footer.classList.add("show-result");
  } catch (error) {
    // Remove a classe do footer removendo ele da tela.
    footer.classList.remove("show-result");
    alert("não foi possível converter. tente novamente mais tarde.");
  }
}
// Formata a moeda em Real Brasileiro.
function currencyFormatBRL(value) {
  // Converte para número para utilizar o toLocaleString para formatar no padrão BRL (R$ 00,00).
  return Number(value).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}
