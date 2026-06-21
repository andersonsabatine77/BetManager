import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { initDatabase, getBanca, getApostas, addAposta as dbAdd, updateAposta as dbUpdate, deleteAposta as dbDelete, updateBanca, clearAllData as dbClear, resetBanca as dbReset } from '../services/database';
import { getSugestoes } from '../services/mockData';
import { fetchSugestoes } from '../services/suggestionsApi';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [loading, setLoading] = useState(true);
  const [banca, setBanca] = useState({ saldoInicial: 1000, saldoAtual: 1000 });
  const [apostas, setApostas] = useState([]);
  const [sugestoes, setSugestoes] = useState([]);
  const [sugestoesLoading, setSugestoesLoading] = useState(false);
  const [sugestoesError, setSugestoesError] = useState(null); // null | 'NO_KEY' | 'INVALID_KEY' | ...

  const loadSugestoes = useCallback(async () => {
    setSugestoesLoading(true);
    const { data, error } = await fetchSugestoes();
    if (data && data.length > 0) {
      setSugestoes(data);
      setSugestoesError(null);
    } else if (error === 'NO_KEY') {
      // No API key — fall back to daily-seeded mock
      setSugestoes(getSugestoes());
      setSugestoesError('NO_KEY');
    } else {
      setSugestoesError(error);
      // Keep whatever was loaded before (or fall back to mock on first load)
      setSugestoes(prev => prev.length > 0 ? prev : getSugestoes());
    }
    setSugestoesLoading(false);
  }, []);

  const load = useCallback(async () => {
    try {
      await initDatabase();
      const b = await getBanca();
      if (b) setBanca(b);
      const a = await getApostas();
      setApostas(a || []);
    } catch (e) {
      console.warn('load error', e);
    } finally {
      setLoading(false);
    }
    // Load suggestions in parallel (non-blocking)
    loadSugestoes();
  }, [loadSugestoes]);

  useEffect(() => { load(); }, [load]);

  const registrarAposta = useCallback(async (aposta) => {
    const id = aposta.id || `a_${Date.now()}`;
    const lucro = aposta.resultado === 'win'
      ? +(aposta.valor * (aposta.odd - 1)).toFixed(2)
      : aposta.resultado === 'loss' ? -aposta.valor : 0;
    const novaAposta = { ...aposta, id, lucro, data: aposta.data || new Date().toISOString() };
    setApostas(prev => [novaAposta, ...prev]);
    await dbAdd(novaAposta);
    const novoSaldo = banca.saldoAtual + lucro;
    setBanca(b => ({ ...b, saldoAtual: novoSaldo }));
    await updateBanca(novoSaldo);
    return novaAposta;
  }, [banca]);

  const atualizarResultado = useCallback(async (id, resultado, odd, valor) => {
    const lucro = resultado === 'win' ? +(valor * (odd - 1)).toFixed(2) : resultado === 'loss' ? -valor : 0;
    setApostas(prev => prev.map(a => a.id === id ? { ...a, resultado, lucro } : a));
    await dbUpdate(id, resultado, lucro);
    const novoSaldo = banca.saldoAtual + lucro;
    setBanca(b => ({ ...b, saldoAtual: novoSaldo }));
    await updateBanca(novoSaldo);
  }, [banca]);

  const deletarAposta = useCallback(async (id) => {
    setApostas(prev => prev.filter(a => a.id !== id));
    await dbDelete(id);
  }, []);

  const limparTudo = useCallback(async () => {
    await dbClear();
    setApostas([]);
    setBanca({ saldoInicial: 1000, saldoAtual: 1000 });
  }, []);

  const resetarBanca = useCallback(async (novoSaldo) => {
    await dbReset(novoSaldo);
    setBanca(b => ({ ...b, saldoAtual: novoSaldo, saldoInicial: novoSaldo }));
  }, []);

  return (
    <AppContext.Provider value={{
      loading, banca, apostas,
      sugestoes, sugestoesLoading, sugestoesError,
      reloadSugestoes: loadSugestoes,
      registrarAposta, atualizarResultado, deletarAposta,
      limparTudo, resetarBanca, reload: load,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp fora do AppProvider');
  return ctx;
}
