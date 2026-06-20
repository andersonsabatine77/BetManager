import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useApp } from '../context/AppContext';
import { getSportEmoji } from '../utils/calculations';

function PulsingDot({ color }) {
  const anim = React.useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 0.3, duration: 600, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    ).start();
  }, [anim]);

  return (
    <Animated.View style={[styles.dot, { backgroundColor: color, opacity: anim }]} />
  );
}

function OddsMovement({ value, colors }) {
  const isPositive = value >= 0;
  const color = isPositive ? colors.success : colors.danger;
  return (
    <View style={[styles.movBadge, { backgroundColor: color + '22' }]}>
      <Ionicons name={isPositive ? 'trending-up' : 'trending-down'} size={10} color={color} />
      <Text style={[styles.movText, { color }]}>
        {isPositive ? '+' : ''}{value.toFixed(2)}
      </Text>
    </View>
  );
}

export default function LiveScreen() {
  const { colors, isDark } = useTheme();
  const { liveGames } = useApp();
  const [expanded, setExpanded] = useState(null);
  const [countdown, setCountdown] = useState(30);

  // Countdown to next refresh
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) return 30;
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  function toggleExpand(id) {
    setExpanded(prev => (prev === id ? null : id));
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <PulsingDot color={colors.live} />
          <Text style={[styles.title, { color: colors.text }]}>Ao Vivo</Text>
          <View style={[styles.countBadge, { backgroundColor: colors.live + '22' }]}>
            <Text style={[styles.countText, { color: colors.live }]}>{liveGames.length}</Text>
          </View>
        </View>
        <View style={styles.refreshRow}>
          <Ionicons name="refresh" size={14} color={colors.textSecondary} />
          <Text style={[styles.refreshText, { color: colors.textSecondary }]}>
            Atualiza em {countdown}s
          </Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
        {liveGames.map(game => (
          <TouchableOpacity
            key={game.id}
            style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => toggleExpand(game.id)}
            activeOpacity={0.85}
          >
            {/* Top row */}
            <View style={styles.cardTop}>
              <View style={styles.sportBadge}>
                <Text style={styles.sportEmoji}>{getSportEmoji(game.esporte)}</Text>
              </View>
              <View style={styles.cardMeta}>
                <Text style={[styles.liga, { color: colors.textSecondary }]}>{game.liga}</Text>
                <View style={styles.liveRow}>
                  <PulsingDot color={colors.live} />
                  <Text style={[styles.liveLabel, { color: colors.live }]}>
                    {game.minuto !== null ? `${game.minuto}'` : 'AO VIVO'}
                  </Text>
                </View>
              </View>
              <Ionicons
                name={expanded === game.id ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={colors.textSecondary}
              />
            </View>

            {/* Teams + Score */}
            <View style={styles.scoreRow}>
              <Text style={[styles.teamName, { color: colors.text }]}>{game.time1}</Text>
              <View style={[styles.scoreBadge, { backgroundColor: colors.primary + '22' }]}>
                <Text style={[styles.scoreText, { color: colors.primary }]}>{game.placar}</Text>
              </View>
              <Text style={[styles.teamName, styles.teamRight, { color: colors.text }]}>{game.time2}</Text>
            </View>

            {/* Odds row */}
            <View style={styles.oddsRow}>
              {/* Casa */}
              <View style={styles.oddItem}>
                <Text style={[styles.oddLabel, { color: colors.textSecondary }]}>
                  {game.esporte === 'tenis' || game.esporte === 'basquete' ? game.time1 : '1'}
                </Text>
                <Text style={[styles.oddValue, { color: colors.text }]}>{game.oddCasa.toFixed(2)}</Text>
                <OddsMovement value={game.movimentoCasa} colors={colors} />
              </View>

              {/* Empate (futebol only) */}
              {game.oddEmpate !== null && (
                <View style={styles.oddItem}>
                  <Text style={[styles.oddLabel, { color: colors.textSecondary }]}>X</Text>
                  <Text style={[styles.oddValue, { color: colors.text }]}>{game.oddEmpate.toFixed(2)}</Text>
                  <OddsMovement value={game.movimentoEmpate || 0} colors={colors} />
                </View>
              )}

              {/* Fora */}
              <View style={styles.oddItem}>
                <Text style={[styles.oddLabel, { color: colors.textSecondary }]}>
                  {game.esporte === 'tenis' || game.esporte === 'basquete' ? game.time2 : '2'}
                </Text>
                <Text style={[styles.oddValue, { color: colors.text }]}>{game.oddFora.toFixed(2)}</Text>
                <OddsMovement value={game.movimentoFora} colors={colors} />
              </View>
            </View>

            {/* Expanded: in-game tips */}
            {expanded === game.id && (
              <View style={[styles.expandedSection, { borderTopColor: colors.border }]}>
                <Text style={[styles.expandedTitle, { color: colors.textSecondary }]}>
                  Sugestões In-Game
                </Text>
                <View style={[styles.tipRow, { backgroundColor: colors.primary + '11' }]}>
                  <Ionicons name="bulb" size={14} color={colors.primary} />
                  <Text style={[styles.tipText, { color: colors.text }]}>
                    Casa apresenta valor: odd {game.oddCasa.toFixed(2)} com movimento {game.movimentoCasa >= 0 ? 'positivo' : 'negativo'}
                  </Text>
                </View>
                {game.oddEmpate && Math.abs(game.movimentoEmpate || 0) > 0.1 && (
                  <View style={[styles.tipRow, { backgroundColor: colors.warning + '11' }]}>
                    <Ionicons name="alert-circle" size={14} color={colors.warning} />
                    <Text style={[styles.tipText, { color: colors.text }]}>
                      Odd de empate com movimento significativo ({game.movimentoEmpate >= 0 ? '+' : ''}{(game.movimentoEmpate || 0).toFixed(2)})
                    </Text>
                  </View>
                )}
                <View style={[styles.tipRow, { backgroundColor: colors.success + '11' }]}>
                  <Ionicons name="stats-chart" size={14} color={colors.success} />
                  <Text style={[styles.tipText, { color: colors.text }]}>
                    {game.minuto !== null && game.minuto > 60
                      ? `Minuto ${game.minuto}: apostas ao vivo com maior volatilidade.`
                      : 'Mercado estável. Acompanhe os movimentos de odd.'}
                  </Text>
                </View>
              </View>
            )}
          </TouchableOpacity>
        ))}

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
    paddingBottom: 12,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 22, fontWeight: '800' },
  countBadge: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
  countText: { fontSize: 12, fontWeight: '700' },
  refreshRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  refreshText: { fontSize: 11 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  list: { paddingHorizontal: 16, paddingTop: 4 },
  card: {
    borderRadius: 16,
    padding: 14,
    marginVertical: 5,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  sportBadge: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(128,128,128,0.1)' },
  sportEmoji: { fontSize: 18 },
  cardMeta: { flex: 1 },
  liga: { fontSize: 12, fontWeight: '600' },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  liveLabel: { fontSize: 11, fontWeight: '700' },
  scoreRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  teamName: { flex: 1, fontSize: 14, fontWeight: '700' },
  teamRight: { textAlign: 'right' },
  scoreBadge: { borderRadius: 8, paddingHorizontal: 14, paddingVertical: 5 },
  scoreText: { fontSize: 18, fontWeight: '800' },
  oddsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  oddItem: { alignItems: 'center', gap: 3 },
  oddLabel: { fontSize: 11, fontWeight: '600' },
  oddValue: { fontSize: 18, fontWeight: '700' },
  movBadge: { flexDirection: 'row', alignItems: 'center', gap: 2, borderRadius: 6, paddingHorizontal: 5, paddingVertical: 2 },
  movText: { fontSize: 10, fontWeight: '700' },
  expandedSection: { borderTopWidth: 1, marginTop: 12, paddingTop: 12, gap: 8 },
  expandedTitle: { fontSize: 11, fontWeight: '700', marginBottom: 4 },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, borderRadius: 8, padding: 10 },
  tipText: { fontSize: 12, flex: 1, lineHeight: 18 },
});
