import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Switch, TextInput, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';
import { useApp } from '../context/AppContext';
import { formatBRL } from '../utils/formatters';
import { API_KEY_STORAGE } from '../services/suggestionsApi';
import { ANTHROPIC_KEY_STORAGE } from '../services/aiAnalysis';

export default function SettingsScreen() {
  const { colors, isDark, toggle } = useTheme();
  const { banca, limparTudo, resetarBanca, reload } = useApp();

  const [bancaModal, setBancaModal] = useState(false);
  const [novaBanca, setNovaBanca] = useState('');

  const [footballKey, setFootballKey] = useState('');
  const [footballModal, setFootballModal] = useState(false);
  const [footballInput, setFootballInput] = useState('');

  const [anthropicKey, setAnthropicKey] = useState('');
  const [anthropicModal, setAnthropicModal] = useState(false);
  const [anthropicInput, setAnthropicInput] = useState('');

  useEffect(() => {
    AsyncStorage.getItem(API_KEY_STORAGE).then(k => { if (k) setFootballKey(k); });
    AsyncStorage.getItem(ANTHROPIC_KEY_STORAGE).then(k => { if (k) setAnthropicKey(k); });
  }, []);

  async function saveFootballKey() {
    const k = footballInput.trim();
    if (!k) return;
    await AsyncStorage.setItem(API_KEY_STORAGE, k);
    setFootballKey(k);
    setFootballModal(false);
    setFootballInput('');
    reload();
  }

  async function removeFootballKey() {
    await AsyncStorage.removeItem(API_KEY_STORAGE);
    setFootballKey('');
  }

  async function saveAnthropicKey() {
    const k = anthropicInput.trim();
    if (!k) return;
    await AsyncStorage.setItem(ANTHROPIC_KEY_STORAGE, k);
    setAnthropicKey(k);
    setAnthropicModal(false);
    setAnthropicInput('');
  }

  async function removeAnthropicKey() {
    await AsyncStorage.removeItem(ANTHROPIC_KEY_STORAGE);
    setAnthropicKey('');
  }

  function handleResetBanca() {
    const val = parseFloat(novaBanca.replace(',', '.'));
    if (!val || val <= 0) { Alert.alert('Valor inválido', 'Informe um valor positivo.'); return; }
    Alert.alert('Redefinir Banca', `Definir banca para ${formatBRL(val)}?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Confirmar', onPress: async () => { await resetarBanca(val); setBancaModal(false); setNovaBanca(''); } },
    ]);
  }

  function handleClearAll() {
    Alert.alert('Limpar Tudo', 'Remove TODO o histórico. Ação irreversível.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Limpar', style: 'destructive', onPress: () => limparTudo() },
    ]);
  }

  function SettingRow({ icon, title, subtitle, right, onPress, danger }) {
    return (
      <TouchableOpacity style={[sr.row, { borderBottomColor: colors.border }]} onPress={onPress} disabled={!onPress} activeOpacity={onPress ? 0.7 : 1}>
        <View style={[sr.iconBox, { backgroundColor: (danger ? colors.danger : colors.primary) + '22' }]}>
          <Ionicons name={icon} size={20} color={danger ? colors.danger : colors.primary} />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[sr.title, { color: danger ? colors.danger : colors.text }]}>{title}</Text>
          {subtitle ? <Text style={[sr.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text> : null}
        </View>
        {right}
        {onPress && !right ? <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} /> : null}
      </TouchableOpacity>
    );
  }

  function KeyRow({ icon, title, keyValue, onConfigure, onRemove }) {
    return (
      <View style={[sr.row, { borderBottomColor: colors.border }]}>
        <View style={[sr.iconBox, { backgroundColor: (keyValue ? colors.success : colors.primary) + '22' }]}>
          <Ionicons name={icon} size={20} color={keyValue ? colors.success : colors.primary} />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[sr.title, { color: colors.text }]}>{title}</Text>
          <Text style={[sr.subtitle, { color: keyValue ? colors.success : colors.textSecondary }]}>
            {keyValue ? `${keyValue.slice(0, 8)}...${keyValue.slice(-4)} ✓` : 'Não configurada'}
          </Text>
        </View>
        {keyValue ? (
          <TouchableOpacity onPress={onRemove} style={[s.keyAction, { borderColor: colors.danger + '44' }]}>
            <Text style={{ color: colors.danger, fontSize: 12, fontWeight: '700' }}>Remover</Text>
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity onPress={onConfigure} style={[s.keyAction, { borderColor: colors.primary + '44', marginLeft: 6 }]}>
          <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '700' }}>{keyValue ? 'Editar' : 'Config'}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={s.header}>
          <Text style={[s.title, { color: colors.text }]}>Configurações</Text>
        </View>

        <View style={[s.bancaCard, { backgroundColor: colors.primary }]}>
          <Text style={s.bancaLabel}>Saldo Atual</Text>
          <Text style={s.bancaValue}>{formatBRL(banca.saldoAtual)}</Text>
          <Text style={s.bancaInitial}>Banca inicial: {formatBRL(banca.saldoInicial)}</Text>
        </View>

        {/* Aparência */}
        <View style={[s.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[s.sectionTitle, { color: colors.textSecondary }]}>APARÊNCIA</Text>
          <SettingRow
            icon={isDark ? 'moon' : 'sunny'}
            title="Tema Escuro"
            subtitle={isDark ? 'Ativado' : 'Desativado'}
            right={<Switch value={isDark} onValueChange={toggle} trackColor={{ false: colors.border, true: colors.primary }} thumbColor="#fff" />}
          />
        </View>

        {/* APIs */}
        <View style={[s.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[s.sectionTitle, { color: colors.textSecondary }]}>INTEGRAÇÃO</Text>
          <KeyRow
            icon="football-outline"
            title="Football-Data.org"
            keyValue={footballKey}
            onConfigure={() => { setFootballInput(footballKey); setFootballModal(true); }}
            onRemove={() => Alert.alert('Remover chave?', 'Jogos reais não serão carregados.', [
              { text: 'Cancelar', style: 'cancel' },
              { text: 'Remover', style: 'destructive', onPress: removeFootballKey },
            ])}
          />
          <View style={[s.apiInfo, { borderTopColor: colors.border }]}>
            <Text style={[s.apiInfoText, { color: colors.textSecondary }]}>
              Jogos ao vivo e sugestões reais. Chave gratuita em football-data.org
            </Text>
          </View>

          <KeyRow
            icon="sparkles-outline"
            title="Claude AI (Anthropic)"
            keyValue={anthropicKey}
            onConfigure={() => { setAnthropicInput(anthropicKey); setAnthropicModal(true); }}
            onRemove={() => Alert.alert('Remover chave?', 'Análise IA por jogo será desativada.', [
              { text: 'Cancelar', style: 'cancel' },
              { text: 'Remover', style: 'destructive', onPress: removeAnthropicKey },
            ])}
          />
          <View style={[s.apiInfo, { borderTopColor: colors.border }]}>
            <Text style={[s.apiInfoText, { color: colors.textSecondary }]}>
              Análise IA por jogo: gols, escanteios, cartões, resultado. Chave em console.anthropic.com
            </Text>
          </View>
        </View>

        {/* Banca */}
        <View style={[s.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[s.sectionTitle, { color: colors.textSecondary }]}>BANCA</Text>
          <SettingRow icon="wallet-outline" title="Redefinir Banca" subtitle="Alterar valor da banca inicial" onPress={() => setBancaModal(true)} />
        </View>

        {/* Dados */}
        <View style={[s.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[s.sectionTitle, { color: colors.textSecondary }]}>DADOS</Text>
          <SettingRow icon="refresh-outline" title="Sincronizar" subtitle="Recarregar dados do banco local" onPress={reload} />
          <SettingRow icon="trash-outline" title="Limpar Histórico" subtitle="Remove todas as apostas registradas" onPress={handleClearAll} danger />
        </View>

        {/* Sobre */}
        <View style={[s.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[s.sectionTitle, { color: colors.textSecondary }]}>SOBRE</Text>
          <SettingRow icon="information-circle-outline" title="BetManager Pro" subtitle="v2.1.0 · Gestão inteligente de apostas" />
          <SettingRow icon="shield-checkmark-outline" title="Dados locais" subtitle="Todas as informações ficam no seu dispositivo" />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modal Redefinir Banca */}
      <Modal visible={bancaModal} transparent animationType="slide">
        <View style={s.overlay}>
          <View style={[s.modal, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[s.modalTitle, { color: colors.text }]}>Redefinir Banca</Text>
            <Text style={[s.modalSub, { color: colors.textSecondary }]}>Atual: {formatBRL(banca.saldoInicial)}</Text>
            <TextInput style={[s.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]} placeholder="Novo valor (ex: 1000)" placeholderTextColor={colors.textSecondary} keyboardType="numeric" value={novaBanca} onChangeText={setNovaBanca} />
            <View style={s.modalBtns}>
              <TouchableOpacity style={[s.modalBtn, { borderColor: colors.border }]} onPress={() => { setBancaModal(false); setNovaBanca(''); }}>
                <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.modalBtn, { backgroundColor: colors.primary, borderColor: colors.primary }]} onPress={handleResetBanca}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Football Key */}
      <Modal visible={footballModal} transparent animationType="slide">
        <View style={s.overlay}>
          <View style={[s.modal, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[s.modalTitle, { color: colors.text }]}>Chave Football-Data.org</Text>
            <Text style={[s.modalSub, { color: colors.textSecondary }]}>Gratuita em football-data.org{'\n'}Cobre: PL, La Liga, Champions, Serie A, Bundesliga, Ligue 1</Text>
            <TextInput style={[s.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]} placeholder="Cole sua API key aqui" placeholderTextColor={colors.textSecondary} value={footballInput} onChangeText={setFootballInput} autoCapitalize="none" autoCorrect={false} />
            <View style={s.modalBtns}>
              <TouchableOpacity style={[s.modalBtn, { borderColor: colors.border }]} onPress={() => setFootballModal(false)}>
                <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.modalBtn, { backgroundColor: colors.primary, borderColor: colors.primary }]} onPress={saveFootballKey}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Anthropic Key */}
      <Modal visible={anthropicModal} transparent animationType="slide">
        <View style={s.overlay}>
          <View style={[s.modal, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[s.modalTitle, { color: colors.text }]}>Chave Claude AI</Text>
            <Text style={[s.modalSub, { color: colors.textSecondary }]}>
              Obtenha em console.anthropic.com → API Keys{'\n'}
              Usado para análise de gols, escanteios, cartões e resultado por jogo.{'\n'}
              Custo: ~$0.001 por análise (muito barato)
            </Text>
            <TextInput style={[s.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]} placeholder="sk-ant-..." placeholderTextColor={colors.textSecondary} value={anthropicInput} onChangeText={setAnthropicInput} autoCapitalize="none" autoCorrect={false} />
            <View style={s.modalBtns}>
              <TouchableOpacity style={[s.modalBtn, { borderColor: colors.border }]} onPress={() => setAnthropicModal(false)}>
                <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.modalBtn, { backgroundColor: colors.primary, borderColor: colors.primary }]} onPress={saveAnthropicKey}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const sr = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1 },
  iconBox: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 14, fontWeight: '600' },
  subtitle: { fontSize: 11, marginTop: 2 },
});

const s = StyleSheet.create({
  safe: { flex: 1 },
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: 22, fontWeight: '800' },
  bancaCard: { marginHorizontal: 16, borderRadius: 16, padding: 18, marginBottom: 20 },
  bancaLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 12 },
  bancaValue: { color: '#fff', fontSize: 30, fontWeight: '800', marginVertical: 4 },
  bancaInitial: { color: 'rgba(255,255,255,0.6)', fontSize: 12 },
  section: { marginHorizontal: 16, borderRadius: 16, borderWidth: 1, marginBottom: 16, overflow: 'hidden' },
  sectionTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  apiInfo: { paddingHorizontal: 16, paddingVertical: 10, borderTopWidth: 1 },
  apiInfoText: { fontSize: 11, lineHeight: 16 },
  keyAction: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modal: { borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: '800', marginBottom: 4 },
  modalSub: { fontSize: 12, marginBottom: 14, lineHeight: 18 },
  input: { borderRadius: 12, borderWidth: 1, padding: 14, fontSize: 14, marginBottom: 16 },
  modalBtns: { flexDirection: 'row', gap: 12 },
  modalBtn: { flex: 1, borderRadius: 12, borderWidth: 1, padding: 14, alignItems: 'center' },
});
