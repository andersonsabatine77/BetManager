import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useApp } from '../context/AppContext';
import { formatBRL, formatDateTime } from '../utils/formatters';

const SPORTS = ['Todos', 'futebol', 'basquete'];
const STATUS = ['Todos', 'win', 'loss', 'pending'];
const STATUS_LABELS = { Todos: 'Todos', win: 'Vencedoras', loss: 'Perdedoras', pending: 'Pendentes' };

export default function HistoryScreen() {
  const { colors } = useTheme();
  const { apostas, deletarAposta } = useApp();
  const [sportFilter, setSportFilter] = useState('Todos');
  const [statusFilter, setStatusFilter] = useState('Todos');

  const filtered = useMemo(() => {
    let arr = [...apostas];
    if (sportFilter !== 'Todos') arr = arr.filter(a => a.esporte === sportFilter);
    if (statusFilter !== 'Todos') arr = arr.filter(a => a.resultado === statusFilter);
    return arr;
  }, [apostas, sportFilter, statusFilter]);

  function confirmDelete(id) {
    Alert.alert('Excluir', 'Remover esta aposta do histórico?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: () => deletarAposta(id) },
    ]);
  }

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={s.header}>
        <Text style={[s.title, { color: colors.text }]}>Histórico</Text>
        <Text style={[s.count, { color: colors.textSecondary }]}>{filtered.length} apostas</Text>
      </View>

      {/* Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterScroll}>
        {SPORTS.map(f => (
          <TouchableOpacity key={f} style={[s.chip, { borderColor: sportFilter === f ? colors.primary : colors.border }, sportFilter === f && { backgroundColor: colors.primary }]} onPress={() => setSportFilter(f)}>
            <Text style={[s.chipText, { color: sportFilter === f ? '#fff' : colors.textSecondary }]}>
              {f === 'Todos' ? 'Todos Esportes' : f === 'futebol' ? '⚽' : '🏀'}
            </Text>
          </TouchableOpacity>
        ))}
        <View style={s.sep} />
        {STATUS.map(f => (
          <TouchableOpacity key={f} style={[s.chip, {
            borderColor: statusFilter === f ? (f === 'win' ? colors.success : f === 'loss' ? colors.danger : colors.primary) : colors.border
          }, statusFilter === f && {
            backgroundColor: (f === 'win' ? colors.success : f === 'loss' ? colors.danger : colors.primary) + '22'
          }]} onPress={() => setStatusFilter(f)}>
            <Text style={[s.chipText, { color: colors.textSecondary }]}>{STATUS_LABELS[f]}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.list}>
        {filtered.length === 0 ? (
          <View style={s.empty}>
            <Text style={{ fontSize: 44 }}>📋</Text>
            <Text style={[s.emptyText, { color: colors.textSecondary }]}>Nenhuma aposta encontrada</Text>
          </View>
        ) : (
          filtered.map(a => (
            <View key={a.id} style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[s.resultStripe, { backgroundColor: a.resultado === 'win' ? colors.success : a.resultado === 'loss' ? colors.danger : colors.warning }]} />
              <View style={s.cardContent}>
                <View style={s.cardTop}>
                  <Text style={{ fontSize: 16 }}>{a.esporte === 'basquete' ? '🏀' : '⚽'}</Text>
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <Text style={[s.teams, { color: colors.text }]}>{a.time1} vs {a.time2}</Text>
                    <Text style={[s.meta, { color: colors.textSecondary }]}>{a.tipo}</Text>
                  </View>
                  <TouchableOpacity onPress={() => confirmDelete(a.id)} style={s.deleteBtn}>
                    <Ionicons name="trash-outline" size={16} color={colors.danger} />
                  </TouchableOpacity>
                </View>

                <View style={s.cardBottom}>
                  <View style={s.infoItem}>
                    <Text style={[s.infoLabel, { color: colors.textSecondary }]}>Valor</Text>
                    <Text style={[s.infoValue, { color: colors.text }]}>{formatBRL(a.valor)}</Text>
                  </View>
                  <View style={s.infoItem}>
                    <Text style={[s.infoLabel, { color: colors.textSecondary }]}>Odd</Text>
                    <Text style={[s.infoValue, { color: colors.text }]}>{Number(a.odd).toFixed(2)}</Text>
                  </View>
                  <View style={s.infoItem}>
                    <Text style={[s.infoLabel, { color: colors.textSecondary }]}>Resultado</Text>
                    <Text style={[s.infoValue, { color: a.resultado === 'win' ? colors.success : a.resultado === 'loss' ? colors.danger : colors.warning }]}>
                      {a.resultado === 'win' ? `+${formatBRL(a.lucro)}` : a.resultado === 'loss' ? `-${formatBRL(a.valor)}` : 'Pendente'}
                    </Text>
                  </View>
                  <View style={s.infoItem}>
                    <Text style={[s.infoLabel, { color: colors.textSecondary }]}>Data</Text>
                    <Text style={[s.infoValue, { color: colors.text }]}>{formatDateTime(a.data)}</Text>
                  </View>
                </View>
              </View>
            </View>
          ))
        )}
        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: 22, fontWeight: '800' },
  count: { fontSize: 13 },
  filterScroll: { paddingHorizontal: 16, paddingVertical: 8, gap: 8, flexDirection: 'row', alignItems: 'center' },
  chip: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 7 },
  chipText: { fontSize: 12, fontWeight: '600' },
  sep: { width: 1, height: 22, backgroundColor: 'rgba(128,128,128,0.3)', marginHorizontal: 4 },
  list: { paddingHorizontal: 16, paddingTop: 4 },
  empty: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyText: { fontSize: 14 },
  card: { flexDirection: 'row', borderRadius: 14, borderWidth: 1, marginBottom: 10, overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 },
  resultStripe: { width: 5 },
  cardContent: { flex: 1, padding: 12 },
  cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  teams: { fontSize: 14, fontWeight: '700' },
  meta: { fontSize: 12, marginTop: 1 },
  deleteBtn: { padding: 4 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between' },
  infoItem: { alignItems: 'center' },
  infoLabel: { fontSize: 10 },
  infoValue: { fontSize: 13, fontWeight: '700', marginTop: 2 },
});
