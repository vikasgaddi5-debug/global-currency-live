import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCurrency } from '../context/CurrencyContext';
import { useTheme } from '../context/ThemeContext';
import { getCurrencyMeta } from '../utils/currency';
import { REFRESH_INTERVALS } from '../constants/currencies';
import { apiConfig } from '../services/apiClient';
import { registerForNotifications } from '../services/notificationService';
import { formatDistanceToNow } from 'date-fns';
import { spacing, radius, fontSizes } from '../theme/theme';

const THEME_OPTIONS = ['light', 'dark', 'system'];
const DECIMAL_OPTIONS = [2, 4, 6];

export default function SettingsScreen({ navigation }) {
  const theme = useTheme();
  const { baseCurrency, settings, updateSettings, ratesData } = useCurrency();

  if (!settings) return null;

  const handleNotificationToggle = async (value) => {
    if (value) {
      const result = await registerForNotifications();
      if (!result.granted) {
        updateSettings({ notificationsEnabled: false });
        return;
      }
    }
    updateSettings({ notificationsEnabled: value });
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[styles.title, { color: theme.text }]}>Settings</Text>

        <Section title="Currency" theme={theme}>
          <TouchableOpacity
            style={styles.optionRow}
            onPress={() => navigation.navigate('SelectCurrency', { purpose: 'base' })}
          >
            <Text style={[styles.optionLabel, { color: theme.text }]}>Base currency</Text>
            <Text style={{ color: theme.primary }}>
              {getCurrencyMeta(baseCurrency).flag} {baseCurrency}
            </Text>
          </TouchableOpacity>
        </Section>

        <Section title="Refresh" theme={theme}>
          {REFRESH_INTERVALS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={styles.optionRow}
              onPress={() => updateSettings({ refreshIntervalSec: opt.value })}
            >
              <Text style={[styles.optionLabel, { color: theme.text }]}>{opt.label}</Text>
              {settings.refreshIntervalSec === opt.value && <Text style={{ color: theme.primary }}>✓</Text>}
            </TouchableOpacity>
          ))}
        </Section>

        <Section title="Notifications" theme={theme}>
          <View style={styles.optionRow}>
            <Text style={[styles.optionLabel, { color: theme.text }]}>Enable notifications</Text>
            <Switch value={settings.notificationsEnabled} onValueChange={handleNotificationToggle} />
          </View>
        </Section>

        <Section title="Theme" theme={theme}>
          {THEME_OPTIONS.map((t) => (
            <TouchableOpacity key={t} style={styles.optionRow} onPress={() => updateSettings({ theme: t })}>
              <Text style={[styles.optionLabel, { color: theme.text, textTransform: 'capitalize' }]}>{t}</Text>
              {settings.theme === t && <Text style={{ color: theme.primary }}>✓</Text>}
            </TouchableOpacity>
          ))}
        </Section>

        <Section title="Display" theme={theme}>
          <Text style={[styles.subLabel, { color: theme.textSecondary }]}>Decimal places</Text>
          <View style={styles.chipsRow}>
            {DECIMAL_OPTIONS.map((d) => (
              <TouchableOpacity
                key={d}
                style={[
                  styles.chip,
                  { backgroundColor: settings.decimalPlaces === d ? theme.primary : theme.cardAlt },
                ]}
                onPress={() => updateSettings({ decimalPlaces: d })}
              >
                <Text style={{ color: settings.decimalPlaces === d ? '#fff' : theme.text }}>{d}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Section>

        <Section title="Data" theme={theme}>
          <Text style={[styles.subLabel, { color: theme.textSecondary }]}>
            Source: {ratesData?.source || 'Not yet loaded'}
          </Text>
          <Text style={[styles.subLabel, { color: theme.textSecondary }]}>
            Backend proxy: {apiConfig.USE_BACKEND ? 'Connected' : 'Not configured (using dev fallback)'}
          </Text>
          {ratesData?.timestamp && (
            <Text style={[styles.subLabel, { color: theme.textSecondary }]}>
              Last successful update: {formatDistanceToNow(new Date(ratesData.timestamp), { addSuffix: true })}
            </Text>
          )}
        </Section>

        <Section title="Timezone" theme={theme}>
          <TouchableOpacity style={styles.optionRow} onPress={() => updateSettings({ timezone: 'automatic' })}>
            <Text style={[styles.optionLabel, { color: theme.text }]}>Automatic</Text>
            {settings.timezone === 'automatic' && <Text style={{ color: theme.primary }}>✓</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={styles.optionRow} onPress={() => updateSettings({ timezone: 'manual' })}>
            <Text style={[styles.optionLabel, { color: theme.text }]}>Manual</Text>
            {settings.timezone === 'manual' && <Text style={{ color: theme.primary }}>✓</Text>}
          </TouchableOpacity>
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children, theme }) {
  return (
    <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: spacing.md, paddingBottom: spacing.xl },
  title: { fontSize: fontSizes.lg, fontWeight: '800', marginBottom: spacing.md },
  section: { borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth, padding: spacing.md, marginBottom: spacing.md },
  sectionTitle: { fontSize: fontSizes.xs, fontWeight: '700', marginBottom: spacing.sm, textTransform: 'uppercase' },
  optionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm },
  optionLabel: { fontSize: fontSizes.sm },
  subLabel: { fontSize: fontSizes.xs, marginBottom: 4 },
  chipsRow: { flexDirection: 'row', gap: 8, marginTop: spacing.xs },
  chip: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: radius.pill },
});
