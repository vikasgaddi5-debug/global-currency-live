import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCurrency } from '../context/CurrencyContext';
import { useTheme } from '../context/ThemeContext';
import { getCurrencyMeta } from '../utils/currency';
import { spacing, radius, fontSizes } from '../theme/theme';

export default function SelectCurrencyScreen({ route, navigation }) {
  const purpose = route.params?.purpose || 'base'; // 'base' | 'converterFrom' | 'converterTo' | 'compareAdd'
  const onSelect = route.params?.onSelect;
  const theme = useTheme();
  const { ratesData, setBaseCurrency } = useCurrency();
  const [query, setQuery] = useState('');

  const allCodes = useMemo(() => {
    if (!ratesData) return [];
    return Object.keys(ratesData.rates).sort();
  }, [ratesData]);

  const filtered = useMemo(() => {
    if (!query.trim()) return allCodes;
    const q = query.trim().toLowerCase();
    return allCodes.filter((code) => {
      const meta = getCurrencyMeta(code);
      return (
        code.toLowerCase().includes(q) ||
        meta.name.toLowerCase().includes(q) ||
        meta.country.toLowerCase().includes(q)
      );
    });
  }, [allCodes, query]);

  const handleSelect = async (code) => {
    if (purpose === 'base') {
      await setBaseCurrency(code);
      navigation.goBack();
    } else if (onSelect) {
      onSelect(code);
      navigation.goBack();
    } else {
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Select Currency</Text>
        <TextInput
          style={[styles.search, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
          placeholder="Search by country, currency, or code"
          placeholderTextColor={theme.textSecondary}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          accessibilityLabel="Search currencies"
        />
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item}
        contentContainerStyle={{ padding: spacing.md }}
        ListEmptyComponent={
          <Text style={{ color: theme.textSecondary, textAlign: 'center', marginTop: spacing.lg }}>
            No currencies match your search.
          </Text>
        }
        renderItem={({ item: code }) => {
          const meta = getCurrencyMeta(code);
          return (
            <TouchableOpacity
              style={[styles.item, { borderColor: theme.border }]}
              onPress={() => handleSelect(code)}
              accessibilityRole="button"
              accessibilityLabel={`${meta.country}, ${meta.name}, ${code}`}
            >
              <Text style={styles.flag}>{meta.flag}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.country, { color: theme.text }]}>{meta.country}</Text>
                <Text style={[styles.currencyName, { color: theme.textSecondary }]}>{meta.name}</Text>
              </View>
              <Text style={[styles.code, { color: theme.primary }]}>
                {code} {meta.symbol}
              </Text>
            </TouchableOpacity>
          );
        }}
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
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  flag: { fontSize: 26, marginRight: spacing.sm },
  country: { fontSize: fontSizes.sm, fontWeight: '700' },
  currencyName: { fontSize: fontSizes.xs, marginTop: 2 },
  code: { fontSize: fontSizes.sm, fontWeight: '700' },
});
