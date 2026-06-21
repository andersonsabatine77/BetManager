import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatBRL } from '../utils/calculations';

export default function BankCard({ banca, apostas = [], theme }) {
  const { colors } = theme;

  const today = new Date().toISOString().split('T')[0];
  const todayApostas = apostas.filter(a => a.data === today && a.resultado !== 'pending');
  const plHoje = todayApostas.reduce((s, a) => s + (a.lucro || 0), 0);
  const plPercent = banca.saldo > 0 ? (plHoje / banca.saldo) * 100 : 0;

  const rendimento = banca.saldo - banca.saldoInicial;
  const rendimentoPercent = banca.saldoInicial > 0 ? (rendimento / banca.saldoInicial) * 100 : 0;

  const stopLossAtivo = Math.abs(plPercent) >= banca.stopLossD;

  return (
    <View style={[styles.card, { backgroundColor: colors.primary }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerLabel}>Banca Total</Text>
        <View style={[styles.badge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
          <Ionicons name="shield-checkmark" size={12} color="#fff" />
          <Text style={styles.badgeText}>
            {banca.nivelRisco?.charAt(0).toUpperCase() + banca.nivelRisco?.slice(1)}
          </Text>
        </View>
      </View>

      {/* Main balance */}
      <Text style={styles.mainValue}>{formatBRL(banca.saldo)}</Text>

      {/* Rendimento */}
      <Text style={[styles.rendimento, { color: rendimento >= 0 ? '#a7f3d0' : '#fca5a5' }]}>
        {rendimento >= 0 ? '+' : ''}{formatBRL(rendimento)} ({rendimentoPercent >= 0 ? '+' : ''}{rendimentoPercent.toFixed(2)}%)
      </Text>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Bottom row */}
      <View style={styles.bottomRow}>
        <View style={styles.bottomItem}>
          <Text style={styles.bottomLabel}>Inicial</Text>
          <Text style={styles.bottomValue}>{formatBRL(banca.saldoInicial)}</Text>
        </View>
        <View style={styles.bottomItem}>
          <Text style={styles.bottomLabel}>Meta Diária</Text>
          <Text style={styles.bottomValue}>{banca.percentualDiario}%</Text>
        </View>
        <View style={styles.bottomItem}>
          <Text style={styles.bottomLabel}>P&L Hoje</Text>
          <Text style={[styles.bottomValue, { color: plHoje >= 0 ? '#a7f3d0' : '#fca5a5' }]}>
            {plHoje >= 0 ? '+' : ''}{formatBRL(plHoje)}
          </Text>
        </View>
      </View>

      {/* Stop Loss Warning */}
      {stopLossAtivo && (
        <View style={styles.stopLossWarn}>
          <Ionicons name="warning" size={14} color="#fbbf24" />
          <Text style={styles.stopLossText}>Stop Loss Diário Atingido!</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    fontWeight: '500',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    gap: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  mainValue: {
    color: '#fff',
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -1,
  },
  rendimento: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginVertical: 14,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  bottomItem: {
    alignItems: 'center',
    flex: 1,
  },
  bottomLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    marginBottom: 2,
  },
  bottomValue: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  stopLossWarn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 8,
    padding: 8,
    marginTop: 12,
    gap: 6,
  },
  stopLossText: {
    color: '#fbbf24',
    fontSize: 12,
    fontWeight: '700',
  },
});
