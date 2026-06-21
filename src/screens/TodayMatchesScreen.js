import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';

const API_KEY_STORAGE = '@betmanager_football_api_key';
const BASE = 'https://api.football-data.org/v4';

function getHourBRT(utcDateStr) {
  const d = new Date(utcDateStr);
  const h = ((d.getUTCHours() - 3) + 24) % 24;
  const m = d.getUTCMinutes();
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function toDateStr(d) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

// Retorna o dia de hoje em BRT como string "YYYY-MM-DD"
function todayBRT() {
  const brt = new Date(Date.now() - 3 * 3600 * 1000);
  return `${brt.getUTCFullYear()}-${String(brt.getUTCMonth() + 1).padStart(2, '0')}-${String(brt.getUTCDate()).padStart(2, '0')}`;
}

// Verifica se um jogo UTC cai no "hoje" do BRT
function isMatchTodayBRT(utcDateStr) {
  const brt = new Date(new Date(utcDateStr).getTime() - 3 * 3600 * 1000);
  const matchDay = `${brt.getUTCFullYear()}-${String(brt.getUTCMonth() + 1).padStart(2, '0')}-${String(brt.getUTCDate()).padStart(2, '0')}`;
  return matchDay === todayBRT();
}

// Busca range UTC amplo: ontem até amanhã, depois filtra por data BRT no cliente
function getUTCRange() {
  const now = new Date();
  const yesterday = new Date(now); yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const tomorrow  = new Date(now); tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  return { dateFrom: toDateStr(yesterday), dateTo: toDateStr(tomorrow) };
}

const STATUS_MAP = {
  SCHEDULED: 'Agendado',
  TIMED: 'Agendado',
  IN_PLAY: 'Ao Vivo',
  HALFTIME: 'Intervalo',
  PAUSED: 'Pausado',
  FINISHED: 'Encerrado',
  POSTPONED: 'Adiado',
  CANCELLED: 'Cancelado',
  SUSPENDED: 'Suspenso',
};

const STATUS_COLOR = {
  IN_PLAY: '#ef4444',
  HALFTIME: '#f97316',
  FINISHED: '#64748b',
  POSTPONED: '#f59e0b',
  CANCELLED: '#ef4444',
  SUSPENDED: '#f59e0b',
};

export default function TodayMatchesScreen() {
  const { colors } = useTheme();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [apiKey, setApiKey] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    AsyncStorage.getItem(API_KEY_STORAGE).then(k => {
      setApiKey(k);
      if (k) loadMatches(k);
    });
  }, []);

  const loadMatches = useCallback(async (key) => {
    const k = key || apiKey;
    if (!k) { setError('NO_KEY'); return; }
    setLoading(true);
    setError(null);
    try {
      const { dateFrom, dateTo } = getUTCRange();
      const res = await fetch(`${BASE}/matches?dateFrom=${dateFrom}&dateTo=${dateTo}`, {
        headers: { 'X-Auth-Token': k },
      });
      if (res.status === 403) throw new Error('INVALID_KEY');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      // Filtra só os jogos cujo dia BRT é hoje, ordena por horário
      const sorted = (data.matches || [])
        .filter(m => isMatchTodayBRT(m.utcDate))
        .sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate));
      setMatches(sorted);
      setLastUpdate(new Date());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [apiKey]);

  // Agrupa por campeonato
  const byLeague = matches.reduce((acc, m) => {
    const liga = m.competition?.name || 'Futebol';
    if (!acc[liga]) acc[liga] = [];
    acc[liga].push(m);
    return acc;
  }, {});

  if (!apiKey) {
    return (
      <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={s.header}>
          <Text style={[s.title, { color: colors.text }]}>Jogos de Hoje</Text>
        </View>
        <View style={s.center}>
          <Text style={{ fontSize: 48, marginBottom: 12 }}>🔑</Text>
          <Text style={[s.emptyTitle, { color: colors.text }]}>API não configurada</Text>
          <Text style={[s.emptyText, { color: colors.textSecondary }]}>
            Configure a chave do football-data.org em{'\n'}Configurações para ver os jogos de hoje.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={s.header}>
        <View>
          <Text style={[s.title, { color: colors.text }]}>Jogos de Hoje</Text>
          {lastUpdate && (
            <Text style={[s.subtitle, { color: colors.textSecondary }]}>
              {matches.length} jogos · atualizado {lastUpdate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </Text>
          )}
        </View>
        <TouchableOpacity onPress={() => loadMatches()} style={[s.refreshBtn, { backgroundColor: colors.primary + '22' }]}>
          <Ionicons name="refresh-outline" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {loading && matches.length === 0 && (
        <View style={s.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[s.emptyText, { color: colors.textSecondary, marginTop: 12 }]}>Buscando jogos...</Text>
        </View>
      )}

      {error && !loading && (
        <View style={s.center}>
          <Text style={{ fontSize: 40, marginBottom: 8 }}>⚠️</Text>
          <Text style={[s.emptyTitle, { color: colors.text }]}>
            {error === 'INVALID_KEY' ? 'Chave inválida' : 'Erro ao carregar'}
          </Text>
          <Text style={[s.emptyText, { color: colors.textSecondary }]}>
            {error === 'INVALID_KEY' ? 'Verifique sua chave em Configurações' : 'Verifique sua conexão'}
          </Text>
          <TouchableOpacity style={[s.retryBtn, { backgroundColor: colors.primary }]} onPress={() => loadMatches()}>
            <Text style={{ color: '#fff', fontWeight: '700' }}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      )}

      {!loading && !error && matches.length === 0 && (
        <View style={s.center}>
          <Text style={{ fontSize: 48, marginBottom: 12 }}>📅</Text>
          <Text style={[s.emptyTitle, { color: colors.text }]}>Sem jogos hoje</Text>
          <Text style={[s.emptyText, { color: colors.textSecondary }]}>
            Não há jogos agendados nas ligas disponíveis para hoje.
          </Text>
        </View>
      )}

      {matches.length > 0 && (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.list}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={() => loadMatches()} tintColor={colors.primary} />}
        >
          {Object.entries(byLeague).map(([liga, jogos]) => (
            <View key={liga} style={s.leagueGroup}>
              {/* Cabeçalho do campeonato */}
              <View style={[s.leagueHeader, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={{ fontSize: 16 }}>⚽</Text>
                <Text style={[s.leagueName, { color: colors.text }]}>{liga}</Text>
                <Text style={[s.leagueCount, { color: colors.textSecondary }]}>{jogos.length} jogo{jogos.length !== 1 ? 's' : ''}</Text>
              </View>

              {/* Jogos do campeonato */}
              {jogos.map((m, i) => {
                const hora = getHourBRT(m.utcDate);
                const status = m.status;
                const isLive = status === 'IN_PLAY' || status === 'HALFTIME';
                const isFinished = status === 'FINISHED';
                const statusLabel = STATUS_MAP[status] || status;
                const statusColor = STATUS_COLOR[status] || colors.primary;
                const scoreHome = m.score?.fullTime?.home ?? m.score?.halfTime?.home;
                const scoreAway = m.score?.fullTime?.away ?? m.score?.halfTime?.away;
                const hasScore = scoreHome !== null && scoreHome !== undefined;

                return (
                  <View
                    key={m.id}
                    style={[
                      s.matchCard,
                      {
                        backgroundColor: colors.card,
                        borderColor: isLive ? '#ef4444' : colors.border,
                        borderLeftColor: isLive ? '#ef4444' : colors.primary,
                      },
                      i === jogos.length - 1 && { marginBottom: 0 },
                    ]}
                  >
                    {/* Hora e status */}
                    <View style={s.matchTop}>
                      <View style={[s.horaBadge, { backgroundColor: isLive ? '#ef444422' : colors.background }]}>
                        {isLive && <View style={s.liveDot} />}
                        <Text style={[s.hora, { color: isLive ? '#ef4444' : colors.primary }]}>{hora}</Text>
                      </View>
                      <View style={[s.statusBadge, { backgroundColor: statusColor + '18' }]}>
                        <Text style={[s.statusText, { color: statusColor }]}>{statusLabel}</Text>
                      </View>
                    </View>

                    {/* Times e placar */}
                    <View style={s.teamsRow}>
                      <Text style={[s.teamName, { color: isFinished ? colors.textSecondary : colors.text }]} numberOfLines={1}>
                        {m.homeTeam?.shortName || m.homeTeam?.name}
                      </Text>
                      {hasScore ? (
                        <View style={[s.scoreBox, { backgroundColor: colors.background }]}>
                          <Text style={[s.score, { color: isLive ? '#ef4444' : colors.text }]}>
                            {scoreHome} — {scoreAway}
                          </Text>
                        </View>
                      ) : (
                        <View style={[s.vsBox, { backgroundColor: colors.background }]}>
                          <Text style={[s.vs, { color: colors.textSecondary }]}>×</Text>
                        </View>
                      )}
                      <Text style={[s.teamName, { color: isFinished ? colors.textSecondary : colors.text, textAlign: 'right' }]} numberOfLines={1}>
                        {m.awayTeam?.shortName || m.awayTeam?.name}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          ))}
          <View style={{ height: 32 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 },
  title: { fontSize: 22, fontWeight: '800' },
  subtitle: { fontSize: 12, marginTop: 2 },
  refreshBtn: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyTitle: { fontSize: 18, fontWeight: '800', marginBottom: 8, textAlign: 'center' },
  emptyText: { fontSize: 14, textAlign: 'center', lineHeight: 21, marginBottom: 16 },
  retryBtn: { borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  list: { paddingHorizontal: 16, paddingTop: 4 },
  leagueGroup: { marginBottom: 16 },
  leagueHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 8 },
  leagueName: { fontSize: 14, fontWeight: '700', flex: 1 },
  leagueCount: { fontSize: 12 },
  matchCard: { borderRadius: 12, borderWidth: 1, borderLeftWidth: 3, padding: 12, marginBottom: 6 },
  matchTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  horaBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#ef4444' },
  hora: { fontSize: 13, fontWeight: '800' },
  statusBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 10, fontWeight: '700' },
  teamsRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  teamName: { fontSize: 14, fontWeight: '700', flex: 1 },
  scoreBox: { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 5, minWidth: 72, alignItems: 'center' },
  score: { fontSize: 16, fontWeight: '800', letterSpacing: 1 },
  vsBox: { borderRadius: 8, paddingHorizontal: 16, paddingVertical: 5, minWidth: 48, alignItems: 'center' },
  vs: { fontSize: 14, fontWeight: '600' },
});
