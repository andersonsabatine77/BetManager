import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Switch, TextInput, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useApp } from '../context/AppContext';
import { formatBRL } from '../utils/formatters';

export default function SettingsScreen() {
  const { colors, isDark, toggle } = useTheme();
  const { banca, limparTudo, resetarBanca, reload } = useApp();
  const [bancaModal, setBancaModal] = useState(false);
  const [novaBanca, setNovaBanca] = useState('');

  function handleResetBanca() {
    const val = parseFloat(novaBanca.replace(',', '.'));
    if (!val || val <= 0) {
      Alert.alert('Valor inválido', 'Informe um valor positivo para a banca.');
      return;
    }
    Alert.alert('Redefinir Banca', `Definir banca para ${formatBRL(val)}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Confirmar', onPress: async () => {
          await resetarBanca(val);
          setBancaModal(false);
          setNovaBanca('');
        }
      },
    ]);
  }

  function handleClearAll() {
    Alert.alert(
      'Limpar Tudo',
      'Isso removerá TODO o histórico de apostas. A ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Limpar', style: 'destructive', onPress: () => limparTudo() },
      ]
    );
  }

  function SettingRow({ icon, title, subtitle, right, onPress, danger }) {
    return (
      <TouchableOpacity
        style={[sr.row, { borderBottomColor: colors.border }]}
        onPress={onPress}
        disabled={!onPress}
        activeOpacity={onPress ? 0.7 : 1}
      >
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

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={s.header}>
          <Text style={[s.title, { color: colors.text }]}>Configurações</Text>
        </View>

        {/* Banca info */}
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

        {/* Banca */}
        <View style={[s.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[s.sectionTitle, { color: colors.textSecondary }]}>BANCA</Text>
          <SettingRow
            icon="wallet-outline"
            title="Redefinir Banca"
            subtitle="Alterar valor da banca inicial"
            onPress={() => setBancaModal(true)}
          />
        </View>

        {/* Dados */}
        <View style={[s.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[s.sectionTitle, { color: colors.textSecondary }]}>DADOS</Text>
          <SettingRow
            icon="refresh-outline"
            title="Sincronizar"
            subtitle="Recarregar dados do banco"
            onPress={reload}
          />
          <SettingRow
            icon="trash-outline"
            title="Limpar Histórico"
            subtitle="Remove todas as apostas registradas"
            onPress={handleClearAll}
            danger
          />
        </View>

        {/* Sobre */}
        <View style={[s.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[s.sectionTitle, { color: colors.textSecondary }]}>SOBRE</Text>
          <SettingRow icon="information-circle-outline" title="BetManager Pro" subtitle="v2.0.0 · Gestão inteligente de apostas" />
          <SettingRow icon="shield-checkmark-outline" title="Dados locais" subtitle="Todas as informações ficam no seu dispositivo" />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modal redefinir banca */}
      <Modal visible={bancaModal} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={[s.modalBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[s.modalTitle, { color: colors.text }]}>Redefinir Banca</Text>
            <Text style={[s.modalSub, { color: colors.textSecondary }]}>
              Banca atual: {formatBRL(banca.saldoInicial)}
            </Text>
            <TextInput
              style={[s.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
              placeholder="Novo valor (ex: 1000)"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
              value={novaBanca}
              onChangeText={setNovaBanca}
            />
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
    </SafeAreaView>
  );
}

const sr = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1 },
  iconBox: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 14, fontWeight: '600' },
  subtitle: { fontSize: 12, marginTop: 2 },
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
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox: { borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: '800', marginBottom: 4 },
  modalSub: { fontSize: 13, marginBottom: 16 },
  input: { borderRadius: 12, borderWidth: 1, padding: 14, fontSize: 16, marginBottom: 16 },
  modalBtns: { flexDirection: 'row', gap: 12 },
  modalBtn: { flex: 1, borderRadius: 12, borderWidth: 1, padding: 14, alignItems: 'center' },
});
