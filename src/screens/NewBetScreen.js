import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useApp } from '../context/AppContext';
import { formatBRL } from '../utils/formatters';

const ESPORTES = [
  { id: 'futebol', label: '⚽ Futebol' },
  { id: 'basquete', label: '🏀 Basquete' },
  { id: 'tenis', label: '🎾 Tênis' },
  { id: 'volei', label: '🏐 Vôlei' },
  { id: 'outro', label: '🎯 Outro' },
];

const TIPOS_RAPIDOS = [
  'Vitória Mandante', 'Vitória Visitante', 'Empate',
  'Mais de 2.5 Gols', 'Menos de 2.5 Gols',
  'Mais de 1.5 Gols', 'Ambos Marcam - Sim',
  'Dupla Chance 1X', 'Dupla Chance X2',
];

export default function NewBetScreen() {
  const { colors } = useTheme();
  const { registrarAposta, banca } = useApp();

  const [time1, setTime1] = useState('');
  const [time2, setTime2] = useState('');
  const [tipo, setTipo] = useState('');
  const [valor, setValor] = useState('');
  const [odd, setOdd] = useState('');
  const [resultado, setResultado] = useState(null);
  const [esporte, setEsporte] = useState('futebol');
  const [showTipos, setShowTipos] = useState(false);
  const [saving, setSaving] = useState(false);

  const valorNum = parseFloat(valor.replace(',', '.')) || 0;
  const oddNum = parseFloat(odd.replace(',', '.')) || 0;
  const retorno = valorNum > 0 && oddNum > 1 ? valorNum * (oddNum - 1) : 0;

  async function handleSalvar() {
    if (!time1.trim() || !time2.trim()) return Alert.alert('Atenção', 'Preencha os dois times/equipes.');
    if (!tipo.trim()) return Alert.alert('Atenção', 'Informe o tipo de aposta.');
    if (!valorNum || valorNum <= 0) return Alert.alert('Atenção', 'Informe o valor apostado.');
    if (!oddNum || oddNum <= 1) return Alert.alert('Atenção', 'Informe uma odd válida (maior que 1).');
    if (!resultado) return Alert.alert('Atenção', 'Selecione o resultado da aposta.');
    if (valorNum > banca.saldoAtual) return Alert.alert('Atenção', 'Valor supera seu saldo atual.');

    setSaving(true);
    await registrarAposta({ time1: time1.trim(), time2: time2.trim(), tipo: tipo.trim(), valor: valorNum, odd: oddNum, resultado, esporte });
    setSaving(false);

    // Limpa o formulário
    setTime1(''); setTime2(''); setTipo(''); setValor(''); setOdd(''); setResultado(null); setEsporte('futebol');
    Alert.alert('✅ Registrado!', resultado === 'win' ? `Lucro: +${formatBRL(retorno)}` : `Perda registrada: -${formatBRL(valorNum)}`);
  }

  function Label({ text }) {
    return <Text style={[s.label, { color: colors.textSecondary }]}>{text}</Text>;
  }

  function Input({ value, onChangeText, placeholder, keyboard }) {
    return (
      <TextInput
        style={[s.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        keyboardType={keyboard || 'default'}
        autoCapitalize="words"
      />
    );
  }

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={s.header}>
            <Text style={[s.title, { color: colors.text }]}>Nova Aposta</Text>
            <View style={[s.bancaBadge, { backgroundColor: colors.primary + '22' }]}>
              <Text style={[s.bancaText, { color: colors.primary }]}>Saldo: {formatBRL(banca.saldoAtual)}</Text>
            </View>
          </View>

          {/* Esporte */}
          <Label text="Esporte" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.esportesRow}>
            {ESPORTES.map(e => (
              <TouchableOpacity
                key={e.id}
                style={[s.esporteChip, { borderColor: esporte === e.id ? colors.primary : colors.border }, esporte === e.id && { backgroundColor: colors.primary }]}
                onPress={() => setEsporte(e.id)}
              >
                <Text style={[s.esporteText, { color: esporte === e.id ? '#fff' : colors.textSecondary }]}>{e.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Times */}
          <Label text="Time / Equipe A (Mandante)" />
          <Input value={time1} onChangeText={setTime1} placeholder="Ex: Flamengo" />

          <Label text="Time / Equipe B (Visitante)" />
          <Input value={time2} onChangeText={setTime2} placeholder="Ex: Palmeiras" />

          {/* Tipo de aposta */}
          <Label text="Tipo de Aposta" />
          <TouchableOpacity
            style={[s.tipoBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
            onPress={() => setShowTipos(!showTipos)}
          >
            <Text style={[s.tipoBtnText, { color: tipo ? colors.text : colors.textSecondary }]}>
              {tipo || 'Selecionar ou digitar tipo...'}
            </Text>
            <Ionicons name={showTipos ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textSecondary} />
          </TouchableOpacity>

          {showTipos && (
            <View style={[s.tiposDropdown, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {TIPOS_RAPIDOS.map(t => (
                <TouchableOpacity
                  key={t}
                  style={[s.tipoItem, { borderBottomColor: colors.border }]}
                  onPress={() => { setTipo(t); setShowTipos(false); }}
                >
                  <Text style={[s.tipoItemText, { color: colors.text }]}>{t}</Text>
                  {tipo === t && <Ionicons name="checkmark" size={16} color={colors.primary} />}
                </TouchableOpacity>
              ))}
            </View>
          )}

          <TextInput
            style={[s.input, { backgroundColor: colors.background, color: colors.text, borderColor: tipo ? colors.primary + '66' : colors.border, marginTop: 8 }]}
            value={tipo}
            onChangeText={setTipo}
            placeholder="Ou digite livremente: Ex: Handicap -1"
            placeholderTextColor={colors.textSecondary}
          />

          {/* Valor e Odd */}
          <View style={s.row2}>
            <View style={{ flex: 1 }}>
              <Label text="Valor Apostado (R$)" />
              <TextInput
                style={[s.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                value={valor}
                onChangeText={setValor}
                placeholder="Ex: 50,00"
                placeholderTextColor={colors.textSecondary}
                keyboardType="decimal-pad"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Label text="Odd" />
              <TextInput
                style={[s.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                value={odd}
                onChangeText={setOdd}
                placeholder="Ex: 1,85"
                placeholderTextColor={colors.textSecondary}
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          {/* Retorno potencial */}
          {retorno > 0 && (
            <View style={[s.retornoBox, { backgroundColor: colors.success + '15', borderColor: colors.success + '44' }]}>
              <Ionicons name="trending-up-outline" size={16} color={colors.success} />
              <Text style={[s.retornoText, { color: colors.success }]}>
                Retorno potencial: +{formatBRL(retorno)}
              </Text>
            </View>
          )}

          {/* Resultado */}
          <Label text="Resultado" />
          <View style={s.resultadoRow}>
            {[
              { v: 'win', label: '✅ Vencedora', color: colors.success },
              { v: 'loss', label: '❌ Perdedora', color: colors.danger },
              { v: 'pending', label: '⏳ Pendente', color: colors.warning },
            ].map(r => (
              <TouchableOpacity
                key={r.v}
                style={[
                  s.resultadoBtn,
                  { borderColor: resultado === r.v ? r.color : colors.border },
                  resultado === r.v && { backgroundColor: r.color + '20' },
                ]}
                onPress={() => setResultado(r.v)}
              >
                <Text style={[s.resultadoBtnText, { color: resultado === r.v ? r.color : colors.textSecondary }]}>
                  {r.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Botão salvar */}
          <TouchableOpacity
            style={[s.saveBtn, { backgroundColor: saving ? colors.primary + '88' : colors.primary }]}
            onPress={handleSalvar}
            disabled={saving}
          >
            <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
            <Text style={s.saveBtnText}>{saving ? 'Salvando...' : 'Registrar Aposta'}</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, paddingBottom: 12 },
  title: { fontSize: 22, fontWeight: '800' },
  bancaBadge: { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
  bancaText: { fontSize: 13, fontWeight: '700' },
  label: { fontSize: 12, fontWeight: '600', marginBottom: 6, marginTop: 14 },
  input: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15 },
  esportesRow: { marginBottom: 4 },
  esporteChip: { borderRadius: 20, borderWidth: 1.5, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8 },
  esporteText: { fontSize: 13, fontWeight: '600' },
  tipoBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 13 },
  tipoBtnText: { fontSize: 15, flex: 1 },
  tiposDropdown: { borderRadius: 12, borderWidth: 1, marginTop: 4, overflow: 'hidden' },
  tipoItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  tipoItemText: { fontSize: 14 },
  row2: { flexDirection: 'row', gap: 12 },
  retornoBox: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 10, borderWidth: 1, padding: 12, marginTop: 12 },
  retornoText: { fontSize: 14, fontWeight: '700' },
  resultadoRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  resultadoBtn: { flex: 1, borderRadius: 10, borderWidth: 1.5, paddingVertical: 12, alignItems: 'center' },
  resultadoBtnText: { fontSize: 12, fontWeight: '700', textAlign: 'center' },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14, padding: 16, marginTop: 24 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
