import { TREND_THRESHOLDS } from '../constants/currencies';

/**
 * Classifies a percentage change into a trend label.
 * Thresholds are configurable (see constants/currencies.js or Settings-driven overrides).
 */
export function classifyTrend(percentChange, thresholds = TREND_THRESHOLDS) {
  if (percentChange === null || percentChange === undefined) return 'Unknown';
  if (percentChange >= thresholds.strongUp) return 'Strong Uptrend';
  if (percentChange >= thresholds.up) return 'Uptrend';
  if (percentChange <= thresholds.strongDown) return 'Strong Downtrend';
  if (percentChange <= thresholds.down) return 'Downtrend';
  return 'Stable';
}

export function trendArrow(trend) {
  switch (trend) {
    case 'Strong Uptrend':
      return '↑↑';
    case 'Uptrend':
      return '↑';
    case 'Strong Downtrend':
      return '↓↓';
    case 'Downtrend':
      return '↓';
    case 'Stable':
      return '→';
    default:
      return '·';
  }
}

const DIRECTIONAL_GROUPS = {
  'Strong Uptrend': 'up',
  Uptrend: 'up',
  Stable: 'stable',
  Downtrend: 'down',
  'Strong Downtrend': 'down',
};

/**
 * Detects whether a trend reversal has occurred between a previous and
 * current classification. Returns a reversal event object or null.
 */
export function detectReversal(previousTrend, currentTrend, context = {}) {
  if (!previousTrend || !currentTrend || previousTrend === 'Unknown' || currentTrend === 'Unknown') {
    return null;
  }
  const prevGroup = DIRECTIONAL_GROUPS[previousTrend];
  const currGroup = DIRECTIONAL_GROUPS[currentTrend];

  if (prevGroup === currGroup) return null;

  // Only flag meaningful reversals: stable->up/down, up->down, down->up
  const isReversal =
    (prevGroup === 'up' && currGroup === 'down') ||
    (prevGroup === 'down' && currGroup === 'up') ||
    (prevGroup === 'stable' && (currGroup === 'up' || currGroup === 'down'));

  if (!isReversal) return null;

  return {
    previousTrend,
    currentTrend,
    currentRate: context.currentRate ?? null,
    percentMovement: context.percentMovement ?? null,
    detectedAt: Date.now(),
    pair: context.pair ?? null,
  };
}
