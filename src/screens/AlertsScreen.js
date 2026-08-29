import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Switch, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCurrency } from '../context/CurrencyContext';
import { useTheme } from '../context/ThemeContext';
import { storage } from '../services/storage';
import { addAlert, removeAlert, toggleAlert } from '../services/alertEngine';
import { getCurrencyMeta } from '../utils/currency';
import { registerForNotifications } from '../services/notificationService';
import { spacing, radius, fontSizes } from '../theme/theme';

const ALERT_TYPES = [
  { key: 'above', label: 'Rate goes above' },
  { key: 'below', label: 'Rate goes below' },
  { key: 'percentChange', label: '24H change exceeds %' },
  { key: 'trendReversal', label: 'Trend reversal' },
];

export default function AlertsScreen({ navigation }) {
  const theme = useTheme();
  const { baseCurrency } = useCurrency();
  const [alerts, setAlerts] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [targetCode, setTargetCode] = useState('USD');
  const [alertType, setAlertType] = useState('above');
  const [threshold, setThreshold] = useState('');

  const load = async () => setAlerts(await storage.getAlerts());

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async () => {
    await registerForNotifications();
    const meta = getCurrencyMeta(targetCode);
    await addAlert({
      type: alertType,
      target: targetCode,
      base: baseCurrency,
      threshold: alertType === 'trendReversal' ? null : parseFloat(threshold) || 0,
      pairLabel: `${targetCode}/${baseCurrency}`,
      symbol: getCurrencyMeta(baseCurrency).symbol,
    });
    setModalVisible(false);
    setThreshold('');
    load();
  };

  const handleToggle = async (id, enabled) => {
    setAlerts(await toggleAlert(id, enabled));
  };

  const handleDelete = async (id) => {
    setAlerts(await removeAlert(id));
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: theme.text }]}>Alerts</Text>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: theme.primary }]}
            onPress={() => setModalVisible(true)}
          >
            <Text style={styles.addButtonText}>+ New Alert</Text>
          </TouchableOpacity>
        </View>

        {alerts.length === 0 && (
          <Text style={{ color: theme.textSecondary, marginTop: spacing.lg }}>
            No alerts yet. Create one to get notified when a currency hits a condition you set.
          </Text>
        )}

        {alerts.map((alert) => (
          <View key={alert.id} style={[styles.alertCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.alertTitle, { color: theme.text }]}>{alert.pairLabel}</Text>
              <Text style={[styles.alertDesc, { color: theme.textSecondary }]}>
                {alert.type === 'above' && `Above ${alert.threshold}`}
                {alert.type === 'below' && `Below ${alert.threshold}`}
                {alert.type === 'percentChange' && `Changes more than ${alert.threshold}%`}
                {alert.type === 'trendReversal' && 'Trend direction reversal'}
              </Text>
            </View>
            <Switch value={alert.enabled} onValueChange={(v) => handleToggle(alert.id, v)} />
            <TouchableOpacity onPress={() => handleDelete(alert.id)} style={{ marginLeft: spacing.sm }}>
              <Text style={{ color: theme.negative, fontSize: fontSizes.sm }}>Delete</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={[styles.modalOverlay, { backgroundColor: theme.overlay }]}>
          <View style={[styles.modalCard, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>New Alert</Text>

            <Text style={[styles.label, { color: theme.textSecondary }]}>Currency</Text>
            <TouchableOpacity
              style={[styles.selectBox, { borderColor: theme.border }]}
              onPress={() =>
                navigation.navigate('SelectCurrency', {
                  purpose: 'alertTarget',
                  onSelect: setTargetCode,
                })
              }
            >
              <Text style={{ color: theme.text }}>
                {getCurrencyMeta(targetCode).flag} {targetCode}
              </Text>
            </TouchableOpacity>

            <Text style={[styles.label, { color: theme.textSecondary }]}>Condition</Text>
            <View style={styles.typeRow}>
              {ALERT_TYPES.map((t) => (
                <TouchableOpacity
                  key={t.key}
                  style={[
                    styles.typeChip,
                    { backgroundColor: alertType === t.key ? theme.primary : theme.cardAlt, borderColor: theme.border },
                  ]}
                  onPress={() => setAlertType(t.key)}
                >
                  <Text style={{ color: alertType === t.key ? '#fff' : theme.text, fontSize: fontSizes.xs }}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {alertType !== 'trendReversal' && (
              <>
                <Text style={[styles.label, { color: theme.textSecondary }]}>
                  {alertType === 'percentChange' ? 'Percent threshold' : `Rate (in ${baseCurrency})`}
                </Text>
                <TextInput
                  style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                  value={threshold}
                  onChangeText={setThreshold}
                  keyboardType="decimal-pad"
                  placeholder="e.g. 95"
                  placeholderTextColor={theme.textSecondary}
                />
              </>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalCancel}>
                <Text style={{ color: theme.textSecondary }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCreate}
                style={[styles.modalCreate, { backgroundColor: theme.primary }]}
              >
                <Text style={{ color: '#fff', fontWeight: '700' }}>Create Alert</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: spacing.md, paddingBottom: spacing.xl },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: fontSizes.lg, fontWeight: '800' },
  addButton: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: radius.pill },
  addButtonText: { color: '#fff', fontWeight: '700', fontSize: fontSizes.xs },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: spacing.md,
  },
  alertTitle: { fontSize: fontSizes.md, fontWeight: '700' },
  alertDesc: { fontSize: fontSizes.xs, marginTop: 2 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalCard: { padding: spacing.lg, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg },
  modalTitle: { fontSize: fontSizes.lg, fontWeight: '800', marginBottom: spacing.md },
  label: { fontSize: fontSizes.xs, marginTop: spacing.sm, marginBottom: spacing.xs },
  selectBox: { borderWidth: StyleSheet.hairlineWidth, borderRadius: radius.sm, padding: spacing.sm },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  typeChip: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: radius.pill, borderWidth: StyleSheet.hairlineWidth, marginRight: 6, marginBottom: 6 },
  input: { borderWidth: StyleSheet.hairlineWidth, borderRadius: radius.sm, padding: spacing.sm, fontSize: fontSizes.md },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: spacing.lg, gap: 12 },
  modalCancel: { paddingVertical: 10, paddingHorizontal: 14 },
  modalCreate: { paddingVertical: 10, paddingHorizontal: 18, borderRadius: radius.sm },
});
