import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { initDatabase, getBanca, getApostas, addAposta as dbAdd, updateAposta as dbUpdate, deleteAposta as dbDelete, updateBanca, clearAllData as dbClear, resetBanca as dbReset } from '../services/database';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [loading, setLoading] = useState(true);
  const [banca, setBanca] = useState({ saldoInicial: 1000, saldoAtual: 1000 });
  const [apostas, setApostas] = useState([]);

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
  }, []);

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
