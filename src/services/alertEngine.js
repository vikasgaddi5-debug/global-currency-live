import { storage } from './storage';
import {
  sendLocalNotification,
  buildPriceAlertNotification,
  buildTrendReversalNotification,
  buildMarketMovementNotification,
} from './notificationService';

const MIN_RETRIGGER_GAP_MS = 60 * 60 * 1000; // don't re-fire the same alert within 1 hour

/**
 * Alert shape:
 * {
 *   id, type: 'above' | 'below' | 'percentChange' | 'trendReversal',
 *   base, target, threshold, enabled, lastTriggeredAt, pairLabel
 * }
 */

export async function evaluateAlerts({ base, ratesTable, apiBase, getCrossRateFn, trendsByPair }) {
  const alerts = await storage.getAlerts();
  if (!alerts.length) return [];

  const triggered = [];
  const settings = await storage.getSettings();

  for (const alert of alerts) {
    if (!alert.enabled) continue;
    if (alert.lastTriggeredAt && Date.now() - alert.lastTriggeredAt < MIN_RETRIGGER_GAP_MS) continue;

    const rate = getCrossRateFn(ratesTable, apiBase, alert.target, alert.base);
    if (rate === null) continue;

    let shouldFire = false;

    if (alert.type === 'above' && rate > alert.threshold) shouldFire = true;
    if (alert.type === 'below' && rate < alert.threshold) shouldFire = true;

    if (alert.type === 'percentChange') {
      const pairTrend = trendsByPair?.[`${alert.target}${alert.base}`];
      if (pairTrend && Math.abs(pairTrend.percentChange24h ?? 0) >= alert.threshold) {
        shouldFire = true;
      }
    }

    if (alert.type === 'trendReversal') {
      const pairTrend = trendsByPair?.[`${alert.target}${alert.base}`];
      if (pairTrend?.reversal) {
        shouldFire = true;
      }
    }

    if (shouldFire) {
      alert.lastTriggeredAt = Date.now();
      triggered.push({ alert, rate });

      if (settings.notificationsEnabled) {
        if (alert.type === 'above' || alert.type === 'below') {
          const notif = buildPriceAlertNotification(alert, rate.toFixed(2), alert.symbol || '');
          await sendLocalNotification(notif);
        } else if (alert.type === 'trendReversal') {
          const pairTrend = trendsByPair[`${alert.target}${alert.base}`];
          const notif = buildTrendReversalNotification(
            alert.pairLabel,
            pairTrend.reversal.previousTrend,
            pairTrend.reversal.currentTrend
          );
          await sendLocalNotification(notif);
        } else if (alert.type === 'percentChange') {
          const pairTrend = trendsByPair[`${alert.target}${alert.base}`];
          const notif = buildMarketMovementNotification(
            alert.target,
            pairTrend.percentChange24h,
            alert.base
          );
          await sendLocalNotification(notif);
        }
      }
    }
  }

  if (triggered.length) {
    await storage.setAlerts(alerts);
  }

  return triggered;
}

export async function addAlert(newAlert) {
  const alerts = await storage.getAlerts();
  const alert = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    enabled: true,
    lastTriggeredAt: null,
    ...newAlert,
  };
  alerts.push(alert);
  await storage.setAlerts(alerts);
  return alert;
}

export async function removeAlert(alertId) {
  const alerts = await storage.getAlerts();
  const filtered = alerts.filter((a) => a.id !== alertId);
  await storage.setAlerts(filtered);
  return filtered;
}

export async function toggleAlert(alertId, enabled) {
  const alerts = await storage.getAlerts();
  const updated = alerts.map((a) => (a.id === alertId ? { ...a, enabled } : a));
  await storage.setAlerts(updated);
  return updated;
}
