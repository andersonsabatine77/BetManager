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

// Bet type groups for UI — each label maps to one or more tipo values
const TIPO_GROUPS = [
  { label: 'Todos',      tipos: null },
  { label: '1',          tipos: ['1'] },
  { label: 'X',          tipos: ['X'] },
  { label: '2',          tipos: ['2'] },
  { label: 'Over 0.5',   tipos: ['Over 0.5'] },
  { label: 'Over 1.5',   tipos: ['Over 1.5'] },
  { label: 'Over 2.5',   tipos: ['Over 2.5'] },
  { label: 'Over 3.5',   tipos: ['Over 3.5'] },
  { label: 'Under 1.5',  tipos: ['Under 1.5'] },
  { label: 'Under 2.5',  tipos: ['Under 2.5'] },
  { label: 'Under 3.5',  tipos: ['Under 3.5'] },
  { label: 'BTTS Sim',   tipos: ['BTTS Sim'] },
  { label: 'BTTS Não',   tipos: ['BTTS Não'] },
  { label: 'Esc +8.5',   tipos: ['Esc +8.5'] },
  { label: 'Esc +9.5',   tipos: ['Esc +9.5'] },
  { label: 'Esc +10.5',  tipos: ['Esc +10.5'] },
  { label: 'Esc -9.5',   tipos: ['Esc -9.5'] },
  { label: 'Cart +3.5',  tipos: ['Cart +3.5'] },
  { label: 'Cart +4.5',  tipos: ['Cart +4.5'] },
  { label: 'AH -0.5',    tipos: ['AH -0.5'] },
  { label: 'AH +0.5',    tipos: ['AH +0.5'] },
];

function FilterChip({ label, active, color, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.chip,
        { borderColor: active ? color : 'rgba(128,128,128,0.35)' },
        active && { backgroundColor: color },
      ]}
    >
      <Text style={[styles.chipText, { color: active ? '#fff' : '#9ca3af' }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export default function SuggestionsScreen() {
  const { colors } = useTheme();
  const { sugestoes, addAposta, banca } = useApp();

  const [sport, setSport] = useState('Todos');
  const [risco, setRisco] = useState('Todos');
  const [tipoLabel, setTipoLabel] = useState('Todos');
  const [oddMin, setOddMin] = useState('');
  const [oddMax, setOddMax] = useState('');
  const [sortBy, setSortBy] = useState('confianca');

  const [selectedBet, setSelectedBet] = useState(null);
  const [stakeInput, setStakeInput] = useState('');
  const [modalVisible, setModalVisible] = useState(false);

  const activeTipos = useMemo(() => {
    const g = TIPO_GROUPS.find(g => g.label === tipoLabel);
    return g ? g.tipos : null;
  }, [tipoLabel]);

  const filtered = useMemo(() => {
    let arr = [...sugestoes];
    if (sport !== 'Todos') arr = arr.filter(s => s.esporte === sport);
    if (risco !== 'Todos') arr = arr.filter(s => s.risco === risco);
    if (activeTipos) arr = arr.filter(s => activeTipos.includes(s.tipo));
    if (oddMin) arr = arr.filter(s => s.odd >= parseFloat(oddMin));
    if (oddMax) arr = arr.filter(s => s.odd <= parseFloat(oddMax));
    arr.sort((a, b) =>
      sortBy === 'confianca' ? b.confianca - a.confianca : b.odd - a.odd
    );
    return arr;
  }, [sugestoes, sport, risco, activeTipos, oddMin, oddMax, sortBy]);

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

      {/* Sort row */}
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

      {/* Sport filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterRow}
      >
        {SPORTS.map(s => (
          <FilterChip
            key={s}
            label={s === 'Todos' ? 'Todos' : s.charAt(0).toUpperCase() + s.slice(1)}
            active={sport === s}
            color={colors.primary}
            onPress={() => setSport(s)}
          />
        ))}
        <View style={styles.divider} />
        {RISKS.map(r => (
          <FilterChip
            key={r}
            label={r === 'Todos' ? 'Risco' : r.charAt(0).toUpperCase() + r.slice(1)}
            active={risco === r}
            color={colors.warning}
            onPress={() => setRisco(r)}
          />
        ))}
      </ScrollView>

      {/* Tipo filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterRow}
      >
        {TIPO_GROUPS.map(g => (
          <FilterChip
            key={g.label}
            label={g.label}
            active={tipoLabel === g.label}
            color={colors.secondary || '#8b5cf6'}
            onPress={() => setTipoLabel(g.label)}
          />
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
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Nenhuma sugestão encontrada</Text>
          </View>
        ) : (
          filtered.map(bet => (
            <BetCard key={bet.id} bet={bet} onAdd={openAddModal} theme={{ colors, isDark: false }} />
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
                    <Text style={[styles.modalInfoValue, { color: colors.text, fontSize: 14 }]}>{selectedBet.tipo}</Text>
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
                <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.primary }]} onPress={handleAdd}>
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
    marginBottom: 4,
    gap: 8,
  },
  sortLabel: { fontSize: 12 },
  sortBtn: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'transparent',
  },
  sortBtnText: { fontSize: 12, fontWeight: '600' },
  filterScroll: { flexGrow: 0, flexShrink: 0 },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  chip: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 6,
  },
  chipText: { fontSize: 12, fontWeight: '600' },
  divider: { width: 1, height: 22, backgroundColor: 'rgba(128,128,128,0.3)', marginRight: 6 },
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
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modal: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
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
  addBtn: { borderRadius: 14, padding: 16, alignItems: 'center', marginBottom: 8 },
  addBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
