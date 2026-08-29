import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { fetchLatestRates } from '../services/apiClient';
import { storage } from '../services/storage';
import { classifyTrend, detectReversal } from '../services/trendEngine';
import { getCrossRate, percentChange } from '../utils/currency';
import { evaluateAlerts } from '../services/alertEngine';
import { DEFAULT_BASE_CURRENCY } from '../constants/currencies';

const CurrencyContext = createContext(null);

export function CurrencyProvider({ children }) {
  const [baseCurrency, setBaseCurrencyState] = useState(DEFAULT_BASE_CURRENCY);
  const [ratesData, setRatesData] = useState(null); // { base, rates, timestamp, isDelayed, source }
  const [previousRatesData, setPreviousRatesData] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ok | delayed | error | offline
  const [isOffline, setIsOffline] = useState(false);
  const [settings, setSettingsState] = useState(null);
  const [favorites, setFavoritesState] = useState([]);
  const [trendHistory, setTrendHistory] = useState({});
  const [lastError, setLastError] = useState(null);

  const refreshTimerRef = useRef(null);

  // Load persisted state on mount
  useEffect(() => {
    (async () => {
      const [savedBase, savedSettings, savedFavorites, savedTrendHistory, cached] = await Promise.all([
        storage.getBaseCurrency(),
        storage.getSettings(),
        storage.getFavorites(),
        storage.getTrendHistory(),
        storage.getCachedRates(DEFAULT_BASE_CURRENCY),
      ]);
      setBaseCurrencyState(savedBase);
      setSettingsState(savedSettings);
      setFavoritesState(savedFavorites);
      setTrendHistory(savedTrendHistory);
      if (cached) {
        setRatesData(cached);
        setStatus('offline'); // will be corrected once a live fetch succeeds
      }
    })();
  }, []);

  // Network connectivity listener
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const offline = !(state.isConnected && state.isInternetReachable !== false);
      setIsOffline(offline);
    });
    return () => unsubscribe();
  }, []);

  const loadRates = useCallback(
    async (base) => {
      if (isOffline) {
        const cached = await storage.getCachedRates(base);
        if (cached) {
          setRatesData(cached);
          setStatus('offline');
        }
        return;
      }
      try {
        const data = await fetchLatestRates(base);
        setPreviousRatesData((prev) => ratesData || prev);
        setRatesData(data);
        setStatus(data.isDelayed ? 'delayed' : 'ok');
        setLastError(null);
        await storage.setCachedRates(base, data);

        // Evaluate trend reversals & alerts against previous snapshot
        if (ratesData && ratesData.base === data.base) {
          const trendsByPair = {};
          Object.keys(data.rates).forEach((code) => {
            const oldRate = ratesData.rates[code];
            const newRate = data.rates[code];
            const pctChange = percentChange(oldRate, newRate);
            const trend = classifyTrend(pctChange);
            const prevTrendLabel = trendHistory[code]?.trend;
            const reversal = detectReversal(prevTrendLabel, trend, {
              currentRate: newRate,
              percentMovement: pctChange,
              pair: `${code}/${base}`,
            });
            trendsByPair[`${code}${base}`] = { percentChange24h: pctChange, trend, reversal };
          });

          const newTrendHistory = { ...trendHistory };
          Object.entries(trendsByPair).forEach(([pairKey, t]) => {
            const code = pairKey.replace(base, '');
            newTrendHistory[code] = { trend: t.trend, updatedAt: Date.now() };
          });
          setTrendHistory(newTrendHistory);
          storage.setTrendHistory(newTrendHistory);

          await evaluateAlerts({
            base,
            ratesTable: data.rates,
            apiBase: data.base,
            getCrossRateFn: getCrossRate,
            trendsByPair,
          });
        }
      } catch (err) {
        setLastError(err);
        setStatus('error');
        // Keep last valid rates visible per requirement #9 — do not clear ratesData.
      }
    },
    [isOffline, ratesData, trendHistory]
  );

  // Auto-refresh loop based on settings.refreshIntervalSec
  useEffect(() => {
    if (!settings) return;
    if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);

    loadRates(baseCurrency);

    if (settings.refreshIntervalSec > 0) {
      refreshTimerRef.current = setInterval(() => {
        loadRates(baseCurrency);
      }, settings.refreshIntervalSec * 1000);
    }

    return () => {
      if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseCurrency, settings?.refreshIntervalSec]);

  // Re-fetch immediately when connectivity is restored
  useEffect(() => {
    if (!isOffline && settings) {
      loadRates(baseCurrency);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOffline]);

  const setBaseCurrency = useCallback(async (code) => {
    setBaseCurrencyState(code);
    await storage.setBaseCurrency(code);
  }, []);

  const manualRefresh = useCallback(() => loadRates(baseCurrency), [loadRates, baseCurrency]);

  const updateSettings = useCallback(async (partial) => {
    setSettingsState((prev) => {
      const next = { ...prev, ...partial };
      storage.setSettings(next);
      return next;
    });
  }, []);

  const toggleFavorite = useCallback(async (code) => {
    setFavoritesState((prev) => {
      const next = prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code];
      storage.setFavorites(next);
      return next;
    });
  }, []);

  const value = {
    baseCurrency,
    setBaseCurrency,
    ratesData,
    previousRatesData,
    status,
    isOffline,
    lastError,
    settings,
    updateSettings,
    favorites,
    toggleFavorite,
    trendHistory,
    manualRefresh,
  };

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used within CurrencyProvider');
  return ctx;
}
