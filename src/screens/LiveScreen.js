import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, RefreshControl, Modal, TextInput,
  KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';
import { useApp } from '../context/AppContext';
import { formatBRL } from '../utils/formatters';
import { fetchLiveMatches, fetchTodayMatches, generateLiveSuggestions, getMatchMinute, formatLeague } from '../services/liveApi';
import { fetchMatchStats, saveSmartApiKey, SMART_API_KEY_STORAGE } from '../services/smartApi';

const API_KEY_STORAGE = '@betmanager_football_api_key';
const POLL_INTERVAL = 60000;

function PulseDot({ color }) {
  return <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />;
}

function SuggestionChip({ sug, colors }) {
  const confColor = sug.confianca >= 75 ? colors.success : sug.confianca >= 60 ? colors.warning : colors.danger;
  return (
    <View style={[sc.chip, { backgroundColor: colors.background, borderColor: colors.border }]}>
      <View style={sc.chipTop}>
        <Ionicons name={sug.icon || 'bulb-outline'} size={13} color={colors.primary} />
        <Text style={[sc.tipo, { color: colors.text }]} numberOfLines={1}>{sug.tipo}</Text>
        <View style={[sc.conf, { backgroundColor: confColor + '22' }]}>
          <Text style={[sc.confText, { color: confColor }]}>{sug.confianca}%</Text>
        </View>
      </View>
      <Text style={[sc.rationale, { color: colors.textSecondary }]}>{sug.rationale}</Text>
    </View>
  );
}
const sc = StyleSheet.create({
  chip: { borderRadius: 10, borderWidth: 1, padding: 10, marginTop: 6 },
  chipTop: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 },
  tipo: { fontSize: 13, fontWeight: '700', flex: 1 },
  conf: { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  confText: { fontSize: 11, fontWeight: '700' },
  rationale: { fontSize: 11, marginLeft: 19 },
});

function StatBadge({ icon, label, value, color }) {
  if (value === null || value === undefined) return null;
  return (
    <View style={[sb.badge, { borderColor: color + '44', backgroundColor: color + '11' }]}>
      <Ionicons name={icon} size={11} color={color} />
      <Text style={[sb.label, { color }]}>{label} {value}</Text>
    </View>
  );
}
const sb = StyleSheet.create({
  badge: { flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: 6, borderWidth: 1, paddingHorizontal: 6, paddingVertical: 2 },
  label: { fontSize: 10, fontWeight: '700' },
});

