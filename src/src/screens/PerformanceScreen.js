import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useApp } from '../context/AppContext';
import { formatBRL } from '../utils/formatters';
import { calcStats, buildChartData, calcStatsByTipo } from '../utils/calculations';
import MiniChart from '../components/MiniChart';

const PERIODS = ['hoje', '7dias', '30dias', 'tudo'];
const PERIOD_LABELS = { hoje: 'Hoje', '7dias': '7 dias', '30dias': '30 dias', tudo: 'Tudo' };

function StatRow({ label, value, color, colors }) {
  return (
    <View style={[sr.row, { borderBottomColor: colors.border }]}>
      <Text style={[sr.label, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[sr.value, { color: color || colors.text }]}>{value}</Text>
    </View>
  );
}
const sr = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
  label: { fontSize: 14 },
  value: { fontSize: 14, fontWeight: '700' },
});

export default function PerformanceScreen() {
  const { colors } = useTheme();
  const { apostas } = useApp();
  const [period, setPeriod] = useState('7dias');

  const stats = calcStats(apostas);
  const futebol = calcStats(apostas.filter(a => a.esporte === 'futebol'));
  const basquete = calcStats(apostas.filter(a => a.esporte === 'basquete'));
  const porTipo = calcStatsByTipo(apostas).slice(0, 5);
  const chartData = buildChartData(apostas, period);

  const winColor = colors.success;
  const lossColor = colors.danger;

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={s.header}>
          <Text style={[s.title, { color: colors.text }]}>Desempenho</Text>
        </View>

        {/* Period selector + chart */}
        <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[s.cardTitle, { color: colors.text }]}>Lucro/Prejuízo</Text>
          <View style={s.periodRow}>
            {PERIODS.map(p => (
              <TouchableOpacity key={p} style={[s.periodBtn, period === p && { backgroundColor: colors.primary }]} onPress={() => setPeriod(p)}>
                <Text style={[s.periodText, { color: period === p ? '#fff' : colors.textSecondary }]}>{PERIOD_LABELS[p]}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <MiniChart data={chartData} color={stats.lucroLiquido >= 0 ? colors.success : colors.danger} height={90} />
        </View>

        {/* Summary cards */}
        <View style={s.summaryRow}>
          {[
            { label: 'Total Apostado', value: formatBRL(stats.totalInvestido), color: colors.text },
            { label: 'Total Ganho', value: formatBRL(stats.totalGanho), color: winColor },
            { label: 'Total Perdido', value: formatBRL(stats.totalPerdido), color: lossColor },
            { label: 'Lucro Líquido', value: (stats.lucroLiquido >= 0 ? '+' : '') + formatBRL(stats.lucroLiquido), color: stats.lucroLiquido >= 0 ? winColor : lossColor },
          ].map(item => (
            <View key={item.label} style={[s.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[s.summaryValue, { color: item.color }]}>{item.value}</Text>
              <Text style={[s.summaryLabel, { color: colors.textSecondary }]}>{item.label}</Text>
            </View>
          ))}
        </View>

        {/* Win rate visual */}
        <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[s.cardTitle, { color: colors.text }]}>Taxa de Acerto</Text>
          <View style={s.winRateRow}>
            <View style={{ flex: 1 }}>
              <Text style={[s.bigStat, { color: winColor }]}>{stats.winRate.toFixed(1)}%</Text>
              <Text style={[s.bigStatLabel, { color: colors.textSecondary }]}>{stats.wins} vitórias / {stats.losses} derrotas</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.bigStat, { color: stats.roi >= 0 ? winColor : lossColor }]}>{stats.roi.toFixed(1)}%</Text>
              <Text style={[s.bigStatLabel, { color: colors.textSecondary }]}>ROI</Text>
            </View>
          </View>
          <View style={{ height: 12, borderRadius: 6, overflow: 'hidden', flexDirection: 'row', marginTop: 12 }}>
            <View style={{ flex: stats.wins || 1, backgroundColor: colors.success }} />
            <View style={{ flex: stats.losses, backgroundColor: colors.danger }} />
          </View>

          {stats.streakType && (
            <View style={[s.streakRow, { backgroundColor: (stats.streakType === 'win' ? colors.success : colors.danger) + '22' }]}>
              <Text style={{ fontSize: 16 }}>{stats.streakType === 'win' ? '🔥' : '❄️'}</Text>
              <Text style={[s.streakText, { color: stats.streakType === 'win' ? colors.success : colors.danger }]}>
                Sequência atual: {stats.streak} {stats.streakType === 'win' ? 'vitória(s)' : 'derrota(s)'}
              </Text>
            </View>
          )}
        </View>

        {/* By sport */}
        <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[s.cardTitle, { color: colors.text }]}>Por Esporte</Text>
          {[{ label: '⚽ Futebol', st: futebol }, { label: '🏀 Basquete', st: basquete }].map(({ label, st }) => (
            <View key={label} style={s.sportRow}>
              <Text style={[s.sportLabel, { color: colors.text }]}>{label}</Text>
              <View style={s.sportStats}>
                <Text style={[s.sportStat, { color: colors.textSecondary }]}>{st.total} apostas</Text>
                <Text style={[s.sportStat, { color: winColor }]}>{st.winRate.toFixed(0)}% acerto</Text>
                <Text style={[s.sportStat, { color: st.lucroLiquido >= 0 ? winColor : lossColor }]}>
                  {st.lucroLiquido >= 0 ? '+' : ''}{formatBRL(st.lucroLiquido)}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Best/Worst */}
        {(stats.melhor || stats.pior) && (
          <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[s.cardTitle, { color: colors.text }]}>Destaques</Text>
            {stats.melhor && (
              <StatRow label="🏆 Melhor aposta" value={`+${formatBRL(stats.melhor.lucro)} (odd ${Number(stats.melhor.odd).toFixed(2)})`} color={winColor} colors={colors} />
            )}
            {stats.pior && (
              <StatRow label="💸 Pior aposta" value={`${formatBRL(stats.pior.lucro)}`} color={lossColor} colors={colors} />
            )}
          </View>
        )}

        {/* By tipo */}
        {porTipo.length > 0 && (
          <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[s.cardTitle, { color: colors.text }]}>Por Tipo de Aposta</Text>
            {porTipo.map(t => (
              <View key={t.tipo} style={[s.tipoRow, { borderBottomColor: colors.border }]}>
                <Text style={[s.tipoLabel, { color: colors.text }]} numberOfLines={1}>{t.tipo}</Text>
                <View style={s.tipoStats}>
                  <Text style={[s.tipoStat, { color: colors.textSecondary }]}>{t.total}×</Text>
                  <Text style={[s.tipoStat, { color: t.lucroLiquido >= 0 ? winColor : lossColor }]}>
                    {t.lucroLiquido >= 0 ? '+' : ''}{formatBRL(t.lucroLiquido)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: 22, fontWeight: '800' },
  card: { marginHorizontal: 16, borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 14 },
  cardTitle: { fontSize: 15, fontWeight: '700', marginBottom: 12 },
  periodRow: { flexDirection: 'row', gap: 6, marginBottom: 12 },
  periodBtn: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  periodText: { fontSize: 12, fontWeight: '600' },
  summaryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 16, marginBottom: 14 },
  summaryCard: { width: '47%', borderRadius: 12, borderWidth: 1, padding: 12 },
  summaryValue: { fontSize: 16, fontWeight: '800', marginBottom: 2 },
  summaryLabel: { fontSize: 11 },
  winRateRow: { flexDirection: 'row' },
  bigStat: { fontSize: 32, fontWeight: '800' },
  bigStatLabel: { fontSize: 12, marginTop: 2 },
  streakRow: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 10, padding: 10, marginTop: 12 },
  streakText: { fontSize: 13, fontWeight: '700' },
  sportRow: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(128,128,128,0.1)', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sportLabel: { fontSize: 14, fontWeight: '600' },
  sportStats: { flexDirection: 'row', gap: 12 },
  sportStat: { fontSize: 12, fontWeight: '600' },
  tipoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1 },
  tipoLabel: { fontSize: 13, flex: 1, marginRight: 8 },
  tipoStats: { flexDirection: 'row', gap: 12 },
  tipoStat: { fontSize: 13, fontWeight: '700' },
});
