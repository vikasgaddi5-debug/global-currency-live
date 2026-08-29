import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCurrency } from '../context/CurrencyContext';
import { useTheme } from '../context/ThemeContext';
import { getCurrencyMeta, getCrossRate, formatMoney, formatRate, percentChange } from '../utils/currency';
import { formatDistanceToNow } from 'date-fns';
import { spacing, radius, fontSizes } from '../theme/theme';

const QUICK_AMOUNTS = [100, 1000, 10000, 50000, 100000];

export default function ConverterScreen({ navigation }) {
  const theme = useTheme();
  const { baseCurrency, ratesData, previousRatesData } = useCurrency();
  const [fromCode, setFromCode] = useState(baseCurrency);
  const [toCode, setToCode] = useState('USD');
  const [amount, setAmount] = useState('100000');

  const fromMeta = getCurrencyMeta(fromCode);
  const toMeta = getCurrencyMeta(toCode);

  const rate = ratesData ? getCrossRate(ratesData.rates, ratesData.base, fromCode, toCode) : null;
  const prevRate =
    ratesData && previousRatesData
      ? getCrossRate(previousRatesData.rates, previousRatesData.base, fromCode, toCode)
      : null;
  const pct = percentChange(prevRate, rate);

  const numericAmount = parseFloat(amount.replace(/,/g, '')) || 0;
  const result = rate !== null ? numericAmount * rate : null;

  const swap = () => {
    setFromCode(toCode);
    setToCode(fromCode);
  };

  const openPicker = (which) => {
    navigation.navigate('SelectCurrency', {
      purpose: which === 'from' ? 'converterFrom' : 'converterTo',
      onSelect: (code) => (which === 'from' ? setFromCode(code) : setToCode(code)),
    });
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[styles.title, { color: theme.text }]}>Converter</Text>

        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>From</Text>
          <TouchableOpacity style={styles.currencyPicker} onPress={() => openPicker('from')}>
            <Text style={styles.flag}>{fromMeta.flag}</Text>
            <Text style={[styles.currencyCode, { color: theme.text }]}>{fromCode}</Text>
          </TouchableOpacity>
          <TextInput
            style={[styles.amountInput, { color: theme.text, borderColor: theme.border }]}
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            placeholder="Amount"
            placeholderTextColor={theme.textSecondary}
            accessibilityLabel="Amount to convert"
          />
          <View style={styles.quickRow}>
            {QUICK_AMOUNTS.map((qa) => (
              <TouchableOpacity
                key={qa}
                style={[styles.quickChip, { borderColor: theme.border }]}
                onPress={() => setAmount(String(qa))}
              >
                <Text style={{ color: theme.text, fontSize: fontSizes.xs }}>
                  {formatMoney(qa, fromMeta.symbol, 0)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity
          onPress={swap}
          style={[styles.swapButton, { backgroundColor: theme.primary }]}
          accessibilityLabel="Swap currencies"
        >
          <Text style={styles.swapText}>⇅ Swap</Text>
        </TouchableOpacity>

        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>To</Text>
          <TouchableOpacity style={styles.currencyPicker} onPress={() => openPicker('to')}>
            <Text style={styles.flag}>{toMeta.flag}</Text>
            <Text style={[styles.currencyCode, { color: theme.text }]}>{toCode}</Text>
          </TouchableOpacity>
          <Text style={[styles.resultText, { color: theme.text }]}>
            {result !== null ? formatMoney(result, toMeta.symbol) : 'Rate unavailable'}
          </Text>
        </View>

        <View style={[styles.metaCard, { backgroundColor: theme.cardAlt }]}>
          <Text style={[styles.metaText, { color: theme.textSecondary }]}>
            1 {fromCode} = {formatRate(rate)} {toCode}
          </Text>
          {pct != null && (
            <Text style={[styles.metaText, { color: pct >= 0 ? theme.positive : theme.negative }]}>
              24H change: {pct >= 0 ? '+' : ''}
              {pct.toFixed(2)}%
            </Text>
          )}
          {ratesData?.timestamp && (
            <Text style={[styles.metaText, { color: theme.textSecondary }]}>
              Last updated {formatDistanceToNow(new Date(ratesData.timestamp), { addSuffix: true })}
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: spacing.md, paddingBottom: spacing.xl },
  title: { fontSize: fontSizes.lg, fontWeight: '800', marginBottom: spacing.md },
  card: { padding: spacing.md, borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth, marginBottom: spacing.sm },
  label: { fontSize: fontSizes.xs, marginBottom: spacing.xs },
  currencyPicker: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  flag: { fontSize: 28, marginRight: spacing.sm },
  currencyCode: { fontSize: fontSizes.lg, fontWeight: '800' },
  amountInput: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.sm,
    padding: spacing.sm,
    fontSize: fontSizes.lg,
    marginBottom: spacing.sm,
  },
  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  quickChip: { borderWidth: StyleSheet.hairlineWidth, borderRadius: radius.pill, paddingVertical: 6, paddingHorizontal: 10 },
  swapButton: { alignSelf: 'center', paddingVertical: 8, paddingHorizontal: 20, borderRadius: radius.pill, marginVertical: spacing.sm },
  swapText: { color: '#fff', fontWeight: '700' },
  resultText: { fontSize: fontSizes.xxl, fontWeight: '800' },
  metaCard: { padding: spacing.md, borderRadius: radius.md, marginTop: spacing.sm },
  metaText: { fontSize: fontSizes.sm, marginBottom: 4 },
});
