# 💱 Conversor de Moedas com JavaScript (integração com API)

Este projeto converte valores de moedas estrangeiras (USD, EUR, GBP) para BRL usando cotações em tempo real da AwesomeAPI.

Principais mudanças nesta versão:
- Integração com a API pública da AwesomeAPI (`economia.awesomeapi.com.br`) para buscar cotações atualizadas
- Tratamento de loading, erro e uso de cache (TTL de 60s)
- Arquitetura simples com `RatesService` para centralizar fetch e cache

## Como rodar localmente (sem Python)
Abra um terminal na pasta do projeto (`c:\Users\leozi\Converter`). Você pode usar qualquer servidor estático; exemplos:

- Usando `npx` (não precisa instalar dependências):

```powershell
npx http-server -p 8000
```

- Ou usando `npm` script fornecido (requer Node):

```powershell
npm start
```

- Ou a extensão Live Server do VSCode.

Depois abra no navegador: `http://localhost:8000`

Observação: o aplicativo faz fetch diretamente para a AwesomeAPI; verifique conectividade de rede e permita requisições CORS no navegador.

## Como funciona (resumo técnico)
- Ao carregar a página o app tenta buscar as cotações USD/BRL, EUR/BRL e GBP/BRL.
- As cotações são armazenadas em cache por 60 segundos (TTL).
- Ao submeter o formulário o app obtém a taxa do `RatesService` e calcula o total em BRL usando `async/await`.
- Se a API falhar, o app tenta usar o cache; se não houver cache, exibe mensagem de erro e permite retry.

## Licença
Uso livre para fins de aprendizado e portfólio.
