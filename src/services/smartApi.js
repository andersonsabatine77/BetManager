import AsyncStorage from '@react-native-async-storage/async-storage';

export const SMART_API_KEY_STORAGE = '@betmanager_smart_api_key';
const HOST = 'free-api-live-football-data.p.rapidapi.com';
const BASE = `https://${HOST}`;

async function getKey() {
  return await AsyncStorage.getItem(SMART_API_KEY_STORAGE);
}

function headers(apiKey) {
  return {
    'X-RapidAPI-Key': apiKey,
    'X-RapidAPI-Host': HOST,
  };
}

// Busca jogos ao vivo com placar e minuto
export async function fetchSmartLiveMatches() {
  const apiKey = await getKey();
  if (!apiKey) return { matches: [], hasKey: false };

  try {
    const res = await fetch(`${BASE}/football-get-all-live-matches`, {
      headers: headers(apiKey),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return { matches: data?.response || data?.matches || data || [], hasKey: true };
  } catch (e) {
    return { matches: [], hasKey: true, error: e.message };
  }
}

// Busca estatísticas de uma partida (xG, chutes, posse, escanteios, cartões)
export async function fetchMatchStats(fixtureId) {
  const apiKey = await getKey();
  if (!apiKey || !fixtureId) return null;

  try {
    const res = await fetch(
      `${BASE}/football-get-match-statistics?MatchId=${fixtureId}`,
      { headers: headers(apiKey) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    // Normaliza o formato da resposta
    const stats = data?.response || data?.statistics || data;
    return parseStats(stats);
  } catch {
    return null;
  }
}

// Normaliza estatísticas para um formato interno consistente
function parseStats(raw) {
  if (!raw || !Array.isArray(raw)) return null;

  function findStat(teamStats, name) {
    const entry = (teamStats?.statistics || teamStats || [])
      .find(s => s.type?.toLowerCase().includes(name.toLowerCase()));
    return entry?.value ?? null;
  }

  const home = raw[0];
  const away = raw[1];

  const parse = (v) => {
    if (v === null || v === undefined) return null;
    if (typeof v === 'string' && v.endsWith('%')) return parseFloat(v);
    return typeof v === 'number' ? v : parseFloat(v) || null;
  };

  return {
    home: {
      xg:          parse(findStat(home, 'expected goals') ?? findStat(home, 'xg')),
      shots:       parse(findStat(home, 'total shots') ?? findStat(home, 'shots on goal')),
      shotsOnTarget: parse(findStat(home, 'shots on goal') ?? findStat(home, 'shots on target')),
      possession:  parse(findStat(home, 'ball possession') ?? findStat(home, 'possession')),
      corners:     parse(findStat(home, 'corner kicks') ?? findStat(home, 'corners')),
      yellowCards: parse(findStat(home, 'yellow cards')),
      redCards:    parse(findStat(home, 'red cards')),
      fouls:       parse(findStat(home, 'fouls')),
    },
    away: {
      xg:          parse(findStat(away, 'expected goals') ?? findStat(away, 'xg')),
      shots:       parse(findStat(away, 'total shots') ?? findStat(away, 'shots on goal')),
      shotsOnTarget: parse(findStat(away, 'shots on goal') ?? findStat(away, 'shots on target')),
      possession:  parse(findStat(away, 'ball possession') ?? findStat(away, 'possession')),
      corners:     parse(findStat(away, 'corner kicks') ?? findStat(away, 'corners')),
      yellowCards: parse(findStat(away, 'yellow cards')),
      redCards:    parse(findStat(away, 'red cards')),
      fouls:       parse(findStat(away, 'fouls')),
    },
  };
}

// Salva chave
export async function saveSmartApiKey(key) {
  await AsyncStorage.setItem(SMART_API_KEY_STORAGE, key.trim());
}
