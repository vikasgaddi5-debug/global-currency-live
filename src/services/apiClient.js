import axios from 'axios';
import Constants from 'expo-constants';

// IMPORTANT: The mobile app NEVER talks to the FX data provider directly and
// NEVER embeds a provider API key. All requests go to YOUR backend
// (see /backend in the project root), which holds the real provider key in
// an environment variable and forwards/caches responses.
//
// For local development without standing up the backend yet, this client can
// point directly at a free, keyless provider (open.er-api.com) — but before
// shipping to production you MUST switch API_BASE_URL to your backend URL.
// Set EXPO_PUBLIC_API_BASE_URL in your .env / app config to control this.

const DEV_DIRECT_PROVIDER = 'https://open.er-api.com/v6'; // free, keyless, latest-only rates
const CONFIGURED_BACKEND =
  Constants.expoConfig?.extra?.apiBaseUrl || process.env.EXPO_PUBLIC_API_BASE_URL;

const USE_BACKEND = !!CONFIGURED_BACKEND && !CONFIGURED_BACKEND.includes('your-backend.example.com');

const API_BASE_URL = USE_BACKEND ? CONFIGURED_BACKEND : DEV_DIRECT_PROVIDER;

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 800;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Generic request wrapper with retry + timeout + validation.
 * Throws a normalized error object: { code, message } so UI layers can
 * render consistent "Unable to update" / offline states.
 */
async function request(path, { params = {}, retries = MAX_RETRIES } = {}) {
  try {
    const response = await client.get(path, { params });
    if (!response || !response.data) {
      throw new Error('EMPTY_RESPONSE');
    }
    return response.data;
  } catch (err) {
    const isTimeout = err.code === 'ECONNABORTED';
    const isNetworkError = err.message === 'Network Error';

    if (retries > 0 && (isTimeout || isNetworkError)) {
      await sleep(RETRY_DELAY_MS);
      return request(path, { params, retries: retries - 1 });
    }

    const normalized = {
      code: isTimeout ? 'TIMEOUT' : isNetworkError ? 'NETWORK_ERROR' : 'API_ERROR',
      message: err.message || 'Unknown API error',
      status: err.response?.status,
    };
    throw normalized;
  }
}

/**
 * Fetch latest rates for a given base currency.
 * Returns: { base, rates: { USD: 1.0, EUR: 0.9, ... }, timestamp, isDelayed }
 *
 * When USE_BACKEND is false (dev mode), this hits open.er-api.com directly.
 * That provider's docs state data updates roughly every 24 hours — this is
 * NOT real-time streaming FX. We surface that honestly via isDelayed/source.
 */
export async function fetchLatestRates(baseCurrency) {
  if (USE_BACKEND) {
    const data = await request('/rates/latest', { params: { base: baseCurrency } });
    return {
      base: data.base,
      rates: data.rates,
      timestamp: data.timestamp,
      isDelayed: !!data.isDelayed,
      source: data.source || 'backend',
    };
  }

  const data = await request(`/latest/${baseCurrency}`);
  if (data.result !== 'success') {
    throw { code: 'API_ERROR', message: data['error-type'] || 'Provider returned an error' };
  }
  return {
    base: data.base_code,
    rates: data.rates,
    timestamp: data.time_last_update_unix * 1000,
    isDelayed: true, // this free tier is daily-refresh, always label as latest-available, not live
    source: 'open.er-api.com (daily refresh — dev fallback, not live streaming data)',
  };
}

/**
 * Fetch historical rates for a currency pair over a range.
 * Returns: { points: [{ t: timestampMs, rate: number }], source }
 *
 * Historical data requires a provider that supports it (e.g. exchangerate.host
 * timeseries endpoint, or a paid provider via your backend). This function
 * NEVER fabricates points — if the backend/provider can't supply history for
 * the requested range, it throws NO_HISTORICAL_DATA and the UI must say so
 * rather than drawing invented data.
 */
export async function fetchHistoricalRates(base, target, range) {
  if (!USE_BACKEND) {
    throw {
      code: 'NO_HISTORICAL_DATA',
      message:
        'Historical charting requires the backend proxy (see /backend) connected to a provider that supports timeseries data, e.g. exchangerate.host or a paid FX historical API.',
    };
  }
  const data = await request('/rates/history', { params: { base, target, range } });
  if (!data.points || !Array.isArray(data.points) || data.points.length === 0) {
    throw { code: 'NO_HISTORICAL_DATA', message: 'No historical data available for this range' };
  }
  return { points: data.points, source: data.source };
}

/**
 * Fetch market/economic events relevant to a currency, if the backend has
 * a news/events provider configured. Never invents events.
 */
export async function fetchMarketEvents(currencyCode) {
  if (!USE_BACKEND) {
    return { events: [], available: false };
  }
  try {
    const data = await request('/events', { params: { currency: currencyCode } });
    return { events: data.events || [], available: true };
  } catch (e) {
    return { events: [], available: false };
  }
}

export const apiConfig = { USE_BACKEND, API_BASE_URL };
