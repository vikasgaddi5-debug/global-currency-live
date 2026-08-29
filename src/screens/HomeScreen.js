import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCurrency } from '../context/CurrencyContext';
import { useTheme } from '../context/ThemeContext';
import { getCurrencyMeta, getCrossRate, formatRate, percentChange } from '../utils/currency';
import { classifyTrend } from '../services/trendEngine';
import CurrencyRow from '../components/CurrencyRow';
import StatusBanner from '../components/StatusBanner';
import { spacing, fontSizes, radius } from '../theme/theme';

const HOME_HIGHLIGHTS = ['USD', 'EUR', 'GBP', 'JPY'];

export default function HomeScreen({ navigation }) {
  const theme = useTheme();
  const {
    baseCurrency,
    ratesData,
    previousRatesData,
    status,
    isOffline,
    favorites,
    toggleFavorite,
    manualRefresh,
  } = useCurrency();

  const baseMeta = getCurrencyMeta(baseCurrency);

  const rows = useMemo(() => {
    if (!ratesData) return [];
    return HOME_HIGHLIGHTS.map((code) => {
      const rate = getCrossRate(ratesData.rates, ratesData.base, code, baseCurrency);
      const prevRate = previousRatesData
        ? getCrossRate(previousRatesData.rates, previousRatesData.base, code, baseCurrency)
        : null;
      const pct = percentChange(prevRate, rate);
      return { code, rate, percentChange24h: pct, trend: classifyTrend(pct) };
    });
  }, [ratesData, previousRatesData, baseCurrency]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={false} onRefresh={manualRefresh} />}
      >
        <Text style={[styles.appTitle, { color: theme.text }]}>Global Currency Live</Text>

        <StatusBanner status={status} timestamp={ratesData?.timestamp} isOffline={isOffline} />

        <TouchableOpacity
          style={[styles.myCurrencyCard, { backgroundColor: theme.card, borderColor: theme.border }]}
          onPress={() => navigation.navigate('SelectCurrency', { purpose: 'base' })}
          accessibilityRole="button"
          accessibilityLabel={`My currency: ${baseMeta.name}. Tap to change.`}
        >
          <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>My Currency</Text>
          <View style={styles.myCurrencyRow}>
            <Text style={styles.myCurrencyFlag}>{baseMeta.flag}</Text>
            <Text style={[styles.myCurrencyText, { color: theme.text }]}>
              {baseCurrency} — {baseMeta.name}
            </Text>
          </View>
          <Text style={[styles.changeLink, { color: theme.primary }]}>Tap to change</Text>
        </TouchableOpacity>

        <Text style={[styles.sectionHeader, { color: theme.text }]}>Top Currencies</Text>
        {rows.length === 0 && status === 'loading' ? (
          <Text style={{ color: theme.textSecondary }}>Loading rates…</Text>
        ) : (
          rows.map((r) => (
            <CurrencyRow
              key={r.code}
              code={r.code}
              rate={r.rate}
              percentChange24h={r.percentChange24h}
              trend={r.trend}
              isFavorite={favorites.includes(r.code)}
              onPress={() => navigation.navigate('CurrencyDetail', { code: r.code })}
              onToggleFavorite={() => toggleFavorite(r.code)}
            />
          ))
        )}

        <View style={styles.quickActions}>
          <QuickAction
            label="Converter"
            theme={theme}
            onPress={() => navigation.navigate('Converter')}
          />
          <QuickAction
            label="Top Movers"
            theme={theme}
            onPress={() => navigation.navigate('TopMovers')}
          />
          <QuickAction
            label="Strength"
            theme={theme}
            onPress={() => navigation.navigate('CurrencyStrength')}
          />
          <QuickAction
            label="Favorites"
            theme={theme}
            onPress={() => navigation.navigate('Favorites')}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function QuickAction({ label, onPress, theme }) {
  return (
    <TouchableOpacity
      style={[styles.quickAction, { backgroundColor: theme.card, borderColor: theme.border }]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text style={[styles.quickActionText, { color: theme.primary }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: spacing.md, paddingBottom: spacing.xl },
  appTitle: { fontSize: fontSizes.xl, fontWeight: '800', marginBottom: spacing.md },
  sectionLabel: { fontSize: fontSizes.xs, fontWeight: '600', marginBottom: spacing.xs },
  myCurrencyCard: {
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: spacing.lg,
  },
  myCurrencyRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs },
  myCurrencyFlag: { fontSize: 30, marginRight: spacing.sm },
  myCurrencyText: { fontSize: fontSizes.lg, fontWeight: '700' },
  changeLink: { marginTop: spacing.sm, fontSize: fontSizes.sm, fontWeight: '600' },
  sectionHeader: { fontSize: fontSizes.md, fontWeight: '700', marginBottom: spacing.sm },
  quickActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.md },
  quickAction: {
    flex: 1,
    marginHorizontal: 4,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
  },
  quickActionText: { fontWeight: '700', fontSize: fontSizes.sm },
});
