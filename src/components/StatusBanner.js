import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { spacing, radius, fontSizes } from '../theme/theme';
import { formatDistanceToNow } from 'date-fns';

export default function StatusBanner({ status, timestamp, isOffline }) {
  const theme = useTheme();

  let label = '';
  let color = theme.positive;
  let dot = '●';

  if (isOffline) {
    label = "You're offline — showing cached rates";
    color = theme.warning;
  } else if (status === 'error') {
    label = 'Unable to update — showing last known rates';
    color = theme.negative;
  } else if (status === 'delayed') {
    label = 'Latest available data — delayed';
    color = theme.warning;
  } else if (status === 'ok') {
    label = 'Market data available';
    color = theme.positive;
  } else if (status === 'offline') {
    label = 'Showing cached rates';
    color = theme.warning;
  } else {
    label = 'Loading…';
    color = theme.neutral;
  }

  const timeLabel = timestamp
    ? `Last updated ${formatDistanceToNow(new Date(timestamp), { addSuffix: true })}`
    : null;

  return (
    <View style={[styles.container, { backgroundColor: theme.cardAlt }]}>
      <Text style={[styles.dot, { color }]}>{dot}</Text>
      <View style={{ flex: 1 }}>
        <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
        {timeLabel ? <Text style={[styles.time, { color: theme.textSecondary }]}>{timeLabel}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: radius.sm,
    marginBottom: spacing.md,
  },
  dot: { fontSize: 14, marginRight: spacing.sm },
  label: { fontSize: fontSizes.sm, fontWeight: '600' },
  time: { fontSize: fontSizes.xs, marginTop: 2 },
});
