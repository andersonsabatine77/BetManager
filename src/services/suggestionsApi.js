import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE = 'https://api.football-data.org/v4';
export const API_KEY_STORAGE = '@betmanager_football_api_key';

// Tipos de aposta sugeridos por liga (baseado em padrões históricos da liga)
const TIPOS_POR_LIGA = {
  PL:  ['Mais de 2.5 Gols', 'Ambos Marcam - Sim', 'Mais de 3.5 Gols', 'Vitória Mandante'],
  PD:  ['Vitória Mandante', 'Menos de 2.5 Gols', 'Dupla Chance 1X', 'Ambos Marcam - Não'],
  BL1: ['Mais de 2.5 Gols', 'Mais de 3.5 Gols', 'Vitória Mandante', 'Ambos Marcam - Sim'],
  SA:  ['Menos de 2.5 Gols', 'Vitória Mandante', 'Dupla Chance 1X', 'Menos de 3.5 Cartões'],
  FL1: ['Mais de 2.5 Gols', 'Ambos Marcam - Sim', 'Vitória Mandante', 'Dupla Chance 1X'],
  CL:  ['Mais de 2.5 Gols', 'Dupla Chance 1X', 'Ambos Marcam - Sim', 'Vitória Mandante'],
  EL:  ['Mais de 2.5 Gols', 'Vitória Mandante', 'Ambos Marcam - Sim', 'Dupla Chance 1X'],
  BSA: ['Vitória Mandante', 'Menos de 2.5 Gols', 'Dupla Chance 1X', 'Mais de 8.5 Escanteios', 'Ambos Marcam - Sim'],
  CLI: ['Vitória Mandante', 'Menos de 2.5 Gols', 'Dupla Chance 1X', 'Mais de 2.5 Gols'],
  WC:  ['Vitória Mandante', 'Menos de 2.5 Gols', 'Dupla Chance 1X', 'Ambos Marcam - Sim'],
};
const TIPOS_DEFAULT = ['Mais de 2.5 Gols', 'Vitória Mandante', 'Dupla Chance 1X', 'Ambos Marcam - Sim'];

// Seeded RNG determinístico por match.id para sugestão consistente
function seededRng(seed) {
  let s = seed | 0;
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) | 0;
    return (s >>> 0) / 0xffffffff;
  };
}

function utcToBRT(utcDate) {
  const d = new Date(utcDate);
  d.setHours(d.getHours() - 3); // UTC-3
  return d;
}

function calcDaysAhead(utcDate) {
  const match = utcToBRT(utcDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const matchDay = new Date(match);
  matchDay.setHours(0, 0, 0, 0);
  return Math.round((matchDay - today) / (1000 * 60 * 60 * 24));
}

export function matchToSugestao(match, extraTypes) {
  const rng = seededRng(match.id * 7 + 42);
  const tipos = extraTypes || TIPOS_POR_LIGA[match.competition?.code] || TIPOS_DEFAULT;
  const tipo = tipos[Math.floor(rng() * tipos.length)];
  const confianca = 62 + Math.floor(rng() * 22); // 62-83%

  const brt = utcToBRT(match.utcDate);
  const daysAhead = calcDaysAhead(match.utcDate);
  const hour = brt.getHours();

  return {
    id: `api_${match.id}`,
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
    const today = new Date();
    const end = new Date();
    end.setDate(end.getDate() + 2);
    const dateFrom = today.toISOString().slice(0, 10);
    const dateTo = end.toISOString().slice(0, 10);

    const res = await fetch(`${BASE}/matches?dateFrom=${dateFrom}&dateTo=${dateTo}`, {
      headers: { 'X-Auth-Token': apiKey },
    });

    if (res.status === 403) return { data: null, error: 'INVALID_KEY' };
    if (!res.ok) return { data: null, error: `API_ERROR_${res.status}` };

    const json = await res.json();
    const matches = (json.matches || []).filter(m =>
      m.status === 'SCHEDULED' || m.status === 'TIMED'
    );

    const sugestoes = matches.map(m => matchToSugestao(m));
    return { data: sugestoes, error: null };
  } catch (e) {
    return { data: null, error: 'NETWORK_ERROR' };
  }
}
