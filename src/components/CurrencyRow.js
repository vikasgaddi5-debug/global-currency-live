import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, AccessibilityInfo } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { getCurrencyMeta, formatRate } from '../utils/currency';
import { trendArrow } from '../services/trendEngine';
import { spacing, radius, fontSizes } from '../theme/theme';

export default function CurrencyRow({
  code,
  rate,
  percentChange24h,
  trend,
  isFavorite,
  onPress,
  onToggleFavorite,
}) {
  const theme = useTheme();
  const meta = getCurrencyMeta(code);
  const isPositive = (percentChange24h ?? 0) >= 0;
  const changeColor = percentChange24h == null ? theme.neutral : isPositive ? theme.positive : theme.negative;

  return (
    <TouchableOpacity
      style={[styles.row, { backgroundColor: theme.card, borderColor: theme.border }]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${meta.name}, ${code}, rate ${formatRate(rate)}, ${
        percentChange24h != null ? `${percentChange24h.toFixed(2)} percent` : 'change unavailable'
      }`}
    >
      <Text style={styles.flag}>{meta.flag}</Text>
      <View style={styles.info}>
        <Text style={[styles.code, { color: theme.text }]}>{code}</Text>
        <Text style={[styles.name, { color: theme.textSecondary }]} numberOfLines={1}>
          {meta.name}
        </Text>
      </View>
      <View style={styles.rateBlock}>
        <Text style={[styles.rate, { color: theme.text }]}>{formatRate(rate)}</Text>
        <Text style={[styles.change, { color: changeColor }]}>
          {percentChange24h != null ? `${isPositive ? '+' : ''}${percentChange24h.toFixed(2)}% ` : '—'}
          {trend ? trendArrow(trend) : ''}
        </Text>
      </View>
      <TouchableOpacity
        onPress={onToggleFavorite}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        accessibilityRole="button"
        accessibilityLabel={isFavorite ? `Remove ${code} from favorites` : `Add ${code} to favorites`}
      >
        <Text style={[styles.star, { color: isFavorite ? theme.warning : theme.neutral }]}>
          {isFavorite ? '★' : '☆'}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: spacing.sm,
  },
  flag: { fontSize: 28, marginRight: spacing.sm },
  info: { flex: 1 },
  code: { fontSize: fontSizes.md, fontWeight: '700' },
  name: { fontSize: fontSizes.xs, marginTop: 2 },
  rateBlock: { alignItems: 'flex-end', marginRight: spacing.sm },
  rate: { fontSize: fontSizes.md, fontWeight: '600' },
  change: { fontSize: fontSizes.xs, marginTop: 2 },
  star: { fontSize: 22 },
});
