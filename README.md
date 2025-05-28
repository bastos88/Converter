# 💱 Conversor de Moedas com JavaScript

Projeto desenvolvido para praticar manipulação de formulários, eventos e formatação de dados em JavaScript. O usuário insere um valor em Reais (BRL) e escolhe uma moeda estrangeira (USD, EUR ou GBP) para ver a conversão com base em cotações pré-definidas.

## 🧾 Descrição

Este conversor simples calcula o valor em reais a partir de uma moeda estrangeira selecionada, utilizando valores fixos definidos no código. A interface é responsiva, intuitiva e atualiza os resultados dinamicamente ao submeter o formulário.

> ⚠️ *Versão atual utiliza valores estáticos de cotação. Versão futura poderá usar API externa.*

## ⚙️ Funcionalidades

- Conversão de BRL a partir das moedas:
  - 💵 Dólar Americano (USD)
  - 💶 Euro (EUR)
  - 💷 Libra Esterlina (GBP)
- Validação do input para permitir apenas números
- Formatação do resultado final no padrão de moeda brasileira (BRL)
- Exibição dinâmica do valor convertido e da taxa usada

## 🚀 Tecnologias usadas

- HTML5
- CSS3
- JavaScript (puro / Vanilla JS)

## 📐 Como funciona

1. O usuário insere um valor numérico no campo.
2. Ao escolher a moeda e enviar o formulário, o JavaScript:
   - Impede o envio padrão (`preventDefault`)
   - Verifica a moeda selecionada
   - Converte o valor com base na cotação fixa
   - Formata o resultado em Real (BRL)
   - Exibe o resultado no rodapé da página

## 📄 Lógica da conversão

```javascript
const EUR = 6.41;
const USD = 6.11;
const GBP = 7.15;

function convertCurrencies(amount, price, symbol) {
  const total = amount * price;
  const convertido = Number(total).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
  result.textContent = `${convertido} Reais`;
}

```
## 📦 Como usar localmente

Clone ou baixe este repositório:
```

git clone https://github.com/seu-usuario/conversor-moedas
```


🧠 Melhorias futuras (To Do)
 Buscar cotações em tempo real via API (como a AwesomeAPI)

 Permitir converter em ambas as direções (BRL → USD / USD → BRL)

 Adicionar mais moedas (JPY, ARS, CAD, etc.)

 Histórico de conversões
