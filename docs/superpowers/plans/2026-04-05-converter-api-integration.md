# I'm using the writing-plans skill to create the implementation plan.

# Converter API Integration Implementation Plan

> **Goal:** Substituir cotações estáticas por integração com a AwesomeAPI, adicionando loading, erro e estados vazios; código organizado e reutilizável.

**Architecture:** `RatesService` (fetch + cache) + UI glue in `script.js`. Keep `index.html` layout; add `#status` element; add CSS for status messages.

**Tech Stack:** HTML, CSS, Vanilla JS, Fetch API (async/await).

---

### Task 1: Atualizar `index.html`

**Files:**
- Modify: `c:\Users\leozi\Converter\index.html`

- [ ] **Step 1:** Replace `index.html` with the following content.

```html
<!DOCTYPE html>
<html lang="pt-br">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="stylesheet" href="styles.css" />
  <title>Conversor de Moedas</title>
</head>
<body>
  <img src="imgs/coverter-logo.svg" alt="Converter logo" />
  <main>
    <form>
      <label for="value-input">valor</label>
      <input type="text" name="amount" id="value-input" placeholder="0" required />
      <label for="currency-type">moeda</label>
      <select name="currency-type" id="currency-type" required>
        <option value="" disabled selected hidden>Selecione a moeda</option>
        <option value="USD">Dólar Americano</option>
        <option value="EUR">Euro</option>
        <option value="GBP">Libra Esterlina</option>
      </select>
      <button type="submit">Converter em reais</button>
    </form>

    <div id="status" role="status" aria-live="polite" class="status"></div>

    <footer>
      <span id="exchange-rate">US$ 1 = R$ 0,00</span>
      <h1 id="converted-value"></h1>
    </footer>
  </main>
  <script src="script.js"></script>
</body>
</html>
```

- [ ] **Step 2:** Save file and open `http://localhost:8000` to verify layout is unchanged.

---

### Task 2: Substituir `script.js` por implementação com API

**Files:**
- Modify: `c:\Users\leozi\Converter\script.js`

- [ ] **Step 1:** Replace `script.js` with the exact code below.

```javascript
// RatesService com cache (TTL 60s)
const RatesService = (() => {
  const API_URL = 'https://economia.awesomeapi.com.br/json/last/USD-BRL,EUR-BRL,GBP-BRL';
  const TTL = 60 * 1000;
  let cache = { ts: 0, rates: null };

  async function fetchAll(force = false) {
    const now = Date.now();
    if (!force && cache.rates && (now - cache.ts < TTL)) return cache.rates;
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error(`Network error: ${res.status}`);
    const data = await res.json();
    const rates = {};
    ['USD','EUR','GBP'].forEach(code => {
      const key = `${code}BRL`;
      if (data[key] && data[key].bid) rates[code] = Number(data[key].bid);
    });
    cache = { ts: Date.now(), rates };
    return rates;
  }

  async function getRate(currency) {
    const rates = await fetchAll();
    if (!rates || !rates[currency]) throw new Error('Rate not available');
    return rates[currency];
  }

  function getCachedRates() { return cache.rates; }
  return { fetchAll, getRate, getCachedRates };
})();

function formatBRL(value) { return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
function currencySymbol(code) { return { USD:'US$', EUR:'€', GBP:'£' }[code] || ''; }

const form = document.querySelector('form');
const input = document.getElementById('value-input');
const currency = document.getElementById('currency-type');
const footer = document.querySelector('main footer');
const descriptionValues = document.getElementById('exchange-rate');
const result = document.getElementById('converted-value');
const statusEl = document.getElementById('status');
const submitBtn = form.querySelector('button[type="submit"]');

function setStatus(message = '', type = '') { statusEl.textContent = message; statusEl.className = type ? `status ${type}` : 'status'; }
function toggleForm(enabled) { input.disabled = !enabled; currency.disabled = !enabled; submitBtn.disabled = !enabled; }

input.addEventListener('input', () => { input.value = input.value.replace(/[^0-9.,]/g, ''); });

async function init() {
  setStatus('Buscando cotações...', 'loading'); toggleForm(false);
  try {
    const rates = await RatesService.fetchAll();
    setStatus('Cotações atualizadas', 'ok');
    if (rates && rates.USD) descriptionValues.textContent = `${currencySymbol('USD')} 1 = ${formatBRL(rates.USD)}`;
    toggleForm(true);
  } catch (err) {
    const cached = RatesService.getCachedRates();
    if (cached) { setStatus('Offline — usando cotações em cache', 'warn'); if (cached.USD) descriptionValues.textContent = `${currencySymbol('USD')} 1 = ${formatBRL(cached.USD)}`; toggleForm(true); }
    else { setStatus('Erro ao buscar cotações. Tente novamente.', 'error'); toggleForm(true); }
    console.error(err);
  }
}

function updateExchangeRateDisplay(code, rate) { if (!rate) { descriptionValues.textContent = ''; return; } descriptionValues.textContent = `${currencySymbol(code)} 1 = ${formatBRL(rate)}`; }

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const amountStr = input.value.trim().replace(',', '.');
  const amount = parseFloat(amountStr);
  const selected = currency.value;
  if (!selected) { setStatus('Selecione uma moeda', 'error'); currency.focus(); return; }
  if (!amount || isNaN(amount) || amount <= 0) { setStatus('Insira um valor válido', 'error'); input.focus(); return; }
  setStatus('Convertendo...', 'loading'); toggleForm(false);
  try {
    let rate;
    try { rate = await RatesService.getRate(selected); } catch (fetchErr) { const cached = RatesService.getCachedRates(); if (cached && cached[selected]) { rate = cached[selected]; setStatus('Usando cotações em cache', 'warn'); } else throw fetchErr; }
    updateExchangeRateDisplay(selected, rate);
    const total = amount * rate;
    result.textContent = `${formatBRL(total)} Reais`;
    footer.classList.add('show-result');
    setStatus('', '');
  } catch (err) { console.error(err); footer.classList.remove('show-result'); setStatus('Não foi possível converter. Tente novamente.', 'error'); }
  finally { toggleForm(true); }
});

init();
```

