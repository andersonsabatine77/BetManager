import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE = 'https://api.football-data.org/v4';
export const API_KEY_STORAGE = '@betmanager_football_api_key';

// BRT = UTC-3, sem horário de verão desde 2019
// Usa métodos UTC para evitar interferência do fuso local do dispositivo
function getHourBRT(utcDateStr) {
  const d = new Date(utcDateStr);
  return ((d.getUTCHours() - 3) + 24) % 24;
}

function getDaysAheadBRT(utcDateStr) {
  const d = new Date(utcDateStr);

  // Data do jogo em BRT (desloca -3h e pega a data UTC resultante)
  const matchBRT = new Date(d.getTime() - 3 * 3600 * 1000);
  const matchDay = Date.UTC(matchBRT.getUTCFullYear(), matchBRT.getUTCMonth(), matchBRT.getUTCDate());

  // Hoje em BRT
  const now = new Date();
  const nowBRT = new Date(now.getTime() - 3 * 3600 * 1000);
  const todayDay = Date.UTC(nowBRT.getUTCFullYear(), nowBRT.getUTCMonth(), nowBRT.getUTCDate());

  return Math.round((matchDay - todayDay) / (1000 * 60 * 60 * 24));
}

const TIPOS_POR_LIGA = {
  PL:  ['Mais de 2.5 Gols', 'Ambos Marcam - Sim', 'Mais de 3.5 Gols', 'Vitória Mandante'],
  PD:  ['Vitória Mandante', 'Menos de 2.5 Gols', 'Dupla Chance 1X', 'Ambos Marcam - Não'],
  BL1: ['Mais de 2.5 Gols', 'Mais de 3.5 Gols', 'Vitória Mandante', 'Ambos Marcam - Sim'],
  SA:  ['Menos de 2.5 Gols', 'Vitória Mandante', 'Dupla Chance 1X', 'Menos de 3.5 Cartões'],
  FL1: ['Mais de 2.5 Gols', 'Ambos Marcam - Sim', 'Vitória Mandante', 'Dupla Chance 1X'],
  CL:  ['Mais de 2.5 Gols', 'Dupla Chance 1X', 'Ambos Marcam - Sim', 'Vitória Mandante'],
  EL:  ['Mais de 2.5 Gols', 'Vitória Mandante', 'Ambos Marcam - Sim', 'Dupla Chance 1X'],
  BSA: ['Vitória Mandante', 'Menos de 2.5 Gols', 'Dupla Chance 1X', 'Mais de 8.5 Escanteios'],
  CLI: ['Vitória Mandante', 'Menos de 2.5 Gols', 'Dupla Chance 1X', 'Mais de 2.5 Gols'],
};
const TIPOS_DEFAULT = ['Mais de 2.5 Gols', 'Vitória Mandante', 'Dupla Chance 1X', 'Ambos Marcam - Sim'];

function seededRng(seed) {
  let s = seed | 0;
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) | 0;
    return (s >>> 0) / 0xffffffff;
  };
}

export function matchToSugestao(match) {
  const rng = seededRng(match.id * 7 + 42);
  const tipos = TIPOS_POR_LIGA[match.competition?.code] || TIPOS_DEFAULT;
  const tipo = tipos[Math.floor(rng() * tipos.length)];
  const confianca = 62 + Math.floor(rng() * 22);

  const daysAhead = getDaysAheadBRT(match.utcDate);
  const hour = getHourBRT(match.utcDate);

  return {
    id: `api_${match.id}`,
    matchId: match.id,
    time1: match.homeTeam?.shortName || match.homeTeam?.name || '?',
    time2: match.awayTeam?.shortName || match.awayTeam?.name || '?',
    esporte: 'futebol',
    liga: match.competition?.name || 'Futebol',
    tipo,
    confianca,
    daysAhead: Math.max(0, daysAhead),
    hour,
    utcDate: match.utcDate,
  };
}

export async function fetchSugestoes() {
  const apiKey = await AsyncStorage.getItem(API_KEY_STORAGE);
  if (!apiKey) return { data: null, error: 'NO_KEY' };

  try {
    const now = new Date();
    const nowBRT = new Date(now.getTime() - 3 * 3600 * 1000);
    const dateFrom = `${nowBRT.getUTCFullYear()}-${String(nowBRT.getUTCMonth() + 1).padStart(2, '0')}-${String(nowBRT.getUTCDate()).padStart(2, '0')}`;
    const end = new Date(nowBRT.getTime() + 3 * 24 * 3600 * 1000);
    const dateTo = `${end.getUTCFullYear()}-${String(end.getUTCMonth() + 1).padStart(2, '0')}-${String(end.getUTCDate()).padStart(2, '0')}`;

    const res = await fetch(`${BASE}/matches?dateFrom=${dateFrom}&dateTo=${dateTo}`, {
      headers: { 'X-Auth-Token': apiKey },
    });

    if (res.status === 403) return { data: null, error: 'INVALID_KEY' };
    if (!res.ok) return { data: null, error: `API_ERROR_${res.status}` };

    const json = await res.json();
    const matches = (json.matches || []).filter(m =>
      m.status === 'SCHEDULED' || m.status === 'TIMED'
    );

    return { data: matches.map(m => matchToSugestao(m)), error: null };
  } catch (e) {
    return { data: null, error: 'NETWORK_ERROR' };
  }
}
