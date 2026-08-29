import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCurrency } from '../context/CurrencyContext';
import { useTheme } from '../context/ThemeContext';
import { getCurrencyMeta, getCrossRate, percentChange } from '../utils/currency';
import { spacing, radius, fontSizes } from '../theme/theme';

export default function TopMoversScreen() {
  const theme = useTheme();
  const { baseCurrency, ratesData, previousRatesData } = useCurrency();

  const { gainers, losers } = useMemo(() => {
    if (!ratesData || !previousRatesData) return { gainers: [], losers: [] };
    const list = Object.keys(ratesData.rates)
      .map((code) => {
        const rate = getCrossRate(ratesData.rates, ratesData.base, code, baseCurrency);
        const prevRate = getCrossRate(previousRatesData.rates, previousRatesData.base, code, baseCurrency);
        const pct = percentChange(prevRate, rate);
        return { code, pct };
      })
      .filter((r) => r.pct !== null);

    const sorted = [...list].sort((a, b) => b.pct - a.pct);
    return { gainers: sorted.slice(0, 5), losers: sorted.slice(-5).reverse() };
  }, [ratesData, previousRatesData, baseCurrency]);

  const hasData = gainers.length > 0 || losers.length > 0;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[styles.title, { color: theme.text }]}>Top Movers</Text>

        {!hasData && (
          <Text style={{ color: theme.textSecondary }}>
            Movement data will appear after the second live refresh, since it's calculated by comparing
            two consecutive rate snapshots.
          </Text>
        )}

        {gainers.length > 0 && (
          <>
            <Text style={[styles.sectionHeader, { color: theme.positive }]}>Biggest Gainers</Text>
            {gainers.map((g, i) => (
              <MoverRow key={g.code} rank={i + 1} item={g} theme={theme} positive />
            ))}
          </>
        )}

        {losers.length > 0 && (
          <>
            <Text style={[styles.sectionHeader, { color: theme.negative, marginTop: spacing.lg }]}>
              Biggest Losers
            </Text>
            {losers.map((l, i) => (
              <MoverRow key={l.code} rank={i + 1} item={l} theme={theme} positive={false} />
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function MoverRow({ rank, item, theme, positive }) {
  const meta = getCurrencyMeta(item.code);
  return (
    <View style={[styles.row, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <Text style={[styles.rank, { color: theme.textSecondary }]}>{rank}.</Text>
      <Text style={[styles.rowLabel, { color: theme.text }]}>
        {meta.flag} {item.code} — {meta.name}
      </Text>
      <Text style={[styles.rowValue, { color: positive ? theme.positive : theme.negative }]}>
        {item.pct >= 0 ? '+' : ''}
        {item.pct.toFixed(2)}%
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: spacing.md, paddingBottom: spacing.xl },
  title: { fontSize: fontSizes.lg, fontWeight: '800', marginBottom: spacing.md },
  sectionHeader: { fontSize: fontSizes.md, fontWeight: '700', marginBottom: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: spacing.xs,
  },
  rank: { width: 24, fontSize: fontSizes.sm, fontWeight: '700' },
  rowLabel: { flex: 1, fontSize: fontSizes.sm },
  rowValue: { fontSize: fontSizes.sm, fontWeight: '700' },
});