function MatchCard({ match, stats, colors, onBet }) {
  const homeGoals = match.score?.fullTime?.home ?? match.score?.halfTime?.home ?? 0;
  const awayGoals = match.score?.fullTime?.away ?? match.score?.halfTime?.away ?? 0;
  const minute = getMatchMinute(match);
  const sugs = generateLiveSuggestions(match, stats);
  const isLive = match.status === 'IN_PLAY' || match.status === 'HALFTIME';
  const FINISHED_STATUSES = ['FINISHED','POSTPONED','CANCELLED','SUSPENDED','AWARDED','WALKOVER'];
  const statusLabel = match.status === 'HALFTIME' ? 'Intervalo'
    : match.status === 'IN_PLAY' ? `${minute}'`
    : match.status === 'TIMED' || match.status === 'SCHEDULED' ? 'Em breve'
    : FINISHED_STATUSES.includes(match.status) ? 'Encerrado'
    : match.status || 'Em breve';
  const hasStats = stats && (stats.home.xg !== null || stats.home.shots !== null);

  return (
    <View style={[mc.card, { backgroundColor: colors.card, borderColor: isLive ? '#ef4444' : colors.border }]}>
      <View style={mc.top}>
        <Text style={[mc.league, { color: colors.textSecondary }]}>{formatLeague(match.competition)}</Text>
        <View style={[mc.statusBadge, { backgroundColor: isLive ? '#ef444422' : colors.border + '44' }]}>
          {isLive && <PulseDot color="#ef4444" />}
          <Text style={[mc.statusText, { color: isLive ? '#ef4444' : colors.textSecondary }]}>{statusLabel}</Text>
        </View>
      </View>
      <View style={mc.scoreRow}>
        <Text style={[mc.teamName, { color: colors.text }]} numberOfLines={1}>{match.homeTeam?.shortName || match.homeTeam?.name}</Text>
        <View style={[mc.scorebox, { backgroundColor: colors.background }]}>
          <Text style={[mc.score, { color: colors.text }]}>{homeGoals} — {awayGoals}</Text>
        </View>
        <Text style={[mc.teamName, { color: colors.text, textAlign: 'right' }]} numberOfLines={1}>{match.awayTeam?.shortName || match.awayTeam?.name}</Text>
      </View>

      {/* Estatísticas reais */}
      {hasStats && (
        <View style={mc.statsRow}>
          {stats.home.xg !== null && (
            <StatBadge icon="analytics-outline" label="xG" value={`${stats.home.xg.toFixed(2)}–${stats.away.xg?.toFixed(2)}`} color={colors.primary} />
          )}
          {stats.home.possession !== null && (
            <StatBadge icon="pie-chart-outline" label="Posse" value={`${stats.home.possession}%–${stats.away.possession}%`} color={colors.warning} />
          )}
          {stats.home.shots !== null && (
            <StatBadge icon="flash-outline" label="Chutes" value={`${stats.home.shots}–${stats.away.shots}`} color={colors.success} />
          )}
          {stats.home.corners !== null && (
            <StatBadge icon="flag-outline" label="Cant." value={`${stats.home.corners}–${stats.away.corners}`} color={colors.textSecondary} />
          )}
        </View>
      )}

      {sugs.length > 0 && (
        <View style={{ marginTop: 10 }}>
          <Text style={[mc.sugTitle, { color: colors.textSecondary }]}>
            {hasStats ? '🧪 Sugestões com xG real' : 'Sugestões ao vivo'}
          </Text>
          {sugs.map((sug, i) => <SuggestionChip key={i} sug={sug} colors={colors} />)}
        </View>
      )}
      <TouchableOpacity style={[mc.betBtn, { backgroundColor: colors.primary }]} onPress={() => onBet(match, sugs[0])}>
        <Ionicons name="add-circle-outline" size={16} color="#fff" />
        <Text style={mc.betBtnText}>Registrar Aposta</Text>
      </TouchableOpacity>
    </View>
  );
}
const mc = StyleSheet.create({
  card: { borderRadius: 16, borderWidth: 1.5, padding: 16, marginBottom: 14, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  league: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 11, fontWeight: '700' },
  scoreRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  teamName: { fontSize: 14, fontWeight: '700', flex: 1 },
  scorebox: { borderRadius: 10, paddingHorizontal: 16, paddingVertical: 6 },
  score: { fontSize: 20, fontWeight: '800', letterSpacing: 2 },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  sugTitle: { fontSize: 11, fontWeight: '700', marginBottom: 2, letterSpacing: 0.5 },
  betBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 12, padding: 12, marginTop: 14 },
  betBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});

