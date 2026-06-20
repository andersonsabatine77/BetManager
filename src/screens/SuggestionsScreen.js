import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Modal, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useApp } from '../context/AppContext';
import BetCard from '../components/BetCard';
import { formatBRL } from '../utils/calculations';
import { calculateBetSize } from '../utils/kelly';

const SPORTS = ['Todos', 'futebol', 'basquete', 'tenis'];
const RISKS = ['Todos', 'baixo', 'medio', 'alto'];
const TIPOS = ['Todos', '1', 'X', '2', 'Over', 'Under', 'AH'];

export default function SuggestionsScreen() {
  const { colors, isDark } = useTheme();
  const theme = { colors, isDark };
  const { sugestoes, addAposta, banca } = useApp();

  const [sport, setSport] = useState('Todos');
  const [risco, setRisco] = useState('Todos');
  const [tipo, setTipo] = useState('Todos');
  const [oddMin, setOddMin] = useState('');
  const [oddMax, setOddMax] = useState('');
  const [sortBy, setSortBy] = useState('confianca');

  const [selectedBet, setSelectedBet] = useState(null);
  const [stakeInput, setStakeInput] = useState('');
  const [modalVisible, setModalVisible] = useState(false);

  const filtered = useMemo(() => {
    let arr = [...sugestoes];
    if (sport !== 'Todos') arr = arr.filter(s => s.esporte === sport);
    if (risco !== 'Todos') arr = arr.filter(s => s.risco === risco);
    if (tipo !== 'Todos') arr = arr.filter(s => s.tipo === tipo);
    if (oddMin) arr = arr.filter(s => s.odd >= parseFloat(oddMin));
    if (oddMax) arr = arr.filter(s => s.odd <= parseFloat(oddMax));

    arr.sort((a, b) => {
      if (sortBy === 'confianca') return b.confianca - a.confianca;
      if (sortBy === 'odd') return b.odd - a.odd;
      return 0;
    });
    return arr;
  }, [sugestoes, sport, risco, tipo, oddMin, oddMax, sortBy]);

  function openAddModal(bet) {
    setSelectedBet(bet);
    const kelly = calculateBetSize(banca.saldo, bet.odd, bet.confianca, banca.nivelRisco);
    setStakeInput(kelly.amount.toFixed(2));
    setModalVisible(true);
  }

  function handleAdd() {
    if (!selectedBet) return;
    const stake = parseFloat(stakeInput.replace(',', '.'));
    if (isNaN(stake) || stake <= 0) return;
    addAposta({
      id: `bet_${Date.now()}`,
      time1: selectedBet.time1,
      time2: selectedBet.time2,
      liga: selectedBet.liga,
      esporte: selectedBet.esporte,
      odd: selectedBet.odd,
      stake,
      data: new Date().toISOString().split('T')[0],
    });
    setModalVisible(false);
    setSelectedBet(null);
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Sugestões IA</Text>
        <Text style={[styles.count, { color: colors.textSecondary }]}>{filtered.length} apostas</Text>
      </View>

      {/* Sort */}
      <View style={styles.sortRow}>
        <Text style={[styles.sortLabel, { color: colors.textSecondary }]}>Ordenar:</Text>
        {['confianca', 'odd'].map(s => (
          <TouchableOpacity
            key={s}
            style={[styles.sortBtn, sortBy === s && { backgroundColor: colors.primary }]}
            onPress={() => setSortBy(s)}
          >
            <Text style={[styles.sortBtnText, { color: sortBy === s ? '#fff' : colors.textSecondary }]}>
              {s === 'confianca' ? 'Confiança' : 'Odd'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterRow}>
        {SPORTS.map(s => (
          <TouchableOpacity
            key={s}
            style={[styles.chip, { borderColor: colors.border }, sport === s && { backgroundColor: colors.primary, borderColor: colors.primary }]}
            onPress={() => setSport(s)}
          >
            <Text style={[styles.chipText, { color: sport === s ? '#fff' : colors.textSecondary }]}>
              {s === 'Todos' ? 'Todos' : s.charAt(0).toUpperCase() + s.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
        <View style={styles.chipDivider} />
        {RISKS.map(r => (
          <TouchableOpacity
            key={r}
            style={[styles.chip, { borderColor: colors.border }, risco === r && { backgroundColor: colors.warning, borderColor: colors.warning }]}
            onPress={() => setRisco(r)}
          >
            <Text style={[styles.chipText, { color: risco === r ? '#fff' : colors.textSecondary }]}>
              {r === 'Todos' ? 'Risco: Todos' : r.charAt(0).toUpperCase() + r.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Odd range */}
      <View style={styles.oddRow}>
        <Ionicons name="filter" size={14} color={colors.textSecondary} />
        <Text style={[styles.oddLabel, { color: colors.textSecondary }]}>Odd:</Text>
        <TextInput
          style={[styles.oddInput, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
          placeholder="Min"
          placeholderTextColor={colors.textSecondary}
          keyboardType="decimal-pad"
          value={oddMin}
          onChangeText={setOddMin}
        />
        <Text style={[styles.oddLabel, { color: colors.textSecondary }]}>—</Text>
        <TextInput
          style={[styles.oddInput, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
          placeholder="Max"
          placeholderTextColor={colors.textSecondary}
          keyboardType="decimal-pad"
          value={oddMax}
          onChangeText={setOddMax}
        />
      </View>

      {/* List */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Text style={{ fontSize: 48 }}>🔍</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Nenhuma sugestão encontrada
            </Text>
          </View>
        ) : (
          filtered.map(bet => (
            <BetCard key={bet.id} bet={bet} onAdd={openAddModal} theme={theme} />
          ))
        )}
        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Add Modal */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.overlay}>
          <View style={[styles.modal, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Registrar Aposta</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {selectedBet && (
              <>
                <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                  {selectedBet.time1} vs {selectedBet.time2}
                </Text>
                <View style={styles.modalInfo}>
                  <View style={styles.modalInfoItem}>
                    <Text style={[styles.modalInfoLabel, { color: colors.textSecondary }]}>Odd</Text>
                    <Text style={[styles.modalInfoValue, { color: colors.primary }]}>{selectedBet.odd.toFixed(2)}</Text>
                  </View>
                  <View style={styles.modalInfoItem}>
                    <Text style={[styles.modalInfoLabel, { color: colors.textSecondary }]}>Tipo</Text>
                    <Text style={[styles.modalInfoValue, { color: colors.text }]}>{selectedBet.tipo}</Text>
                  </View>
                  <View style={styles.modalInfoItem}>
                    <Text style={[styles.modalInfoLabel, { color: colors.textSecondary }]}>Potencial</Text>
                    <Text style={[styles.modalInfoValue, { color: colors.success }]}>
                      {stakeInput ? formatBRL(parseFloat(stakeInput.replace(',', '.')) * selectedBet.odd) : '—'}
                    </Text>
                  </View>
                </View>

                <Text style={[styles.stakeLabel, { color: colors.textSecondary }]}>
                  Valor da aposta (Kelly: {formatBRL(calculateBetSize(banca.saldo, selectedBet.odd, selectedBet.confianca, banca.nivelRisco).amount)})
                </Text>
                <TextInput
                  style={[styles.stakeInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.primary }]}
                  value={stakeInput}
                  onChangeText={setStakeInput}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor={colors.textSecondary}
                />

                <TouchableOpacity
                  style={[styles.addBtn, { backgroundColor: colors.primary }]}
                  onPress={handleAdd}
                >
                  <Text style={styles.addBtnText}>Registrar Aposta</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: { fontSize: 22, fontWeight: '800' },
  count: { fontSize: 13 },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 4,
  },
  sortLabel: { fontSize: 12 },
  sortBtn: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 5,
    backgroundColor: 'transparent',
  },
  sortBtnText: { fontSize: 12, fontWeight: '600' },
  filterScroll: { maxHeight: 48 },
  filterRow: { paddingHorizontal: 12, paddingVertical: 8, gap: 8, alignItems: 'center' },
  chip: {
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
  },
  chipText: { fontSize: 12, fontWeight: '600' },
  chipDivider: { width: 1, height: 24, backgroundColor: 'rgba(128,128,128,0.3)' },
  oddRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
    gap: 8,
  },
  oddLabel: { fontSize: 12 },
  oddInput: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    width: 70,
    fontSize: 13,
  },
  list: { paddingTop: 4 },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 14 },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  modalSubtitle: { fontSize: 13, marginBottom: 16 },
  modalInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  modalInfoItem: { alignItems: 'center' },
  modalInfoLabel: { fontSize: 11 },
  modalInfoValue: { fontSize: 18, fontWeight: '700', marginTop: 4 },
  stakeLabel: { fontSize: 12, marginBottom: 8 },
  stakeInput: {
    borderRadius: 12,
    borderWidth: 2,
    padding: 14,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },
  addBtn: {
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginBottom: 8,
  },
  addBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
