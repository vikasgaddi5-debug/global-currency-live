import { CURRENCY_META } from '../constants/currencies';

/**
 * Returns display metadata for a currency code, falling back to a generic
 * entry (no invented country/flag) if not in our static map. This lets the
 * app support every code the API returns without manually limiting currencies.
 */
export function getCurrencyMeta(code) {
  if (CURRENCY_META[code]) return CURRENCY_META[code];
  return {
    country: code,
    name: code,
    symbol: code,
    flag: '🏳️',
  };
}

/**
 * The API returns rates relative to a single "base" (e.g. rates relative to USD).
 * To get the rate for ANY pair (from -> to), we use cross-rate math:
 *   rate(from->to) = rates[to] / rates[from]
 * where `rates` is the full table relative to the API's base.
 *
 * This correctly handles:
 *  - direct pairs where from === apiBase (rates[to] / 1)
 *  - inverse pairs (to === apiBase): rates[to]/rates[from] still holds since rates[apiBase] = 1
 *  - cross pairs where neither is apiBase
 */
export function getCrossRate(ratesTable, apiBase, fromCode, toCode) {
  if (fromCode === toCode) return 1;

  const rates = { ...ratesTable, [apiBase]: 1 };

  const fromRate = rates[fromCode];
  const toRate = rates[toCode];

  if (fromRate === undefined || toRate === undefined) {
    return null; // unsupported / missing pair — caller must handle gracefully
  }
  if (fromRate === 0) return null;

  return toRate / fromRate;
}

/**
 * Formats a rate with adaptive decimal precision:
 * - Very small rates (e.g. VND, IDR against USD) get more decimals
 * - Very large rates get fewer decimals but with thousands separators
 */
export function formatRate(value, { decimalPlaces } = {}) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';

  let decimals = decimalPlaces;
  if (decimals === undefined) {
    if (value >= 1000) decimals = 2;
    else if (value >= 1) decimals = 4;
    else if (value >= 0.01) decimals = 6;
    else decimals = 8;
  }

  return Number(value).toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatMoney(value, symbol, decimalPlaces = 2) {
  if (value === null || value === undefined || Number.isNaN(value)) return `${symbol}—`;
  return `${symbol}${Number(value).toLocaleString(undefined, {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  })}`;
}

export function percentChange(oldValue, newValue) {
  if (!oldValue || oldValue === 0 || newValue === null || newValue === undefined) return null;
  return ((newValue - oldValue) / oldValue) * 100;
}

export function convert(amount, rate) {
  if (rate === null || rate === undefined || Number.isNaN(amount)) return null;
  return amount * rate;
}