- [ ] **Step 2:** Save and verify that when submitting a value and selecting a currency the result is displayed and the exchange rate text is updated.

---

### Task 3: Atualizar `styles.css`

**Files:**
- Modify: `c:\Users\leozi\Converter\styles.css`

- [ ] **Step 1:** Append the following styles (status messages + disabled state):

```css
/* Status messages (loading / error / warnings) */
.status { padding: 0.75rem 1rem; text-align: center; font-size: 0.95rem; margin: 0 2rem 1rem 2rem; border-radius: 0.5rem; display: none; }
.status.ok { display:block; background-color: rgba(76,175,80,0.06); color:#a9f0b1; border:1px solid rgba(76,175,80,0.12); }
.status.loading { display:block; background-color: rgba(74,93,205,0.06); color:#7d8dec; border:1px solid rgba(74,93,205,0.12); }
.status.error { display:block; background-color: rgba(255,82,82,0.04); color:#ffb3b3; border:1px solid rgba(255,82,82,0.12); }
.status.warn { display:block; background-color: rgba(255,193,7,0.04); color:#ffea9b; border:1px solid rgba(255,193,7,0.08); }
input:disabled, select:disabled, button:disabled { opacity: 0.6; cursor: not-allowed; }
```

---

### Task 4: Atualizar `README.md`

**Files:**
- Modify: `c:\Users\leozi\Converter\README.md`

- [ ] **Step 1:** Replace README with a short note that the project now uses AwesomeAPI and instructions to run locally (see repo file).

---

### Task 5: Adicionar documentação de design e plano

**Files:**
- Create: `c:\Users\leozi\Converter\docs\superpowers\specs\2026-04-05-converter-design.md` (design summary)
- Create: `c:\Users\leozi\Converter\docs\superpowers\plans\2026-04-05-converter-api-integration.md` (this file)

- [ ] **Step 1:** Save plan (this file) and design (spec) to `docs/superpowers` for traceability.

---

### Task 6: Testes manuais e commit

- [ ] **Step 1:** Start a local static server:

```powershell
python -m http.server 8000
# open http://localhost:8000 in a browser
```

- [ ] **Step 2:** Verify flows:
  - successful fetch + conversion
  - API failure with cache fallback
  - API failure without cache (error shown)

- [ ] **Step 3:** Commit changes:

```bash
git add index.html script.js styles.css README.md docs/superpowers/specs/2026-04-05-converter-design.md docs/superpowers/plans/2026-04-05-converter-api-integration.md
git commit -m "feat: integrar cotações via AwesomeAPI + loading/erro/cache"
```

---

Plan complete and saved to `docs/superpowers/plans/2026-04-05-converter-api-integration.md`.

Execution choice: I can now continue and run the manual tests locally in this session (start a static server) or stop here for your review. Qual prefere?
