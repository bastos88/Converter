// Serviço de cotações (AwesomeAPI) com cache e TTL
const RatesService = (() => {
    const API_URL = 'https://economia.awesomeapi.com.br/json/last/USD-BRL,EUR-BRL,GBP-BRL';
    const TTL = 60 * 1000; // 60s cache
    let cache = { ts: 0, rates: null };

    async function fetchAll(force = false) {
        const now = Date.now();
        if (!force && cache.rates && (now - cache.ts < TTL)) return cache.rates;

        const res = await fetch(API_URL);
        if (!res.ok) throw new Error(`Network error: ${res.status}`);
        const data = await res.json();

        const rates = {};
        ['USD', 'EUR', 'GBP'].forEach(code => {
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

    function getCachedRates() {
        return cache.rates;
    }

    return { fetchAll, getRate, getCachedRates };
})();

// Utils
function formatBRL(value) {
    return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function currencySymbol(code) {
    return { USD: 'US$', EUR: '€', GBP: '£' }[code] || '';
}

// DOM
const form = document.querySelector('form');
const input = document.getElementById('value-input');
const currency = document.getElementById('currency-type');
const footer = document.querySelector('main footer');
const descriptionValues = document.getElementById('exchange-rate');
const result = document.getElementById('converted-value');
const statusEl = document.getElementById('status');
const submitBtn = form.querySelector('button[type="submit"]');

function setStatus(message = '', type = '') {
    statusEl.textContent = message;
    statusEl.className = type ? `status ${type}` : 'status';
}

function toggleForm(enabled) {
    input.disabled = !enabled;
    currency.disabled = !enabled;
    submitBtn.disabled = !enabled;
}

// allow numbers and decimal separators
input.addEventListener('input', () => {
    input.value = input.value.replace(/[^0-9.,]/g, '');
});

async function init() {
    setStatus('Buscando cotações...', 'loading');
    toggleForm(false);
    try {
        const rates = await RatesService.fetchAll();
        setStatus('Cotações atualizadas', 'ok');
        // prepare display (default show USD rate when user converts)
        if (rates && rates.USD) descriptionValues.textContent = `${currencySymbol('USD')} 1 = ${formatBRL(rates.USD)}`;
        toggleForm(true);
    } catch (err) {
        const cached = RatesService.getCachedRates();
        if (cached) {
            setStatus('Offline — usando cotações em cache', 'warn');
            if (cached.USD) descriptionValues.textContent = `${currencySymbol('USD')} 1 = ${formatBRL(cached.USD)}`;
            toggleForm(true);
        } else {
            setStatus('Erro ao buscar cotações. Tente novamente.', 'error');
            toggleForm(true);
        }
        console.error(err);
    }
}

function updateExchangeRateDisplay(code, rate) {
    if (!rate) {
        descriptionValues.textContent = '';
        return;
    }
    descriptionValues.textContent = `${currencySymbol(code)} 1 = ${formatBRL(rate)}`;
}

// Update exchange rate display when user selects a currency
currency.addEventListener('change', async () => {
    const selected = currency.value;
    if (!selected) {
        updateExchangeRateDisplay('', null);
        return;
    }

    setStatus('Atualizando cotação...', 'loading');
    try {
        let rate;
        try {
            rate = await RatesService.getRate(selected);
        } catch (fetchErr) {
            const cached = RatesService.getCachedRates();
            if (cached && cached[selected]) {
                rate = cached[selected];
                setStatus('Usando cotações em cache', 'warn');
            } else throw fetchErr;
        }

        updateExchangeRateDisplay(selected, rate);

        // If user already typed an amount, update the converted value immediately
        const amountStr = input.value.trim().replace(',', '.');
        const amount = parseFloat(amountStr);
        if (amount && !isNaN(amount) && amount > 0) {
            const total = amount * rate;
            result.textContent = `${formatBRL(total)} Reais`;
            footer.classList.add('show-result');
        }

        setStatus('', '');
    } catch (err) {
        console.error(err);
        setStatus('Não foi possível obter a cotação', 'error');
    }
});

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const amountStr = input.value.trim().replace(',', '.');
    const amount = parseFloat(amountStr);
    const selected = currency.value;

    if (!selected) {
        setStatus('Selecione uma moeda', 'error');
        currency.focus();
        return;
    }
    if (!amount || isNaN(amount) || amount <= 0) {
        setStatus('Insira um valor válido', 'error');
        input.focus();
        return;
    }

    setStatus('Convertendo...', 'loading');
    toggleForm(false);
    try {
        let rate;
        try {
            rate = await RatesService.getRate(selected);
        } catch (fetchErr) {
            // try cache
            const cached = RatesService.getCachedRates();
            if (cached && cached[selected]) {
                rate = cached[selected];
                setStatus('Usando cotações em cache', 'warn');
            } else throw fetchErr;
        }

        updateExchangeRateDisplay(selected, rate);
        const total = amount * rate;
        result.textContent = `${formatBRL(total)} Reais`;
        footer.classList.add('show-result');
        setStatus('', '');
    } catch (err) {
        console.error(err);
        footer.classList.remove('show-result');
        setStatus('Não foi possível converter. Tente novamente.', 'error');
    } finally {
        toggleForm(true);
    }
});

init();

// Fallback JS blink for the tagline dot (some browsers/systems suppress CSS color animation)
(function startDotBlinkFallback() {
    const dot = document.querySelector('.tagline .dot');
    if (!dot) return;
    // Respect reduced motion preference
    const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    let on = false;
    const intervalMs = 800;
    // Ensure initial state
    dot.classList.remove('live-on');

    setInterval(() => {
        on = !on;
        if (on) dot.classList.add('live-on');
        else dot.classList.remove('live-on');
    }, intervalMs);
})();