import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Modal, TextInput, KeyboardAvoidingView, Platform, Alert,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';
import { useApp } from '../context/AppContext';
import { formatBRL, getJogoLabel } from '../utils/formatters';
import { analyzeMatchesBatch, ANTHROPIC_KEY_STORAGE } from '../services/aiAnalysis';

const SPORTS_FILTER = ['Todos', 'futebol', 'basquete'];

function ConfidenceBar({ value, colors }) {
  const color = value >= 75 ? colors.success : value >= 60 ? colors.warning : colors.danger;
  return (
    <View style={{ marginTop: 6 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
        <Text style={{ color: colors.textSecondary, fontSize: 10 }}>Confiança IA</Text>
        <Text style={{ color, fontSize: 10, fontWeight: '700' }}>{value}%</Text>
      </View>
      <View style={{ height: 5, backgroundColor: colors.border, borderRadius: 3, overflow: 'hidden' }}>
        <View style={{ width: `${value}%`, height: '100%', backgroundColor: color, borderRadius: 3 }} />
      </View>
    </View>
  );
}

function AiSuggestions({ aiData, loading, error, colors }) {
  if (loading) {
    return (
      <View style={[ai.box, { backgroundColor: colors.background, borderColor: colors.border }]}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={[ai.analyzing, { color: colors.textSecondary }]}>Analisando com IA...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[ai.box, { backgroundColor: colors.danger + '11', borderColor: colors.danger + '44' }]}>
        <Ionicons name="warning-outline" size={14} color={colors.danger} />
        <Text style={[ai.analyzing, { color: colors.danger }]}>
          {error === 'INVALID_AI_KEY' ? 'Chave Gemini inválida — verifique em Configurações' :
           error === 'NO_AI_KEY' ? 'Chave Gemini não configurada' :
           error?.includes('Cota') ? 'Cota gratuita atingida — aguarde 1 min e puxe para atualizar' :
           `Erro IA: ${error}`}
        </Text>
      </View>
    );
  }

  const filtered = (aiData || []).filter(s => (parseInt(s.confianca, 10) || 0) >= 55);
  if (filtered.length === 0) return null;

  return (
    <View style={[ai.container, { borderTopColor: colors.border }]}>
      <View style={ai.titleRow}>
        <Text style={{ fontSize: 14 }}>🤖</Text>
        <Text style={[ai.title, { color: colors.primary }]}>Análise IA — Acima de 60%</Text>
      </View>
      {filtered.map((sug, i) => {
        const conf = parseInt(sug.confianca, 10) || 0;
        const confColor = conf >= 75 ? colors.success : conf >= 60 ? colors.warning : colors.danger;
        return (
          <View key={i} style={[ai.item, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <View style={ai.itemTop}>
              <View style={[ai.rank, { backgroundColor: colors.primary }]}>
                <Text style={ai.rankText}>{i + 1}</Text>
              </View>
              <Text style={[ai.tipo, { color: colors.text }]} numberOfLines={2}>{sug.tipo}</Text>
              <View style={[ai.conf, { backgroundColor: confColor + '22' }]}>
                <Text style={[ai.confText, { color: confColor }]}>{conf}%</Text>
              </View>
            </View>
            <Text style={[ai.razao, { color: colors.textSecondary }]}>{sug.razao}</Text>
          </View>
        );
      })}
    </View>
  );
}

const ai = StyleSheet.create({
  box: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 10, borderWidth: 1, padding: 12, marginTop: 12 },
  analyzing: { fontSize: 13 },
  container: { marginTop: 12, borderTopWidth: 1, paddingTop: 12 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  title: { fontSize: 13, fontWeight: '800' },
  item: { borderRadius: 10, borderWidth: 1, padding: 10, marginBottom: 6 },
  itemTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  rank: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  rankText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  tipo: { fontSize: 13, fontWeight: '700', flex: 1 },
  conf: { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  confText: { fontSize: 11, fontWeight: '700' },
  razao: { fontSize: 11, marginLeft: 28, lineHeight: 15 },
});

export default function SuggestionsScreen() {
  const { colors } = useTheme();
  const { sugestoes, sugestoesLoading, sugestoesError, reloadSugestoes, registrarAposta, banca } = useApp();
  const [sportFilter, setSportFilter] = useState('Todos');
  const [selected, setSelected] = useState(null);
  const [valor, setValor] = useState('');
  const [odd, setOdd] = useState('');
  const [resultado, setResultado] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedTipo, setSelectedTipo] = useState('');
  const [showManual, setShowManual] = useState(false);
  const [mTime1, setMTime1] = useState('');
  const [mTime2, setMTime2] = useState('');
  const [mTipo, setMTipo] = useState('');
  const [mValor, setMValor] = useState('');
  const [mOdd, setMOdd] = useState('');
  const [mResultado, setMResultado] = useState(null);
  const [mEsporte, setMEsporte] = useState('futebol');

  const [aiResults, setAiResults] = useState({});
  const [hasAiKey, setHasAiKey] = useState(false);
  const analysisRunning = useRef(false);

  useEffect(() => {
    AsyncStorage.getItem(ANTHROPIC_KEY_STORAGE).then(k => setHasAiKey(!!k));
  }, []);

  // Cache key muda quando os jogos mudam (usa IDs como fingerprint)
  function getCacheKey(matches) {
    const today = new Date().toISOString().slice(0, 10);
    const ids = matches.map(m => m.id).join(',');
    return `@ai_cache_${today}_${ids.slice(0, 40)}`;
  }

  async function runAiAnalysis(matches, forceRefresh = false) {
    if (analysisRunning.current) return;
    const key = await AsyncStorage.getItem(ANTHROPIC_KEY_STORAGE);
    if (!key) return;
    setHasAiKey(true);

    const toAnalyze = matches.filter(s => s.esporte === 'futebol').slice(0, 8);
    if (toAnalyze.length === 0) return;

    // Verifica cache (exceto se forçar refresh)
    if (!forceRefresh) {
      try {
        const cacheKey = getCacheKey(toAnalyze);
        const cached = await AsyncStorage.getItem(cacheKey);
        if (cached) {
          setAiResults(JSON.parse(cached));
          return;
        }
      } catch (_) {}
    }

    // Marca como carregando
    const initial = {};
    toAnalyze.forEach(s => { initial[s.id] = { data: null, loading: true, error: null }; });
    setAiResults(initial);

    const accumulated = {};
    analysisRunning.current = true;

    await analyzeMatchesBatch(toAnalyze, (id, result) => {
      accumulated[id] = { data: result.data, loading: false, error: result.error };
      setAiResults(prev => ({ ...prev, [id]: accumulated[id] }));
    });

    analysisRunning.current = false;

    // Salva cache apenas se não houve erro global
    const hasError = Object.values(accumulated).some(r => r.error?.includes('Cota') || r.error?.includes('QUOTA'));
    if (!hasError) {
      try {
        const cacheKey = getCacheKey(toAnalyze);
        await AsyncStorage.setItem(cacheKey, JSON.stringify(accumulated));
      } catch (_) {}
    }
  }

  useEffect(() => {
    if (!sugestoes || sugestoes.length === 0) return;
    runAiAnalysis(sugestoes);
  }, [sugestoes]);

  const filtered = sportFilter === 'Todos' ? sugestoes : sugestoes.filter(s => s.esporte === sportFilter);
  const isApiData = sugestoesError !== 'NO_KEY' && !sugestoesError;

  function openModal(sug, tipoOverride) {
    setSelected(sug);
    setSelectedTipo(tipoOverride || sug.tipo);
    setValor(''); setOdd(''); setResultado(null);
    setShowModal(true);
  }

  async function confirmAposta() {
    const v = parseFloat(valor.replace(',', '.'));
    const o = parseFloat(odd.replace(',', '.'));
    if (!v || v <= 0) return Alert.alert('Erro', 'Informe o valor apostado.');
    if (!o || o <= 1) return Alert.alert('Erro', 'Informe uma odd válida (maior que 1).');
    if (!resultado) return Alert.alert('Erro', 'Selecione o resultado.');
    if (v > banca.saldoAtual) return Alert.alert('Atenção', 'Valor supera seu saldo atual.');
    await registrarAposta({
      time1: selected.time1, time2: selected.time2,
      tipo: selectedTipo, valor: v, odd: o, resultado,
      esporte: selected.esporte, origem: 'sugestao',
    });
    setShowModal(false);
    Alert.alert('Registrado!', resultado === 'win' ? `+${formatBRL(v * (o - 1))}` : 'Aposta registrada.');
  }

  async function confirmManual() {
    if (!mTime1 || !mTime2) return Alert.alert('Erro', 'Preencha os times.');
    if (!mTipo) return Alert.alert('Erro', 'Informe o tipo de aposta.');
    const v = parseFloat(mValor.replace(',', '.'));
    const o = parseFloat(mOdd.replace(',', '.'));
    if (!v || v <= 0) return Alert.alert('Erro', 'Informe o valor apostado.');
    if (!o || o <= 1) return Alert.alert('Erro', 'Informe uma odd válida.');
    if (!mResultado) return Alert.alert('Erro', 'Selecione o resultado.');
    await registrarAposta({ time1: mTime1, time2: mTime2, tipo: mTipo, valor: v, odd: o, resultado: mResultado, esporte: mEsporte, origem: 'manual' });
    setShowManual(false);
    setMTime1(''); setMTime2(''); setMTipo(''); setMValor(''); setMOdd(''); setMResultado(null);
    Alert.alert('Registrado!', 'Aposta manual adicionada.');
  }

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={s.header}>
        <View>
          <Text style={[s.title, { color: colors.text }]}>Sugestões</Text>
          {isApiData && !sugestoesLoading && (
            <Text style={[s.subtitle, { color: colors.success }]}>
              {filtered.length} jogos reais · próximos 3 dias
            </Text>
          )}
          {sugestoesError === 'NO_KEY' && (
            <Text style={[s.subtitle, { color: colors.textSecondary }]}>Configure a API para jogos reais</Text>
          )}
        </View>
        <TouchableOpacity style={[s.manualBtn, { backgroundColor: colors.primary }]} onPress={() => setShowManual(true)}>
          <Ionicons name="add" size={16} color="#fff" />
          <Text style={s.manualBtnText}>Manual</Text>
        </TouchableOpacity>
      </View>

      {/* Banners */}
      {sugestoesError === 'NO_KEY' && (
        <View style={[s.banner, { backgroundColor: colors.primary + '15', borderColor: colors.primary }]}>
          <Ionicons name="information-circle-outline" size={15} color={colors.primary} />
          <Text style={[s.bannerText, { color: colors.primary }]}>
            Aba "Ao Vivo" → "Config API" para ver jogos reais agendados aqui.
          </Text>
        </View>
      )}
      {isApiData && !hasAiKey && (
        <View style={[s.banner, { backgroundColor: colors.warning + '18', borderColor: colors.warning }]}>
          <Text style={{ fontSize: 13 }}>🤖</Text>
          <Text style={[s.bannerText, { color: colors.warning }]}>
            Adicione a chave Claude em Configurações para análise IA por jogo.
          </Text>
        </View>
      )}

      {/* Sport filter */}
      <View style={s.filterRow}>
        {SPORTS_FILTER.map(f => (
          <TouchableOpacity
            key={f}
            style={[s.filterChip, { borderColor: sportFilter === f ? colors.primary : colors.border }, sportFilter === f && { backgroundColor: colors.primary }]}
            onPress={() => setSportFilter(f)}
          >
            <Text style={[s.filterText, { color: sportFilter === f ? '#fff' : colors.textSecondary }]}>
              {f === 'Todos' ? 'Todos' : f === 'futebol' ? '⚽ Futebol' : '🏀 Basquete'}
            </Text>
          </TouchableOpacity>
        ))}
        {sugestoesLoading && <ActivityIndicator size="small" color={colors.primary} style={{ marginLeft: 8 }} />}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.list}
        refreshControl={<RefreshControl refreshing={sugestoesLoading} onRefresh={() => { reloadSugestoes(); runAiAnalysis(sugestoes, true); }} tintColor={colors.primary} />}
      >
        {filtered.length === 0 && !sugestoesLoading && (
          <View style={s.empty}>
            <Text style={{ fontSize: 44 }}>🗓️</Text>
            <Text style={[s.emptyText, { color: colors.textSecondary }]}>Nenhum jogo encontrado</Text>
            <TouchableOpacity onPress={reloadSugestoes} style={[s.retryBtn, { borderColor: colors.primary }]}>
              <Text style={{ color: colors.primary, fontWeight: '700' }}>Recarregar</Text>
            </TouchableOpacity>
          </View>
        )}

        {filtered.map(sug => {
          const ai = aiResults[sug.id];
          const aiLoading = ai?.loading;
          const aiData = ai?.data;
          const topAiTipo = aiData?.[0]?.tipo || sug.tipo;

          return (
            <View key={sug.id} style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {/* Header */}
              <View style={s.cardTop}>
                <Text style={{ fontSize: 18 }}>{sug.esporte === 'basquete' ? '🏀' : '⚽'}</Text>
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={[s.liga, { color: colors.textSecondary }]}>{sug.liga}</Text>
                  <Text style={[s.jogoLabel, { color: colors.primary, fontWeight: '700' }]}>
                    {getJogoLabel(sug.daysAhead, sug.hour)}
                  </Text>
                </View>
                {isApiData && (
                  <View style={[s.realBadge, { backgroundColor: colors.success + '22' }]}>
                    <Text style={[s.realBadgeText, { color: colors.success }]}>REAL</Text>
                  </View>
                )}
              </View>

              {/* Teams */}
              <Text style={[s.teams, { color: colors.text }]}>{sug.time1} vs {sug.time2}</Text>

              {/* AI Analysis or basic suggestion */}
              {hasAiKey ? (
                <AiSuggestions aiData={aiData} loading={!!aiLoading} error={ai?.error} colors={colors} />
              ) : (
                <>
                  <View style={[s.tipoBadge, { backgroundColor: colors.primary + '22' }]}>
                    <Ionicons name="bulb-outline" size={13} color={colors.primary} />
                    <Text style={[s.tipoText, { color: colors.primary }]}>{sug.tipo}</Text>
                  </View>
                  <ConfidenceBar value={sug.confianca} colors={colors} />
                </>
              )}

              {/* Bet button */}
              <TouchableOpacity
                style={[s.apostarBtn, { backgroundColor: colors.primary }]}
                onPress={() => openModal(sug, topAiTipo)}
              >
                <Ionicons name="checkmark-circle-outline" size={16} color="#fff" />
                <Text style={s.apostarBtnText}>Registrar Aposta</Text>
              </TouchableOpacity>
            </View>
          );
        })}
        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Bet modal */}
      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.overlay}>
          <View style={[s.modal, { backgroundColor: colors.card }]}>
            <View style={s.modalHeader}>
              <Text style={[s.modalTitle, { color: colors.text }]}>Registrar Aposta</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            {selected && (
              <>
                <Text style={[s.modalSub, { color: colors.textSecondary }]}>{selected.time1} vs {selected.time2}</Text>
                <View style={[s.tipoBadge, { backgroundColor: colors.primary + '22', marginBottom: 16 }]}>
                  <Text style={[s.tipoText, { color: colors.primary }]}>{selectedTipo}</Text>
                </View>

                <Text style={[s.inputLabel, { color: colors.textSecondary }]}>Valor Apostado (R$)</Text>
                <TextInput style={[s.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]} value={valor} onChangeText={setValor} keyboardType="decimal-pad" placeholder="Ex: 50.00" placeholderTextColor={colors.textSecondary} />

                <Text style={[s.inputLabel, { color: colors.textSecondary }]}>Odd da Casa</Text>
                <TextInput style={[s.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]} value={odd} onChangeText={setOdd} keyboardType="decimal-pad" placeholder="Ex: 1.85" placeholderTextColor={colors.textSecondary} />

                {valor && odd && parseFloat(odd) > 1 && (
                  <View style={[s.calcRow, { backgroundColor: colors.success + '11' }]}>
                    <Text style={{ color: colors.success, fontSize: 13, fontWeight: '700' }}>
                      Retorno potencial: +{formatBRL(parseFloat(valor.replace(',', '.') || 0) * (parseFloat(odd.replace(',', '.') || 1) - 1))}
                    </Text>
                  </View>
                )}

                <Text style={[s.inputLabel, { color: colors.textSecondary }]}>Resultado</Text>
                <View style={s.resultRow}>
                  {[{ v: 'win', label: '✅ Vencedora', color: colors.success }, { v: 'loss', label: '❌ Perdedora', color: colors.danger }].map(r => (
                    <TouchableOpacity key={r.v} style={[s.resultBtn, { borderColor: resultado === r.v ? r.color : colors.border }, resultado === r.v && { backgroundColor: r.color + '22' }]} onPress={() => setResultado(r.v)}>
                      <Text style={[s.resultBtnText, { color: resultado === r.v ? r.color : colors.textSecondary }]}>{r.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity style={[s.confirmBtn, { backgroundColor: colors.primary }]} onPress={confirmAposta}>
                  <Text style={s.confirmBtnText}>Confirmar Aposta</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Manual modal */}
      <Modal visible={showManual} transparent animationType="slide" onRequestClose={() => setShowManual(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.overlay}>
          <ScrollView style={[s.modal, { backgroundColor: colors.card }]}>
            <View style={s.modalHeader}>
              <Text style={[s.modalTitle, { color: colors.text }]}>Aposta Manual</Text>
              <TouchableOpacity onPress={() => setShowManual(false)}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            {[
              { label: 'Time A / Equipe A', value: mTime1, set: setMTime1 },
              { label: 'Time B / Equipe B', value: mTime2, set: setMTime2 },
              { label: 'Tipo de Aposta', value: mTipo, set: setMTipo, placeholder: 'Ex: Mais de 2.5 Gols' },
              { label: 'Valor Apostado (R$)', value: mValor, set: setMValor, keyboard: 'decimal-pad' },
              { label: 'Odd', value: mOdd, set: setMOdd, keyboard: 'decimal-pad' },
            ].map(f => (
              <View key={f.label}>
                <Text style={[s.inputLabel, { color: colors.textSecondary }]}>{f.label}</Text>
                <TextInput style={[s.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]} value={f.value} onChangeText={f.set} keyboardType={f.keyboard || 'default'} placeholder={f.placeholder || f.label} placeholderTextColor={colors.textSecondary} />
              </View>
            ))}
            <Text style={[s.inputLabel, { color: colors.textSecondary }]}>Esporte</Text>
            <View style={s.resultRow}>
              {['futebol', 'basquete'].map(e => (
                <TouchableOpacity key={e} style={[s.resultBtn, { borderColor: mEsporte === e ? colors.primary : colors.border }, mEsporte === e && { backgroundColor: colors.primary + '22' }]} onPress={() => setMEsporte(e)}>
                  <Text style={[s.resultBtnText, { color: mEsporte === e ? colors.primary : colors.textSecondary }]}>{e === 'futebol' ? '⚽ Futebol' : '🏀 Basquete'}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[s.inputLabel, { color: colors.textSecondary }]}>Resultado</Text>
            <View style={s.resultRow}>
              {[{ v: 'win', label: '✅ Vencedora', color: colors.success }, { v: 'loss', label: '❌ Perdedora', color: colors.danger }].map(r => (
                <TouchableOpacity key={r.v} style={[s.resultBtn, { borderColor: mResultado === r.v ? r.color : colors.border }, mResultado === r.v && { backgroundColor: r.color + '22' }]} onPress={() => setMResultado(r.v)}>
                  <Text style={[s.resultBtnText, { color: mResultado === r.v ? r.color : colors.textSecondary }]}>{r.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={[s.confirmBtn, { backgroundColor: colors.primary, marginBottom: 32 }]} onPress={confirmManual}>
              <Text style={s.confirmBtnText}>Adicionar Aposta</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: 22, fontWeight: '800' },
  subtitle: { fontSize: 12, marginTop: 2 },
  manualBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  manualBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  banner: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, marginBottom: 6, borderRadius: 10, borderWidth: 1, padding: 10 },
  bannerText: { fontSize: 12, flex: 1, lineHeight: 16 },
  filterRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 8, alignItems: 'center' },
  filterChip: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 7 },
  filterText: { fontSize: 13, fontWeight: '600' },
  list: { paddingHorizontal: 16, paddingTop: 4 },
  empty: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyText: { fontSize: 14 },
  retryBtn: { borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10 },
  card: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 14, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6 },
  cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  liga: { fontSize: 11, fontWeight: '600' },
  jogoLabel: { fontSize: 12, marginTop: 1 },
  realBadge: { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  realBadgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  teams: { fontSize: 17, fontWeight: '800', marginBottom: 8 },
  tipoBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, alignSelf: 'flex-start' },
  tipoText: { fontSize: 13, fontWeight: '700' },
  apostarBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 12, padding: 13, marginTop: 12 },
  apostarBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  modal: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  modalSub: { fontSize: 13, marginBottom: 12 },
  inputLabel: { fontSize: 12, fontWeight: '600', marginBottom: 6, marginTop: 12 },
  input: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  calcRow: { borderRadius: 8, padding: 10, marginTop: 8 },
  resultRow: { flexDirection: 'row', gap: 10, marginTop: 2 },
  resultBtn: { flex: 1, borderRadius: 10, borderWidth: 1.5, padding: 12, alignItems: 'center' },
  resultBtnText: { fontSize: 13, fontWeight: '700' },
  confirmBtn: { borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 20 },
  confirmBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
