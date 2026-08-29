import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCurrency } from '../context/CurrencyContext';
import { useTheme } from '../context/ThemeContext';
import { getCurrencyMeta, getCrossRate, percentChange } from '../utils/currency';
import { classifyTrend } from '../services/trendEngine';
import CurrencyRow from '../components/CurrencyRow';
import { spacing, radius, fontSizes } from '../theme/theme';

const SORT_OPTIONS = [
  { key: 'gain', label: 'Highest Gain' },
  { key: 'loss', label: 'Highest Loss' },
  { key: 'alpha', label: 'Alphabetical' },
];

export default function AllCurrenciesScreen({ navigation }) {
  const theme = useTheme();
  const { ratesData, previousRatesData, baseCurrency, favorites, toggleFavorite } = useCurrency();
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState('alpha');
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  const rows = useMemo(() => {
    if (!ratesData) return [];
    let codes = Object.keys(ratesData.rates);

    if (favoritesOnly) codes = codes.filter((c) => favorites.includes(c));

    if (query.trim()) {
      const q = query.trim().toLowerCase();
      codes = codes.filter((code) => {
        const meta = getCurrencyMeta(code);
        return (
          code.toLowerCase().includes(q) ||
          meta.name.toLowerCase().includes(q) ||
          meta.country.toLowerCase().includes(q)
        );
      });
    }

    let list = codes.map((code) => {
      const rate = getCrossRate(ratesData.rates, ratesData.base, code, baseCurrency);
      const prevRate = previousRatesData
        ? getCrossRate(previousRatesData.rates, previousRatesData.base, code, baseCurrency)
        : null;
      const pct = percentChange(prevRate, rate);
      return { code, rate, percentChange24h: pct, trend: classifyTrend(pct) };
    });

    if (sortKey === 'gain') list.sort((a, b) => (b.percentChange24h ?? -Infinity) - (a.percentChange24h ?? -Infinity));
    if (sortKey === 'loss') list.sort((a, b) => (a.percentChange24h ?? Infinity) - (b.percentChange24h ?? Infinity));
    if (sortKey === 'alpha') list.sort((a, b) => a.code.localeCompare(b.code));

    return list;
  }, [ratesData, previousRatesData, baseCurrency, query, sortKey, favoritesOnly, favorites]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>All Currencies</Text>
        <TextInput
          style={[styles.search, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
          placeholder="Search country, currency, or code"
          placeholderTextColor={theme.textSecondary}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
        />
        <View style={styles.filterRow}>
          {SORT_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.key}
              style={[
                styles.chip,
                {
                  backgroundColor: sortKey === opt.key ? theme.primary : theme.card,
                  borderColor: theme.border,
                },
              ]}
              onPress={() => setSortKey(opt.key)}
            >
              <Text style={{ color: sortKey === opt.key ? '#fff' : theme.text, fontSize: fontSizes.xs }}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={[
              styles.chip,
              { backgroundColor: favoritesOnly ? theme.warning : theme.card, borderColor: theme.border },
            ]}
            onPress={() => setFavoritesOnly((v) => !v)}
          >
            <Text style={{ color: favoritesOnly ? '#fff' : theme.text, fontSize: fontSizes.xs }}>★ Favorites</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={rows}
        keyExtractor={(item) => item.code}
        contentContainerStyle={{ padding: spacing.md }}
        renderItem={({ item }) => (
          <CurrencyRow
            code={item.code}
            rate={item.rate}
            percentChange24h={item.percentChange24h}
            trend={item.trend}
            isFavorite={favorites.includes(item.code)}
            onPress={() => navigation.navigate('CurrencyDetail', { code: item.code })}
            onToggleFavorite={() => toggleFavorite(item.code)}
          />
        )}
        ListEmptyComponent={
          <Text style={{ color: theme.textSecondary, textAlign: 'center', marginTop: spacing.lg }}>
            No currencies found.
          </Text>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { padding: spacing.md },
  title: { fontSize: fontSizes.lg, fontWeight: '800', marginBottom: spacing.sm },
  search: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
    padding: spacing.sm,
    fontSize: fontSizes.sm,
    marginBottom: spacing.sm,
  },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    marginRight: 6,
    marginBottom: 6,
  },
});
