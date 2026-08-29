import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCurrency } from '../context/CurrencyContext';
import { useTheme } from '../context/ThemeContext';
import { getCurrencyMeta, getCrossRate, percentChange } from '../utils/currency';
import { spacing, radius, fontSizes } from '../theme/theme';

const STRENGTH_BASKET = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY'];

/**
 * App-calculated "strength score": average of 24H percent changes across a
 * basket of major currencies vs the base, normalized to 0-100 with 50 as
 * neutral. This is clearly labeled as an app heuristic, NOT an official index
 * (e.g. not DXY), per requirement #17.
 */
function computeStrengthScore(percentChanges) {
  const valid = percentChanges.filter((p) => p !== null && p !== undefined);
  if (!valid.length) return null;
  const avg = valid.reduce((sum, p) => sum + p, 0) / valid.length;
  // Map avg % change (-3% to +3% clipped) onto a 0-100 scale, 50 = neutral
  const clipped = Math.max(-3, Math.min(3, avg));
  return Math.round(50 + (clipped / 3) * 50);
}

export default function CurrencyStrengthScreen() {
  const theme = useTheme();
  const { baseCurrency, ratesData, previousRatesData } = useCurrency();

  const { score, breakdown } = useMemo(() => {
    if (!ratesData || !previousRatesData) return { score: null, breakdown: [] };
    const breakdown = STRENGTH_BASKET.map((code) => {
      const rate = getCrossRate(ratesData.rates, ratesData.base, code, baseCurrency);
      const prevRate = getCrossRate(previousRatesData.rates, previousRatesData.base, code, baseCurrency);
      const pct = percentChange(prevRate, rate);
      return { code, pct };
    });
    const score = computeStrengthScore(breakdown.map((b) => b.pct));
    return { score, breakdown };
  }, [ratesData, previousRatesData, baseCurrency]);

  const baseMeta = getCurrencyMeta(baseCurrency);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[styles.title, { color: theme.text }]}>Currency Strength</Text>

        <View style={[styles.scoreCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.scoreLabel, { color: theme.textSecondary }]}>
            {baseMeta.flag} {baseCurrency} Currency Strength
          </Text>
          <Text style={[styles.scoreValue, { color: theme.primary }]}>
            {score !== null ? `${score}/100` : 'Calculating…'}
          </Text>
          <Text style={[styles.disclaimer, { color: theme.textSecondary }]}>
            This score is an app-calculated indicator based on recent movement against a basket of
            major currencies. It is NOT an official financial index and should not be used as
            investment advice.
          </Text>
        </View>

        <Text style={[styles.sectionHeader, { color: theme.text }]}>Basket Breakdown</Text>
        {breakdown.map((b) => {
          const meta = getCurrencyMeta(b.code);
          return (
            <View key={b.code} style={[styles.row, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={[styles.rowLabel, { color: theme.text }]}>
                {meta.flag} {b.code}
              </Text>
              <Text
                style={[
                  styles.rowValue,
                  { color: b.pct == null ? theme.neutral : b.pct >= 0 ? theme.positive : theme.negative },
                ]}
              >
                {b.pct != null ? `${b.pct >= 0 ? '+' : ''}${b.pct.toFixed(2)}%` : '—'}
              </Text>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: spacing.md, paddingBottom: spacing.xl },
  title: { fontSize: fontSizes.lg, fontWeight: '800', marginBottom: spacing.md },
  scoreCard: { padding: spacing.md, borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth, marginBottom: spacing.lg },
  scoreLabel: { fontSize: fontSizes.sm, fontWeight: '600' },
  scoreValue: { fontSize: fontSizes.xxl, fontWeight: '800', marginVertical: spacing.sm },
  disclaimer: { fontSize: fontSizes.xs, lineHeight: 18 },
  sectionHeader: { fontSize: fontSizes.md, fontWeight: '700', marginBottom: spacing.sm },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: spacing.xs,
  },
  rowLabel: { fontSize: fontSizes.sm, fontWeight: '600' },
  rowValue: { fontSize: fontSizes.sm, fontWeight: '700' },
});
