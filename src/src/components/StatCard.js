import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function StatCard({ icon, label, value, delta, color, theme }) {
  const { colors } = theme;

  const deltaColor = delta === undefined
    ? colors.textSecondary
    : delta >= 0 ? colors.success : colors.danger;

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.iconWrap, { backgroundColor: color + '22' }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text style={[styles.value, { color: colors.text }]} numberOfLines={1}>
        {value}
      </Text>
      <Text style={[styles.label, { color: colors.textSecondary }]} numberOfLines={1}>
        {label}
      </Text>
      {delta !== undefined && (
        <Text style={[styles.delta, { color: deltaColor }]}>
          {delta >= 0 ? '▲' : '▼'} {Math.abs(delta).toFixed(1)}%
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    marginHorizontal: 4,
    minWidth: 80,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  value: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  label: {
    fontSize: 10,
    textAlign: 'center',
    marginTop: 2,
  },
  delta: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 4,
  },
});
