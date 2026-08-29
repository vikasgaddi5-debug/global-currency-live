const axios = require('axios');
const NodeCache = require('node-cache');

const cache = new NodeCache({ stdTTL: Number(process.env.RATES_CACHE_TTL_SECONDS || 30) });

/**
 * Fetches latest rates for a base currency from the configured provider.
 * Returns a normalized shape: { base, rates, timestamp, isDelayed, source }
 *
 * Provider API keys are read from environment variables ONLY — never sent
 * to or accepted from the client.
 */
async function getLatestRates(baseCurrency) {
  const cacheKey = `latest:${baseCurrency}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const provider = process.env.FX_PROVIDER || 'open_er_api';
  let result;

  if (provider === 'exchangerate_host') {
    const apiKey = process.env.EXCHANGERATE_HOST_API_KEY;
    if (!apiKey) {
      throw new Error('EXCHANGERATE_HOST_API_KEY is not set in the backend environment');
    }
    const response = await axios.get('https://api.exchangerate.host/live', {
      params: { access_key: apiKey, source: baseCurrency },
      timeout: 8000,
    });
    if (!response.data || response.data.success === false) {
      throw new Error(response.data?.error?.info || 'Provider error');
    }
    // exchangerate.host "live" quotes come as e.g. "USDEUR": 0.91 — strip base prefix
    const rates = {};
    Object.entries(response.data.quotes || {}).forEach(([pair, value]) => {
      rates[pair.replace(baseCurrency, '')] = value;
    });
    result = {
      base: baseCurrency,
      rates,
      timestamp: response.data.timestamp * 1000,
      isDelayed: false,
      source: 'exchangerate.host',
    };
  } else {
    // Free, keyless fallback — good for development, daily refresh only.
    const response = await axios.get(`https://open.er-api.com/v6/latest/${baseCurrency}`, {
      timeout: 8000,
    });
    if (response.data.result !== 'success') {
      throw new Error(response.data['error-type'] || 'Provider error');
    }
    result = {
      base: response.data.base_code,
      rates: response.data.rates,
      timestamp: response.data.time_last_update_unix * 1000,
      isDelayed: true,
      source: 'open.er-api.com (daily refresh)',
    };
  }

  cache.set(cacheKey, result);
  return result;
}

/**
 * Fetches historical timeseries for a currency pair. Requires a provider
 * that supports timeseries (configured via HISTORICAL_FX_API_KEY /
 * HISTORICAL_FX_PROVIDER_BASE_URL). Throws NO_HISTORICAL_DATA if not
 * configured — the app must show this honestly, never fabricate points.
 */
async function getHistoricalRates(base, target, range) {
  const apiKey = process.env.HISTORICAL_FX_API_KEY;
  const providerUrl = process.env.HISTORICAL_FX_PROVIDER_BASE_URL;

  if (!apiKey || !providerUrl) {
    const err = new Error(
      'No historical FX provider configured. Set HISTORICAL_FX_API_KEY and HISTORICAL_FX_PROVIDER_BASE_URL in backend/.env (e.g. exchangerate.host timeseries, CurrencyLayer, Fixer.io, Twelve Data, or Polygon.io).'
    );
    err.code = 'NO_HISTORICAL_DATA';
    throw err;
  }

  const { startDate, endDate, interval } = rangeToDates(range);

  // Example integration shape — adapt params to your chosen provider's actual API.
  const response = await axios.get(providerUrl, {
    params: {
      access_key: apiKey,
      base,
      symbols: target,
      start_date: startDate,
      end_date: endDate,
      interval,
    },
    timeout: 10000,
  });

  const rawSeries = response.data?.quotes || response.data?.rates || {};
  const points = Object.entries(rawSeries)
    .map(([dateStr, value]) => {
      const rate = typeof value === 'object' ? value[target] : value;
      return { t: new Date(dateStr).getTime(), rate };
    })
    .filter((p) => !Number.isNaN(p.t) && typeof p.rate === 'number')
    .sort((a, b) => a.t - b.t);

  if (!points.length) {
    const err = new Error('Provider returned no historical points for this range');
    err.code = 'NO_HISTORICAL_DATA';
    throw err;
  }

  return { points, source: providerUrl };
}

function rangeToDates(range) {
  const now = new Date();
  const end = now.toISOString().slice(0, 10);
  const days = { '1H': 1, '4H': 1, '1D': 1, '5D': 5, '1M': 30, '3M': 90, '6M': 182, '1Y': 365, '5Y': 1825, MAX: 3650 };
  const start = new Date(now.getTime() - (days[range] || 30) * 86400000).toISOString().slice(0, 10);
  const interval = ['1H', '4H', '1D'].includes(range) ? 'hourly' : 'daily';
  return { startDate: start, endDate: end, interval };
}

module.exports = { getLatestRates, getHistoricalRates };
