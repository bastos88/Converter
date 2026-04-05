# Conversor de Moedas — Design (2026-04-05)

## Resumo

Este documento descreve o design da mudança: substituir cotações estáticas por uma integração com uma API pública de câmbio (AwesomeAPI), adicionar tratamento de loading/erro/estados vazios e melhorar a organização do código.

## Arquitetura

- `RatesService` (módulo JS): único responsável por buscar cotações, manter cache (TTL 60s) e expor `getRate(currency)` e `fetchAll()`.
- UI: componente leve em `script.js` que consome `RatesService` e atualiza elementos existentes em `index.html`.
- Estilos: pequenas classes em `styles.css` para `status` (loading / error / warn / ok).

## Fluxo de dados

1. Ao carregar a página: `RatesService.fetchAll()` — busca as 3 cotações (USD-BRL, EUR-BRL, GBP-BRL).
2. Ao enviar o formulário: `RatesService.getRate(selectedCurrency)` para obter taxa atual (ou usar cache), calcular `amount * rate` e exibir resultado formatado em BRL.
3. Em caso de erro de rede, se existir cache, usar cache e avisar o usuário; se não, exibir erro e permitir retry.

## UI e estados

- `#status` — exibe mensagens de loading/erro/warn/ok (aria-live="polite").
- `footer` mantém `#exchange-rate` e `#converted-value`; o `footer` é mostrado quando há resultado.
- Formulário é desabilitado durante operações de fetch para evitar requisições concorrentes.

## Tratamento de erros

- `try/catch` em chamadas `fetch` com mensagens amigáveis.
- Uso de cache como fallback.

## Arquivos afetados

- `index.html` — adicionar `#status` e usar paths relativos para recursos.
- `script.js` — refatorado: `RatesService`, UI logic, async/await.
- `styles.css` — adicionar estilos para `.status` e `:disabled`.
- `README.md` — documentar integração e instruções de execução.

## Testes manuais sugeridos

1. Carregar página online — verificar que `status` mostra "Cotações atualizadas" e conversão funciona.
2. Simular offline (desconectar) com cache vazio — verificar mensagem de erro.
3. Simular offline com cache — verificar uso do cache e mensagem de aviso.
