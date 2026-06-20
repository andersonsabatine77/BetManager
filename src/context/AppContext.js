import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { initDatabase, getBanca, getApostas, updateBanca as dbUpdateBanca, addAposta as dbAddAposta, updateAposta as dbUpdateAposta } from '../services/database';
import { getSugestoes, mockLiveGames, getArbitragem } from '../services/mockData';
import { getLiveGames } from '../services/liveService';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [loading, setLoading] = useState(true);
  const [banca, setBanca] = useState({
    saldo: 5000, saldoInicial: 5000, percentualDiario: 2.5,
    nivelRisco: 'moderado', stopLossD: 5, stopLossW: 15,
  });
  const [apostas, setApostas] = useState([]);
  const [sugestoes, setSugestoes] = useState(() => getSugestoes());
  const [liveGames, setLiveGames] = useState([]);
  const [liveHasKey, setLiveHasKey] = useState(null);
  const [liveError, setLiveError] = useState(null);
  const [arbitragem, setArbitragem] = useState(() => getArbitragem());
  const refreshTimerRef = useRef(null);

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

  const fetchLive = useCallback(async () => {
    const result = await getLiveGames();
    setLiveHasKey(result.hasKey);
    setLiveError(result.error || null);
    if (result.hasKey && result.games.length > 0) {
      setLiveGames(result.games);
    } else if (!result.hasKey) {
      setLiveGames([]);
    }
    // If hasKey but 0 games (no live matches right now), keep existing or empty
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    fetchLive();
    refreshTimerRef.current = setInterval(fetchLive, 30000);
    return () => clearInterval(refreshTimerRef.current);
  }, [fetchLive]);

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
      await updateBanca({ saldo: banca.saldo - aposta.stake });
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
        if (aposta) await updateBanca({ saldo: banca.saldo + aposta.stake * aposta.odd });
      }
    } catch (e) {
      console.warn('updateAposta error:', e);
    }
  }, [apostas, banca, updateBanca]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setSugestoes(getSugestoes());
    setArbitragem(getArbitragem());
    await loadData();
    await fetchLive();
  }, [loadData, fetchLive]);

  return (
    <AppContext.Provider value={{
      loading, banca, apostas, sugestoes, liveGames,
      liveHasKey, liveError, arbitragem,
      updateBanca, addAposta, updateAposta, refresh, fetchLive,
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
