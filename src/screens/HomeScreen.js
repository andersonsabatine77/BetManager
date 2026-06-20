import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, RefreshControl,
  TouchableOpacity, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useApp } from '../context/AppContext';
import BankCard from '../components/BankCard';
import StatCard from '../components/StatCard';
import ArbitrageCard from '../components/ArbitrageCard';
import LineChart from '../components/LineChart';
import {
  formatBRL, calcROI, calcWinRate, calcProfitLoss,
  buildChartData, formatDate,
} from '../utils/calculations';
import { calculateBetSize } from '../utils/kelly';

const { width } = Dimensions.get('window');

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

export default function HomeScreen() {
  const { colors, isDark } = useTheme();
  const theme = { colors, isDark };
  const { banca, apostas, arbitragem, refresh, loading, sugestoes } = useApp();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const roi = calcROI(apostas);
  const winRate = calcWinRate(apostas);
  const plHoje = calcProfitLoss(apostas, 'today');
  const openBets = apostas.filter(a => a.resultado === 'pending').length;

  const { labels, data: chartData } = buildChartData(apostas, 7);

  const todayDate = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

  // Kelly suggestion: best confidence suggestion
  const topSug = sugestoes.sort((a, b) => b.confianca - a.confianca)[0];
  const kellySuggestion = topSug
    ? calculateBetSize(banca.saldo, topSug.odd, topSug.confianca, banca.nivelRisco)
    : null;

  const recentBets = apostas.slice(0, 3);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        contentContainerStyle={styles.scroll}
      >
        {/* Greeting */}
        <View style={styles.greeting}>
          <View>
            <Text style={[styles.greetingText, { color: colors.text }]}>
              {getGreeting()}, Anderson 👋
            </Text>
            <Text style={[styles.dateText, { color: colors.textSecondary }]}>{todayDate}</Text>
          </View>
          <View style={[styles.avatarWrap, { backgroundColor: colors.primary + '22' }]}>
            <Text style={styles.avatar}>💹</Text>
          </View>
        </View>

        {/* Bank Card */}
        <BankCard banca={banca} apostas={apostas} theme={theme} />

        {/* Kelly Suggestion */}
        {kellySuggestion && topSug && (
          <View style={[styles.kellySuggestion, { backgroundColor: colors.card, borderColor: colors.primary + '44' }]}>
            <View style={styles.kellyHeader}>
              <Ionicons name="bulb" size={18} color={colors.primary} />
              <Text style={[styles.kellyTitle, { color: colors.text }]}>Sugestão Kelly — Hoje</Text>
            </View>
            <Text style={[styles.kellyBody, { color: colors.textSecondary }]}>
              {topSug.time1} vs {topSug.time2} ({topSug.liga})
            </Text>
            <View style={styles.kellyRow}>
              <View style={styles.kellyItem}>
                <Text style={[styles.kellyLabel, { color: colors.textSecondary }]}>Odd</Text>
                <Text style={[styles.kellyValue, { color: colors.primary }]}>{topSug.odd.toFixed(2)}</Text>
              </View>
              <View style={styles.kellyItem}>
                <Text style={[styles.kellyLabel, { color: colors.textSecondary }]}>Confiança</Text>
                <Text style={[styles.kellyValue, { color: colors.text }]}>{topSug.confianca}%</Text>
              </View>
              <View style={styles.kellyItem}>
                <Text style={[styles.kellyLabel, { color: colors.textSecondary }]}>Apostar</Text>
                <Text style={[styles.kellyValue, { color: colors.success }]}>{formatBRL(kellySuggestion.amount)}</Text>
              </View>
              <View style={styles.kellyItem}>
                <Text style={[styles.kellyLabel, { color: colors.textSecondary }]}>Fração</Text>
                <Text style={[styles.kellyValue, { color: colors.text }]}>{(kellySuggestion.fraction * 100).toFixed(1)}%</Text>
              </View>
            </View>
          </View>
        )}

        {/* Quick Stats */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Desempenho</Text>
        <View style={styles.statsRow}>
          <StatCard icon="trending-up" label="ROI" value={`${roi}%`} color={colors.primary} theme={theme} />
          <StatCard icon="checkmark-circle" label="Win Rate" value={`${winRate}%`} color={colors.success} theme={theme} />
          <StatCard icon="cash" label="P&L Hoje" value={formatBRL(plHoje)} color={plHoje >= 0 ? colors.success : colors.danger} theme={theme} />
          <StatCard icon="time" label="Em Aberto" value={`${openBets}`} color={colors.warning} theme={theme} />
        </View>

        {/* Performance Chart */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Últimos 7 dias</Text>
        <View style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <LineChart
            data={chartData}
            labels={labels}
            color={colors.primary}
            height={160}
            width={width - 64}
          />
        </View>

        {/* Recent Bets */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Apostas Recentes</Text>
        {recentBets.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Nenhuma aposta ainda</Text>
          </View>
        ) : (
          recentBets.map(bet => (
            <View key={bet.id} style={[styles.recentBet, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.recentBetLeft}>
                <Text style={[styles.recentBetTeams, { color: colors.text }]}>
                  {bet.time1} vs {bet.time2}
                </Text>
                <Text style={[styles.recentBetMeta, { color: colors.textSecondary }]}>
                  {bet.liga} · {formatDate(bet.data)}
                </Text>
              </View>
              <View style={styles.recentBetRight}>
                <View style={[
                  styles.resultBadge,
                  {
                    backgroundColor:
                      bet.resultado === 'win' ? colors.success + '22' :
                      bet.resultado === 'loss' ? colors.danger + '22' :
                      colors.warning + '22',
                  },
                ]}>
                  <Text style={[
                    styles.resultText,
                    {
                      color:
                        bet.resultado === 'win' ? colors.success :
                        bet.resultado === 'loss' ? colors.danger :
                        colors.warning,
                    },
                  ]}>
                    {bet.resultado === 'win' ? 'GANHOU' : bet.resultado === 'loss' ? 'PERDEU' : 'ABERTA'}
                  </Text>
                </View>
                <Text style={[
                  styles.recentLucro,
                  { color: bet.lucro >= 0 ? colors.success : colors.danger },
                ]}>
                  {bet.lucro >= 0 ? '+' : ''}{formatBRL(bet.lucro)}
                </Text>
              </View>
            </View>
          ))
        )}

        {/* Arbitrage */}
        {arbitragem.length > 0 && (
          <>
            <View style={styles.arbHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Arbitragem</Text>
              <View style={[styles.arbBadge, { backgroundColor: colors.success + '22' }]}>
                <Text style={[styles.arbBadgeText, { color: colors.success }]}>
                  {arbitragem.length} oportunidades
                </Text>
              </View>
            </View>
            {arbitragem.map(arb => (
              <ArbitrageCard key={arb.id} arb={arb} theme={theme} />
            ))}
          </>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingBottom: 16 },
  greeting: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  greetingText: { fontSize: 20, fontWeight: '700' },
  dateText: { fontSize: 12, marginTop: 2 },
  avatarWrap: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatar: { fontSize: 22 },
  kellySuggestion: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
  },
  kellyHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  kellyTitle: { fontSize: 14, fontWeight: '700' },
  kellyBody: { fontSize: 12, marginBottom: 10 },
  kellyRow: { flexDirection: 'row', justifyContent: 'space-between' },
  kellyItem: { alignItems: 'center' },
  kellyLabel: { fontSize: 10 },
  kellyValue: { fontSize: 14, fontWeight: '700', marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginHorizontal: 16, marginTop: 20, marginBottom: 10 },
  statsRow: { flexDirection: 'row', paddingHorizontal: 12, gap: 0 },
  chartCard: {
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  recentBet: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
  },
  recentBetLeft: { flex: 1 },
  recentBetTeams: { fontSize: 13, fontWeight: '600' },
  recentBetMeta: { fontSize: 11, marginTop: 2 },
  recentBetRight: { alignItems: 'flex-end', gap: 4 },
  resultBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  resultText: { fontSize: 10, fontWeight: '800' },
  recentLucro: { fontSize: 13, fontWeight: '700' },
  emptyCard: { marginHorizontal: 16, borderRadius: 12, padding: 24, alignItems: 'center' },
  emptyText: { fontSize: 13 },
  arbHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 10,
    gap: 10,
  },
  arbBadge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  arbBadgeText: { fontSize: 11, fontWeight: '700' },
});
