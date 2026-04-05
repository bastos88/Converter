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

// Robust blink: poll for the dot and start inline-style blinking (handles Live Preview timing)
// Blink control helpers and opt-in toggle handling
function isBlinkOptIn() {
    try { return localStorage.getItem('blinkOptIn') === 'true'; } catch (e) { return false; }
}

function setBlinkOptIn(val) {
    try { localStorage.setItem('blinkOptIn', val ? 'true' : 'false'); } catch (e) {}
    if (val) document.body.classList.add('force-motion'); else document.body.classList.remove('force-motion');
    console.log('[blink] setBlinkOptIn ->', !!val);
}

function enableBlinkNow() {
    const dot = document.querySelector('.tagline .dot');
    if (!dot) return false;
    if (!dot.classList.contains('blink-enabled')) dot.classList.add('blink-enabled');

    // If CSS animation is suppressed (e.g. prefers-reduced-motion), start a JS fallback toggler.
    try {
        const cs = getComputedStyle(dot);
        const animationName = cs.getPropertyValue('animation-name') || cs.animationName;
        const animationDuration = cs.getPropertyValue('animation-duration') || cs.animationDuration;
        if (!animationName || animationName === 'none' || animationDuration === '0s') {
            startJsBlink(dot);
        } else {
            stopJsBlink(dot);
        }
    } catch (e) {
        // ignore
    }
    return true;
}

function startJsBlink(dot) {
    if (!dot) return;
    if (dot._blinkIntervalId) return; // already running
    const rootStyles = getComputedStyle(document.documentElement);
    const liveGreen = (rootStyles.getPropertyValue('--live-green') || '#36d37f').trim();
    const muted = (rootStyles.getPropertyValue('--muted') || '#9fb0e6').trim();

    // save originals
    dot._blinkOrig = {
        color: dot.style.color || '',
        textShadow: dot.style.textShadow || '',
        transform: dot.style.transform || ''
    };

    let on = false;
    dot._blinkIntervalId = setInterval(() => {
        on = !on;
        dot.style.color = on ? liveGreen : muted;
        dot.style.transform = on ? 'scale(1.08)' : 'scale(1)';
        dot.style.textShadow = on ? '0 8px 22px rgba(54,211,127,0.22)' : 'none';
    }, 1100);

    // Pause when page hidden
    dot._blinkVisibilityHandler = () => {
        if (document.hidden) {
            if (dot._blinkIntervalId) { clearInterval(dot._blinkIntervalId); dot._blinkIntervalId = null; }
        } else {
            if (!dot._blinkIntervalId) startJsBlink(dot);
        }
    };
    document.addEventListener('visibilitychange', dot._blinkVisibilityHandler);
    console.log('[blink] JS fallback started');
}

function stopJsBlink(dot) {
    if (!dot) return;
    if (dot._blinkIntervalId) { clearInterval(dot._blinkIntervalId); dot._blinkIntervalId = null; }
    if (dot._blinkVisibilityHandler) { document.removeEventListener('visibilitychange', dot._blinkVisibilityHandler); delete dot._blinkVisibilityHandler; }
    if (dot._blinkOrig) {
        dot.style.color = dot._blinkOrig.color;
        dot.style.textShadow = dot._blinkOrig.textShadow;
        dot.style.transform = dot._blinkOrig.transform;
        delete dot._blinkOrig;
    }
    console.log('[blink] JS fallback stopped');
}

// Initialize toggle UI (if present)
(() => {
    const toggle = document.getElementById('blink-toggle');
    if (isBlinkOptIn()) document.body.classList.add('force-motion');
    if (toggle) {
        toggle.checked = isBlinkOptIn();
        toggle.addEventListener('change', (e) => {
            setBlinkOptIn(!!e.target.checked);
            if (e.target.checked) enableBlinkNow(); else {
                const dot = document.querySelector('.tagline .dot');
                if (dot) dot.classList.remove('blink-enabled');
            }
        });
    }
})();

// Robust blink activation (polls for element; respects user opt-in)
(function enableDotCssBlink() {
    console.log('[blink] enableDotCssBlink start');
    const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    console.log('[blink] prefers-reduced-motion:', prefersReduced);
    const optIn = isBlinkOptIn();
    if (prefersReduced && !optIn) {
        console.log('[blink] reduced-motion is enabled and user did not opt-in; skipping activation');
        return;
    }
    if (optIn) document.body.classList.add('force-motion');

    if (!enableBlinkNow()) {
        let attempts = 0;
        const poll = setInterval(() => {
            attempts++;
            console.log('[blink] polling attempt', attempts);
            if (enableBlinkNow()) {
                console.log('[blink] enabled during poll on attempt', attempts);
                clearInterval(poll);
                return;
            }
            if (attempts > 40) {
                console.warn('[blink] giving up after', attempts, 'poll attempts');
                clearInterval(poll);
            }
        }, 200);
    }

    document.addEventListener('visibilitychange', () => {
        console.log('[blink] visibilitychange (hidden=%s)', document.hidden);
        if (!document.hidden) enableBlinkNow();
    });
})();

// Simple toggle listener: add/remove .blink class on the dot (user snippet)
(() => {
    const toggle = document.getElementById('blink-toggle');
    const dot = document.querySelector('.tagline .dot') || document.querySelector('.dot');
    if (!toggle || !dot) return;
    toggle.addEventListener('change', () => {
        if (toggle.checked) {
            dot.classList.add('blink');
        } else {
            dot.classList.remove('blink');
        }
    });
    // sync initial state: if dot already has blink, ensure toggle reflects it
    try { toggle.checked = dot.classList.contains('blink'); } catch (e) {}
})();