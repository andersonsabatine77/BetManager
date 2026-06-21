import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';

const FOOTBALL_KEY_STORAGE = '@betmanager_football_api_key';
const RAPIDAPI_KEY_STORAGE  = '@betmanager_rapidapi_key';

// ── football-data.org helpers ────────────────────────────────────────────────
const FD_BASE = 'https://api.football-data.org/v4';

function getHourBRT(utcDateStr) {
  const d = new Date(utcDateStr);
  const h = ((d.getUTCHours() - 3) + 24) % 24;
  const m = d.getUTCMinutes();
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
function toDateStr(d) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}-${String(d.getUTCDate()).padStart(2,'0')}`;
}
function todayBRT() {
  const brt = new Date(Date.now() - 3 * 3600 * 1000);
  return `${brt.getUTCFullYear()}-${String(brt.getUTCMonth()+1).padStart(2,'0')}-${String(brt.getUTCDate()).padStart(2,'0')}`;
}
function isMatchTodayBRT(utcDateStr) {
  const brt = new Date(new Date(utcDateStr).getTime() - 3 * 3600 * 1000);
  const matchDay = `${brt.getUTCFullYear()}-${String(brt.getUTCMonth()+1).padStart(2,'0')}-${String(brt.getUTCDate()).padStart(2,'0')}`;
  return matchDay === todayBRT();
}
function getUTCRange() {
  const now = new Date();
  const yesterday = new Date(now); yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const tomorrow  = new Date(now); tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  return { dateFrom: toDateStr(yesterday), dateTo: toDateStr(tomorrow) };
}

// Normaliza jogo do football-data.org para formato interno
function normalizeFD(m) {
  const status = m.status;
  const scoreHome = m.score?.fullTime?.home ?? m.score?.halfTime?.home ?? null;
  const scoreAway = m.score?.fullTime?.away ?? m.score?.halfTime?.away ?? null;
  return {
    id: `fd_${m.id}`,
    league: m.competition?.name || 'Futebol',
    homeTeam: m.homeTeam?.shortName || m.homeTeam?.name || '?',
    awayTeam: m.awayTeam?.shortName || m.awayTeam?.name || '?',
    utcDate: m.utcDate,
    status,
    scoreHome,
    scoreAway,
    minute: null,
  };
}

// ── API-Football (RapidAPI) helpers ──────────────────────────────────────────
const AF_BASE = 'https://api-football-v1.p.rapidapi.com/v3';

async function fetchAPIFootball(path, rapidKey) {
  const res = await fetch(`${AF_BASE}${path}`, {
    headers: {
      'x-rapidapi-host': 'api-football-v1.p.rapidapi.com',
      'x-rapidapi-key': rapidKey,
    },
  });
  if (res.status === 403 || res.status === 401) throw new Error('INVALID_RAPID_KEY');
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// Normaliza jogo da API-Football para formato interno
function normalizeAF(f) {
  const fix = f.fixture;
  const league = f.league;
  const teams = f.teams;
  const goals = f.goals;
  const statusShort = fix?.status?.short || 'NS';

  const STATUS_MAP_AF = {
    NS: 'SCHEDULED', TBD: 'SCHEDULED',
    '1H': 'IN_PLAY', HT: 'HALFTIME', '2H': 'IN_PLAY',
    ET: 'IN_PLAY', BT: 'HALFTIME', P: 'IN_PLAY',
    FT: 'FINISHED', AET: 'FINISHED', PEN: 'FINISHED',
    SUSP: 'SUSPENDED', INT: 'PAUSED', PST: 'POSTPONED',
    CANC: 'CANCELLED', ABD: 'SUSPENDED',
  };

  return {
    id: `af_${fix?.id}`,
    league: league?.name || 'Futebol',
    homeTeam: teams?.home?.name || '?',
    awayTeam: teams?.away?.name || '?',
    utcDate: fix?.date || new Date().toISOString(),
    status: STATUS_MAP_AF[statusShort] || 'SCHEDULED',
    scoreHome: goals?.home ?? null,
    scoreAway: goals?.away ?? null,
    minute: fix?.status?.elapsed ?? null,
  };
}

// ── Status display ────────────────────────────────────────────────────────────
const STATUS_LABEL = {
  SCHEDULED: 'Agendado', TIMED: 'Agendado',
  IN_PLAY: 'Ao Vivo', HALFTIME: 'Intervalo', PAUSED: 'Pausado',
  FINISHED: 'Encerrado', POSTPONED: 'Adiado',
  CANCELLED: 'Cancelado', SUSPENDED: 'Suspenso',
};
const STATUS_COLOR = {
  IN_PLAY: '#ef4444', HALFTIME: '#f97316',
  FINISHED: '#64748b', POSTPONED: '#f59e0b',
  CANCELLED: '#ef4444', SUSPENDED: '#f59e0b',
};

// ── Component ─────────────────────────────────────────────────────────────────
export default function TodayMatchesScreen() {
  const { colors } = useTheme();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState(null);
  const [apiKey, setApiKey] = useState(null);
  const [rapidKey, setRapidKey] = useState(null);
  const [source, setSource] = useState(null); // 'fd' | 'af'
  const [lastUpdate, setLastUpdate] = useState(null);
  const liveTimerRef = useRef(null);

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(FOOTBALL_KEY_STORAGE),
      AsyncStorage.getItem(RAPIDAPI_KEY_STORAGE),
    ]).then(([fd, rapid]) => {
      setApiKey(fd);
      setRapidKey(rapid);
      if (rapid) { setSource('af'); loadMatchesAF(rapid); }
      else if (fd) { setSource('fd'); loadMatchesFD(fd); }
    });
    return () => { if (liveTimerRef.current) clearInterval(liveTimerRef.current); };
  }, []);

  // Auto-refresh every 60s when there are live matches
  useEffect(() => {
    if (liveTimerRef.current) clearInterval(liveTimerRef.current);
    const hasLive = matches.some(m => m.status === 'IN_PLAY' || m.status === 'HALFTIME');
    if (hasLive) {
      liveTimerRef.current = setInterval(() => {
        if (source === 'af' && rapidKey) loadMatchesAF(rapidKey, true);
        else if (source === 'fd' && apiKey) loadMatchesFD(apiKey, true);
      }, 60000);
    }
  }, [matches, source]);

  const loadMatchesFD = useCallback(async (key, silent = false) => {
    const k = key || apiKey;
    if (!k) { setError('NO_KEY'); return; }
    if (!silent) { setLoading(true); setError(null); }
    try {
      const { dateFrom, dateTo } = getUTCRange();
      const res = await fetch(`${FD_BASE}/matches?dateFrom=${dateFrom}&dateTo=${dateTo}`, {
        headers: { 'X-Auth-Token': k },
      });
      if (res.status === 403) throw new Error('INVALID_KEY');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const sorted = (data.matches || [])
        .filter(m => isMatchTodayBRT(m.utcDate))
        .map(normalizeFD)
        .sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate));
      setMatches(sorted);
      setLastUpdate(new Date());
    } catch (e) {
      if (!silent) setError(e.message);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [apiKey]);

  const loadMatchesAF = useCallback(async (key, silent = false) => {
    const k = key || rapidKey;
    if (!k) { setError('NO_KEY'); return; }
    if (!silent) { setLoading(true); setError(null); }
    try {
      // Pega data BRT no formato YYYY-MM-DD
      const dateStr = todayBRT();
      const data = await fetchAPIFootball(`/fixtures?date=${dateStr}&timezone=America/Sao_Paulo`, k);
      const sorted = (data.response || [])
        .map(normalizeAF)
        .sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate));
      setMatches(sorted);
      setLastUpdate(new Date());
    } catch (e) {
      if (!silent) setError(e.message);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [rapidKey]);

  function handleRefresh() {
    if (source === 'af' && rapidKey) loadMatchesAF(rapidKey);
    else if (source === 'fd' && apiKey) loadMatchesFD(apiKey);
  }

  const byLeague = matches.reduce((acc, m) => {
    if (!acc[m.league]) acc[m.league] = [];
    acc[m.league].push(m);
    return acc;
  }, {});

  const liveCount = matches.filter(m => m.status === 'IN_PLAY' || m.status === 'HALFTIME').length;
  const noKey = !apiKey && !rapidKey;

  if (noKey) {
    return (
      <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={s.header}>
          <Text style={[s.title, { color: colors.text }]}>Jogos de Hoje</Text>
        </View>
        <View style={s.center}>
          <Text style={{ fontSize: 48, marginBottom: 12 }}>🔑</Text>
          <Text style={[s.emptyTitle, { color: colors.text }]}>API não configurada</Text>
          <Text style={[s.emptyText, { color: colors.textSecondary }]}>
            Configure uma chave de API em Configurações para ver os jogos de hoje.{'\n\n'}
            • RapidAPI (API-Football) → dados ao vivo com placar em tempo real{'\n'}
            • Football-Data.org → jogos agendados e resultados
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
              {matches.length} jogos
              {liveCount > 0 ? ` · ${liveCount} ao vivo 🔴` : ''}
              {' · '}{lastUpdate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </Text>
          )}
        </View>
        <View style={s.headerRight}>
          {source && (
            <View style={[s.sourceBadge, { backgroundColor: source === 'af' ? '#10b98122' : colors.primary + '22' }]}>
              <Text style={[s.sourceText, { color: source === 'af' ? '#10b981' : colors.primary }]}>
                {source === 'af' ? 'AO VIVO' : 'FD.ORG'}
              </Text>
            </View>
          )}
          <TouchableOpacity onPress={handleRefresh} style={[s.refreshBtn, { backgroundColor: colors.primary + '22' }]}>
            <Ionicons name="refresh-outline" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>
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
            {error === 'INVALID_KEY' || error === 'INVALID_RAPID_KEY' ? 'Chave inválida' : 'Erro ao carregar'}
          </Text>
          <Text style={[s.emptyText, { color: colors.textSecondary }]}>
            {error === 'INVALID_KEY' || error === 'INVALID_RAPID_KEY'
              ? 'Verifique sua chave em Configurações'
              : 'Verifique sua conexão'}
          </Text>
          <TouchableOpacity style={[s.retryBtn, { backgroundColor: colors.primary }]} onPress={handleRefresh}>
            <Text style={{ color: '#fff', fontWeight: '700' }}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      )}

      {!loading && !error && matches.length === 0 && (
        <View style={s.center}>
          <Text style={{ fontSize: 48, marginBottom: 12 }}>📅</Text>
          <Text style={[s.emptyTitle, { color: colors.text }]}>Sem jogos hoje</Text>
          <Text style={[s.emptyText, { color: colors.textSecondary }]}>
            Não há jogos disponíveis para hoje.
          </Text>
        </View>
      )}

      {matches.length > 0 && (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.list}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={handleRefresh} tintColor={colors.primary} />}
        >
          {Object.entries(byLeague).map(([liga, jogos]) => (
            <View key={liga} style={s.leagueGroup}>
              <View style={[s.leagueHeader, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={{ fontSize: 16 }}>⚽</Text>
                <Text style={[s.leagueName, { color: colors.text }]}>{liga}</Text>
                <Text style={[s.leagueCount, { color: colors.textSecondary }]}>{jogos.length} jogo{jogos.length !== 1 ? 's' : ''}</Text>
              </View>

              {jogos.map((m, i) => {
                const isLive = m.status === 'IN_PLAY' || m.status === 'HALFTIME';
                const isFinished = m.status === 'FINISHED';
                const statusLabel = STATUS_LABEL[m.status] || m.status;
                const statusColor = STATUS_COLOR[m.status] || colors.primary;
                const hasScore = m.scoreHome !== null && m.scoreHome !== undefined;

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
                    <View style={s.matchTop}>
                      <View style={[s.horaBadge, { backgroundColor: isLive ? '#ef444422' : colors.background }]}>
                        {isLive && <View style={s.liveDot} />}
                        <Text style={[s.hora, { color: isLive ? '#ef4444' : colors.primary }]}>
                          {getHourBRT(m.utcDate)}
                        </Text>
                        {isLive && m.minute != null && (
                          <Text style={[s.minuteText, { color: '#ef4444' }]}>{m.minute}'</Text>
                        )}
                      </View>
                      <View style={[s.statusBadge, { backgroundColor: statusColor + '18' }]}>
                        <Text style={[s.statusText, { color: statusColor }]}>{statusLabel}</Text>
                      </View>
                    </View>

                    <View style={s.teamsRow}>
                      <Text style={[s.teamName, { color: isFinished ? colors.textSecondary : colors.text }]} numberOfLines={1}>
                        {m.homeTeam}
                      </Text>
                      {hasScore ? (
                        <View style={[s.scoreBox, { backgroundColor: colors.background }]}>
                          <Text style={[s.score, { color: isLive ? '#ef4444' : colors.text }]}>
                            {m.scoreHome} — {m.scoreAway}
                          </Text>
                        </View>
                      ) : (
                        <View style={[s.vsBox, { backgroundColor: colors.background }]}>
                          <Text style={[s.vs, { color: colors.textSecondary }]}>×</Text>
                        </View>
                      )}
                      <Text style={[s.teamName, { color: isFinished ? colors.textSecondary : colors.text, textAlign: 'right' }]} numberOfLines={1}>
                        {m.awayTeam}
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
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 22, fontWeight: '800' },
  subtitle: { fontSize: 12, marginTop: 2 },
  sourceBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  sourceText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
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
  minuteText: { fontSize: 11, fontWeight: '700' },
  statusBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 10, fontWeight: '700' },
  teamsRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  teamName: { fontSize: 14, fontWeight: '700', flex: 1 },
  scoreBox: { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 5, minWidth: 72, alignItems: 'center' },
  score: { fontSize: 16, fontWeight: '800', letterSpacing: 1 },
  vsBox: { borderRadius: 8, paddingHorizontal: 16, paddingVertical: 5, minWidth: 48, alignItems: 'center' },
  vs: { fontSize: 14, fontWeight: '600' },
});
