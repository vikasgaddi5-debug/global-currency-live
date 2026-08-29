import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import { useCurrency } from '../context/CurrencyContext';
import { useTheme } from '../context/ThemeContext';
import { getCurrencyMeta, getCrossRate, formatRate, percentChange } from '../utils/currency';
import { classifyTrend, trendArrow } from '../services/trendEngine';
import { fetchHistoricalRates } from '../services/apiClient';
import { CHART_RANGES } from '../constants/currencies';
import { spacing, radius, fontSizes } from '../theme/theme';

export default function CurrencyDetailScreen({ route, navigation }) {
  const { code } = route.params;
  const theme = useTheme();
  const { baseCurrency, ratesData, previousRatesData, toggleFavorite, favorites } = useCurrency();
  const [range, setRange] = useState('1D');
  const [chartState, setChartState] = useState({ loading: true, points: [], error: null });
  const [selectedPoint, setSelectedPoint] = useState(null);

  const meta = getCurrencyMeta(code);
  const baseMeta = getCurrencyMeta(baseCurrency);
  const isFavorite = favorites.includes(code);

  const rate = ratesData ? getCrossRate(ratesData.rates, ratesData.base, code, baseCurrency) : null;
  const prevRate =
    ratesData && previousRatesData
      ? getCrossRate(previousRatesData.rates, previousRatesData.base, code, baseCurrency)
      : null;
  const pct24h = percentChange(prevRate, rate);
  const trend = classifyTrend(pct24h);

  useEffect(() => {
    let cancelled = false;
    setChartState({ loading: true, points: [], error: null });
    fetchHistoricalRates(baseCurrency, code, range)
      .then((data) => {
        if (!cancelled) setChartState({ loading: false, points: data.points, error: null });
      })
      .catch((err) => {
        if (!cancelled) setChartState({ loading: false, points: [], error: err });
      });
    return () => {
      cancelled = true;
    };
  }, [code, baseCurrency, range]);

  const chartData = useMemo(() => {
    if (!chartState.points.length) return null;
    const labels = chartState.points.map((p, i) =>
      i % Math.ceil(chartState.points.length / 5) === 0
        ? new Date(p.t).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
        : ''
    );
    return {
      labels,
      datasets: [{ data: chartState.points.map((p) => p.rate) }],
    };
  }, [chartState.points]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: theme.text }]}>
            {meta.flag} {meta.name} ({code})
          </Text>
          <TouchableOpacity onPress={() => toggleFavorite(code)}>
            <Text style={{ fontSize: 26, color: isFavorite ? theme.warning : theme.neutral }}>
              {isFavorite ? '★' : '☆'}
            </Text>
          </TouchableOpacity>
        </View>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Compared against {baseMeta.name} ({baseCurrency})
        </Text>

        <View style={[styles.rateCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.bigRate, { color: theme.text }]}>
            1 {code} = {baseMeta.symbol}
            {formatRate(rate)}
          </Text>
          <Text
            style={[
              styles.trendLabel,
              { color: pct24h == null ? theme.neutral : pct24h >= 0 ? theme.positive : theme.negative },
            ]}
          >
            {trend} {trendArrow(trend)} {pct24h != null ? `(${pct24h.toFixed(2)}% today)` : ''}
          </Text>
        </View>

        <View style={styles.rangeRow}>
          {CHART_RANGES.map((r) => (
            <TouchableOpacity
              key={r}
              onPress={() => setRange(r)}
              style={[
                styles.rangeChip,
                { backgroundColor: range === r ? theme.primary : theme.card, borderColor: theme.border },
              ]}
            >
              <Text style={{ color: range === r ? '#fff' : theme.text, fontSize: fontSizes.xs }}>{r}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={[styles.chartCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {chartState.loading ? (
            <Text style={{ color: theme.textSecondary, padding: spacing.lg, textAlign: 'center' }}>
              Loading chart…
            </Text>
          ) : chartState.error ? (
            <Text style={{ color: theme.textSecondary, padding: spacing.lg, textAlign: 'center' }}>
              {chartState.error.code === 'NO_HISTORICAL_DATA'
                ? 'Historical data is not available yet for this range. Connect a historical FX provider in the backend to enable charts.'
                : 'Unable to load chart data right now.'}
            </Text>
          ) : chartData ? (
            <>
              <LineChart
                data={chartData}
                width={Dimensions.get('window').width - spacing.md * 4}
                height={220}
                yAxisSuffix=""
                withInnerLines={false}
                chartConfig={{
                  backgroundColor: theme.card,
                  backgroundGradientFrom: theme.card,
                  backgroundGradientTo: theme.card,
                  decimalPlaces: 4,
                  color: () => theme.primary,
                  labelColor: () => theme.textSecondary,
                  propsForDots: { r: '0' },
                }}
                bezier
                onDataPointClick={({ index }) => setSelectedPoint(chartState.points[index])}
                style={{ borderRadius: radius.md }}
              />
              {selectedPoint && (
                <Text style={[styles.pointLabel, { color: theme.text }]}>
                  {new Date(selectedPoint.t).toLocaleString()} — {formatRate(selectedPoint.rate)}
                </Text>
              )}
            </>
          ) : null}
        </View>

        <View style={styles.changesGrid}>
          {['24H', '7D', '30D', '90D', '1Y'].map((label) => (
            <View key={label} style={[styles.changeCell, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={[styles.changeCellLabel, { color: theme.textSecondary }]}>{label} Change</Text>
              <Text style={[styles.changeCellValue, { color: theme.textSecondary }]}>
                {label === '24H' && pct24h != null ? `${pct24h.toFixed(2)}%` : 'Needs history data'}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: spacing.md, paddingBottom: spacing.xl },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: fontSizes.lg, fontWeight: '800', flex: 1 },
  subtitle: { fontSize: fontSizes.sm, marginTop: spacing.xs, marginBottom: spacing.md },
  rateCard: { padding: spacing.md, borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth, marginBottom: spacing.md },
  bigRate: { fontSize: fontSizes.xxl, fontWeight: '800' },
  trendLabel: { fontSize: fontSizes.sm, marginTop: spacing.xs, fontWeight: '700' },
  rangeRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.sm },
  rangeChip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    marginRight: 6,
    marginBottom: 6,
  },
  chartCard: { borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth, marginBottom: spacing.md, overflow: 'hidden' },
  pointLabel: { textAlign: 'center', padding: spacing.sm, fontSize: fontSizes.xs },
  changesGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  changeCell: {
    width: '48%',
    padding: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: spacing.sm,
  },
  changeCellLabel: { fontSize: fontSizes.xs },
  changeCellValue: { fontSize: fontSizes.sm, fontWeight: '700', marginTop: 4 },
});
