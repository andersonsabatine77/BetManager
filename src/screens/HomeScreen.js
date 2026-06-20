import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useApp } from '../context/AppContext';
import { formatBRL, formatDateTime } from '../utils/formatters';
import { calcStats, buildChartData } from '../utils/calculations';
import MiniChart from '../components/MiniChart';

const PERIODS = ['hoje', '7dias', '30dias', 'tudo'];
const PERIOD_LABELS = { hoje: 'Hoje', '7dias': '7 dias', '30dias': '30 dias', tudo: 'Tudo' };

export default function HomeScreen() {
  const { colors } = useTheme();
  const { banca, apostas, reload } = useApp();
  const [period, setPeriod] = useState('7dias');
  const [refreshing, setRefreshing] = useState(false);

  const stats = calcStats(apostas);
  const chartData = buildChartData(apostas, period);
  const recentes = apostas.slice(0, 5);
  const lucroHoje = apostas
    .filter(a => new Date(a.data).toDateString() === new Date().toDateString() && a.resultado !== 'pending')
    .reduce((s, a) => s + (Number(a.lucro) || 0), 0);

  async function onRefresh() {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  }

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={[s.greeting, { color: colors.textSecondary }]}>Bem-vindo de volta</Text>
            <Text style={[s.appName, { color: colors.text }]}>BetManager Pro</Text>
          </View>
          <View style={[s.badge, { backgroundColor: colors.primary + '22' }]}>
            <Text style={{ fontSize: 22 }}>🎯</Text>
          </View>
        </View>

        {/* Banca card */}
        <View style={[s.bancaCard, { backgroundColor: colors.primary }]}>
          <Text style={s.bancaLabel}>Saldo Atual</Text>
          <Text style={s.bancaValue}>{formatBRL(banca.saldoAtual)}</Text>
          <View style={s.bancaRow}>
            <View style={s.bancaItem}>
              <Text style={s.bancaItemLabel}>Banca Inicial</Text>
              <Text style={s.bancaItemValue}>{formatBRL(banca.saldoInicial)}</Text>
            </View>
            <View style={s.bancaItem}>
              <Text style={s.bancaItemLabel}>Lucro Total</Text>
              <Text style={[s.bancaItemValue, { color: stats.lucroLiquido >= 0 ? '#6ee7b7' : '#fca5a5' }]}>
                {stats.lucroLiquido >= 0 ? '+' : ''}{formatBRL(stats.lucroLiquido)}
              </Text>
            </View>
            <View style={s.bancaItem}>
              <Text style={s.bancaItemLabel}>Hoje</Text>
              <Text style={[s.bancaItemValue, { color: lucroHoje >= 0 ? '#6ee7b7' : '#fca5a5' }]}>
                {lucroHoje >= 0 ? '+' : ''}{formatBRL(lucroHoje)}
              </Text>
            </View>
          </View>
        </View>

        {/* Quick stats */}
        <View style={s.statsRow}>
          {[
            { label: 'Apostas', value: stats.total, icon: 'layers-outline', color: colors.primary },
            { label: 'Acerto', value: `${stats.winRate.toFixed(0)}%`, icon: 'checkmark-circle-outline', color: colors.success },
            { label: 'ROI', value: `${stats.roi.toFixed(1)}%`, icon: 'trending-up-outline', color: stats.roi >= 0 ? colors.success : colors.danger },
          ].map(item => (
            <View key={item.label} style={[s.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name={item.icon} size={22} color={item.color} />
              <Text style={[s.statValue, { color: item.color }]}>{item.value}</Text>
              <Text style={[s.statLabel, { color: colors.textSecondary }]}>{item.label}</Text>
            </View>
          ))}
        </View>

        {/* Chart */}
        <View style={[s.chartCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[s.sectionTitle, { color: colors.text, marginBottom: 10 }]}>Evolução da Banca</Text>
          <View style={s.periodRow}>
            {PERIODS.map(p => (
              <TouchableOpacity
                key={p}
                style={[s.periodBtn, period === p && { backgroundColor: colors.primary }]}
                onPress={() => setPeriod(p)}
              >
                <Text style={[s.periodText, { color: period === p ? '#fff' : colors.textSecondary }]}>
                  {PERIOD_LABELS[p]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <MiniChart data={chartData} color={colors.primary} height={90} />
        </View>

        {/* Recentes */}
        {recentes.length > 0 && (
          <View style={[s.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[s.sectionTitle, { color: colors.text }]}>Últimas Apostas</Text>
            {recentes.map((a, i) => (
              <View key={a.id} style={[s.recentItem, i < recentes.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[s.recentTeams, { color: colors.text }]}>{a.time1} vs {a.time2}</Text>
                  <Text style={[s.recentMeta, { color: colors.textSecondary }]}>{a.tipo} · {formatDateTime(a.data)}</Text>
                </View>
                <View style={[s.resultBadge, {
                  backgroundColor: a.resultado === 'win' ? colors.success + '22' : a.resultado === 'loss' ? colors.danger + '22' : colors.warning + '22'
                }]}>
                  <Text style={[s.resultText, {
                    color: a.resultado === 'win' ? colors.success : a.resultado === 'loss' ? colors.danger : colors.warning
                  }]}>
                    {a.resultado === 'win' ? `+${formatBRL(a.lucro)}` : a.resultado === 'loss' ? `-${formatBRL(a.valor)}` : 'Pendente'}
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 },
  greeting: { fontSize: 13 },
  appName: { fontSize: 22, fontWeight: '800' },
  badge: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  bancaCard: { marginHorizontal: 16, borderRadius: 20, padding: 20, marginBottom: 16 },
  bancaLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 13, marginBottom: 4 },
  bancaValue: { color: '#fff', fontSize: 36, fontWeight: '800', marginBottom: 16 },
  bancaRow: { flexDirection: 'row', justifyContent: 'space-between' },
  bancaItem: { alignItems: 'center' },
  bancaItemLabel: { color: 'rgba(255,255,255,0.65)', fontSize: 11 },
  bancaItemValue: { color: '#fff', fontSize: 14, fontWeight: '700', marginTop: 2 },
  statsRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginBottom: 16 },
  statCard: { flex: 1, borderRadius: 14, borderWidth: 1, padding: 12, alignItems: 'center', gap: 4 },
  statValue: { fontSize: 18, fontWeight: '800' },
  statLabel: { fontSize: 11 },
  chartCard: { marginHorizontal: 16, borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 16 },
  periodRow: { flexDirection: 'row', gap: 6, marginBottom: 12 },
  periodBtn: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  periodText: { fontSize: 12, fontWeight: '600' },
  section: { marginHorizontal: 16, borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 15, fontWeight: '700', marginBottom: 12 },
  recentItem: { paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 10 },
  recentTeams: { fontSize: 14, fontWeight: '600' },
  recentMeta: { fontSize: 12, marginTop: 2 },
  resultBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  resultText: { fontSize: 13, fontWeight: '700' },
});
