import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  BASE_CURRENCY: '@gcl/baseCurrency',
  FAVORITES: '@gcl/favorites',
  ALERTS: '@gcl/alerts',
  SETTINGS: '@gcl/settings',
  RATE_CACHE: '@gcl/rateCache',
  TREND_HISTORY: '@gcl/trendHistory',
};

async function safeGet(key, fallback) {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}

async function safeSet(key, value) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    return false;
  }
}

export const storage = {
  KEYS,

  getBaseCurrency: () => safeGet(KEYS.BASE_CURRENCY, 'INR'),
  setBaseCurrency: (code) => safeSet(KEYS.BASE_CURRENCY, code),

  getFavorites: () => safeGet(KEYS.FAVORITES, ['USD', 'EUR', 'GBP', 'AED', 'JPY']),
  setFavorites: (list) => safeSet(KEYS.FAVORITES, list),

  getAlerts: () => safeGet(KEYS.ALERTS, []),
  setAlerts: (alerts) => safeSet(KEYS.ALERTS, alerts),

  getSettings: () =>
    safeGet(KEYS.SETTINGS, {
      refreshIntervalSec: 60,
      notificationsEnabled: true,
      theme: 'system',
      decimalPlaces: 2,
      timezone: 'automatic',
    }),
  setSettings: (settings) => safeSet(KEYS.SETTINGS, settings),

  // Cache last-known-good rates per base currency so the app can show
  // "last updated X minutes ago" data while offline, per requirement #22.
  getCachedRates: (base) => safeGet(`${KEYS.RATE_CACHE}:${base}`, null),
  setCachedRates: (base, payload) => safeSet(`${KEYS.RATE_CACHE}:${base}`, payload),

  getTrendHistory: () => safeGet(KEYS.TREND_HISTORY, {}),
  setTrendHistory: (history) => safeSet(KEYS.TREND_HISTORY, history),
};
