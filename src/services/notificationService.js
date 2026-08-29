import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function registerForNotifications() {
  if (!Device.isDevice) {
    return { granted: false, reason: 'NOT_A_PHYSICAL_DEVICE' };
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return { granted: false, reason: 'PERMISSION_DENIED' };
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('currency-alerts', {
      name: 'Currency Alerts',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }

  return { granted: true };
}

/**
 * Sends a local notification. De-duplication (to avoid spamming the same
 * alert repeatedly) is the caller's responsibility — see alertEngine.js,
 * which tracks lastTriggeredAt per alert.
 */
export async function sendLocalNotification({ title, body, data = {} }) {
  await Notifications.scheduleNotificationAsync({
    content: { title, body, data },
    trigger: null, // immediate
  });
}

export function buildPriceAlertNotification(alert, currentRate, symbol) {
  return {
    title: `🔔 ${alert.pairLabel} Alert`,
    body: `${alert.pairLabel} reached ${symbol}${currentRate}.`,
    data: { type: 'price_alert', alertId: alert.id },
  };
}

export function buildTrendReversalNotification(pairLabel, previousTrend, currentTrend) {
  return {
    title: '📈 Trend Reversal',
    body: `${pairLabel} changed from ${previousTrend} to ${currentTrend}.`,
    data: { type: 'trend_reversal' },
  };
}

export function buildMarketMovementNotification(currencyCode, percentMove, baseCode) {
  const direction = percentMove >= 0 ? '+' : '';
  return {
    title: '⚠️ Major Currency Movement',
    body: `${currencyCode} moved ${direction}${percentMove.toFixed(2)}% against ${baseCode}.`,
    data: { type: 'market_movement' },
  };
}
