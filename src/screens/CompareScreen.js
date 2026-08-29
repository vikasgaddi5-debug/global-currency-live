import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCurrency } from '../context/CurrencyContext';
import { useTheme } from '../context/ThemeContext';
import { getCurrencyMeta, getCrossRate, formatRate, percentChange } from '../utils/currency';
import { classifyTrend, trendArrow } from '../services/trendEngine';
import { spacing, radius, fontSizes } from '../theme/theme';

const DEFAULT_COMPARE = ['USD', 'EUR', 'GBP', 'JPY', 'AED'];

export default function CompareScreen({ navigation }) {
  const theme = useTheme();
  const { baseCurrency, ratesData, previousRatesData } = useCurrency();
  const [selected, setSelected] = useState(DEFAULT_COMPARE);

  const rows = useMemo(() => {
    if (!ratesData) return [];
    return selected.map((code) => {
      const rate = getCrossRate(ratesData.rates, ratesData.base, code, baseCurrency);
      const prevRate = previousRatesData
        ? getCrossRate(previousRatesData.rates, previousRatesData.base, code, baseCurrency)
        : null;
      const pct = percentChange(prevRate, rate);
      return { code, rate, pct, trend: classifyTrend(pct) };
    });
  }, [ratesData, previousRatesData, baseCurrency, selected]);

  const toggleSelect = (code) => {
    setSelected((prev) => (prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]));
  };

  const addCurrency = () => {
    navigation.navigate('SelectCurrency', {
      purpose: 'compareAdd',
      onSelect: (code) => setSelected((prev) => (prev.includes(code) ? prev : [...prev, code])),
    });
  };

  const baseMeta = getCurrencyMeta(baseCurrency);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[styles.title, { color: theme.text }]}>Compare</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Against {baseMeta.flag} {baseCurrency}
        </Text>

        <View style={styles.chipsRow}>
          {rows.map((r) => (
            <TouchableOpacity
              key={r.code}
              style={[styles.chip, { backgroundColor: theme.primary }]}
              onPress={() => toggleSelect(r.code)}
            >
              <Text style={styles.chipText}>{r.code} ×</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={[styles.chip, { backgroundColor: theme.cardAlt }]} onPress={addCurrency}>
            <Text style={{ color: theme.text }}>+ Add</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.table, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={[styles.tableHeader, { borderColor: theme.border }]}>
            <Text style={[styles.headerCell, { color: theme.textSecondary, flex: 1.4 }]}>Currency</Text>
            <Text style={[styles.headerCell, { color: theme.textSecondary, flex: 1 }]}>Rate</Text>
            <Text style={[styles.headerCell, { color: theme.textSecondary, flex: 1 }]}>24H</Text>
            <Text style={[styles.headerCell, { color: theme.textSecondary, flex: 1 }]}>Trend</Text>
          </View>
          {rows.map((r) => {
            const meta = getCurrencyMeta(r.code);
            return (
              <View key={r.code} style={[styles.tableRow, { borderColor: theme.border }]}>
                <Text style={[styles.cell, { color: theme.text, flex: 1.4 }]}>
                  {meta.flag} {r.code}
                </Text>
                <Text style={[styles.cell, { color: theme.text, flex: 1 }]}>{formatRate(r.rate)}</Text>
                <Text
                  style={[
                    styles.cell,
                    { flex: 1, color: r.pct == null ? theme.neutral : r.pct >= 0 ? theme.positive : theme.negative },
                  ]}
                >
                  {r.pct != null ? `${r.pct >= 0 ? '+' : ''}${r.pct.toFixed(2)}%` : '—'}
                </Text>
                <Text style={[styles.cell, { color: theme.text, flex: 1 }]}>
                  {trendArrow(r.trend)}
                </Text>
              </View>
            );
          })}
        </View>

        <Text style={[styles.note, { color: theme.textSecondary }]}>
          Note: 7D and 30D comparison columns require the backend's historical data provider to be configured.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: spacing.md, paddingBottom: spacing.xl },
  title: { fontSize: fontSizes.lg, fontWeight: '800' },
  subtitle: { fontSize: fontSizes.sm, marginBottom: spacing.md, marginTop: 4 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.md, gap: 6 },
  chip: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: radius.pill, marginRight: 6, marginBottom: 6 },
  chipText: { color: '#fff', fontWeight: '600', fontSize: fontSizes.xs },
  table: { borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  tableHeader: { flexDirection: 'row', padding: spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth },
  headerCell: { fontSize: fontSizes.xs, fontWeight: '700' },
  tableRow: { flexDirection: 'row', padding: spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth },
  cell: { fontSize: fontSizes.sm },
  note: { fontSize: fontSizes.xs, marginTop: spacing.md, fontStyle: 'italic' },
});
