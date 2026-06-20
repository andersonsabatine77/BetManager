import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function OddsComparison({ casas = [], theme }) {
  const { colors } = theme;
  if (!casas || casas.length === 0) return null;

  const maxOdd = Math.max(...casas.map(c => c.odd));

  return (
    <View style={styles.container}>
      {casas.map((casa, i) => {
        const isBest = casa.odd === maxOdd;
        return (
          <View
            key={i}
            style={[
              styles.row,
              { borderBottomColor: colors.border },
              isBest && { backgroundColor: colors.success + '18' },
            ]}
          >
            <View style={styles.nameRow}>
              {isBest && <Ionicons name="star" size={12} color={colors.success} style={{ marginRight: 4 }} />}
              <Text style={[styles.casa, { color: isBest ? colors.success : colors.text }]}>
                {casa.nome}
              </Text>
            </View>
            <Text style={[styles.odd, { color: isBest ? colors.success : colors.primary }]}>
              {casa.odd.toFixed(2)}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 10,
    overflow: 'hidden',
    marginTop: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderBottomWidth: 0.5,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  casa: {
    fontSize: 13,
    fontWeight: '500',
  },
  odd: {
    fontSize: 14,
    fontWeight: '700',
  },
});