export default function LiveScreen() {
  const { colors } = useTheme();
  const { registrarAposta, banca } = useApp();
  const [apiKey, setApiKey] = useState('');
  const [keyInput, setKeyInput] = useState('');
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [liveMatches, setLiveMatches] = useState([]);
  const [todayMatches, setTodayMatches] = useState([]);
  const [matchStats, setMatchStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [tab, setTab] = useState('live');
  const [betModal, setBetModal] = useState(false);
  const [betMatch, setBetMatch] = useState(null);
  const [betSug, setBetSug] = useState(null);
  const [betValor, setBetValor] = useState('');
  const [betOdd, setBetOdd] = useState('');
  const [betResultado, setBetResultado] = useState(null);

  useEffect(() => {
    AsyncStorage.getItem(API_KEY_STORAGE).then(k => { if (k) setApiKey(k); });
  }, []);

  const loadMatches = useCallback(async (key) => {
    const k = key || apiKey;
    if (!k) { setError('NO_KEY'); return; }
    setLoading(true);
    setError(null);
    try {
      const [live, today] = await Promise.all([fetchLiveMatches(k), fetchTodayMatches(k)]);
      setLiveMatches(live);
      const DONE = ['FINISHED', 'POSTPONED', 'CANCELLED', 'SUSPENDED', 'AWARDED', 'WALKOVER'];
      setTodayMatches(today.filter(m => !['IN_PLAY','HALFTIME',...DONE].includes(m.status)));
      setLastUpdate(new Date());
      // Busca estatísticas reais (xG, posse, chutes) para jogos ao vivo
      if (live.length > 0) {
        const statsMap = {};
        await Promise.all(live.slice(0, 10).map(async m => {
          const s = await fetchMatchStats(m.id);
          if (s) statsMap[m.id] = s;
        }));
        setMatchStats(prev => ({ ...prev, ...statsMap }));
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [apiKey]);

  useEffect(() => {
    if (!apiKey) return;
    loadMatches(apiKey);
    const interval = setInterval(() => loadMatches(apiKey), POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [apiKey]);

  async function saveKey() {
    const k = keyInput.trim();
    if (!k) return;
    await AsyncStorage.setItem(API_KEY_STORAGE, k);
    setApiKey(k);
    setShowKeyModal(false);
    setKeyInput('');
    loadMatches(k);
  }

  function openBet(match, sug) {
    setBetMatch(match); setBetSug(sug || null);
    setBetValor(''); setBetOdd(''); setBetResultado(null);
    setBetModal(true);
  }

  async function confirmBet() {
    const v = parseFloat(betValor.replace(',', '.'));
    const o = parseFloat(betOdd.replace(',', '.'));
    if (!v || v <= 0) return Alert.alert('Erro', 'Informe o valor apostado.');
    if (!o || o <= 1) return Alert.alert('Erro', 'Informe uma odd válida.');
    if (!betResultado) return Alert.alert('Erro', 'Selecione o resultado.');
    if (v > banca.saldoAtual) return Alert.alert('Atenção', 'Valor supera seu saldo atual.');
    await registrarAposta({
      time1: betMatch.homeTeam?.shortName || betMatch.homeTeam?.name || 'Casa',
      time2: betMatch.awayTeam?.shortName || betMatch.awayTeam?.name || 'Visitante',
      tipo: betSug?.tipo || 'Aposta Ao Vivo',
      valor: v, odd: o, resultado: betResultado,
      esporte: 'futebol', origem: 'ao_vivo',
    });
    setBetModal(false);
    Alert.alert('Registrado!', betResultado === 'win' ? `+${formatBRL(v * (o - 1))}` : 'Aposta registrada.');
  }

  const displayMatches = tab === 'live' ? liveMatches : todayMatches;

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={s.header}>
        <View style={s.headerLeft}>
          <PulseDot color="#ef4444" />
          <Text style={[s.title, { color: colors.text }]}>Ao Vivo</Text>
        </View>
        <TouchableOpacity style={[s.keyBtn, { backgroundColor: apiKey ? colors.success + '22' : colors.primary + '22' }]} onPress={() => setShowKeyModal(true)}>
          <Ionicons name={apiKey ? 'key' : 'key-outline'} size={15} color={apiKey ? colors.success : colors.primary} />
          <Text style={[s.keyBtnText, { color: apiKey ? colors.success : colors.primary }]}>{apiKey ? 'API OK' : 'Config API'}</Text>
        </TouchableOpacity>
      </View>

      <View style={[s.tabRow, { borderBottomColor: colors.border }]}>
        {[{ id: 'live', label: `Ao Vivo (${liveMatches.length})` }, { id: 'today', label: `Hoje (${todayMatches.length})` }].map(t => (
          <TouchableOpacity key={t.id} style={[s.tabBtn, tab === t.id && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]} onPress={() => setTab(t.id)}>
            <Text style={[s.tabText, { color: tab === t.id ? colors.primary : colors.textSecondary }]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
        {lastUpdate && (
          <Text style={[s.lastUpdate, { color: colors.textSecondary }]}>
            {lastUpdate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        )}
      </View>

      {/* Empty / error states */}
      {!apiKey && (
        <View style={s.center}>
          <Text style={{ fontSize: 48, marginBottom: 12 }}>🔑</Text>
          <Text style={[s.emptyTitle, { color: colors.text }]}>Configure sua chave de API</Text>
          <Text style={[s.emptyText, { color: colors.textSecondary }]}>
            Para ver jogos ao vivo, você precisa de uma chave gratuita do football-data.org
          </Text>
          <Text style={[s.steps, { color: colors.textSecondary }]}>
            {'1. Acesse football-data.org\n2. Clique em "Get free API token"\n3. Copie a chave e cole aqui'}
          </Text>
          <TouchableOpacity style={[s.setupBtn, { backgroundColor: colors.primary }]} onPress={() => setShowKeyModal(true)}>
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Inserir Chave de API</Text>
          </TouchableOpacity>
        </View>
      )}

      {apiKey && loading && displayMatches.length === 0 && (
        <View style={s.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[s.emptyText, { color: colors.textSecondary, marginTop: 12 }]}>Buscando jogos...</Text>
        </View>
      )}

      {apiKey && !loading && error && displayMatches.length === 0 && (
        <View style={s.center}>
          <Text style={{ fontSize: 40, marginBottom: 8 }}>{error === 'INVALID_KEY' ? '❌' : '📡'}</Text>
          <Text style={[s.emptyTitle, { color: colors.text }]}>{error === 'INVALID_KEY' ? 'Chave inválida' : 'Erro de conexão'}</Text>
          <Text style={[s.emptyText, { color: colors.textSecondary }]}>
            {error === 'INVALID_KEY' ? 'Verifique sua chave no football-data.org' : 'Verifique sua conexão e tente novamente'}
          </Text>
          <TouchableOpacity style={[s.setupBtn, { backgroundColor: colors.primary }]} onPress={() => loadMatches()}>
            <Text style={{ color: '#fff', fontWeight: '700' }}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      )}

      {apiKey && !loading && !error && displayMatches.length === 0 && (
        <View style={s.center}>
          <Text style={{ fontSize: 48, marginBottom: 12 }}>{tab === 'live' ? '😴' : '📅'}</Text>
          <Text style={[s.emptyTitle, { color: colors.text }]}>{tab === 'live' ? 'Nenhum jogo ao vivo' : 'Sem jogos hoje'}</Text>
          <Text style={[s.emptyText, { color: colors.textSecondary }]}>
            {tab === 'live' ? 'Toque em "Hoje" para ver jogos agendados.' : 'Não há jogos agendados nas ligas disponíveis.'}
          </Text>
        </View>
      )}

      {displayMatches.length > 0 && (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.list}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={() => loadMatches()} tintColor={colors.primary} />}
        >
          {displayMatches.map(m => <MatchCard key={m.id} match={m} stats={matchStats[m.id] || null} colors={colors} onBet={openBet} />)}
          <View style={{ height: 32 }} />
        </ScrollView>
      )}

      {/* API Key Modal */}
      <Modal visible={showKeyModal} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.overlay}>
          <View style={[s.modal, { backgroundColor: colors.card }]}>
            <View style={s.modalHeader}>
              <Text style={[s.modalTitle, { color: colors.text }]}>Chave da API</Text>
              <TouchableOpacity onPress={() => setShowKeyModal(false)}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={[s.modalSub, { color: colors.textSecondary }]}>Obtenha grátis em football-data.org{'\n'}Cobre: Premier League, La Liga, Champions, Serie A, Ligue 1, Bundesliga</Text>
            <TextInput
              style={[s.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              value={keyInput} onChangeText={setKeyInput}
              placeholder="Cole sua API key aqui"
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="none" autoCorrect={false}
            />
            {apiKey ? <Text style={[{ color: colors.success, fontSize: 12, marginBottom: 8 }]}>Chave atual: {apiKey.slice(0, 8)}...</Text> : null}
            <View style={s.modalBtns}>
              <TouchableOpacity style={[s.modalBtn, { borderColor: colors.border }]} onPress={() => setShowKeyModal(false)}>
                <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.modalBtn, { backgroundColor: colors.primary, borderColor: colors.primary }]} onPress={saveKey}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Bet Modal */}
      <Modal visible={betModal} transparent animationType="slide" onRequestClose={() => setBetModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.overlay}>
          <View style={[s.modal, { backgroundColor: colors.card }]}>
            <View style={s.modalHeader}>
              <Text style={[s.modalTitle, { color: colors.text }]}>Registrar Aposta</Text>
              <TouchableOpacity onPress={() => setBetModal(false)}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            {betMatch && <Text style={[s.modalSub, { color: colors.textSecondary }]}>{betMatch.homeTeam?.shortName || betMatch.homeTeam?.name} vs {betMatch.awayTeam?.shortName || betMatch.awayTeam?.name}</Text>}
            {betSug && <View style={[s.tipoBadge, { backgroundColor: colors.primary + '22', marginBottom: 10 }]}><Text style={{ color: colors.primary, fontWeight: '700', fontSize: 13 }}>{betSug.tipo}</Text></View>}
            <Text style={[s.inputLabel, { color: colors.textSecondary }]}>Valor Apostado (R$)</Text>
            <TextInput style={[s.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]} value={betValor} onChangeText={setBetValor} keyboardType="decimal-pad" placeholder="Ex: 50.00" placeholderTextColor={colors.textSecondary} />
            <Text style={[s.inputLabel, { color: colors.textSecondary }]}>Odd</Text>
            <TextInput style={[s.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]} value={betOdd} onChangeText={setBetOdd} keyboardType="decimal-pad" placeholder="Ex: 2.10" placeholderTextColor={colors.textSecondary} />
            {betValor && betOdd && parseFloat(betOdd) > 1 && (
              <View style={[s.calcRow, { backgroundColor: colors.success + '11' }]}>
                <Text style={[{ color: colors.success, fontSize: 13, fontWeight: '700' }]}>Retorno potencial: +{formatBRL(parseFloat(betValor.replace(',', '.') || 0) * (parseFloat(betOdd.replace(',', '.') || 1) - 1))}</Text>
              </View>
            )}
            <Text style={[s.inputLabel, { color: colors.textSecondary }]}>Resultado</Text>
            <View style={s.resultRow}>
              {[{ v: 'win', label: '✅ Vencedora', color: colors.success }, { v: 'loss', label: '❌ Perdedora', color: colors.danger }].map(r => (
                <TouchableOpacity key={r.v} style={[s.resultBtn, { borderColor: betResultado === r.v ? r.color : colors.border }, betResultado === r.v && { backgroundColor: r.color + '22' }]} onPress={() => setBetResultado(r.v)}>
                  <Text style={[s.resultBtnText, { color: betResultado === r.v ? r.color : colors.textSecondary }]}>{r.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={[s.confirmBtn, { backgroundColor: colors.primary }]} onPress={confirmBet}>
              <Text style={s.confirmBtnText}>Confirmar Aposta</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 10 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 22, fontWeight: '800' },
  keyBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7 },
  keyBtnText: { fontSize: 12, fontWeight: '700' },
  tabRow: { flexDirection: 'row', borderBottomWidth: 1, paddingHorizontal: 16 },
  tabBtn: { paddingVertical: 10, paddingHorizontal: 4, marginRight: 20 },
  tabText: { fontSize: 13, fontWeight: '700' },
  lastUpdate: { fontSize: 11, alignSelf: 'center', marginLeft: 'auto' },
  list: { paddingHorizontal: 16, paddingTop: 14 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyTitle: { fontSize: 18, fontWeight: '800', marginBottom: 8, textAlign: 'center' },
  emptyText: { fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 12 },
  steps: { fontSize: 13, textAlign: 'left', lineHeight: 24, marginBottom: 20, alignSelf: 'flex-start' },
  setupBtn: { borderRadius: 14, paddingHorizontal: 28, paddingVertical: 14, marginTop: 4 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  modal: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  modalSub: { fontSize: 13, marginBottom: 12, lineHeight: 19 },
  tipoBadge: { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, alignSelf: 'flex-start' },
  inputLabel: { fontSize: 12, fontWeight: '600', marginBottom: 6, marginTop: 12 },
  input: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  calcRow: { borderRadius: 8, padding: 10, marginTop: 8 },
  resultRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  resultBtn: { flex: 1, borderRadius: 10, borderWidth: 1.5, padding: 12, alignItems: 'center' },
  resultBtnText: { fontSize: 13, fontWeight: '700' },
  confirmBtn: { borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 20 },
  confirmBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  modalBtns: { flexDirection: 'row', gap: 12, marginTop: 8 },
  modalBtn: { flex: 1, borderRadius: 12, borderWidth: 1, padding: 14, alignItems: 'center' },
});
