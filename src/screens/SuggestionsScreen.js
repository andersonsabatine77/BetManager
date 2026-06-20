import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Modal, TextInput, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useApp } from '../context/AppContext';
import { formatBRL, getJogoLabel } from '../utils/formatters';

const RISCO_COLOR = { baixo: '#10b981', medio: '#f59e0b', alto: '#ef4444' };
const SPORTS_FILTER = ['Todos', 'futebol', 'basquete'];

function ConfidenceBar({ value, colors }) {
  const color = value >= 75 ? colors.success : value >= 60 ? colors.warning : colors.danger;
  return (
    <View style={{ marginTop: 8 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
        <Text style={{ color: colors.textSecondary, fontSize: 11 }}>Confiança IA</Text>
        <Text style={{ color, fontSize: 11, fontWeight: '700' }}>{value}%</Text>
      </View>
      <View style={{ height: 6, backgroundColor: colors.border, borderRadius: 3, overflow: 'hidden' }}>
        <View style={{ width: `${value}%`, height: '100%', backgroundColor: color, borderRadius: 3 }} />
      </View>
    </View>
  );
}

export default function SuggestionsScreen() {
  const { colors } = useTheme();
  const { sugestoes, registrarAposta, banca } = useApp();
  const [sportFilter, setSportFilter] = useState('Todos');
  const [selected, setSelected] = useState(null);
  const [valor, setValor] = useState('');
  const [odd, setOdd] = useState('');
  const [resultado, setResultado] = useState(null); // 'win' | 'loss' | null
  const [showModal, setShowModal] = useState(false);
  const [showManual, setShowManual] = useState(false);
  // Manual fields
  const [mTime1, setMTime1] = useState('');
  const [mTime2, setMTime2] = useState('');
  const [mTipo, setMTipo] = useState('');
  const [mValor, setMValor] = useState('');
  const [mOdd, setMOdd] = useState('');
  const [mResultado, setMResultado] = useState(null);
  const [mEsporte, setMEsporte] = useState('futebol');

  const filtered = sportFilter === 'Todos' ? sugestoes : sugestoes.filter(s => s.esporte === sportFilter);

  function openModal(sug) {
    setSelected(sug);
    setValor('');
    setOdd('');
    setResultado(null);
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
      tipo: selected.tipo, valor: v, odd: o, resultado,
      esporte: selected.esporte, origem: 'sugestao',
    });
    setShowModal(false);
    Alert.alert('✅ Registrado!', resultado === 'win' ? `Parabéns! +${formatBRL(v * (o - 1))}` : `Aposta registrada.`);
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
    Alert.alert('✅ Registrado!', 'Aposta manual adicionada.');
  }

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={s.header}>
        <Text style={[s.title, { color: colors.text }]}>Sugestões</Text>
        <TouchableOpacity style={[s.manualBtn, { backgroundColor: colors.primary }]} onPress={() => setShowManual(true)}>
          <Ionicons name="add" size={16} color="#fff" />
          <Text style={s.manualBtnText}>Manual</Text>
        </TouchableOpacity>
      </View>

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
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.list}>
        {filtered.map(sug => (
          <View key={sug.id} style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={s.cardTop}>
              <Text style={{ fontSize: 20 }}>{sug.esporte === 'basquete' ? '🏀' : '⚽'}</Text>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={[s.liga, { color: colors.textSecondary }]}>{sug.liga}</Text>
                <Text style={[s.jogoLabel, { color: colors.textSecondary }]}>{getJogoLabel(sug.daysAhead, sug.hour)}</Text>
              </View>
            </View>

            <Text style={[s.teams, { color: colors.text }]}>{sug.time1} vs {sug.time2}</Text>

            <View style={[s.tipoBadge, { backgroundColor: colors.primary + '22' }]}>
              <Ionicons name="bulb-outline" size={13} color={colors.primary} />
              <Text style={[s.tipoText, { color: colors.primary }]}>{sug.tipo}</Text>
            </View>

            <ConfidenceBar value={sug.confianca} colors={colors} />

            <TouchableOpacity style={[s.apostarBtn, { backgroundColor: colors.primary }]} onPress={() => openModal(sug)}>
              <Ionicons name="checkmark-circle-outline" size={16} color="#fff" />
              <Text style={s.apostarBtnText}>Registrar Aposta</Text>
            </TouchableOpacity>
          </View>
        ))}
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
                  <Text style={[s.tipoText, { color: colors.primary }]}>{selected.tipo}</Text>
                </View>

                <Text style={[s.inputLabel, { color: colors.textSecondary }]}>Valor Apostado (R$)</Text>
                <TextInput style={[s.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]} value={valor} onChangeText={setValor} keyboardType="decimal-pad" placeholder="Ex: 50.00" placeholderTextColor={colors.textSecondary} />

                <Text style={[s.inputLabel, { color: colors.textSecondary }]}>Odd da Casa</Text>
                <TextInput style={[s.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]} value={odd} onChangeText={setOdd} keyboardType="decimal-pad" placeholder="Ex: 1.85" placeholderTextColor={colors.textSecondary} />

                {valor && odd && parseFloat(odd) > 1 && (
                  <View style={[s.calcRow, { backgroundColor: colors.success + '11' }]}>
                    <Text style={[s.calcText, { color: colors.success }]}>
                      Retorno potencial: +{formatBRL(parseFloat(valor.replace(',','.') || 0) * (parseFloat(odd.replace(',','.') || 1) - 1))}
                    </Text>
                  </View>
                )}

                <Text style={[s.inputLabel, { color: colors.textSecondary }]}>Resultado</Text>
                <View style={s.resultRow}>
                  {[{ v: 'win', label: '✅ Vencedora', color: colors.success }, { v: 'loss', label: '❌ Perdedora', color: colors.danger }].map(r => (
                    <TouchableOpacity
                      key={r.v}
                      style={[s.resultBtn, { borderColor: resultado === r.v ? r.color : colors.border }, resultado === r.v && { backgroundColor: r.color + '22' }]}
                      onPress={() => setResultado(r.v)}
                    >
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
                <TextInput
                  style={[s.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                  value={f.value} onChangeText={f.set}
                  keyboardType={f.keyboard || 'default'}
                  placeholder={f.placeholder || f.label}
                  placeholderTextColor={colors.textSecondary}
                />
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
  manualBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  manualBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  filterRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 8 },
  filterChip: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 7 },
  filterText: { fontSize: 13, fontWeight: '600' },
  list: { paddingHorizontal: 16, paddingTop: 4 },
  card: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6 },
  cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  liga: { fontSize: 12, fontWeight: '600' },
  jogoLabel: { fontSize: 11, marginTop: 1 },
  teams: { fontSize: 17, fontWeight: '800', marginBottom: 10 },
  tipoBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, alignSelf: 'flex-start' },
  tipoText: { fontSize: 13, fontWeight: '700' },
  apostarBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 12, padding: 14, marginTop: 12 },
  apostarBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  modal: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  modalSub: { fontSize: 13, marginBottom: 12 },
  inputLabel: { fontSize: 12, fontWeight: '600', marginBottom: 6, marginTop: 12 },
  input: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  calcRow: { borderRadius: 8, padding: 10, marginTop: 8 },
  calcText: { fontSize: 13, fontWeight: '700' },
  resultRow: { flexDirection: 'row', gap: 10, marginTop: 2 },
  resultBtn: { flex: 1, borderRadius: 10, borderWidth: 1.5, padding: 12, alignItems: 'center' },
  resultBtnText: { fontSize: 13, fontWeight: '700' },
  confirmBtn: { borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 20 },
  confirmBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
