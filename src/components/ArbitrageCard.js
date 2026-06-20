import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatBRL } from '../utils/calculations';

export default function ArbitrageCard({ arb, theme }) {
  const { colors } = theme;
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.success + '44' }]}>
      <TouchableOpacity style={styles.header} onPress={() => setExpanded(!expanded)}>
        <View style={[styles.badge, { backgroundColor: colors.success + '22' }]}>
          <Ionicons name="trending-up" size={14} color={colors.success} />
          <Text style={[styles.profitText, { color: colors.success }]}>
            +{arb.lucroGarantido.toFixed(2)}% garantido
          </Text>
        </View>
        <View style={styles.rightCol}>
          <Text style={[styles.profitValue, { color: colors.success }]}>
            {formatBRL(arb.lucroValor)}
          </Text>
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={colors.textSecondary}
          />
        </View>
      </TouchableOpacity>

      <Text style={[styles.teams, { color: colors.text }]}>
        {arb.time1} vs {arb.time2}
      </Text>
      <Text style={[styles.liga, { color: colors.textSecondary }]}>{arb.liga}</Text>

      {expanded && (
        <View style={styles.betsContainer}>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <Text style={[styles.betsTitle, { color: colors.textSecondary }]}>
            Apostas a realizar (Total: {formatBRL(arb.totalStake)}):
          </Text>
          {arb.apostas.map((bet, i) => (
            <View key={i} style={[styles.betRow, { borderBottomColor: colors.border }]}>
              <View>
                <Text style={[styles.betCasa, { color: colors.text }]}>{bet.casa}</Text>
                <Text style={[styles.betTipo, { color: colors.textSecondary }]}>{bet.tipo}</Text>
              </View>
              <View style={styles.betRight}>
                <Text style={[styles.betOdd, { color: colors.primary }]}>{bet.odd.toFixed(2)}</Text>
                <Text style={[styles.betStake, { color: colors.text }]}>{formatBRL(bet.stake)}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    padding: 14,
    marginHorizontal: 16,
    marginVertical: 5,
    borderWidth: 1.5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 4,
  },
  profitText: {
    fontSize: 12,
    fontWeight: '700',
  },
  rightCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  profitValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  teams: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  liga: {
    fontSize: 12,
  },
  divider: {
    height: 1,
    marginVertical: 10,
  },
  betsContainer: {
    marginTop: 2,
  },
  betsTitle: {
    fontSize: 11,
    marginBottom: 8,
    fontWeight: '600',
  },
  betRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 0.5,
  },
  betCasa: {
    fontSize: 13,
    fontWeight: '600',
  },
  betTipo: {
    fontSize: 11,
    marginTop: 2,
  },
  betRight: {
    alignItems: 'flex-end',
  },
  betOdd: {
    fontSize: 14,
    fontWeight: '700',
  },
  betStake: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
});
