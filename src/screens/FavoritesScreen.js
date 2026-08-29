import React, { useMemo } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCurrency } from '../context/CurrencyContext';
import { useTheme } from '../context/ThemeContext';
import { getCrossRate, percentChange } from '../utils/currency';
import { classifyTrend } from '../services/trendEngine';
import CurrencyRow from '../components/CurrencyRow';
import { spacing, fontSizes } from '../theme/theme';

export default function FavoritesScreen({ navigation }) {
  const theme = useTheme();
  const { baseCurrency, ratesData, previousRatesData, favorites, toggleFavorite } = useCurrency();

  const rows = useMemo(() => {
    if (!ratesData) return [];
    return favorites.map((code) => {
      const rate = getCrossRate(ratesData.rates, ratesData.base, code, baseCurrency);
      const prevRate = previousRatesData
        ? getCrossRate(previousRatesData.rates, previousRatesData.base, code, baseCurrency)
        : null;
      const pct = percentChange(prevRate, rate);
      return { code, rate, percentChange24h: pct, trend: classifyTrend(pct) };
    });
  }, [ratesData, previousRatesData, baseCurrency, favorites]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>Favorites</Text>
      <FlatList
        data={rows}
        keyExtractor={(item) => item.code}
        contentContainerStyle={{ padding: spacing.md }}
        ListEmptyComponent={
          <Text style={{ color: theme.textSecondary, textAlign: 'center', marginTop: spacing.lg }}>
            No favorites yet. Tap the star on any currency to save it here.
          </Text>
        }
        renderItem={({ item }) => (
          <CurrencyRow
            code={item.code}
            rate={item.rate}
            percentChange24h={item.percentChange24h}
            trend={item.trend}
            isFavorite
            onPress={() => navigation.navigate('CurrencyDetail', { code: item.code })}
            onToggleFavorite={() => toggleFavorite(item.code)}
          />
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  title: { fontSize: fontSizes.lg, fontWeight: '800', paddingHorizontal: spacing.md, paddingTop: spacing.md },
});
