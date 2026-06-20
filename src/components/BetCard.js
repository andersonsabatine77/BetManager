import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getSportEmoji, formatDateTime } from '../utils/calculations';
import OddsComparison from './OddsComparison';

const RISCO_COLORS = {
  baixo: '#10b981',
  medio: '#f59e0b',
  alto: '#ef4444',
};

const TIPO_LABELS = {
  '1': 'Casa',
  'X': 'Empate',
  '2': 'Fora',
  'Over': 'Over 2.5',
  'Under': 'Under 2.5',
  'AH': 'Asian H.',
};

export default function BetCard({ bet, onAdd, theme }) {
  const { colors } = theme;
  const [showOdds, setShowOdds] = useState(false);
  const riscoColor = RISCO_COLORS[bet.risco] || colors.warning;

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {/* Header row */}
      <View style={styles.headerRow}>
        <Text style={styles.sportEmoji}>{getSportEmoji(bet.esporte)}</Text>
        <View style={styles.leagueInfo}>
          <Text style={[styles.liga, { color: colors.textSecondary }]}>{bet.liga}</Text>
          <Text style={[styles.horario, { color: colors.textSecondary }]}>
            {formatDateTime(bet.horario)}
          </Text>
        </View>
        <View style={[styles.riscoBadge, { backgroundColor: riscoColor + '22', borderColor: riscoColor }]}>
          <Text style={[styles.riscoText, { color: riscoColor }]}>
            {bet.risco.charAt(0).toUpperCase() + bet.risco.slice(1)}
          </Text>
        </View>
      </View>

      {/* Teams */}
      <View style={styles.teamsRow}>
        <Text style={[styles.teams, { color: colors.text }]}>
          {bet.time1} <Text style={{ color: colors.textSecondary }}>vs</Text> {bet.time2}
        </Text>
      </View>

      {/* Odds + Type row */}
      <View style={styles.oddsRow}>
        <View style={[styles.tipoBadge, { backgroundColor: colors.primary + '22' }]}>
          <Text style={[styles.tipoText, { color: colors.primary }]}>
            {TIPO_LABELS[bet.tipo] || bet.tipo}
          </Text>
        </View>
        <Text style={[styles.odd, { color: colors.primary }]}>{bet.odd.toFixed(2)}</Text>
      </View>

      {/* Confidence bar */}
      <View style={styles.confidenceRow}>
        <Text style={[styles.confidenceLabel, { color: colors.textSecondary }]}>
          Confiança IA
        </Text>
        <Text style={[styles.confidenceValue, { color: colors.text }]}>{bet.confianca}%</Text>
      </View>
      <View style={[styles.barBg, { backgroundColor: colors.border }]}>
        <View
          style={[
            styles.barFill,
            {
              width: `${bet.confianca}%`,
              backgroundColor: bet.confianca >= 75 ? colors.success : bet.confianca >= 60 ? colors.warning : colors.danger,
            },
          ]}
        />
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionBtn, { borderColor: colors.border }]}
          onPress={() => setShowOdds(true)}
        >
          <Ionicons name="bar-chart-outline" size={14} color={colors.textSecondary} />
          <Text style={[styles.actionBtnText, { color: colors.textSecondary }]}>Odds</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={() => onAdd && onAdd(bet)}
        >
          <Ionicons name="add" size={16} color="#fff" />
          <Text style={styles.addBtnText}>Apostar</Text>
        </TouchableOpacity>
      </View>

      {/* Odds Modal */}
      <Modal visible={showOdds} transparent animationType="slide" onRequestClose={() => setShowOdds(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setShowOdds(false)}>
          <View style={[styles.modal, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Comparação de Odds</Text>
              <TouchableOpacity onPress={() => setShowOdds(false)}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
              {bet.time1} vs {bet.time2} — {TIPO_LABELS[bet.tipo] || bet.tipo}
            </Text>
            <ScrollView>
              <OddsComparison casas={bet.casas} theme={theme} />
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 14,
    marginHorizontal: 16,
    marginVertical: 6,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sportEmoji: {
    fontSize: 22,
    marginRight: 8,
  },
  leagueInfo: {
    flex: 1,
  },
  liga: {
    fontSize: 12,
    fontWeight: '600',
  },
  horario: {
    fontSize: 11,
    marginTop: 1,
  },
  riscoBadge: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderWidth: 1,
  },
  riscoText: {
    fontSize: 11,
    fontWeight: '700',
  },
  teamsRow: {
    marginBottom: 8,
  },
  teams: {
    fontSize: 16,
    fontWeight: '700',
  },
  oddsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  tipoBadge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tipoText: {
    fontSize: 12,
    fontWeight: '700',
  },
  odd: {
    fontSize: 22,
    fontWeight: '800',
  },
  confidenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  confidenceLabel: {
    fontSize: 11,
  },
  confidenceValue: {
    fontSize: 11,
    fontWeight: '700',
  },
  barBg: {
    height: 6,
    borderRadius: 3,
    marginBottom: 12,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderWidth: 1,
    gap: 4,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  addBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    paddingVertical: 9,
    gap: 4,
  },
  addBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  modalSubtitle: {
    fontSize: 12,
    marginBottom: 12,
  },
});
