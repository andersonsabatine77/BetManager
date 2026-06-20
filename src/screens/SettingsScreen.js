import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Switch,
  TextInput, Alert, Platform, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useApp } from '../context/AppContext';
import { clearAllData } from '../services/database';
import { formatBRL } from '../utils/calculations';
import { getApiKey, saveApiKey } from '../services/liveService';

const RISK_LEVELS = ['conservador', 'moderado', 'agressivo'];
const CASAS_LIST = ['Bet365', 'Betfair', 'Pinnacle', '1xBet', 'Betano'];

function Section({ title, children, colors }) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{title.toUpperCase()}</Text>
      <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {children}
      </View>
    </View>
  );
}

function RowItem({ icon, iconColor, label, right, onPress, last, colors, danger }) {
  return (
    <TouchableOpacity
      style={[styles.row, !last && { borderBottomWidth: 0.5, borderBottomColor: colors.border }]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={[styles.rowIcon, { backgroundColor: (iconColor || colors.primary) + '22' }]}>
        <Ionicons name={icon} size={16} color={danger ? colors.danger : (iconColor || colors.primary)} />
      </View>
      <Text style={[styles.rowLabel, { color: danger ? colors.danger : colors.text }]}>{label}</Text>
      <View style={styles.rowRight}>{right}</View>
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const { colors, isDark, toggleTheme } = useTheme();
  const theme = { colors, isDark };
  const { banca, updateBanca, refresh } = useApp();

  const [saldo, setSaldo] = useState(String(banca.saldoInicial));
  const [metaDiaria, setMetaDiaria] = useState(String(banca.percentualDiario));
  const [nivelRisco, setNivelRisco] = useState(banca.nivelRisco);
  const [stopLossD, setStopLossD] = useState(String(banca.stopLossD));
  const [stopLossW, setStopLossW] = useState(String(banca.stopLossW));
  const [notifGeral, setNotifGeral] = useState(true);
  const [notifArb, setNotifArb] = useState(true);
  const [notifStopLoss, setNotifStopLoss] = useState(true);
  const [notifKelly, setNotifKelly] = useState(false);
  const [casasEnabled, setCasasEnabled] = useState(
    CASAS_LIST.reduce((acc, c) => ({ ...acc, [c]: true }), {})
  );
  const [saved, setSaved] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [apiKeySaved, setApiKeySaved] = useState(false);

  useEffect(() => {
    getApiKey().then(k => { if (k) setApiKey(k); });
  }, []);

  useEffect(() => {
    setSaldo(String(banca.saldoInicial));
    setMetaDiaria(String(banca.percentualDiario));
    setNivelRisco(banca.nivelRisco);
    setStopLossD(String(banca.stopLossD));
    setStopLossW(String(banca.stopLossW));
  }, [banca]);

  async function handleSave() {
    const saldoNum = parseFloat(saldo.replace(',', '.'));
    const metaNum = parseFloat(metaDiaria.replace(',', '.'));
    const slDNum = parseFloat(stopLossD.replace(',', '.'));
    const slWNum = parseFloat(stopLossW.replace(',', '.'));

    if (isNaN(saldoNum) || saldoNum <= 0) return Alert.alert('Erro', 'Saldo inválido.');
    if (isNaN(metaNum) || metaNum <= 0 || metaNum > 100) return Alert.alert('Erro', 'Meta diária deve ser entre 1% e 100%.');

    await updateBanca({
      saldoInicial: saldoNum,
      saldo: saldoNum,
      percentualDiario: metaNum,
      nivelRisco,
      stopLossD: isNaN(slDNum) ? 5 : slDNum,
      stopLossW: isNaN(slWNum) ? 15 : slWNum,
    });

    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleClearData() {
    Alert.alert(
      'Apagar todos os dados',
      'Isso vai apagar todo o histórico de apostas e resetar a banca. Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Apagar',
          style: 'destructive',
          onPress: async () => {
            await clearAllData();
            await refresh();
            Alert.alert('Pronto', 'Dados apagados com sucesso.');
          },
        },
      ]
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Configurações</Text>
        </View>

        {/* API de Futebol */}
        <Section title="API de Futebol (Dados Ao Vivo)" colors={colors}>
          <View style={[styles.inputRow, { borderBottomColor: 'transparent' }]}>
            <View style={[styles.rowIcon, { backgroundColor: colors.primary + '22' }]}>
              <Ionicons name="key" size={16} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowLabel, { color: colors.text }]}>football-data.org API Key</Text>
              <Text style={[styles.apiHint, { color: colors.textSecondary }]}>
                Grátis em football-data.org — cobre Premier League, Bundesliga, Brasileirão e mais
              </Text>
              <TextInput
                style={[styles.apiInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                value={apiKey}
                onChangeText={setApiKey}
                placeholder="Cole sua chave aqui"
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={[styles.apiSaveBtn, { backgroundColor: apiKeySaved ? colors.success : colors.primary }]}
                onPress={async () => {
                  if (!apiKey.trim()) return Alert.alert('Erro', 'Chave não pode estar vazia.');
                  await saveApiKey(apiKey);
                  setApiKeySaved(true);
                  setTimeout(() => setApiKeySaved(false), 2000);
                }}
              >
                <Ionicons name={apiKeySaved ? 'checkmark' : 'save'} size={14} color="#fff" />
                <Text style={styles.apiSaveBtnText}>{apiKeySaved ? 'Salvo!' : 'Salvar Chave'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Section>

        {/* Banca */}
        <Section title="Banca" colors={colors}>
          <View style={[styles.inputRow, { borderBottomColor: colors.border }]}>
            <View style={[styles.rowIcon, { backgroundColor: colors.success + '22' }]}>
              <Ionicons name="wallet" size={16} color={colors.success} />
            </View>
            <Text style={[styles.rowLabel, { color: colors.text }]}>Banca Inicial</Text>
            <TextInput
              style={[styles.input, { color: colors.primary }]}
              value={saldo}
              onChangeText={setSaldo}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={[styles.inputRow, { borderBottomColor: colors.border }]}>
            <View style={[styles.rowIcon, { backgroundColor: colors.warning + '22' }]}>
              <Ionicons name="trending-up" size={16} color={colors.warning} />
            </View>
            <Text style={[styles.rowLabel, { color: colors.text }]}>Meta Diária (%)</Text>
            <TextInput
              style={[styles.input, { color: colors.primary }]}
              value={metaDiaria}
              onChangeText={setMetaDiaria}
              keyboardType="decimal-pad"
              placeholder="2.5"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={[styles.inputRow, { borderBottomColor: colors.border }]}>
            <View style={[styles.rowIcon, { backgroundColor: colors.danger + '22' }]}>
              <Ionicons name="alert-circle" size={16} color={colors.danger} />
            </View>
            <Text style={[styles.rowLabel, { color: colors.text }]}>Stop Loss Diário (%)</Text>
            <TextInput
              style={[styles.input, { color: colors.primary }]}
              value={stopLossD}
              onChangeText={setStopLossD}
              keyboardType="decimal-pad"
              placeholder="5"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={[styles.inputRow, { borderBottomColor: 'transparent' }]}>
            <View style={[styles.rowIcon, { backgroundColor: colors.danger + '22' }]}>
              <Ionicons name="shield" size={16} color={colors.danger} />
            </View>
            <Text style={[styles.rowLabel, { color: colors.text }]}>Stop Loss Semanal (%)</Text>
            <TextInput
              style={[styles.input, { color: colors.primary }]}
              value={stopLossW}
              onChangeText={setStopLossW}
              keyboardType="decimal-pad"
              placeholder="15"
              placeholderTextColor={colors.textSecondary}
            />
          </View>
        </Section>

        {/* Risk level */}
        <Section title="Nível de Risco" colors={colors}>
          <View style={styles.riskRow}>
            {RISK_LEVELS.map(r => (
              <TouchableOpacity
                key={r}
                style={[
                  styles.riskBtn,
                  { borderColor: colors.border },
                  nivelRisco === r && {
                    backgroundColor: r === 'conservador' ? colors.success :
                                     r === 'moderado' ? colors.warning : colors.danger,
                    borderColor: 'transparent',
                  },
                ]}
                onPress={() => setNivelRisco(r)}
              >
                <Text style={[
                  styles.riskText,
                  { color: nivelRisco === r ? '#fff' : colors.textSecondary },
                ]}>
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </Text>
                <Text style={{ fontSize: 16 }}>
                  {r === 'conservador' ? '🛡️' : r === 'moderado' ? '⚖️' : '🔥'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={[styles.riskDesc, { color: colors.textSecondary }]}>
            {nivelRisco === 'conservador' && 'Kelly × 0.25 — Gestão conservadora, 25% da fração Kelly.'}
            {nivelRisco === 'moderado' && 'Kelly × 0.50 — Equilíbrio entre retorno e risco.'}
            {nivelRisco === 'agressivo' && 'Kelly × 1.00 — Fração Kelly completa. Alto risco/retorno.'}
          </Text>
        </Section>

        {/* Aparência */}
        <Section title="Aparência" colors={colors}>
          <RowItem
            icon={isDark ? 'moon' : 'sunny'}
            iconColor={isDark ? colors.primary : colors.warning}
            label={isDark ? 'Modo Escuro' : 'Modo Claro'}
            colors={colors}
            last
            right={
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#fff"
              />
            }
          />
        </Section>

        {/* Notifications */}
        <Section title="Notificações" colors={colors}>
          {[
            { key: 'notifGeral', label: 'Notificações gerais', icon: 'notifications', val: notifGeral, set: setNotifGeral },
            { key: 'notifArb', label: 'Oportunidades de arbitragem', icon: 'trending-up', val: notifArb, set: setNotifArb },
            { key: 'notifStopLoss', label: 'Alertas de Stop Loss', icon: 'alert-circle', val: notifStopLoss, set: setNotifStopLoss },
            { key: 'notifKelly', label: 'Sugestões Kelly diárias', icon: 'bulb', val: notifKelly, set: setNotifKelly },
          ].map((n, i, arr) => (
            <RowItem
              key={n.key}
              icon={n.icon}
              label={n.label}
              colors={colors}
              last={i === arr.length - 1}
              right={
                <Switch
                  value={n.val}
                  onValueChange={n.set}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor="#fff"
                />
              }
            />
          ))}
        </Section>

        {/* Bookmakers */}
        <Section title="Casas de Apostas" colors={colors}>
          {CASAS_LIST.map((casa, i) => (
            <RowItem
              key={casa}
              icon="globe"
              iconColor={colors.secondary}
              label={casa}
              colors={colors}
              last={i === CASAS_LIST.length - 1}
              right={
                <Switch
                  value={casasEnabled[casa]}
                  onValueChange={(val) => setCasasEnabled(prev => ({ ...prev, [casa]: val }))}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor="#fff"
                />
              }
            />
          ))}
        </Section>

        {/* Data */}
        <Section title="Dados" colors={colors}>
          <RowItem
            icon="cloud-upload"
            iconColor={colors.primary}
            label="Fazer Backup"
            colors={colors}
            onPress={() => Alert.alert('Backup', 'Funcionalidade em desenvolvimento.')}
            right={<Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />}
          />
          <RowItem
            icon="cloud-download"
            iconColor={colors.success}
            label="Restaurar Backup"
            colors={colors}
            onPress={() => Alert.alert('Restaurar', 'Funcionalidade em desenvolvimento.')}
            right={<Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />}
          />
          <RowItem
            icon="trash"
            label="Apagar Todos os Dados"
            colors={colors}
            last
            danger
            onPress={handleClearData}
            right={<Ionicons name="chevron-forward" size={16} color={colors.danger} />}
          />
        </Section>

        {/* About */}
        <Section title="Sobre" colors={colors}>
          <RowItem
            icon="information-circle"
            iconColor={colors.primary}
            label="Versão"
            colors={colors}
            right={<Text style={[styles.versionText, { color: colors.textSecondary }]}>1.0.0</Text>}
          />
          <RowItem
            icon="code-slash"
            iconColor={colors.secondary}
            label="Desenvolvido por"
            colors={colors}
            last
            right={<Text style={[styles.versionText, { color: colors.textSecondary }]}>JARVIS AI</Text>}
          />
        </Section>

        {/* Save button */}
        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: saved ? colors.success : colors.primary }]}
          onPress={handleSave}
        >
          <Ionicons name={saved ? 'checkmark' : 'save'} size={18} color="#fff" />
          <Text style={styles.saveBtnText}>{saved ? 'Salvo!' : 'Salvar Configurações'}</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: { fontSize: 22, fontWeight: '800' },
  section: { paddingHorizontal: 16, marginTop: 20 },
  sectionTitle: { fontSize: 11, fontWeight: '700', marginBottom: 8, letterSpacing: 0.5 },
  sectionCard: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 10 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 10,
    borderBottomWidth: 0.5,
  },
  rowIcon: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { flex: 1, fontSize: 14, fontWeight: '500' },
  rowRight: { alignItems: 'flex-end' },
  input: { fontSize: 15, fontWeight: '700', textAlign: 'right', minWidth: 80 },
  riskRow: { flexDirection: 'row', gap: 8, padding: 12 },
  riskBtn: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    alignItems: 'center',
    gap: 4,
  },
  riskText: { fontSize: 12, fontWeight: '700' },
  riskDesc: { fontSize: 12, paddingHorizontal: 12, paddingBottom: 12, lineHeight: 18 },
  versionText: { fontSize: 13 },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginTop: 24,
    borderRadius: 16,
    padding: 16,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  apiHint: { fontSize: 11, marginBottom: 8, lineHeight: 16 },
  apiInput: {
    borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 8,
    fontSize: 13, marginBottom: 8,
  },
  apiSaveBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: 8, paddingHorizontal: 14, paddingVertical: 7, alignSelf: 'flex-start',
  },
  apiSaveBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
});
