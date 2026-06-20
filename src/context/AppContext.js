import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { initDatabase, getBanca, getApostas, updateBanca as dbUpdateBanca, addAposta as dbAddAposta, updateAposta as dbUpdateAposta } from '../services/database';
import { mockSugestoes, mockLiveGames, mockArbitragem } from '../services/mockData';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [loading, setLoading] = useState(true);
  const [banca, setBanca] = useState({
    saldo: 5000,
    saldoInicial: 5000,
    percentualDiario: 2.5,
    nivelRisco: 'moderado',
    stopLossD: 5,
    stopLossW: 15,
  });
  const [apostas, setApostas] = useState([]);
  const [sugestoes] = useState(mockSugestoes);
  const [liveGames, setLiveGames] = useState(mockLiveGames);
  const [arbitragem] = useState(mockArbitragem);

  const loadData = useCallback(async () => {
    try {
      await initDatabase();
      const bancaData = await getBanca();
      if (bancaData) setBanca(bancaData);
      const apostasData = await getApostas();
      setApostas(apostasData || []);
    } catch (e) {
      console.warn('DB load error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Simulate live odds movement
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveGames(prev => prev.map(g => ({
        ...g,
        oddCasa: Math.max(1.01, +(g.oddCasa + (Math.random() - 0.5) * 0.06).toFixed(2)),
        oddFora: Math.max(1.01, +(g.oddFora + (Math.random() - 0.5) * 0.06).toFixed(2)),
        minuto: g.minuto !== null ? Math.min(g.minuto + 1, 90) : null,
      })));
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const updateBanca = useCallback(async (data) => {
    const updated = { ...banca, ...data };
    setBanca(updated);
    try {
      await dbUpdateBanca(updated);
    } catch (e) {
      console.warn('updateBanca error:', e);
    }
  }, [banca]);

  const addAposta = useCallback(async (aposta) => {
    const newAposta = {
      ...aposta,
      id: aposta.id || `a_${Date.now()}`,
      data: aposta.data || new Date().toISOString().split('T')[0],
      resultado: 'pending',
      lucro: 0,
    };
    setApostas(prev => [newAposta, ...prev]);
    try {
      await dbAddAposta(newAposta);
      // Update saldo
      const newSaldo = banca.saldo - aposta.stake;
      await updateBanca({ saldo: newSaldo });
    } catch (e) {
      console.warn('addAposta error:', e);
    }
  }, [banca, updateBanca]);

  const updateAposta = useCallback(async (id, data) => {
    setApostas(prev => prev.map(a => a.id === id ? { ...a, ...data } : a));
    try {
      await dbUpdateAposta(id, data);
      if (data.resultado === 'win') {
        const aposta = apostas.find(a => a.id === id);
        if (aposta) {
          const lucro = aposta.stake * aposta.odd;
          await updateBanca({ saldo: banca.saldo + lucro });
        }
      }
    } catch (e) {
      console.warn('updateAposta error:', e);
    }
  }, [apostas, banca, updateBanca]);

  const refresh = useCallback(async () => {
    setLoading(true);
    await loadData();
  }, [loadData]);

  return (
    <AppContext.Provider value={{
      loading,
      banca,
      apostas,
      sugestoes,
      liveGames,
      arbitragem,
      updateBanca,
      addAposta,
      updateAposta,
      refresh,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
