import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useApp } from '../context/AppContext';
import LineChart from '../components/LineChart';
import {
  calcROI, calcWinRate, calcProfitLoss, calcBestBet,
  buildChartData, formatBRL, formatDate, getSportEmoji,
} from '../utils/calculations';

const { width } = Dimensions.get('window');
const PERIODS = ['Hoje', 'Semana', 'Mês', 'Tudo'];
const SPORTS = ['Todos', 'futebol', 'basquete', 'tenis'];
const RESULTS = ['Todos', 'win', 'loss', 'pending'];

const PERIOD_KEYS = { 'Hoje': 'today', 'Semana': 'week', 'Mês': 'month', 'Tudo': 'all' };

export default function HistoryScreen() {
  const { colors, isDark } = useTheme();
  const theme = { colors, isDark };
  const { apostas } = useApp();

  const [period, setPeriod] = useState('Tudo');
  const [sport, setSport] = useState('Todos');
  const [result, setResult] = useState('Todos');
  const [sortAsc, setSortAsc] = useState(false);

  const filtered = useMemo(() => {
    let arr = [...apostas];

    if (period !== 'Tudo') {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      if (period === 'Hoje') arr = arr.filter(a => a.data === today);
      else if (period === 'Semana') {
        const ago = new Date(); ago.setDate(ago.getDate() - 7);
        arr = arr.filter(a => new Date(a.data) >= ago);
      } else if (period === 'Mês') {
        const ago = new Date(); ago.setDate(ago.getDate() - 30);
        arr = arr.filter(a => new Date(a.data) >= ago);
      }
    }

    if (sport !== 'Todos') arr = arr.filter(a => a.esporte === sport);
    if (result !== 'Todos') arr = arr.filter(a => a.resultado === result);

    arr.sort((a, b) => {
      const da = new Date(a.data);
      const db = new Date(b.data);
      return sortAsc ? da - db : db - da;
    });

    return arr;
  }, [apostas, period, sport, result, sortAsc]);

  const roi = calcROI(filtered);
  const winRate = calcWinRate(filtered);
  const totalPL = filtered.filter(a => a.resultado !== 'pending').reduce((s, a) => s + a.lucro, 0);
  const { best, worst } = calcBestBet(filtered);

  const chartDays = period === 'Hoje' ? 1 : period === 'Semana' ? 7 : period === 'Mês' ? 30 : 60;
  const { labels: chartLabels, data: chartData } = buildChartData(filtered, Math.min(chartDays, 30));

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Histórico</Text>
        <TouchableOpacity onPress={() => setSortAsc(!sortAsc)} style={styles.sortBtn}>
          <Ionicons name={sortAsc ? 'arrow-up' : 'arrow-down'} size={16} color={colors.textSecondary} />
          <Text style={[styles.sortText, { color: colors.textSecondary }]}>Data</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Period filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.periodRow}>
          {PERIODS.map(p => (
            <TouchableOpacity
              key={p}
              style={[styles.periodBtn, period === p && { backgroundColor: colors.primary }]}
              onPress={() => setPeriod(p)}
            >
              <Text style={[styles.periodText, { color: period === p ? '#fff' : colors.textSecondary }]}>{p}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Sport + Result filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {SPORTS.map(s => (
            <TouchableOpacity
              key={s}
              style={[styles.chip, { borderColor: colors.border }, sport === s && { backgroundColor: colors.primary + '22', borderColor: colors.primary }]}
              onPress={() => setSport(s)}
            >
              <Text style={[styles.chipText, { color: sport === s ? colors.primary : colors.textSecondary }]}>
                {s === 'Todos' ? 'Todos' : s.charAt(0).toUpperCase() + s.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
          <View style={styles.dividerV} />
          {RESULTS.map(r => (
            <TouchableOpacity
              key={r}
              style={[styles.chip, { borderColor: colors.border }, result === r && {
                backgroundColor: r === 'win' ? colors.success + '22' : r === 'loss' ? colors.danger + '22' : colors.warning + '22',
                borderColor: r === 'win' ? colors.success : r === 'loss' ? colors.danger : r === 'pending' ? colors.warning : colors.primary,
              }]}
              onPress={() => setResult(r)}
            >
              <Text style={[styles.chipText, {
                color: result === r
                  ? (r === 'win' ? colors.success : r === 'loss' ? colors.danger : r === 'pending' ? colors.warning : colors.primary)
                  : colors.textSecondary,
              }]}>
                {r === 'Todos' ? 'Resultado' : r === 'win' ? 'Ganhou' : r === 'loss' ? 'Perdeu' : 'Aberta'}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Summary stats */}
        <View style={styles.statsGrid}>
          {[
            { label: 'ROI', value: `${roi}%`, color: roi >= 0 ? colors.success : colors.danger },
            { label: 'Win Rate', value: `${winRate}%`, color: winRate >= 50 ? colors.success : colors.warning },
            { label: 'P&L Total', value: formatBRL(totalPL), color: totalPL >= 0 ? colors.success : colors.danger },
            { label: 'Apostas', value: `${filtered.length}`, color: colors.primary },
          ].map((s, i) => (
            <View key={i} style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Best/Worst */}
        {(best || worst) && (
          <View style={styles.bestWorst}>
            {best && (
              <View style={[styles.bwCard, { backgroundColor: colors.success + '18', flex: 1, marginRight: 6 }]}>
                <Ionicons name="trophy" size={14} color={colors.success} />
                <Text style={[styles.bwLabel, { color: colors.success }]}>Melhor</Text>
                <Text style={[styles.bwTeams, { color: colors.text }]} numberOfLines={1}>
                  {best.time1} vs {best.time2}
                </Text>
                <Text style={[styles.bwValue, { color: colors.success }]}>+{formatBRL(best.lucro)}</Text>
              </View>
            )}
            {worst && (
              <View style={[styles.bwCard, { backgroundColor: colors.danger + '18', flex: 1, marginLeft: 6 }]}>
                <Ionicons name="trending-down" size={14} color={colors.danger} />
                <Text style={[styles.bwLabel, { color: colors.danger }]}>Pior</Text>
                <Text style={[styles.bwTeams, { color: colors.text }]} numberOfLines={1}>
                  {worst.time1} vs {worst.time2}
                </Text>
                <Text style={[styles.bwValue, { color: colors.danger }]}>{formatBRL(worst.lucro)}</Text>
              </View>
            )}
          </View>
        )}

        {/* Cumulative chart */}
        {chartData.length > 1 && (
          <View style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.chartTitle, { color: colors.text }]}>Lucro Acumulado</Text>
            <LineChart
              data={chartData}
              labels={chartLabels}
              color={totalPL >= 0 ? colors.success : colors.danger}
              height={140}
              width={width - 64}
            />
          </View>
        )}

        {/* Bets list */}
        <Text style={[styles.listTitle, { color: colors.text }]}>
          {filtered.length} apostas
        </Text>

        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Text style={{ fontSize: 40 }}>📋</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Nenhuma aposta encontrada</Text>
          </View>
        ) : (
          filtered.map(bet => (
            <View key={bet.id} style={[styles.betRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={styles.betEmoji}>{getSportEmoji(bet.esporte)}</Text>
              <View style={styles.betInfo}>
                <Text style={[styles.betTeams, { color: colors.text }]} numberOfLines={1}>
                  {bet.time1} vs {bet.time2}
                </Text>
                <Text style={[styles.betMeta, { color: colors.textSecondary }]}>
                  {bet.liga} · {formatDate(bet.data)} · Odd {bet.odd?.toFixed(2)} · {formatBRL(bet.stake)}
                </Text>
              </View>
              <View style={styles.betRight}>
                <View style={[
                  styles.resultBadge,
                  {
                    backgroundColor:
                      bet.resultado === 'win' ? colors.success + '22' :
                      bet.resultado === 'loss' ? colors.danger + '22' :
                      colors.warning + '22',
                  },
                ]}>
                  <Text style={[styles.resultText, {
                    color:
                      bet.resultado === 'win' ? colors.success :
                      bet.resultado === 'loss' ? colors.danger :
                      colors.warning,
                  }]}>
                    {bet.resultado === 'win' ? 'WIN' : bet.resultado === 'loss' ? 'LOSS' : 'OPEN'}
                  </Text>
                </View>
                <Text style={[styles.betLucro, {
                  color:
                    bet.resultado === 'win' ? colors.success :
                    bet.resultado === 'loss' ? colors.danger :
                    colors.textSecondary,
                }]}>
                  {bet.lucro >= 0 ? '+' : ''}{formatBRL(bet.lucro)}
                </Text>
              </View>
            </View>
          ))
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
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
  sortBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sortText: { fontSize: 12 },
  periodRow: { paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  periodBtn: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 7,
    backgroundColor: 'rgba(128,128,128,0.12)',
  },
  periodText: { fontSize: 13, fontWeight: '600' },
  filterRow: { paddingHorizontal: 12, paddingVertical: 4, gap: 8, alignItems: 'center' },
  chip: { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1 },
  chipText: { fontSize: 12, fontWeight: '600' },
  dividerV: { width: 1, height: 24, backgroundColor: 'rgba(128,128,128,0.3)' },
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
  },
  statValue: { fontSize: 16, fontWeight: '800' },
  statLabel: { fontSize: 10, marginTop: 2 },
  bestWorst: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 12 },
  bwCard: { borderRadius: 12, padding: 12, gap: 3 },
  bwLabel: { fontSize: 10, fontWeight: '700' },
  bwTeams: { fontSize: 12, fontWeight: '600' },
  bwValue: { fontSize: 14, fontWeight: '800' },
  chartCard: {
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
    alignItems: 'center',
  },
  chartTitle: { fontSize: 13, fontWeight: '700', marginBottom: 8, alignSelf: 'flex-start' },
  listTitle: { fontSize: 14, fontWeight: '700', paddingHorizontal: 16, marginBottom: 8 },
  betRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 3,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    gap: 10,
  },
  betEmoji: { fontSize: 20 },
  betInfo: { flex: 1 },
  betTeams: { fontSize: 13, fontWeight: '600' },
  betMeta: { fontSize: 11, marginTop: 2 },
  betRight: { alignItems: 'flex-end', gap: 4 },
  resultBadge: { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  resultText: { fontSize: 10, fontWeight: '800' },
  betLucro: { fontSize: 13, fontWeight: '700' },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 14 },
});
